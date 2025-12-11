# Chuẩn Validation Game - Iruka Hub Manager

## Tổng quan
Hệ thống validation đảm bảo tất cả game tuân thủ chuẩn Iruka, từ naming convention đến technical requirements.

## 🆔 Chuẩn đặt tên Game ID

### Format bắt buộc
```
com.iruka.<slug>
```

### Quy tắc slug
- **Độ dài**: 3-48 ký tự
- **Ký tự**: chỉ `a-z`, `0-9`, dấu gạch ngang `-`
- **Kebab-case**: `memory-match`, `number-ninja`
- **Không được**: 
  - Viết hoa: `Memory-Match` ❌
  - Dấu gạch dưới: `memory_match` ❌
  - Hai dấu gạch liền: `memory--match` ❌

### Ví dụ hợp lệ
```json
{
  "id": "com.iruka.bubbles-game",
  "id": "com.iruka.memory-match",
  "id": "com.iruka.number-ninja"
}
```

### Ví dụ không hợp lệ
```json
{
  "id": "com.iruka.Bubbles-Game",    // ❌ Viết hoa
  "id": "com.iruka.bubbles_game",    // ❌ Dấu gạch dưới
  "id": "com.iruka.bubbles--game",   // ❌ Hai dấu gạch
  "id": "iruka.bubbles",             // ❌ Thiếu com.
  "id": "com.iruka.bg"               // ❌ Quá ngắn
}
```

## 📝 Chuẩn đặt tên Title

### Quy tắc
- **Độ dài**: 3-40 ký tự
- **Ký tự**: Unicode OK (Việt/Anh), không emoji, không ký tự điều khiển
- **Format**: không khoảng trắng đầu/cuối, không toàn chữ HOA
- **Style**: Title Case hoặc Sentence case

### Ví dụ hợp lệ
```json
{
  "title": "Memory Match Pro",
  "title": "Săn Bóng Số",
  "title": "Bubbles Game",
  "title": "Math Adventure"
}
```

### Ví dụ không hợp lệ
```json
{
  "title": " Math Game ",           // ❌ Khoảng trắng đầu/cuối
  "title": "🔥Bubbles Game🔥",      // ❌ Emoji
  "title": "MEMORY MATCH PRO",      // ❌ Toàn chữ HOA
  "title": "MG",                    // ❌ Quá ngắn
  "title": "This is a very very long game title that exceeds limit"  // ❌ Quá dài
}
```

## 🔢 Chuẩn Version (SemVer)

### Format
```
MAJOR.MINOR.PATCH[-prerelease][+build]
```

### Quy tắc Production
- **Stable**: `1.0.0`, `2.1.3` ✅
- **Prerelease**: `1.0.0-beta.1` ⚠️ (cảnh báo)
- **Development**: `0.1.0` ⚠️ (cảnh báo)

### Ví dụ
```json
{
  "version": "1.0.0",           // ✅ Production ready
  "version": "2.1.3",           // ✅ Stable release
  "version": "1.0.0-beta.1",    // ⚠️ Prerelease
  "version": "0.5.0",           // ⚠️ Development
  "version": "1.0.0+20231201"   // ⚠️ Build metadata
}
```

## 🔗 URLs & Technical Requirements

### Entry URL
- **Format**: `https://domain/games/{id}/{version}/index.html`
- **Phải khớp**: ID và version trong manifest
- **HTTPS**: Bắt buộc

### Icon URL
- **Format**: `https://domain/path/icon.{ext}`
- **Extensions**: PNG, JPG, JPEG, WebP, SVG
- **HTTPS**: Bắt buộc

### Runtime
- `iframe-html`: Game HTML5 thông thường
- `esm-module`: ES Module game

### Capabilities
Chỉ sử dụng các giá trị được phép:
- `score`: Hệ thống điểm số
- `save-progress`: Lưu tiến độ
- `levels`: Nhiều level
- `hints`: Gợi ý
- `audio`: Âm thanh
- `telemetry`: Thu thập dữ liệu
- `leaderboard`: Bảng xếp hạng

## 📋 Schema Validation

