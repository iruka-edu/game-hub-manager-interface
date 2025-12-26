# Version Management - Quick Reference Card

## 🎯 Tính năng mới trong My Games

### 1️⃣ Xem lịch sử phiên bản
**Cách dùng:** Click mũi tên (▼) bên cạnh số phiên bản

**Hiển thị:**
- Tất cả phiên bản của game
- Trạng thái từng phiên bản
- Ngày tạo và kích thước file

### 2️⃣ Cập nhật code (cho game QC Failed)
**Khi nào dùng:** Game bị QC từ chối, cần sửa lỗi nhỏ

**Cách dùng:**
1. Click nút "Cập nhật code" (màu cam)
2. Chọn file ZIP mới
3. Click "Xác nhận cập nhật"

**Kết quả:**
- Code cũ bị ghi đè
- Trạng thái reset về "Nháp"
- Phải test và gửi QC lại
- Số phiên bản KHÔNG thay đổi

### 3️⃣ Tạo phiên bản mới
**Khi nào dùng:** Thay đổi lớn, tính năng mới

**Cách dùng:**
1. Click nút "Bản mới" (màu xanh)
2. Upload code mới
3. Gửi QC

**Kết quả:**
- Tạo phiên bản mới (1.0.0 → 1.0.1)
- Phiên bản cũ vẫn giữ nguyên

---

## 📊 So sánh: Cập nhật vs Tạo mới

| Tiêu chí | Cập nhật code | Tạo phiên bản mới |
|----------|---------------|-------------------|
| **Số phiên bản** | Giữ nguyên (1.0.0) | Tăng lên (1.0.1) |
| **Code cũ** | Bị ghi đè | Vẫn giữ |
| **Khi nào dùng** | Sửa lỗi nhỏ | Thay đổi lớn |
| **Màu nút** | 🟠 Cam | 🟢 Xanh |
| **Trạng thái** | Reset về Nháp | Bắt đầu từ Nháp |

---

## 🔘 Các nút trong My Games

### Trạng thái: Nháp (Draft)
- **Sửa** - Sửa thông tin game
- **Gửi QC** - Gửi để QC kiểm tra

### Trạng thái: QC cần sửa (QC Failed)
- **Sửa** - Sửa thông tin game
- **Cập nhật code** 🆕 - Thay code trong phiên bản hiện tại
- **Gửi QC** - Gửi lại để QC kiểm tra
- **Bản mới** - Tạo phiên bản mới

### Trạng thái khác (Uploaded, QC Processing, etc.)
- **Xem chi tiết** - Xem thông tin (chỉ đọc)

---

## ⚠️ Lưu ý quan trọng

### Khi cập nhật code:
1. ❌ Code cũ sẽ bị xóa hoàn toàn
2. ❌ Self-QA checklist bị xóa
3. ⚠️ Phải test lại từ đầu
4. ⚠️ Phải hoàn thành Self-QA lại
5. ⚠️ Phải gửi QC lại

### Giới hạn file:
- ✅ Chỉ chấp nhận file .zip
- ✅ Kích thước tối đa: 100MB

---

## 🔄 Quy trình làm việc

### Kịch bản 1: Sửa lỗi nhỏ (Recommended)
```
QC Failed → Cập nhật code → Upload ZIP → 
Test lại → Hoàn thành Self-QA → Gửi QC
```

### Kịch bản 2: Thay đổi lớn
```
QC Failed → Bản mới → Upload code mới → 
Test → Hoàn thành Self-QA → Gửi QC
```

---

## 🎨 Màu sắc trạng thái

- 🔵 **Nháp** - Đang làm
- 🔵 **Chờ QC** - Đã gửi, chờ kiểm tra
- 🟣 **Đang QC** - QC đang test
- 🟢 **QC đạt** - QC approve
- 🔴 **QC cần sửa** - QC từ chối, cần sửa
- 🟢 **Đã duyệt** - CTO/Admin approve
- 🟣 **Đã xuất bản** - Đang live cho user

---

## 💡 Tips

### Khi nào dùng "Cập nhật code"?
✅ Sửa bug nhỏ
✅ Fix lỗi UI
✅ Sửa lỗi chính tả
✅ Điều chỉnh âm thanh

### Khi nào dùng "Bản mới"?
✅ Thêm tính năng mới
✅ Thay đổi gameplay
✅ Redesign UI hoàn toàn
✅ Thay đổi logic game

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra file ZIP có đúng format không
2. Kiểm tra kích thước file (<100MB)
3. Kiểm tra trạng thái game (chỉ "QC cần sửa" mới có nút "Cập nhật code")
4. Xem log trong Console (F12) để debug

---

## 📚 Tài liệu chi tiết

- `docs/my-games-version-management.md` - Tài liệu kỹ thuật đầy đủ
- `docs/my-games-ui-guide.md` - Hướng dẫn giao diện chi tiết
- `docs/task-6-version-management-summary.md` - Tóm tắt implementation
