# Fix: Upload Code Endpoint

## Problem

Khi cập nhật code game, gặp lỗi:
```
Có lỗi xảy ra: Unexpected token '<', "<!doctype "... is not valid JSON
/api/games/upload-version
Request Method: POST
Status Code: 404 Not Found
```

## Root Cause

1. **Endpoint không đúng:** Code cũ gọi `/api/games/upload-version` nhưng endpoint thực tế là `/api/games/[id]/upload-version`

2. **Logic phức tạp:** Endpoint `/api/games/[id]/upload-version` được thiết kế để tạo version mới, không phải update version hiện có

3. **Thiếu xử lý file upload:** Endpoint `/api/games/versions/[id]/update-code` chỉ nhận `buildSize`, không xử lý file upload

## Solution

Tạo endpoint mới **`/api/games/versions/[id]/upload-code`** để xử lý toàn bộ flow:

### Features

1. **Upload ZIP file**
   - Nhận file ZIP từ FormData
   - Validate file type (.zip only)
   - Validate file size (max 100MB)

2. **Extract & Upload to GCS**
   - Extract ZIP file
   - Tìm index.html để xác định root folder
   - Normalize paths
   - Upload tất cả files lên GCS (overwrite existing)

3. **Update Version Metadata**
   - Gọi `patchBuild()` với logic trạng thái thông minh
   - Lưu `lastCodeUpdateAt` và `lastCodeUpdateBy`
   - Audit logging đầy đủ

### API Endpoint

**`POST /api/games/versions/[id]/upload-code`**

**Request:**
```
Content-Type: multipart/form-data

file: [ZIP file]
```

**Response:**
```json
{
  "success": true,
  "version": {
    "_id": "...",
    "status": "qc_failed", // or "draft" if was published
    "buildSize": 1234567,
    "lastCodeUpdateAt": "2024-12-26T...",
    "lastCodeUpdateBy": "user_id",
    // ... other fields
  },
  "filesUploaded": 42
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error info"
}
```

### Validations

1. ✅ User authentication
2. ✅ Version exists
3. ✅ File provided
4. ✅ File is .zip
5. ✅ File size <= 100MB
6. ✅ ZIP contains index.html
7. ✅ Files extracted successfully

### Flow

```
1. User selects ZIP file
2. Frontend validates file type & size
3. POST to /api/games/versions/[id]/upload-code
4. Backend extracts ZIP
5. Backend uploads files to GCS (overwrites old files)
6. Backend calls patchBuild() to update metadata
7. Backend logs audit entry
8. Frontend reloads page
```

## Files Changed

### New Files
1. `src/pages/api/games/versions/[id]/upload-code.ts` - New unified endpoint

### Deleted Files
1. `src/pages/api/games/versions/[id]/update-code.ts` - Old endpoint (logic merged into upload-code)

### Modified Files
1. `src/pages/console/my-games.astro` - Updated JavaScript to use new endpoint

## Code Changes

### Before (my-games.astro)
```javascript
// Two-step process:
// 1. Upload to /api/games/upload-version (WRONG PATH!)
// 2. Update metadata to /api/games/versions/[id]/update-code

const formData = new FormData();
formData.append('file', file);
formData.append('gameId', currentUpdateGameId);
formData.append('versionId', currentUpdateVersionId);

const uploadResponse = await fetch(`/api/games/upload-version`, { // ❌ 404
  method: 'POST',
  body: formData
});

const updateResponse = await fetch(`/api/games/versions/${currentUpdateVersionId}/update-code`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ buildSize: file.size })
});
```

### After (my-games.astro)
```javascript
// One-step process: Upload + Update in single endpoint

const formData = new FormData();
formData.append('file', file);

const uploadResponse = await fetch(`/api/games/versions/${currentUpdateVersionId}/upload-code`, { // ✅
  method: 'POST',
  body: formData
});

// Done! No second request needed
```

## Benefits

### 1. Simpler Flow
- One endpoint instead of two
- Less error-prone
- Atomic operation (upload + update together)

### 2. Better Error Handling
- Single point of failure
- Clearer error messages
- Rollback easier if needed

### 3. Complete Feature
- Handles file upload
- Extracts ZIP
- Uploads to GCS
- Updates metadata
- Logs audit trail
- All in one place

## Testing

### Test Cases

1. ✅ Upload valid ZIP file
2. ✅ Upload non-ZIP file (should fail)
3. ✅ Upload file > 100MB (should fail)
4. ✅ Upload ZIP without index.html (should fail)
5. ✅ Upload to draft version (status unchanged)
6. ✅ Upload to qc_failed version (status unchanged)
7. ✅ Upload to published version (status → draft)
8. ✅ lastCodeUpdateAt saved correctly
9. ✅ Files overwrite existing files in GCS
10. ✅ Audit log complete

### Manual Test

```bash
# 1. Create a test ZIP with index.html
# 2. Go to /console/my-games
# 3. Find a game with qc_failed status
# 4. Click "Cập nhật code"
# 5. Select ZIP file
# 6. Click "Xác nhận cập nhật"
# 7. Should see "Đang upload..."
# 8. Page should reload
# 9. Check QC review page for lastCodeUpdateAt
```

## Migration Notes

**No migration needed!**
- New endpoint is completely separate
- Old endpoint deleted (wasn't working anyway)
- Frontend updated to use new endpoint
- Backward compatible (no database changes)

## Related Documentation

1. `docs/version-update-status-logic.md` - Status logic details
2. `docs/FINAL_UPDATE_SUMMARY.md` - Overall feature summary
3. `docs/FIX_UPLOAD_CODE_ENDPOINT.md` - This document

## Conclusion

Lỗi đã được fix bằng cách:
1. ✅ Tạo endpoint mới `/api/games/versions/[id]/upload-code`
2. ✅ Xử lý toàn bộ flow upload + update trong 1 endpoint
3. ✅ Xóa endpoint cũ không hoạt động
4. ✅ Cập nhật frontend để sử dụng endpoint mới

Giờ có thể cập nhật code game thành công! 🎉
