# Version Update - Status Logic & Code Update Tracking

## Tổng quan

Cập nhật logic xử lý trạng thái khi Dev cập nhật code cho version, và thêm tracking thông tin lần cuối cập nhật code.

## Thay đổi chính

### 1. Thêm fields mới vào GameVersion

```typescript
interface GameVersion {
  // ... existing fields ...
  
  // Code Update Tracking
  lastCodeUpdateAt?: Date;      // Thời điểm cuối cùng code được cập nhật
  lastCodeUpdateBy?: ObjectId;  // User ID người cập nhật code
}
```

### 2. Logic trạng thái khi cập nhật code

#### Quy tắc mới:

**Nếu game CHƯA publish:**
- Giữ nguyên trạng thái hiện tại
- Áp dụng cho: `draft`, `uploaded`, `qc_processing`, `qc_failed`, `qc_passed`, `approved`
- Lý do: Game chưa live, không cần test lại từ đầu

**Nếu game ĐÃ publish:**
- Reset trạng thái về `draft`
- Áp dụng cho: `published`
- Lý do: Game đang live, phải test lại từ đầu để đảm bảo chất lượng

#### So sánh với logic cũ:

| Trạng thái | Logic cũ | Logic mới |
|------------|----------|-----------|
| draft | → draft | → draft (giữ nguyên) |
| uploaded | → draft | → uploaded (giữ nguyên) |
| qc_processing | → draft | → qc_processing (giữ nguyên) |
| qc_failed | → draft | → qc_failed (giữ nguyên) |
| qc_passed | → draft | → qc_passed (giữ nguyên) |
| approved | → draft | → approved (giữ nguyên) |
| **published** | → draft | → **draft (reset)** |
| archived | ❌ Không cho phép | ❌ Không cho phép |

### 3. Hiển thị thông tin cập nhật code

#### Màn hình QC Review (`/console/games/[id]/review`)

Thêm thông tin trong phần "Thông tin game":

```
Cập nhật code lần cuối: 25/12/2024 14:30
```

- Hiển thị với màu xanh dương để dễ nhận biết
- Format: DD/MM/YYYY HH:mm
- Chỉ hiển thị nếu có `lastCodeUpdateAt`

#### Màn hình My Games (`/console/my-games`)

Modal "Cập nhật code" giờ hiển thị 2 box thông tin:

**Box 1 - Lưu ý (Amber):**
- Code cũ sẽ bị ghi đè
- Self-QA checklist sẽ bị xóa
- Cần test và gửi QC lại

**Box 2 - Logic trạng thái (Blue):**
- **Chưa publish:** Giữ nguyên trạng thái hiện tại
- **Đã publish:** Reset về "Nháp" (phải test lại từ đầu)

### 4. Nút "Cập nhật code" hiển thị rộng hơn

#### Trước:
- Chỉ hiển thị cho: `qc_failed`

#### Sau:
- Hiển thị cho: `draft`, `qc_failed`, `uploaded`, `qc_processing`, `qc_passed`, `approved`, `published`
- Không hiển thị cho: `archived`

Lý do: Dev có thể cần cập nhật code ở bất kỳ giai đoạn nào (trừ archived)

## Implementation Details

### GameVersionRepository.patchBuild()

```typescript
async patchBuild(
  id: string, 
  buildSize: number, 
  updatedBy: ObjectId
): Promise<GameVersion | null> {
  // Get current version
  const currentVersion = await this.findById(id);
  
  // Determine new status
  let newStatus = currentVersion.status;
  if (currentVersion.status === "published") {
    newStatus = "draft"; // Reset if published
  }
  // Otherwise keep current status
  
  // Update with new fields
  await this.collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        buildSize,
        status: newStatus,
        selfQAChecklist: { /* cleared */ },
        lastCodeUpdateAt: new Date(),
        lastCodeUpdateBy: updatedBy,
        updatedAt: new Date(),
      },
    }
  );
}
```

### API Endpoint Changes

**`POST /api/games/versions/[id]/update-code`**

Request:
```json
{
  "buildSize": 1234567
}
```

