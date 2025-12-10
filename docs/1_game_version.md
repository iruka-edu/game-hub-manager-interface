Dựa trên yêu cầu của bạn về tính năng quản lý version cho **Game Hub**, tôi sẽ phân tích mô hình nghiệp vụ (Business Logic) và đề xuất giải pháp kỹ thuật cụ thể.

Mô hình này được gọi là **"Release Management"** (Quản lý phát hành), tách biệt giữa việc **Upload** (Lưu trữ) và **Release** (Phát hành cho người chơi).

-----

### 1\. Phân tích Nghiệp vụ (Business Analysis)

Chúng ta cần quản lý 3 trạng thái chính của một Game:

1.  **Kho chứa (Repository):** Một game có thể có nhiều phiên bản (v1.0.0, v1.0.1, v2.0.0) đang nằm trên GCS.
2.  **Phiên bản hiện hành (Active Version):** Chỉ **một** phiên bản được Game Hub tải xuống khi người dùng bấm "Play".
3.  **Lịch sử (History):** Danh sách các version cũ để có thể rollback (quay lui) khi cần.

#### Các Use-cases chính:

1.  **Upload Version Mới:**

      * Dev upload bản build `v1.0.2`.
      * Hệ thống lưu file lên GCS.
      * Hệ thống cập nhật danh sách version trong Registry.
      * *Quyết định:* Có tự động đưa `v1.0.2` thành **Active** ngay lập tức không? (Thường là CÓ với dự án nhỏ, nhưng cho phép chọn KHÔNG nếu muốn test trước).

2.  **Chuyển đổi Version (Rollback/Promote):**

      * Game đang chạy `v1.0.2` bị lỗi.
      * Admin vào Dashboard chọn `v1.0.1` -\> bấm **"Set Active"**.
      * Registry cập nhật `activeVersion: "1.0.1"`.
      * Người chơi reload lại Hub sẽ chơi bản `v1.0.1` ngay lập tức.

3.  **Xóa Version (Prune):**

      * Xóa các bản build rác hoặc quá cũ để tiết kiệm dung lượng.
      * *Ràng buộc:* Không được xóa version đang là **Active**.

-----

### 2\. Thiết kế Cấu trúc Dữ liệu (`registry/index.json`)

File `registry/index.json` đóng vai trò là Database. Chúng ta cần cấu trúc lại nó để hỗ trợ việc quản lý version rõ ràng hơn.

```typescript
// Cấu trúc GameEntry trong registry/index.json
interface GameRegistryItem {
  id: string;              // Unique ID (e.g., "bubble-shooter")
  title: string;
  
  // QUAN TRỌNG: Pointer chỉ định version nào đang chạy
  activeVersion: string;   // e.g., "1.0.1"
  
  // URL để Game Hub load (được tạo động dựa trên activeVersion)
  entryUrl: string;        // ".../games/bubble-shooter/1.0.1/index.html"
  
  // Metadata lấy từ Active Version
  latestManifest: {        
    title: string;
    description: string;
    // ... các field khác từ manifest.json của bản active
  };

  // Danh sách tất cả các version đã upload
  versions: Array<{
    version: string;       // "1.0.0"
    uploadedAt: string;    // ISO Date
    size?: number;         // (Optional) Dung lượng
    changelog?: string;    // (Optional) Ghi chú thay đổi
  }>;

  updatedAt: string;       // Thời điểm cập nhật registry cuối cùng
}
```

### 3\. Phân tích Chi tiết từng Tính năng (Logic Backend)

Dưới đây là logic xử lý cho các API trong `src/lib/registry.ts`.

#### A. Tính năng Upload (New Version)

  * **Input:** File `.zip` hoặc folder dist, chứa `manifest.json` (có `version: 1.0.2`).
  * **Logic:**
    1.  Kiểm tra xem `version` 1.0.2 đã tồn tại trong `versions` list chưa?
          * Nếu có: Báo lỗi hoặc hỏi ghi đè (Thường nên chặn ghi đè để đảm bảo toàn vẹn).
    2.  Upload file lên GCS path: `games/{id}/1.0.2/`.
    3.  Thêm object `{ version: "1.0.2", uploadedAt: ... }` vào mảng `versions`.
    4.  So sánh SemVer: Nếu `1.0.2` \> `activeVersion` hiện tại -\> Tự động cập nhật `activeVersion = "1.0.2"` và `entryUrl`.
  * **UI Feedback:** "Đã upload thành công v1.0.2 và kích hoạt."

