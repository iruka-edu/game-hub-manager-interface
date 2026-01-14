# Mobile Authentication Fixes

## Vấn đề đã được sửa

### 1. Cookie SameSite Settings
**Vấn đề**: Cookie với `SameSite=Lax` có thể bị mobile browsers từ chối trong một số trường hợp.

**Giải pháp**:
- **Development**: Sử dụng `SameSite=Lax` (không cần HTTPS)
- **Production**: Sử dụng `SameSite=None; Secure` (yêu cầu HTTPS)

### 2. Cookie Security Headers
**Vấn đề**: Thiếu `Secure` flag cho HTTPS và cache headers không phù hợp.

**Giải pháp**:
- Thêm `Secure` flag trong production
- Thêm cache control headers để tránh cache session data
- Cải thiện error handling trong middleware

### 3. Client-side Navigation
**Vấn đề**: `router.push()` có thể không đảm bảo cookies được set đúng cách trên mobile.

**Giải pháp**:
- Sử dụng `window.location.href` để force hard navigation
- Thêm `credentials: 'same-origin'` trong fetch requests
- Cải thiện redirect handling với query parameters

### 4. Session Verification
**Vấn đề**: Middleware không xử lý tốt session verification errors trên mobile.

**Giải pháp**:
- Enhanced error handling trong middleware
- Proper cookie clearing khi session invalid
- Better mobile user agent detection

## Files đã được cập nhật

### Core Authentication
- `src/lib/session.ts` - Cookie settings và security headers
- `middleware.ts` - Enhanced session verification và error handling
- `src/app/api/auth/login/route.ts` - Mobile-compatible login response
- `src/app/login/page.tsx` - Hard navigation sau khi login

### New Utilities
- `src/lib/client-auth.ts` - Client-side auth utilities
- `src/app/api/auth/me/route.ts` - Auth status endpoint
- `src/components/auth/AuthGuard.tsx` - Client-side auth guard

### Testing
- `src/lib/__tests__/mobile-auth.test.ts` - Tests cho mobile auth fixes

## Cách test

### 1. Test trên Mobile Device
```bash
# Mở Chrome DevTools
# Chọn Device Toolbar (Ctrl+Shift+M)
# Chọn mobile device (iPhone, Android)
# Test login flow
```

### 2. Test Cookie Settings
```javascript
// Trong browser console sau khi login
document.cookie
// Kiểm tra xem cookie có đúng settings không
```

### 3. Test Session Persistence
```bash
# Login trên mobile
# Navigate giữa các tabs trong console
# Refresh page
# Kiểm tra không bị redirect về login
```

## Environment Variables cần thiết

```env
# Production
NODE_ENV=production
IRUKA_SESSION_SECRET=your-secret-key

# Development
NODE_ENV=development
IRUKA_SESSION_SECRET=your-secret-key
```

## Deployment Notes

### Production (HTTPS required)
- Cookies sẽ có `SameSite=None; Secure`
- Yêu cầu HTTPS để hoạt động
- Tương thích với tất cả mobile browsers

### Development (HTTP OK)
- Cookies sẽ có `SameSite=Lax`
- Hoạt động với HTTP localhost
- Tương thích với development workflow

## Troubleshooting

### Nếu vẫn bị logout trên mobile:

1. **Kiểm tra HTTPS**: Production phải dùng HTTPS
2. **Kiểm tra cookies**: Xem trong DevTools > Application > Cookies
3. **Kiểm tra console errors**: Xem có lỗi JavaScript không
4. **Test với different browsers**: Safari, Chrome mobile, Firefox mobile

### Debug commands:

```javascript
// Check session cookie
document.cookie.includes('iruka_session')

// Check auth status
fetch('/api/auth/me').then(r => r.json()).then(console.log)

// Manual logout
fetch('/api/auth/logout', {method: 'POST'})
```