# Google Cloud Storage Management Feature

## Overview
Added a new tab "Quản lý GCS" to the My Games page that allows administrators to manage files stored on Google Cloud Storage. This feature helps identify and clean up orphaned game files that no longer have corresponding entries in the MongoDB database.

## Features

### 1. GCS File Listing
- **View all files**: Lists all files in the `games/` directory on GCS
- **File information**: Shows file path, size, creation date, and status
- **Status indicators**: 
  - 🟢 **Hợp lệ** - Game exists in database
  - 🔴 **Thừa** - Game not found in database (orphaned)

### 2. Statistics Dashboard
- **Total files on GCS**: Count of all game files
- **Valid files**: Files with corresponding database entries
- **Orphaned files**: Files without database entries (candidates for deletion)

### 3. File Filtering
- **All files**: Show complete file list
- **Valid files only**: Show only files with database matches
- **Orphaned files only**: Show only files without database matches

### 4. Cleanup Functionality
- **Safe deletion**: Only deletes files without corresponding database entries
- **Batch processing**: Handles large numbers of files efficiently
- **Confirmation modal**: Shows exactly which files will be deleted
- **Error handling**: Reports any deletion failures

## Access Control

### Permissions
- **Admin only**: Only users with `admin` role can access this feature
- **Tab visibility**: GCS tab only appears for admin users
- **API protection**: All GCS endpoints require admin authentication

## Technical Implementation

### Components
- **`GCSManagement.astro`**: Main UI component with file listing and controls
- **`gcsManagement.ts`**: Client-side logic for data loading and interactions

### API Endpoints
- **`GET /api/gcs/files`**: Lists all files on GCS with metadata
- **`GET /api/games/ids`**: Returns all game IDs from database
- **`POST /api/gcs/cleanup`**: Deletes orphaned files from GCS

### File Path Structure
Files are expected to follow the pattern: `games/{gameId}/...`
- Game ID is extracted from the path for database comparison
- Only files matching this pattern are considered for cleanup

## Configuration

### Environment Variables
Required environment variables for GCS integration:
```env
GCLOUD_PROJECT_ID=your-project-id
GCLOUD_BUCKET_NAME=your-bucket-name
GCLOUD_CLIENT_EMAIL=your-service-account-email
GCLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your-private-key...\n-----END PRIVATE KEY-----\n"
```

### Service Account Permissions
The service account needs the following GCS permissions:
- `storage.objects.list` - To list files
- `storage.objects.delete` - To delete orphaned files
- `storage.objects.get` - To read file metadata

## Usage Workflow

### 1. Access GCS Management
1. Navigate to `/console/my-games`
2. Click on "Quản lý GCS" tab (admin only)
3. System automatically loads GCS data

### 2. Review Files
1. View statistics dashboard for overview
2. Use filter dropdown to focus on specific file types
3. Review file list with status indicators

### 3. Clean Up Orphaned Files
1. Click "Dọn dẹp GCS" button
2. Review confirmation modal showing files to be deleted
3. Confirm deletion to remove orphaned files
4. System reports deletion results

## Safety Features

### Double Verification
- Files are checked against database before deletion
- Only files without valid game IDs are deleted
- Confirmation modal shows exact files to be removed

### Error Handling
- Individual file deletion errors don't stop the process
- Failed deletions are reported to user
- Successful deletions are logged

### Audit Trail
- All cleanup operations are logged with user ID
- Deletion counts and errors are tracked
- Console logs provide detailed operation history

## Performance Considerations

### Batch Processing
- Files are deleted in batches of 10 to avoid timeouts
- Large file lists are handled efficiently
- Progress is tracked and reported

### Caching
- File lists are cached on client side
- Database game IDs are fetched once per session
- Refresh button allows manual cache invalidation

## Error Scenarios

### Common Issues
1. **GCS credentials not configured**: Check environment variables
2. **Insufficient permissions**: Verify service account roles
3. **Network timeouts**: Retry operation or reduce batch size
4. **File already deleted**: Harmless, operation continues

### Error Messages
- Clear user-friendly error messages
- Technical details logged to console
- Graceful degradation when services unavailable

## Monitoring

### Metrics to Track
- Number of orphaned files cleaned up
- Frequency of cleanup operations
- Storage space reclaimed
- Error rates and types

### Logging
- All GCS operations are logged
- User actions are tracked
- Performance metrics available in console

## Future Enhancements

### Potential Improvements
1. **Scheduled cleanup**: Automatic orphaned file removal
2. **Storage analytics**: Detailed usage reports and trends
3. **File preview**: View file contents before deletion
4. **Bulk operations**: More granular file management
5. **Integration with game lifecycle**: Auto-cleanup on game deletion

### Scalability
- Support for larger file counts (pagination)
- Parallel processing for faster operations
- Advanced filtering and search capabilities
- Export functionality for audit reports

## Testing

### Test Scenarios
1. **File listing**: Verify all GCS files are displayed correctly
2. **Status detection**: Confirm orphaned vs valid file identification
3. **Cleanup operation**: Test safe deletion of orphaned files only
4. **Error handling**: Verify graceful handling of failures
5. **Permission checks**: Ensure admin-only access

### Manual Testing Steps
1. Create test games in database
2. Upload files to GCS (some matching, some orphaned)
3. Verify file listing shows correct statuses
4. Test cleanup removes only orphaned files
5. Confirm valid game files remain untouched