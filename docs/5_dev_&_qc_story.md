Ok, mình làm luôn “bộ backlog chuẩn” cho **DEV** và **QC** như anh nói nhé.
Em sẽ viết theo format:

* **Feature ID**
* **User story** (As a / Với vai trò…)
* **Acceptance Criteria** (Given / When / Then – em viết kiểu bullet, dễ đọc, dễ đưa vào task)

---

## I. DEV – Tính năng & User Story

### DEV-1 – My Games (Danh sách game của tôi)

**User Story**
Với vai trò **Dev**, tôi muốn xem danh sách tất cả các game mà tôi phụ trách, kèm trạng thái và ngày cập nhật, để biết mình đang nợ gì và ưu tiên việc.

**Acceptance Criteria**

* Khi Dev đã đăng nhập:

  * Vào `/games/my` hiển thị danh sách game có `ownerId = user.id`.
* Mặc định:

  * Danh sách được sort theo `updatedAt` (mới nhất trên cùng).
* Dev có thể:

  * Lọc theo `status` (Draft / Uploaded / QC Failed / QC Passed / Approved / Published / Archived).
  * Tìm theo tên game.
* Nếu Dev không có quyền `games:view`:

  * Hệ thống trả về 403 / trang “Không có quyền truy cập”.

---

### DEV-2 – Create Game (Tạo game mới)

**User Story**
Với vai trò **Dev**, tôi muốn tạo một game mới với thông tin cơ bản (môn, lớp, unit, loại mini-game…), để bắt đầu triển khai nội dung và code.

**Acceptance Criteria**

* Trên `/games/my` có nút **“Tạo game mới”** nếu user có `"games:create"`.
* Khi bấm:

  * Hiển thị form với các trường bắt buộc: `title`, `subject`, `grade`, `unit`, `gameType/template`.
* Khi bấm “Lưu”:

  * Nếu thiếu trường bắt buộc → không tạo, hiển thị lỗi rõ ràng.
  * Nếu hợp lệ:

    * Tạo record `Game`:

      * `ownerId = user.id`
      * `status = "draft"`
      * `createdAt`, `updatedAt` được set.
    * Redirect sang `/games/[id]` của game mới, hoặc quay lại `/games/my`.
* Game mới xuất hiện trong danh sách My Games với status `draft`.

---

### DEV-3 – Edit Metadata (Sửa thông tin game)

**User Story**
Với vai trò **Dev**, tôi muốn chỉnh sửa thông tin học thuật và cấu hình game, để đảm bảo game đúng với chương trình học và yêu cầu nội bộ.

**Acceptance Criteria**

* Trên trang `/games/[id]`, tab “Thông tin game”:

  * Hiển thị form các trường: `title`, `description`, `subject`, `grade`, `unit`, `skills`, `figmaLink`, `contentSheetLink`, `priority`… (tuỳ anh thiết kế).
* Nút **“Lưu thay đổi”** chỉ hiển thị nếu:

  * `hasPermissionABAC(user, "games", "update", game)` trả về `true`.
* Khi Dev sửa và lưu:

  * Nếu game ở trạng thái không cho phép (ví dụ `approved` hoặc `published`):

    * Backend từ chối (400) → UI show thông báo: “Game đã được duyệt/xuất bản, không thể chỉnh sửa thông tin.”
  * Nếu cho phép:

    * Lưu các trường thay đổi.
    * Cập nhật `updatedAt`.
* Dev không thể thay đổi các field hệ thống như `status`, `ownerId` trực tiếp từ form này (chỉ thay đổi qua các action đúng flow).

---

### DEV-4 – Upload Build & Auto-check (Upload bản build game)

**User Story**
Với vai trò **Dev**, tôi muốn upload bản build game (ZIP/URL) và hệ thống auto-check một số tiêu chí kỹ thuật, để phát hiện lỗi cơ bản trước khi gửi QC.

**Acceptance Criteria**

* Trong `/games/[id]`, tab “Build”:

  * Có khu vực drag & drop file ZIP hoặc nhập URL build.
  * Nút **“Upload build”** chỉ hiển thị nếu Dev có quyền `"games:update"` và ABAC cho phép (status phù hợp).
