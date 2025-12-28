#!/bin/bash

# Config biến môi trường
PROJECT_ID="noted-aloe-474810-u1"
BUCKET_NAME="iruka-edu-mini-game"
CORS_FILE="storage-cors.json"

echo "=== Bắt đầu cấu hình Google Cloud Storage (Native) ==="

# 1. Setup Project & Login check
# Đảm bảo bạn đã chạy 'gcloud auth login' trước đó
gcloud config set project $PROJECT_ID

# 2. Bật tính năng 'Uniform Bucket-Level Access'
# Đây là chuẩn bảo mật mới của Google, giúp quản lý quyền đơn giản hơn (tắt ACL cũ)
echo ">>> Bật Uniform Bucket-Level Access..."
gcloud storage buckets update gs://$BUCKET_NAME --uniform-bucket-level-access

# 3. Cấu hình CORS (Chặn domain lạ)
echo ">>> Cập nhật CORS từ file $CORS_FILE..."
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=$CORS_FILE

# 4. Cấu hình quyền truy cập (IAM)
# - Cho phép mọi người (public) ĐỌC file để chơi game
echo ">>> Cấp quyền Public Read cho user..."
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
    --member=allUsers \
    --role=roles/storage.objectViewer

# Lưu ý: Quyền Ghi (Write) mặc định chỉ có Owner (bạn) mới có.
# Không cần lệnh allow write, vì mặc định là Deny all write except owner.

echo "=== Hoàn tất! Bucket đã sẵn sàng. ==="
