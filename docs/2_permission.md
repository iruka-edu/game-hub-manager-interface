Ok, mình build luôn **RBAC + ABAC-hybrid cho “game workflow”** theo đúng ý:

> Dev upload → QC test → CTO/CEO review → Admin public.

Anh có thể bê nguyên khung `PERMISSIONS + ROLES + hasPermission` trước đó, rồi chỉ thay **resource = "games"** và **rule theo trạng thái**.

---

## 1. Định nghĩa resource & trạng thái game

### 1.1. Resource & action

```ts
// src/auth/permissions.ts
export const PERMISSIONS = {
  games: ["view", "create", "update", "submit", "review", "approve", "publish"],
  // ...resources khác
} as const;

export type Resource = keyof typeof PERMISSIONS;
export type Action<R extends Resource> = (typeof PERMISSIONS)[R][number];

export type Role = "dev" | "qc" | "cto" | "ceo" | "admin";

export type AppUser = {
  id: string;
  roles: Role[];
  teamIds?: string[];
};
```

### 1.2. GameDoc trong Mongo

```ts
// src/auth/roles.ts (hoặc src/models/GameDoc.ts)
export type GameWorkflowStatus =
  | "draft"          // dev đang làm
  | "uploaded"       // dev upload xong, chờ QC
  | "qc_passed"      // QC test ok
  | "qc_failed"      // QC test fail
  | "approved"       // CTO/CEO duyệt
  | "published"      // admin public
  | "archived";      // ngừng dùng

export type GameDoc = {
  _id: string;
  title: string;
  ownerId: string;         // dev chính
  teamId?: string;         // team làm game
  status: GameWorkflowStatus;
  isDeleted?: boolean;
};
```

---

## 2. Thiết kế rule theo vai trò

Ta giữ pattern:

```ts
type Rule<Data> = boolean | ((user: AppUser, data: Data) => boolean);

type RoleDef = {
  games?: Partial<Record<Action<"games">, Rule<GameDoc>>>;
};
```

### 2.1. Dev

* **create**: tạo game mới (draft).
* **update**: sửa game của mình khi còn ở `draft | uploaded | qc_failed`.
* **submit**: đổi trạng thái từ `draft` → `uploaded`.

```ts
const devRole: RoleDef = {
  games: {
    view: (u, g) =>
      g.ownerId === u.id || g.status === "published", // dev xem game mình + game đã public
    create: true,
    update: (u, g) =>
      g.ownerId === u.id &&
      ["draft", "uploaded", "qc_failed"].includes(g.status),
    submit: (u, g) =>
      g.ownerId === u.id && g.status === "draft", // bấm nút "Gửi QC"
  },
};
```

### 2.2. QC

* **view**: xem các game cần QC (tùy anh có gán theo team hay không).
* **review**: set `qc_passed` / `qc_failed` khi game đang `uploaded`.

```ts
const qcRole: RoleDef = {
  games: {
    view: (u, g) =>
      ["uploaded", "qc_passed", "qc_failed", "approved", "published"].includes(
        g.status,
      ),
    review: (u, g) => g.status === "uploaded", // QC chỉ can thiệp ở bước này
    update: false, // QC không sửa nội dung game
  },
};
```

QC thao tác thực tế có thể là 1 endpoint:
`POST /api/games/:id/qc-result { passed: boolean, note }`
→ service set `status` = `qc_passed` / `qc_failed` sau khi check `hasPermission(user, "games", "review", gameDoc)`.

### 2.3. CTO / CEO

* **approve**: chỉ khi game đã `qc_passed`.
* **view**: xem tất cả, nhất là `qc_passed` chờ duyệt.

```ts
const ctoRole: RoleDef = {
  games: {
    view: (u, g) => true, // CTO/CEO thường xem hết
    approve: (u, g) => g.status === "qc_passed",
  },
};

const ceoRole: RoleDef = {
  games: {
    view: (u, g) => true,
    approve: (u, g) => g.status === "qc_passed",
  },
};
```

Anh có thể tách thêm rule “chỉ approve game của một số subject/team” nếu cần.

### 2.4. Admin

* **publish**: chỉ khi `approved`.
* **update**: đổi `status` sang `published` hoặc `archived`, map với việc hiển thị trên App.

```ts
const adminRole: RoleDef = {
  games: {
    view: (u, g) => true,
    publish: (u, g) => g.status === "approved",
    update: (u, g) =>
      ["approved", "published"].includes(g.status), // đổi flag hiển thị, archive,...
  },
};
```

