# File Size Limits and Version Update Feature

## Summary

Successfully implemented file size limit increase to 10MB with warning system for files > 3MB, and added convenient version update feature for existing games.

## Changes Made

### 1. File Size Limit Updates

#### Astro Configuration
- **File**: `astro.config.mjs`
- **Changes**: Already configured for larger uploads with Vercel adapter settings

#### Client-Side Validation
- **Files**: `src/components/GameUploadForm.astro`, `src/components/GameVersionUploadForm.astro`
- **Changes**:
  - Added 10MB hard limit with error message and file rejection
  - Added 3MB warning threshold with user-friendly message
  - Updated requirements checklist to reflect new limits
  - Enhanced file size validation for both individual files and ZIP uploads

#### Validation Logic
```javascript
// For ZIP files
if (sizeMB > 10) {
  // Show error and reject file
} else if (sizeMB > 3) {
  // Show warning but allow upload
} else {
  // Show success message
}

// For regular files
const totalSizeMB = totalSize / (1024 * 1024);
if (totalSizeMB > 10) {
  // Reject upload
} else if (totalSizeMB > 3) {
  // Show warning
}
```

### 2. Version Update Feature

#### New Components
- **File**: `src/components/GameVersionUploadForm.astro`
- **Purpose**: Dedicated form for uploading new versions of existing games
- **Features**:
  - Pre-filled game information
  - Version validation (must be higher than current)
  - Automatic manifest generation using existing game data
  - Same file size validation as main upload form

#### New Pages
- **File**: `src/pages/games/[id]/new-version.astro`
- **Purpose**: Page for uploading new versions
- **Features**:
  - Game context display
  - Integration with GameVersionUploadForm component
  - Error handling for non-existent games

#### Enhanced Navigation
- **Files**: `src/pages/games/[id]/versions.astro`, `src/pages/games/[id]/index.astro`
- **Changes**:
  - Added "Phiên bản mới" (New Version) buttons
  - Improved layout and user flow
  - Better visual hierarchy

### 3. User Experience Improvements

#### File Size Messaging
- **10MB+ files**: Clear error message with rejection
- **3-10MB files**: Warning about slow loading on weak networks
- **<3MB files**: Positive confirmation message

#### Version Management
- **Convenient workflow**: Users can now update versions without re-entering all manifest data
- **Version validation**: Automatic checking that new version is higher than current
- **Pre-filled data**: Game ID, title, and other manifest fields are inherited from current version

#### Vietnamese Language Support
- All error messages and UI text in Vietnamese
- Consistent terminology throughout the interface

## Technical Details

### File Size Validation Flow
1. **Client-side check**: Immediate validation on file selection
2. **Visual feedback**: Color-coded status messages (error/warning/success)
3. **Upload prevention**: Files over 10MB are rejected before upload attempt
4. **Server-side handling**: Astro/Vercel configuration supports up to 10MB

### Version Update Flow
1. **Navigate**: From game info or versions page → "Phiên bản mới" button
2. **Context**: Page shows current game info and version
3. **Input**: User enters new version number (validated against current)
4. **Upload**: Same file handling as main upload but with inherited manifest data
5. **Success**: Redirects to versions page showing new version

### Error Handling
- **File too large**: Clear error message with size limit information
- **Invalid version**: Validation with helpful examples
- **Missing files**: Same validation as main upload form
- **Network errors**: Graceful error handling with retry options

## Benefits

### For Users
- **Faster workflow**: No need to re-enter manifest data for version updates
- **Clear guidance**: File size warnings help users optimize their games
- **Better UX**: Intuitive navigation between game management pages

### For System
- **Controlled growth**: 10MB limit prevents excessive storage usage
- **Performance awareness**: 3MB warnings encourage optimization
- **Maintainability**: Consistent validation logic across components

## Files Modified

### Core Components
- `src/components/GameUploadForm.astro` - Enhanced file size validation
- `src/components/GameVersionUploadForm.astro` - New version upload component

### Pages
- `src/pages/games/[id]/new-version.astro` - New version upload page
- `src/pages/games/[id]/versions.astro` - Added new version button
- `src/pages/games/[id]/index.astro` - Added new version button

### Configuration
- `astro.config.mjs` - Server configuration for larger uploads

### Documentation
- `docs/file-size-limits-and-version-update.md` - This summary document

## Testing Recommendations

1. **File Size Limits**:
   - Test with files exactly at 3MB, 10MB, and over 10MB
   - Verify warning messages appear correctly
   - Confirm uploads are rejected appropriately

2. **Version Updates**:
   - Test version validation (higher/lower/same version numbers)
   - Verify manifest inheritance works correctly
   - Test file upload flow for new versions

3. **User Interface**:
   - Check navigation between pages
   - Verify button states and loading indicators
   - Test error handling scenarios

## Future Enhancements

1. **Progress Indicators**: Real upload progress for large files
2. **Compression Suggestions**: Automatic recommendations for file optimization
3. **Batch Version Management**: Upload multiple versions at once
4. **Version Comparison**: Visual diff between versions
5. **Rollback Feature**: Easy revert to previous versions