# Game Deletion System - 3-Level Implementation

## Overview

This document describes the comprehensive 3-level game deletion system implemented for the Game Hub Manager. The system provides safe, auditable, and role-based deletion capabilities while preventing accidental data loss.

## Deletion Levels

### Level 1: Archive (Gỡ khỏi sản phẩm)
- **Purpose**: Remove game from production while preserving all data
- **Who**: CTO, Admin
- **Permission**: `games:archive`
- **API**: `POST /api/games/[id]/archive`
- **What happens**:
  - Changes live version status to `archived`
  - Removes game from Public Registry
  - Sets `disabled = true`
  - Preserves all data (DB + GCS)
  - Can be republished later

### Level 2: Soft Delete (Thùng rác)
- **Purpose**: Mark game as deleted but keep all data for recovery
- **Who**: Dev (own drafts), Admin (any game)
- **Permissions**: 
  - `games:delete_own_draft` (Dev)
  - `games:delete_soft` (Admin)
- **APIs**:
  - `DELETE /api/games/[id]/dev-draft` (Dev)
  - `DELETE /api/games/[id]/soft-delete` (Admin)
- **What happens**:
  - Sets `isDeleted = true`
  - Records `deletedAt`, `deletedBy`, `deleteReason`
  - Game hidden from all normal lists
  - Preserves all data (DB + GCS)
  - Can be restored via `POST /api/games/[id]/restore`

### Level 3: Hard Delete (Xóa vĩnh viễn)
- **Purpose**: Permanently delete game and all associated files
- **Who**: System/Super-admin only
- **Permission**: `games:delete_hard`
- **API**: `POST /api/games/[id]/hard-delete-request`
- **What happens**:
  - Creates deletion request (not immediate)
  - Background job verifies safety conditions
  - After 30-day retention period:
    - Deletes all GCS files
    - Deletes all related DB records
    - Removes game record from DB
  - **Cannot be undone**

## Role-Based Rules

### Dev
**Can delete**:
- Own draft games only
- Games that haven't been submitted to QC
- Via soft delete only

**Cannot delete**:
- Games that have been to QC
- Games owned by others
- Published games

**API**: `DELETE /api/games/[id]/dev-draft`

### QC
**Cannot delete anything**
- QC only marks games as pass/fail
- No deletion permissions

### CTO
**Can archive**:
- Any game in any status
- Removes from production
- Preserves all data

**Cannot**:
- Soft delete
- Hard delete

**API**: `POST /api/games/[id]/archive`

### Admin
**Can**:
- Archive games
- Soft delete any game
- Restore soft-deleted games
- Request hard deletion (with restrictions)

**Cannot**:
- Immediately hard delete
- Delete games with learner sessions
- Delete games in curriculum

**APIs**:
- `POST /api/games/[id]/archive`
- `DELETE /api/games/[id]/soft-delete`
- `POST /api/games/[id]/restore`
- `POST /api/games/[id]/hard-delete-request`

## Safety Mechanisms

### Soft Delete Safety
- Always preserves data
- Can be restored anytime
- Audit trail maintained
- No GCS files touched

### Hard Delete Safety
1. **Must be soft-deleted first**
2. **30-day retention period**
3. **Safety checks**:
   - No learner sessions
   - No lesson mappings
   - No active references
4. **Background job processing**
   - Not immediate
   - Verifies conditions
   - Can be monitored
5. **Audit logging**
   - All actions logged
   - Cannot be bypassed

## Database Schema

### Game Model Additions
```typescript
interface Game {
  // ... existing fields ...
  
  // Deletion metadata
  isDeleted: boolean;          // Soft delete flag
  deletedAt?: Date;            // When deleted
  deletedBy?: string;          // User ID who deleted
  deleteReason?: DeleteReason; // Why deleted
  gcsPath?: string;            // For GCS cleanup
}

type DeleteReason = 
  | 'dev_draft_deleted'
  | 'admin_soft_delete'
  | 'admin_hard_delete'
  | 'system_cleanup'
  | 'obsolete_test_game'
  | 'compliance_removal'
  | 'user_request';
```

## API Endpoints

### Dev Draft Delete
```
DELETE /api/games/[id]/dev-draft
```
- Soft deletes dev's own draft game
- Requires: `games:delete_own_draft`
- ABAC: Owner + Draft status + Never uploaded to QC

### Archive Game
```
POST /api/games/[id]/archive
Body: { gameId: string }
```
- Archives game (removes from production)
- Requires: `games:archive`
- Preserves all data

### Admin Soft Delete
```
DELETE /api/games/[id]/soft-delete
Body: { reason?: string }
```
- Soft deletes any game
- Requires: `games:delete_soft`
- Optional custom reason

### Restore Game
```
POST /api/games/[id]/restore
```
- Restores soft-deleted game
- Requires: `games:restore`
- Clears deletion metadata

