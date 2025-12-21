# Implementation Plan

- [x] 1. Extend Game model with publishing fields



  - [x] 1.1 Add `disabled` and `rolloutPercentage` fields to Game interface

    - Add `disabled: boolean` field with default `false`
    - Add `rolloutPercentage: number` field with default `100`
    - Add `publishedAt?: Date` optional field
    - Update `serializeGame` and `deserializeGame` functions
    - _Requirements: 3.1, 4.1_

  - [ ]* 1.2 Write property test for rollout percentage validation
    - **Property 7: Rollout percentage validation and persistence**
    - **Validates: Requirements 4.1, 4.2, 4.4**


  - [x] 1.3 Add repository methods for publishing fields

    - Add `updateDisabled(id: string, disabled: boolean): Promise<Game | null>`
    - Add `updateRolloutPercentage(id: string, percentage: number): Promise<Game | null>`
    - Add validation for rolloutPercentage (0-100)
    - _Requirements: 3.1, 4.1_



- [x] 2. Create PublicRegistry types and interfaces

  - [x] 2.1 Create PublicGameEntry and PublicRegistry interfaces

    - Create `src/lib/public-registry-types.ts`
    - Define `PublicGameEntry` interface with required fields
    - Define `PublicRegistry` interface
    - _Requirements: 2.3, 6.4_

  - [ ]* 2.2 Write property test for required fields
    - **Property 5: Public Registry entry contains required fields**
    - **Validates: Requirements 2.3, 6.4**



- [x] 3. Implement PublicRegistryManager service

  - [x] 3.1 Create PublicRegistryManager with get/sync methods

    - Create `src/lib/public-registry.ts`
    - Implement `get(): Promise<PublicRegistry>` to read from GCS
    - Implement `sync(): Promise<PublicRegistry>` to generate from MongoDB
    - Store at `registry/public.json` with `no-cache` header
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 3.2 Write property test for serialization round-trip
    - **Property 4: Public Registry serialization round-trip**
    - **Validates: Requirements 2.4, 2.5**


  - [x] 3.3 Implement filtering logic for published and enabled games
    - Query MongoDB for games with published versions
    - Filter out games where `disabled === true`
    - Extract only necessary metadata for PublicGameEntry
    - _Requirements: 2.1, 2.3, 3.1_

  - [ ]* 3.4 Write property test for filtering logic
    - **Property 3: Public Registry contains only published and enabled games**
    - **Validates: Requirements 2.1, 3.1, 3.3, 6.2, 6.3**


  - [ ] 3.5 Implement upsertGame and removeGame methods
    - Add `upsertGame(entry: PublicGameEntry): Promise<void>`
    - Add `removeGame(gameId: string): Promise<void>`
    - Ensure atomic updates to registry

    - _Requirements: 1.3, 7.2_


- [ ] 4. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.



- [x] 5. Update publish workflow

  - [x] 5.1 Update publish API to sync Public Registry

    - Modify `src/pages/api/games/[id]/publish.ts`
    - After status change to "published", call `PublicRegistryManager.sync()`
    - Validate version has files on GCS before publishing
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 5.2 Write property test for publish requires approved status
    - **Property 1: Publish requires approved status**
    - **Validates: Requirements 1.1, 1.5**

  - [ ]* 5.3 Write property test for publish updates status
    - **Property 2: Publish updates status to published**
    - **Validates: Requirements 1.2**


  - [ ] 5.4 Add setAsLive option to publish workflow
    - Update publish API to accept `setAsLive` and `rolloutPercentage` options
    - Update `liveVersionId` in Game when `setAsLive` is true
    - Update entryUrl in Public Registry to point to live version
    - _Requirements: 5.1, 5.3_

  - [ ]* 5.5 Write property test for live version updates entryUrl
    - **Property 9: Live version updates entryUrl**


    - **Validates: Requirements 5.1, 5.3**

- [x] 6. Implement kill-switch functionality

  - [x] 6.1 Create disable/enable API endpoint

    - Create `src/pages/api/games/[id]/disable.ts`
    - Accept `disabled: boolean` and `reason: string` in request body
    - Update game's `disabled` field
    - Trigger `PublicRegistryManager.sync()` after update
    - _Requirements: 3.1, 3.2_

  - [ ]* 6.2 Write property test for disabled exclusion
    - **Property 6: Disabled games excluded from Public Registry**
    - **Validates: Requirements 3.1, 3.2, 3.3**


  - [ ] 6.3 Add audit logging for disable action
    - Log actor, timestamp, reason, and old/new disabled value


    - _Requirements: 3.4_

- [x] 7. Implement archive functionality

  - [x] 7.1 Update archive API to remove from Public Registry

    - Modify `src/pages/api/games/archive.ts`
    - Change version status from "published" to "archived"
    - Call `PublicRegistryManager.removeGame()` after archive
    - Preserve all data in MongoDB
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 7.2 Write property test for archive removes from registry
    - **Property 10: Archive removes from Public Registry**
    - **Validates: Requirements 7.1, 7.2, 7.3**


  - [ ] 7.3 Implement republish functionality
    - Add state transition from "archived" to "published" in state machine
    - Restore game to Public Registry on republish
    - _Requirements: 7.4_

  - [ ]* 7.4 Write property test for archive/republish round-trip
    - **Property 11: Archive and republish round-trip**

    - **Validates: Requirements 7.4**



- [ ] 8. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement set-live-version functionality

  - [x] 9.1 Update set-live API to validate published status

    - Modify `src/pages/api/games/[id]/set-live.ts`
    - Verify target version has status "published" before setting as live
    - Update `liveVersionId` in Game model
    - Sync Public Registry with new entryUrl
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 9.2 Write property test for live version requires published
    - **Property 8: Live version requires published status**
    - **Validates: Requirements 5.2**


  - [ ] 9.3 Add audit logging for set-live action
    - Log old and new version information


    - _Requirements: 5.5_

- [x] 10. Create Public API for Game Hub

  - [x] 10.1 Create public games API endpoint

    - Create `src/pages/api/hub/games.ts`
    - Read from Public Registry (GCS or MongoDB fallback)
    - Return filtered list of PublicGameEntry objects
    - Set CORS headers for Game Hub domain
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 10.2 Write unit tests for public API
    - Test response format matches PublicGameEntry schema
    - Test CORS headers are set correctly
    - Test filtering excludes non-published and disabled games
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_



- [ ] 11. Add audit logging for all state changes
  - [ ] 11.1 Ensure all state-changing actions are audited
    - Verify publish, archive, disable, set-live all log to audit
    - Include actor, timestamp, and relevant metadata
    - _Requirements: 3.4, 5.5, 7.5_

  - [-]* 11.2 Write property test for audit logging


    - **Property 12: State-changing actions are audited**
    - **Validates: Requirements 3.4, 5.5, 7.5**

- [x] 12. Update Publishing Console UI

  - [x] 12.1 Add rollout percentage slider to publish modal

    - Update `src/pages/console/publish.astro`
    - Add slider input for rolloutPercentage (0-100)
    - Display current rollout percentage for published games
    - _Requirements: 4.1, 4.2_


  - [ ] 12.2 Add kill-switch toggle to game management
    - Add toggle button for disabled field
    - Show warning when disabling a published game
    - Require reason input when disabling
    - _Requirements: 3.1, 3.4_


  - [ ] 12.3 Add version selector for set-live functionality
    - Show list of published versions
    - Allow selecting any published version as live

    - Display current live version indicator
    - _Requirements: 5.1, 5.4_

- [x] 13. Final Checkpoint - Make sure all tests are passing


  - Ensure all tests pass, ask the user if questions arise.
