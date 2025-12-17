# Requirements Document

## Introduction

Hệ thống Audit Logging cho Game Hub Manager ghi lại toàn bộ các hành động làm thay đổi trạng thái hệ thống (Write Operations). Mục tiêu là trả lời 5 câu hỏi: Who (ai thực hiện), When (khi nào), What (hành động gì), Which (đối tượng nào), và How (chi tiết thay đổi). Hệ thống tận dụng hạ tầng MongoDB và xác thực người dùng hiện có.

## Glossary

- **Audit Log**: Bản ghi lưu trữ thông tin về một hành động trong hệ thống
- **Actor**: Người thực hiện hành động (User ID, Email, Role, IP, User Agent)
- **Action Type**: Loại hành động được thực hiện (GAME_UPLOAD, GAME_STATUS_CHANGE, etc.)
- **Target**: Đối tượng bị tác động bởi hành động (Game, User, System)
- **Changes**: Chi tiết thay đổi giá trị (field, oldValue, newValue)
- **AuditLogger**: Service trung tâm để ghi và truy vấn audit logs
- **TTL Index**: MongoDB index tự động xóa documents sau một khoảng thời gian

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to record all write operations in the system, so that I can track who did what and when for security and compliance purposes.

#### Acceptance Criteria

1. WHEN a user performs a write operation (upload, update, delete, status change) THEN the AuditLogger SHALL create an audit log entry containing actor information, action type, target entity, and timestamp
2. WHEN creating an audit log entry THEN the AuditLogger SHALL capture the actor's userId, email, role, IP address, and user agent
3. WHEN the audit logging operation fails THEN the AuditLogger SHALL log the error to console without interrupting the main operation
4. WHEN storing audit log entries THEN the AuditLogger SHALL serialize the entry to JSON format for MongoDB storage
5. WHEN retrieving audit log entries THEN the AuditLogger SHALL deserialize the JSON data back to the original AuditLogEntry structure

### Requirement 2

**User Story:** As a system administrator, I want to track game upload activities, so that I can monitor content being added to the platform.

#### Acceptance Criteria

1. WHEN a user uploads a game via folder upload THEN the AuditLogger SHALL record a GAME_UPLOAD action with method 'FOLDER_UPLOAD', file count, and root folder
2. WHEN a user uploads a game via ZIP upload THEN the AuditLogger SHALL record a GAME_UPLOAD action with method 'ZIP_UPLOAD', file count, and extracted folder info
3. WHEN recording game upload THEN the AuditLogger SHALL include the game ID and version as target identifiers

### Requirement 3

**User Story:** As a QC manager, I want to track game status changes, so that I can audit the review and approval workflow.

#### Acceptance Criteria

1. WHEN a game status changes (submit, review, approve, reject, publish) THEN the AuditLogger SHALL record a GAME_STATUS_CHANGE action with old and new status values
2. WHEN a game is rejected THEN the AuditLogger SHALL include the rejection reason in the metadata
3. WHEN recording status changes THEN the AuditLogger SHALL capture the changes array with field name, old value, and new value

### Requirement 4

**User Story:** As a system administrator, I want to track game deletion activities, so that I can audit content removal from the platform.

#### Acceptance Criteria

1. WHEN a user deletes a game version THEN the AuditLogger SHALL record a GAME_DELETE_VERSION action with game ID and version
2. WHEN a user deletes an entire game THEN the AuditLogger SHALL record a GAME_DELETE_FULL action with game ID
3. WHEN recording deletion THEN the AuditLogger SHALL include metadata about the trigger reason

### Requirement 5

**User Story:** As a system administrator, I want to view audit logs through an admin interface, so that I can investigate activities and generate reports.

#### Acceptance Criteria

1. WHEN an admin accesses the audit logs page THEN the System SHALL display a paginated table of audit log entries sorted by timestamp descending
2. WHEN displaying audit log entries THEN the System SHALL show timestamp, actor info, action type, target entity, and summary details
3. WHEN filtering audit logs THEN the System SHALL support filtering by user, action type, date range, and game ID
4. WHILE a user lacks the 'system:audit_view' permission THEN the System SHALL deny access to the audit logs page

### Requirement 6

**User Story:** As a system administrator, I want audit logs to be automatically cleaned up, so that storage costs are managed without manual intervention.

#### Acceptance Criteria

1. WHEN configuring the audit_logs collection THEN the System SHALL create indexes on target.id, actor.userId, and createdAt fields
2. WHEN configuring TTL THEN the System SHALL set up automatic deletion of logs older than 90 days
3. WHEN querying audit logs THEN the System SHALL utilize indexes for efficient filtering and sorting

