Mình làm luôn 2 phần cho anh:

1. **Flow tổng thể đăng nhập + phân quyền theo role**
2. **Activity diagram (dạng text/Mermaid) cho:**

   * Flow vào trang (page flow)
   * Flow thực hiện 1 nghiệp vụ (ví dụ: Dev bấm “Gửi QC”)

Anh có thể đưa thẳng cho designer (vẽ lại Figma) + dev (code guard route + API).

---

## 1. Khung tư duy: Toàn bộ “Game Console” là khu vực **protected**

Nguyên tắc:

* **Mọi trang nội bộ**: `/dashboard`, `/games`, `/games/[id]`, `/qc-inbox`, `/approval`, `/publish`
  → đều **yêu cầu đã đăng nhập**.
* **Mỗi màn có “role entry condition”** rõ ràng:

  * `/games/my` → dev, qc, cto, ceo, admin đều xem được (view:games).
  * `/qc-inbox` → chỉ role có `"games:review"` (QC, đôi khi CTO).
  * `/approval` → chỉ role có `"games:approve"` (CTO, CEO).
  * `/publish` → chỉ role có `"games:publish"` (admin).

Về kỹ thuật:

* Lớp **backend**:

  * Check login + `hasPermission(...)` trong **API route** (Astro APIRoute).
* Lớp **frontend/UI**:

  * Khi render page: nếu **chưa có user** → redirect `/login`.
  * Nếu user **không có quyền** trang đó → show 403 page (“Bạn không có quyền truy cập”).

---

## 2. Activity Diagram – Flow vào 1 trang bất kỳ

### 2.1. Diễn giải bước (dùng cho cả FE + BE)

**Luồng cơ bản: “User mở một trang protected (ví dụ: /qc-inbox)”**

1. User gõ URL `/qc-inbox` hoặc click menu “QC Inbox”.
2. **Middleware / layout server-side** đọc request:

   * Gọi `getUserFromRequest(request)` (cookie/JWT/session).
3. **Decision 1: đã đăng nhập chưa?**

   * Nếu **chưa có user** → redirect `/login?redirect=/qc-inbox`.
   * Nếu **có user** → tiếp tục.
4. Lấy `user.roles` → tính `permissions` (RBAC string) trên server:

   * Ví dụ: `canReview = hasPermission(user, "games:review")` (RBAC).
5. **Decision 2: user có quyền truy cập trang này không?**

   * Nếu **không có** (ví dụ dev vào `/qc-inbox`) → trả **403 Page**:

     * UI message: “Bạn không có quyền truy cập trang này.”
   * Nếu **có** → load data:

     * Lấy list game phù hợp role (QC → list `status = uploaded`, CTO → `qc_passed`…).
6. Render page với:

   * `user` (id, roles).
   * `permissions` (RBAC).
   * `data` (list game).
7. Frontend:

   * Dựa vào `permissions` để **ẩn/hiện** menu, nút bấm.
   * Không hiện nút “QC đánh giá” nếu không có `"games:review"` chẳng hạn.

### 2.2. Activity diagram dạng Mermaid (anh paste vào tool là có hình)

```mermaid
flowchart TD
  A[User mở /qc-inbox] --> B[Server: getUserFromRequest()]
  B --> C{Có user?}

  C -- Không --> D[Redirect tới /login?redirect=/qc-inbox]
  C -- Có --> E[Server: tính quyền RBAC từ user.roles]

  E --> F{Có permission truy cập trang?}
  F -- Không --> G[Trả 403 Forbidden Page]
  F -- Có --> H[Query DB: load list game phù hợp role]

  H --> I[Render HTML + gửi user + permissions + data]
  I --> J[Client hiển thị: bảng QC Inbox, ẩn/hiện nút theo permission]
```

---

## 3. Activity Diagram – Flow thực hiện 1 nghiệp vụ (ví dụ: Dev “Gửi QC”)

Ta chọn ví dụ **Dev bấm “Gửi QC”** trên trang chi tiết game.
Ở đây sẽ kết hợp **UI check** + **API check (ABAC)**.

