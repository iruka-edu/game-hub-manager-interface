Ok, mình “đổ” đúng cái flow game (dev → QC → CTO/CEO → admin) vào **hai style** như bạn gửi:

* `auth-abac.ts` → kiểu **RBAC + ABAC-hybrid** (có `dataType`)
* `auth-rbac.ts` → kiểu **RBAC string** đơn giản `"games:publish"`…

Bạn copy 2 file dưới là dùng được luôn, chỉ cần chỉnh lại cho khớp dự án.

---

## 1. `auth-abac.ts` – RBAC + ABAC-hybrid cho Game

```ts
// auth-abac.ts

// ==== Domain types ====

export type GameStatus =
  | "draft"       // dev đang làm
  | "uploaded"    // dev đã gửi QC
  | "qc_passed"   // QC ok
  | "qc_failed"   // QC fail
  | "approved"    // CTO/CEO duyệt
  | "published"   // admin public
  | "archived"    // ngừng dùng

export type Game = {
  id: string
  title: string
  ownerId: string           // dev chính
  teamId?: string           // team làm game
  status: GameStatus
  isDeleted?: boolean
}

export type Role = "dev" | "qc" | "cto" | "ceo" | "admin"

export type User = {
  id: string
  roles: Role[]
  teamIds?: string[]
  blockedBy?: string[]      // nếu sau này bạn muốn reuse logic block user
}

// ==== Permissions config ====

// 1 resource: "games"
type Permissions = {
  games: {
    dataType: Game
    action:
      | "view"
      | "create"
      | "update"
      | "submit"   // dev gửi QC
      | "review"   // QC chấm
      | "approve"  // CTO/CEO duyệt
      | "publish"  // admin public
  }
}

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean)

type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<{
      [Action in Permissions[Key]["action"]]: PermissionCheck<Key>
    }>
  }>
}

// ==== ROLES: rule theo role + trạng thái game ====

export const ROLES: RolesWithPermissions = {
  dev: {
    games: {
      // dev xem game của mình + game đã published
      view: (user, game) =>
        game.ownerId === user.id || game.status === "published",

      // tạo game mới
      create: true,

      // chỉ sửa khi còn draft / uploaded / qc_failed
      update: (user, game) =>
        game.ownerId === user.id &&
        ["draft", "uploaded", "qc_failed"].includes(game.status),

      // gửi QC: chỉ khi đang draft
      submit: (user, game) =>
        game.ownerId === user.id && game.status === "draft",
    },
  },

  qc: {
    games: {
      // QC xem các game đi qua tay mình
      view: (user, game) =>
        ["uploaded", "qc_passed", "qc_failed", "approved", "published"].includes(
          game.status,
        ),

      // QC chỉ review khi status = uploaded
      review: (user, game) => game.status === "uploaded",
    },
  },

  cto: {
    games: {
      // CTO thường xem tất cả game
      view: true,

      // CTO duyệt: chỉ khi qc_passed
      approve: (user, game) => game.status === "qc_passed",
    },
  },

  ceo: {
    games: {
      view: true,
      approve: (user, game) => game.status === "qc_passed",
    },
  },

  admin: {
    games: {
      view: true,

      // publish: chỉ khi approved
      publish: (user, game) => game.status === "approved",

      // update: cho phép đổi published ↔ archived hoặc thay flag hiển thị
      update: (user, game) =>
        ["approved", "published"].includes(game.status),
    },
  },
}

// ==== hasPermission – dùng chung cho API + UI ====

export function hasPermission<Resource extends keyof Permissions>(
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"],
) {
  return user.roles.some((role) => {
    const permission =
      (ROLES as RolesWithPermissions)[role][resource]?.[action]

    if (permission == null) return false

    if (typeof permission === "boolean") return permission

    return data != null && permission(user, data as any)
  })
}

// ==== USAGE EXAMPLE ====

const devUser: User = { id: "u1", roles: ["dev"] }

const gameDraft: Game = {
  id: "g1",
  title: "Maze Runner",
  ownerId: "u1",
  status: "draft",
}

// dev có thể gửi QC?
hasPermission(devUser, "games", "submit", gameDraft)   // true

// dev có thể publish trực tiếp?
hasPermission(devUser, "games", "publish", gameDraft)  // false
```

> File này là “não trung tâm” cho mọi endpoint kiểu:
>
> * `POST /api/games/:id/submit` → check `"submit"`
> * `POST /api/games/:id/qc-result` → check `"review"`
> * `POST /api/games/:id/approve` → check `"approve"`
> * `POST /api/games/:id/publish` → check `"publish"`

---

## 2. `auth-rbac.ts` – RBAC đơn giản bằng permission string

Nếu chỗ nào bạn chỉ cần check “có/không” mà **không cần data** (GameDoc), dùng style này cho nhẹ đầu.

```ts
// auth-rbac.ts

export type Role = keyof typeof ROLES
export type User = { id: string; roles: Role[] }

// Permission string luôn theo format "resource:action"
const ROLES = {
  admin: [
    "games:view",
    "games:create",
    "games:update",
    "games:submit",
    "games:review",
    "games:approve",
    "games:publish",
  ],
  dev: [
    "games:view",
    "games:create",
    "games:update",
    "games:submit",
  ],
  qc: [
    "games:view",
    "games:review",
  ],
  cto: [
    "games:view",
    "games:approve",
  ],
  ceo: [
    "games:view",
    "games:approve",
  ],
} as const

type Permission = (typeof ROLES)[Role][number]

export function hasPermission(user: User, permission: Permission) {
  return user.roles.some((role) =>
    (ROLES[role] as readonly Permission[]).includes(permission),
  )
}

// ==== USAGE EXAMPLE ====

const qcUser: User = { id: "qc1", roles: ["qc"] }

hasPermission(qcUser, "games:review")  // true
hasPermission(qcUser, "games:publish") // ❌ lỗi TS, QC không có quyền này
```

### Dùng thế nào cho hợp lý?

* **Check thô (menu, navigation, feature flag)**
  → dùng `auth-rbac.ts` cho nhanh:

  * “User này có thấy menu **Game QC Dashboard** không?” → `"games:review"`
  * “User này có thấy tab **Admin Publish** không?” → `"games:publish"`

* **Check chi tiết theo document (owner, status, team…)**
  → dùng `auth-abac.ts`:

  * “Có được **submit** game này (đang draft, owner khác) không?”
  * “Có được **approve** game này khi chưa `qc_passed` không?”

---

Nếu anh muốn, bước sau mình có thể:

* Viết luôn **API mẫu** dạng `Astro APIRoute` sử dụng `auth-abac.ts` (connect Mongo)
* Hoặc thêm 1 layer helper: từ `"games:publish"` map sang action ABAC (`resource="games" / action="publish"`) để hai hệ thống chơi với nhau mượt hơn.
