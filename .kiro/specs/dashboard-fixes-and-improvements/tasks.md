# Implementation Plan: Dashboard Fixes and Improvements

## Overview

This implementation plan addresses critical bugs and missing functionality across all role-based dashboards and consoles. The tasks are organized into phases, with each task building on previous work. All tasks focus on writing, modifying, or testing code.

## Tasks

- [x] 1. Set up shared utilities and type definitions
  - Create status mapper utility with Vietnamese labels
  - Create API client helper with error handling
  - Define TypeScript interfaces for all API responses
  - _Requirements: 11.1-11.7_

- [ ]* 1.1 Write property test for status mapper
  - **Property 19: Status Label Mapping**
  - **Validates: Requirements 11.1-11.7**

- [x] 2. Implement version management API endpoints
  - [x] 2.1 Create GET /api/games/[id]/versions endpoint
    - Return all non-deleted versions for a game
    - Include version number, status, creation date, and creator name
    - Sort by createdAt descending (newest first)
    - _Requirements: 1.1, 1.2, 1.4_

- [ ]* 2.2 Write property test for version history completeness
  - **Property 1: Version History Completeness**
  - **Validates: Requirements 1.1**

- [ ]* 2.3 Write property test for version data completeness
  - **Property 2: Version Data Completeness**
  - **Validates: Requirements 1.2**

- [ ]* 2.4 Write property test for version history ordering
  - **Property 3: Version History Ordering**
  - **Validates: Requirements 1.4**

- [x] 2.5 Create POST /api/games/[id]/versions/[versionId]/activate endpoint
  - Update game's liveVersionId to reference the version
  - Validate version exists and belongs to game
  - Return updated game object
  - _Requirements: 3.1, 3.3_

- [ ]* 2.6 Write property test for version activation
  - **Property 8: Version Activation Updates Game**
  - **Validates: Requirements 3.1**

- [ ]* 2.7 Write property test for single active version invariant
  - **Property 9: Single Active Version Invariant**
  - **Validates: Requirements 3.4**

- [x] 2.8 Create DELETE /api/games/[id]/versions/[versionId] endpoint
  - Soft delete version (set isDeleted = true)
  - Prevent deletion if version is active (liveVersionId)
  - Return error if version is active
  - _Requirements: 4.1, 4.3, 4.4_

- [ ]* 2.9 Write property test for version deletion
  - **Property 10: Version Deletion Marks as Deleted**
  - **Validates: Requirements 4.1**

- [ ]* 2.10 Write property test for active version deletion prevention
  - **Property 11: Active Version Cannot Be Deleted**
  - **Validates: Requirements 4.3**

- [ ]* 2.11 Write property test for referential integrity after deletion
  - **Property 12: Version Deletion Maintains Referential Integrity**
  - **Validates: Requirements 4.4**

- [x] 2.12 Create POST /api/games/[id]/versions/create endpoint
  - Auto-increment version number if not provided
  - Generate unique version identifier
  - Associate version with parent game
  - Return created version with correct game name
  - _Requirements: 5.1, 5.3, 5.4_

- [ ]* 2.13 Write property test for version creation uniqueness
  - **Property 13: Version Creation Uniqueness**
  - **Validates: Requirements 5.1**

- [ ]* 2.14 Write property test for version creation association
  - **Property 14: Version Creation Association**
  - **Validates: Requirements 5.3**

- [ ] 3. Checkpoint - Ensure version management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement game list filtering API
  - [x] 4.1 Modify GET /api/games/list to support query parameters
    - Add support for status, ownerId, subject, grade filters
    - Default isDeleted to false
    - Combine multiple filters with AND logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 21.1_

- [ ]* 4.2 Write property test for status filter
  - **Property 4: Filter Correctness - Status**
  - **Validates: Requirements 2.2**

- [ ]* 4.3 Write property test for owner filter
  - **Property 5: Filter Correctness - Owner**
  - **Validates: Requirements 2.3**

- [ ]* 4.4 Write property test for subject filter
  - **Property 6: Filter Correctness - Subject**
  - **Validates: Requirements 2.4**

