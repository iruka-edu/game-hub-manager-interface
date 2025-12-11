# Tính năng Upload ZIP - Hướng dẫn sử dụng

## Tổng quan
Hệ thống Game Hub Manager hiện đã hỗ trợ upload file ZIP, giúp admin dễ dàng tải lên game mà không cần giải nén thủ công.

## Tính năng mới

### 1. Upload ZIP tự động
- **Chọn file ZIP**: Nhấn nút "📦 ZIP" hoặc kéo thả file .zip vào drop zone
- **Tự động giải nén**: Server sẽ tự động giải nén và tải lên tất cả file
- **Cấu trúc thư mục**: Giữ nguyên cấu trúc folder trong ZIP
- **Progress tracking**: Hiển thị tiến độ giải nén và upload

### 2. API Endpoint mới
**`/api/upload-zip`** - Xử lý upload file ZIP
- Nhận file ZIP và manifest data
- Giải nén bằng JSZip library
- Upload từng file lên Google Cloud Storage
- Cập nhật registry với thông tin game

### 3. Cải tiến UI
- **3 phương thức upload**: File, Thư mục, ZIP
- **ZIP mode**: Giao diện đặc biệt cho file ZIP
- **Progress bar**: Hiển thị tiến độ giải nén và upload
- **Status messages**: Thông báo chi tiết cho từng bước

## Cách sử dụng

### Bước 1: Chuẩn bị file ZIP
```
game-build.zip
├── index.html          (bắt buộc)
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
├── js/
├── css/
└── manifest.json       (tùy chọn)
```

### Bước 2: Upload ZIP
1. Truy cập trang `/upload`
2. Nhấn nút "📦 ZIP" hoặc kéo thả file ZIP
3. Điền thông tin manifest (nếu chưa có trong ZIP)
4. Nhấn "Tải lên ZIP"

### Bước 3: Theo dõi tiến độ
- **Giải nén**: Server giải nén file ZIP
- **Upload**: Tải lên từng file lên cloud
- **Hoàn tất**: Chuyển hướng về dashboard

## Ưu điểm

### 1. Tiện lợi
- Không cần giải nén thủ công
- Upload một lần cho toàn bộ project
- Giữ nguyên cấu trúc thư mục

### 2. Hiệu quả
- Nén file giảm thời gian upload
- Xử lý batch upload tối ưu
- Progress tracking chi tiết

### 3. Tương thích
- Hỗ trợ mọi loại file trong ZIP
- Tự động detect content type
- Xử lý HTML files với cache headers

## Yêu cầu kỹ thuật

### Dependencies
```json
{
  "jszip": "^3.10.1"
}
```

### File structure
- `src/pages/api/upload-zip.ts` - API endpoint
- `src/components/GameUploadForm.astro` - UI component

### Environment variables
Sử dụng chung với upload thường:
- `GCLOUD_PROJECT_ID`
- `GCLOUD_CLIENT_EMAIL` 
- `GCLOUD_PRIVATE_KEY`
- `GCLOUD_BUCKET_NAME`

## Xử lý lỗi

### Lỗi thường gặp
1. **File không phải ZIP**: Kiểm tra extension .zip
2. **Thiếu index.html**: ZIP phải chứa file entry point
3. **ZIP bị hỏng**: Kiểm tra tính toàn vẹn file
4. **Manifest không hợp lệ**: Điền đầy đủ ID và version

### Debug
- Check browser console cho client errors
- Check server logs cho upload errors
- Verify GCS permissions và credentials

## Ví dụ sử dụng

### React build output
```bash
# Build React app
npm run build

# Tạo ZIP từ build folder
cd build
zip -r ../my-game-v1.0.0.zip .

# Upload ZIP qua UI
# Điền manifest: id="my-game", version="1.0.0"
```

### Unity WebGL build
```bash
# Export Unity WebGL build
# Tạo ZIP từ WebGL folder
zip -r unity-game-v2.1.0.zip WebGL/

# Upload và điền manifest phù hợp
```

## Kết luận
Tính năng upload ZIP giúp đơn giản hóa quy trình deploy game, đặc biệt hữu ích cho:
- React/Vue/Angular builds
- Unity WebGL exports  
- Phaser/PixiJS projects
- Bất kỳ game HTML5 nào có cấu trúc folder phức tạp

Admin chỉ cần tạo ZIP và upload, hệ thống sẽ tự động xử lý phần còn lại.