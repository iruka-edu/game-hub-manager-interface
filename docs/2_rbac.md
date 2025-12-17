Đây là bản kế hoạch triển khai chi tiết **"Step-by-Step"** dành cho tech stack: **Astro (SSR mode) + MongoDB**, tập trung vào việc hiện thực hóa RBAC từ khâu Login đến Dashboard và Workflows.

Tôi chia làm **5 Giai đoạn**, mỗi bước đều có định nghĩa **Test Output** để bạn kiểm tra tiến độ.

---

### Giai đoạn 1: Thiết lập Database & Models (Nền móng)

Do chuyển từ file JSON sang MongoDB, bạn cần định nghĩa Schema trước.

**1.1. Setup MongoDB Connection trong Astro**
* **Todo:** Tạo file `src/lib/mongodb.ts`.
* **Logic:** Dùng `mongoose` (hoặc `mongodb` driver native) kết nối với `process.env.IRUKA_MONGODB_URI`. Đảm bảo cache connection để không bị spam connect khi hot-reload (đặc thù của Serverless/Astro).
* **Test Output:** Chạy thử `npm run dev`, console log ra dòng: `[MongoDB] Connected successfully`.

**1.2. Định nghĩa User Schema**
* **Todo:** Tạo `src/models/User.ts`.
* **Fields:**
    * `email` (String, unique, required)
    * `name` (String)
    * `role` (Enum: `DEVELOPER`, `REVIEWER`, `ADMIN`) - Default: `DEVELOPER`.
    * `avatar` (String)
* **Test Output:** Viết 1 script nhỏ (hoặc dùng API test) insert được 1 user vào DB thông qua code.

