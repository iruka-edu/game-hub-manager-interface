# Design Document: Dashboard Fixes and Improvements

## Overview

This design addresses critical UI/UX bugs and missing functionality across all role-based dashboards and consoles in the GameHub Manager system. The system is built with Astro (SSR), TypeScript, MongoDB, and uses a role-based access control (RBAC) model with five user roles: Manager, Developer, QC, CTO, and Admin.

The core issue is that while data exists in the database and APIs are partially implemented, the frontend lacks proper bindings, event handlers, and state management. This design focuses on completing the end-to-end workflows for version management, game editing, status transitions, and role-specific dashboards.

## Architecture

### Technology Stack

- **Frontend**: Astro (SSR) with TypeScript
- **Backend**: Astro API routes (serverless functions)
- **Database**: MongoDB with three main collections:
  - `games`: Game metadata and references
  - `game_versions`: Version-specific data and status
  - `users`: User accounts and roles
- **Storage**: Google Cloud Storage (GCS) for game files
- **Testing**: Vitest with fast-check for property-based testing

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Manager    │  │  Developer   │  │   QC/CTO/    │      │
│  │  Dashboard   │  │   Console    │  │    Admin     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Astro SSR Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages (.astro files)                                │   │
│  │  - Render UI with role-specific data                 │   │
│  │  - Handle client-side interactions                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                          │
│  /api/games/list        - Get games with filters            │
│  /api/games/[id]/...    - Game CRUD operations              │
│  /api/games/publish     - Publish game                      │
│  /api/games/update      - Update game metadata              │
│  /api/versions/...      - Version management (TO ADD)       │
│  /api/dashboard/...     - Role-specific stats (TO ADD)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│  GameRepository         - Game CRUD                          │
│  GameVersionRepository  - Version CRUD                       │
│  UserRepository         - User management                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB                                 │
│  games collection       - Game metadata                      │
│  game_versions          - Version data                       │
│  users                  - User accounts                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Current State (Broken)**:
1. User interacts with UI → No event handlers attached
2. Filters change → No API calls made
3. Buttons clicked → No navigation or state updates
4. Data exists in DB → Not fetched or displayed correctly

**Target State (Fixed)**:
1. User interacts with UI → Event handlers trigger
2. Filters change → API called with query params → UI re-renders
3. Buttons clicked → Navigation occurs or API called → State updated
4. Data fetched from DB → Properly displayed with correct mappings

## Components and Interfaces

### 1. API Endpoints (New and Modified)

#### Version Management APIs

```typescript
// GET /api/games/[id]/versions
// Returns all versions for a game (not just latest)
interface VersionListResponse {
  versions: Array<{
    _id: string;
    version: string;
    status: VersionStatus;
    createdAt: string;
    submittedBy: string;
    submittedByName: string; // User name, not ID
  }>;
}

// POST /api/games/[id]/versions/[versionId]/activate
// Activates a specific version
interface ActivateVersionRequest {
  gameId: string;
  versionId: string;
}
interface ActivateVersionResponse {
  success: boolean;
  game: Game; // Updated game with new liveVersionId
}

// DELETE /api/games/[id]/versions/[versionId]
// Soft deletes a version
interface DeleteVersionRequest {
  gameId: string;
  versionId: string;
}
interface DeleteVersionResponse {
  success: boolean;
  message: string;
}

// POST /api/games/[id]/versions/create
// Creates a new version
interface CreateVersionRequest {
  gameId: string;
  version?: string; // Optional, auto-increment if not provided
  releaseNote?: string;
}
interface CreateVersionResponse {
  success: boolean;
  version: GameVersion;
}
```

#### Dashboard Statistics APIs

