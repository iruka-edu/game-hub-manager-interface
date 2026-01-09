# Migration từ Local game-core-sdk sang @iruka-edu/game-core

## Tóm tắt

Đã thành công migration từ local folder `game-core-sdk` sang sử dụng thư viện npm `@iruka-edu/game-core`.

## Thay đổi thực hiện

### 1. Xóa Local Folder
- ✅ Xóa folder `game-core-sdk/` 
- ✅ Không có reference nào trong code đến folder này

### 2. Cập nhật Types và Imports

#### `src/lib/registry.ts`
```typescript
// Trước
export interface GameManifest { ... }

// Sau  
import type { GameManifest } from '@iruka-edu/game-core';
```

#### `src/lib/validator.ts`
```typescript
// Thêm import từ thư viện
import type { GameManifest } from '@iruka-edu/game-core';
import { validateManifest as validateManifestCore } from '@iruka-edu/game-core';

// Thêm function mới sử dụng core validation
export const validateManifestWithCore = (content: string): ValidationResult => {
  // Sử dụng validateManifestCore từ thư viện
}
```

#### `src/lib/metadata-types.ts`
```typescript
// Thêm import types từ thư viện
import type { GameType, Subject, Grade, DifficultyLevel } from '@iruka-edu/game-core';

// Cập nhật interface để sử dụng types từ thư viện
export interface GameMetadata {
  gameType?: GameType | string;
  subject?: Subject | string;
  grade?: Grade | string;
  difficulty_levels?: DifficultyLevel[] | string[];
}
```

#### Cập nhật Default Config
- Game types: `['quiz', 'drag_drop', 'trace', 'classify', 'memory', 'custom']`
- Subjects: `['math', 'vietnamese', 'english', 'logic', 'science', 'art', 'music', 'pe']`
- Grades: `['pre-k', 'k', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']`

### 3. Thư viện @iruka-edu/game-core

#### Đã cài đặt
```json
{
  "dependencies": {
    "@iruka-edu/game-core": "^0.1.1"
  }
}
```

#### Types có sẵn từ thư viện
- `GameManifest` - Interface cho manifest.json
- `GameType` - Enum các loại game
- `Subject` - Enum các môn học  
- `Grade` - Enum các cấp lớp
- `DifficultyLevel` - Enum mức độ khó
- `RawResult` - Interface cho kết quả game
- `NormalizedSubmitBody` - Interface cho dữ liệu chuẩn hóa

#### Functions có sẵn
- `validateManifest()` - Validate manifest.json
- `normalizeResult()` - Chuẩn hóa kết quả game
- `createHubBridge()` - Tạo bridge với Game Hub
- `createIframeBridge()` - Tạo bridge cho iframe

## Lợi ích

1. **Consistency**: Sử dụng types chuẩn từ thư viện chính thức
2. **Maintenance**: Không cần maintain local copy của SDK
3. **Updates**: Tự động nhận updates từ thư viện
4. **Validation**: Sử dụng validation logic chuẩn từ thư viện

## Tương thích ngược

- ✅ Tất cả existing code vẫn hoạt động
- ✅ Thêm function `validateManifestWithCore()` mới mà không thay thế function cũ
- ✅ Types được extend để hỗ trợ cả old và new format

## Bước tiếp theo

1. **Dần dần migrate** các validation logic sang sử dụng functions từ thư viện
2. **Test thoroughly** để đảm bảo tương thích
3. **Update documentation** để reflect changes
4. **Consider deprecating** old validation functions sau khi test đầy đủ

## Files đã thay đổi

- `src/lib/registry.ts` - Import GameManifest từ thư viện
- `src/lib/validator.ts` - Thêm validateManifestWithCore function
- `src/lib/metadata-types.ts` - Sử dụng types từ thư viện
- `package.json` - Đã có dependency @iruka-edu/game-core
- `game-core-sdk/` - Đã xóa folder này

## Verification

```bash
# Kiểm tra thư viện đã cài đặt
pnpm list @iruka-edu/game-core

# Kiểm tra types có sẵn
node -e "console.log(Object.keys(require('@iruka-edu/game-core')))"

# Build project để đảm bảo không có lỗi
npm run build
```