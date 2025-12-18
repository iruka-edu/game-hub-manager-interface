Dựa trên bộ tính năng rất chi tiết bạn đưa ra cho Dev và QC, mô hình `Game` đơn giản ban đầu (`Game` + `status`) sẽ **không đủ** để đáp ứng các yêu cầu về lịch sử (DEV-7), quản lý build (DEV-4), checklist (DEV-5) và re-test (QC-7).

Để hệ thống vận hành trơn tru và scale được, tôi đề xuất cải tiến **Model** và **Logic** theo hướng **Versioning (Quản lý phiên bản)** và **Structured Reviews (Review có cấu trúc)**.

Dưới đây là phân tích chi tiết:

### 1. Cải thiện Data Model (MongoDB Schema)

Thay vì dồn tất cả vào một collection `Games`, bạn nên tách ra để quản lý vòng đời phát triển.

#### A. Tách biệt "Thông tin chung" và "Phiên bản Build"

Game không chỉ có 1 trạng thái. Dev có thể đang làm `v1.2` (Draft) trong khi QC đang test `v1.1` (Uploaded) và User đang chơi `v1.0` (Published).

**Schema đề xuất:**

```typescript
// 1. Game Collection (Chứa metadata ít thay đổi)
interface Game {
  _id: ObjectId;
  slug: string; // com.iruka.math-game (Unique)
  title: string;
  ownerId: ObjectId; // Dev phụ trách chính
  teamId?: ObjectId;
  
  // Trỏ đến các phiên bản quan trọng
  latestVersionId?: ObjectId;   // Bản mới nhất dev vừa up
  liveVersionId?: ObjectId;     // Bản đang published cho user chơi
  
  // Metadata hiển thị ở Hub
  tags: string[];
  subject: string;
  grade: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// 2. GameVersion Collection (Quan trọng nhất cho Dev & QC)
interface GameVersion {
  _id: ObjectId;
  gameId: ObjectId;
  version: string; // "1.0.0", "1.0.1" (SemVer)
  
  // GCS Path cho bản build này
  storagePath: string; // "games/com.iruka.../1.0.1/"
  entryFile: string;   // "index.html"
  
  // Trạng thái của RIÊNG version này
  status: "draft" | "uploaded" | "qc_processing" | "qc_passed" | "qc_failed" | "published";
  
  // DEV-5: Self-QA Data (Lưu cứng lại tại thời điểm submit)
  selfQAChecklist: {
    testedDevices: boolean;
    testedAudio: boolean;
    gameplayComplete: boolean;
    note?: string;
  };

  // Thông tin người submit
  submittedBy: ObjectId;
  submittedAt: Date;
  
  // Note gửi cho QC (DEV-6)
  releaseNote?: string;
}

```

#### B. Tách biệt "QC Review" thành Collection riêng

Để phục vụ **QC-7 (Re-test)** và **QC-8 (Dashboard)**, bạn không thể chỉ lưu `status="qc_failed"`. Bạn cần lưu một "phiên làm việc" của QC.

```typescript
// 3. QCReview Collection (Lưu kết quả từng lần test)
interface QCReview {
  _id: ObjectId;
  gameId: ObjectId;
  versionId: ObjectId; // Test trên version nào?
  reviewerId: ObjectId; // QC nào test?
  
  startedAt: Date;
  finishedAt: Date;
  
  result: "pass" | "fail";
  severity?: "minor" | "major" | "critical"; // QC-5
  
  // QC-3: Checklist kết quả
  checklist: {
    ui: "ok" | "warning" | "fail";
    audio: "ok" | "warning" | "fail";
    performance: "ok" | "warning" | "fail";
    logic: "ok" | "warning" | "fail";
    content: "ok" | "warning" | "fail";
  };

  // QC-4 & QC-6: Chi tiết lỗi
  note: string;
  attachments: string[]; // URL ảnh/video lỗi trên GCS
}

```

### 2. Cải thiện Logic Quản lý (Business Logic)

Với model mới này, logic backend của bạn sẽ chặt chẽ hơn nhiều:

#### A. Logic Upload & Submit (DEV-4, DEV-6)

