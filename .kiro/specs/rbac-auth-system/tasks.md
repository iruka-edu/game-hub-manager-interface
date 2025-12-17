# Implementation Plan

- [x] 1. Setup MongoDB Connection






  - [x] 1.1 Create `src/lib/mongodb.ts` with connection caching

    - Implement singleton pattern for MongoDB connection
    - Use IRUKA_MONGODB_URI from environment
    - Add connection logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 1.2 Write property test for connection reuse
    - **Property 1: MongoDB Connection Reuse**
    - **Validates: Requirements 1.2**

- [x] 2. Implement User Model



  - [x] 2.1 Create `src/models/User.ts` with TypeScript types

    - Define Role type and User interface
    - Implement UserRepository with CRUD operations
    - Add email uniqueness validation
    - Add default role assignment
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 2.2 Write property tests for User model
    - **Property 2: User Email Uniqueness**
    - **Property 3: Default Role Assignment**
    - **Property 4: Valid Role Constraint**
    - **Validates: Requirements 2.1, 2.2, 2.3**


- [-] 3. Implement Game Model


  - [x] 3.1 Create `src/models/Game.ts` with TypeScript types

    - Define GameStatus type and Game interface
    - Implement GameRepository with CRUD operations
    - Add default status assignment
    - Add status validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 3.2 Write property tests for Game model
    - **Property 5: Game Default Status**
    - **Property 6: Valid Game Status Constraint**
    - **Property 7: Game Serialization Round Trip**
    - **Validates: Requirements 3.2, 3.3, 3.5**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.


- [x] 5. Implement Session Management

  - [x] 5.1 Create `src/lib/session.ts`


    - Implement JWT-based session creation
    - Implement session verification
    - Add cookie helpers (set/clear)
    - Add getUserFromRequest helper
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 5.2 Write property test for session
    - **Property 8: Session Creation Contains User Info**
    - **Validates: Requirements 4.1, 4.3**

- [x] 6. Implement Authentication APIs



  - [x] 6.1 Create `src/pages/api/auth/login.ts`

    - Accept email for mock login (dev mode)
    - Find user by email in MongoDB
    - Create session and set cookie
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Create `src/pages/api/auth/me.ts`

    - Return current user from session
    - _Requirements: 4.3_

  - [x] 6.3 Create `src/pages/api/auth/logout.ts`

    - Clear session cookie
    - Redirect to login page
    - _Requirements: 4.4_

  - [x] 6.4 Create `src/pages/login.astro`

    - Simple login form with email input
    - Handle login submission
    - _Requirements: 4.1_

- [x] 7. Implement Middleware



  - [x] 7.1 Create `src/middleware.ts`

    - Intercept /dashboard/* and /api/games/* routes
    - Verify session from cookie
    - Redirect to /login if unauthenticated (for pages)
    - Return 401 if unauthenticated (for API)
    - Attach user to Astro locals
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 7.2 Write property tests for middleware
    - **Property 9: Protected Route Redirect**
    - **Property 10: API Route Protection**
    - **Validates: Requirements 5.1, 5.2**


- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement ABAC Permission System


  - [x] 9.1 Create `src/auth/auth-abac.ts`


    - Define Permissions type with games resource
    - Implement ROLES object with permission rules per role
    - Implement hasPermission function
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [ ]* 9.2 Write property tests for ABAC
    - **Property 11: Dev Permission - Own Game Only**
    - **Property 12: Dev Permission - Status Constraint**
    - **Property 13: QC Permission - Review Constraint**
    - **Property 14: CTO/CEO Permission - Approve Constraint**
    - **Property 15: Admin Permission - Publish Constraint**
    - **Property 16: Permission Check Determinism**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 10. Implement RBAC Permission System


  - [x] 10.1 Create `src/auth/auth-rbac.ts`


    - Define Permission type as string union
    - Define ROLE_PERMISSIONS mapping
    - Implement hasPermissionString function
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 10.2 Write property tests for RBAC
    - **Property 17: RBAC String Permission Check**
    - **Property 18: Admin Has All Permissions**
    - **Validates: Requirements 7.1, 7.4**


- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Game List API


  - [x] 12.1 Create `src/pages/api/games/list.ts`


    - Get user from Astro locals
    - Filter games based on user role
    - Return filtered game list as JSON
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ]* 12.2 Write property tests for Game List API
    - **Property 19: Game List API - Dev Filter**
    - **Property 20: Game List API - QC Filter**
    - **Property 21: Game List API - CTO/CEO Filter**
    - **Property 22: Game List API - Admin No Filter**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 13. Implement Dashboard


  - [x] 13.1 Create `src/pages/dashboard/index.astro`


    - Get user from Astro locals
    - Fetch games from /api/games/list
    - Render different UI based on user role
    - Dev: Show own games + Upload button
    - QC: Show review queue
    - CTO/CEO: Show approval queue
    - Admin: Show all games + stats
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 14. Create Seed Script


  - [x] 14.1 Create `scripts/seed-users.ts`


    - Connect to MongoDB
    - Create 5 test users (dev, qc, cto, ceo, admin)
    - Skip existing users
    - Log results
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ]* 14.2 Write property test for seed idempotence
    - **Property 23: Seed Script Idempotence**
    - **Validates: Requirements 10.2**


- [x] 15. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