Response includes new fields:
```json
{
  "success": true,
  "version": {
    "_id": "...",
    "status": "qc_failed", // or "draft" if was published
    "lastCodeUpdateAt": "2024-12-25T14:30:00.000Z",
    "lastCodeUpdateBy": "user_id",
    // ... other fields
  }
}
```

Audit log includes:
```json
{
  "action": "GAME_VERSION_UPDATE_CODE",
  "changes": [
    { "field": "buildSize", "oldValue": 1000000, "newValue": 1234567 },
    { "field": "status", "oldValue": "published", "newValue": "draft" },
    { "field": "lastCodeUpdateAt", "oldValue": null, "newValue": "2024-12-25T14:30:00.000Z" }
  ],
  "metadata": {
    "wasPublished": true,
    "statusKept": false
  }
}
```

## User Workflows

### Workflow 1: Cập nhật game đang QC Failed

```
1. Game status: qc_failed
2. Dev clicks "Cập nhật code"
3. Upload new ZIP
4. Status: qc_failed (giữ nguyên)
5. Self-QA: Cleared
6. lastCodeUpdateAt: Updated
7. Dev completes Self-QA
8. Dev submits to QC
```

### Workflow 2: Cập nhật game đã Published

```
1. Game status: published
2. Dev clicks "Cập nhật code"
3. Modal shows warning: "Đã publish → Reset về Nháp"
4. Upload new ZIP
5. Status: draft (reset)
6. Self-QA: Cleared with note "Game đã publish nên phải test lại từ đầu"
7. lastCodeUpdateAt: Updated
8. Dev must test from beginning
9. Dev completes Self-QA
10. Dev submits to QC
11. Goes through full QC → Approval → Publish cycle again
```

### Workflow 3: Cập nhật game đang Uploaded (chờ QC)

```
1. Game status: uploaded
2. Dev clicks "Cập nhật code"
3. Upload new ZIP
4. Status: uploaded (giữ nguyên)
5. Self-QA: Cleared
6. lastCodeUpdateAt: Updated
7. QC will see updated timestamp
8. Dev completes Self-QA
9. Game stays in QC queue
```

## Benefits

### 1. Linh hoạt hơn
- Dev có thể cập nhật code ở nhiều giai đoạn hơn
- Không bị giới hạn chỉ ở draft/qc_failed

### 2. Bảo vệ game đã publish
- Game published phải test lại từ đầu
- Đảm bảo chất lượng cho game đang live

### 3. Tracking tốt hơn
- QC/CTO biết được khi nào code được cập nhật
- Audit trail đầy đủ hơn

### 4. UX rõ ràng hơn
- Modal giải thích logic trạng thái
- Dev hiểu được hậu quả trước khi cập nhật

## Testing Checklist

- [ ] Update code cho draft → status giữ nguyên
- [ ] Update code cho qc_failed → status giữ nguyên
- [ ] Update code cho uploaded → status giữ nguyên
- [ ] Update code cho qc_processing → status giữ nguyên
- [ ] Update code cho qc_passed → status giữ nguyên
- [ ] Update code cho approved → status giữ nguyên
- [ ] Update code cho published → status reset về draft
- [ ] Cannot update archived version
- [ ] lastCodeUpdateAt được lưu đúng
- [ ] lastCodeUpdateBy được lưu đúng
- [ ] QC review page hiển thị lastCodeUpdateAt
- [ ] Modal hiển thị logic trạng thái đúng
- [ ] Self-QA note khác nhau cho published vs non-published
- [ ] Audit log ghi đầy đủ thông tin

## Files Modified

1. `src/models/GameVersion.ts` - Added fields, updated patchBuild logic
2. `src/pages/api/games/versions/[id]/update-code.ts` - Updated to pass updatedBy, handle all statuses
3. `src/pages/console/games/[id]/review.astro` - Display lastCodeUpdateAt
4. `src/pages/console/my-games.astro` - Updated modal, show button for more statuses
5. `docs/version-update-status-logic.md` - This documentation

## Migration Notes

Existing versions without `lastCodeUpdateAt` will show nothing (field is optional).
When they update code next time, the field will be populated.

No database migration needed - fields are optional.
