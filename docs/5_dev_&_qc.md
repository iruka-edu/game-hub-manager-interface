Ok, mình tập trung hẳn vào **Dev** và **QC** trước, coi như 2 “vai chính” vận hành pipeline game.
Em sẽ viết dưới dạng **spec tính năng + flow + điều kiện quyền** để anh dùng được luôn cho UIUX + backend.

---

## 0. Khung chung cho DEV & QC (nhắc lại rất ngắn)

* **Model game (Mongo)**:

  ```ts
  type GameStatus =
    | "draft"
    | "uploaded"   // đã gửi QC
    | "qc_passed"
    | "qc_failed"
    | "approved"
    | "published"
    | "archived"

  type Game = {
    id: string
    title: string
    ownerId: string
    teamId?: string
    status: GameStatus
    // ...meta khác
  }
  ```

* **Role & quyền chính:**

  * Dev: `"games:view"`, `"games:create"`, `"games:update"`, `"games:submit"`
  * QC: `"games:view"`, `"games:review"`

* **Check quyền:**

  * RBAC (string): `hasPermissionRBAC(user, "games:review")`
  * ABAC (theo game): `hasPermissionABAC(user, "games", "submit", game)`

Tất cả **API** phải check ở server, UI chỉ ẩn/hiện nút.

---

## 1. DEV – Bộ tính năng chi tiết

### DEV-1: My Games – Danh sách game của Dev

**Mục đích:** Dev mở ra là thấy ngay mình đang nợ gì, game nào ở bước nào.

* **Quyền:**

  * RBAC: `"games:view"`
  * ABAC list: lọc theo `ownerId = user.id` (hoặc team).

* **UI:**

  * Route: `/games/my`
  * Filter mặc định: “Owner = tôi”.
  * Cột: Tên game – Môn – Lớp – Trạng thái – Cập nhật gần nhất – Action.
  * Filter thêm: trạng thái, môn, lớp, team.

* **Acceptance Criteria (tóm tắt):**

  * Khi Dev login → vào `/games/my` thấy tất cả game có `ownerId = user.id`.
  * Có thể lọc theo trạng thái (Draft/Uploaded/QC Failed/…).
  * Dev **không thấy** game của người khác (trừ khi anh cho phép xem).

---

### DEV-2: Tạo game mới

**Mục đích:** Dev khởi tạo khung game để bắt đầu làm.

* **Quyền:**

  * RBAC: `"games:create"`.

* **UI:**

  * Nút **“Tạo game mới”** trên `/games/my`.
  * Form:

    * Tên game
    * Môn / Lớp / Unit SGK
    * Loại game (template, skeleton)
    * Độ ưu tiên
  * Submit → tạo Game với:

    * `status = "draft"`
    * `ownerId = user.id`.

* **AC:**

  * Dev có thể tạo game mới nếu có `"games:create"`.
  * Sau khi tạo, game xuất hiện trong My Games với trạng thái `draft`.
  * Nếu thiếu trường bắt buộc → không tạo, hiển thị thông báo lỗi.

---

### DEV-3: Chỉnh sửa metadata game

**Mục đích:** Dev quản lý thông tin học thuật & cấu hình game.

* **Quyền:**

  * RBAC: `"games:update"`
  * ABAC: owner hoặc điều kiện anh đặt
    (vd: chỉ `status ∈ {"draft","uploaded","qc_failed"}`).

* **UI:**

  * Trong `/games/[id]`, tab “Thông tin game”.
  * Form edit: mô tả, tags kỹ năng, link Figma, link sheet nội dung, subject, lớp…

* **AC:**

  * Dev chỉ sửa được game mà `hasPermissionABAC(user,"games","update", game) = true`.
  * Khi lưu, trạng thái không tự đổi (vẫn `draft` / `qc_failed`…).
  * Nếu game đã `approved` hoặc `published` → nút Edit ẩn hoặc disabled.

---

### DEV-4: Upload & kiểm tra build

**Mục đích:** Dev upload bản build game để QC test.

* **Quyền:**

  * RBAC: `"games:update"`
  * ABAC: giống trên (chỉ khi còn trong giai đoạn Dev).

* **UI:**

  * Trong trang detail game, tab “Build”.

    * Kéo thả ZIP hoặc nhập URL.
    * Nút “Upload build”.
  * Sau upload:

    * HIển thị kết quả auto-check (size, cấu trúc, manifest,…).

* **AC:**

  * Dev không thể upload build nếu không có quyền update.
  * Nếu auto-check fail (ví dụ: vượt size limit) → không lưu, báo lỗi rõ.
  * Nếu pass → lưu đường dẫn build, cho preview được.

---

### DEV-5: Self-QA (Checklist tự kiểm)

**Mục đích:** Ép dev tự test trước khi gửi QC, giảm lỗi vặt.

* **Quyền:**

  * RBAC: `"games:update"`
  * ABAC: owner & game trong trạng thái Dev.

