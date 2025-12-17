Đây là bản phân tích chi tiết và hướng dẫn triển khai hệ thống **Audit Logging** cho dự án Game Hub Manager của bạn. Hệ thống này sẽ tận dụng hạ tầng MongoDB và xác thực người dùng (Middleware/Locals) bạn đã có.

---

## 1. Phân tích Thiết kế (Architecture Design)

### Mục tiêu

Ghi lại toàn bộ các hành động làm thay đổi trạng thái hệ thống (Write Operations) để trả lời 4 câu hỏi:

1. **Who:** Ai thực hiện? (User ID, Email, Role).
2. **When:** Khi nào? (Timestamp).
3. **What:** Hành động gì? (Action Type).
4. **Which:** Đối tượng nào bị tác động? (Game ID, Version, Resource).
5. **How:** Chi tiết thay đổi (Diff: Old Value -> New Value).

### Cấu trúc dữ liệu (MongoDB Schema)

Tạo một collection mới tên là `audit_logs`.

```typescript
// src/lib/models/audit-log.ts (hoặc định nghĩa type nếu dùng native driver)

export type ActionType = 
  | 'GAME_UPLOAD' 
  | 'GAME_UPDATE_METADATA' 
  | 'GAME_DELETE_VERSION' 
  | 'GAME_DELETE_FULL'
  | 'GAME_STATUS_CHANGE' // Quan trọng cho workflow QC/Approve
  | 'USER_LOGIN'
  | 'USER_LOGOUT';

export interface AuditLogEntry {
  _id?: string;
  actor: {
    userId: string;
    email: string;
    role: string;
    ip?: string;       // Lấy từ request headers
    userAgent?: string; // Để biết họ dùng trình duyệt gì
  };
  action: ActionType;
  target: {
    entity: 'GAME' | 'USER' | 'SYSTEM';
    id: string;        // Ví dụ: com.iruka.bubble-shooter
    subId?: string;    // Ví dụ: version 1.0.0
  };
  changes?: {          // Optional: Lưu sự thay đổi giá trị
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: any;      // Các thông tin phụ (ví dụ: lý do reject, file size upload)
  createdAt: Date;
}

```

---

## 2. Triển khai Core Service (`src/lib/audit.ts`)

Bạn cần một hàm centralized để gọi từ bất kỳ đâu (API, Server Actions). Hàm này nên xử lý bất đồng bộ để không làm chậm response trả về cho user.

```typescript
// src/lib/audit.ts
import { getDb } from './db'; // Giả định bạn có file kết nối Mongo
import type { AuditLogEntry, ActionType } from './models/audit-log';

interface LogParams {
  actor: {
    user: App.Locals['user']; // Tận dụng type User từ env.d.ts
    ip?: string;
    userAgent?: string;
  };
  action: ActionType;
  target: {
    entity: 'GAME' | 'USER' | 'SYSTEM';
    id: string;
    subId?: string;
  };
  changes?: AuditLogEntry['changes'];
  metadata?: any;
}

export const AuditLogger = {
  /**
   * Ghi log hành động. 
   * Lưu ý: Hàm này async nhưng chúng ta có thể không cần await nó ở controller 
   * nếu muốn response nhanh (fire-and-forget), tùy độ quan trọng.
   */
  async log(params: LogParams) {
    try {
      const db = await getDb();
      const entry: AuditLogEntry = {
        actor: {
          userId: params.actor.user.id,
          email: params.actor.user.email,
          role: params.actor.user.role,
          ip: params.actor.ip || 'unknown',
          userAgent: params.actor.userAgent,
        },
        action: params.action,
        target: params.target,
        changes: params.changes,
        metadata: params.metadata,
        createdAt: new Date(),
      };

      await db.collection('audit_logs').insertOne(entry);
    } catch (error) {
      // Không bao giờ để lỗi log làm sập app, chỉ console error
      console.error('FAILED TO WRITE AUDIT LOG:', error);
    }
  },

  /**
   * Helper để lấy danh sách log (cho trang Admin)
   */
  async getLogs(filter: any = {}, limit = 50, skip = 0) {
    const db = await getDb();
    return db.collection('audit_logs')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }
};

```

---

## 3. Tích hợp vào các điểm nóng (Integration Points)

Bạn cần "cấy" hàm `AuditLogger.log` vào các file xử lý logic nghiệp vụ.

### 3.1. Khi Upload Game (`src/pages/api/upload.ts` & `upload-zip.ts`)

Trong file xử lý upload game, sau khi cập nhật Registry thành công:

```typescript
// src/pages/api/upload.ts

// ... Logic upload thành công ...
// Lấy user từ locals (đã có từ middleware)
const user = context.locals.user; 
const clientIp = context.request.headers.get('x-forwarded-for') || context.clientAddress;

// GHI LOG
AuditLogger.log({
  actor: { 
    user, 
    ip: clientIp,
    userAgent: context.request.headers.get('user-agent') 
  },
  action: 'GAME_UPLOAD',
  target: {
    entity: 'GAME',
    id: gameId,
    subId: version
  },
  metadata: {
    method: 'FOLDER_UPLOAD', // hoặc 'ZIP_UPLOAD' bên file kia
    fileCount: files.length,
    rootFolder: detectedRootFolder //
  }
});

return new Response(...)

```

