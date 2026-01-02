# Project Models and API Summary

This document provides a comprehensive summary of the data models and API endpoints used in the Game Hub Manager Interface.

## Models

The project uses MongoDB as the database, with models defined in `src/models/`. Each model typically consists of TypeScript interfaces for the data structure and a Repository class for database operations.

### 1. Game

Represents a game entity in the system.

- **File**: `src/models/Game.ts`
- **Key Fields**:

  - `_id`: ObjectId
  - `gameId`: string (Unique identifier, e.g., "com.iruka.math")
  - `title`: string
  - `description`: string
  - `ownerId`: string (Reference to User)
  - `teamId`: string
  - `latestVersionId`: ObjectId (Reference to most recent GameVersion)
  - `liveVersionId`: ObjectId (Reference to currently published GameVersion)
  - `status`: GameStatus (Deprecated, use VersionStatus)
  - `isDeleted`: boolean (Soft delete flag)
  - `metadata`: subject, grade, unit, gameType, priority, tags
  - `publication`: disabled, rolloutPercentage, publishedAt, gcsPath

- **Repository Methods**:
  - `findById`, `findByGameId`, `findByOwnerId`, `findAll`
  - `create`, `delete` (soft), `update`
  - `updateMetadata`, `updateLatestVersion`, `updateLiveVersion`
  - `updateDisabled`, `updateRolloutPercentage`
  - `findPublishedAndEnabled` (Public Registry query)

### 2. GameVersion

Represents a specific build/version of a game.

- **File**: `src/models/GameVersion.ts`
- **Key Fields**:

  - `_id`: ObjectId
  - `gameId`: ObjectId
  - `version`: string (SemVer, e.g., "1.0.1")
  - `storagePath`: string (GCS path)
  - `entryFile`: string
  - `status`: VersionStatus (`draft`, `uploaded`, `qc_processing`, `qc_passed`, `qc_failed`, `approved`, `published`, `archived`)
  - `selfQAChecklist`: SelfQAChecklist
  - `isDeleted`: boolean

- **Repository Methods**:
  - `findById`, `findByGameId`, `findByVersion`
  - `create`, `softDelete`, `restore`
  - `updateStatus`, `patchBuild`, `updateSelfQA`
  - `getLatestVersion`, `getNextVersion`

### 3. User

Represents a system user with RBAC roles.

- **File**: `src/models/User.ts`
- **Key Fields**:

  - `_id`: ObjectId
  - `email`: string
  - `passwordHash`: string
  - `name`: string
  - `roles`: Role[] (`dev`, `qc`, `cto`, `ceo`, `admin`)
  - `isActive`: boolean
  - `teamIds`: string[]

- **Repository Methods**:
  - `findById`, `findByEmail`, `findAll`
  - `create`, `delete`
  - `verifyPassword`, `updatePassword`
  - `updateRoles`, `updateActiveStatus`

### 4. GameHistory

Audit trail for game-related actions.

- **File**: `src/models/GameHistory.ts`
- **Key Fields**:

  - `gameId`: string
  - `action`: string
  - `actorId`: string
  - `oldStatus`, `newStatus`

- **Repository Methods**:
  - `addEntry`, `getHistory`

### 5. QcReport

Stores results of Quality Control testing.

- **File**: `src/models/QcReport.ts`
- **Key Fields**:

  - `gameId`, `versionId`: ObjectId
  - `reviewerId`: ObjectId
  - `result`: QcResult (`pass`, `fail`)
  - `checklist`: QcChecklistItem[]
  - `severity`: Severity

- **Repository Methods**:
  - `create`, `findByGameId`, `findByVersionId`
  - `getLatestByGameId`

### 6. Notification

System notifications for users.

- **File**: `src/models/Notification.ts`
- **Key Fields**:

  - `userId`: string
  - `type`: NotificationType
  - `isRead`: boolean

- **Repository Methods**:
  - `create`, `findByUserId`, `getUnreadCount`, `markAsRead`

---

## API Endpoints

The API is built using Astro's file-based routing in `src/pages/api/`.

### Authentication (`/api/auth`)

- `POST /api/auth/login`: Authenticate user credentials.
- `POST /api/auth/logout`: Clear session.
- `GET /api/auth/me`: Get current authenticated user details.

### Games Management (`/api/games`)

- `GET /api/games/list`: List all games (with filtering).
- `POST /api/games/create`: Create a new game entry.
- `DELETE /api/games/delete`: Soft delete a game.
- `POST /api/games/update`: Update game properties.
- `POST /api/games/update-metadata`: Update game metadata (tags, subject, etc.).
- `POST /api/games/set-active`: Set active/live version/status.
- `POST /api/games/archive`: Archive a game.

#### Game Workflow

- `POST /api/games/submit-qc`: Submit a version to QC.
- `POST /api/games/qc-result`: Submit QC test results (Pass/Fail).
- `POST /api/games/publish`: Publish a game version (Go Live).
- `POST /api/games/republish`: Republish an existing version.
- `POST /api/games/self-qa`: Update Self-QA checklist.

#### Game Versions

- `GET /api/games/[id]/versions`: List versions for a game.

### Uploads

- `POST /api/upload`: General file upload handler.
- `POST /api/upload-zip`: Handle game ZIP uploads (Extract -> Validate -> Upload to GCS).

### Users (`/api/users`)

- `GET /api/users`: List users.
- `POST /api/users`: Create/Update users.
- `GET /api/users/[id]`: Get specific user details.

### Admin / System

- **Admin Tools** (`/api/admin/`):
  - `fix-game-owners`: Utility to fix data integrity.
  - `sync-from-gcs`: Sync database with GCS content.
  - `trash-data`: manage soft-deleted items.
- **Audit Logs** (`/api/audit-logs`): Fetch system audit logs.
- **Notifications** (`/api/notifications`): Fetch/Mark read user notifications.
- **Dashboard** (`/api/dashboard/stats`): Aggregated statistics for dashboard.
- **Hub** (`/api/hub/games`): Public-facing API for game consumers (Registry).

### Debug (`/api/debug`)

- `check-game`, `fix-game`: Diagnostic tools for specific game entries.
