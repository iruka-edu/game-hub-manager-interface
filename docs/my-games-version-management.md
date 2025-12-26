# My Games - Version Management Implementation

## Overview
Added inline version management to the My Games console page (`/console/my-games`) to allow Devs to:
1. View version history for each game
2. Update/replace code for existing versions (when status = `qc_failed` or `draft`)
3. Create new versions (existing functionality)

## Key Features

### 1. Version History Toggle
- Added dropdown arrow button next to version number in each game row
- Click to expand/collapse version history inline
- Shows all versions with status badges, dates, and file sizes
- Cached for performance (no repeated API calls)

### 2. Update Code Button (for QC Failed Games)
- New "Cập nhật code" button appears when game status = `qc_failed`
- Opens modal with file upload for ZIP file
- Replaces existing version files instead of creating new version
- Automatically:
  - Resets status to `draft`
  - Clears Self-QA checklist
  - Updates build size
  - Preserves version number (no increment)

### 3. UI Improvements
- Shortened "Upload bản mới" to "Bản mới" for better layout
- Added amber-colored "Cập nhật code" button to distinguish from other actions
- Warning message in update modal explaining consequences

## Implementation Details

### New API Endpoints

#### 1. `POST /api/games/versions/[id]/update-code`
**Purpose:** Update/replace code files for an existing version

**Request Body:**
```json
{
  "buildSize": 1234567
}
```

**Validation:**
- Only allows updates for versions with status `draft` or `qc_failed`
- Requires valid version ID
- Requires buildSize parameter

**Actions:**
- Calls `GameVersionRepository.patchBuild()` which:
  - Updates buildSize
  - Resets status to `draft`
  - Clears Self-QA checklist with note "Bản build đã được cập nhật (Patch)"
  - Updates timestamp

**Response:**
```json
{
  "success": true,
  "version": { /* updated version object */ }
}
```

**Audit Log:** Records `GAME_VERSION_UPDATE_CODE` action

#### 2. `GET /api/games/[id]/versions`
**Purpose:** Get all versions for a game

**Response:**
```json
{
  "versions": [
    {
      "_id": "...",
      "gameId": "...",
      "version": "1.0.0",
      "status": "qc_failed",
      "buildSize": 1234567,
      "releaseNote": "...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### UI Components

#### Version History Row
- Hidden by default
- Expands below game row when toggle button clicked
- Shows all versions in chronological order
- Each version displays:
  - Version number (font-mono)
  - Status badge (color-coded)
  - Release note (if available)
  - Created date
  - Build size

#### Update Code Modal
- File upload input (accepts .zip only)
- Warning box explaining consequences:
  - Old code will be overwritten
  - Status resets to "Draft"
  - Self-QA checklist cleared
  - Need to test and submit to QC again
- Validation:
  - File type must be .zip
  - Max file size: 100MB
- Upload flow:
  1. Upload file to GCS via `/api/games/upload-version`
  2. Update version metadata via `/api/games/versions/[id]/update-code`
  3. Reload page on success

### Button Logic

For each game row, buttons appear based on latest version status:

| Status | Buttons Available |
|--------|------------------|
| `draft` | Sửa, Gửi QC |
| `qc_failed` | Sửa, Cập nhật code, Gửi QC, Bản mới |
| `uploaded` | Xem chi tiết |
| `qc_processing` | Xem chi tiết |
| `qc_passed` | Xem chi tiết |
| `approved` | Xem chi tiết |
| `published` | Xem chi tiết |

## User Workflow

### Scenario: QC Failed - Need to Fix Code

**Option 1: Update Existing Version (Recommended for minor fixes)**
1. Dev sees game with status "QC cần sửa"
2. Clicks "Cập nhật code" button
3. Uploads new ZIP file
4. System replaces old files, resets to draft
5. Dev tests game
6. Dev completes Self-QA checklist
7. Dev clicks "Gửi QC" to resubmit

**Option 2: Create New Version (For major changes)**
1. Dev sees game with status "QC cần sửa"
2. Clicks "Bản mới" button
3. Redirects to `/games/[id]/new-version`
4. Creates new version (e.g., 1.0.1 → 1.0.2)
5. Uploads new code
6. Submits to QC

## Technical Notes

### GameVersionRepository.patchBuild()
This existing method is used for the update code functionality:
```typescript
async patchBuild(id: string, buildSize: number): Promise<GameVersion | null> {
  // Updates buildSize
  // Resets status to 'draft'
  // Clears Self-QA with note about patch
  // Updates timestamp
}
```

### Version History Caching
- Client-side cache using `Map<string, any[]>`
- Prevents repeated API calls when toggling same game
- Cache persists until page reload

### File Upload Flow
The update code feature reuses the existing upload infrastructure:
1. Frontend uploads ZIP to `/api/games/upload-version` (existing endpoint)
2. GCS stores file at same path (overwrites old files)
3. Frontend calls new `/api/games/versions/[id]/update-code` endpoint
4. Backend updates version metadata

## Files Modified

### New Files
- `src/pages/api/games/versions/[id]/update-code.ts` - Update code API
- `src/pages/api/games/[id]/versions.ts` - Get versions API
- `docs/my-games-version-management.md` - This documentation

### Modified Files
- `src/pages/console/my-games.astro` - Added version management UI

## Testing Checklist

- [ ] Version history toggle shows/hides correctly
- [ ] Version history displays all versions with correct data
- [ ] "Cập nhật code" button only appears for qc_failed status
- [ ] Update code modal opens with correct game info
- [ ] File upload validates .zip extension
- [ ] File upload validates max size (100MB)
- [ ] Update code successfully replaces files in GCS
- [ ] Version status resets to draft after update
- [ ] Self-QA checklist is cleared after update
- [ ] Can submit to QC after updating code
- [ ] "Bản mới" button still works for creating new versions
- [ ] Audit log records update code action
- [ ] Version history cache works (no repeated API calls)

## Future Enhancements

1. **Diff View:** Show what changed between versions
2. **Rollback:** Ability to rollback to previous version
3. **Version Notes:** Allow editing release notes inline
4. **Bulk Actions:** Update multiple games at once
5. **Version Comparison:** Side-by-side comparison of two versions