### Hard Delete Request
```
POST /api/games/[id]/hard-delete-request
Body: { reason: string, force?: boolean }
```
- Requests permanent deletion
- Requires: `games:delete_hard`
- Creates deletion request for background job

### Trash Data
```
GET /api/admin/trash-data
```
- Gets all soft-deleted games
- Gets hard delete requests
- Admin only

## UI Components

### Admin Trash Management
**URL**: `/admin/trash`

Features:
- View all soft-deleted games
- View hard delete requests
- Restore games
- Request hard deletion
- Run hard delete job
- Stats dashboard

### Dashboard Integration
- "Trash Management" link in Admin Tools
- Quick access to deletion management
- Stats overview

## Background Job

### Hard Delete Job
**Script**: `scripts/hard-delete-games-job.ts`

**Usage**:
```bash
# Dry run (preview)
node scripts/hard-delete-games-job.ts --dry-run

# Execute
node scripts/hard-delete-games-job.ts
```

**Process**:
1. Finds games marked for hard deletion
2. Verifies 30-day retention period
3. Checks safety conditions
4. Deletes GCS files
5. Deletes related DB records
6. Removes game record
7. Logs all actions

**Cron Setup** (recommended):
```cron
# Run daily at 2 AM
0 2 * * * cd /path/to/project && node scripts/hard-delete-games-job.ts
```

## Audit Logging

All deletion actions are logged with:
- Actor (user, IP, user agent)
- Action type
- Target (game ID)
- Changes (before/after)
- Metadata (reason, type, etc.)

**New Action Types**:
- `GAME_ARCHIVE`
- `GAME_SOFT_DELETE`
- `GAME_HARD_DELETE_REQUEST`
- `GAME_HARD_DELETE_EXECUTED`
- `GAME_RESTORE`

## Query Patterns

### Exclude Deleted Games (Default)
```typescript
// All list queries should filter deleted
const games = await gameRepo.findAll(); // Already filters isDeleted: false
```

### Include Deleted Games (Admin Only)
```typescript
const game = await gameRepo.findByIdIncludeDeleted(id);
const deletedGames = await gameRepo.findDeleted();
```

### Find Hard Delete Candidates
```typescript
const candidates = await gameRepo.findMarkedForHardDeletion();
```

## Migration Guide

### For Existing Games
1. All existing games have `isDeleted: false` by default
2. No migration needed for basic functionality
3. Optional: Set `gcsPath` for existing games for easier cleanup

### For Existing Code
1. Update queries to use new repository methods
2. Replace direct deletion with appropriate API calls
3. Update UI to show deletion options based on role
4. Add deletion buttons with proper permissions

## Testing Checklist

- [ ] Dev can delete own draft
- [ ] Dev cannot delete submitted game
- [ ] Dev cannot delete others' games
- [ ] QC has no delete buttons
- [ ] CTO can archive any game
- [ ] Admin can soft delete
- [ ] Admin can restore
- [ ] Hard delete requires 30 days
- [ ] Hard delete checks safety
- [ ] Audit logs all actions
- [ ] Trash page shows correct data
- [ ] Background job works correctly

## Best Practices

1. **Always soft delete first**
   - Never skip to hard delete
   - Gives time to recover from mistakes

2. **Use appropriate level**
   - Archive for production removal
   - Soft delete for cleanup
   - Hard delete only when necessary

3. **Document reasons**
   - Always provide deletion reason
   - Helps with audit and recovery

4. **Monitor trash regularly**
   - Review soft-deleted games
   - Verify hard delete requests
   - Clean up old entries

5. **Test in staging first**
   - Verify deletion logic
   - Test restore functionality
   - Validate safety checks

## Troubleshooting

### Game won't delete
- Check user permissions
- Verify game status
- Check ownership (for dev)
- Review ABAC rules

### Can't restore game
- Verify game is soft-deleted
- Check admin permissions
- Ensure game still exists

### Hard delete not working
- Verify 30-day retention period
- Check safety conditions
- Review background job logs
- Ensure GCS permissions

## Future Enhancements

1. **Bulk operations**
   - Bulk soft delete
   - Bulk restore
   - Bulk archive

2. **Advanced safety checks**
   - Check learner sessions
   - Check lesson mappings
   - Check analytics data

3. **Deletion workflows**
   - Approval process for hard delete
   - Notification system
   - Scheduled deletions

4. **Recovery tools**
   - Restore with version selection
   - Partial restore
   - Clone deleted game

## Summary

The 3-level deletion system provides:
- ✅ Safe deletion with multiple safeguards
- ✅ Role-based access control
- ✅ Complete audit trail
- ✅ Data recovery capabilities
- ✅ Compliance with retention policies
- ✅ Protection against accidental deletion

All deletion operations are logged, reversible (except hard delete), and require appropriate permissions.