**1.3. Định nghĩa Game Schema (Thay thế `registry.json`)**
* **Todo:** Tạo `src/models/Game.ts`.
* **Fields:**
    * `gameId` (String, unique - VD: `com.iruka.math`)
    * `ownerId` (ObjectId ref User)
    * `versions`: Array of Objects:
        * `version` (String - 1.0.0)
        * `status` (Enum: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ACTIVE`)
        * `entryUrl`, `assets` (như cũ)
        * `audit`: `{ uploadedBy, reviewedBy, approvedAt, rejectReason }`
* **Test Output:** Insert được 1 game mẫu với status `DRAFT` vào DB.

**1.4. Seeding Data (Tạo user mẫu để test)**
* **Todo:** Tạo file script `scripts/seed-users.ts` để tạo 3 user cố định:
    1.  `dev@iruka.com` (Role: **DEVELOPER**)
    2.  `qa@iruka.com` (Role: **REVIEWER**)
    3.  `admin@iruka.com` (Role: **ADMIN**)
* **Test Output:** Mở MongoDB Compass/Atlas, thấy collection `users` có 3 dòng dữ liệu trên.

---

### Giai đoạn 2: Authentication (Cánh cổng)

Giả sử bạn dùng Google OAuth (hoặc Mock login đơn giản cho dev).

**2.1. Implement Login API**
* **Todo:** Tạo endpoint `src/pages/api/auth/login.ts`.
* **Logic:**
    * Nhận email từ request (hoặc OAuth callback).
    * Tìm user trong DB theo email.
    * Tạo Session/JWT chứa payload: `{ userId, role, email }`.
    * Set Cookie `iruka_session` vào response header.
* **Test Output:** Dùng Postman POST email `dev@iruka.com`, nhận về Header `Set-Cookie`.

**2.2. Implement Middleware Check (Session Guard)**
* **Todo:** Tạo `src/middleware.ts` (Astro Middleware).
* **Logic:**
    * Intercept mọi request vào `/dashboard/*` và `/api/games/*`.
    * Decode Cookie `iruka_session`.
    * Nếu không có hoặc hết hạn -> Redirect về `/login`.
    * Nếu hợp lệ -> Gán `user` vào `locals` (Astro locals) để các page sau dùng được.
* **Test Output:** Truy cập `/dashboard` khi chưa login -> Bị đá về Login. Login xong -> Vào được.

**2.3. Tạo API `/api/auth/me`**
* **Todo:** Trả về thông tin user hiện tại từ `locals`.
* **Test Output:** Truy cập `/api/auth/me` trả về JSON: `{"role": "DEVELOPER", "email": "dev@iruka.com"}`.

---

### Giai đoạn 3: Dashboard Logic (Phân luồng View)

**3.1. Backend: API Get Games theo Role**
* **Todo:** Sửa `src/pages/api/games/list.ts`.
* **Logic:**
    * Lấy `user` từ `locals`.
    * Nếu Role == **DEVELOPER**: Query MongoDB `Game.find({ ownerId: user._id })` (Chỉ lấy game mình sở hữu).
    * Nếu Role == **REVIEWER**: Query `Game.find({ "versions.status": "PENDING_REVIEW" })` (Lấy game chờ duyệt).
    * Nếu Role == **ADMIN**: Query `Game.find({})` (Lấy tất cả).
* **Test Output:**
    * Login `dev@iruka.com` -> Gọi API thấy danh sách rỗng (hoặc game của dev đó).
    * Login `admin@iruka.com` -> Thấy toàn bộ game.

**3.2. Frontend: Dashboard UI Update**
* **Todo:** Update file `src/pages/dashboard/index.astro`.
* **Logic:**
    * Gọi API `/api/games/list`.
    * Render giao diện dựa theo `user.role`:
        * **Dev:** Hiện nút to "Upload New Game".
        * **QA:** Hiện tab "Review Queue" (Danh sách chờ duyệt).
        * **Admin:** Hiện tất cả tab + Stats hệ thống.
* **Test Output:** Login bằng 3 tài khoản khác nhau, chụp màn hình thấy 3 giao diện dashboard khác nhau.

---

### Giai đoạn 4: Upload & Request Review (Dành cho Developer)

**4.1. Validate Upload Permissions**
* **Todo:** Trong `src/pages/api/upload.ts`.
* **Logic:**
    * Check `locals.user.role`. Nếu là `REVIEWER` -> Trả về 403 Forbidden.
    * Khi save vào DB, set `versions[0].status = 'DRAFT'` và `uploadedBy = user._id`.
* **Test Output:** Login bằng account QA, cố tình dùng Postman POST file lên API upload -> Nhận lỗi 403.

**4.2. Tính năng "Submit for Review"**
* **Todo:** Tạo API `POST /api/games/submit`.
* **Body:** `{ gameId, version }`.
* **Logic:**
    * Tìm game trong DB.
    * Check `ownerId` có trùng với user đang login không?
    * Update status từ `DRAFT` -> `PENDING_REVIEW`.
* **Test Output:**
    * Dev bấm nút "Submit".
    * Check DB thấy status đổi thành `PENDING_REVIEW`.
    * Dev không còn sửa được file (nút Edit bị disable trên UI).

---

### Giai đoạn 5: Review & Publish (QA & Admin)

**5.1. Review Queue & Action**
* **Todo:** Tạo API `POST /api/games/review`.
* **Body:** `{ gameId, version, action: 'APPROVE' | 'REJECT', reason: string }`.
* **Logic:**
    * Check role: Phải là `REVIEWER` hoặc `ADMIN`.
    * Nếu `APPROVE`: Update status -> `APPROVED`.
    * Nếu `REJECT`: Update status -> `REJECTED`, lưu `reason` vào DB.
* **Test Output:**
    * Login QA, vào tab Review, bấm "Approve".
    * Login Dev, thấy game đổi trạng thái sang màu Xanh (Approved) hoặc Đỏ (Rejected kèm lý do).

**5.2. Publish Game (Set Active)**
* **Todo:** Update API `POST /api/games/set-active`.
* **Logic:**
    * **CRITICAL:** Check role `ADMIN`. (Chỉ Admin mới được đẩy ra production).
    * Check version đó có status là `APPROVED` không? (Không cho active bản Draft).
    * Set `activeVersion` = version được chọn.
* **Test Output:**
    * Dev cố tình gọi API set active -> Lỗi 403.
    * Admin set active bản Draft -> Lỗi "Version must be approved first".
    * Admin set active bản Approved -> Thành công.

---

### Tổng kết Checklist cho Developer (Bạn)

1.  ✅ **DB:** Chạy được MongoDB local/cloud, kết nối được từ Astro.
2.  ✅ **Seed:** Chạy script tạo xong 3 user (Dev, QA, Admin).
3.  ✅ **Auth:** Login được, có session/cookie.
4.  ✅ **View:** Dashboard hiển thị đúng data theo từng user.
5.  ✅ **Flow:**
    * Dev: Upload -> Draft -> Submit.
    * QA: Thấy Pending -> Approve/Reject.
    * Admin: Thấy Approved -> Set Active.

Bạn hãy bắt đầu từ **Giai đoạn 1 (DB & Schema)** trước nhé. Bạn có cần tôi viết chi tiết file `src/models/Game.ts` bằng Mongoose Schema không?