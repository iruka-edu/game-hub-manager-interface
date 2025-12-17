# Implementation Plan

- [x] 1. Set up audit logging types and core service


  - [x] 1.1 Create audit types file (`src/lib/audit-types.ts`)


    - Define ActionType, TargetEntity, AuditActor, AuditTarget, AuditChange, AuditLogEntry types


    - _Requirements: 1.1, 1.2_
  - [ ] 1.2 Create AuditLogger service (`src/lib/audit.ts`)
    - Implement `log()` method with async MongoDB insert
    - Implement `getLogs()` method with filtering and pagination
    - Implement `getLogsCount()` method for pagination
    - Implement `ensureIndexes()` method for database setup
    - Handle errors gracefully without interrupting main operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 1.3 Write property test for audit log entry completeness
    - **Property 1: Audit Log Entry Completeness**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 1.4 Write property test for serialization round-trip
    - **Property 2: Serialization Round-Trip**

    - **Validates: Requirements 1.4, 1.5**
  - [ ]* 1.5 Write property test for error isolation
    - **Property 3: Error Isolation**

    - **Validates: Requirements 1.3**



- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.




- [x] 3. Integrate audit logging into upload APIs


  - [x] 3.1 Add audit logging to folder upload (`src/pages/api/upload.ts`)


    - Log GAME_UPLOAD action with method 'FOLDER_UPLOAD', file count, root folder


    - Extract actor info from context.locals.user


    - Extract IP and user agent from request headers


    - _Requirements: 2.1, 2.3_
  - [ ] 3.2 Add audit logging to ZIP upload (`src/pages/api/upload-zip.ts`)
    - Log GAME_UPLOAD action with method 'ZIP_UPLOAD', file count, extracted folder info
    - _Requirements: 2.2, 2.3_




- [ ] 4. Integrate audit logging into game status APIs
  - [ ] 4.1 Add audit logging to approve API (`src/pages/api/games/approve.ts`)
    - Log GAME_STATUS_CHANGE with old status 'qc_passed' and new status 'approved'
    - _Requirements: 3.1, 3.3_
  - [x] 4.2 Add audit logging to reject API (`src/pages/api/games/reject.ts`)

    - Log GAME_STATUS_CHANGE with rejection reason in metadata
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 4.3 Add audit logging to submit-qc API (`src/pages/api/games/submit-qc.ts`)
    - Log GAME_STATUS_CHANGE for QC submission

    - _Requirements: 3.1, 3.3_


  - [ ] 4.4 Add audit logging to qc-review API (`src/pages/api/games/qc-review.ts`)
    - Log GAME_STATUS_CHANGE for QC review actions


    - _Requirements: 3.1, 3.3_
  - [ ] 4.5 Add audit logging to publish API (`src/pages/api/games/publish.ts`)
    - Log GAME_STATUS_CHANGE for publish action
    - _Requirements: 3.1, 3.3_

  - [x]* 4.6 Write property test for status change tracking


    - **Property 4: Status Change Tracking**
    - **Validates: Requirements 3.1, 3.3**

- [x] 5. Integrate audit logging into delete API


  - [ ] 5.1 Add audit logging to delete API (`src/pages/api/games/delete.ts`)
    - Log GAME_DELETE_VERSION for version deletion
    - Log GAME_DELETE_FULL for full game deletion
    - Include trigger reason in metadata
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 5.2 Write property test for deletion tracking
    - **Property 5: Deletion Tracking**

    - **Validates: Requirements 4.1, 4.2**



- [x] 6. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add audit view permission to RBAC
  - [ ] 7.1 Update auth-rbac.ts with new permission
    - Add 'system:audit_view' to Permission type
    - Add permission to admin and cto roles in ROLE_PERMISSIONS
    - _Requirements: 5.4_
  - [ ] 7.2 Update page-permissions.ts for audit logs page
    - Add /console/audit-logs route with 'system:audit_view' permission requirement
    - _Requirements: 5.4_
  - [ ]* 7.3 Write property test for permission enforcement
    - **Property 8: Permission Enforcement**
    - **Validates: Requirements 5.4**

- [ ] 8. Create admin UI for audit logs
  - [ ] 8.1 Create audit logs page (`src/pages/console/audit-logs.astro`)
    - Use ConsoleLayout
    - Display paginated table with timestamp, actor, action, target, details columns
    - Add filter controls for user, action type, date range, game ID
    - Implement pagination controls
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 8.2 Create API endpoint for fetching audit logs (`src/pages/api/audit-logs.ts`)
    - Accept filter parameters (userId, action, startDate, endDate, targetId)
    - Return paginated results with total count
    - Require 'system:audit_view' permission
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 8.3 Write property tests for query pagination and filter correctness
    - **Property 6: Query Pagination**
    - **Property 7: Filter Correctness**
    - **Validates: Requirements 5.1, 5.3**

- [ ] 9. Set up database indexes
  - [ ] 9.1 Create index setup script or add to ensureIndexes
    - Create index on target.id
    - Create index on actor.userId
    - Create index on createdAt (descending)
    - Create TTL index on createdAt (90 days expiry)
    - _Requirements: 6.1, 6.2_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