* Sau khi upload:

  * Backend chạy các check tối thiểu (ví dụ: cấu trúc thư mục hợp lệ, dung lượng không vượt ngưỡng config).
  * Nếu check fail:

    * Build không được gắn vào game.
    * Dev thấy danh sách lỗi chi tiết (vd: “Thiếu file manifest.json”, “Dung lượng vượt 15MB”…).
  * Nếu check pass:

    * Lưu thông tin build (URL, size, timestamp).
    * Cho phép preview trong iframe (ở tab Preview).
* Nếu Dev không có quyền update:

  * Nút upload không hiển thị, hoặc click → báo lỗi quyền.

---

### DEV-5 – Self-QA Checklist (Tự kiểm tra trước QC)

**User Story**
Với vai trò **Dev**, tôi muốn tick một checklist tự kiểm tra trước khi gửi game cho QC, để hạn chế lỗi cơ bản và nâng cao chất lượng.

**Acceptance Criteria**

* Trong `/games/[id]`, tại panel “Self-QA”:

  * Danh sách checkbox (ví dụ):

    * Đã test âm thanh trên các trình duyệt mục tiêu.
    * Đã test trên mobile & tablet.
    * Đã chơi hết tất cả màn, không bị tắc.
    * Đã đối chiếu nội dung với SGK.
  * Field “Ghi chú cho QC” (tuỳ chọn).
* Trạng thái checklist được lưu theo game & version.
* Trước khi cho phép `submit`:

  * Hệ thống kiểm tra:

    * Nếu chưa tick đủ X/ Y mục (ví dụ yêu cầu tick tất cả):

      * Nút “Gửi QC” vẫn click được nhưng sẽ bật dialog cảnh báo, hoặc
      * Nút “Gửi QC” disabled (tuỳ policy, anh quyết, nhưng phải rõ ràng trong spec).
* QC nhìn được kết quả Self-QA khi review game.

---

### DEV-6 – Submit to QC (Gửi QC)

**User Story**
Với vai trò **Dev**, tôi muốn gửi game của mình tới QC theo đúng quy trình, để chuyển sang bước kiểm thử chính thức.

**Acceptance Criteria**

* Nút **“Gửi QC”** hiển thị ở header `/games/[id]` nếu:

  * RBAC: user có `"games:submit"`.
  * ABAC: `hasPermissionABAC(user, "games", "submit", game)` là `true`
    (ví dụ: `ownerId = user.id` & `status in ["draft", "qc_failed"]`).
* Khi Dev bấm:

  * Popup xác nhận hiện ra:

    * Tóm tắt Self-QA (mục nào đã tick).
    * Ghi chú gửi QC (optional).
  * Dev confirm → FE call `POST /api/games/:id/submit`.
* Backend:

  * Nếu không login → 401.
  * Nếu không có quyền → 403.
  * Nếu `status` không phải `draft` / `qc_failed` → 400.
  * Nếu hợp lệ:

    * Cập nhật `status = "uploaded"`.
    * Lưu `submittedAt`, note của Dev.
    * Ghi log: “Dev X submitted to QC at …”.
* Sau khi submit:

  * UI cập nhật chip trạng thái thành `Uploaded`.
  * Game xuất hiện trong `QC Inbox`.
  * Dev nhận thông báo (notification).

---

### DEV-7 – View Feedback & History (Xem lịch sử & feedback)

**User Story**
Với vai trò **Dev**, tôi muốn xem toàn bộ lịch sử QC, comment và thay đổi trạng thái của game, để sửa lỗi chính xác và tránh nhầm lẫn.

**Acceptance Criteria**

* Trong `/games/[id]`, tab “History & Feedback”:

  * Hiển thị timeline:

    * Tạo game → Submit → QC pass/fail → Approve → Publish…
  * Mỗi entry có:

    * Thời gian, người thực hiện, action, note.
* Dev có thể:

  * Xem tất cả các lần QC (pass/fail, severity, evidence).
  * Xem comment thread giữa Dev, QC, CTO.
* Dev **không được** sửa hoặc xoá log QC.
* Nếu Dev không có quyền view (ABAC) game này:

  * Toàn bộ tab ẩn hoặc trả 403 khi truy cập trực tiếp.

---

### DEV-8 – Notifications (Thông báo cho Dev)

**User Story**
Với vai trò **Dev**, tôi muốn được nhận thông báo khi game của mình được QC xử lý hoặc được duyệt/publish, để không phải vào kiểm tra thủ công liên tục.

