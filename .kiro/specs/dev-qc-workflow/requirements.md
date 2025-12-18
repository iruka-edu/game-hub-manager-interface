# Requirements Document

## Introduction

Hệ thống Dev & QC Workflow cho Game Hub Manager cung cấp các tính năng quản lý game cho Developer và QC Tester. Dev có thể tạo, chỉnh sửa, upload build và gửi game cho QC. QC có thể review, đánh giá pass/fail và ghi feedback. Hệ thống tích hợp với RBAC/ABAC hiện có và audit logging.

## Glossary

- **Dev**: Developer - người tạo và phát triển game
- **QC**: Quality Control Tester - người kiểm thử chất lượng game
- **GameStatus**: Trạng thái game (draft, uploaded, qc_passed, qc_failed, approved, published, archived)
- **Self-QA**: Checklist tự kiểm tra của Dev trước khi gửi QC
- **QC Checklist**: Danh sách tiêu chí kiểm thử chuẩn hóa
- **Severity**: Mức độ nghiêm trọng của lỗi (Minor, Major, Critical)
- **Evidence**: Minh chứng lỗi (screenshot, video, log)

## Requirements

### Requirement 1: My Games - Danh sách game của Dev

**User Story:** As a Dev, I want to view all games I own with their status and update date, so that I can prioritize my work.

#### Acceptance Criteria

1. WHEN a Dev accesses /console/my-games THEN the System SHALL display only games where ownerId equals the current user's ID
2. WHEN displaying the game list THEN the System SHALL sort games by updatedAt in descending order by default
3. WHEN a Dev filters by status THEN the System SHALL show only games matching the selected status
4. WHILE a user lacks the 'games:view' permission THEN the System SHALL deny access with a 403 response

### Requirement 2: Create Game - Tạo game mới

**User Story:** As a Dev, I want to create a new game with basic information, so that I can start developing content.

#### Acceptance Criteria

1. WHEN a Dev with 'games:create' permission clicks "Tạo game mới" THEN the System SHALL display a form with required fields (title, subject, grade, unit, gameType)
2. WHEN a Dev submits the form with valid data THEN the System SHALL create a game with status 'draft' and ownerId set to the current user
3. WHEN a Dev submits the form with missing required fields THEN the System SHALL reject the submission and display validation errors
4. WHILE a user lacks the 'games:create' permission THEN the System SHALL hide the create button

### Requirement 3: Edit Metadata - Chỉnh sửa thông tin game

**User Story:** As a Dev, I want to edit game metadata, so that I can keep information accurate and up-to-date.

#### Acceptance Criteria

1. WHEN a Dev owns a game in editable status (draft, qc_failed) THEN the System SHALL allow editing metadata fields
2. WHEN a Dev saves changes THEN the System SHALL update the game and set updatedAt to current timestamp
3. WHEN a game is in approved or published status THEN the System SHALL disable the edit functionality
4. WHILE a user is not the owner of the game THEN the System SHALL deny edit access

### Requirement 4: Self-QA Checklist - Tự kiểm tra trước QC

**User Story:** As a Dev, I want to complete a self-QA checklist before submitting to QC, so that I can catch basic issues early.

#### Acceptance Criteria

1. WHEN a Dev views a game detail page THEN the System SHALL display a Self-QA checklist panel
2. WHEN a Dev ticks checklist items THEN the System SHALL save the checklist state for that game
3. WHEN a Dev attempts to submit without completing required checklist items THEN the System SHALL display a warning dialog
4. WHEN QC reviews a game THEN the System SHALL display the Dev's Self-QA results

### Requirement 5: Submit to QC - Gửi game cho QC

**User Story:** As a Dev, I want to submit my game to QC, so that it can be officially tested.

#### Acceptance Criteria

1. WHEN a Dev with 'games:submit' permission owns a game in draft or qc_failed status THEN the System SHALL enable the "Gửi QC" button
2. WHEN a Dev confirms submission THEN the System SHALL change game status to 'uploaded' and record submittedAt timestamp
3. WHEN a game is submitted THEN the System SHALL create an audit log entry and send notification to QC
4. WHEN a game is not in submittable status THEN the System SHALL return a 400 error with explanation

### Requirement 6: View Feedback & History - Xem lịch sử và feedback

**User Story:** As a Dev, I want to view QC feedback and game history, so that I can fix issues accurately.

#### Acceptance Criteria

