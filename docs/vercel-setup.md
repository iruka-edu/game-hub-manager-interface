# Hướng dẫn Deploy lên Vercel

## Bước 1: Cấu hình Environment Variables

Vào **Vercel Dashboard** → **Project Settings** → **Environment Variables**

Thêm các biến sau:

### 1. GCLOUD_PROJECT_ID
- **Name**: `GCLOUD_PROJECT_ID`
- **Value**: ID của Google Cloud Project (ví dụ: `iruka-edu-mini-game`)

### 2. GCLOUD_BUCKET_NAME  
- **Name**: `GCLOUD_BUCKET_NAME`
- **Value**: `iruka-edu-mini-game`

### 3. GCLOUD_CLIENT_EMAIL
- **Name**: `GCLOUD_CLIENT_EMAIL`
- **Value**: Email từ service account JSON
  ```
  your-service@your-project.iam.gserviceaccount.com
  ```

### 4. GCLOUD_PRIVATE_KEY
- **Name**: `GCLOUD_PRIVATE_KEY`
- **Value**: Copy toàn bộ private key từ service account JSON (giữ nguyên `\n`)
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n
  ```

**Lưu ý:** 
- Không cần dấu ngoặc kép `"..."` trên Vercel
- Giữ nguyên `\n` trong private key
- Chọn **All Environments** (Production, Preview, Development)

## Bước 2: Redeploy

Sau khi thêm environment variables:
1. Vào **Deployments**
2. Chọn deployment mới nhất
3. Bấm **⋯** → **Redeploy**

## Bước 3: Kiểm tra

Upload game lại trên `https://your-project.vercel.app/upload`

---

## Troubleshooting

### Lỗi 403 Forbidden
- ✅ Kiểm tra environment variables đã được set đúng
- ✅ Kiểm tra service account có quyền `Storage Object Admin`
- ✅ Redeploy sau khi thêm env vars

### Lỗi "Could not load credentials"
- ✅ Kiểm tra `GCLOUD_PRIVATE_KEY` có giữ nguyên `\n` không
- ✅ Kiểm tra `GCLOUD_CLIENT_EMAIL` đúng format

### Kiểm tra logs
Vào **Deployments** → **Function Logs** để xem chi tiết lỗi