```typescript
// GET /api/dashboard/dev
interface DevDashboardResponse {
  stats: {
    drafts: number;
    qcFailed: number;
    uploaded: number;
    published: number;
  };
  recentGames: Game[]; // Top 5 most recent
}

// GET /api/dashboard/qc
interface QCDashboardResponse {
  stats: {
    awaitingQC: number;
    testedThisWeek: number;
    testedThisMonth: number;
    passFailRatio: { passed: number; failed: number };
  };
  gamesNeedingQC: Game[];
}

// GET /api/dashboard/cto
interface CTODashboardResponse {
  stats: {
    awaitingApproval: number;
    approvedThisWeek: number;
    approvedThisMonth: number;
  };
  gamesAwaitingApproval: Game[];
}

// GET /api/dashboard/admin
interface AdminDashboardResponse {
  stats: {
    published: number;
    archived: number;
    awaitingPublication: number;
  };
  gamesAwaitingPublication: Game[];
  recentlyPublished: Game[];
}
```

#### Game Management APIs (Modified)

```typescript
// GET /api/games/list (Modified to support filters)
interface GameListRequest {
  status?: GameStatus;
  ownerId?: string;
  subject?: string;
  grade?: string;
  isDeleted?: boolean; // Default: false
}

// GET /api/games/[id] (Modified to include user names)
interface GameDetailResponse {
  game: Game;
  responsibleUser: {
    _id: string;
    name: string;
    email: string;
  } | null;
  versions: GameVersion[]; // All versions, not just latest
}

// PUT /api/games/[id]/edit
interface UpdateGameRequest {
  title?: string;
  description?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  ownerId?: string; // Can update responsible user
  tags?: string[];
}

// POST /api/games/[id]/request-change (New)
interface RequestChangeRequest {
  gameId: string;
  note: string;
}
interface RequestChangeResponse {
  success: boolean;
  game: Game; // Status changed to qc_failed
}

// GET /api/games/[id]/history (New)
interface GameHistoryResponse {
  history: Array<{
    timestamp: string;
    action: string;
    actor: string;
    actorName: string;
    oldStatus?: string;
    newStatus?: string;
    note?: string;
  }>;
}

// GET /api/games/[id]/qc-reports (New)
interface QCReportsResponse {
  reports: Array<{
    _id: string;
    versionId: string;
    version: string;
    tester: string;
    testerName: string;
    result: 'pass' | 'fail';
    note: string;
    severity?: 'low' | 'medium' | 'high';
    testedAt: string;
  }>;
}
```

### 2. Frontend Components

#### Filter Component

```typescript
// components/GameFilters.astro
interface FilterState {
  status: GameStatus | 'all';
  ownerId: string | 'all';
  subject: string | 'all';
  grade: string | 'all';
}

// Event handler
function handleFilterChange(filters: FilterState) {
  const queryParams = new URLSearchParams();
  if (filters.status !== 'all') queryParams.set('status', filters.status);
  if (filters.ownerId !== 'all') queryParams.set('ownerId', filters.ownerId);
  if (filters.subject !== 'all') queryParams.set('subject', filters.subject);
  if (filters.grade !== 'all') queryParams.set('grade', filters.grade);
  
  // Fetch filtered games
  fetch(`/api/games/list?${queryParams.toString()}`)
    .then(res => res.json())
    .then(data => updateGameList(data.games));
}
```

#### Version Management Component

```typescript
// components/VersionManager.astro
interface VersionManagerProps {
  gameId: string;
  versions: GameVersion[];
  activeVersionId: string | null;
}

// Activate version handler
async function activateVersion(gameId: string, versionId: string) {
  const response = await fetch(`/api/games/${gameId}/versions/${versionId}/activate`, {
    method: 'POST',
  });
  
  if (response.ok) {
    // Update UI to highlight active version
    updateActiveVersionUI(versionId);
    // Show success message
    showToast('Version activated successfully');
  }
}

// Delete version handler
async function deleteVersion(gameId: string, versionId: string) {
  if (!confirm('Are you sure you want to delete this version?')) return;
  
  const response = await fetch(`/api/games/${gameId}/versions/${versionId}`, {
    method: 'DELETE',
  });
  
  if (response.ok) {
    // Remove from UI
    removeVersionFromList(versionId);
    showToast('Version deleted successfully');
  }
}
```

#### Status Label Mapper