**Acceptance Criteria**

* Khi trạng thái game thay đổi từ:

  * `uploaded → qc_passed`
  * `uploaded → qc_failed`
  * `qc_passed → approved`
  * `approved → published`
* Hệ thống tạo notification cho:

  * `ownerId` (Dev chính).
* UI:

  * Có icon chuông hiển thị số thông báo chưa đọc.
  * List notification có:

    * Tiêu đề: “Game [Tên] đã QC đạt / cần sửa / được duyệt / đã publish”.
    * Thời gian.
    * Link tới `/games/[id]`.
* Khi Dev click vào một notification:

  * Đánh dấu notification là đã đọc.
  * Chuyển sang trang detail game tương ứng.

---

## II. QC – Tính năng & User Story

### QC-1 – QC Inbox (Danh sách game chờ QC)

**User Story**
Với vai trò **QC**, tôi muốn có một danh sách game chờ QC, để biết rõ mình cần review những gì và ưu tiên theo deadline.

**Acceptance Criteria**

* Route: `/qc-inbox`.
* Nếu user chưa login → redirect `/login?redirect=/qc-inbox`.
* Nếu login nhưng không có permission `"games:review"`:

  * Hiển thị trang 403.
* Nếu đủ quyền:

  * Bảng hiển thị các game `status = "uploaded"` (có thể filter theo team).
  * Cột: Tên game – Môn – Lớp – Dev – `submittedAt` – Số lần QC trước đó – Severity gần nhất (nếu có).
  * Có filter:

    * Theo môn, lớp, mức ưu tiên, dev, time.

---

### QC-2 – Open Review View (Mở màn hình review chi tiết)

**User Story**
Với vai trò **QC**, tôi muốn mở từng game trong chế độ review, có đầy đủ thông tin và preview, để kiểm thử nhanh và chính xác.

**Acceptance Criteria**

* Khi QC click 1 dòng trong Inbox:

  * Điều hướng tới `/games/[id]?tab=qc`.
* Trang review:

  * Hiển thị:

    * Info game (subject, grade, unit, mục tiêu).
    * Chip trạng thái hiện tại (Uploaded).
    * Preview game (iframe).
    * Panel checklist QC + feedback.
* Nếu game không còn ở trạng thái `uploaded` (vừa được người khác xử lý trước):

  * UI hiển thị message: “Game này đã được xử lý, vui lòng reload inbox.”
* Nếu QC cố truy cập game mà họ không có quyền view/review:

  * Server trả về 403 → UI hiển thị trang “Không có quyền”.

---

### QC-3 – QC Checklist (Checklist kiểm thử)

**User Story**
Với vai trò **QC**, tôi muốn có checklist chuẩn hóa để đánh giá game, tránh bỏ sót và đảm bảo chất lượng đồng nhất.

**Acceptance Criteria**

* Trong tab QC:

  * Có các hạng mục checklist (config được ở server):

    * UI/UX
    * Âm thanh
    * Performance
    * Gameplay logic
    * Nội dung, ngôn ngữ
  * Mỗi mục có lựa chọn: “OK”, “Warning”, “Fail”.
  * Mỗi mục có ô ghi chú text (tuỳ chọn).
* Checklist được lưu khi:

  * QC chọn Pass/Fail và gửi kết quả.
  * Hoặc QC bấm “Lưu tạm” (draft QC) nếu anh muốn có chức năng đó.
* CTO/CEO có thể xem lại checklist này trong tab History.

---

### QC-4 – Decision: Pass / Fail (Kết luận QC)

**User Story**
Với vai trò **QC**, tôi muốn đánh dấu game là đạt hoặc cần sửa, kèm lý do rõ ràng, để dev hiểu cần làm gì tiếp theo.

**Acceptance Criteria**

* Trong tab QC:

  * 2 nút chính:

    * **“QC đạt”**
    * **“QC cần sửa”**
* Điều kiện:

  * Chỉ hiển thị/khả dụng nếu:

    * User có `"games:review"` (RBAC).
    * `hasPermissionABAC(user, "games", "review", game)` là `true`.
    * `status` hiện tại của game = `"uploaded"`.
* Khi chọn **“QC cần sửa”**:

  * Bắt buộc nhập note tổng quát (lý do fail).
  * Nếu không nhập → UI báo lỗi, không cho gửi.
