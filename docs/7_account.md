Dựa trên yêu cầu của bạn về việc nâng cấp hệ thống quản lý người dùng (User Management System) từ tĩnh sang động, phân quyền chi tiết cho Admin và CTO/CEO, tôi đã phân tích và thiết kế lại luồng xử lý như sau.

Đây là bản **Technical Specification & Implementation Plan** (Đặc tả kỹ thuật và Kế hoạch triển khai) chi tiết.

---

### 1. Phân tích Thiết kế (System Analysis)

#### A. Database Schema (MongoDB)

Chúng ta cần chuẩn hóa collection `users`. Các tài khoản cũ (đang hardcode hoặc lưu file) sẽ được migrate (chuyển đổi) vào database này để quản lý tập trung.

**Collection:** `users`

```typescript
interface User {
  _id: ObjectId;
  email: string;        // Unique, index
  passwordHash: string; // Mật khẩu đã mã hóa (bcrypt), KHÔNG lưu plain text
  name: string;
  role: 'admin' | 'cto' | 'dev' | 'qc';
  
  isActive: boolean;    // true: hoạt động, false: bị vô hiệu hóa (disabled)
  isDeleted: boolean;   // Soft delete (nếu muốn lưu lịch sử) hoặc xóa hẳn tùy bạn. Ở đây ta dùng xóa hẳn cho gọn theo yêu cầu.
  
  createdAt: Date;
  createdBy: ObjectId;  // Ai tạo user này (Admin/CTO)
  updatedAt: Date;
}

```

#### B. Ma trận Phân quyền (Permission Matrix)

Dựa trên yêu cầu: "Admin full quyền", "CTO chỉ tạo/xóa", "Dev/QC là đối tượng được quản lý".

| Hành động (Action) | API Endpoint | Admin | CTO/CEO | Dev / QC |
| --- | --- | --- | --- | --- |
| **View List** | `GET /api/users` | ✅ | ✅ | ❌ |
| **Create User** | `POST /api/users` | ✅ | ✅ | ❌ |
| **Delete User** | `DELETE /api/users/:id` | ✅ | ✅ | ❌ |
| **Update Info** | `PUT /api/users/:id` | ✅ | ✅ | ❌ (Chỉ sửa profile mình) |
| **Disable/Enable** | `PATCH /api/users/:id/status` | ✅ | ❌ (Cấm) | ❌ |
| **Reset Password** | `PUT /api/users/:id/password` | ✅ | ✅ | ❌ |

#### C. Quy trình Authentication mới

1. **Login:** Nhận email/pass -> Tìm trong DB -> So sánh hash -> Kiểm tra `isActive`.
2. **Legacy Support:** Để giữ tài khoản cũ, ta sẽ chạy một script **Seed Data** để nạp các tài khoản cũ vào DB ngay lần đầu deploy code mới.

---

### 2. Kế hoạch triển khai chi tiết (Actionable Tasks)

Tôi chia làm 3 bước lớn: **Database & Model**, **API Logic**, và **Frontend UI**.

#### Giai đoạn 1: Backend Foundation (Cốt lõi)

**Task 1.1: Cài đặt thư viện mã hóa**

* Chạy lệnh: `npm install bcryptjs` (và `@types/bcryptjs` nếu dùng TS).
* Tại sao: Tuyệt đối không lưu mật khẩu thô trong DB.

**Task 1.2: Cập nhật Model & Script Seed Data**

* Tạo file `src/lib/models/user.ts` định nghĩa Schema như mục 1A.
* Tạo script `scripts/seed-users.ts`:
* List các tài khoản cũ (Dev, QC cũ).
* Dùng `bcrypt.hash()` để tạo password hash.
* Insert vào MongoDB nếu email chưa tồn tại.
* *Kết quả:* Hệ thống chuyển sang dùng DB hoàn toàn, tài khoản cũ vẫn đăng nhập được.



**Task 1.3: Update Middleware Authentication**

* Sửa logic đăng nhập (`src/pages/api/auth/login.ts`):
* Thay vì check hardcode, query MongoDB: `db.users.findOne({ email })`.
* Check pass: `bcrypt.compare(password, user.passwordHash)`.
* **Quan trọng:** Thêm check `if (!user.isActive) return Error('Tài khoản bị vô hiệu hóa')`.



