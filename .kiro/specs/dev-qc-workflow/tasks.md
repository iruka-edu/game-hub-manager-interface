# Implementation Plan

- [x] 1. Extend Game model with metadata and Self-QA

  - [x] 1.1 Update Game interface in `src/models/Game.ts`


    - Add subject, grade, unit, gameType, priority fields
    - Add selfQaChecklist array and selfQaNote
    - Add submittedAt timestamp

    - _Requirements: 2.1, 4.1, 4.2_
  - [x] 1.2 Add GameRepository methods for metadata update
    - Implement updateMetadata() method
    - Implement updateSelfQa() method
    - _Requirements: 3.1, 3.2, 4.2_
  - [ ]* 1.3 Write property test for owner-based filtering
    - **Property 1: Owner-based Game Filtering**
    - **Validates: Requirements 1.1**
  - [x]* 1.4 Write property test for game creation defaults

    - **Property 2: Game Creation Defaults**


    - **Validates: Requirements 2.2**

- [x] 2. Create QC Report model and repository

  - [x] 2.1 Create QcReport model (`src/models/QcReport.ts`)
    - Define QcResult, QcItemStatus, Severity types

    - Define QcChecklistItem and QcReport interfaces
    - Implement QcReportRepository with CRUD methods
    - _Requirements: 9.1, 9.3, 11.1_

  - [x] 2.2 Add QC checklist configuration


    - Create default checklist categories (UI/UX, Audio, Performance, Gameplay, Content)
    - _Requirements: 9.1_



- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create Notification model and service
  - [x] 4.1 Create Notification model (`src/models/Notification.ts`)
    - Define NotificationType enum

    - Define Notification interface


    - Implement NotificationRepository
    - _Requirements: 13.1, 13.2_

  - [x] 4.2 Create NotificationService (`src/lib/notification.ts`)
    - Implement createNotification() method
    - Implement getUnreadCount() method

    - Implement markAsRead() method


    - _Requirements: 13.1, 13.3, 13.4_
  - [ ]* 4.3 Write property test for notification creation
    - **Property 9: Notification Creation on Status Change**


    - **Validates: Requirements 13.1**

- [x] 5. Create Game History model
  - [x] 5.1 Create GameHistory model (`src/models/GameHistory.ts`)
    - Define GameHistoryEntry interface

    - Implement GameHistoryRepository


    - _Requirements: 6.1, 6.2_
  - [x] 5.2 Create GameHistoryService (`src/lib/game-history.ts`)


    - Implement addEntry() method

    - Implement getHistory() method
    - _Requirements: 6.1, 6.3_

- [x] 6. Update game creation flow

  - [x] 6.1 Create game creation API (`src/pages/api/games/create.ts`)


    - Accept metadata fields (title, subject, grade, unit, gameType, priority)

    - Set status to 'draft' and ownerId to current user
    - Create audit log and history entry
    - _Requirements: 2.2, 2.3_

  - [x] 6.2 Create game creation page (`src/pages/console/games/new.astro`)


    - Form with required fields
    - Validation and error display
    - _Requirements: 2.1, 2.3_
  - [ ]* 6.3 Write property test for status-based edit restriction
    - **Property 3: Status-based Edit Restriction**

    - **Validates: Requirements 3.3**


- [x] 7. Update game edit flow
  - [x] 7.1 Create game edit API (`src/pages/api/games/[id]/update.ts`)

    - Check ownership and status before allowing edit
    - Update metadata and set updatedAt
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 7.2 Create game edit page (`src/pages/console/games/[id]/edit.astro`)
    - Pre-populate form with existing data
    - Disable for non-editable statuses

    - _Requirements: 3.1, 3.3_


- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Self-QA checklist
  - [x] 9.1 Create Self-QA API (`src/pages/api/games/self-qa.ts`)
    - Save checklist state for game
    - _Requirements: 4.2_
  - [x] 9.2 Add Self-QA panel to game detail page
    - Display checklist items


    - Save on change
    - _Requirements: 4.1, 4.2_

- [ ] 10. Update submit to QC flow
  - [x] 10.1 Update submit-qc API to check Self-QA

    - Validate checklist completion
    - Set submittedAt timestamp

    - Create notification for QC users

    - Create history entry
    - _Requirements: 4.3, 5.2, 5.3_
  - [ ]* 10.2 Write property test for submit status transition
    - **Property 4: Submit Status Transition**

    - **Validates: Requirements 5.2**

- [x] 11. Enhance QC Inbox

  - [x] 11.1 Add filters to QC inbox

    - Filter by subject, grade, priority, dev
    - Add re-test tab/filter
    - _Requirements: 7.2, 7.3, 12.1_
  - [x] 11.2 Show QC attempt count and previous severity

    - Query QC reports for each game
    - Display attempt number
    - _Requirements: 7.2, 12.2_
  - [ ]* 11.3 Write property test for QC inbox status filter
    - **Property 5: QC Inbox Status Filter**

    - **Validates: Requirements 7.1**

- [x] 12. Create QC Review page
  - [x] 12.1 Create review page (`src/pages/console/games/[id]/review.astro`)
    - Display game info and iframe preview
    - Show QC checklist panel
    - Show Dev's Self-QA results


    - _Requirements: 8.1, 8.2, 4.4_
  - [x] 12.2 Create QC result API (`src/pages/api/games/[id]/qc-result.ts`)


    - Accept checklist, result, note, severity, evidence
    - Validate required fields (note for fail, severity for fail)
    - Update game status
    - Create QC report
    - Create notifications
    - Create history entry
    - _Requirements: 9.3, 10.1, 10.2, 10.3, 10.4, 11.1_
  - [ ]* 12.3 Write property tests for QC status transitions
    - **Property 6: QC Pass Status Transition**
    - **Property 7: QC Fail Status Transition**
    - **Property 8: QC Fail Requires Note**
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement evidence upload
  - [ ] 14.1 Create evidence upload API (`src/pages/api/games/[id]/evidence.ts`)
    - Accept file uploads (images, videos, logs)
    - Store in GCS
    - Return URLs
    - _Requirements: 11.2_
  - [ ] 14.2 Add evidence upload UI to review page
    - File upload component
    - Preview thumbnails
    - _Requirements: 11.2, 11.3_

- [x] 15. Create Game History page
  - [x] 15.1 Add history tab to game detail page
    - Display timeline of status changes
    - Show QC reports with checklist and evidence
    - Show comments
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 16. Implement Notifications UI
  - [x] 16.1 Create notifications API (`src/pages/api/notifications.ts`)
    - GET: List user notifications
    - POST: Mark as read
    - _Requirements: 13.2, 13.3_
  - [x] 16.2 Add notification bell to layout
    - Show unread count
    - Dropdown with notification list
    - Click to navigate and mark read
    - _Requirements: 13.2, 13.3, 13.4_
  - [ ]* 16.3 Write property test for permission enforcement
    - **Property 10: Permission Enforcement**
    - **Validates: Requirements 1.4, 7.4, 8.4**

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
