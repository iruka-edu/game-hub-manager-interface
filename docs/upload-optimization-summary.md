# Upload Optimization Summary

## Overview

Cải tiến logic upload game lên Google Cloud Storage với hai thay đổi chính:
1. **Smart Root Folder Detection** - Tự động tìm thư mục gốc dựa trên vị trí của `index.html`
2. **Parallel Upload** - Upload nhiều file song song để tăng tốc độ

## Vấn đề trước đây

### 1. Root Folder Detection không chính xác
- Logic cũ đoán root folder dựa trên tên folder (dist, build, public, etc.)
- Không xử lý được trường hợp user nén folder với tên tùy ý (ví dụ: `my-game/build/index.html`)
- Có thể bỏ sót hoặc xử lý sai cấu trúc thư mục

### 2. Upload tuần tự chậm
- Upload từng file một, không tận dụng được băng thông
- Với game có nhiều file (100+ files), thời gian upload rất lâu

## Giải pháp mới

### 1. Smart Root Folder Detection

**Logic mới**: Tìm file `index.html` và xác định thư mục chứa nó là root folder.

```typescript
function findRootFolder(filePaths: string[]): string {
  // Tìm index.html trong danh sách file
  const indexFile = filePaths.find(path => {
    const fileName = path.split('/').pop()?.toLowerCase();
    return fileName === 'index.html';
  });

  if (!indexFile) return ''; // Không tìm thấy, giả sử root

  // Lấy folder chứa index.html
  const parts = indexFile.split('/');
  if (parts.length === 1) return ''; // index.html ở root
  
  return parts.slice(0, -1).join('/');
}
```

**Ví dụ xử lý:**

| ZIP Structure | Root Folder Detected | Result |
|--------------|---------------------|--------|
| `game.zip/index.html` | (root) | `index.html` |
| `game.zip/dist/index.html` | `dist` | `index.html` |
| `game.zip/my-game/build/index.html` | `my-game/build` | `index.html` |
| `game.zip/project/src/dist/index.html` | `project/src/dist` | `index.html` |

### 2. Parallel Upload với Concurrency Control

**Hàm mới trong `gcs.ts`:**

```typescript
export interface UploadItem {
  destination: string;
  buffer: Buffer;
  contentType: string;
  isHtml?: boolean;
}

export const uploadBufferBatch = async (
  items: UploadItem[],
  concurrency = 3,  // Số file upload song song
  onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<Array<{ destination: string; success: boolean; error?: string }>>
```

**Cách hoạt động:**
- Chia files thành các chunk theo concurrency (mặc định 3)
- Upload song song các file trong cùng chunk
- Đợi chunk hoàn thành rồi mới xử lý chunk tiếp theo
- Callback progress cho mỗi file hoàn thành

**Ví dụ với 10 files, concurrency = 3:**
```
Chunk 1: [file1, file2, file3] → Upload song song
Chunk 2: [file4, file5, file6] → Upload song song  
Chunk 3: [file7, file8, file9] → Upload song song
Chunk 4: [file10] → Upload
```

## Files đã thay đổi

### `src/lib/gcs.ts`
- Thêm interface `UploadItem`
- Thêm hàm `uploadBufferBatch()` cho parallel upload

### `src/pages/api/upload.ts`
- Thêm hàm `findRootFolder()` - tìm root dựa trên index.html
- Thêm hàm `normalizeFilePath()` - chuẩn hóa đường dẫn
- Thêm hàm `getContentType()` - xác định MIME type
- Sử dụng `uploadBufferBatch()` thay vì upload tuần tự

### `src/pages/api/upload-zip.ts`
- Cùng logic như upload.ts
- Tối ưu cho xử lý ZIP files

## Performance Improvement

### Trước (Sequential Upload)
```
File 1 → Upload → Done
File 2 → Upload → Done
File 3 → Upload → Done
...
Total time: n × average_upload_time
```

### Sau (Parallel Upload, concurrency=3)
```
[File 1, File 2, File 3] → Upload parallel → Done
[File 4, File 5, File 6] → Upload parallel → Done
...
Total time: (n/3) × average_upload_time
```

**Estimated speedup: ~2-3x** (phụ thuộc vào băng thông và latency)

## API Response Changes

Response bây giờ bao gồm thêm thông tin:

```json
{
  "success": true,
  "message": "Đã tải lên thành công Game Name v1.0.0!",
  "gameId": "com.iruka.game-name",
  "version": "1.0.0",
  "entryUrl": "https://storage.googleapis.com/bucket/games/com.iruka.game-name/1.0.0/index.html",
  "summary": {
    "rootFolder": "dist",
    "totalFiles": 25,
    "folders": 4,
    "folderBreakdown": "root: 3 files, assets: 15 files, css: 5 files, js: 2 files",
    "uploadConcurrency": 3
  }
}
```

## Testing

Tất cả 44 tests hiện tại vẫn pass:
- `src/pages/login.test.ts` (7 tests)
- `src/pages/403.test.ts` (4 tests)
- `src/lib/client-auth.test.ts` (6 tests)
- `src/middleware.test.ts` (11 tests)
- `src/lib/page-permissions.test.ts` (16 tests)

## Backward Compatibility

- API endpoints giữ nguyên URL và request format
- Response format tương thích, chỉ thêm fields mới trong `summary`
- Không cần thay đổi client-side code

## Configuration

Concurrency có thể điều chỉnh trong code:
```typescript
const concurrency = 3; // Có thể tăng lên 5-10 nếu băng thông tốt
```

Khuyến nghị:
- **Bandwidth thấp**: concurrency = 2-3
- **Bandwidth cao**: concurrency = 5-10
- **Server có rate limit**: concurrency = 2-3
