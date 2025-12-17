# Implementation Plan

- [x] 1. Create Page Permission Mapping




  - [ ] 1.1 Create `src/lib/page-permissions.ts`
    - Define PagePermissionConfig type
    - Create PAGE_PERMISSIONS array with route-to-permission mappings
    - Implement getRequiredPermission(pathname) function


    - Implement checkPageAccess(user, pathname) function




    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 1.2 Write property test for permission check determinism
    - **Property 3: Permission Check Determinism**
    - **Validates: Requirements 3.4**







- [ ] 2. Create 403 Forbidden Page
  - [x] 2.1 Create `src/pages/403.astro`



    - Display "Bạn không có quyền truy cập trang này" message
    - Show user's current role information
    - Add button to return to Dashboard (/console)

    - Style consistent with ConsoleLayout
    - _Requirements: 1.1, 1.2, 1.3_


  - [x] 2.2 Write property test for 403 page shows user role

    - **Property 2: 403 Page Shows User Role**
    - **Validates: Requirements 1.3**


- [x] 3. Extend Astro Locals Type Definition

  - [ ] 3.1 Update `src/env.d.ts`
    - Add permissions array to Locals interface



    - Ensure user type is properly defined

    - _Requirements: 3.3, 4.1_


- [x] 4. Enhance Middleware with Permission Check





  - [ ] 4.1 Update `src/middleware.ts`
    - Import page-permissions module
    - Add permission check after session validation

    - Return 403 page response when permission denied
    - Attach user and permissions to Astro locals

    - Update redirect to include return URL query parameter


    - _Requirements: 3.1, 3.2, 3.3, 5.1_

  - [x] 4.2 Write property test for unauthorized access returns 403

    - **Property 1: Unauthorized Access Returns 403**
    - **Validates: Requirements 1.1, 3.2**




  - [ ] 4.3 Write property test for middleware attaches user and permissions
    - **Property 4: Middleware Attaches User and Permissions**

    - **Validates: Requirements 3.3, 4.1**

  - [x] 4.4 Write property test for unauthenticated redirect includes return URL

    - **Property 7: Unauthenticated Redirect Includes Return URL**

    - **Validates: Requirements 5.1**



- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Permission Injection
  - [ ] 6.1 Create permission injection helper
    - Create getUserPermissions function that returns all permissions for a user
    - Ensure permissions are computed from all user roles
    - _Requirements: 4.2_
  - [ ] 6.2 Write property test for all user permissions injected
    - **Property 5: All User Permissions Injected**
    - **Validates: Requirements 4.2**

- [ ] 7. Create Client Permission Helper
  - [ ] 7.1 Create client-side permission helper
    - Create can(permission) function for client-side checks
    - Ensure helper is available in page context
    - _Requirements: 4.3_
  - [ ] 7.2 Write property test for client permission helper consistency
    - **Property 6: Client Permission Helper Consistency**
    - **Validates: Requirements 4.3**

- [ ] 8. Update Login Page for Redirect
  - [ ] 8.1 Update `src/pages/login.astro`
    - Read redirect query parameter
    - After successful login, redirect to the URL in parameter
    - Default to /console if parameter missing or invalid
    - _Requirements: 5.2, 5.3_
  - [ ] 8.2 Write property test for post-login redirect honors parameter
    - **Property 8: Post-Login Redirect Honors Parameter**
    - **Validates: Requirements 5.2**

- [ ] 9. Remove Duplicate Permission Checks from Pages
  - [ ] 9.1 Update `src/pages/console/qc-inbox.astro`
    - Remove manual role check (now handled by middleware)
    - Use locals.user and locals.permissions
    - _Requirements: 3.1_
  - [ ] 9.2 Update `src/pages/console/approval.astro`
    - Remove manual role check (now handled by middleware)
    - Use locals.user and locals.permissions
    - _Requirements: 3.1_
  - [ ] 9.3 Update `src/pages/console/publish.astro`
    - Remove manual role check (now handled by middleware)
    - Use locals.user and locals.permissions
    - _Requirements: 3.1_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
