# GCS Management Feature

## Tổng quan
Tính năng quản lý Google Cloud Storage (GCS) cho phép admin xem, so sánh và xóa các file trên GCS bucket, đồng thời kiểm tra tính đồng bộ với database.

## Đường dẫn truy cập
```
http://localhost:3000/console/my-games?tab=gcs
```

## Quyền truy cập
- **Chỉ Admin** mới có thể truy cập tính năng này
- Kiểm tra quyền ở cả frontend và backend

## Tính năng chính

### 1. **Xem danh sách file GCS**
- Hiển thị tất cả file trong GCS bucket
- Thông tin chi tiết: tên file, kích thước, ngày cập nhật
- Trích xuất gameId và version từ đường dẫn file

### 2. **So sánh với Database**
- Kiểm tra file có tồn tại trong database không
- Hiển thị trạng thái: "Có trong DB" hoặc "File rác"
- Liên kết với thông tin game (title, status)

### 3. **Thống kê tổng quan**
- Tổng số file
- Tổng dung lượng
- Số file có trong DB
- Số file rác (orphaned)

### 4. **Tìm kiếm và lọc**
- Tìm kiếm theo tên file, gameId, tên game
- Lọc theo trạng thái: Tất cả / Có trong DB / File rác
- Sắp xếp theo: tên, kích thước, ngày cập nhật, tên game

### 5. **Xóa file**
- Xóa file đơn lẻ
- Xóa nhiều file cùng lúc (bulk delete)
- Xác nhận trước khi xóa
- Hỗ trợ xóa cả thư mục

### 6. **Cache tối ưu**
- Cache dữ liệu GCS trong 5 phút
- Tự động refresh cache khi có thay đổi
- Nút "Làm mới" để force refresh

## Cấu trúc API

### **GET /api/gcs/files**
```typescript
interface GCSFilesResponse {
  success: boolean;
  files: GCSFile[];
  stats: GCSStats;
}

interface GCSFile {
  name: string;
  size: number;
  updated: string;
  gameId?: string;
  version?: string;
  inDatabase: boolean;
  gameTitle?: string;
  status?: string;
}
```

### **DELETE /api/gcs/files/[...path]**
```typescript
interface GCSDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
```

### **Cache API**
- `GET /api/gcs/cache` - Lấy cache
- `POST /api/gcs/cache` - Set cache
- `DELETE /api/gcs/cache` - Xóa cache

## Cấu trúc thư mục

```
src/features/gcs/
├── api/
│   └── gcsApi.ts           # API functions
├── hooks/
│   └── useGCS.ts           # React Query hooks
├── components/
│   └── GCSManagement.tsx   # Main component
├── types/
│   └── index.ts            # TypeScript types
└── index.ts                # Feature exports

src/app/api/gcs/
├── files/
│   ├── route.ts            # List files
│   └── [...path]/route.ts  # Delete files
└── cache/
    └── route.ts            # Cache management
```

## Components

### **GCSManagement**
Main component với các tính năng:
- Stats cards hiển thị thống kê
- Search và filter controls
- Sortable table với checkbox selection
- Delete confirmation modal
- Bulk actions

### **Hooks**
- `useGCSFiles()` - Fetch files với cache
- `useDeleteGCSFile()` - Delete file mutation
- `useRefreshGCS()` - Refresh data mutation

## Cache Strategy

### **In-Memory Cache**
```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // 5 minutes default
}
```

### **Cache Flow**
1. **First Load**: Fetch từ API → Cache result
2. **Subsequent Loads**: Load từ cache nếu chưa expire
3. **After Changes**: Clear cache → Refetch fresh data
4. **Manual Refresh**: Clear cache → Force refetch

### **Cache Benefits**
- Giảm API calls đến GCS (expensive operations)
- Faster loading cho subsequent visits
- Automatic invalidation khi có changes

## Security

### **Authentication**
- JWT session verification
- User role checking (admin only)

### **Authorization**
- Backend: Kiểm tra role trong mỗi API endpoint
- Frontend: Ẩn UI nếu không phải admin

### **File Path Validation**
- Encode file paths để tránh path traversal
- Validate file existence trước khi delete

## Performance Optimizations

### **1. Efficient GCS Operations**
- Batch operations khi có thể
- Proper error handling và retry logic

### **2. Frontend Optimizations**
- Virtual scrolling cho large file lists (có thể thêm sau)
- Debounced search input
- Memoized filtering và sorting

### **3. Caching Strategy**
- 5-minute TTL cho GCS data
- React Query caching cho client-side
- Automatic cache invalidation

## Error Handling

### **API Errors**
- Network errors với retry mechanism (axios)
- GCS permission errors
- File not found errors

### **UI Error States**
- Loading states với spinners
- Error messages bằng tiếng Việt
- Retry buttons cho failed operations

## Usage Examples

### **Basic Usage**
```typescript
// In component
const { data, isLoading, error } = useGCSFiles();
const deleteFile = useDeleteGCSFile();

// Delete file
await deleteFile.mutateAsync('games/my-game/1.0.0/index.html');
```

### **With Cache**
```typescript
// Auto-cached
const gcsData = await getGCSFilesWithCache();

// Manual cache management
await setGCSCache(data, 'files', 300000); // 5 minutes
await clearGCSCache('files');
```

## Environment Setup

### **Required Environment Variables**
```bash
GCLOUD_PROJECT_ID=your-project-id
GCLOUD_BUCKET_NAME=your-bucket-name
GCLOUD_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GCLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **GCS Permissions**
Service account cần các quyền:
- `storage.objects.list`
- `storage.objects.delete`
- `storage.objects.get`

## File Path Convention

### **Expected Structure**
```
games/
├── {gameId}/
│   └── {version}/
│       ├── index.html
│       ├── assets/
│       └── ...
```

### **Path Parsing**
- Extract gameId từ `games/{gameId}/{version}/...`
- Extract version từ path structure
- Map với database records

## Future Enhancements

### **1. Advanced Features**
- File preview/download
- Batch upload interface
- Storage usage analytics
- Automated cleanup jobs

### **2. Performance**
- Redis cache thay vì in-memory
- Background sync jobs
- Pagination cho large datasets

### **3. Monitoring**
- GCS operation metrics
- Cache hit/miss rates
- Error tracking và alerting

## Testing

### **API Testing**
```bash
# List files
curl -X GET "http://localhost:3000/api/gcs/files" \
  -H "Cookie: iruka_session=..."

# Delete file
curl -X DELETE "http://localhost:3000/api/gcs/files/games/test/1.0.0/index.html" \
  -H "Cookie: iruka_session=..."
```

### **Component Testing**
- Unit tests cho hooks
- Integration tests cho API endpoints
- E2E tests cho user workflows

## Deployment Notes

### **Production Considerations**
- Use Redis cho cache thay vì in-memory
- Monitor GCS API quotas và costs
- Set up proper logging và monitoring
- Configure appropriate timeouts

### **Security Checklist**
- ✅ Admin-only access
- ✅ JWT session validation
- ✅ File path validation
- ✅ Error message sanitization
- ✅ Rate limiting (via axios retry)

Tính năng GCS Management giờ đây đã hoàn chỉnh với đầy đủ tính năng quản lý, cache tối ưu và bảo mật cao!