# Implementation Plan

- [x] 1. Create new data models for versioning system
  - [x] 1.1 Create GameVersion model (`src/models/GameVersion.ts`)
    - Define VersionStatus type and validation
    - Define SelfQAChecklist interface
    - Define GameVersion interface with all fields
    - Implement GameVersionRepository with CRUD methods
    - Implement getNextVersion() for auto-increment logic
    - Implement version number validation (SemVer)
    - _Requirements: 2.1, 2.2, 2.3, 4.2, 4.3_
  - [ ]* 1.2 Write property test for version auto-increment
    - **Property 5: Version Auto-Increment**
    - **Validates: Requirements 2.1, 4.2**
  - [ ]* 1.3 Write property test for GameVersion default status
    - **Property 7: GameVersion Default Status**
    - **Validates: Requirements 2.3**
  - [ ]* 1.4 Write property test for SemVer validation
    - **Property 15: SemVer Validation**
    - **Validates: Requirements 4.3**
  - [x]* 1.5 Write property test for version uniqueness




    - **Property 16: Version Uniqueness**
    - **Validates: Requirements 4.4**

- [x] 2. Update Game model for version references
  - [x] 2.1 Extend Game interface with version references
    - Add latestVersionId and liveVersionId fields
    - Update GameRepository methods
    - Add updateLatestVersion() and updateLiveVersion() methods
    - Remove status field from Game (move to GameVersion)
    - _Requirements: 1.1, 1.2, 8.2_
  - [ ]* 2.2 Write property test for game creation completeness
    - **Property 1: Game Creation Completeness**
    - **Validates: Requirements 1.1**




  - [ ]* 2.3 Write property test for version reference integrity
    - **Property 2: Version Reference Integrity**
    - **Validates: Requirements 1.2**
  - [ ]* 2.4 Write property test for slug uniqueness
    - **Property 4: Slug Uniqueness**
    - **Validates: Requirements 1.5**

- [x] 3. Update QCReview model for version linkage
  - [x] 3.1 Extend QCReview interface with versionId
    - Add versionId field to link to specific GameVersion
    - Update QCReviewRepository methods
    - Add findByVersionId() method
    - Update attemptNumber calculation logic
    - _Requirements: 3.1, 3.2, 6.2_
  - [ ]* 3.2 Write property test for QCReview version linkage
    - **Property 10: QCReview Version Linkage**






    - **Validates: Requirements 3.1**
  - [ ]* 3.3 Write property test for QCReview required fields
    - **Property 11: QCReview Required Fields**
    - **Validates: Requirements 3.2**
  - [ ]* 3.4 Write property test for fail severity requirement
    - **Property 12: Fail Severity Requirement**
    - **Validates: Requirements 3.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement State Machine service
  - [x] 5.1 Create VersionStateMachine service (`src/lib/version-state-machine.ts`)
    - Define StateTransition interface
    - Define STATE_TRANSITIONS configuration
    - Implement VersionStateMachine class
    - Implement transition() method with validation
    - Implement canTransition() and getValidActions() helpers
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 5.2 Write property tests for state transitions
    - **Property 18: Submit State Transition**
    - **Property 19: Start Review State Transition**
    - **Property 20: Pass State Transition**
    - **Property 21: Fail State Transition**





    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
  - [ ]* 5.3 Write property test for invalid transition rejection
    - **Property 22: Invalid Transition Rejection**
    - **Validates: Requirements 5.6**

- [x] 6. Implement storage path management
  - [x] 6.1 Create storage path utilities (`src/lib/storage-path.ts`)
    - Implement generateStoragePath() function
    - Implement validateStoragePath() function
    - Implement constructFileUrl() function
    - Add path conflict detection
    - _Requirements: 9.1, 9.2, 9.4, 9.5_


  - [ ]* 6.2 Write property test for storage path format
    - **Property 37: Storage Path Format**
    - **Validates: Requirements 9.1**
  - [ ]* 6.3 Write property test for storage path uniqueness
    - **Property 40: Storage Path Uniqueness**





    - **Validates: Requirements 9.5**

