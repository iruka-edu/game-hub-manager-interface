# Requirements Document

## Introduction

Hệ thống Draft/Publish Delivery đảm bảo Game Hub chỉ hiển thị những game đã vượt qua tất cả các bài kiểm tra (QC Passed) và đã được quản trị viên phê duyệt phát hành (Published). Hệ thống xây dựng một "Bộ lọc Gateway" giữa hệ thống quản lý (CMS) và người dùng cuối, tách biệt hoàn toàn Management Registry (MongoDB) và Public Registry (GCS JSON).

## Glossary

- **Game Hub**: Ứng dụng client nơi học sinh chơi game
- **Management Registry**: Cơ sở dữ liệu MongoDB chứa tất cả thông tin game, bao gồm các bản build lỗi và phiên bản đang test
- **Public Registry**: File JSON trên GCS chỉ chứa các game đã published và enabled
- **GCS**: Google Cloud Storage - nơi lưu trữ file game và registry
- **CDN**: Content Delivery Network - mạng phân phối nội dung
- **Active Version**: Phiên bản game đang được sử dụng cho người chơi
- **Live Version**: Phiên bản game đang được phát hành công khai
- **Kill-switch**: Cơ chế vô hiệu hóa game ngay lập tức thông qua field `disabled`
- **Rollout Percentage**: Tỷ lệ phần trăm người dùng được phép thấy bản cập nhật mới
- **Publishing Pipeline**: Quy trình "bơm" dữ liệu từ Management Registry sang Public Registry

## Requirements

### Requirement 1

**User Story:** As an Admin, I want to publish approved game versions to the Public Registry, so that students can access only QC-passed and approved games.

#### Acceptance Criteria

1. WHEN an Admin triggers the publish action on a game version THEN the System SHALL verify that the version status is "approved" before allowing the transition to "published"
2. WHEN a version is successfully published THEN the System SHALL update the version status to "published" in MongoDB
3. WHEN a version is successfully published THEN the System SHALL synchronize the game entry to the Public Registry JSON file on GCS
4. WHEN publishing a version THEN the System SHALL validate that the activeVersion has a valid `index.html` and manifest on GCS before completing the publish
5. IF a version status is not "approved" THEN the System SHALL reject the publish request and return an appropriate error message

### Requirement 2

**User Story:** As a System, I want to maintain a separate Public Registry from the Management Registry, so that Game Hub only receives sanitized, approved content.

#### Acceptance Criteria

1. WHEN the Public Registry is generated THEN the System SHALL include only games with status "published" and disabled field set to false
2. WHEN the Public Registry is updated THEN the System SHALL set the Cache-Control header to "no-cache" for the registry JSON file
3. WHEN generating the Public Registry THEN the System SHALL extract only necessary metadata: id, title, entryUrl, iconUrl, capabilities, runtime, and rolloutPercentage
4. WHEN a game is published THEN the System SHALL serialize the Public Registry to JSON format and store it at `registry/public.json` on GCS
5. WHEN the Public Registry is read THEN the System SHALL parse the JSON and return a typed array of PublicGameEntry objects

### Requirement 3

**User Story:** As an Admin, I want to disable a published game immediately using a kill-switch, so that I can remove problematic content without waiting for a full unpublish workflow.

#### Acceptance Criteria

1. WHEN an Admin sets the disabled flag to true on a published game THEN the System SHALL exclude that game from the Public Registry immediately
2. WHEN the disabled flag is toggled THEN the System SHALL regenerate and upload the Public Registry to GCS within the same request
3. WHEN a game has disabled set to true THEN the System SHALL exclude it from the Public Registry regardless of its published status
4. WHEN the disabled flag is changed THEN the System SHALL record the action in the audit log with actor, timestamp, and reason

### Requirement 4

**User Story:** As an Admin, I want to control the rollout percentage for newly published games, so that I can gradually release updates to a subset of users.

#### Acceptance Criteria

1. WHEN an Admin publishes a game THEN the System SHALL allow setting a rolloutPercentage value between 0 and 100
2. WHEN the rolloutPercentage is set THEN the System SHALL include this value in the Public Registry entry for that game
3. WHEN rolloutPercentage is not specified THEN the System SHALL default to 100 (full rollout)
4. WHEN an Admin updates the rolloutPercentage THEN the System SHALL regenerate the Public Registry with the new value

### Requirement 5

**User Story:** As an Admin, I want to set a specific version as the live version, so that I can control which version students see without affecting the latest development version.

#### Acceptance Criteria

1. WHEN an Admin sets a version as live THEN the System SHALL update the game's liveVersionId reference in MongoDB
2. WHEN setting a live version THEN the System SHALL verify that the target version has status "published"
3. WHEN the live version is changed THEN the System SHALL update the entryUrl in the Public Registry to point to the new version's index.html
4. WHEN a rollback is requested THEN the System SHALL allow setting any previously published version as the new live version
5. WHEN the live version is updated THEN the System SHALL record the change in the audit log with old and new version information

### Requirement 6

**User Story:** As a Developer, I want an API endpoint to fetch the Public Registry, so that Game Hub can retrieve the list of available games.

#### Acceptance Criteria

1. WHEN Game Hub requests the public games list THEN the System SHALL return only games from the Public Registry
2. WHEN the API is called THEN the System SHALL apply status lock filtering to exclude any game where status is not "published"
3. WHEN the API is called THEN the System SHALL apply disabled switch filtering to exclude any game where disabled is true
4. WHEN returning game entries THEN the System SHALL include id, title, entryUrl, iconUrl, capabilities, runtime, rolloutPercentage, and version fields
5. WHEN the API response is generated THEN the System SHALL set appropriate CORS headers to allow Game Hub domain access

### Requirement 7

**User Story:** As a System, I want to archive published games, so that Admins can remove games from public view while preserving their data.

#### Acceptance Criteria

1. WHEN an Admin archives a published game THEN the System SHALL change the version status from "published" to "archived"
2. WHEN a game is archived THEN the System SHALL remove it from the Public Registry
3. WHEN a game is archived THEN the System SHALL preserve all game data and version history in MongoDB
4. WHEN an archived game is republished THEN the System SHALL restore it to the Public Registry with its previous configuration
5. WHEN archiving a game THEN the System SHALL record the action in the audit log

