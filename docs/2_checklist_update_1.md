Được anh. Em **rút gọn tối đa**, chỉ còn **danh sách việc phải làm cho Game Management**, mỗi ý **1–2 dòng**, đúng yêu cầu “xuống dòng ít nhất”.

---

## GAME MANAGEMENT — VIỆC CẦN LÀM (ASTRO + MONGODB)

### 1. Chuẩn hoá dữ liệu Mongo

* `games`: gameId, title, ownerId, responsibleUserId, status
* `game_versions`: versionId, gameId, entryUrl, gcsPath, status, manifest, validationResult, preflightReport, qaReport
* `qc_reports`: versionId, qcUserId, decision, checklist, notes, createdAt
  → UI **luôn đọc từ Mongo**, không đọc GCS trực tiếp

---

### 2. Gắn SDK core game vào GM

* Tạo layer `gm_contract` dùng SDK: `validateManifest`, `preflight`, `normalizeResult`, `measureHandshake`
* Game Management & Game Hub **dùng chung logic**, không copy code

---

### 3. Upload & tạo version (luồng cốt lõi)

* `/console/my-games` → tạo game → redirect `/upload?gameId=…`
* Upload zip → push GCS `games/{gameId}/versions/{versionId}/` → tạo `game_versions` record
* Lưu `entryUrl + gcsPath + status=uploaded` → quay lại My Games thấy ngay

---

### 4. Mở rộng form upload (manifest)

* Nhập tối thiểu: `gameType, subject, grade, lessonNo, lessonSummary, textbook, theme_primary, thumbnailUrl`
* Optional: `theme_secondary[], context_tags[], difficulty_levels[]`
* Lưu thẳng vào `game_versions.manifest`

---

### 5. Manifest validator (auto)

* Chạy `validateManifest(manifest)` khi tạo version
* Lưu `validationResult (ok/errors)`
* Fail = **blocker**, QC không được “QC đạt”

---

### 6. Preflight tự động cho QC

* Check: schema, network entryUrl, CSP/iframe, handshake INIT→READY
* Lưu `preflightReport`
* UI hiển thị bảng Pass/Fail + latency

---

### 7. QC Console & Review

* Inbox: list version `status=uploaded`
* Review screen: iframe game + Auto-checks + Manual checklist
* Auto-check fail blocker → disable “QC đạt”

---

### 8. QC submit & status

* QC submit → tạo `qc_reports`
* Update `game_versions.status`: `qc_passed` hoặc `qc_failed`
* Ghi log timeline

---

### 9. Result Preview (chuẩn bị cho BE)

* Tab “Result preview”: mock raw → `normalizeResult()`
* Hiển thị core fields + payload
* Thiếu field optional = warning, không crash

---

### 10. Handshake KPI

* Log INIT/READY/QUIT/COMPLETE khi QC test
* Tính KPI: INIT→READY ≤3s, QUIT→COMPLETE ≤1.5s
* Lưu `qaReport.timing`

---

### 11. iOS checklist (QC verify)

* Không autoplay audio trước gesture
* Không “ảnh trắng”, gesture drag/trace ok
* Lưu vào `qaReport.iosPack`

---

### 12. Idempotency test (chuẩn BE)

* Gửi result lặp cùng `attemptId`
* Verify chỉ 1 record được lưu (hoặc overwrite)
* Dùng cho test, chưa cần production

---

### 13. Đồng bộ GCS – Mongo

* Cron/job check `entryUrl` 200
* Nếu mất file → flag `buildStatus=missing_asset`
* UI hiển thị warning

---

### 14. Fix UI hiện tại

* Activate/delete/create version cập nhật đúng dashboard
* Mapping status đúng trên thư viện
* Dev/QC/CTO/Admin console load đúng data thật

---

## THỨ TỰ LÀM (KHÔNG LAN MAN)

1. Upload + version + manifest
2. Validator + Preflight
3. QC Inbox + Review + Submit
4. Result preview + KPI
5. iOS checklist + idempotency
6. GCS–Mongo consistency

---

Nếu anh cần, bước tiếp em có thể **chuyển danh sách này thành checklist dev/QA 1 trang A4** hoặc **Jira ticket rút gọn** để giao việc ngay.