* Backend:

  * Nếu fail:

    * `status` → `qc_failed`.
    * Ghi log QC (checklist, note, severity, evidence).
    * Gửi notification cho Dev.
  * Nếu pass:

    * `status` → `qc_passed`.
    * Ghi log QC tương tự.
    * Gửi notification cho Dev & CTO.
* Sau khi QC gửi:

  * Game biến mất khỏi Inbox (tab chờ QC).
  * QC có thể thấy trong lịch sử hoặc tab khác (QC history).

---

### QC-5 – Severity & Evidence (Mức độ lỗi & minh chứng)

**User Story**
Với vai trò **QC**, tôi muốn gắn mức độ nghiêm trọng cho lỗi và đính kèm minh chứng, để dev và CTO hiểu rõ ảnh hưởng và ưu tiên.

**Acceptance Criteria**

* Trong form QC:

  * Field `Severity`: dropdown `Minor / Major / Critical`.
  * Khu vực upload:

    * Ảnh chụp màn hình (screenshot).
    * Video ngắn (tối đa X MB).
    * File log (tùy anh cho phép).
* Khi gửi QC result:

  * Severity được lưu cùng kết quả QC.
  * Link file evidence được lưu vào log.
* Dev:

  * Nhìn được severity và xem/ tải evidence.
* Nếu QC chưa chọn severity:

  * UI cảnh báo, gợi ý chọn (tùy policy: bắt buộc/nên chọn).

---

### QC-6 – Re-test List (Danh sách cần QC lại)

**User Story**
Với vai trò **QC**, tôi muốn thấy danh sách các game đã từng bị QC fail và dev đã sửa, để re-test có thứ tự ưu tiên.

**Acceptance Criteria**

* Trong `/qc-inbox`:

  * Tab hoặc filter “Cần QC lại”.
  * Hiển thị các game:

    * Có lịch sử `qc_failed` trước đó.
    * Hiện tại `status = "uploaded"` (dev đã submit lại).
* Cột hiển thị:

  * Tên game – Dev – Lần QC thứ mấy (1, 2, 3…) – Severity gần nhất – Ngày submit lại.
* QC có thể lọc theo:

  * Số lần fail (ví dụ: >2 lần).
* Khi QC xử lý xong:

  * Nếu pass → `qc_passed`, game rời khỏi tab này.
  * Nếu tiếp tục fail → vẫn ở tab này với số lần QC tăng lên.

---

### QC-7 – QC Dashboard (Tổng quan chất lượng)

**User Story**
Với vai trò **QC Lead / CTO**, tôi muốn dashboard QC để theo dõi chất lượng game theo thời gian, để điều chỉnh quy trình và training dev.

**Acceptance Criteria**

* Route: `/qc-dashboard` (hoặc một tab trong dashboard lớn).
* Chỉ user có `"games:review"` (và có thể cần quyền cao hơn, tuỳ anh) truy cập được.
* Dashboard hiển thị:

  * Tỉ lệ QC pass lần 1 / lần n theo tháng.
  * Số game QC theo môn, lớp, loại game.
  * Top 3 lý do QC fail nhiều nhất.
* Có filter:

  * Theo khoảng thời gian.
  * Theo dev.
  * Theo subject / grade.
* Dữ liệu lấy từ log QC, không phải từ cảm tính.

---

### QC-8 – Communication with Dev (Trao đổi với Dev)

**User Story**
Với vai trò **QC**, tôi muốn ghi chú và trao đổi với Dev ngay trên màn hình game, để tránh phải nhắn qua nhiều kênh và thất lạc thông tin.

**Acceptance Criteria**

* Trong `/games/[id]`, panel “Comment / Trao đổi”:

  * QC có thể:

    * Tạo comment mới.
    * Mention `@dev` hoặc `@cto`.
  * Dev có thể trả lời comment.
* Comment được gắn:

  * Người viết, thời gian, context (vòng QC lần thứ mấy).
* Khi QC tạo comment:

  * Dev nhận notification in-app.
* Quyền:

  * Ai có `games:view` với game này đều đọc được comment.
  * Chỉ người tạo hoặc role cao (QC lead/CTO) mới có thể sửa/xóa comment (tuỳ anh quy định).

---