1. WHEN a Dev views their game's history tab THEN the System SHALL display a timeline of all status changes
2. WHEN displaying QC results THEN the System SHALL show checklist, notes, severity, and evidence
3. WHEN a Dev views history THEN the System SHALL prevent modification of QC logs
4. WHEN displaying comments THEN the System SHALL show the comment thread between Dev and QC

### Requirement 7: QC Inbox - Danh sách game chờ QC

**User Story:** As a QC, I want to see a list of games waiting for review, so that I can prioritize my testing work.

#### Acceptance Criteria

1. WHEN a QC with 'games:review' permission accesses /console/qc-inbox THEN the System SHALL display games with status 'uploaded'
2. WHEN displaying the inbox THEN the System SHALL show game name, subject, grade, dev name, submittedAt, and previous QC count
3. WHEN a QC filters the inbox THEN the System SHALL support filtering by subject, grade, priority, and dev
4. WHILE a user lacks the 'games:review' permission THEN the System SHALL deny access with a 403 response

### Requirement 8: QC Review - Màn hình review chi tiết

**User Story:** As a QC, I want to open a detailed review screen with game preview and checklist, so that I can test thoroughly.

#### Acceptance Criteria

1. WHEN a QC clicks a game in the inbox THEN the System SHALL navigate to the game detail page with QC tab active
2. WHEN displaying the review screen THEN the System SHALL show game info, iframe preview, and QC checklist panel
3. WHEN a game is no longer in 'uploaded' status THEN the System SHALL display a message that the game has been processed
4. WHILE a QC lacks permission to review the game THEN the System SHALL return a 403 response

### Requirement 9: QC Checklist - Checklist kiểm thử chuẩn hóa

**User Story:** As a QC, I want a standardized checklist to evaluate games, so that quality assessment is consistent.

#### Acceptance Criteria

1. WHEN a QC reviews a game THEN the System SHALL display checklist categories (UI/UX, Audio, Performance, Gameplay, Content)
2. WHEN a QC evaluates each item THEN the System SHALL allow selection of OK, Warning, or Fail with optional notes
3. WHEN a QC submits the result THEN the System SHALL save the checklist with the QC report
4. WHEN CTO views game history THEN the System SHALL display the QC checklist results

### Requirement 10: QC Decision - Kết luận Pass/Fail

**User Story:** As a QC, I want to mark a game as passed or failed with clear reasoning, so that Dev knows what to do next.

#### Acceptance Criteria

1. WHEN a QC with 'games:review' permission reviews a game in 'uploaded' status THEN the System SHALL enable Pass and Fail buttons
2. WHEN a QC selects "QC cần sửa" THEN the System SHALL require a note explaining the failure reason
3. WHEN a QC passes a game THEN the System SHALL change status to 'qc_passed' and notify Dev and CTO
4. WHEN a QC fails a game THEN the System SHALL change status to 'qc_failed' and notify Dev

### Requirement 11: Severity & Evidence - Mức độ lỗi và minh chứng

**User Story:** As a QC, I want to attach severity level and evidence to issues, so that Dev and CTO understand the impact.

#### Acceptance Criteria

1. WHEN a QC submits a fail result THEN the System SHALL require selection of severity (Minor, Major, Critical)
2. WHEN a QC uploads evidence THEN the System SHALL accept screenshots, short videos, and log files
3. WHEN displaying QC results THEN the System SHALL show severity and evidence links
4. WHEN Dev views feedback THEN the System SHALL allow viewing and downloading evidence files

### Requirement 12: Re-test List - Danh sách cần QC lại

**User Story:** As a QC, I want to see games that were previously failed and resubmitted, so that I can prioritize re-testing.

#### Acceptance Criteria

1. WHEN a QC views the inbox THEN the System SHALL provide a "Cần QC lại" filter/tab
2. WHEN displaying re-test games THEN the System SHALL show the QC attempt number and previous severity
3. WHEN a game has been failed multiple times THEN the System SHALL highlight it for priority attention
4. WHEN a re-test game passes THEN the System SHALL move it out of the re-test list

### Requirement 13: Notifications - Thông báo

**User Story:** As a Dev or QC, I want to receive notifications when game status changes, so that I don't have to check manually.

#### Acceptance Criteria

1. WHEN a game status changes THEN the System SHALL create a notification for relevant users (owner, QC, CTO)
2. WHEN displaying notifications THEN the System SHALL show title, timestamp, and link to the game
3. WHEN a user clicks a notification THEN the System SHALL mark it as read and navigate to the game
4. WHEN displaying the notification icon THEN the System SHALL show the count of unread notifications