```typescript
// lib/status-mapper.ts
const STATUS_LABELS: Record<GameStatus, string> = {
  draft: 'Nháp',
  uploaded: 'Chờ QC',
  qc_failed: 'Cần sửa',
  qc_passed: 'Chờ duyệt',
  approved: 'Chờ xuất bản',
  published: 'Đang sử dụng',
  archived: 'Lưu trữ',
};

export function getStatusLabel(status: GameStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: GameStatus): string {
  const colors: Record<GameStatus, string> = {
    draft: 'gray',
    uploaded: 'blue',
    qc_failed: 'red',
    qc_passed: 'green',
    approved: 'purple',
    published: 'green',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}
```

## Data Models

### Game Model (Existing, with clarifications)

```typescript
interface Game {
  _id: ObjectId;
  gameId: string; // Unique slug
  title: string;
  description?: string;
  ownerId: string; // User._id (responsible user)
  
  // Version references
  latestVersionId?: ObjectId; // Most recent version
  liveVersionId?: ObjectId; // Currently active/published version
  
  // Metadata
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  tags?: string[];
  
  // Flags
  disabled: boolean;
  isDeleted: boolean; // Soft delete
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### GameVersion Model (Existing)

```typescript
interface GameVersion {
  _id: ObjectId;
  gameId: ObjectId; // Reference to Game
  version: string; // SemVer (e.g., "1.0.1")
  status: VersionStatus;
  storagePath: string;
  entryFile: string;
  submittedBy: ObjectId; // User._id
  submittedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### New Models

#### GameHistory Model

```typescript
interface GameHistory {
  _id: ObjectId;
  gameId: ObjectId;
  action: 'STATUS_CHANGE' | 'VERSION_CREATED' | 'VERSION_ACTIVATED' | 'PUBLISHED' | 'METADATA_UPDATED';
  actorId: ObjectId; // User who performed the action
  timestamp: Date;
  oldValue?: any;
  newValue?: any;
  note?: string;
}
```

#### QCReport Model

```typescript
interface QCReport {
  _id: ObjectId;
  gameId: ObjectId;
  versionId: ObjectId;
  testerId: ObjectId; // QC user
  result: 'pass' | 'fail';
  note: string;
  severity?: 'low' | 'medium' | 'high';
  testedAt: Date;
  createdAt: Date;
}
```

## Error Handling

### API Error Responses

All API endpoints will return consistent error responses:

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
  code?: string; // Machine-readable error code
  details?: any; // Additional error details
}
```

### Common Error Scenarios

1. **Version Activation Errors**:
   - Version not found → 404
   - Version is deleted → 400 "Cannot activate deleted version"
   - Database update fails → 500

2. **Version Deletion Errors**:
   - Version is active → 400 "Cannot delete active version"
   - Version not found → 404
   - Database update fails → 500

3. **Filter Errors**:
   - Invalid status value → 400 "Invalid status"
   - Invalid ObjectId format → 400 "Invalid ID format"

4. **Permission Errors**:
   - User not authenticated → 401
   - User lacks required role → 403
   - User not owner of game → 403

### Frontend Error Handling

```typescript
async function handleAPICall<T>(
  apiCall: () => Promise<Response>
): Promise<T | null> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const error = await response.json();
      showToast(error.error || 'An error occurred', 'error');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    showToast('Network error. Please try again.', 'error');
    return null;
  }
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality and edge cases:

1. **Status Mapper Tests**:
   - Test all status values map to correct Vietnamese labels
   - Test unknown status returns fallback value

2. **API Route Tests**:
   - Test authentication/authorization checks
   - Test input validation
   - Test error responses

3. **Repository Tests**:
   - Test CRUD operations
   - Test query filters
   - Test soft delete behavior

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using fast-check library. Each test will run a minimum of 100 iterations.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Version History Completeness

*For any* game with multiple versions, fetching the version history should return all non-deleted versions, not just the latest one.

**Validates: Requirements 1.1**

### Property 2: Version Data Completeness

*For any* version in the version history response, the response should include version number, status, creation date, and creator information.

**Validates: Requirements 1.2**

### Property 3: Version History Ordering

*For any* list of versions returned by the API, they should be sorted in chronological order with the newest version first (descending by createdAt).

**Validates: Requirements 1.4**

