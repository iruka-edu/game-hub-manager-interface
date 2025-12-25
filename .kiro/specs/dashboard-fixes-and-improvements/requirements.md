# Requirements Document

## Introduction

This specification addresses critical bugs and missing functionality across all user role dashboards and consoles in the GameHub Manager system. The system currently has data available but lacks proper UI bindings, API integrations, and action handlers across Manager, Developer, QC, CTO, and Admin interfaces. This is a comprehensive fix to complete features that were designed but not fully implemented, ensuring end-to-end workflows function correctly from Dev → QC → CTO → Admin.

## Glossary

- **System**: The game management web application
- **Manager**: User with general management permissions
- **Developer**: User who creates and uploads games
- **QC**: Quality Control user who tests and reviews games
- **CTO**: Chief Technical Officer who approves games after QC
- **Admin**: Administrator who publishes approved games
- **Version**: A specific iteration of a game with unique files and metadata
- **Active_Version**: The currently selected version of a game that is being used
- **Dashboard**: The main overview page for each user role
- **Console**: The detailed management interface for each user role
- **Game_Status**: The current state of a game (draft, uploaded, qc_failed, qc_passed, approved, published, archived)
- **Filter**: UI controls that allow users to narrow down displayed data
- **Version_History**: Complete list of all versions created for a game
- **QC_Report**: Documentation of quality control testing results

## Requirements

### Requirement 1: Version History Display

**User Story:** As a Manager, I want to view the complete version history of a game, so that I can track all changes and iterations over time.

#### Acceptance Criteria

1. WHEN a Manager views a game's version history, THE System SHALL display all versions, not only the latest version
2. WHEN displaying version history, THE System SHALL show version number, status, creation date, and creator for each version
3. WHEN a Manager selects a version from history, THE System SHALL display the details of that specific version
4. THE System SHALL present version history in chronological order with the newest version first

### Requirement 2: Dashboard Filters

**User Story:** As a Manager, I want to filter games by status, owner, and subject, so that I can quickly find relevant games.

#### Acceptance Criteria

1. WHEN a Manager changes a filter selection, THE System SHALL update the displayed game list to match the filter criteria
2. THE System SHALL support filtering by game status (draft, uploaded, qc_failed, qc_passed, approved, published, archived)
3. THE System SHALL support filtering by game owner (responsible user)
4. THE System SHALL support filtering by game subject or category
5. WHEN multiple filters are applied, THE System SHALL combine them using AND logic

### Requirement 3: Version Activation

**User Story:** As a Manager, I want to activate a specific game version, so that it becomes the current active version.

#### Acceptance Criteria

1. WHEN a Manager activates a version, THE System SHALL update the game's activeVersionId field
2. WHEN a Manager activates a version, THE System SHALL update the UI immediately to reflect the active status
3. WHEN a Manager returns to the main dashboard after activating a version, THE System SHALL display the newly activated version
4. THE System SHALL allow only one active version per game at any time

### Requirement 4: Version Deletion

**User Story:** As a Manager, I want to delete game versions that are no longer needed, so that I can maintain a clean version history.

#### Acceptance Criteria

1. WHEN a Manager clicks the delete button for a version, THE System SHALL remove that version from the database
2. WHEN a version is deleted, THE System SHALL update the UI to remove it from the version list
3. IF the deleted version is the active version, THEN THE System SHALL prevent deletion and display an error message
4. WHEN a version is deleted, THE System SHALL maintain referential integrity with related data

### Requirement 5: New Version Creation

**User Story:** As a Manager, I want to create new game versions, so that I can iterate on game content.

#### Acceptance Criteria

1. WHEN a Manager creates a new version, THE System SHALL generate a unique version identifier
2. WHEN a new version is created, THE System SHALL display it in the version management list immediately
3. WHEN creating a new version, THE System SHALL correctly associate it with the parent game
4. WHEN displaying a newly created version, THE System SHALL show the correct game name

### Requirement 6: Responsible User Display

**User Story:** As a Manager, I want to see the name of the person responsible for a game, so that I know who to contact about it.

#### Acceptance Criteria

1. WHEN viewing game details, THE System SHALL display the responsible user's name, not their ID
2. THE System SHALL retrieve user names from the user database or API
3. IF a responsible user is not assigned, THEN THE System SHALL display "Unassigned" or similar placeholder text

