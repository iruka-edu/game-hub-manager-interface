# Học Liệu Integration - Game Upload

## Tổng quan

Đã tích hợp đầy đủ dữ liệu học liệu từ các file trong `docs/hoc_lieu/` vào hệ thống upload game.

## Nguồn dữ liệu

| File | Nội dung | Số lượng |
|------|----------|----------|
| `level_cac_bai_hoc.md` | 3 levels (Làm quen, Tiến bộ, Thử thách) | 3 |
| `ky_nang_toan_tre_3-4.md` | Kỹ năng toán trẻ 3-4 tuổi | 28 skills |
| `so_thich_theo_chu_de.md` | Sở thích theo chủ đề | 48 themes |
| `Toán_3-4.md` | Bài học toán 3-4 tuổi | 22 lessons |

## Files đã tạo

### 1. Constants File
`src/lib/hoc-lieu-constants.ts`

```typescript
// Exports
export const LEVELS: LevelDefinition[];
export const LEVEL_OPTIONS: { value, label, description }[];

export const MATH_SKILLS_3_4: MathSkill[];
export const SKILL_OPTIONS: { value, label, group }[];
export const SKILL_GROUPS: { code, name }[];

export const THEMES: ThemeDefinition[];
export const THEME_OPTIONS: { value, label, group }[];
export const THEME_GROUPS: { code, name }[];

export const MATH_LESSONS_3_4: LessonDefinition[];
export const LESSON_OPTIONS: { value, label, games }[];

// Helper functions
export function getSkillByCode(code: string): MathSkill | undefined;
export function getThemeByCode(code: string): ThemeDefinition | undefined;
export function getLevelByCode(code: LevelCode): LevelDefinition | undefined;
export function validateSkillCodes(codes: string[]): { valid, invalid };
export function validateThemeCodes(codes: string[]): { valid, invalid };
export function validateLevelCode(code: string): boolean;
```

### 2. API Endpoints
- `GET /api/hoc-lieu` - Lấy tất cả dữ liệu học liệu
- `GET /api/hoc-lieu?type=levels` - Lấy levels
- `GET /api/hoc-lieu?type=skills` - Lấy skills
- `GET /api/hoc-lieu?type=themes` - Lấy themes
- `GET /api/hoc-lieu?type=lessons` - Lấy lessons
- `POST /api/hoc-lieu/validate` - Validate dữ liệu trước upload

### 3. Updated Types
`src/types/upload.ts`

```typescript
export interface GameMetadata {
  // Basic fields (displayed to user)
  grade: string;           // Lớp / Độ tuổi
  subject: string;         // Môn học
  lesson: string[];        // Bài học
  backendGameId: string;   // Game ID từ backend
  level: LevelCode;        // lam_quen | tien_bo | thu_thach
  skills: string[];        // Mã kỹ năng (M34.COUNT_OBJECTS, etc.)
  themes: string[];        // Mã sở thích (animals_home, etc.)
  linkGithub: string;      // Link GitHub repo/commit
  
  // Additional fields
  quyenSach?: string;      // Quyển sách / Track
  skillGroup?: SkillGroup; // Nhóm kỹ năng
  themeGroup?: ThemeGroup; // Nhóm sở thích
}
```

## Chi tiết dữ liệu

### Levels (3)
| Code | Name | Description |
|------|------|-------------|
| `lam_quen` | Làm quen | Trình độ bằng sách giáo khoa |
| `tien_bo` | Tiến bộ | Trình độ bằng sách bài tập |
| `thu_thach` | Thử thách | Trình độ bằng sách nâng cao |

### Skill Groups (8)
| Code | Name | Số skills |
|------|------|-----------|
| `so_dem` | Số & đếm | 5 |
| `ghep_tuong_ung` | Ghép & tương ứng | 2 |
| `so_sanh` | So sánh | 3 |
| `phan_loai` | Phân loại & tập hợp | 5 |
| `hinh_hoc` | Hình học cơ bản | 5 |
| `khong_gian` | Không gian & định hướng | 3 |
| `quy_luat` | Quy luật & logic | 2 |
| `sap_xep` | Sắp xếp & trình tự | 3 |