### 3.2. Khi thay đổi trạng thái Game (QC/Approve)

Giả sử bạn có API `POST /api/games/status` để duyệt game.

```typescript
// src/pages/api/games/status.ts

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  // ... check permissions ...
  
  const { gameId, version, newStatus, reason } = await context.request.json();
  
  // Lấy trạng thái cũ để so sánh (nếu cần)
  const oldStatus = await RegistryManager.getStatus(gameId, version);

  // ... Update Database ...

  // GHI LOG
  AuditLogger.log({
    actor: { user, ... },
    action: 'GAME_STATUS_CHANGE',
    target: { entity: 'GAME', id: gameId, subId: version },
    changes: [
      { field: 'status', oldValue: oldStatus, newValue: newStatus }
    ],
    metadata: {
      reason: reason // Lý do reject/approve
    }
  });
};

```

### 3.3. Khi Xóa Version (`src/pages/api/delete.ts`)

```typescript
// src/pages/api/delete.ts
// ... Logic xóa GCS thành công ...

AuditLogger.log({
  actor: { user, ... },
  action: 'GAME_DELETE_VERSION',
  target: { entity: 'GAME', id: gameId, subId: version },
  metadata: {
    triggerBy: 'Manual Clean up'
  }
});

```

---

## 4. Giao diện quản trị (Admin UI)

Bạn cần tạo một trang mới: `/console/audit-logs`.

### 4.1. Layout

Sử dụng lại `ConsoleLayout` và phong cách thiết kế hiện tại (Modern SaaS).

### 4.2. Bảng hiển thị (Table)

Sử dụng component Table (shadcn/ui hoặc HTML table style tailwind bạn đang dùng).

| Thời gian | Người thực hiện | Hành động | Đối tượng | Chi tiết |
| --- | --- | --- | --- | --- |
| 10:42 17/12 | **admin@iruka.com** <br>

<br> *(Role: Admin)* | <span class="text-blue-600">GAME_UPLOAD</span> | `bubble-shooter` <br>

<br> `v1.2.0` | Zip Upload (25 files) |
| 09:15 17/12 | **qc@iruka.com** <br>

<br> *(Role: QC)* | <span class="text-red-600">GAME_STATUS_CHANGE</span> | `math-quiz` <br>

<br> `v1.0.1` | Status: `Pending` -> `Rejected` <br>

<br> *Lý do: Lỗi font chữ* |

### 4.3. Filters (Bộ lọc)

Cần có các bộ lọc cơ bản ở đầu trang:

* **User:** Dropdown chọn user.
* **Action:** Dropdown chọn loại hành động (Upload, Delete, Status...).
* **Date Range:** Từ ngày - Đến ngày.
* **Game ID:** Input search text.

---

## 5. Tối ưu hóa Database (Performance & Maintenance)

Vì log sẽ tăng rất nhanh theo thời gian, bạn cần cấu hình MongoDB ngay từ đầu:

### 5.1. Indexing

Chạy lệnh này trong MongoDB Shell hoặc Compass để query nhanh:

```javascript
// Tìm kiếm theo Game ID nhanh
db.audit_logs.createIndex({ "target.id": 1 }); 
// Tìm kiếm theo User nhanh
db.audit_logs.createIndex({ "actor.userId": 1 });
// Sắp xếp theo thời gian nhanh (quan trọng nhất cho dashboard)
db.audit_logs.createIndex({ createdAt: -1 });

```

### 5.2. TTL Index (Tự động xóa log cũ)

Nếu bạn không muốn lưu log vĩnh viễn (tốn dung lượng), hãy đặt thời gian tự hủy (ví dụ: 90 ngày).

```javascript
// Tự động xóa document sau 90 ngày (7776000 giây)
db.audit_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

```

---

## 6. Kế hoạch thực hiện (Checklist)

1. [ ] **Tạo Model:** Định nghĩa schema `audit_logs` trong code.
2. [ ] **Viết Service:** Implement `src/lib/audit.ts` với hàm `log` và `getLogs`.
3. [ ] **Gắn Hooks:**
* [ ] API Upload (`upload.ts`, `upload-zip.ts`).
* [ ] API Delete (`delete.ts`).
* [ ] API Auth (Login/Logout - optional).
* [ ] Các API thay đổi trạng thái game (nếu đã có).


4. [ ] **Tạo trang UI:** `src/pages/console/audit-logs.astro`.
5. [ ] **Phân quyền:** Thêm quyền `system:audit_view` vào file cấu hình quyền hạn và chỉ cấp cho Admin/CTO.

Việc triển khai này sẽ giúp hệ thống của bạn minh bạch hoàn toàn và dễ dàng truy vết sự cố. Bạn có thể bắt đầu ngay với Bước 1 & 2.