* **UI:**

  * Panel “Self-QA” trong trang detail:

    * Checkbox:

      * Đã test âm thanh trên Chrome / Safari / iOS.
      * Đã test UI trên mobile & tablet.
      * Đã chơi hết tất cả màn.
      * Đã đối chiếu nội dung với SGK.
  * Dev tick box, có thể để note.

* **AC:**

  * Trước khi cho phép bấm “Gửi QC”, hệ thống yêu cầu tick tối thiểu X/ Y checklist (ví dụ tất cả).
  * Nếu chưa tick đủ → dialog “Bạn cần hoàn thành checklist trước khi gửi QC”.

---

### DEV-6: Submit game cho QC

**Mục đích:** Chuyển game từ `draft / qc_failed` sang trạng thái chờ QC `uploaded`.

* **Quyền:**

  * RBAC: `"games:submit"`.
  * ABAC: `ownerId = user.id` & `status = "draft"` hoặc `qc_failed` (tuỳ rule anh muốn).

* **UI Flow:**

  * Nút “Gửi QC” ở header trang detail.
  * Click → popup xác nhận:

    * Hiển thị tóm tắt: build version, Self-QA đã hoàn tất.
    * Textbox optional: “Ghi chú cho QC”.
  * Confirm → call `POST /api/games/:id/submit`.

* **AC:**

  * Nếu không đăng nhập → không call được / 401.
  * Nếu không có quyền submit → 403.
  * Nếu game không ở trạng thái phù hợp → 400 (“Chỉ game draft/qc_failed mới được gửi QC”).
  * Thành công:

    * `status` chuyển `uploaded`.
    * Có log “Dev X submitted to QC at …”.
    * Dev thấy status mới và game sẽ biến mất khỏi filter “Draft”.

---

### DEV-7: Xem feedback QC & lịch sử

**Mục đích:** Dev hiểu vì sao game bị từ chối, sửa đúng chỗ.

* **Quyền:**

  * RBAC: `"games:view"`.
  * ABAC: owner được xem lịch sử game mình.

* **UI:**

  * Tab “History & Feedback”:

    * List các lần QC: pass/fail, note, severity.
    * Timeline: Dev submit → QC review → CTO approve → Admin publish.
  * Comment thread với QC.

* **AC:**

  * Dev thấy đầy đủ history của game mình.
  * Có thể phân biệt rõ lần QC gần nhất.
  * Không cho Dev sửa/xoá log QC.

---

### DEV-8: Thông báo (Notifications) cho Dev

**Mục đích:** Dev không phải refresh liên tục mới biết game đã QC xong chưa.

* **Quyền:** mọi dev đã login.

* **Trigger chính:**

  * `qc_failed` → “Game A bị QC yêu cầu sửa.”
  * `qc_passed` → “Game A đã QC đạt, chờ CTO duyệt.”
  * `approved`, `published` → báo để dev biết sản phẩm đã sẵn sàng.

* **UI:**

  * Icon chuông, list notification trong app.
  * Link thẳng tới trang game detail.

* **AC:**

  * Khi trạng thái game thay đổi, dev phụ trách nhận notification.
  * Click notification → tới đúng game.

---

## 2. QC – Bộ tính năng chi tiết

### QC-1: QC Inbox – Hàng đợi game cần test

**Mục đích:** QC có nơi tập trung các game mình cần xử lý.

* **Quyền:**

  * RBAC: `"games:review"`.

* **UI:**

  * Route: `/qc-inbox`.
  * Filter mặc định: `status = "uploaded"`.
  * Cột: Tên game – Môn – Lớp – Dev – `submittedAt` – Số lần QC trước đó.

* **AC:**

  * QC login có `"games:review"` → vào `/qc-inbox` không bị 403.
  * Nếu không có permission → 403 page.
  * Bảng chỉ show game ở trạng thái `uploaded` (và đúng team nếu anh filter theo team).

---

### QC-2: Mở màn review chi tiết

**Mục đích:** QC xem full thông tin và chơi game trực tiếp.

* **Quyền:**

  * RBAC: `"games:view"`, `"games:review"`.
  * ABAC: `hasPermissionABAC(user,"games","view",game)`.

* **UI:**

  * Click một dòng trong Inbox → `/games/[id]?tab=qc`.
  * Layout:

    * Trên: Info game (subject, lớp, mục tiêu).
    * Giữa: iframe preview + chọn thiết bị.
    * Phải: checklist QC + note.

* **AC:**

  * QC chỉ mở được game mà có quyền view + review.
  * Nếu không có quyền → 403/404 phí hợp.

---

### QC-3: Checklist QC chuẩn hóa

**Mục đích:** Chuẩn hoá tiêu chí, tránh bỏ sót.

* **Quyền:**

  * `"games:review"`.

* **UI:**

  * Panel checklist:

    * UI/UX
    * Âm thanh
    * Performance
    * Logic game
    * Độ phù hợp nội dung
  * Mỗi mục:

    * Radio: OK / Warning / Fail.
    * Optional note per mục.