### 2.5. Gộp tất cả `ROLES`

```ts
export const ROLES: Record<Role, RoleDef> = {
  dev: devRole,
  qc: qcRole,
  cto: ctoRole,
  ceo: ceoRole,
  admin: adminRole,
};
```

---

## 3. Hàm `hasPermission` tái sử dụng

Giữ đúng khung cũ:

```ts
// src/auth/hasPermission.ts
import { ROLES } from "./roles";
import type { AppUser, Resource } from "./permissions";

export function hasPermission<R extends Resource, D>(
  user: AppUser,
  resource: R,
  action: string,
  data?: D,
) {
  for (const role of user.roles) {
    const def: any = ROLES[role]?.[resource];
    const rule = def?.[action];
    if (rule === true) return true;
    if (typeof rule === "function") {
      if (!data) continue; // action này cần doc
      if (rule(user, data)) return true;
    }
  }
  return false;
}
```

---

## 4. Áp dụng trong Astro API route (MongoDB)

Ví dụ endpoint: **Dev submit game cho QC**

```ts
// src/pages/api/games/[id]/submit.ts
import type { APIRoute } from "astro";
import { getMongoClient } from "../../../lib/mongo";
import { getUserFromRequest } from "../../../auth/session";
import { hasPermission } from "../../../auth/hasPermission";

export const POST: APIRoute = async ({ params, request }) => {
  const user = await getUserFromRequest(request);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const client = await getMongoClient();
  const db = client.db("iruka");
  const games = db.collection<GameDoc>("games");

  const game = await games.findOne({ _id: params.id });
  if (!game) return new Response("Not found", { status: 404 });

  if (!hasPermission(user, "games", "submit", game)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (game.status !== "draft") {
    return new Response("Only draft game can be submitted", { status: 400 });
  }

  await games.updateOne(
    { _id: game._id },
    { $set: { status: "uploaded", submittedAt: new Date() } },
  );

  return new Response("OK");
};
```

Tương tự:

* `/api/games/:id/qc-result` → check `"review"`.
* `/api/games/:id/approve` → check `"approve"`.
* `/api/games/:id/publish` → check `"publish"`.

---

## 5. Quy tắc UI cho team dev / QC / CTO / Admin

Frontend (Astro + React component) **dùng cùng rule** để ẩn/hiện nút, nhưng luôn nhớ:

* **Bảo mật nằm ở server** (API route), không ở UI.

Ví dụ trong React:

```tsx
function GameActions({ user, game }: { user: AppUser; game: GameDoc }) {
  return (
    <div>
      {/* Dev submit */}
      {hasPermission(user, "games", "submit", game) && game.status === "draft" && (
        <button>Gửi QC</button>
      )}

      {/* QC review */}
      {hasPermission(user, "games", "review", game) &&
        game.status === "uploaded" && (
          <>
            <button>QC đạt</button>
            <button>QC fail</button>
          </>
        )}

      {/* CTO/CEO approve */}
      {hasPermission(user, "games", "approve", game) &&
        game.status === "qc_passed" && <button>Duyệt game</button>}

      {/* Admin publish */}
      {hasPermission(user, "games", "publish", game) &&
        game.status === "approved" && <button>Publish</button>}
    </div>
  );
}
```

---

## 6. Tóm tắt logic cho anh training team

**Workflow:**

1. **Dev**

   * Tạo game → `draft`
   * Sửa & test nội bộ
   * Bấm **Gửi QC** → `uploaded`
2. **QC**

   * Vào danh sách game `uploaded`
   * Test kỹ thuật + nội dung
   * **QC đạt** → `qc_passed`
     **QC fail** → `qc_failed` (dev sửa lại, gửi lại)
3. **CTO/CEO**

   * Review các game `qc_passed`
   * Nếu ok → **Duyệt** → `approved`
4. **Admin**

   * Thấy game `approved`
   * **Publish** → `published` (xuất hiện trên app cho học sinh)
   * Khi không dùng nữa → `archived`

Mỗi bước gắn với **1 action + 1 rule** rõ ràng trong `ROLES`.

---

Nếu anh muốn bước tiếp theo, mình có thể:

* Viết luôn **schema Mongo + index** cho collection `games`
* Hoặc thiết kế **bảng quản lý trong Astro UI** (Game List + filter theo status + action buttons cho từng role).
