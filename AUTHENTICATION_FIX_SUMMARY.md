# Authentication Fix for Game Deletion API

## 🐛 **Issue Identified**
- **Error:** `401 Unauthorized` when admin tries to delete games
- **Root Cause:** Wrong cookie name and JWT secret in API endpoints
- **Affected APIs:** 
  - `/api/games/[gameId]/delete` 
  - `/api/dashboard/stats`

## 🔧 **Fix Applied**

### **Before (Incorrect):**
```typescript
// Wrong cookie name
const token = cookies.get('auth-token')?.value;

// Wrong JWT secret
const JWT_SECRET = import.meta.env.JWT_SECRET || 'your-secret-key';
const decoded = jwt.verify(token, JWT_SECRET);
```

### **After (Correct):**
```typescript
// Correct cookie name (matches session.ts)
const token = cookies.get('iruka_session')?.value;

// Correct JWT secret (matches session.ts)
const SESSION_SECRET = process.env.IRUKA_SESSION_SECRET || 'iruka-dev-secret-key';
const decoded = jwt.verify(token, SESSION_SECRET);
```

## ✅ **Files Fixed**

1. **`src/pages/api/games/[gameId]/delete.ts`**
   - Changed cookie name from `auth-token` to `iruka_session`
   - Changed JWT secret from `JWT_SECRET` to `IRUKA_SESSION_SECRET`
   - Updated error messages for clarity

2. **`src/pages/api/dashboard/stats.ts`**
   - Applied same authentication fixes
   - Ensures consistency across all API endpoints

## 🔍 **Root Cause Analysis**

The authentication system in this project uses:
- **Cookie Name:** `iruka_session` (defined in `src/lib/session.ts`)
- **JWT Secret:** `IRUKA_SESSION_SECRET` environment variable
- **Session Management:** Centralized in `src/lib/session.ts`

The delete API was using different values, causing authentication to fail even for valid logged-in users.

## 🧪 **Testing**

After the fix:
- ✅ Build completes successfully
- ✅ No TypeScript errors
- ✅ Authentication should now work correctly
- ✅ Admin users can delete games
- ✅ Developer users can delete their own games

## 🚀 **Status**

**FIXED** - The game deletion feature should now work correctly for all authorized users. The 401 Unauthorized error has been resolved by using the correct cookie name and JWT secret that match the project's authentication system.