### Property 4: Filter Correctness - Status

*For any* status filter value, all games returned by the API should have that exact status value.

**Validates: Requirements 2.2**

### Property 5: Filter Correctness - Owner

*For any* ownerId filter value, all games returned by the API should have that exact ownerId.

**Validates: Requirements 2.3, 10.3**

### Property 6: Filter Correctness - Subject

*For any* subject filter value, all games returned by the API should have that exact subject.

**Validates: Requirements 2.4**

### Property 7: Filter Combination (AND Logic)

*For any* combination of filters (status, ownerId, subject), all games returned should satisfy ALL filter conditions simultaneously.

**Validates: Requirements 2.5**

### Property 8: Version Activation Updates Game

*For any* game and valid version, activating that version should update the game's liveVersionId to reference that version.

**Validates: Requirements 3.1**

### Property 9: Single Active Version Invariant

*For any* game at any point in time, there should be at most one active version (liveVersionId should reference exactly zero or one version).

**Validates: Requirements 3.4**

### Property 10: Version Deletion Marks as Deleted

*For any* non-active version, deleting it should set its isDeleted flag to true without removing it from the database.

**Validates: Requirements 4.1**

### Property 11: Active Version Cannot Be Deleted

*For any* version that is currently active (game.liveVersionId equals version._id), attempting to delete it should fail with an error.

**Validates: Requirements 4.3**

### Property 12: Version Deletion Maintains Referential Integrity

*For any* deleted version, no game should reference it as latestVersionId or liveVersionId (unless the version is not actually deleted).

**Validates: Requirements 4.4**

### Property 13: Version Creation Uniqueness

*For any* game, creating a new version should generate a unique version identifier that doesn't conflict with existing versions for that game.

**Validates: Requirements 5.1**

### Property 14: Version Creation Association

*For any* newly created version, its gameId field should correctly reference the parent game's _id.

**Validates: Requirements 5.3**

### Property 15: Responsible User Name Display

*For any* game with an assigned ownerId, the game detail response should include the owner's name (not just the ID).

**Validates: Requirements 6.1**

### Property 16: Game Update Persistence

*For any* valid game metadata update (title, description, subject, etc.), submitting the update should persist all changes to the database.

**Validates: Requirements 8.3**

### Property 17: Dashboard Statistics Accuracy

*For any* user role (dev, qc, cto, admin), the dashboard statistics counts should exactly match the count of games meeting the criteria in the database.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 13.1, 13.2, 13.3, 15.1, 15.2, 15.3, 18.1, 18.2, 18.3**

### Property 18: Developer Game Filtering

*For any* developer user, the console should display only games where ownerId matches the user's ID and isDeleted is false.

**Validates: Requirements 10.3, 10.4**

### Property 19: Status Label Mapping

*For any* valid game status value, the status mapper should return the correct Vietnamese label.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**

### Property 20: Game History Retrieval

*For any* game, the history endpoint should return all status changes and actions from the database, not mock data.

**Validates: Requirements 12.1, 12.4**

### Property 21: QC Report Retrieval

*For any* game, the QC reports endpoint should return all QC test results from the database with complete information (pass/fail, notes, severity).

**Validates: Requirements 12.2, 12.3, 12.4**

### Property 22: QC Game Queue Filtering

*For any* QC user, the console should display only games with status "uploaded" and isDeleted false.

**Validates: Requirements 14.1, 14.4**

### Property 23: CTO Approval Queue Filtering

*For any* CTO user, the console should display only games with status "qc_passed" and isDeleted false.

**Validates: Requirements 16.1**

### Property 24: Request Changes Status Transition

*For any* game with status "qc_passed", requesting changes should transition the status to "qc_failed" and save the note.

**Validates: Requirements 17.1, 17.2, 17.3**

### Property 25: Request Changes Queue Removal

*For any* game in the CTO approval queue, requesting changes should remove it from the queue (status no longer qc_passed).

**Validates: Requirements 17.4**

### Property 26: Admin Publication Queue Filtering

*For any* admin user, the console should display only games with status "approved" and isDeleted false.

**Validates: Requirements 19.1**

