Để đảm bảo Game Hub chỉ hiển thị những game đã vượt qua tất cả các bài kiểm tra (QC Passed) và đã được quản trị viên phê duyệt phát hành (Published), bạn cần xây dựng một "Bộ lọc Gateway" giữa hệ thống quản lý và người dùng cuối.

Dưới đây là phân tích chi tiết về cách quản lý và phân phối (delivery) dựa trên hạ tầng bạn đã có:

### 1. Quản lý Trạng thái Phát hành (Publishing Workflow)

Hệ thống của bạn đã có các trạng thái từ `Draft` đến `Published`. Để việc quản lý chặt chẽ, bạn cần thực hiện logic chuyển đổi trạng thái sau:

* **Điều kiện bắt buộc:** Một game chỉ có thể chuyển sang trạng thái `published` khi và chỉ khi trạng thái trước đó là `approved` (đã được CTO/CEO duyệt).
* **Hành động Publish:** Khi Admin bấm nút "Publish", hệ thống thực hiện hai việc đồng thời:
1. Cập nhật `status: "published"` trong MongoDB.
2. Đồng bộ hóa thông tin này vào file **Registry Index** trên GCS.



### 2. Chiến lược Phân phối (Delivery Strategy)

Bạn nên sử dụng mô hình kết hợp (Hybrid) để tối ưu cả tính bảo mật và hiệu suất:

#### Cách 1: Phân phối qua Static Registry (High Performance)

Hệ thống Manager sẽ duy trì một file `registry/index.json` trên GCS. Game Hub sẽ tải file này trực tiếp qua CDN.

* **Quản lý:** File này chỉ chứa danh sách các game có `status: "published"` và `disabled: false`.
* **Ưu điểm:** Tốc độ cực nhanh vì tận dụng bộ nhớ đệm (caching) của CDN Google Cloud.
* **Nhược điểm:** Khó thực hiện các bộ lọc phức tạp theo từng người dùng cụ thể.

#### Cách 2: Phân phối qua Dynamic API (High Control)

Game Hub gọi một API endpoint trên Astro (ví dụ: `/api/v1/hub/games`).

* **Quản lý:** API này sẽ query MongoDB: `db.games.find({ status: "published", disabled: false })`.
* **Ưu điểm:** Có thể áp dụng logic ABAC/RBAC cho người chơi (ví dụ: học sinh lớp 1 chỉ thấy game lớp 1).
* **Bảo mật:** Bạn có thể kiểm tra token của người chơi trước khi trả về danh sách game.

### 3. Logic Lọc và Kiểm soát (Filtering Logic)

Trong code của `RegistryManager` hoặc API, bạn phải áp dụng các quy tắc lọc nghiêm ngặt sau:

* **Lọc Trạng thái:** Chỉ lấy các bản ghi có `status === 'published'`.
* **Kiểm tra Kill-switch:** Luôn kiểm tra field `disabled`. Nếu `disabled: true`, game phải bị ẩn ngay lập tức ngay cả khi nó đang ở trạng thái published.
* **Logic Rollout:** Sử dụng `rolloutPercentage` để điều tiết lưu lượng. Nếu một game mới publish có `rolloutPercentage: 20`, API chỉ trả về `entryUrl` mới cho 20% người dùng ngẫu nhiên dựa trên UserID.
* **Phiên bản hiện hành:** Đảm bảo `entryUrl` luôn trỏ tới đúng `activeVersion` đã được QC và phê duyệt.

### 4. Triển khai Kỹ thuật trên GCS

Để việc delivery an toàn và hiệu quả, bạn cần cấu hình GCS như sau:

* **Cache Policy:** * File `registry/index.json` và `index.html` của game phải để `no-cache` để đảm bảo người chơi nhận được bản cập nhật hoặc lệnh gỡ bỏ game ngay lập tức.
* Các file assets (js, css, png) trong folder version phải để `public, max-age=31536000, immutable` để tối ưu tốc độ tải game.


* **Cấu trúc URL:** URL phân phối phải tuân thủ định dạng versioning để tránh xung đột: `https://storage.googleapis.com/{bucket}/games/{id}/{version}/index.html`.

### 5. Bước tiếp theo bạn nên làm:

1. **Cập nhật `RegistryManager`:** Viết hàm `getPublicRegistry()` chỉ trích xuất các game thỏa mãn điều kiện `published`.
2. **Xây dựng trang "Publishing Console":** Một giao diện dành riêng cho Admin để phê duyệt cuối cùng và kéo slider `rolloutPercentage`.
3. **Tích hợp Telemetry:** Khi game đã publish, cần theo dõi log từ Hub để biết game có bị lỗi crash khi chạy thực tế hay không, từ đó có thể tự động `disabled` nếu tỷ lệ lỗi quá cao.

