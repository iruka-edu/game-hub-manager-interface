# Tính năng Xóa Game

## Tổng quan

Tính năng xóa game cho phép các user có quyền thích hợp xóa games khỏi hệ thống với các quy tắc phân quyền khác nhau.

## Quyền hạn xóa game

### 1. Developer (dev)
- **Chỉ có thể xóa games của mình**
- **Bắt buộc nhập lý do xóa**
- **Tự động gửi thông báo** tới QC, Admin, CTO/CEO khi xóa game

### 2. CTO/CEO/Admin
- **Có thể xóa bất kỳ game nào** trong hệ thống
- **Lý do xóa là tùy chọn** (không bắt buộc)
- **Không gửi thông báo** khi xóa (vì có quyền cao nhất)

## Cách sử dụng

### Truy cập trang Quản lý Games

1. Đăng nhập vào Console
2. Vào menu **"Quản lý Games"** (chỉ hiển thị cho user có quyền xóa)
3. Trang sẽ hiển thị danh sách games dưới dạng cards với nút "Xóa" màu đỏ

### Xóa game

1. **Tìm game cần xóa** bằng cách:
   - Duyệt danh sách
   - Lọc theo trạng thái (Draft, QC Failed, Published, v.v.)
   - Tìm kiếm theo tên game, ID hoặc tác giả

2. **Nhấn nút "Xóa"** trên game card
   - Nút có icon thùng rác và màu đỏ
   - Chỉ hiển thị nếu user có quyền xóa game đó

3. **Xác nhận xóa** trong modal popup:
   - Đọc cảnh báo về việc xóa vĩnh viễn
   - Nhập lý do xóa (bắt buộc với Dev, tùy chọn với Admin/CTO/CEO)
   - Nhấn "Xóa Game" để xác nhận

4. **Hoàn tất**: Game sẽ bị xóa và trang sẽ reload để cập nhật danh sách

## Tính năng bảo mật

### Audit Trail
- Mọi thao tác xóa đều được ghi lại trong collection `game_deletions`
- Thông tin ghi lại bao gồm:
  - Game bị xóa (ID, title, owner)
  - User thực hiện xóa (ID, username, roles)
  - Lý do xóa
  - Thời gian xóa
  - Toàn bộ dữ liệu game (để khôi phục nếu cần)

### Thông báo tự động
- Khi Developer xóa game của mình:
  - Hệ thống tự động gửi thông báo tới tất cả user có role: `qc`, `admin`, `cto`, `ceo`
  - Thông báo bao gồm tên game, tác giả và lý do xóa

### Xóa cascade
- Khi xóa game, hệ thống cũng xóa:
  - Tất cả versions của game (`game_versions` collection)
  - Dữ liệu liên quan khác

## API Endpoints

### POST `/api/games/[gameId]/delete`

**Request Body:**
```json
{
  "reason": "Lý do xóa game (tùy chọn cho admin, bắt buộc cho dev)"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Game deleted successfully",
  "deletionId": "ObjectId của record deletion"
}
```

**Response Error:**
```json
{
  "error": "Mô tả lỗi",
  "details": "Chi tiết lỗi (nếu có)"
}
```

## Giao diện

### Trang Quản lý Games (`/console/games-manager`)

**Tính năng:**
- Hiển thị games dưới dạng grid cards
- Bộ lọc theo trạng thái
- Tìm kiếm theo tên, ID, tác giả
- Nút xóa trên mỗi game card (nếu có quyền)

**Phân quyền hiển thị:**
- **Developer**: Chỉ thấy games của mình
- **Admin/CTO/CEO**: Thấy tất cả games trong hệ thống

### Modal xác nhận xóa

**Thành phần:**
- Icon cảnh báo
- Tiêu đề và mô tả rõ ràng
- Textarea nhập lý do (required cho dev, optional cho admin)
- Nút Hủy và Xóa Game

## Lưu ý quan trọng

⚠️ **Cảnh báo**: Việc xóa game là **KHÔNG THỂ HOÀN TÁC**. Tất cả dữ liệu và phiên bản của game sẽ bị xóa vĩnh viễn khỏi database.

✅ **Khuyến nghị**: 
- Luôn kiểm tra kỹ trước khi xóa
- Nhập lý do xóa rõ ràng để audit
- Chỉ xóa games thực sự không cần thiết

## Troubleshooting

### Không thấy nút xóa
- Kiểm tra quyền user (phải có role dev/admin/cto/ceo)
- Developer chỉ thấy nút xóa trên games của mình
- Admin/CTO/CEO thấy nút xóa trên tất cả games

### Lỗi "Insufficient permissions"
- User không có quyền xóa game đó
- Developer cố xóa game của người khác
- Kiểm tra lại role và ownership

### Lỗi "Game not found"
- Game đã bị xóa trước đó
- GameId không tồn tại
- Refresh trang và thử lại

## Changelog

### Version 1.0.0
- Tính năng xóa game cơ bản
- Phân quyền theo role
- Audit trail và thông báo
- Giao diện modal xác nhận