### Requirement 7: Quick Action Buttons

**User Story:** As a Manager, I want quick action buttons on the game detail page, so that I can efficiently perform common tasks.

#### Acceptance Criteria

1. WHEN a Manager clicks "Create New Version", THE System SHALL navigate to the version creation page with the current game ID
2. WHEN a Manager clicks "Manage Versions", THE System SHALL navigate to the version management page for that game
3. WHEN a Manager clicks "Edit Information", THE System SHALL navigate to the game edit page
4. THE System SHALL display all quick action buttons on the game detail page

### Requirement 8: Game Information Editing

**User Story:** As a Manager, I want to edit game information including the responsible user, so that I can keep game metadata up to date.

#### Acceptance Criteria

1. WHEN a Manager opens the edit page, THE System SHALL load and display all current game information
2. WHEN displaying the responsible user field, THE System SHALL show a dropdown of available users
3. WHEN a Manager submits the edit form, THE System SHALL save all changes to the database
4. WHEN changes are saved successfully, THE System SHALL display a success message and update the UI

### Requirement 9: Developer Dashboard

**User Story:** As a Developer, I want to see my game statistics on my dashboard, so that I can track my work progress.

#### Acceptance Criteria

1. WHEN a Developer views their dashboard, THE System SHALL display the count of games in draft status
2. WHEN a Developer views their dashboard, THE System SHALL display the count of games that failed QC
3. WHEN a Developer views their dashboard, THE System SHALL display the count of games submitted for QC
4. WHEN a Developer views their dashboard, THE System SHALL display the count of published games
5. THE System SHALL filter all dashboard statistics by the current Developer's user ID

### Requirement 10: Developer Console Game Display

**User Story:** As a Developer, I want to see my games in the Developer Console, so that I can manage them.

#### Acceptance Criteria

1. WHEN a Developer views the console dashboard, THE System SHALL display newly uploaded games
2. WHEN a Developer views the console dashboard, THE System SHALL display games that need fixes after QC failure
3. WHEN a Developer views "My Games" section, THE System SHALL display all games owned by the Developer
4. THE System SHALL exclude deleted games from all Developer views

### Requirement 11: Game Status Display

**User Story:** As a Developer, I want to see accurate game status labels, so that I understand the current state of my games.

#### Acceptance Criteria

1. WHEN displaying game status, THE System SHALL map "draft" to "Nháp" (Draft)
2. WHEN displaying game status, THE System SHALL map "uploaded" to "Chờ QC" (Awaiting QC)
3. WHEN displaying game status, THE System SHALL map "qc_failed" to "Cần sửa" (Needs Fixes)
4. WHEN displaying game status, THE System SHALL map "qc_passed" to "Chờ duyệt" (Awaiting Approval)
5. WHEN displaying game status, THE System SHALL map "approved" to "Chờ xuất bản" (Awaiting Publication)
6. WHEN displaying game status, THE System SHALL map "published" to "Đang sử dụng" (In Use)
7. WHEN displaying game status, THE System SHALL map "archived" to "Lưu trữ" (Archived)

### Requirement 12: Game History and QC Reports

**User Story:** As a Developer, I want to view game history and QC reports, so that I can understand what changes were made and what issues were found.

#### Acceptance Criteria

1. WHEN a Developer views the History tab, THE System SHALL display a timeline of all status changes for the game
2. WHEN a Developer views the QC Report tab, THE System SHALL display all QC test results for the game
3. WHEN displaying QC reports, THE System SHALL show pass/fail status, notes, and severity for each test
4. THE System SHALL retrieve history and QC report data from the database, not mock data

### Requirement 13: QC Dashboard

**User Story:** As a QC user, I want to see QC statistics on my dashboard, so that I can track my testing workload.

#### Acceptance Criteria

1. WHEN a QC user views their dashboard, THE System SHALL display the count of games awaiting QC testing
2. WHEN a QC user views their dashboard, THE System SHALL display the count of games tested this week
3. WHEN a QC user views their dashboard, THE System SHALL display the count of games tested this month
4. WHEN a QC user views their dashboard, THE System SHALL display the pass/fail ratio for tested games

