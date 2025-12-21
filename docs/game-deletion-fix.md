# Game Deletion Fix - Index Page

## Problem
When deleting a game from the index page, the game would still appear after deletion. Attempting to delete it again would result in the error: "Xóa game thất bại: Game không tồn tại."

## Root Cause
The delete API (`/api/games/delete`) was still using the old `RegistryManager` system, which only deleted games from the old `registry/index.json` file. However, the index page was updated to load games from the new MongoDB database system. This mismatch caused:

1. Games to be deleted from the old registry but remain in the database
2. The index page to continue showing games that were "deleted"
3. Second deletion attempts to fail because the game was already removed from the old registry

## Solution

### 1. Updated Delete API (`src/pages/api/games/delete.ts`)

**Changes:**
- Migrated from `RegistryManager` to `GameRepository` and `GameVersionRepository`
- Implemented proper soft deletion for both games and versions
- Added validation to prevent deleting:
  - The last remaining version of a game
  - A version that is currently published (live)
- Added public registry cleanup when deleting published games
- Maintained audit logging for compliance

**Key Features:**
- **Soft Delete**: Games and versions are marked as deleted (`isDeleted: true`) rather than hard deleted, preserving audit trail
- **Version Protection**: Cannot delete the only version or the currently published version
- **Cascade Deletion**: When deleting a game, all its versions are also soft deleted
- **Registry Sync**: Removes game from public registry if it was published
- **GCS Cleanup**: Deletes files from Google Cloud Storage

### 2. Improved GameCard Component (`src/components/GameCard.astro`)

**Changes:**
- Removed page reload after deletion
- Implemented smooth DOM removal with animation
- Added success notification toast
- Updated confirmation message to mention "database" instead of "registry"
- Handles empty state when all games are deleted

**User Experience Improvements:**
- ✅ Instant visual feedback - card fades out and disappears
- ✅ No page reload required - faster and smoother
- ✅ Success notification appears in top-right corner
- ✅ Proper empty state handling when no games remain

## Technical Details

### Delete API Flow

**For Full Game Deletion:**
```
1. Find game by gameId in database
2. Validate game exists
3. Soft delete all versions
4. Soft delete the game
5. Remove from public registry (if published)
6. Delete files from GCS
7. Log audit entry
8. Return success
```

**For Version Deletion:**
```
1. Find game and version in database
2. Validate both exist
3. Check if it's the only version (prevent deletion)
4. Check if it's the live version (prevent deletion)
5. Soft delete the version
6. Update game's latestVersionId if needed
7. Delete files from GCS
8. Log audit entry
9. Return success
```

### Database Changes
- Games: `isDeleted: true` flag set
- Versions: `isDeleted: true` flag set
- References: `latestVersionId` updated if deleted version was latest
- Public Registry: Game removed if it was published

### Frontend Changes
- No page reload - immediate DOM manipulation
- Smooth fade-out animation (0.3s)
- Success toast notification (3s duration)
- Empty state detection and display

## Testing Checklist

- [x] Delete a draft game → Should remove from database and UI
- [x] Delete a published game → Should remove from database, UI, and public registry
- [x] Try to delete same game twice → Should show "Game không tồn tại" error
- [x] Delete all games → Should show empty state
- [x] Delete a specific version → Should work if not the only/live version
- [x] Try to delete the only version → Should show error
- [x] Try to delete the live version → Should show error

## Files Modified

1. `src/pages/api/games/delete.ts` - Migrated to database system
2. `src/components/GameCard.astro` - Improved UX with smooth deletion

## Related Issues

This fix completes the migration from the old registry system to the new database system for game management. The index page, delete functionality, and all related features now consistently use MongoDB as the source of truth.

## Migration Notes

**Old System:**
- Games stored in `registry/index.json` (GCS)
- Delete API used `RegistryManager.deleteGame()`
- Page reload required after deletion

**New System:**
- Games stored in MongoDB (`games` and `game_versions` collections)
- Delete API uses `GameRepository` and `GameVersionRepository`
- Smooth DOM removal without page reload
- Soft delete for audit trail preservation
