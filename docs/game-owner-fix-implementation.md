# Game Owner Fix Implementation

## Vấn đề (Problem)

Một số games được tạo trước khi hệ thống có tính năng lưu `ownerId`, khiến chúng không hiển thị trong trang "Game của tôi" của developer. Điều này xảy ra vì:

1. Game đã được lưu vào Database
2. Nhưng thiếu thông tin `ownerId` (người sở hữu)
3. Khi gọi API lấy danh sách "Game của tôi", hệ thống tìm kiếm: `Tìm các game có ownerId = ID_CỦA_BẠN`
4. Vì thiếu thông tin này, kết quả trả về là rỗng

## Giải pháp đã triển khai (Implemented Solution)

### 1. Sửa code Upload (Đã hoàn thành)

Cả hai file upload đã được cập nhật để tự động thêm `ownerId`:

- `src/pages/api/upload-zip.ts` 
- `src/pages/api/upload.ts`

**Logic đã triển khai:**
```typescript
if (!game && locals.user) {
  // Tạo game mới với ownerId
  game = await gameRepo.create({
    gameId: id,
    title: manifest.title || id,
    description: manifest.description || "",
    ownerId: locals.user._id.toString(), // ✓ Đã có
  });
} else if (game && !game.ownerId && locals.user) {
  // Sửa game cũ thiếu ownerId
  await gameRepo.collection.updateOne(
    { _id: game._id },
    { $set: { ownerId: locals.user._id.toString(), updatedAt: new Date() } }
  );
}
```

### 2. API lấy danh sách games (Đã hoàn thành)

File `src/pages/console/my-games.astro` đã sử dụng đúng method:
```typescript
const rawGames = await gameRepo.findByOwnerId(userId);
```

### 3. Công cụ sửa lỗi tự động (Mới tạo)

**API Endpoint:** `src/pages/api/admin/fix-game-owners.ts`
- Chỉ admin mới có thể sử dụng
- Tìm tất cả games thiếu `ownerId`
- Tự động gán owner dựa trên GameVersion records
- Fallback về admin user nếu không tìm thấy

**Admin Page:** `src/pages/admin/fix-game-owners.astro`
- Giao diện web để chạy công cụ sửa lỗi
- Hiển thị danh sách games cần sửa
- Báo cáo kết quả chi tiết

### 4. Script command line (Đã có sẵn)

File `scripts/patch-game-owners.ts` có thể chạy trực tiếp:
```bash
npm run ts-node scripts/patch-game-owners.ts
```

## Cách sử dụng

### Phương pháp 1: Qua giao diện Admin (Khuyến nghị)

1. Đăng nhập với tài khoản Admin
2. Truy cập: `/admin/fix-game-owners`
3. Nhấn nút "Sửa lỗi tự động"
4. Xem kết quả và tải lại trang

### Phương pháp 2: Qua API trực tiếp

```bash
curl -X POST /api/admin/fix-game-owners \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

### Phương pháp 3: Script command line

```bash
cd scripts
npm run ts-node patch-game-owners.ts
```

### Phương pháp 4: Sửa thủ công trong MongoDB

1. Mở MongoDB Compass
2. Vào collection `games`
3. Tìm games thiếu `ownerId`:
   ```javascript
   {
     $or: [
       { ownerId: { $exists: false } },
       { ownerId: null },
       { ownerId: "" }
     ]
   }
   ```
4. Thêm field `ownerId` với User ID của developer

## Logic sửa lỗi

1. **Tìm owner từ GameVersion:** Lấy `submittedBy` từ version gần nhất
2. **Fallback:** Nếu không có version, gán cho admin đầu tiên
3. **Cập nhật:** Set `ownerId` và `updatedAt` trong games collection

## Kết quả mong đợi

Sau khi chạy công cụ sửa lỗi:
- Tất cả games sẽ có `ownerId`
- Developer có thể thấy games của mình trong trang "Game của tôi"
- Hệ thống hoạt động bình thường cho các uploads mới

## Files liên quan

- `src/pages/api/upload-zip.ts` - Upload ZIP với ownerId fix
- `src/pages/api/upload.ts` - Upload folder với ownerId fix  
- `src/pages/console/my-games.astro` - Trang hiển thị games của user
- `src/models/Game.ts` - GameRepository với findByOwnerId method
- `src/pages/api/admin/fix-game-owners.ts` - API sửa lỗi (mới)
- `src/pages/admin/fix-game-owners.astro` - Admin page (mới)
- `scripts/patch-game-owners.ts` - Script command line (đã có)