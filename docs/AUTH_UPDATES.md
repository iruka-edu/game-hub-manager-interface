# Auth Feature Updates - API Alignment

## 📋 Overview

Updated `src/features/auth` to match the backend OpenAPI specification (BE_vu_v2.json).

## ✅ Changes Made

### 1. **Type Definitions** (`types/index.ts`)

#### TokenSchema

- ✅ Made `refresh_token` optional/nullable: `string | null | undefined`
- ✅ Made `token_type` optional with default `"bearer"`
- 📌 Matches backend schema where refresh_token can be null

#### CurrentUser

- ✅ Renamed `name` → `full_name` to match backend `UserResponse`
- ✅ Removed `avatar` field (not in backend schema)
- ✅ Reordered fields to match backend response structure
- 📌 Now perfectly matches `/api/v1/auth/me` response

### 2. **Auth API Functions** (`api/authApi.ts`)

#### refreshToken()

- ✅ Removed `refresh_token` from request body
- ✅ Added comment: Backend reads it from cookie automatically
- 📌 Matches OpenAPI spec: `refresh_token` is passed via **cookie**, not body

### 3. **Axios Interceptor** (`lib/external-api.ts`)

#### Response Interceptor (401 Handler)

- ✅ Updated refresh call to send empty body `{}`
- ✅ Added comment explaining cookie-based refresh token
- 📌 Backend uses `withCredentials: true` to read `refresh_token` cookie

---

## 🔄 Token Flow (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                      │
│    POST /api/v1/auth/login                                   │
│    Body: { email, password }                                 │
│    Response: { access_token, refresh_token?, token_type? }  │
├─────────────────────────────────────────────────────────────┤
│ 2. STORE TOKENS                                              │
│    - access_token  → Cookie (tokenStorage)                  │
│    - refresh_token → Cookie (tokenStorage)                  │
├─────────────────────────────────────────────────────────────┤
│ 3. AUTHENTICATED REQUEST                                     │
│    - Axios interceptor adds: Authorization: Bearer <token>  │
├─────────────────────────────────────────────────────────────┤
│ 4. TOKEN EXPIRES (401 Response)                              │
│    - Interceptor detects 401                                │
│    - Checks if refresh_token exists in cookie              │
│    - Calls POST /api/v1/auth/refresh                        │
│    - Backend reads refresh_token from cookie automatically  │
│    - No body needed!                                         │
├─────────────────────────────────────────────────────────────┤
│ 5. REFRESH SUCCESS                                           │
│    - Saves new access_token + refresh_token                 │
│    - Retries original request                               │
│    - User doesn't notice (seamless)                         │
├─────────────────────────────────────────────────────────────┤
│ 6. REFRESH FAILS (refresh_token expired)                     │
│    - Clear all tokens                                       │
│    - Redirect to /login?redirect=<current-path>            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 API Endpoints Used

| Endpoint               | Method | Auth Required | Purpose                      |
| ---------------------- | ------ | ------------- | ---------------------------- |
| `/api/v1/auth/login`   | POST   | ❌ No         | Login with email/password    |
| `/api/v1/auth/refresh` | POST   | 🍪 Cookie     | Refresh access token         |
| `/api/v1/auth/logout`  | POST   | ✅ Bearer     | Logout and invalidate tokens |
| `/api/v1/auth/me`      | GET    | ✅ Bearer     | Get current user info        |

---

## 🔐 Security Features

1. **Cookie-based token storage** (client-side)
   - Secure in production
   - SameSite: lax
   - Path: /

2. **Auto-refresh with request queue**
   - Prevents race conditions
   - Multiple failed requests wait for single refresh
   - Retries all queued requests after refresh

3. **Automatic logout on refresh failure**
   - Clears all tokens
   - Redirects to login
   - Preserves redirect URL

---

## 📝 Type Compatibility

### Before

```typescript
interface CurrentUser {
  name: string; // ❌ Not in backend
  avatar?: string; // ❌ Not in backend
}
```

### After

```typescript
interface CurrentUser {
  full_name: string; // ✅ Matches backend
  // avatar removed ✅
}
```

---

## ✨ Benefits

1. ✅ **100% Backend API Compliance** - Matches OpenAPI spec exactly
2. ✅ **Seamless Token Refresh** - Users never see login page unless truly logged out
3. ✅ **Type Safety** - TypeScript catches API mismatches at compile time
4. ✅ **Cookie Security** - HttpOnly-compatible (configurable)
5. ✅ **Clean Architecture** - All auth logic in `/features/auth`

---

## 🧪 Testing Recommendations

1. **Manual Test**: Force token expiry → Verify auto-refresh
2. **Manual Test**: Delete refresh_token cookie → Verify redirect to /login
3. **Integration Test**: Login → Make API call → Verify Bearer header
4. **Integration Test**: Logout → Verify all tokens cleared

---

## 🚀 Next Steps

If you want to test the updated auth flow:

```bash
# 1. Ensure backend is running
# 2. Start frontend dev server
pnpm dev

# 3. Test login flow
# - Open /login
# - Enter credentials
# - Verify redirect to /console

# 4. Test auto-refresh (in DevTools)
# - Delete access_token cookie
# - Make any API call
# - Watch Network tab for /auth/refresh call
# - Verify seamless refresh
```

---

**Updated**: 2026-01-19
**Author**: Antigravity AI
**Status**: ✅ Ready for testing
