Hoàn toàn được. Đây là cách chuẩn trong quy trình DevOps/Infrastructure as Code: đưa toàn bộ cấu hình vào Source Code để ai trong team cũng có thể deploy và môi trường nào cũng chạy đồng nhất.

Dưới đây là cấu trúc file và các script bạn cần thêm vào Repo của mình.

### 1. Cấu trúc thư mục đề xuất

Trong thư mục gốc dự án (nơi chứa `package.json` hoặc `firebase.json`), bạn tạo thêm các file sau:

```text
my-project/
├── firebase.json          # Config Firebase CLI
├── storage.rules          # File chứa logic phân quyền (Security Rules)
├── storage-cors.json      # File chứa cấu hình CORS
└── scripts/
    └── deploy-storage.sh  # Script tự động để chạy lệnh setup

```

---

### 2. Nội dung chi tiết các file

#### A. File `storage.rules`

Đây là file chứa logic bảo vệ file, tách biệt code ra khỏi giao diện console.

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {

      // 1. Cho phép User/Game đọc file (public read)
      allow read: if true;

      // 2. Chỉ cho Admin ghi file và phải đúng định dạng
      // Thay 'YOUR_ADMIN_UID' bằng UID thực tế hoặc dùng logic Custom Claims
      allow write: if request.auth != null
                   && request.auth.uid == 'YOUR_ADMIN_UID'
                   && isValidGameFile();
    }
  }

  function isValidGameFile() {
    return request.resource.size < 100 * 1024 * 1024 // Max 100MB
           && (
             request.resource.contentType.matches('image/.*') ||
             request.resource.contentType.matches('audio/.*') ||
             request.resource.contentType.matches('video/.*') ||
             request.resource.contentType == 'text/html' ||
             request.resource.contentType == 'text/css' ||
             request.resource.contentType == 'application/javascript' ||
             request.resource.contentType == 'application/json' ||
             request.resource.contentType == 'application/zip'
           );
  }
}

```

#### B. File `storage-cors.json`

Lưu ý thay thế domain thật của bạn vào phần `origin`.

```json
[
  {
    "origin": [
      "https://your-game-domain.com",
      "https://your-admin-domain.com",
      "http://localhost:4321",
      "http://localhost:3000"
    ],
    "method": ["GET", "PUT", "POST", "HEAD", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

#### C. File `firebase.json`

Bạn cần trỏ cấu hình storage vào file rules vừa tạo để khi gõ `firebase deploy` nó tự cập nhật rules.

```json
{
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "storage": {
      "port": 9199
    }
  }
  // ... các config khác (hosting, functions...)
}
```

---

### 3. Script tự động hóa (Quan trọng)

Firebase CLI (`firebase deploy`) **chỉ** update được Security Rules, nó **không** update được CORS. Bạn phải dùng `gcloud` hoặc `gsutil`.

Để "chạy ở bất kỳ đâu", hãy tạo một script trong `scripts/deploy-storage.sh`:

```bash
#!/bin/bash

# Config biến môi trường
BUCKET_NAME="iruka-edu-mini-game"
PROJECT_ID="noted-aloe-474810-u1"
CORS_FILE="storage-cors.json"

echo "=== Bắt đầu cấu hình Storage cho dự án: $PROJECT_ID ==="

# 1. Đăng nhập (nếu chạy local thì nó sẽ bỏ qua nếu đã login, chạy CI/CD cần setup service account)
# gcloud auth login

# 2. Cài đặt Project hiện tại
gcloud config set project $PROJECT_ID

# 3. Deploy CORS (Cần thiết cho 2 domain)
echo ">>> Đang cập nhật CORS..."
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=$CORS_FILE

# 4. Deploy Rules (Thông qua Firebase CLI)
echo ">>> Đang cập nhật Security Rules..."
firebase deploy --only storage

echo "=== Hoàn tất! ==="

```

### 4. Cách sử dụng

Sau khi setup xong, mỗi khi bạn checkout code ở máy mới hoặc update cấu hình, bạn chỉ cần mở terminal tại thư mục gốc và chạy:

1. Cấp quyền thực thi cho script (chỉ cần làm 1 lần):

```bash
chmod +x scripts/deploy-storage.sh

```

2. Chạy script:

```bash
./scripts/deploy-storage.sh

```

Hoặc tiện hơn, bạn thêm vào `package.json` của Astro:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "deploy:storage": "./scripts/deploy-storage.sh"
}

```

Lúc này bạn chỉ cần gõ `npm run deploy:storage` là toàn bộ cấu hình Rules và CORS sẽ được đẩy lên Cloud, đảm bảo môi trường Cloud luôn đồng bộ với Code trong Repo.