- [x] 7. Create migration service
  - [x] 7.1 Implement MigrationService (`src/lib/migration-service.ts`)
    - Create MigrationService class
    - Implement migrateGame() for single game
    - Implement migrateAllGames() for batch migration
    - Handle status mapping from old to new model
    - Set latestVersionId after creating initial version
    - Log migration progress and errors
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ]* 7.2 Write property tests for migration
    - **Property 44: Migration Game Creation**
    - **Property 45: Migration Version Creation**
    - **Property 46: Migration Status Preservation**
    - **Property 47: Migration Reference Setting**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
  - [x] 7.3 Create migration script (`scripts/migrate-to-versioning.ts`)
    - CLI script to run migration
    - Add dry-run option
    - Add progress reporting
    - _Requirements: 11.1_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.





- [x] 9. Update game creation API
  - [x] 9.1 Modify create game API (`src/pages/api/games/create.ts`)
    - Create both Game and initial GameVersion atomically
    - Set GameVersion status to 'draft'
    - Set GameVersion version to "1.0.0"
    - Update Game.latestVersionId reference
    - Generate storagePath for version
    - _Requirements: 2.1, 2.3, 4.1, 13.4_
  - [ ]* 9.2 Write property test for atomic game creation
    - **Property 51: API Atomic Game Creation**




    - **Validates: Requirements 13.4**

- [x] 10. Update game upload/version creation flow
  - [x] 10.1 Create new version upload API (`src/pages/api/games/[id]/upload-version.ts`)
    - Accept build files and metadata
    - Calculate next version number

    - Create new GameVersion document
    - Upload files to version-specific GCS path
    - Update Game.latestVersionId
    - Create history entry
    - _Requirements: 2.1, 2.2, 9.1, 9.2_
  - [ ]* 10.2 Write property test for version-specific file storage
    - **Property 38: Version-Specific File Storage**
    - **Validates: Requirements 9.2**




  - [ ]* 10.3 Write property test for GameVersion required fields
    - **Property 6: GameVersion Required Fields**
    - **Validates: Requirements 2.2**

- [x] 11. Update Self-QA API for versions
  - [x] 11.1 Modify Self-QA API (`src/pages/api/games/self-qa.ts`)
    - Accept versionId instead of gameId
    - Update GameVersion.selfQAChecklist
    - Validate checklist completeness
    - _Requirements: 2.4_
  - [ ]* 11.2 Write property test for Self-QA persistence
    - **Property 8: Self-QA Persistence**




    - **Validates: Requirements 2.4**

- [x] 12. Update submit to QC flow
  - [x] 12.1 Modify submit-qc API (`src/pages/api/games/submit-qc.ts`)
    - Accept versionId instead of gameId
    - Use VersionStateMachine for status transition
    - Validate Self-QA completion before allowing submit
    - Set submittedAt timestamp
    - Create notification for QC users
    - _Requirements: 5.2_
  - [ ]* 12.2 Write property test for submit state transition
    - Already covered by Property 18 in task 5.2





- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Update QC Inbox to show versions
  - [x] 14.1 Modify QC inbox page (`src/pages/console/qc-inbox.astro`)
    - Query GameVersion with status 'uploaded'
    - Join with Game data for display
    - Calculate re-test indicator by counting QCReviews
    - Show attempt count for each game
    - Support filtering by re-test status
    - _Requirements: 6.1, 6.2, 6.4, 7.1_
  - [ ]* 14.2 Write property test for re-test detection
    - **Property 23: Re-test Detection**
    - **Validates: Requirements 6.1**
  - [ ]* 14.3 Write property test for attempt count accuracy
    - **Property 24: Attempt Count Accuracy**
    - **Validates: Requirements 6.2**
  - [ ]* 14.4 Write property test for re-test filter correctness
    - **Property 26: Re-test Filter Correctness**
    - **Validates: Requirements 6.4**