### 3.1. Diễn giải bước

**1. Khi render trang chi tiết Game**

* Server đã:

  * Kiểm tra login.
  * Lấy `user`.
  * `hasPermission(user, "games", "submit", gameDoc)` (ABAC) để:

    * Quyết định có hiển thị nút **“Gửi QC”** hay không.
* Frontend render:

  * Nếu `canSubmit = true` → nút “Gửi QC” **enabled**.
  * Nếu `false` → hoặc ẩn hẳn, hoặc disabled + tooltip.

**2. User click “Gửi QC”**

UI flow:

1. User click nút.
2. Frontend show dialog checklist:

   * “Bạn đã test: âm thanh / responsive / logic chưa?”
3. User confirm → FE gửi request:

   * `POST /api/games/:id/submit`.

**3. API `/api/games/:id/submit`**

1. Server nhận request.
2. Gọi `getUserFromRequest(request)` → lấy `user`.
3. Nếu **không có user** → trả `401 Unauthorized`.
4. Query MongoDB → lấy `gameDoc`.
5. Gọi **ABAC**:

   * `hasPermission(user, "games", "submit", gameDoc)`.
6. **Decision: có quyền không?**

   * Nếu **false** → trả `403 Forbidden` (tránh hack qua Postman).
7. Nếu có quyền:

   * Kiểm tra `gameDoc.status === "draft"` chưa?

     * Nếu không phải draft → `400 Bad Request` (“Chỉ game draft mới được gửi QC”).
8. Nếu hợp lệ:

   * Update DB: `status = "uploaded"`, `submittedAt = now`.
   * Ghi log vào `game_logs`.
9. Trả `200 OK + payload game mới`.
10. Frontend nhận response:

    * Cập nhật trạng thái game trên UI → chip status `Uploaded`.
    * Hiện toast: “Đã gửi QC thành công.”

### 3.2. Activity diagram cho nghiệp vụ “Gửi QC”

```mermaid
flowchart TD
  A[User ở trang Game Detail] --> B{UI: canSubmit? (ABAC check từ server)}
  B -- false --> C[Ẩn/disable nút 'Gửi QC']
  B -- true --> D[User click 'Gửi QC']

  D --> E[UI hiển thị dialog checklist]
  E --> F[User confirm]
  F --> G[FE gửi POST /api/games/:id/submit]

  G --> H[API: getUserFromRequest()]
  H --> I{Có user?}
  I -- Không --> J[Trả 401 Unauthorized]

  I -- Có --> K[DB: findOne game by id]
  K --> L{Tồn tại game?}
  L -- Không --> M[Trả 404 Not Found]

  L -- Có --> N[hasPermission(user,'games','submit', gameDoc)]

  N --> O{Có quyền?}
  O -- Không --> P[Trả 403 Forbidden]

  O -- Có --> Q{game.status === 'draft'?}
  Q -- Không --> R[Trả 400 'Chỉ draft mới được gửi QC']

  Q -- Có --> S[Update DB: status='uploaded', submittedAt=now]
  S --> T[Insert log vào game_logs]
  T --> U[Trả 200 + gameDoc mới]

  U --> V[FE cập nhật UI: status=Uploaded, show toast]
```

---

## 4. Cách “dịch” flow này sang UI/UX cụ thể

Để designer & dev làm dễ, anh có thể ghi thành **spec ngắn**:

### 4.1. Quy tắc trang (page-level)

* **Tất cả trang trong Game Console**:

  * Nếu chưa đăng nhập → luôn redirect `/login`.
  * Nếu đã đăng nhập nhưng thiếu quyền → hiển thị 403.

* Gợi ý mapping:

  * `/games/my` → yêu cầu `"games:view"` (RBAC).
  * `/qc-inbox` → yêu cầu `"games:review"`.
  * `/approval` → yêu cầu `"games:approve"`.
  * `/publish` → yêu cầu `"games:publish"`.