### Theme Groups (8)
| Code | Name | Số themes |
|------|------|-----------|
| `animals` | Động vật | 8 |
| `vehicles` | Xe cộ | 6 |
| `toys` | Đồ chơi | 6 |
| `music` | Âm nhạc | 5 |
| `fruits` | Trái cây | 5 |
| `vegetables` | Rau củ | 4 |
| `plants` | Thiên nhiên – hoa lá | 4 |
| `context` | Ngữ cảnh đời sống | 10 |

## Sử dụng trong Upload Form

### Client-side
```typescript
// Fetch học liệu data
const response = await fetch('/api/hoc-lieu');
const data = await response.json();

// Use options for select/multiselect
const levelOptions = data.levels.options;
const skillOptions = data.skills.options;
const themeOptions = data.themes.options;
```

### Server-side Validation
```typescript
import { validateSkillCodes, validateThemeCodes, validateLevelCode } from '../lib/hoc-lieu-constants';

// Validate before saving
const skillResult = validateSkillCodes(metadata.skills);
if (!skillResult.valid) {
  throw new Error(`Invalid skills: ${skillResult.invalid.join(', ')}`);
}
```

### API Validation
```typescript
// POST /api/hoc-lieu/validate
const response = await fetch('/api/hoc-lieu/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    level: 'lam_quen',
    skills: ['M34.COUNT_OBJECTS', 'M34.COMPARE_QTY'],
    themes: ['animals_home', 'fruits_count'],
  }),
});

const result = await response.json();
// { valid: true, errors: [], warnings: [], validatedData: {...} }
```

## Mapping với Game Model

Khi upload game, các trường học liệu được lưu vào `Game.metadata`:

```typescript
// Game document
{
  _id: ObjectId,
  gameId: "com.iruka.math-counting",
  title: "Đếm số lượng",
  
  // Curriculum mapping
  subject: "math",
  grade: "3-4",
  
  // Học liệu metadata
  metadata: {
    level: "lam_quen",
    skills: ["M34.COUNT_OBJECTS", "M34.COUNT_SELECT"],
    themes: ["animals_home", "fruits_count"],
    lesson: ["lesson_1"],
    linkGithub: "https://github.com/...",
    
    // Resolved data (for display)
    skillDetails: [
      { code: "M34.COUNT_OBJECTS", name: "Đếm số lượng đồ vật...", group: "Số & đếm" },
      ...
    ],
    themeDetails: [
      { code: "animals_home", name: "Con vật quanh nhà...", group: "Động vật" },
      ...
    ],
  },
}
```

## Validation Rules

### Required Fields
- `level`: Bắt buộc, phải là 1 trong 3 values
- `skills`: Bắt buộc, ít nhất 1 skill
- `themes`: Bắt buộc, ít nhất 1 theme

### Warnings (Best Practices)
- Skills > 5: "Nên chọn tối đa 5 kỹ năng để game tập trung hơn"
- Themes > 3: "Nên chọn tối đa 3 chủ đề để game nhất quán"

### Code Format
- Skills: `M34.{SKILL_NAME}` (e.g., `M34.COUNT_OBJECTS`)
- Themes: `{group}_{detail}` (e.g., `animals_home`)
- Levels: `lam_quen | tien_bo | thu_thach`

## Future Enhancements

1. **Multi-age support**: Thêm skills cho các độ tuổi khác (4-5, 5-6, etc.)
2. **Multi-subject**: Thêm skills cho các môn khác (Tiếng Việt, Tiếng Anh, etc.)
3. **Dynamic loading**: Load học liệu từ database thay vì constants
4. **Admin UI**: Cho phép admin thêm/sửa/xóa học liệu
5. **Skill dependencies**: Định nghĩa prerequisite skills
6. **Theme combinations**: Gợi ý theme phù hợp với skill đã chọn