* **AC:**

  * QC có thể tick từng mục.
  * Dữ liệu checklist được lưu cùng bản QC report (để CTO xem sau).
  * Nếu tất cả Fail/Warning mà QC vẫn chọn “QC đạt”, hệ thống có thể cảnh báo (tùy policy).

---

### QC-4: Đánh giá Pass/Fail & ghi note

**Mục đích:** Kết thúc vòng QC.

* **Quyền:**

  * `"games:review"` (RBAC).
  * ABAC: chỉ khi game `status = "uploaded"`.

* **UI Flow:**

  * 2 nút:

    * “QC đạt” → pass.
    * “QC cần sửa” → fail.
  * Nếu chọn “QC cần sửa”:

    * Bắt buộc nhập note tổng quát (lý do chính).

* **AC:**

  * Nếu game không phải `uploaded` → nút disabled hoặc API trả 400.
  * “QC đạt”:

    * `status` → `qc_passed`.
    * Tạo log QC với checklist và note.
    * Gửi notif cho Dev & CTO.
  * “QC cần sửa”:

    * `status` → `qc_failed`.
    * Ghi note bắt buộc.
    * Gửi notif cho Dev.

---

### QC-5: Gắn Severity cho lỗi

**Mục đích:** Phân loại mức độ lỗi để dev ưu tiên.

* **Quyền:** `"games:review"`.

* **UI:**

  * Trong form QC, dropdown:

    * `Severity: Minor / Major / Critical`.
  * Đính kèm vào QC result.

* **AC:**

  * Mỗi lần QC phải chọn 1 severity (ít nhất cho lỗi chính).
  * Lưu trong log, CTO & Dev nhìn được.

---

### QC-6: Đính kèm minh chứng lỗi (screenshot/log)

**Mục đích:** Dev dễ tái hiện & sửa bug.

* **Quyền:** `"games:review"`.

* **UI:**

  * Khu vực “Evidence”:

    * Upload ảnh, video ngắn, file log (nếu cần).
  * Show thumbnail trong history.

* **AC:**

  * QC upload tối thiểu 1 hình khi đánh dấu lỗi UI hoặc logic phức tạp (tùy policy).
  * File được lưu và hiển thị trong lịch sử QC.

---

### QC-7: Danh sách re-test (QC lại)

**Mục đích:** Theo dõi những game đã bị fail, dev đã fix và gửi lại.

* **Quyền:**

  * `"games:review"`.

* **UI:**

  * Trong `/qc-inbox` có tab “Cần QC lại”.

    * Filter game `status = "uploaded"` nhưng có log `qc_failed` trước đó.
  * Hiển thị số lần đã QC (1st, 2nd, 3rd…).

* **AC:**

  * Games bị fail rồi gửi lại sẽ vào tab này.
  * QC nhìn vào biết đây là lần QC thứ mấy, tránh lặp feedback cũ.

---

### QC-8: QC Dashboard – thống kê chất lượng

**Mục đích:** QC & CTO có cái nhìn tổng quan về chất lượng game.

* **Quyền:** `"games:review"` (và có thể `"games:view"`).

* **UI:**

  * Biểu đồ:

    * % QC pass lần 1 / lần 2+/ tháng.
    * Số bug theo loại: UI, audio, performance.
    * Theo dev / team / subject.

* **AC:**

  * Dữ liệu tổng hợp từ log QC.
  * Các filter theo thời gian, subject, dev.

---

## 3. Cách anh triển khai dần

Để dễ implement, anh có thể chia sprint theo “khối”:

1. **Sprint 1 – Khung Auth + My Games + QC Inbox**

   * Login, Guard route.
   * `/games/my` cho Dev.
   * `/qc-inbox` cho QC.
   * API: `GET /api/games/my`, `GET /api/games/qc-inbox`.

2. **Sprint 2 – Game Detail + Submit + Pass/Fail**

   * Trang `/games/[id]` với:

     * Info, preview.
     * Nút “Gửi QC” (Dev).
     * Nút “QC đạt / QC cần sửa” (QC).
   * API: `POST /api/games/:id/submit`, `POST /api/games/:id/qc-result`.

3. **Sprint 3 – Self-QA + Checklist QC + History**

   * Self-QA block cho Dev.
   * Checklist chi tiết cho QC.
   * Tab History chung.

4. **Sprint 4 – Notifications + Dashboard nhẹ**

   * Thông báo cơ bản.
   * 1–2 chart đơn giản cho Dev & QC.

Nếu anh muốn, bước tiếp theo em có thể:

* Viết **user story + acceptance criteria chi tiết** cho từng tính năng DEV-1 → DEV-8 & QC-1 → QC-8 theo format:

  * *As a Dev, I want… so that…*
  * *Given / When / Then…*
    để anh đưa thẳng vào backlog quản lý công việc.