- [x] 15. Update QC review submission flow
  - [x] 15.1 Modify QC result API (`src/pages/api/games/qc-result.ts`)
    - Accept versionId instead of gameId
    - Use VersionStateMachine for status transitions
    - Create QCReview with versionId link
    - Calculate attemptNumber from previous reviews
    - Validate severity required for fail results
    - Store evidence attachments
    - _Requirements: 3.1, 3.3, 3.4, 5.4, 5.5, 6.5_
  - [ ]* 15.2 Write property test for evidence attachment storage
    - **Property 13: Evidence Attachment Storage**
    - **Validates: Requirements 3.4**
  - [ ]* 15.3 Write property test for review linkage through IDs
    - **Property 27: Review Linkage Through IDs**
    - **Validates: Requirements 6.5**

- [x] 16. Update game history and detail views
  - [x] 16.1 Create version history API (`src/pages/api/games/[id]/versions.ts`)
    - Return all GameVersion documents for a game
    - Order by version number
    - Include QC results for each version
    - Include Self-QA data
    - _Requirements: 7.1, 7.2, 7.3_




  - [ ]* 16.2 Write property test for version history ordering
    - **Property 28: Version History Ordering**
    - **Validates: Requirements 7.1**
  - [ ]* 16.3 Write property test for version history completeness
    - **Property 29: Version History Completeness**
    - **Validates: Requirements 7.2**
  - [ ]* 16.4 Write property test for version detail retrieval
    - **Property 30: Version Detail Retrieval**
    - **Validates: Requirements 7.3**





- [x] 17. Implement QC history with version context
  - [x] 17.1 Modify QC history retrieval (`src/pages/api/games/[id]/qc-history.ts`)
    - Update queries to use versionId
    - Show which version each review was for
    - Support comparing reviews across versions
    - Highlight checklist changes between reviews
    - _Requirements: 3.5, 6.3, 10.3_
  - [ ]* 17.2 Write property test for QC history ordering
    - **Property 14: QC History Ordering**
    - **Validates: Requirements 3.5**
  - [ ]* 17.3 Write property test for previous review accessibility
    - **Property 25: Previous Review Accessibility**
    - **Validates: Requirements 6.3**
  - [ ]* 17.4 Write property test for checklist comparison
    - **Property 41: Checklist Comparison**
    - **Validates: Requirements 10.3**

- [x] 18. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement live version management
  - [x] 19.1 Create set-live-version API (`src/pages/api/games/[id]/set-live.ts`)
    - Accept versionId
    - Validate version status is 'published'
    - Update Game.liveVersionId
    - Create history entry
    - _Requirements: 8.1, 8.2_
  - [ ]* 19.2 Write property test for live version status requirement
    - **Property 33: Live Version Status Requirement**




    - **Validates: Requirements 8.1**
  - [ ]* 19.3 Write property test for live version field update
    - **Property 34: Live Version Field Update**
    - **Validates: Requirements 8.2**
  - [ ]* 19.4 Write property test for live version auto-update prevention
    - **Property 36: Live Version Auto-Update Prevention**
    - **Validates: Requirements 8.5**

- [x] 20. Update game file serving
  - [x] 20.1 Modify game file serving (`src/pages/games/[game]/[...path].ts`)
    - Look up Game by slug
    - Get liveVersionId from Game
    - Construct file path using GameVersion.storagePath
    - Return 404 if no liveVersionId set
    - Serve files from GCS
    - _Requirements: 8.3, 8.4, 9.4_
  - [x]* 20.2 Write property test for live version path usage





    - **Property 35: Live Version Path Usage**
    - **Validates: Requirements 8.3**
  - [ ]* 20.3 Write property test for file URL construction
    - **Property 39: File URL Construction**
    - **Validates: Requirements 9.4**