#### B. Tính năng "Set Active" (Chuyển đổi Version)

Đây là tính năng quan trọng nhất để quản lý phiên bản.

  * **Input:** `gameId`, `targetVersion` (ví dụ chọn v1.0.0 từ danh sách).
  * **Logic:**
    1.  Tìm `targetVersion` trong mảng `versions`. Nếu không thấy -\> Lỗi.
    2.  Đọc file `manifest.json` của version đó từ GCS (để lấy lại metadata cũ nếu cần).
    3.  Cập nhật `activeVersion` trong Registry thành `targetVersion`.
    4.  Cập nhật lại `entryUrl`.
    5.  Lưu Registry.
  * **UI:** Nút bấm "Activate" hoặc "Rollback" bên cạnh mỗi dòng trong bảng lịch sử.

#### C. Tính năng Xóa Version (Delete)

  * **Input:** `gameId`, `versionToDelete`.
  * **Logic:**
    1.  **Validation:** Nếu `versionToDelete` === `activeVersion` -\> **CHẶN**. Báo lỗi: "Không thể xóa phiên bản đang hoạt động. Hãy kích hoạt phiên bản khác trước."
    2.  Xóa folder trên GCS: `games/{id}/{versionToDelete}/`.
    3.  Xóa item khỏi mảng `versions` trong Registry.
    4.  Nếu xóa xong mà mảng `versions` rỗng -\> Xóa luôn game khỏi Registry.

-----

### 4\. Đề xuất UI/UX (Dựa trên Design System đã chọn)

Với phong cách **Modern SaaS**, giao diện quản lý phiên bản sẽ trông như sau:

#### Màn hình Game Detail (Quản lý chi tiết)

Chia làm 2 phần:

**1. Header Info (Thông tin hiện hành)**

  * Title: **Bubble Shooter**
  * Badge trạng thái: `Live: v1.0.2` (Màu xanh lá)
  * Button: `Upload New Version` (Góc phải).

**2. Version History Table (Bảng lịch sử)**
Sử dụng bảng của `shadcn/ui`.

| Version | Uploaded At | Status | Actions |
| :--- | :--- | :--- | :--- |
| **v1.0.2** | 2 mins ago | \<span class="text-green-600 bg-green-50 px-2 py-1 rounded"\>Active\</span\> | \<button disabled\>Delete\</button\> |
| **v1.0.1** | 2 days ago | \<span class="text-gray-500"\>Inactive\</span\> | \<button class="text-blue-600"\>Switch to this\</button\> • \<button class="text-red-600"\>Delete\</button\> |
| **v1.0.0** | 5 days ago | \<span class="text-gray-500"\>Inactive\</span\> | \<button class="text-blue-600"\>Switch to this\</button\> • \<button class="text-red-600"\>Delete\</button\> |

#### Flow người dùng thao tác:

1.  **Muốn Rollback:** Admin thấy v1.0.2 lỗi -\> Bấm "Switch to this" ở dòng v1.0.1 -\> Loading -\> Badge Active nhảy xuống dòng v1.0.1 -\> Xong.
2.  **Muốn Xóa:** Bấm "Delete" ở dòng v1.0.0 -\> Hiện Confirm Modal -\> Xóa.

-----

### 5\. Những điểm cần lưu ý (Technical Debt)

1.  **Cache Browser:**

      * File `registry/index.json` phải luôn được set `Cache-Control: no-cache` trên GCS. Nếu không, người dùng sẽ không thấy bản cập nhật mới ngay lập tức.
      * File `index.html` của game cũng nên là `no-cache`.
      * Các file assets (js, css, png) trong folder version (v1.0.0/...) nên set cache vĩnh viễn (`immutable`) để tối ưu tốc độ.

2.  **Tính toàn vẹn (Consistency):**

      * Khi update Registry, có nguy cơ Race Condition (2 người cùng upload). Với quy mô nội bộ thì ít gặp, nhưng tốt nhất code backend nên có cơ chế lock đơn giản hoặc chỉ cho phép 1 người upload tại 1 thời điểm.
