# Config biến môi trường
$PROJECT_ID = "noted-aloe-474810-u1"
$BUCKET_NAME = "iruka-edu-mini-game"
$CORS_FILE = "storage-cors.json"

Write-Host "=== Bắt đầu cấu hình Google Cloud Storage (Native) ===" -ForegroundColor Cyan

# 1. Setup Project & Login check
Write-Host ">>> Thiết lập project $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# 2. Bật tính năng 'Uniform Bucket-Level Access'
Write-Host ">>> Bật Uniform Bucket-Level Access..."
gcloud storage buckets update gs://$BUCKET_NAME --uniform-bucket-level-access

# 3. Cấu hình CORS
Write-Host ">>> Cập nhật CORS từ file $CORS_FILE..."
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=$CORS_FILE

# 4. Cấu hình quyền truy cập (IAM)
Write-Host ">>> Cấp quyền Public Read cho user..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
    --member="allUsers" `
    --role="roles/storage.objectViewer"

Write-Host "=== Hoàn tất! Bucket đã sẵn sàng. ===" -ForegroundColor Green
