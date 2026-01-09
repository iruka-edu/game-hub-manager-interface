# Auto-Update Setup cho @iruka-edu/game-core

## Tổng quan

Đã setup hệ thống auto-update để luôn sử dụng bản mới nhất của thư viện `@iruka-edu/game-core`.

## Scripts đã thêm

### 1. Package.json Scripts

```json
{
  "scripts": {
    "setup": "pnpm dlx dotenv-cli -- pnpm add @iruka-edu/game-core@latest",
    "setup-auth": "tsx scripts/setup-github-auth.ts",
    "update-game-core": "tsx scripts/update-game-core.ts",
    "force-update-game-core": "tsx scripts/force-update-game-core.ts",
    "check-game-core": "tsx scripts/update-game-core.ts --check-only",
    "auto-update": "bash scripts/auto-update-deps.sh",
    "auto-update:win": "powershell -ExecutionPolicy Bypass -File ./scripts/auto-update-deps.ps1"
  },
  "dependencies": {
    "@iruka-edu/game-core": "latest"
  }
}
```

### 2. Scripts Files

#### `scripts/setup-github-auth.ts`
- Kiểm tra GitHub authentication
- Hướng dẫn setup GITHUB_TOKEN
- Verify token từ .env hoặc environment

#### `scripts/update-game-core.ts`
- Smart update với version checking
- So sánh current vs latest version
- Handle authentication errors gracefully

#### `scripts/force-update-game-core.ts`
- Force update không cần check version
- Remove và reinstall package
- Update package.json to use "latest" tag

#### `scripts/auto-update-deps.sh` & `scripts/auto-update-deps.ps1`
- Automated update scripts cho CI/CD
- Cross-platform (Linux/Mac + Windows)
- Auto-commit option cho automated environments

## Cách sử dụng

### Lần đầu setup

```bash
# 1. Kiểm tra authentication
npm run setup-auth

# 2. Cài đặt package (nếu chưa có)
npm run setup
```

### Update thường xuyên

```bash
# Kiểm tra có update không
npm run check-game-core

# Update nếu có bản mới
npm run update-game-core

# Force update (luôn cài latest)
npm run force-update-game-core
```

### Automated update

```bash
# Linux/Mac
npm run auto-update

# Windows
npm run auto-update:win
```

## Authentication Setup

### GitHub Personal Access Token

1. **Tạo token**: https://github.com/settings/tokens
2. **Permissions**: `read:packages`
3. **Add to .env**:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

### Verify Authentication

```bash
npm run setup-auth
```

## Package Configuration

### .npmrc
```
@iruka-edu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### package.json
```json
{
  "dependencies": {
    "@iruka-edu/game-core": "latest"
  }
}
```

## Troubleshooting

### 401 Unauthorized
- Check GITHUB_TOKEN in .env
- Verify token has `read:packages` permission
- Run: `npm run setup-auth`

### 404 Not Found
- Package hosted on GitHub Packages, not npm registry
- Ensure .npmrc points to correct registry
- Check authentication

### Version Conflicts
- Use `npm run force-update-game-core` to reset
- Check installed vs declared version
- Clear node_modules if needed

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Setup GitHub Token
  run: echo "GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}" >> $GITHUB_ENV

- name: Auto-update dependencies
  run: npm run auto-update
  env:
    AUTO_COMMIT: true
```

### Manual Commands với dotenv

```bash
# Sử dụng token từ .env file
pnpm dlx dotenv-cli -- npm run update-game-core
pnpm dlx dotenv-cli -- npm run force-update-game-core
```

## Benefits

1. **Always Latest**: Luôn sử dụng bản mới nhất
2. **Automated**: Scripts tự động handle update process
3. **Cross-platform**: Hỗ trợ Windows, Linux, Mac
4. **CI/CD Ready**: Scripts cho automated environments
5. **Safe**: Version checking và rollback options

## Migration từ Fixed Version

Trước:
```json
"@iruka-edu/game-core": "^0.1.1"
```

Sau:
```json
"@iruka-edu/game-core": "latest"
```

Lợi ích:
- Tự động nhận updates
- Không cần manual version bumps
- Luôn sync với latest features và bug fixes