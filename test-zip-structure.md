# Test ZIP Structure Examples

## Ví dụ 1: ZIP với thư mục build
```
game.zip
├── build/
│   ├── index.html          ← Tìm thấy ở đây, dùng build/ làm root
│   ├── game.js
│   ├── style.css
│   └── assets/
│       ├── images/
│       │   └── sprite.png
│       └── sounds/
│           └── music.mp3
├── src/                    ← Bỏ qua thư mục này
│   └── main.ts
└── README.md               ← Bỏ qua file này
```

**Kết quả upload:**
- `games/{gameId}/{version}/index.html`
- `games/{gameId}/{version}/game.js`
- `games/{gameId}/{version}/style.css`
- `games/{gameId}/{version}/assets/images/sprite.png`
- `games/{gameId}/{version}/assets/sounds/music.mp3`

## Ví dụ 2: ZIP với thư mục dist
```
project.zip
├── dist/
│   ├── index.html          ← Tìm thấy ở đây, dùng dist/ làm root
│   ├── bundle.js
│   └── assets/
│       └── textures/
│           └── player.png
├── node_modules/           ← Bỏ qua
└── package.json            ← Bỏ qua
```

**Kết quả upload:**
- `games/{gameId}/{version}/index.html`
- `games/{gameId}/{version}/bundle.js`
- `games/{gameId}/{version}/assets/textures/player.png`

## Ví dụ 3: ZIP với index.html ở root
```
simple-game.zip
├── index.html              ← Tìm thấy ở root, dùng root
├── main.js
└── style.css
```

**Kết quả upload:**
- `games/{gameId}/{version}/index.html`
- `games/{gameId}/{version}/main.js`
- `games/{gameId}/{version}/style.css`

## Ví dụ 4: ZIP với cấu trúc phức tạp
```
complex-game.zip
├── project/
│   ├── build/
│   │   ├── web/
│   │   │   ├── index.html  ← Tìm thấy ở đây, dùng project/build/web/ làm root
│   │   │   ├── app.js
│   │   │   └── assets/
│   │   │       └── data.json
│   │   └── mobile/
│   │       └── app.apk
│   └── src/
│       └── code.ts
└── docs/
    └── README.md
```

**Kết quả upload:**
- `games/{gameId}/{version}/index.html`
- `games/{gameId}/{version}/app.js`
- `games/{gameId}/{version}/assets/data.json`

## Logic hoạt động:

1. **Tìm index.html**: Quét tất cả files trong ZIP để tìm file có tên kết thúc bằng `index.html`
2. **Xác định root**: Lấy thư mục chứa `index.html` làm root directory
3. **Filter files**: Chỉ upload các files nằm trong root directory
4. **Tính relative path**: Loại bỏ root prefix để tạo relative path cho GCS
5. **Upload**: Upload tất cả files với structure đúng lên GCS

## Lợi ích:

- ✅ Tự động bỏ qua source code, node_modules, docs
- ✅ Chỉ upload files cần thiết cho game
- ✅ Giữ nguyên cấu trúc thư mục từ root
- ✅ Hỗ trợ mọi cấu trúc build tool (Webpack, Vite, Parcel, etc.)
- ✅ Không cần user phải tạo ZIP theo format cụ thể