### Requirement 14: QC Console Game Queue

**User Story:** As a QC user, I want to see games that need testing in my console, so that I can prioritize my work.

#### Acceptance Criteria

1. WHEN a QC user views the console dashboard, THE System SHALL display all games with "uploaded" status
2. WHEN displaying games needing QC, THE System SHALL show game name, upload date, and developer
3. WHEN a QC user clicks on a game, THE System SHALL navigate to the game review page
4. THE System SHALL filter games by assignment if QC users have specific assignments

### Requirement 15: CTO Dashboard

**User Story:** As a CTO, I want to see approval statistics on my dashboard, so that I can monitor the approval pipeline.

#### Acceptance Criteria

1. WHEN a CTO views their dashboard, THE System SHALL display the count of games awaiting approval
2. WHEN a CTO views their dashboard, THE System SHALL display the count of games approved this week
3. WHEN a CTO views their dashboard, THE System SHALL display the count of games approved this month
4. THE System SHALL display games with "qc_passed" status in the awaiting approval list

### Requirement 16: CTO Console Approval Queue

**User Story:** As a CTO, I want to see games awaiting approval in my console, so that I can review and approve them.

#### Acceptance Criteria

1. WHEN a CTO views the console dashboard, THE System SHALL display all games with "qc_passed" status
2. WHEN displaying games awaiting approval, THE System SHALL show game name, QC completion date, and QC tester
3. THE System SHALL provide links to review each game in detail

### Requirement 17: Request Changes Functionality

**User Story:** As a CTO, I want to request changes to a game that passed QC, so that developers can make necessary improvements before publication.

#### Acceptance Criteria

1. WHEN a CTO clicks "Request Changes" on a game, THE System SHALL change the game status from "qc_passed" to "qc_failed"
2. WHEN requesting changes, THE System SHALL allow the CTO to enter a note explaining the required changes
3. WHEN changes are requested, THE System SHALL save the note to the database
4. WHEN changes are requested, THE System SHALL remove the game from the CTO's approval queue
5. WHEN changes are requested, THE System SHALL notify the Developer and QC user

### Requirement 18: Admin Dashboard

**User Story:** As an Admin, I want to see publication statistics on my dashboard, so that I can monitor the publication pipeline.

#### Acceptance Criteria

1. WHEN an Admin views their dashboard, THE System SHALL display the count of published games
2. WHEN an Admin views their dashboard, THE System SHALL display the count of archived games
3. WHEN an Admin views their dashboard, THE System SHALL display the count of games awaiting publication
4. THE System SHALL display games with "approved" status in the awaiting publication list

### Requirement 19: Admin Console Publication Queue

**User Story:** As an Admin, I want to see games awaiting publication in my console, so that I can publish them.

#### Acceptance Criteria

1. WHEN an Admin views the console dashboard, THE System SHALL display all games with "approved" status
2. WHEN displaying games awaiting publication, THE System SHALL show game name, approval date, and approver
3. WHEN an Admin views recently published games, THE System SHALL display the most recent publications

### Requirement 20: Game Publication

**User Story:** As an Admin, I want to publish approved games, so that they become available to end users.

#### Acceptance Criteria

1. WHEN an Admin clicks "Publish" on a game, THE System SHALL verify the game status is "approved"
2. IF the game status is not "approved", THEN THE System SHALL display an error message and prevent publication
3. WHEN publishing a game, THE System SHALL update the game status to "published"
4. WHEN publishing a game, THE System SHALL record the publication timestamp
5. WHEN publishing a game, THE System SHALL record the Admin user who published it
6. WHEN a game is published successfully, THE System SHALL update the UI to reflect the new status
7. WHEN a game is published successfully, THE System SHALL remove it from the awaiting publication queue

### Requirement 21: Deleted Games Filtering

**User Story:** As any user, I want deleted games to be hidden from all lists by default, so that I only see active games.

#### Acceptance Criteria

1. WHEN any user views a game list, THE System SHALL exclude games where isDeleted equals true
2. THE System SHALL apply the deleted filter to all dashboard views
3. THE System SHALL apply the deleted filter to all console views
4. THE System SHALL apply the deleted filter to all library views
5. WHERE an admin trash view exists, THE System SHALL show only deleted games in that view