- [x] 21. Update game list and query APIs
  - [x] 21.1 Modify game list APIs
    - Update /api/games/list to join Game and GameVersion data





    - Include latestVersion and liveVersion information
    - Update My Games page to show version info
    - Update QC inbox to show version numbers
    - _Requirements: 13.1, 13.2_
  - [ ]* 21.2 Write property test for API game data join
    - **Property 48: API Game Data Join**
    - **Validates: Requirements 13.1**
  - [ ]* 21.3 Write property test for API version information inclusion
    - **Property 49: API Version Information Inclusion**
    - **Validates: Requirements 13.2**

- [x] 22. Update status update APIs
  - [x] 22.1 Modify all status update endpoints
    - Update approve API to work with versionId (`src/pages/api/games/[id]/approve.ts`)
    - Update publish API to work with versionId (`src/pages/api/games/[id]/publish.ts`)
    - Update archive API to work with versionId


    - Ensure all use VersionStateMachine
    - _Requirements: 13.3_
  - [ ]* 22.2 Write property test for API status update routing
    - **Property 50: API Status Update Routing**
    - **Validates: Requirements 13.3**

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Update UI components for versioning
  - [x] 24.1 Update GameCard component (StatusChip updated for version statuses)
    - Show latest version number
    - Show live version indicator
    - Display version status
    - _Requirements: 7.2_
  - [x] 24.2 Create VersionHistory component (already exists, updated StatusChip)
    - Display version timeline
    - Show status for each version
    - Link to version details
    - Show QC results per version
    - _Requirements: 7.1, 7.2_
  - [x] 24.3 Update game detail pages (my-games.astro updated for versioning)
    - Add version selector/tabs
    - Show version-specific information
    - Display release notes
    - Show Self-QA for each version
    - _Requirements: 7.3, 7.4_

- [x] 25. Add soft delete and audit trail
  - [x] 25.1 Implement soft delete for GameVersion
    - Add isDeleted field to GameVersion
    - Update delete operations to set isDeleted=true
    - Filter out deleted versions in queries
    - Prevent hard deletion
    - _Requirements: 7.5_
  - [ ]* 25.2 Write property test for soft delete preservation
    - **Property 3: Soft Delete Preservation**
    - **Validates: Requirements 1.4**
  - [ ]* 25.3 Write property test for version deletion prevention
    - **Property 32: Version Deletion Prevention**
    - **Validates: Requirements 7.5**

- [x] 26. Create database indexes
  - [x] 26.1 Create index setup script (`scripts/setup-versioning-indexes.ts`)
    - Create indexes on game_versions collection
    - Create indexes on qc_reviews collection
    - Update existing game indexes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 27. Add release notes functionality
  - [x] 27.1 Create release notes API (`src/pages/api/games/[id]/release-note.ts`)
    - Add endpoint to update GameVersion.releaseNote
    - Validate ownership before allowing update
    - _Requirements: 2.5_
  - [ ]* 27.2 Write property test for release note storage
    - **Property 9: Release Note Storage**
    - **Validates: Requirements 2.5**
  - [ ]* 27.3 Write property test for release note retrieval
    - **Property 31: Release Note Retrieval**
    - **Validates: Requirements 7.4**

- [ ] 28. Add checklist flexibility
  - [ ]* 28.1 Write property test for checklist item notes
    - **Property 42: Checklist Item Notes**
    - **Validates: Requirements 10.4**
  - [ ]* 28.2 Write property test for checklist category flexibility
    - **Property 43: Checklist Category Flexibility**
    - **Validates: Requirements 10.5**

- [ ] 29. Add version query functionality
  - [ ]* 29.1 Write property test for version query by string
    - **Property 17: Version Query by String**
    - **Validates: Requirements 4.5**

- [ ] 30. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