### 4.2. Quy tắc component hành động (button-level)

* Button “Gửi QC”:

  * Chỉ render khi `hasPermission(user, "games", "submit", game)` (ABAC).
* Button “QC đạt / QC cần sửa”:

  * Chỉ render khi `hasPermission(user, "games", "review", game)`.
* Button “Approve”:

  * Chỉ render khi `hasPermission(user, "games", "approve", game)`.
* Button “Publish”:

  * Chỉ render khi `hasPermission(user, "games", "publish", game)`.

---

## 5. Gợi ý cấu trúc code để dev FE dễ follow

### 5.1. Hook `useAuth` phía client

```ts
// pseudo-code
function useAuth() {
  // user + permission string từ server inject qua Astro
  const user = window.__USER__
  const rolePermissions = window.__PERMISSIONS__ as string[]

  const can = (permission: string) =>
    rolePermissions.includes(permission)

  // nếu muốn check ABAC với game trên client
  const canOn = <R extends keyof Permissions>(
    resource: R,
    action: Permissions[R]['action'],
    data: Permissions[R]['dataType']
  ) => hasPermission(user, resource, action, data)

  return { user, can, canOn }
}
```

### 5.2. Trên trang chi tiết game

```tsx
const { user, canOn } = useAuth()

const canSubmit = canOn("games", "submit", game)

return (
  <>
    {/* ...thông tin game */}
    {canSubmit && (
      <button onClick={handleSubmitToQC}>Gửi QC</button>
    )}
  </>
)
```

---

Có chứ, mình làm luôn bản **spec rõ ràng, từng page**, để anh đưa cho designer + dev FE/BE áp dụng được ngay.

Em sẽ chia 3 phần:

1. Khung chung: Auth + layout bảo vệ
2. Spec chi tiết từng page (route, quyền, UI, API)
3. Gợi ý code guard (để dev biết gắn vào đâu)

---

## 1. Khung chung: Auth + Protected Layout

**Nguyên tắc:**

* Tất cả page “Game Console” đều **bảo vệ bằng đăng nhập**.
* Mỗi page có **role/permission tối thiểu** để vào được.
* Quyền chi tiết thao tác trên game dùng **ABAC `hasPermission(user,"games", action, game)`**.

### 1.1. Layout protected (ví dụ `/src/layouts/ProtectedLayout.astro`)

**Luồng:**

1. Mọi route nội bộ đều dùng `ProtectedLayout`.
2. `ProtectedLayout` luôn:

   * Lấy `user` từ session (`getUserFromRequest`).
   * Nếu không có `user` → redirect `/login?redirect=<current_url>`.
   * Nếu có `user` → render children + inject `user`, `rolePermissions` xuống client.

---

## 2. Spec chi tiết từng page

### 2.1. `/login` – Trang đăng nhập

**Mục tiêu:**

* Cho phép user đăng nhập để vào console.
* Sau đăng nhập, redirect về trang họ định vào trước đó.

**Flow:**

* Nếu đã login rồi:

  * Nếu có query `redirect` → chuyển sang URL đó.
  * Nếu không → vào `/dashboard` hoặc `/games/my`.

**UI chính:**

* Form: Email / Password (hoặc SSO).
* Nút “Đăng nhập”.
* Thông báo lỗi nếu sai.

**Backend:**

* `POST /api/auth/login`:

  * Check credential.
  * Tạo session/JWT.
  * Trả về `user` + `roles`.

---

### 2.2. `/dashboard` – Tổng quan (optional nhưng nên có)

**Quyền tối thiểu:**

* Bất kỳ user nội bộ đã đăng nhập (role nào cũng được).

**Behavior:**

* Nếu chưa login → redirect `/login?redirect=/dashboard`.
* Nếu login → show card tổng quan:

  * Số game Draft của tôi (Dev).
  * Số game chờ QC (nếu có `"games:review"`).
  * Số game chờ duyệt (nếu có `"games:approve"`).
  * Số game chờ publish (nếu có `"games:publish"`).

**UI:**