* **Vấn đề cũ:** Upload đè lên file cũ -> mất lịch sử.
* **Logic mới:**
1. Mỗi lần Dev upload build mới -> Tạo một document `GameVersion` mới (VD: tăng version từ 1.0.0 lên 1.0.1).
2. Trạng thái `GameVersion` này là `draft`.
3. Khi Dev bấm "Gửi QC" (DEV-6):
* Validate `selfQAChecklist` đã tick đủ chưa.
* Update trạng thái `GameVersion` -> `uploaded`.
* Bắn thông báo vào `QC Inbox`.





#### B. Logic QC Inbox & Review (QC-1, QC-7)

* **Vấn đề cũ:** QC không biết Dev đã sửa lỗi mình báo chưa.
* **Logic mới:**
1. `QC Inbox` query: Tìm tất cả `GameVersion` có `status = "uploaded"`.
2. Hiển thị cột **"Re-test"**: Hệ thống đếm xem `gameId` này đã có bao nhiêu `QCReview` trước đó. Nếu > 0 -> Đánh dấu là "Re-test" để QC lưu ý kỹ hơn các lỗi cũ.



#### C. Logic xử lý kết quả QC (QC-4)

* **Khi QC chọn Pass:**
* Update `GameVersion.status` = `qc_passed`.
* Tạo document `QCReview` với result `pass`.
* (Optional) Tự động kích hoạt flow gửi CTO duyệt.


* **Khi QC chọn Fail:**
* Update `GameVersion.status` = `qc_failed`.
* Tạo document `QCReview` với result `fail`, severity, attachments.
* Dev nhận thông báo. Khi Dev vào xem, Dev sẽ thấy chính xác lỗi của `v1.0.1`.
* Dev **bắt buộc** phải upload bản `v1.0.2` (hoặc update build v1.0.1) để submit lại.



### 3. Quy trình trạng thái (State Machine) đề xuất

Bạn nên cài đặt một State Machine chặt chẽ để tránh update sai trạng thái:

1. **Draft:** Dev tạo, upload, tự test.
* *Next:* `Uploaded` (chỉ khi Self-QA xong).


2. **Uploaded:** Chờ QC nhận việc.
* *Next:* `QC_Processing` (Khi QC bấm "Start Review" - tránh 2 QC cùng test 1 game).


3. **QC_Processing:** QC đang test.
* *Next:* `QC_Passed` hoặc `QC_Failed`.


4. **QC_Failed:** Trả về Dev.
* *Next:* `Uploaded` (Sau khi Dev fix và submit build mới).


5. **QC_Passed:** Chờ duyệt cuối.
* *Next:* `Approved` (CTO duyệt).


6. **Approved:** Sẵn sàng public.
* *Next:* `Published` (Admin bấm nút public).



### 4. Checklist triển khai (Tech Spec bổ sung)

Để hỗ trợ Dev & QC tốt nhất, bạn cần thêm các trường kỹ thuật này vào Model:

1. **`buildSize` (Number):** Lưu trong `GameVersion`.
* *Dùng để:* QC liếc qua biết game nặng hay nhẹ trước khi test performance.
* *Validate:* Chặn ngay ở bước upload nếu > 50MB (ví dụ).


2. **`supportedDevices` (Array):** Lưu trong `Game`.
* *Dùng để:* QC biết cần test trên thiết bị nào (Mobile only hay cả PC?).


3. **`changeLog` (String):** Lưu trong `GameVersion`.
* *Dùng để:* Dev điền "Đã fix lỗi mất âm thanh màn 2". QC đọc cái này để test tập trung (Regression testing).



### Tóm lại

Việc tách **GameVersion** và **QCReview** sẽ giải quyết triệt để các bài toán:

* **Truy vết lỗi:** Biết chính xác lỗi xảy ra ở bản build nào.
* **Thống kê năng suất:** Biết Dev nào hay bị bug (tỷ lệ QC Fail cao), QC nào bắt bug tốt.
* **Tránh conflict:** Dev cứ upload bản mới, QC cứ test bản cũ, không bị ghi đè file.