# Game Upload Flow Implementation

## Tổng quan

Đã implement complete upload flow: **ZIP file → metadata update → GCS upload → server update** với TypeScript support đầy đủ.

## Upload Flow

### 1. Metadata Collection (`/upload`)
- User điền form metadata (lớp, môn, bài học, skills, themes, GitHub link)
- Validation required fields trước khi cho phép upload
- Chuyển sang bước upload khi metadata đầy đủ

### 2. File Upload & Validation
- **Drag & Drop** hoặc **File Picker** cho ZIP files
- **Client-side validation**:
  - File type: chỉ `.zip`
  - File size: tối đa 50MB
  - ZIP structure: kiểm tra `index.html`, `manifest.json`
- **Real-time progress** với visual feedback

### 3. GCS Upload (`POST /api/games/upload`)
- Upload ZIP file lên Google Cloud Storage
- Generate storage path: `games/{gameId}/{version}/`
- Create/update GameVersion record
- Update Game's latestVersionId reference

### 4. Metadata Update (`PUT /api/games/{id}/update`)
- Update game metadata với thông tin từ form
- Merge với existing metadata
- Track changes cho audit log
- Add entry vào game history

## Files Created/Updated

### Components
- ✅ `src/components/GameUploadForm.astro` - Main upload component
- ✅ `src/pages/upload.astro` - Fixed TypeScript errors

### API Endpoints
- ✅ `src/pages/api/games/upload.ts` - Handle ZIP upload to GCS
- ✅ `src/pages/api/games/[id]/update.ts` - Update game metadata

### Utilities
- ✅ `src/lib/upload-utils.ts` - Validation & helper functions

## TypeScript Fixes

### Fixed Issues:
1. ✅ **Cannot find name 'GameUploadForm'** - Created component
2. ✅ **Variable 'uploadedFile' implicitly has type 'any'** - Added proper typing
3. ✅ **Property 'value' does not exist on type 'EventTarget'** - Type casting
4. ✅ **'e.target' is possibly 'null'** - Null checks
5. ✅ **Property 'files' does not exist on type 'EventTarget'** - HTMLInputElement casting
6. ✅ **Property 'disabled' does not exist on type 'HTMLElement'** - HTMLButtonElement casting
7. ✅ **Parameter implicitly has 'any' type** - Added type annotations

### Type Definitions Added:
```typescript
interface ManifestData {
  gameId: string;
  version: string;
  runtime: string;
  entryPoint: string;
}

interface GameMeta {
  grade: string;
  subject: string;
  lesson: string[];
  backendGameId: string;
  level: string;
  skills: string[];
  themes: string[];
  linkGithub: string;
}
```

## Upload Process Flow

```mermaid
graph TD
    A[User fills metadata form] --> B{Metadata complete?}
    B -->|No| A
    B -->|Yes| C[Show upload form]
    C --> D[User selects ZIP file]
    D --> E[Client-side validation]
    E --> F{Valid ZIP?}
    F -->|No| G[Show errors]
    F -->|Yes| H[Upload to GCS]
    H --> I[Create/Update GameVersion]
    I --> J[Update Game metadata]
    J --> K[Add audit log]
    K --> L[Add game history]
    L --> M[Complete - redirect to dashboard]
```

## API Endpoints

### POST /api/games/upload
**Purpose**: Upload ZIP file to Google Cloud Storage

**Request**:
```typescript
FormData {
  file: File,           // ZIP file
  gameId: string,       // Game identifier
  version: string       // Version number
}
```

**Response**:
```typescript
{
  success: boolean,
  data: {
    gameId: ObjectId,
    versionId: ObjectId,
    version: string,
    storagePath: string,
    fileSize: number,
    uploadUrl: string
  }
}
```

### PUT /api/games/{id}/update
**Purpose**: Update game metadata and information

**Request**:
```typescript
{
  title?: string,
  description?: string,
  subject?: string,
  grade?: string,
  gameType?: string,
  priority?: string,
  metadata?: {
    runtime: string,
    entryPoint: string,
    skills: string[],
    themes: string[],
    level: string,
    linkGithub: string
  }
}
```

## Validation Features

### Client-side Validation
- **File type**: Only `.zip` files allowed
- **File size**: Maximum 50MB
- **ZIP structure**: Check for required files
- **Game ID format**: Lowercase, numbers, dots, hyphens only
- **Version format**: Semantic versioning (1.0.0)

### Server-side Validation
- **Authentication**: User must be logged in
- **Authorization**: Owner or admin permissions
- **File validation**: Re-validate file type and size
- **Game existence**: Verify game exists before upload

## Security Features

### Upload Security
- **File type validation**: Only ZIP files
- **Size limits**: 50MB maximum
- **Path sanitization**: Prevent directory traversal
- **Authentication required**: Must be logged in
- **Authorization checks**: Owner or admin only

### Audit Trail
- **Upload logging**: Track all file uploads
- **Change tracking**: Record metadata changes
- **Game history**: User-friendly activity log
- **Error logging**: Capture and log failures

## Error Handling

### Client-side Errors
- **File validation errors**: Show user-friendly messages
- **Network errors**: Retry mechanisms
- **Progress tracking**: Visual feedback during upload
- **Graceful degradation**: Fallback for failed uploads

### Server-side Errors
- **Validation errors**: Return specific error messages
- **Storage errors**: Handle GCS upload failures
- **Database errors**: Transaction rollback on failures
- **Authentication errors**: Clear error responses

## Performance Optimizations

### Upload Performance
- **Progress tracking**: Real-time upload progress
- **Chunked uploads**: For large files (future enhancement)
- **Compression**: ZIP files are already compressed
- **CDN integration**: Fast file serving via GCS

### Database Performance
- **Indexed queries**: Efficient game lookups
- **Batch operations**: Minimize database calls
- **Connection pooling**: Reuse database connections
- **Audit log optimization**: Async logging

## Future Enhancements

### Planned Features
1. **Chunked uploads** - For files > 50MB
2. **Resume uploads** - Handle interrupted uploads
3. **Batch uploads** - Multiple games at once
4. **Preview generation** - Auto-generate thumbnails
5. **Virus scanning** - Security enhancement
6. **CDN integration** - Faster file delivery

### Technical Improvements
1. **WebSocket progress** - Real-time upload status
2. **Background processing** - Async file processing
3. **Caching layer** - Redis for metadata
4. **Rate limiting** - Prevent abuse
5. **Monitoring** - Upload metrics and alerts

## Testing Checklist

### Manual Testing
- [ ] Upload valid ZIP file
- [ ] Upload invalid file types
- [ ] Upload oversized files
- [ ] Test drag & drop functionality
- [ ] Test progress indicators
- [ ] Test error handling
- [ ] Test metadata updates
- [ ] Test permission checks

### Automated Testing
- [ ] Unit tests for validation functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for upload flow
- [ ] Performance tests for large files
- [ ] Security tests for malicious files

## Deployment Notes

### Environment Variables
```bash
GCLOUD_PROJECT_ID=your-project-id
GCLOUD_BUCKET_NAME=your-bucket-name
GCLOUD_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GCLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

### Dependencies
- `@google-cloud/storage` - GCS integration
- `jszip` - ZIP file processing
- `mongodb` - Database operations
- `bcryptjs` - Password hashing
- `jsonwebtoken` - Authentication

### Production Considerations
1. **File size limits** - Adjust based on server capacity
2. **Storage costs** - Monitor GCS usage
3. **Bandwidth limits** - Consider CDN for downloads
4. **Backup strategy** - Regular GCS backups
5. **Monitoring** - Set up alerts for failures