- [ ]* 4.5 Write property test for filter combination
  - **Property 7: Filter Combination (AND Logic)**
  - **Validates: Requirements 2.5**

- [ ]* 4.6 Write property test for deleted games exclusion
  - **Property 30: Deleted Games Exclusion**
  - **Validates: Requirements 21.1-21.4**

- [ ] 5. Implement game detail API enhancements
  - [ ] 5.1 Modify GET /api/games/[id] endpoint
    - Include responsible user object with name and email
    - Include all versions (not just latest)
    - Handle case where ownerId is not assigned
    - _Requirements: 6.1, 6.3_

- [ ]* 5.2 Write property test for responsible user name display
  - **Property 15: Responsible User Name Display**
  - **Validates: Requirements 6.1**

- [ ] 5.3 Create PUT /api/games/[id]/edit endpoint
  - Accept title, description, subject, grade, unit, gameType, ownerId, tags
  - Validate user has permission (owner or admin)
  - Save all changes to database
  - Return updated game
  - _Requirements: 8.1, 8.3_

- [ ]* 5.4 Write property test for game update persistence
  - **Property 16: Game Update Persistence**
  - **Validates: Requirements 8.3**

- [ ] 6. Implement dashboard statistics APIs
  - [ ] 6.1 Create GET /api/dashboard/dev endpoint
    - Count games by status (draft, qc_failed, uploaded, published)
    - Filter by current user's ownerId
    - Return top 5 most recent games
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6.2 Create GET /api/dashboard/qc endpoint
  - Count games with status "uploaded"
  - Count games tested this week/month (from QC reports)
  - Calculate pass/fail ratio
  - Return games needing QC
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 6.3 Create GET /api/dashboard/cto endpoint
  - Count games with status "qc_passed"
  - Count games approved this week/month
  - Return games awaiting approval
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 6.4 Create GET /api/dashboard/admin endpoint
  - Count games with status "published", "archived", "approved"
  - Return games awaiting publication
  - Return recently published games
  - _Requirements: 18.1, 18.2, 18.3_

- [ ]* 6.5 Write property test for dashboard statistics accuracy
  - **Property 17: Dashboard Statistics Accuracy**
  - **Validates: Requirements 9.1-9.4, 13.1-13.4, 15.1-15.3, 18.1-18.3**

- [ ] 7. Checkpoint - Ensure API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement game history and QC reports
  - [ ] 8.1 Create GameHistory model and repository
    - Define schema with gameId, action, actorId, timestamp, oldValue, newValue, note
    - Implement create and findByGameId methods
    - _Requirements: 12.1, 12.4_

- [ ] 8.2 Create QCReport model and repository
  - Define schema with gameId, versionId, testerId, result, note, severity, testedAt
  - Implement create and findByGameId methods
  - _Requirements: 12.2, 12.3, 12.4_

- [ ] 8.3 Create GET /api/games/[id]/history endpoint
  - Fetch all history entries for game
  - Include actor name (not just ID)
  - Sort by timestamp descending
  - _Requirements: 12.1, 12.4_

- [ ]* 8.4 Write property test for game history retrieval
  - **Property 20: Game History Retrieval**
  - **Validates: Requirements 12.1, 12.4**

- [ ] 8.5 Create GET /api/games/[id]/qc-reports endpoint
  - Fetch all QC reports for game
  - Include tester name and version string
  - Include pass/fail, notes, severity
  - _Requirements: 12.2, 12.3, 12.4_

- [ ]* 8.6 Write property test for QC report retrieval
  - **Property 21: QC Report Retrieval**
  - **Validates: Requirements 12.2, 12.3, 12.4**

- [ ] 9. Implement CTO request changes functionality
  - [ ] 9.1 Create POST /api/games/[id]/request-change endpoint
    - Validate game status is "qc_passed"
    - Change status to "qc_failed"
    - Save note to database
    - Create history entry
    - Return updated game
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ]* 9.2 Write property test for request changes status transition
  - **Property 24: Request Changes Status Transition**
  - **Validates: Requirements 17.1, 17.2, 17.3**

