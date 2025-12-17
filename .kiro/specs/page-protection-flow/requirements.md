# Requirements Document

## Introduction

Hệ thống Page Protection Flow cho Game Hub Manager Console, triển khai bảo vệ trang theo role với 403 Forbidden page, centralized permission check trong middleware, và inject permissions xuống client để UI rendering. Hệ thống này bổ sung cho RBAC Auth System đã có.

## Glossary

- **Game Hub System**: Hệ thống quản lý mini-game giáo dục
- **Protected Page**: Trang yêu cầu đăng nhập và có thể yêu cầu permission cụ thể
- **403 Forbidden Page**: Trang hiển thị khi user không có quyền truy cập
- **RBAC Permission**: Permission string dạng "resource:action" (ví dụ: "games:review")
- **Page Permission Mapping**: Ánh xạ từ route pattern đến permission yêu cầu
- **Client Permissions**: Danh sách permissions được inject xuống client để UI rendering

## Requirements

### Requirement 1: 403 Forbidden Page

**User Story:** As a user, I want to see a clear 403 Forbidden page when I don't have permission to access a page, so that I understand why I cannot access the resource.

#### Acceptance Criteria

1. WHEN a logged-in user accesses a page without required permission THEN the Game Hub System SHALL display a 403 Forbidden page with message "Bạn không có quyền truy cập trang này"
2. WHEN the 403 page is displayed THEN the Game Hub System SHALL show a button to return to Dashboard
3. WHEN the 403 page is displayed THEN the Game Hub System SHALL show the user's current role information

### Requirement 2: Page Permission Mapping

**User Story:** As a system administrator, I want to define permission requirements for each protected page, so that access control is centralized and consistent.

#### Acceptance Criteria

1. WHEN configuring page permissions THEN the Game Hub System SHALL map "/console/qc-inbox" to require "games:review" permission
2. WHEN configuring page permissions THEN the Game Hub System SHALL map "/console/approval" to require "games:approve" permission
3. WHEN configuring page permissions THEN the Game Hub System SHALL map "/console/publish" to require "games:publish" permission
4. WHEN configuring page permissions THEN the Game Hub System SHALL map "/console/my-games" to require "games:view" permission
5. WHEN configuring page permissions THEN the Game Hub System SHALL map "/console/library" to require "games:view" permission
6. WHEN configuring page permissions THEN the Game Hub System SHALL allow "/console" (dashboard) for any authenticated user

### Requirement 3: Centralized Permission Check in Middleware

**User Story:** As a developer, I want permission checks to be centralized in middleware, so that I don't need to duplicate permission logic in each page.

#### Acceptance Criteria

1. WHEN a request is made to a protected page THEN the Game Hub System SHALL check user permissions in middleware before rendering the page
2. WHEN a user lacks required permission for a page THEN the Game Hub System SHALL return a 403 response instead of redirecting
3. WHEN permission check passes THEN the Game Hub System SHALL attach user and permissions to Astro locals
4. WHEN serializing the permission check result THEN the Game Hub System SHALL produce consistent results for the same user and route

### Requirement 4: Client Permission Injection

**User Story:** As a frontend developer, I want user permissions injected into the client, so that I can show/hide UI elements based on user capabilities.

#### Acceptance Criteria

1. WHEN rendering a protected page THEN the Game Hub System SHALL inject user permissions array into the page context
2. WHEN permissions are injected THEN the Game Hub System SHALL include all RBAC permission strings the user has
3. WHEN the client needs to check a permission THEN the Game Hub System SHALL provide a helper function to check if user has a specific permission

### Requirement 5: Login Redirect with Return URL

**User Story:** As a user, I want to be redirected back to my original destination after login, so that I don't lose my navigation context.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses a protected page THEN the Game Hub System SHALL redirect to "/login" with a "redirect" query parameter containing the original URL
2. WHEN a user successfully logs in with a redirect parameter THEN the Game Hub System SHALL redirect to the URL specified in the redirect parameter
3. WHEN the redirect parameter is missing or invalid THEN the Game Hub System SHALL redirect to "/console" after login