### Property 27: Publication Precondition Validation

*For any* game, the publish action should only succeed if the game status is "approved"; otherwise it should return an error.

**Validates: Requirements 20.1, 20.2**

### Property 28: Publication Status Transition

*For any* game with status "approved", publishing should update the status to "published", set publishedAt timestamp, and record the publishing admin.

**Validates: Requirements 20.3, 20.4, 20.5**

### Property 29: Publication Queue Removal

*For any* game in the admin publication queue, successfully publishing should remove it from the queue (status no longer approved).

**Validates: Requirements 20.7**

### Property 30: Deleted Games Exclusion

*For any* game list view (dashboard, console, library), games with isDeleted true should be excluded by default.

**Validates: Requirements 21.1, 21.2, 21.3, 21.4**

## Implementation Notes

### Priority Order

1. **Phase 1: Core API Fixes** (Highest Priority)
   - Fix version history API to return all versions
   - Add filter support to game list API
   - Implement version activation/deletion APIs
   - Add dashboard statistics APIs

2. **Phase 2: Frontend Bindings**
   - Connect filters to API calls
   - Implement version management UI handlers
   - Add quick action button navigation
   - Implement game edit form

3. **Phase 3: Role-Specific Dashboards**
   - Developer dashboard and console
   - QC dashboard and console
   - CTO dashboard and console
   - Admin dashboard and console

4. **Phase 4: History and Reports**
   - Implement game history tracking
   - Implement QC report storage and retrieval
   - Add history and QC report tabs to game details

### Database Considerations

1. **Indexes**: Ensure indexes exist on frequently queried fields:
   - `games.ownerId`
   - `games.status`
   - `games.isDeleted`
   - `games.subject`
   - `game_versions.gameId`
   - `game_versions.status`

2. **Soft Delete**: Always filter by `isDeleted: false` unless explicitly showing trash

3. **Version References**: When updating `liveVersionId` or `latestVersionId`, verify the version exists and belongs to the game

### Security Considerations

1. **Authorization**: All API endpoints must verify user roles
2. **Ownership**: Users can only modify games they own (except admins)
3. **Status Transitions**: Enforce valid status transition rules
4. **Input Validation**: Validate all user inputs before database operations

### Performance Considerations

1. **Pagination**: Implement pagination for game lists (especially for admins)
2. **Caching**: Consider caching dashboard statistics (refresh every 5 minutes)
3. **Batch Operations**: When fetching user names, batch the queries
4. **Lazy Loading**: Load version history only when the tab is opened

## Testing Configuration

### Property-Based Testing Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Test Structure

```typescript
// tests/properties/version-management.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Feature: dashboard-fixes-and-improvements', () => {
  describe('Property 1: Version History Completeness', () => {
    it('should return all non-deleted versions for any game', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            version: fc.string(),
            status: fc.constantFrom('draft', 'uploaded', 'published'),
            isDeleted: fc.boolean(),
          }), { minLength: 2, maxLength: 10 }),
          async (versions) => {
            // Test implementation
            const nonDeletedCount = versions.filter(v => !v.isDeleted).length;
            const result = await fetchVersionHistory(gameId);
            expect(result.length).toBe(nonDeletedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
```

### Test Tags

Each property test must include a comment tag:

```typescript
// Feature: dashboard-fixes-and-improvements, Property 1: Version History Completeness
```

## Migration Strategy

Since this is fixing existing functionality rather than adding new features, the migration strategy focuses on ensuring backward compatibility:

1. **API Changes**: Add new endpoints without breaking existing ones
2. **Database**: No schema changes required (using existing collections)
3. **Frontend**: Update components incrementally, test each role separately
4. **Rollout**: Deploy role by role (Dev → QC → CTO → Admin)

## Success Criteria

The implementation is complete when:

1. All 30 correctness properties pass their property-based tests
2. All role-specific dashboards display real data (no mocks)
3. All filters work correctly and update the UI
4. Version management (create, activate, delete) works end-to-end
5. Game editing saves changes correctly
6. Status transitions follow the correct workflow
7. All quick action buttons navigate correctly
8. Deleted games are hidden from all views by default