Để đảm bảo Game Hub vận hành tin cậy và chỉ phân phối những nội dung đã đạt chuẩn (Gold Build), bạn cần triển khai một hệ thống **Delivery Point (Điểm phân phối)** tách biệt hoàn toàn với hệ thống Quản lý (CMS).

Dưới đây là sơ đồ giải pháp (Point of Solution - POS) chi tiết cho việc quản lý và phân phối game:

### 1. Phân tách Registry: "Draft" vs "Public"

Bạn không nên để Game Hub đọc trực tiếp cơ sở dữ liệu MongoDB hay toàn bộ file Registry của hệ thống quản lý. Hãy chia thành 2 thực thể:

* **Management Registry (MongoDB):** Chứa tất cả thông tin, các bản build lỗi, các phiên bản đang test.
* **Public Registry (GCS JSON):** Chỉ chứa duy nhất các game có `status: "published"`, `disabled: false` và các metadata đã được tối ưu cho người chơi.

### 2. Quy trình "Bơm" dữ liệu (Publishing Pipeline)

Khi một bản build đạt trạng thái `published`, hệ thống thực hiện quy trình "Promotion":

1. **Validation Cuối:** Kiểm tra `activeVersion` đã có đủ `index.html` và manifest trên GCS chưa.
2. **Snapshot:** Trích xuất thông tin từ MongoDB (title, entryUrl, iconUrl, capabilities).
3. **Overwrite Public Registry:** Ghi đè hoặc cập nhật file `registry/index.json` trên GCS với thuộc tính `Cache-Control: no-cache` để Game Hub luôn nhận dữ liệu mới nhất.

### 3. Cơ chế Phân phối (Delivery Mechanisms)

Bạn có hai lựa chọn triển khai tùy theo nhu cầu kiểm soát:

| Đặc điểm | Cách A: Static Delivery (CDN) | Cách B: Dynamic Gateway (API) |
| --- | --- | --- |
| **Cơ chế** | Hub tải trực tiếp file `index.json` từ GCS CDN. | Hub gọi API Astro, API này query MongoDB và trả kết quả. |
| **Tốc độ** | Cực nhanh, chịu tải hàng triệu người dùng. | Chậm hơn một chút (phụ thuộc vào Database). |
| **Bảo mật** | Công khai toàn bộ danh sách game. | Có thể lọc game theo User (Lớp 1 chỉ thấy game Lớp 1). |
| **Rollout** | Dựa trên logic code của Game Hub (Client-side). | Dựa trên logic server (Server-side). |

### 4. Logic Kiểm soát tại Hub (Safety Rules)

Dù sử dụng cách nào, Game Hub phải tuân thủ các quy tắc "Cổng an toàn":

* **Status Lock:** Tuyệt đối không hiển thị game nếu `status` khác `published`.
* **Disabled Switch:** Nếu `disabled: true`, Hub phải ẩn game ngay lập tức kể cả khi game đó đã từng được chơi.
* **Rollout Logic:** Sử dụng `rolloutPercentage` trong manifest để điều phối.
* *Ví dụ:* Nếu `rolloutPercentage: 50`, chỉ những User có số cuối ID là số chẵn mới thấy bản cập nhật mới.


* **Runtime Bridge Check:** Hub chỉ khởi chạy iframe khi `runtime` là `iframe-html` và `entryUrl` trỏ về domain GCS hợp lệ.

### 5. Quản lý Phiên bản (Active Version Management)

Trong file Public Registry, bạn chỉ lưu một `entryUrl` duy nhất trỏ về phiên bản đã Pass QC:

* Khi có bản v1.1.0 đạt chuẩn -> Admin bấm Publish -> `entryUrl` trong Public Registry đổi từ `.../1.0.0/index.html` sang `.../1.1.0/index.html`.
* **Rollback:** Nếu v1.1.0 lỗi, Admin chỉ cần vào Console chọn lại v1.0.0 làm `activeVersion` và Publish lại. Game Hub sẽ tự động "lùi" về bản cũ sau khi reload.

### 6. Checklist Vận hành (Operational POS)

* [ ] **GCS CDN:** Bật CDN cho bucket để giảm độ trễ khi Hub load game.
* [ ] **CORS Policy:** Cấu hình GCS chỉ cho phép Domain của Game Hub truy cập (GET/HEAD).
* [ ] **Auto-Invalidation:** Nếu bạn dùng Cloudflare/CloudFront trước GCS, hãy nhớ xóa cache file `registry/index.json` mỗi khi có hành động Publish.

Giải pháp này giúp bạn tách rời việc **Phát triển (Dev)**, **Kiểm thử (QC)** và **Phát hành (Hub)**, đảm bảo người chơi không bao giờ gặp phải bản build lỗi hoặc chưa được duyệt.