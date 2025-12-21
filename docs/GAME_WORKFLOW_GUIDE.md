# Hướng dẫn quy trình Upload và Kiểm duyệt Game

Tài liệu này hướng dẫn chi tiết các bước từ khi Developer upload game cho đến khi game được Admin phê duyệt và xuất bản lên Game Hub.

## 1. Quy trình dành cho Developer (Upload Game)

### Bước 1: Chuẩn bị bộ cài

- Đảm bảo trong thư mục gốc của game có file `index.html`.
- Phải có file `manifest.json` để định nghĩa thông tin game (id, version, title, description, v.v.).

### Bước 2: Upload Game

- Sử dụng chức năng "Upload Game" trên giao diện Console.
- Bạn có thể upload thư mục hoặc file ZIP.
- **Trạng thái sau upload**: `draft` (Bản nháp).

### Bước 3: Hoàn thành Self-QA (Tự kiểm tra)

- Truy cập vào chi tiết game vừa upload.
- Bạn phải tích chọn hoàn thành tất cả các mục trong checklist **Self-QA**:
  - [x] Đã kiểm tra trên các thiết bị.
  - [x] Đã kiểm tra âm thanh.
  - [x] Gameplay hoàn thiện.
  - [x] Nội dung đã được xác thực mã hóa/an toàn.
- **API**: `/api/games/self-qa`

### Bước 4: Gửi duyệt QC (Submit for QC)

- Sau khi xong Self-QA, nhấn nút **"Submit for QC"**.
- Hệ thống sẽ thông báo cho đội ngũ QC.
- **Trạng thái sau submit**: `uploaded` (Đã tải lên).
- **API**: `/api/games/submit-qc`

---

## 2. Quy trình dành cho QC & Admin (Kiểm duyệt & Phê duyệt)

### Bước 1: Bắt đầu Review (Start Review)

- QC/Admin mở game trong danh sách chờ duyệt.
- Nhấn **"Bắt đầu Review"** để đánh dấu đang xử lý.
- **Trạng thái**: `qc_processing` (Đang kiểm duyệt).
- **API**: `/api/games/qc-review`

### Bước 2: Ghi nhận kết quả QC (QC Result)

- Sau khi test xong, QC chọn:
  - **Pass (Đạt)**: Trạng thái chuyển thành `qc_passed`.
  - **Fail (Không đạt)**: Trạng thái chuyển thành `qc_failed` (Dev sẽ phải sửa và submit lại).
- **API**: `/api/games/qc-result`

### Bước 3: Phê duyệt (Approve) - Dành cho CTO/Admin

- Admin kiểm tra các bản build đã `qc_passed`.
- Nhấn **"Phê duyệt (Approve)"**.
- **Trạng thái**: `approved` (Đã phê duyệt).
- **API**: `/api/api/games/[id]/approve`

### Bước 4: Xuất bản (Publish)

- Admin nhấn **"Xuất bản (Publish)"** để đưa game vào hệ thống sẵn sàng sử dụng.
- Lưu ý: Xuất bản chưa nhất thiết là đưa game lên Live ngay.
- **Trạng thái**: `published` (Đã xuất bản).
- **API**: `/api/api/games/[id]/publish`

### Bước 5: Đưa lên Live (Set Live)

- Admin chọn phiên bản đã `published` và nhấn **"Set as Live"**.
- Chỉ phiên bản Live mới hiển thị cho người dùng cuối trên Game Hub.
- **API**: `/api/api/games/[id]/set-live`

---

## Bảng tổng hợp trạng thái (Status)

| Trạng thái      | Ý nghĩa                       | Hành động kế tiếp                    |
| :-------------- | :---------------------------- | :----------------------------------- |
| `draft`         | Mới upload hoặc bị QC từ chối | Dev hoàn thiện Self-QA và Submit     |
| `uploaded`      | Đang chờ QC tiếp nhận         | QC nhấn "Bắt đầu Review"             |
| `qc_processing` | Đang trong quá trình test     | QC chọn "Pass" hoặc "Fail"           |
| `qc_failed`     | Không đạt yêu cầu QC          | Dev sửa và Submit lại                |
| `qc_passed`     | Đã qua vòng QC                | Admin nhấn "Approve"                 |
| `approved`      | Đã được lãnh đạo duyệt        | Admin nhấn "Publish"                 |
| `published`     | Đã sẵn sàng                   | Admin nhấn "Set Live" để đưa lên Hub |
