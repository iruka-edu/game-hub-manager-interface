# My Games UI Guide - Version Management

## UI Layout Changes

### Before (Original)
```
┌─────────────────────────────────────────────────────────────────┐
│ Game          │ Version │ Status    │ Updated    │ Actions      │
├─────────────────────────────────────────────────────────────────┤
│ Math Game     │ v1.0.0  │ QC cần sửa│ 25/12/2024 │ [Sửa]       │
│ com.math.game │         │           │            │ [Gửi QC]    │
│               │         │           │            │ [Upload bản mới] │
└─────────────────────────────────────────────────────────────────┘
```

### After (With Version Management)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Game          │ Version    │ Status    │ Updated    │ Actions           │
├─────────────────────────────────────────────────────────────────────────┤
│ Math Game     │ v1.0.0 [▼] │ QC cần sửa│ 25/12/2024 │ [Sửa]            │
│ com.math.game │            │           │            │ [Cập nhật code]  │
│               │            │           │            │ [Gửi QC]         │
│               │            │           │            │ [Bản mới]        │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─ Lịch sử phiên bản ─────────────────────────────────────────────┐   │
│ │ v1.0.0  [QC cần sửa]  Fix bug audio    25/12/2024  • 1.2 MB    │   │
│ │ v1.0.0  [Đang QC]     Initial version  24/12/2024  • 1.1 MB    │   │
│ └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Button Colors & Meanings

### Action Buttons
- **Sửa** (Edit) - Gray/Slate
  - Edit game metadata (title, description, etc.)
  - Available for: `draft`, `qc_failed`

- **Cập nhật code** (Update Code) - Amber/Orange ⭐ NEW
  - Replace code files in existing version
  - Available for: `qc_failed` only
  - Opens file upload modal

- **Gửi QC** (Submit QC) - Blue
  - Submit to QC for review
  - Available for: `draft`, `qc_failed`
  - Opens Self-QA checklist modal

- **Bản mới** (New Version) - Green/Emerald
  - Create new version (increment version number)
  - Available for: `qc_failed`
  - Redirects to new version page

- **Xem chi tiết** (View Details) - Indigo
  - View game details (read-only)
  - Available for: `uploaded`, `qc_processing`, `qc_passed`, `approved`, `published`

## Version History Toggle

### Collapsed State
```
│ v1.0.0 [▼] │
```
- Click arrow to expand
- Shows latest version only

### Expanded State
```
│ v1.0.0 [▲] │
├─────────────────────────────────────────────────────────┐
│ LỊCH SỬ PHIÊN BẢN                                       │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ v1.0.1  [Đã xuất bản]  25/12/2024  • 1.5 MB       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ v1.0.0  [QC cần sửa]   24/12/2024  • 1.2 MB       │ │
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```
- Click arrow again to collapse
- Shows all versions in reverse chronological order
- Each version shows: version number, status badge, date, file size

## Status Badges

### Color Coding
- **Nháp** (Draft) - Gray
- **Chờ QC** (Uploaded) - Blue
- **Đang QC** (QC Processing) - Purple
- **QC đạt** (QC Passed) - Green
- **QC cần sửa** (QC Failed) - Red ⚠️
- **Đã duyệt** (Approved) - Emerald
- **Đã xuất bản** (Published) - Indigo
- **Lưu trữ** (Archived) - Gray

## Modal: Update Code

```
┌─────────────────────────────────────────────────────────┐
│ Cập nhật code game                                  [X] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Cập nhật code cho game "Math Game" phiên bản v1.0.0.   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ⚠️  Lưu ý quan trọng:                              │ │
│ │                                                     │ │
│ │ • Code cũ sẽ bị ghi đè hoàn toàn                  │ │
│ │ • Trạng thái sẽ reset về "Nháp"                   │ │
│ │ • Self-QA checklist sẽ bị xóa                     │ │
│ │ • Bạn cần test và gửi QC lại                      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Chọn file ZIP mới:                                      │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Choose File] No file chosen                       │ │
│ └────────────────────────────────────────────────────┘ │
│ Chỉ chấp nhận file .zip                                 │
│                                                          │
│                              [Hủy] [Xác nhận cập nhật] │
└─────────────────────────────────────────────────────────┘
```

### Modal Behavior
1. Opens when clicking "Cập nhật code" button
2. Shows game title and version number
3. Warning box explains consequences
4. File input accepts .zip only
5. "Xác nhận cập nhật" button disabled until file selected
6. Validates file type and size (max 100MB)
7. Shows progress: "Đang upload..." during upload
8. Reloads page on success

## Modal: Submit QC (Existing)

```
┌─────────────────────────────────────────────────────────┐
│ Gửi game để QC kiểm tra                             [X] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Bạn đang gửi game "Math Game" phiên bản v1.0.0         │
│ để QC kiểm tra.                                         │
│                                                          │
│ Self-QA Checklist (bắt buộc):                           │
│                                                          │
│ ☐ Đã test trên các thiết bị (mobile, tablet, desktop)  │
│ ☐ Đã test âm thanh hoạt động đúng                      │
│ ☐ Logic game hoạt động hoàn chỉnh                      │
│ ☐ Nội dung đã được kiểm tra và phù hợp                 │
│                                                          │
│ Ghi chú (tùy chọn):                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│                              [Hủy] [Xác nhận gửi QC]   │
└─────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (>1024px)
- All buttons visible in single row
- Version history expands below game row
- Modals centered on screen

### Tablet (768px - 1024px)
- Buttons may wrap to multiple rows
- Version history still inline
- Modals take 90% width

### Mobile (<768px)
- Buttons stack vertically
- Version history full width
- Modals full width with padding

## Interaction Flow

### Scenario: Dev Fixes QC Failed Game

1. **View Game List**
   ```
   Math Game | v1.0.0 [▼] | QC cần sửa | [Sửa] [Cập nhật code] [Gửi QC] [Bản mới]
   ```

2. **Check Version History** (Optional)
   ```
   Click [▼] → Shows all versions
   v1.0.0 [QC cần sửa] - Current attempt
   v1.0.0 [Đang QC]    - Previous submission
   ```

3. **Update Code**
   ```
   Click [Cập nhật code] → Modal opens
   Select ZIP file → Click [Xác nhận cập nhật]
   Upload progress → Success → Page reloads
   ```

4. **After Update**
   ```
   Math Game | v1.0.0 [▼] | Nháp | [Sửa] [Gửi QC]
   Status changed to "Nháp" (Draft)
   "Cập nhật code" button hidden (only for qc_failed)
   ```

5. **Submit to QC Again**
   ```
   Click [Gửi QC] → Complete Self-QA checklist → Submit
   Status changes to "Chờ QC" (Uploaded)
   ```

## Key UI Improvements

### 1. Visual Hierarchy
- Primary action (Gửi QC) - Blue, most prominent
- Update action (Cập nhật code) - Amber, attention-grabbing
- Create action (Bản mới) - Green, positive
- View action (Xem chi tiết) - Indigo, informational

### 2. Information Density
- Version toggle keeps table compact
- Expand only when needed
- Cache prevents repeated loading

### 3. User Guidance
- Warning messages in update modal
- Status badges clearly color-coded
- Button labels in Vietnamese, clear intent

### 4. Error Prevention
- File type validation
- File size validation
- Disabled buttons until requirements met
- Confirmation modals for destructive actions

## Accessibility

- Keyboard navigation supported
- Focus states on all interactive elements
- ARIA labels on icon buttons
- Color contrast meets WCAG AA standards
- Screen reader friendly status badges