* Card “Việc của tôi hôm nay”:

  * Dev: `X game cần hoàn thiện`.
  * QC: `Y game chờ QC`.
  * CTO/CEO: `Z game chờ duyệt`.
  * Admin: `N game chờ publish`.

---

### 2.3. `/games/my` – Game của tôi (Dev & mọi role)

**Quyền vào trang:**

* Cần permission `games:view` (RBAC string).
* Tất cả role (dev, qc, cto, ceo, admin) đều có thể có `games:view`.

**Behavior:**

* Chưa login → redirect `/login?redirect=/games/my`.
* Đã login nhưng **không có `games:view`** → 403.

**UI chính:**

* **Filter mặc định**: “Game do tôi phụ trách” (ownerId = user.id).
* Bảng:

  * Cột: Tên game – Môn – Độ tuổi – Trạng thái – Cập nhật gần nhất – Action.
* Nút global:

  * Dev có `hasPermission(user,"games","create")` → hiển thị nút **“Tạo game mới”**.

**Action trên mỗi dòng (dựa theo ABAC):**

* Nút **“Sửa”**:

  * Chỉ hiện nếu `hasPermission(user, "games", "update", game) === true`.
* Nút **“Gửi QC”**:

  * Chỉ hiện nếu `hasPermission(user, "games", "submit", game) === true`.

**API backend:**

* `GET /api/games/my`:

  * Check login.
  * Filter: `ownerId = user.id`, hoặc nếu role khác → mở rộng.
  * Trả list game.

---

### 2.4. `/games/[id]` – Trang chi tiết Game

**Quyền vào trang:**

* Cần `games:view` (RBAC) **và** `hasPermission(user, "games", "view", gameDoc)` (ABAC).

  * Nếu RBAC có nhưng ABAC false (VD: user bị block với game này) → 403.

**Behavior:**

* Chưa login → redirect `/login?redirect=/games/<id>`.
* Không có view permission → 403.

**UI layout:**

1. **Header:**

   * Tên game.
   * Chip trạng thái: Draft / Uploaded / QC passed / Approved / Published / Archived.
   * “Timeline” ngắn: Dev → QC → CTO/CEO → Admin (bước đang active được highlight).
2. **Main:**

   * Cột trái:

     * Thông tin học thuật: Môn, lớp, unit SGK, kỹ năng.
     * Metadata: Owner, Team, Version, Link thiết kế.
   * Cột giữa:

     * Preview game (iframe).
   * Cột phải:

     * Checklist QC (nếu user có `"games:review"`).
     * Comment thread (dev, QC, CTO…).
     * Lịch sử thao tác (log).

**Action theo role (ABAC)**:

* Nếu `hasPermission(user, "games", "update", game)`:

  * Hiện nút **“Chỉnh sửa thông tin”**.
* Nếu `hasPermission(user, "games", "submit", game)`:

  * Hiện nút **“Gửi QC”** → flow submit như mình đã vẽ.
* Nếu `hasPermission(user, "games", "review", game)`:

  * Hiện nút **“QC đạt”**, **“QC cần sửa”**, kèm form note.
* Nếu `hasPermission(user, "games", "approve", game)`:

  * Hiện nút **“Duyệt xuất bản”**.
* Nếu `hasPermission(user, "games", "publish", game)`:

  * Hiện nút **“Publish”** và **“Ngừng hiển thị (Archive)”**.

**API backend liên quan:**

* `GET /api/games/:id` – load detail:

  * Check login → lấy game → check `hasPermission(..., "view", game)` → trả data.
* `POST /api/games/:id/submit`
* `POST /api/games/:id/qc-result`
* `POST /api/games/:id/approve`
* `POST /api/games/:id/publish`

  * Tất cả đều xài `hasPermission(user, "games", action, game)` trước khi update.

---

### 2.5. `/qc-inbox` – Hàng đợi QC

**Quyền vào trang:**

* Cần **RBAC** permission `"games:review"`.

**Behavior:**

