# Design Document: Audit Logging System

## Overview

Hệ thống Audit Logging ghi lại toàn bộ các hành động làm thay đổi trạng thái trong Game Hub Manager. Hệ thống được thiết kế để:
- Ghi log bất đồng bộ để không ảnh hưởng đến performance của main operations
- Tích hợp với MongoDB hiện có và hệ thống xác thực middleware
- Cung cấp giao diện admin để xem và lọc logs
- Tự động cleanup logs cũ qua TTL index

## Architecture

```mermaid
flowchart TB
    subgraph "API Layer"
        A1[upload.ts]
        A2[upload-zip.ts]
        A3[approve.ts]
        A4[reject.ts]
        A5[delete.ts]
        A6[Other APIs]
    end
    
    subgraph "Audit Service"
        AL[AuditLogger]
        AL --> |async insert| DB[(audit_logs)]
    end
    
    subgraph "Admin UI"
        UI[/console/audit-logs]
        UI --> |query| AL
    end
    
    A1 --> |log| AL
    A2 --> |log| AL
    A3 --> |log| AL
    A4 --> |log| AL
    A5 --> |log| AL
    A6 --> |log| AL
```

## Components and Interfaces

### 1. AuditLogEntry Type (`src/lib/audit-types.ts`)

```typescript
export type ActionType = 
  | 'GAME_UPLOAD' 
  | 'GAME_UPDATE_METADATA' 
  | 'GAME_DELETE_VERSION' 
  | 'GAME_DELETE_FULL'
  | 'GAME_STATUS_CHANGE'
  | 'USER_LOGIN'
  | 'USER_LOGOUT';

export type TargetEntity = 'GAME' | 'USER' | 'SYSTEM';

export interface AuditActor {
  userId: string;
  email: string;
  role: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditTarget {
  entity: TargetEntity;
  id: string;
  subId?: string;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogEntry {
  _id?: string;
  actor: AuditActor;
  action: ActionType;
  target: AuditTarget;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### 2. AuditLogger Service (`src/lib/audit.ts`)

```typescript
interface LogParams {
  actor: {
    user: User;
    ip?: string;
    userAgent?: string;
  };
  action: ActionType;
  target: AuditTarget;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
}

interface AuditLogFilter {
  userId?: string;
  action?: ActionType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const AuditLogger = {
  log(params: LogParams): Promise<void>;
  getLogs(filter: AuditLogFilter, limit?: number, skip?: number): Promise<AuditLogEntry[]>;
  getLogsCount(filter: AuditLogFilter): Promise<number>;
  ensureIndexes(): Promise<void>;
}
```

### 3. Permission Extension (`src/auth/auth-rbac.ts`)

Thêm permission mới:
```typescript
export type Permission = 
  | ... existing permissions ...
  | 'system:audit_view';

// Update ROLE_PERMISSIONS
admin: [..., 'system:audit_view'],
cto: [..., 'system:audit_view'],
```

### 4. Admin UI Page (`src/pages/console/audit-logs.astro`)

- Sử dụng ConsoleLayout hiện có
- Bảng hiển thị logs với pagination
- Bộ lọc: User, Action Type, Date Range, Game ID
- Chỉ accessible với permission `system:audit_view`

## Data Models

### MongoDB Collection: `audit_logs`

```javascript
{
  _id: ObjectId,
  actor: {
    userId: String,      // User._id
    email: String,       // User.email
    role: String,        // Primary role at time of action
    ip: String,          // Client IP
    userAgent: String    // Browser/client info
  },
  action: String,        // ActionType enum
  target: {
    entity: String,      // 'GAME' | 'USER' | 'SYSTEM'
    id: String,          // e.g., game ID
    subId: String        // e.g., version number
  },
  changes: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],
  metadata: Object,      // Additional context
  createdAt: Date        // Timestamp
}
```

### Indexes

```javascript
// Query by game
{ "target.id": 1 }

// Query by user
{ "actor.userId": 1 }

// Sort by time (most common)
{ "createdAt": -1 }

// TTL: Auto-delete after 90 days
{ "createdAt": 1 }, { expireAfterSeconds: 7776000 }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Audit Log Entry Completeness
*For any* audit log entry created by AuditLogger.log(), the entry SHALL contain non-empty actor.userId, actor.email, actor.role, action, target.entity, target.id, and createdAt fields.
**Validates: Requirements 1.1, 1.2**

### Property 2: Serialization Round-Trip
*For any* valid AuditLogEntry object, serializing to JSON and deserializing back SHALL produce an equivalent object with all fields preserved.
**Validates: Requirements 1.4, 1.5**

### Property 3: Error Isolation
*For any* AuditLogger.log() call that encounters a database error, the error SHALL be caught and logged without throwing an exception to the caller.
**Validates: Requirements 1.3**

### Property 4: Status Change Tracking
*For any* GAME_STATUS_CHANGE audit log entry, the changes array SHALL contain at least one entry with field='status', and both oldValue and newValue SHALL be non-null.
**Validates: Requirements 3.1, 3.3**

### Property 5: Deletion Tracking
*For any* GAME_DELETE_VERSION or GAME_DELETE_FULL audit log entry, the target.id SHALL be non-empty, and for GAME_DELETE_VERSION, target.subId SHALL also be non-empty.
**Validates: Requirements 4.1, 4.2**

### Property 6: Query Pagination
*For any* getLogs() call with limit N and skip M, the returned array length SHALL be at most N, and results SHALL be sorted by createdAt descending.
**Validates: Requirements 5.1**

### Property 7: Filter Correctness
*For any* getLogs() call with a filter, all returned entries SHALL match the filter criteria (userId matches actor.userId, action matches action, targetId matches target.id, dates within range).
**Validates: Requirements 5.3**

### Property 8: Permission Enforcement
*For any* user without 'system:audit_view' permission accessing /console/audit-logs, the system SHALL return a 403 Forbidden response.
**Validates: Requirements 5.4**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| MongoDB connection failure during log | Catch error, console.error, continue main operation |
| Invalid actor data | Validate before insert, use defaults for optional fields |
| Query timeout | Set reasonable timeout, return partial results with warning |
| Missing required fields | Throw validation error before insert |

## Testing Strategy

### Property-Based Testing Library
- **Library**: fast-check (TypeScript/JavaScript)
- **Minimum iterations**: 100 per property test

### Unit Tests
- AuditLogger.log() creates valid entries
- AuditLogger.getLogs() returns filtered results
- Permission check for audit page access
- Integration with existing API endpoints

### Property-Based Tests
Each correctness property will be implemented as a property-based test:

1. **Property 1 Test**: Generate random LogParams, call log(), verify entry completeness
2. **Property 2 Test**: Generate random AuditLogEntry, serialize/deserialize, verify equality
3. **Property 3 Test**: Mock database failure, call log(), verify no exception thrown
4. **Property 4 Test**: Generate status change logs, verify changes array structure
5. **Property 5 Test**: Generate deletion logs, verify target fields
6. **Property 6 Test**: Generate logs, query with various limit/skip, verify pagination
7. **Property 7 Test**: Generate logs with various attributes, query with filters, verify matches
8. **Property 8 Test**: Generate users with/without permission, verify access control

### Test Annotations
All property-based tests will be annotated with:
```typescript
// **Feature: audit-logging, Property {N}: {property_text}**
// **Validates: Requirements X.Y**
```
