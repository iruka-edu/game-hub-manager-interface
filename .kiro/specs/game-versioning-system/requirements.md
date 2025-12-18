# Requirements Document

## Introduction

Hệ thống Game Versioning System cải tiến kiến trúc dữ liệu của Game Hub Manager bằng cách tách biệt thông tin game và các phiên bản build. Thay vì lưu tất cả trong một collection `Games` với một trạng thái duy nhất, hệ thống mới cho phép quản lý nhiều phiên bản build song song, lưu trữ lịch sử QC chi tiết, và hỗ trợ re-test một cách có cấu trúc. Điều này giải quyết các vấn đề về truy vết lỗi, thống kê năng suất, và tránh conflict khi Dev upload bản mới trong khi QC đang test bản cũ.

## Glossary

- **Game**: Thông tin metadata chung của game (title, slug, owner) - ít thay đổi
- **GameVersion**: Một phiên bản build cụ thể của game với trạng thái và file riêng
- **QCReview**: Một phiên làm việc QC test trên một GameVersion cụ thể
- **SemVer**: Semantic Versioning (VD: 1.0.0, 1.0.1, 1.2.0)
- **Build**: File game đã được upload lên GCS
- **Re-test**: Việc QC test lại một game đã từng fail trước đó
- **State Machine**: Quy trình chuyển đổi trạng thái có cấu trúc
- **Regression Testing**: Kiểm thử tập trung vào các lỗi đã được báo cáo trước đó

## Requirements

### Requirement 1: Game Collection - Thông tin metadata chung

**User Story:** As a system architect, I want to separate game metadata from version-specific data, so that the system can manage multiple versions efficiently.

#### Acceptance Criteria

1. WHEN a new game is created THEN the System SHALL create a Game document with slug, title, ownerId, and metadata fields
2. WHEN a game has multiple versions THEN the System SHALL maintain references to latestVersionId and liveVersionId
3. WHEN querying game information THEN the System SHALL return metadata without loading all version history
4. WHEN a game is deleted THEN the System SHALL mark it as deleted without removing version history
5. THE System SHALL enforce unique slug constraint across all games

### Requirement 2: GameVersion Collection - Quản lý phiên bản build

**User Story:** As a Dev, I want each build upload to create a new version, so that I can maintain history and QC can test specific builds.

#### Acceptance Criteria

1. WHEN a Dev uploads a new build THEN the System SHALL create a new GameVersion document with incremented version number
2. WHEN creating a GameVersion THEN the System SHALL store storagePath, entryFile, submittedBy, and submittedAt
3. WHEN a GameVersion is created THEN the System SHALL set status to 'draft' by default
4. WHEN a Dev submits Self-QA THEN the System SHALL save selfQAChecklist data in the GameVersion document
5. WHEN a Dev adds release notes THEN the System SHALL store releaseNote in the GameVersion document

### Requirement 3: QCReview Collection - Lưu trữ kết quả QC

**User Story:** As a QC, I want each test session to be recorded separately, so that we can track testing history and re-test effectively.

#### Acceptance Criteria

1. WHEN a QC completes a review THEN the System SHALL create a QCReview document linked to the specific GameVersion
2. WHEN creating a QCReview THEN the System SHALL record reviewerId, startedAt, finishedAt, result, and checklist
3. WHEN a QC marks a game as failed THEN the System SHALL require severity level (minor, major, critical)
4. WHEN a QC uploads evidence THEN the System SHALL store attachment URLs in the QCReview document
5. WHEN querying QC history THEN the System SHALL return all QCReview documents for a game ordered by date

### Requirement 4: Version Number Management - Quản lý số phiên bản

**User Story:** As a Dev, I want version numbers to increment automatically, so that I can track build progression clearly.

#### Acceptance Criteria

1. WHEN a Dev uploads the first build THEN the System SHALL assign version "1.0.0"
2. WHEN a Dev uploads a subsequent build THEN the System SHALL increment the patch version (e.g., 1.0.0 → 1.0.1)
3. WHEN a Dev manually specifies a version THEN the System SHALL validate it follows SemVer format
4. WHEN a version number already exists THEN the System SHALL reject the upload with error message
5. THE System SHALL support querying versions by version number string

### Requirement 5: State Machine - Quy trình chuyển đổi trạng thái

**User Story:** As a system architect, I want a strict state machine for GameVersion status, so that invalid transitions are prevented.

#### Acceptance Criteria

1. WHEN a GameVersion is created THEN the System SHALL set status to 'draft'
2. WHEN a Dev submits to QC THEN the System SHALL transition status from 'draft' or 'qc_failed' to 'uploaded'
3. WHEN a QC starts review THEN the System SHALL transition status from 'uploaded' to 'qc_processing'
4. WHEN a QC passes a game THEN the System SHALL transition status from 'qc_processing' to 'qc_passed'
5. WHEN a QC fails a game THEN the System SHALL transition status from 'qc_processing' to 'qc_failed'
6. WHEN an invalid transition is attempted THEN the System SHALL reject with error explaining valid transitions