* Chưa login → redirect `/login?redirect=/qc-inbox`.
* Login nhưng không có `"games:review"` → 403.

**UI:**

* Filter mặc định: `status = "uploaded"`.
* Bảng:

  * Tên game – Môn – Lớp – Dev owner – `submittedAt` – Số lần QC fail trước đó.
* Click 1 dòng → sang `/games/[id]` (tab QC mở sẵn).

**API:**

* `GET /api/games/qc-inbox`:

  * Check login + `"games:review"`.
  * Query: `status = "uploaded"` (có thể thêm filter theo team QC).

---

### 2.6. `/approval` – Duyệt bởi CTO/CEO

**Quyền vào trang:**

* Cần `"games:approve"` (RBAC).

**Behavior:**

* Chưa login → redirect `/login?redirect=/approval`.
* Không có `"games:approve"` → 403.

**UI:**

* Summary card trên cùng: `QC passed`, `Approved`, `Published` theo tháng.
* Bảng:

  * Filter mặc định: `status = "qc_passed"`.
  * Cột: Tên game – Subject – Lớp – QC phụ trách – Ngày QC passed – Số lần sửa.

**Action:**

* Row → link sang `/games/[id]`.
* Ở trang detail, nếu `hasPermission(user,"games","approve", game)`:

  * Nút **“Duyệt xuất bản”** (Approve).
  * Nút **“Yêu cầu chỉnh sửa thêm”** (Fail – trả về dev/QC).

**API:**

* `GET /api/games/approval-list` (status = `qc_passed`).

---

### 2.7. `/publish` – Bảng điều khiển xuất bản (Admin)

**Quyền vào trang:**

* Cần `"games:publish"` (RBAC).

**Behavior:**

* Chưa login → redirect `/login?redirect=/publish`.
* Không có `"games:publish"` → 403.

**UI:**

* Tabs/Filter:

  * “Chờ publish” (status = `approved`).
  * “Đang publish” (status = `published`).
  * “Đã archive”.
* Bảng:

  * Tên game – Subject – Lớp – Ngày approve – Ngày publish – Người publish – Cờ hiển thị (App nào).

**Action:**

* Row click → `/games/[id]`.
* Nếu `hasPermission(user,"games","publish", game)` + game.status = approved:

  * Nút **“Publish”** (dialog confirm app, audience).
* Nếu game đang published:

  * Nút **“Ngừng hiển thị (Archive)”** (cũng check ABAC `update/publish`).

**API:**

* `GET /api/games/publish-list`.
* `POST /api/games/:id/publish`.
* `POST /api/games/:id/archive`.

---

## 3. Gợi ý code guard (pseudo-TS cho Astro)

### 3.1. Guard ở level page (server)

Ví dụ file `/src/pages/qc-inbox.astro`:

```ts
---
// frontmatter Astro
import ProtectedLayout from "../layouts/ProtectedLayout.astro"
import { getUserFromRequest } from "../auth/session"
import { hasPermission as hasRBAC } from "../auth-rbac"
import type { APIRoute } from "astro"

export const prerender = false

export async function getStaticPaths() {
  return []
}

const { request } = Astro
const user = await getUserFromRequest(request)

if (!user) {
  return Astro.redirect(`/login?redirect=${encodeURIComponent(Astro.url.pathname)}`)
}

if (!hasRBAC(user, "games:review")) {
  return new Response("Forbidden", { status: 403 })
}

// nếu pass → query dữ liệu inbox
const games = await fetchQcInboxGames(user)

---

<ProtectedLayout {user}>
  <!-- Render bảng QC inbox với data {games} -->
</ProtectedLayout>
```

(Dev FE có thể điều chỉnh cho đúng với cách Astro app của anh đang tổ chức.)

---

Nếu anh muốn, bước tiếp em có thể:

* Viết dạng **tài liệu chuẩn** (heading, numbering 1.0 / 1.1 / 1.2…) để anh copy dán sang Google Docs làm “Spec UI/UX + Flow Auth & Permission cho Game Console”.