- [ ]* 9.3 Write property test for request changes queue removal
  - **Property 25: Request Changes Queue Removal**
  - **Validates: Requirements 17.4**

- [ ] 10. Implement publication workflow enhancements
  - [ ] 10.1 Modify POST /api/games/publish endpoint
    - Validate game status is "approved"
    - Return error if status is not "approved"
    - Update status to "published"
    - Set publishedAt timestamp
    - Record publishedBy user ID
    - Create history entry
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [ ]* 10.2 Write property test for publication precondition validation
  - **Property 27: Publication Precondition Validation**
  - **Validates: Requirements 20.1, 20.2**

- [ ]* 10.3 Write property test for publication status transition
  - **Property 28: Publication Status Transition**
  - **Validates: Requirements 20.3, 20.4, 20.5**

- [ ]* 10.4 Write property test for publication queue removal
  - **Property 29: Publication Queue Removal**
  - **Validates: Requirements 20.7**

- [ ] 11. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement frontend filter components
  - [ ] 12.1 Create GameFilters component
    - Add dropdowns for status, owner, subject, grade
    - Attach onChange event handlers
    - Build query string from filter state
    - Call API with filters and update game list
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 12.2 Update Manager dashboard page to use GameFilters
  - Import and render GameFilters component
  - Handle filter changes and re-fetch games
  - _Requirements: 2.1_

- [ ] 13. Implement version management UI
  - [ ] 13.1 Create VersionManager component
    - Display all versions in a list/timeline
    - Show version number, status, date, creator name
    - Add "Activate" button for each version
    - Add "Delete" button for non-active versions
    - Highlight active version
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2, 4.2_

- [ ] 13.2 Implement version activation handler
  - Call POST /api/games/[id]/versions/[versionId]/activate
  - Update UI to highlight newly active version
  - Show success toast
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13.3 Implement version deletion handler
  - Show confirmation dialog
  - Call DELETE /api/games/[id]/versions/[versionId]
  - Remove version from UI on success
  - Show error if version is active
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 13.4 Implement create version handler
  - Call POST /api/games/[id]/versions/create
  - Add new version to list on success
  - Show correct game name
  - _Requirements: 5.2, 5.4_

- [ ] 14. Implement game detail page enhancements
  - [ ] 14.1 Update game detail page to show responsible user name
    - Fetch game with user details
    - Display user name instead of ID
    - Show "Unassigned" if no owner
    - _Requirements: 6.1, 6.3_

- [ ] 14.2 Add quick action buttons to game detail page
  - Add "Create New Version" button → navigate to version creation
  - Add "Manage Versions" button → navigate to version management
  - Add "Edit Information" button → navigate to edit page
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14.3 Add History tab to game detail page
  - Fetch history from GET /api/games/[id]/history
  - Display timeline of status changes
  - Show actor name, timestamp, old/new values
  - _Requirements: 12.1_

- [ ] 14.4 Add QC Report tab to game detail page
  - Fetch reports from GET /api/games/[id]/qc-reports
  - Display list of QC tests
  - Show tester name, result, notes, severity
  - _Requirements: 12.2, 12.3_

- [ ] 15. Implement game edit page
  - [ ] 15.1 Create game edit form
    - Load current game data on page load
    - Pre-fill all form fields
    - Add dropdown for responsible user (fetch user list)
    - _Requirements: 8.1, 8.2_

- [ ] 15.2 Implement form submission handler
  - Call PUT /api/games/[id]/edit with form data
  - Show success toast on save
  - Update UI or redirect to detail page
  - Handle and display errors
  - _Requirements: 8.3, 8.4_

- [ ] 16. Implement Developer dashboard and console
  - [ ] 16.1 Update Developer dashboard page
    - Fetch stats from GET /api/dashboard/dev
    - Display counts for drafts, qc_failed, uploaded, published
    - Show top 5 recent games
    - Remove mock data
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 16.2 Write property test for developer game filtering
  - **Property 18: Developer Game Filtering**
  - **Validates: Requirements 10.3, 10.4**

