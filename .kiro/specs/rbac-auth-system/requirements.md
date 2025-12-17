# Requirements Document

## Introduction

Hệ thống RBAC (Role-Based Access Control) cho Game Hub Manager, triển khai workflow quản lý game: Dev upload → QC test → CTO/CEO review → Admin publish. Hệ thống bao gồm Authentication, Permission system và Dashboard phân quyền theo role.

## Glossary

- **RBAC**: Role-Based Access Control - Hệ thống phân quyền dựa trên vai trò
- **ABAC**: Attribute-Based Access Control - Phân quyền dựa trên thuộc tính của resource
- **Game Hub System**: Hệ thống quản lý mini-game giáo dục
- **Session**: Phiên đăng nhập của user, lưu trong cookie
- **JWT**: JSON Web Token - Token mã hóa thông tin user
- **Role**: Vai trò của user (dev, qc, cto, ceo, admin)
- **GameStatus**: Trạng thái của game trong workflow (draft, uploaded, qc_passed, qc_failed, approved, published, archived)

## Requirements

### Requirement 1: MongoDB Connection

**User Story:** As a developer, I want to connect to MongoDB database, so that I can store and retrieve user and game data persistently.

#### Acceptance Criteria

1. WHEN the application starts THEN the Game Hub System SHALL establish a connection to MongoDB using the IRUKA_MONGODB_URI environment variable
2. WHEN multiple requests arrive simultaneously THEN the Game Hub System SHALL reuse the existing MongoDB connection instead of creating new connections
3. WHEN the MongoDB connection fails THEN the Game Hub System SHALL log the error message and prevent the application from serving requests
4. WHEN the MongoDB connection succeeds THEN the Game Hub System SHALL log "[MongoDB] Connected successfully" to the console

### Requirement 2: User Schema

**User Story:** As a system administrator, I want to define a User schema, so that I can store user information with their roles.

#### Acceptance Criteria

1. WHEN a new user is created THEN the Game Hub System SHALL require an email field that is unique and non-empty
2. WHEN a new user is created without specifying a role THEN the Game Hub System SHALL assign the default role "dev"
3. WHEN storing a user THEN the Game Hub System SHALL validate that the role is one of: dev, qc, cto, ceo, admin
4. WHEN a user document is retrieved THEN the Game Hub System SHALL return id, email, name, roles array, avatar, and teamIds fields

### Requirement 3: Game Schema

**User Story:** As a developer, I want to define a Game schema, so that I can store game information with workflow status.

#### Acceptance Criteria

1. WHEN a new game is created THEN the Game Hub System SHALL require a unique gameId and ownerId field
2. WHEN a new game is created THEN the Game Hub System SHALL set the initial status to "draft"
3. WHEN storing a game THEN the Game Hub System SHALL validate that status is one of: draft, uploaded, qc_passed, qc_failed, approved, published, archived
4. WHEN a game document is retrieved THEN the Game Hub System SHALL return id, gameId, title, ownerId, teamId, status, and isDeleted fields
5. WHEN serializing a game to JSON THEN the Game Hub System SHALL produce valid JSON that can be deserialized back to an equivalent game object

### Requirement 4: User Authentication

**User Story:** As a user, I want to log in to the system, so that I can access features based on my role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials to the login endpoint THEN the Game Hub System SHALL create a session containing userId, email, and roles
2. WHEN a session is created THEN the Game Hub System SHALL set an HTTP-only cookie named "iruka_session" with the session token
3. WHEN a user accesses the /api/auth/me endpoint with a valid session THEN the Game Hub System SHALL return the current user information as JSON
4. WHEN a user accesses the /api/auth/logout endpoint THEN the Game Hub System SHALL clear the session cookie and redirect to the login page

### Requirement 5: Session Middleware

**User Story:** As a system administrator, I want to protect routes with session validation, so that only authenticated users can access protected resources.

#### Acceptance Criteria

1. WHEN a request is made to /dashboard/* without a valid session THEN the Game Hub System SHALL redirect the request to /login
2. WHEN a request is made to /api/games/* without a valid session THEN the Game Hub System SHALL return a 401 Unauthorized response
3. WHEN a request is made with a valid session THEN the Game Hub System SHALL attach the user object to Astro locals for downstream handlers
4. WHEN a session token is expired or invalid THEN the Game Hub System SHALL treat it as unauthenticated and clear the cookie

### Requirement 6: Permission System (ABAC)

**User Story:** As a system architect, I want to implement attribute-based permission checks, so that access control considers both role and resource attributes.

#### Acceptance Criteria

1. WHEN checking permission for a dev user on their own game THEN the Game Hub System SHALL allow view, create, update, and submit actions based on game status
2. WHEN checking permission for a qc user THEN the Game Hub System SHALL allow view and review actions only for games with status "uploaded"
3. WHEN checking permission for a cto or ceo user THEN the Game Hub System SHALL allow view and approve actions only for games with status "qc_passed"
4. WHEN checking permission for an admin user THEN the Game Hub System SHALL allow view, update, and publish actions for games with appropriate status
5. WHEN a dev user attempts to update a game they do not own THEN the Game Hub System SHALL deny the action
6. WHEN serializing permission check results THEN the Game Hub System SHALL produce consistent boolean outputs for the same inputs

### Requirement 7: Permission System (RBAC String)

**User Story:** As a frontend developer, I want simple role-based permission checks, so that I can show/hide UI elements based on user capabilities.

#### Acceptance Criteria

1. WHEN checking if a user has a permission string THEN the Game Hub System SHALL return true if any of the user's roles include that permission
2. WHEN a dev user checks for "games:create" permission THEN the Game Hub System SHALL return true
3. WHEN a qc user checks for "games:publish" permission THEN the Game Hub System SHALL return false
4. WHEN an admin user checks for any games permission THEN the Game Hub System SHALL return true

### Requirement 8: Dashboard View by Role

**User Story:** As a user, I want to see a dashboard customized for my role, so that I can access relevant features and data.

#### Acceptance Criteria

1. WHEN a dev user accesses the dashboard THEN the Game Hub System SHALL display their own games and an "Upload New Game" button
2. WHEN a qc user accesses the dashboard THEN the Game Hub System SHALL display games with status "uploaded" in a review queue
3. WHEN a cto or ceo user accesses the dashboard THEN the Game Hub System SHALL display games with status "qc_passed" awaiting approval
4. WHEN an admin user accesses the dashboard THEN the Game Hub System SHALL display all games with system statistics

### Requirement 9: Game List API by Role

**User Story:** As a frontend developer, I want an API that returns games filtered by user role, so that the dashboard shows appropriate data.

#### Acceptance Criteria

1. WHEN a dev user calls GET /api/games/list THEN the Game Hub System SHALL return only games where ownerId matches the user's id
2. WHEN a qc user calls GET /api/games/list THEN the Game Hub System SHALL return games with status "uploaded"
3. WHEN a cto or ceo user calls GET /api/games/list THEN the Game Hub System SHALL return games with status "qc_passed"
4. WHEN an admin user calls GET /api/games/list THEN the Game Hub System SHALL return all games

### Requirement 10: Seed Users Script

**User Story:** As a developer, I want a script to create test users, so that I can test the system with different roles.

#### Acceptance Criteria

1. WHEN the seed script runs THEN the Game Hub System SHALL create users with emails: dev@iruka.com, qc@iruka.com, cto@iruka.com, ceo@iruka.com, admin@iruka.com
2. WHEN a user already exists with the same email THEN the Game Hub System SHALL skip creating that user
3. WHEN the seed script completes THEN the Game Hub System SHALL log the number of users created and skipped