---

#### Giai đoạn 2: API Management (Logic nghiệp vụ)

**Task 2.1: API Get Users (`GET /api/users`)**

* **Logic:**
* Check `locals.user.role` có phải `admin` hoặc `cto` không? Không -> 403.
* Query `db.users.find({})`. Trả về list (loại bỏ field `passwordHash`).



**Task 2.2: API Create User (`POST /api/users`)**

* **Input:** name, email, password, role.
* **Logic:**
* Check quyền (Admin/CTO).
* Validate email trùng.
* Hash password.
* Insert DB với `isActive: true`.



**Task 2.3: API Update & Delete (Xử lý phân quyền kỹ)**

* **Update Info (`PUT /api/users/[id]`):** Admin/CTO sửa tên, email.
* **Delete (`DELETE /api/users/[id]`):** Admin/CTO xóa user.
* **Disable (`PATCH /api/users/[id]/status`):**
* Input: `isActive: boolean`.
* **Logic chặn:**
```typescript
if (currentUser.role === 'cto') {
   return new Response('CTO không có quyền Disable tài khoản', { status: 403 });
}

```





---

#### Giai đoạn 3: Frontend UI (Giao diện Quản lý)

Bạn cần tạo một trang mới: `/console/users`.

**Task 3.1: User Table Component**

* Cột: Tên, Email, Role (Badge màu), Trạng thái (Active/Disabled).
* Hành động: Nút Edit (Bút chì), Nút Delete (Thùng rác).
* **Logic hiển thị nút:**
* Nếu đang login là `CTO`: Ẩn nút Disable/Enable (Toggle switch). Vẫn hiện nút Delete.
* Nếu là `Admin`: Hiện tất cả.



**Task 3.2: Modal "Tạo/Sửa Tài khoản"**

* Form gồm: Tên, Email, Mật khẩu (bắt buộc khi tạo, optional khi sửa), Role (Select box).
* Role Select box: Admin có thể chọn tạo Dev/QC/CTO. CTO chỉ nên được tạo Dev/QC (tùy rule của bạn, nhưng thường CTO không tạo Admin).

---

### 3. File Code Mẫu (Để copy-paste triển khai nhanh)

Dưới đây là logic cốt lõi cho **Task 2.3 (Disable/Delete)** để bạn hình dung cách chặn quyền CTO.

**File:** `src/pages/api/users/[id]/status.ts` (API Disable)

```typescript
import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { ObjectId } from 'mongodb';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const currentUser = locals.user;
  
  // 1. Check Login
  if (!currentUser) return new Response('Unauthorized', { status: 401 });

  // 2. Check Role: Chỉ Admin được quyền Disable
  // CTO/CEO bị chặn ở đây theo yêu cầu của bạn
  if (currentUser.role !== 'admin') {
    return new Response('Quyền hạn không đủ. Chỉ Admin mới được Disable/Enable.', { status: 403 });
  }

  const { id } = params;
  const { isActive } = await request.json(); // { isActive: false }

  const db = await getDb();
  await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: { isActive, updatedAt: new Date() } }
  );

  return new Response(JSON.stringify({ success: true }));
};

```

**File:** `src/pages/api/users/[id].ts` (API Delete & Update)

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  const currentUser = locals.user;
  
  // Admin và CTO đều được xóa
  if (!['admin', 'cto'].includes(currentUser.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  const { id } = params;
  const db = await getDb();
  
  // Tùy chọn: Chặn xóa chính mình
  if (currentUser.id === id) return new Response('Không thể tự xóa mình', { status: 400 });

  await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  
  return new Response(JSON.stringify({ success: true }));
};

```

### 4. Thứ tự thực hiện ngay bây giờ

1. **Backend:** Cài `bcryptjs`. Viết script seed data để đẩy user cũ vào DB.
2. **Auth:** Sửa lại logic login để đọc từ DB thay vì file config. (Lúc này hệ thống vẫn chạy bình thường với user cũ).
3. **API:** Viết các API CRUD User như mô tả trên.
4. **UI:** Dựng trang `/console/users` cho Admin/CTO vào quản lý.

Bạn muốn tôi viết chi tiết Script Seed Data hay code phần UI Dashboard trước?