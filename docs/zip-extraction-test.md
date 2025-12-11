# ZIP Extraction Logic Test

## Vấn đề đã được sửa

Trước đây, logic giải nén ZIP có thể bỏ qua các file trong thư mục con do cách xử lý đường dẫn không chính xác.

## Cải thiện đã thực hiện

### 1. API Upload ZIP (`src/pages/api/upload-zip.ts`)

#### Trước:
```javascript
// Logic cũ - có thể bỏ qua file
const pathParts = fileName.split('/');
const cleanPath = pathParts.length > 1 && pathParts[0] !== '' ? pathParts.slice(1).join('/') : fileName;
```

#### Sau:
```javascript
// Logic mới - phân tích cấu trúc ZIP trước
const allFilePaths = Object.keys(zipContent.files).filter(fileName => !zipContent.files[fileName].dir);
let commonRootFolder = '';

// Phát hiện thư mục gốc chung
if (allFilePaths.length > 0) {
  const firstPath = allFilePaths[0];
  const firstPathParts = firstPath.split('/');
  
  if (firstPathParts.length > 1) {
    const potentialRoot = firstPathParts[0];
    const allHaveSameRoot = allFilePaths.every(path => path.startsWith(potentialRoot + '/'));
    
    if (allHaveSameRoot) {
      const rootLower = potentialRoot.toLowerCase();
      if (['dist', 'build', 'public', 'output', 'static', 'www'].includes(rootLower) || 
          potentialRoot.includes('-') || potentialRoot.includes('_')) {
        commonRootFolder = potentialRoot;
      }
    }
  }
}

// Xử lý từng file
let cleanPath = fileName;
if (cleanPath.startsWith('/')) {
  cleanPath = cleanPath.substring(1);
}

// Loại bỏ thư mục gốc chung nếu có
if (commonRootFolder && cleanPath.startsWith(commonRootFolder + '/')) {
  cleanPath = cleanPath.substring(commonRootFolder.length + 1);
}
```

### 2. API Upload thông thường (`src/pages/api/upload.ts`)

#### Cải thiện:
- Tạo Map để lưu trữ đường dẫn đã xử lý cho mỗi file
- Xử lý nhất quán các thư mục build output
- Thêm logging chi tiết để debug

### 3. Logging được cải thiện

Cả hai API giờ đây đều có logging chi tiết:
```javascript
console.log(`[Upload ZIP] Folder structure:`);
Object.entries(progress.folders).forEach(([folder, info]) => {
  console.log(`  ${folder}: ${info.files.join(', ')}`);
});
```

## Test Cases

### Case 1: ZIP với thư mục dist/
```
game.zip
├── dist/
│   ├── index.html
│   ├── js/
│   │   ├── main.js
│   │   └── utils.js
│   └── css/
│       └── style.css
```

**Kết quả mong đợi:**
- `index.html` → `games/{id}/{version}/index.html`
- `js/main.js` → `games/{id}/{version}/js/main.js`
- `js/utils.js` → `games/{id}/{version}/js/utils.js`
- `css/style.css` → `games/{id}/{version}/css/style.css`

### Case 2: ZIP với thư mục static/js/
```
game.zip
├── static/
│   ├── index.html
│   └── js/
│       ├── app.js
│       └── lib/
│           └── jquery.js
```

**Kết quả mong đợi:**
- `index.html` → `games/{id}/{version}/index.html`
- `js/app.js` → `games/{id}/{version}/js/app.js`
- `js/lib/jquery.js` → `games/{id}/{version}/js/lib/jquery.js`

### Case 3: ZIP không có thư mục gốc
```
game.zip
├── index.html
├── js/
│   └── main.js
└── assets/
    └── image.png
```

**Kết quả mong đợi:**
- `index.html` → `games/{id}/{version}/index.html`
- `js/main.js` → `games/{id}/{version}/js/main.js`
- `assets/image.png` → `games/{id}/{version}/assets/image.png`

## Cách kiểm tra

1. **Upload ZIP file** với cấu trúc thư mục phức tạp
2. **Kiểm tra console logs** để xem cấu trúc thư mục được phát hiện
3. **Kiểm tra GCS bucket** để đảm bảo tất cả file đều được upload đúng vị trí
4. **Test game** để đảm bảo các file JS trong thư mục con được load đúng

## Lợi ích

1. **Không bỏ qua file**: Tất cả file trong thư mục con đều được xử lý
2. **Cấu trúc linh hoạt**: Hỗ trợ nhiều cấu trúc ZIP khác nhau
3. **Debug dễ dàng**: Logging chi tiết giúp phát hiện vấn đề
4. **Tính nhất quán**: Logic xử lý giống nhau cho cả ZIP và folder upload