# Submit QC "No Version Found" Error Fix

## Problem
When calling `/api/games/submit-qc` with `gameId: "6942e6c54f2eae03b502b565"`, the API returns:
```json
{
  "error": "No version found for this game. Please upload a version first."
}
```

## Root Cause Analysis

The error occurs in `/src/pages/api/games/submit-qc.ts` at lines 68-74 when:

1. **Game exists but has no versions**: The game document exists in the `games` collection, but there are no corresponding documents in the `game_versions` collection.

2. **Missing latestVersionId reference**: The game's `latestVersionId` field is `null` or `undefined`, and the fallback query `versionRepo.findByGameId(gameId)` returns an empty array.

3. **Data inconsistency**: Versions exist but the `gameId` field in the version documents doesn't match the game's `_id`.

## Quick Fix Tools (UI)

### 1. Admin Fix Game Versions Page
**URL**: `/admin/fix-game-versions`

A comprehensive admin interface to:
- Fix all games with missing version references
- Fix specific games by ID
- Run dry-run to preview changes
- View detailed results with before/after states

**Access**: Available in Dashboard → Admin Tools → "Fix Game Versions"

### 2. Quick Debugger Component
**Location**: Available on `/admin/sync-games` and other admin pages

A compact debugging tool that allows you to:
- Enter a Game ID and instantly see its version status
- One-click fix for broken references
- Quick diagnosis without leaving the current page

**Usage**:
1. Enter Game ID: `6942e6c54f2eae03b502b565`
2. Click "Debug" to see the issue
3. Click "Fix" to repair it automatically

## Diagnostic Tools (API)

### 1. Debug Versions Endpoint
**New endpoint**: `GET /api/games/[id]/debug-versions`

Use this to inspect what versions exist for a game:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4321/api/games/6942e6c54f2eae03b502b565/debug-versions
```

Returns detailed information about:
- Game metadata
- All versions (active and deleted)
- Reference integrity (latestVersionId, liveVersionId)

### 2. Command Line Diagnostic Script
**New script**: `scripts/fix-submit-qc-issue.js`

```bash
node scripts/fix-submit-qc-issue.js 6942e6c54f2eae03b502b565
```

This script:
- Connects directly to MongoDB
- Shows game and version details
- Identifies missing references
- Offers to fix `latestVersionId` automatically

### 3. Admin Fix Utility
**New endpoint**: `POST /api/admin/fix-game-versions`

Batch fix for multiple games:
```bash
# Dry run (check what needs fixing)
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"dryRun": true}' \
  http://localhost:4321/api/admin/fix-game-versions

# Fix specific game
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"gameId": "6942e6c54f2eae03b502b565", "dryRun": false}' \
  http://localhost:4321/api/admin/fix-game-versions

# Fix all games
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"dryRun": false}' \
  http://localhost:4321/api/admin/fix-game-versions
```

## Code Improvements

### 1. Enhanced Error Messages
Updated `/src/pages/api/games/submit-qc.ts` to provide more helpful error information:

```typescript
return new Response(JSON.stringify({ 
  error: 'No version found for this game. Please upload a version first.',
  debug: {
    gameId: gameId,
    gameTitle: game.title,
    gameSlug: game.gameId,
    latestVersionId: game.latestVersionId?.toString() || null,
    suggestion: 'Use POST /api/games/' + gameId + '/upload-version to create a version first'
  }
}), {
  status: 404,
  headers: { 'Content-Type': 'application/json' }
});
```

### 2. Improved Error Handling
Enhanced `GameVersionRepository.findByGameId()` with:
- ObjectId validation
- Better error logging
- More robust error handling

### 3. Reference Integrity
The fix utility automatically updates `game.latestVersionId` when versions exist but the reference is missing.

## Resolution Steps

### For the Specific Game (6942e6c54f2eae03b502b565)

1. **Diagnose the issue**:
   ```bash
   node scripts/fix-submit-qc-issue.js 6942e6c54f2eae03b502b565
   ```

2. **If no versions exist**:
   - Create a version first using `POST /api/games/6942e6c54f2eae03b502b565/upload-version`
   - Complete Self-QA checklist
   - Then submit for QC

3. **If versions exist but reference is broken**:
   - Use the fix utility to repair `latestVersionId`
   - Then retry submit-qc

4. **If data is corrupted**:
   - Check version documents have correct `gameId` field
   - Ensure versions aren't soft-deleted (`isDeleted: false`)

### For Prevention

1. **Always create versions through the API**: Use `/api/games/[id]/upload-version` which automatically updates `latestVersionId`

2. **Monitor reference integrity**: The debug endpoint can be used in health checks

3. **Use the admin fix utility**: Run periodically to catch and fix reference issues

## API Usage Examples

### Create a Version
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "version": "1.0.0",
    "entryFile": "index.html",
    "releaseNote": "Initial version"
  }' \
  http://localhost:4321/api/games/6942e6c54f2eae03b502b565/upload-version
```

### Submit for QC (after creating version)
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"gameId": "6942e6c54f2eae03b502b565"}' \
  http://localhost:4321/api/games/submit-qc
```

## Files Modified/Created

### Modified Files
- `src/pages/api/games/submit-qc.ts` - Enhanced error messages
- `src/models/GameVersion.ts` - Improved error handling in `findByGameId()`
- `src/pages/dashboard/index.astro` - Added "Fix Game Versions" link to admin tools
- `src/pages/admin/sync-games.astro` - Added quick debugger component

### New Files
- `src/pages/admin/fix-game-versions.astro` - **Admin UI for fixing game versions**
- `src/components/GameVersionDebugger.astro` - **Quick debug component**
- `src/pages/api/games/[id]/debug-versions.ts` - Diagnostic endpoint
- `src/pages/api/admin/fix-game-versions.ts` - Admin fix utility API
- `scripts/fix-submit-qc-issue.js` - Command line diagnostic tool
- `docs/submit-qc-no-version-fix.md` - This documentation

## Quick Resolution Steps

### For Immediate Fix (Recommended)

1. **Go to Admin Dashboard**: `/dashboard`
2. **Click "Fix Game Versions"** in Admin Tools section
3. **Select "Game cụ thể"** and enter: `6942e6c54f2eae03b502b565`
4. **Click "Dry Run"** to see what will be fixed
5. **Click "Fix Now"** to apply the fix
6. **Try submit-qc again**

### Alternative: Quick Debugger

1. **Go to any admin page** (e.g., `/admin/sync-games`)
2. **Use the Quick Debugger** at the top
3. **Enter Game ID**: `6942e6c54f2eae03b502b565`
4. **Click "Debug"** to see the issue
5. **Click "Fix"** to repair automatically

## Testing

After implementing these fixes, test the flow:

1. **Test with no versions**: Should get helpful error message with debug info
2. **Test with broken reference**: Should be fixable with admin utility
3. **Test normal flow**: Should work after creating version and completing Self-QA
4. **Test diagnostic tools**: Should provide clear information about game state

The enhanced error messages and diagnostic tools will make it much easier to identify and resolve similar issues in the future.