- [ ] 16.3 Update Developer console dashboard
  - Fetch games with filters (ownerId = currentUser, status in [uploaded, qc_failed])
  - Display "Games Just Uploaded" section
  - Display "Games Needing Fixes" section
  - Remove mock data
  - _Requirements: 10.1, 10.2_

- [ ] 16.4 Update Developer "My Games" section
  - Fetch games with filter (ownerId = currentUser, isDeleted = false)
  - Display all owned games with correct status labels
  - Add pagination if needed
  - _Requirements: 10.3, 10.4_

- [ ] 16.5 Update game status labels throughout Developer UI
  - Use status mapper utility for all status displays
  - Ensure correct Vietnamese labels
  - _Requirements: 11.1-11.7_

- [ ] 17. Implement QC dashboard and console
  - [ ] 17.1 Update QC dashboard page
    - Fetch stats from GET /api/dashboard/qc
    - Display count of games awaiting QC
    - Display tested this week/month counts
    - Display pass/fail ratio
    - Show list of games needing QC
    - Remove mock data
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ]* 17.2 Write property test for QC game queue filtering
  - **Property 22: QC Game Queue Filtering**
  - **Validates: Requirements 14.1, 14.4**

- [ ] 17.3 Update QC console dashboard
  - Fetch games with filter (status = uploaded, isDeleted = false)
  - Display "Games Needing Test" section
  - Add links to game review pages
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 18. Implement CTO dashboard and console
  - [ ] 18.1 Update CTO dashboard page
    - Fetch stats from GET /api/dashboard/cto
    - Display count of games awaiting approval
    - Display approved this week/month counts
    - Show list of games awaiting approval
    - Remove mock data
    - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 18.2 Write property test for CTO approval queue filtering
  - **Property 23: CTO Approval Queue Filtering**
  - **Validates: Requirements 16.1**

- [ ] 18.3 Update CTO console dashboard
  - Fetch games with filter (status = qc_passed, isDeleted = false)
  - Display "Games Awaiting Approval" section
  - Show game name, QC completion date, QC tester
    - _Requirements: 16.1, 16.2_

- [ ] 18.4 Implement "Request Changes" functionality
  - Add "Request Changes" button to game detail in CTO console
  - Show dialog to enter note
  - Call POST /api/games/[id]/request-change
  - Remove game from approval queue on success
  - Show success message
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 19. Implement Admin dashboard and console
  - [ ] 19.1 Update Admin dashboard page
    - Fetch stats from GET /api/dashboard/admin
    - Display counts for published, archived, awaiting publication
    - Show list of games awaiting publication
    - Remove mock data
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ]* 19.2 Write property test for admin publication queue filtering
  - **Property 26: Admin Publication Queue Filtering**
  - **Validates: Requirements 19.1**

- [ ] 19.3 Update Admin console dashboard
  - Fetch games with filter (status = approved, isDeleted = false)
  - Display "Games Awaiting Publication" section
  - Display "Recently Published" section
  - Show game name, approval date, approver
  - _Requirements: 19.1, 19.2, 19.3_

- [ ] 19.4 Fix "Publish" button in game detail
  - Call POST /api/games/publish with gameId
  - Handle errors (show clear error message if status not approved)
  - Update UI to show new status on success
  - Remove game from awaiting publication queue
  - _Requirements: 20.1, 20.2, 20.6, 20.7_

- [ ] 20. Final checkpoint - Integration testing
  - Test complete workflows end-to-end:
    - Dev creates version → QC tests → CTO approves → Admin publishes
    - Manager filters games by status, owner, subject
    - Manager activates/deletes versions
    - Manager edits game information
  - Verify all dashboards show real data
  - Verify deleted games are hidden
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All API endpoints must include authentication and authorization checks
- All database queries must filter by `isDeleted: false` unless explicitly showing trash
- Use the status mapper utility consistently across all UI components