### Requirement 6: Re-test Detection - Phát hiện game cần test lại

**User Story:** As a QC, I want to see which games are re-submissions, so that I can focus on previously reported issues.

#### Acceptance Criteria

1. WHEN displaying QC inbox THEN the System SHALL show re-test indicator for games with previous QCReview records
2. WHEN a game has multiple QCReview records THEN the System SHALL display the attempt count
3. WHEN a QC views a re-test game THEN the System SHALL show previous QCReview results and severity
4. WHEN filtering inbox THEN the System SHALL support filtering by re-test status
5. WHEN a re-test game is reviewed THEN the System SHALL link the new QCReview to previous reviews

### Requirement 7: Build History - Lịch sử build và truy vết

**User Story:** As a Dev, I want to view all versions of my game with their status, so that I can track development progress.

#### Acceptance Criteria

1. WHEN a Dev views game detail THEN the System SHALL display all GameVersion records ordered by version number
2. WHEN displaying version history THEN the System SHALL show version, status, submittedAt, and QC result
3. WHEN a Dev clicks a version THEN the System SHALL show detailed information including Self-QA and QC feedback
4. WHEN comparing versions THEN the System SHALL display release notes to show what changed
5. THE System SHALL prevent deletion of GameVersion records to maintain audit trail

### Requirement 8: Live Version Management - Quản lý phiên bản đang chạy

**User Story:** As an Admin, I want to set which version is live for users, so that I can control what players see.

#### Acceptance Criteria

1. WHEN a GameVersion reaches 'published' status THEN the System SHALL allow setting it as liveVersionId
2. WHEN updating liveVersionId THEN the System SHALL update the Game document's liveVersionId field
3. WHEN users access a game THEN the System SHALL serve files from the liveVersionId's storagePath
4. WHEN no liveVersionId is set THEN the System SHALL return 404 for game access attempts
5. WHEN a new version is published THEN the System SHALL not automatically change liveVersionId

### Requirement 9: Storage Path Management - Quản lý đường dẫn lưu trữ

**User Story:** As a Dev, I want each version to have its own storage path, so that uploads don't overwrite previous builds.

#### Acceptance Criteria

1. WHEN a GameVersion is created THEN the System SHALL generate storagePath as "games/{slug}/{version}/"
2. WHEN uploading build files THEN the System SHALL store them in the version-specific storagePath
3. WHEN a GameVersion is deleted THEN the System SHALL optionally clean up files from GCS
4. WHEN serving game files THEN the System SHALL construct URLs using the GameVersion's storagePath
5. THE System SHALL validate that storagePath does not conflict with existing versions

### Requirement 10: QC Checklist Integration - Tích hợp checklist QC

**User Story:** As a QC, I want the checklist to be stored with each review, so that I can see how quality evolved over versions.

#### Acceptance Criteria

1. WHEN a QC completes a review THEN the System SHALL save checklist results in the QCReview document
2. WHEN displaying QC history THEN the System SHALL show checklist results for each review
3. WHEN comparing reviews THEN the System SHALL highlight which checklist items changed from fail to pass
4. WHEN a checklist item fails THEN the System SHALL allow QC to add item-specific notes
5. THE System SHALL support configurable checklist categories (UI, Audio, Performance, Logic, Content)

### Requirement 11: Migration from Old Model - Di chuyển dữ liệu cũ

**User Story:** As a system administrator, I want to migrate existing games to the new model, so that historical data is preserved.

#### Acceptance Criteria

1. WHEN migration runs THEN the System SHALL create Game documents from existing game records
2. WHEN migration runs THEN the System SHALL create GameVersion documents with version "1.0.0" for existing games
3. WHEN migration runs THEN the System SHALL preserve existing status in the GameVersion status field
4. WHEN migration runs THEN the System SHALL set latestVersionId to the created GameVersion
5. WHEN migration completes THEN the System SHALL log summary of migrated records

### Requirement 12: Performance and Indexing - Hiệu suất và chỉ mục

**User Story:** As a system architect, I want proper indexes on new collections, so that queries remain fast as data grows.

#### Acceptance Criteria

1. THE System SHALL create index on GameVersion.gameId for efficient version lookup
2. THE System SHALL create compound index on GameVersion.gameId and GameVersion.version
3. THE System SHALL create index on GameVersion.status for QC inbox queries
4. THE System SHALL create index on QCReview.gameId for history queries
5. THE System SHALL create index on QCReview.versionId for version-specific review lookup

### Requirement 13: API Compatibility - Tương thích API

**User Story:** As a frontend developer, I want APIs to work with the new model, so that existing features continue functioning.

#### Acceptance Criteria

1. WHEN existing APIs query games THEN the System SHALL join Game and GameVersion data as needed
2. WHEN APIs return game data THEN the System SHALL include latestVersion and liveVersion information
3. WHEN APIs update game status THEN the System SHALL update the appropriate GameVersion status
4. WHEN APIs create games THEN the System SHALL create both Game and initial GameVersion documents
5. WHEN APIs fail THEN the System SHALL return clear error messages about version-related issues