### Manifest Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Iruka Game Manifest",
  "type": "object",
  "required": ["id", "title", "version", "runtime", "entryUrl"],
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 64,
      "pattern": "^com\\.iruka\\.[a-z](?:[a-z0-9]*)(?:-[a-z0-9]+)*$"
    },
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 40
    },
    "version": {
      "type": "string",
      "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-(?:0|[1-9]\\d*|\\d*[a-zA-Z-][\\da-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][\\da-zA-Z-]*))*)?(?:\\+[\\da-zA-Z-]+(\\.[\\da-zA-Z-]+)*)?$"
    },
    "runtime": {
      "enum": ["iframe-html", "esm-module"]
    },
    "entryUrl": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

## 🛠️ Validation Tools

### CLI Validator
```bash
# Validate specific game
pnpm iruka-game:validate ./dist

# Show validation checklist
pnpm iruka-game:validate --checklist

# Generate manifest template
pnpm iruka-game:validate --template com.iruka.my-game "My Game"
```

### Batch Validation
```bash
# Validate all games in directory
pnpm validate:manifest
```

### Web Interface
- Upload form có real-time validation
- Hiển thị errors, warnings, suggestions
- Auto-generate manifest từ form

## ✅ Validation Checklist

### Pre-upload Checklist
- [ ] **ID đúng format**: `com.iruka.<slug>` với kebab-case
- [ ] **Title hợp lệ**: 3-40 ký tự, Title Case, không emoji
- [ ] **Version SemVer**: x.y.z, khuyến nghị stable cho production
- [ ] **Entry URL**: HTTPS, khớp ID + version, kết thúc `/index.html`
- [ ] **Runtime**: `iframe-html` hoặc `esm-module`
- [ ] **Files**: có `index.html` và `manifest.json`
- [ ] **Capabilities**: chỉ sử dụng giá trị được phép

### Production Checklist
- [ ] Version ≥ 1.0.0 (không phải 0.x.x)
- [ ] Không có prerelease suffix
- [ ] Icon URL hợp lệ
- [ ] Tested trên staging environment
- [ ] Performance acceptable
- [ ] No console errors

## 🚨 Common Errors & Solutions

### ID Errors
```
❌ ID không đúng format com.iruka.<slug>
💡 Sử dụng: com.iruka.my-awesome-game

❌ ID không được có dấu gạch dưới
💡 Thay thế: memory_match → memory-match

❌ ID không được có hai dấu gạch liền nhau
💡 Sửa: memory--match → memory-match
```

### Title Errors
```
❌ Tên game không được có khoảng trắng ở đầu/cuối
💡 Sử dụng: "Memory Game" thay vì " Memory Game "

❌ Tên game không được viết toàn chữ HOA
💡 Sử dụng: "Memory Game" thay vì "MEMORY GAME"

❌ Tên game không được chứa emoji
💡 Sử dụng: "Fire Game" thay vì "🔥 Fire Game"
```

### Version Errors
```
❌ Version không đúng format SemVer
💡 Sử dụng: "1.0.0" thay vì "v1.0" hoặc "1.0"

⚠️ Version 0.x.x cho thấy game đang phát triển
💡 Cân nhắc: "1.0.0" cho production

⚠️ Version có prerelease suffix
💡 Sử dụng: "1.0.0" thay vì "1.0.0-beta.1" cho production
```

## 📊 Validation Levels

### ❌ ERROR (Blocking)
- Thiếu trường bắt buộc
- Format không đúng (ID, version, URLs)
- Ký tự không hợp lệ
- File thiếu (index.html, manifest.json)

### ⚠️ WARNING (Non-blocking)
- Version 0.x.x
- Prerelease/build metadata
- Performance concerns

### 💡 SUGGESTION (Enhancement)
- Title Case recommendations
- Capability suggestions
- Best practice tips

## 🎯 Integration

### Upload Flow
1. **File Selection** → Basic file validation
2. **Manifest Detection** → Schema validation
3. **Enhanced Validation** → Custom rules + suggestions
4. **User Review** → Show errors/warnings/suggestions
5. **Upload** → Server-side re-validation
6. **Success** → Game deployed

### Development Workflow
1. **Build Game** → Standard build process
2. **Pre-validate** → `pnpm iruka-game:validate ./dist`
3. **Fix Issues** → Address errors/warnings
4. **Upload** → Web interface or API
5. **Deploy** → Automatic deployment

Validation system đảm bảo quality và consistency cho tất cả games trong Iruka ecosystem.