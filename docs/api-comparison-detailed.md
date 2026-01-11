# So sánh chi tiết API Backend - Vũ vs Tôi

> **Ngày phân tích**: 2026-01-10  
> **Nguồn**:
>
> - Backend Vũ: [docs/interface/BE_vu.json](file:///d:/Web/game-hub-manager-interface/docs/interface/BE_vu.json)
> - Backend tôi: [api-spec.yaml](file:///d:/Web/game-hub-manager-interface/api-spec.yaml)

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [APIs thiếu ở Backend tôi](#apis-thiếu-ở-backend-tôi)
3. [APIs thừa ở Backend tôi](#apis-thừa-ở-backend-tôi)
4. [APIs tương đương](#apis-tương-đương)
5. [Khuyến nghị triển khai](#khuyến-nghị-triển-khai)

---

## Tổng quan

### Backend của Vũ (BE_vu.json)

```yaml
Base URL: /api/v1/
Format: OpenAPI 3.0 (JSON)
Tags:
  - Game Lessons (12 endpoints)
  - Games (8 endpoints)
Total Endpoints: 20
```

### Backend của tôi (api-spec.yaml)

```yaml
Base URL: /api/
Format: OpenAPI 3.0 (YAML)
Tags:
  - Auth (3 endpoints)
  - Games (17 endpoints)
  - Users (4 endpoints)
  - System (4 endpoints)
  - QC (1 endpoint)
  - GCS (1 endpoint)
Total Endpoints: 29
```

---

## APIs thiếu ở Backend tôi

### 🎓 Module 1: Game Lessons (12 endpoints)

> [!IMPORTANT]
> Module này quản lý toàn bộ cấu trúc learning path: Subjects → Age Bands → Courses → Tracks → Units → Lessons, cùng với Skills, Levels, Themes

#### 1.1. Get Subjects

```http
GET /api/v1/game-lessons/subjects
```

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string"
  }
]
```

**Mô tả**: Lấy danh sách tất cả môn học (Math, English, Science, etc.)

---

#### 1.2. Get Age Bands

```http
GET /api/v1/game-lessons/age-bands
```

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "min_age": "integer",
    "max_age": "integer"
  }
]
```

**Mô tả**: Lấy danh sách các nhóm tuổi (3-5, 6-8, 9-11, etc.)

---

#### 1.3. Get Courses by Subject and Age Band

```http
GET /api/v1/game-lessons/courses/{subject_id}/{age_band_id}
```

**Path Parameters:**

- `subject_id` (string, required): ID của môn học
- `age_band_id` (string, required): ID của nhóm tuổi

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "subject_id": "string",
    "age_band_id": "string",
    "description": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách khóa học theo môn học và độ tuổi

---

#### 1.4. Get Tracks by Subject and Age Band (Query)

```http
GET /api/v1/game-lessons/tracks?subject_id={subject_id}&age_band_id={age_band_id}
```

**Query Parameters:**

- `subject_id` (string, required): ID của môn học
- `age_band_id` (string, required): ID của nhóm tuổi

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "course_id": "string",
    "order": "integer",
    "description": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách tracks theo subject và age band (dùng query params)

---

#### 1.5. Get Tracks by Course

```http
GET /api/v1/game-lessons/tracks/{course_id}
```

**Path Parameters:**

- `course_id` (string, required): ID của khóa học

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "course_id": "string",
    "order": "integer",
    "description": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách tracks theo course_id

---

#### 1.6. Get Units by Track

```http
GET /api/v1/game-lessons/units/{track_id}
```

**Path Parameters:**

- `track_id` (string, required): ID của track

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "track_id": "string",
    "order": "integer",
    "description": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách units trong một track

---

#### 1.7. Get Lessons by Track (Query)

```http
GET /api/v1/game-lessons/lessons?track_id={track_id}
```

**Query Parameters:**

- `track_id` (string, required): ID của track

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "unit_id": "string",
    "track_id": "string",
    "order": "integer",
    "description": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách lessons theo track (dùng query param)

---

#### 1.8. Get Lessons by Unit

```http
GET /api/v1/game-lessons/lessons/{unit_id}
```

**Path Parameters:**

- `unit_id` (string, required): ID của unit

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "unit_id": "string",
    "order": "integer",
    "description": "string",
    "skills": ["string"],
    "level": "string",
    "theme": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách lessons trong một unit

---

#### 1.9. Get All Skills

```http
GET /api/v1/game-lessons/skills
```

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "subject_id": "string"
  }
]
```

**Mô tả**: Lấy danh sách tất cả skills

---

#### 1.10. Get Skills by Age Band and Subject

```http
GET /api/v1/game-lessons/skills/filter?age_band_id={age_band_id}&subject_id={subject_id}
```

**Query Parameters:**

- `age_band_id` (string, required): ID của nhóm tuổi
- `subject_id` (string, required): ID của môn học

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "subject_id": "string",
    "age_band_id": "string"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lọc skills theo age band và subject

---

#### 1.11. Get Levels

```http
GET /api/v1/game-lessons/levels
```

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "order": "integer",
    "description": "string"
  }
]
```

**Mô tả**: Lấy danh sách các levels (Easy, Medium, Hard, etc.)

---

#### 1.12. Get Themes

```http
GET /api/v1/game-lessons/themes
```

**Response 200:**

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "icon": "string"
  }
]
```

**Mô tả**: Lấy danh sách themes cho games

---

### 🎮 Module 2: Game Sessions (4 endpoints)

> [!WARNING]
> Module này quản lý phiên chơi game của học sinh - quan trọng cho tracking progress và analytics

#### 2.1. Assign Session

```http
POST /api/v1/games/session/assign
```

**Request Body:**

```json
{
  "child_id": "string",
  "lesson_id": "string",
  "game_id": "string",
  "game_version": "string",
  "assigned_by": "string"
}
```

**Response 200:**

```json
{
  "session_id": "string",
  "child_id": "string",
  "lesson_id": "string",
  "game_id": "string",
  "game_version": "string",
  "status": "assigned",
  "assigned_at": "2026-01-10T13:33:02Z"
}
```

**Response 422:** Validation Error

**Mô tả**: Assign một game session cho học sinh

---

#### 2.2. Get Open Session

```http
GET /api/v1/games/session/open?child_id={child_id}&lesson_id={lesson_id}&game_id={game_id}&game_version={game_version}
```

**Query Parameters:**

- `child_id` (string, required): ID của học sinh
- `lesson_id` (string, required): ID của lesson
- `game_id` (string, required): ID của game
- `game_version` (string, required): Version của game

**Response 200:**

```json
{
  "session_id": "string",
  "child_id": "string",
  "lesson_id": "string",
  "game_id": "string",
  "game_version": "string",
  "status": "in_progress",
  "started_at": "2026-01-10T13:33:02Z",
  "progress": {
    "current_level": 1,
    "score": 0
  }
}
```

**Response 422:** Validation Error

**Mô tả**: Lấy session đang mở (in-progress) của học sinh

---

#### 2.3. Submit Session

```http
POST /api/v1/games/session/submit
```

**Request Body:**

```json
{
  "session_id": "string",
  "child_id": "string",
  "lesson_id": "string",
  "game_id": "string",
  "result": {
    "score": 100,
    "stars": 3,
    "completed": true,
    "time_spent": 300,
    "answers": []
  }
}
```

**Response 200:**

```json
{
  "session_id": "string",
  "status": "completed",
  "submitted_at": "2026-01-10T13:33:02Z",
  "result": {
    "score": 100,
    "stars": 3,
    "completed": true
  }
}
```

**Response 422:** Validation Error

**Mô tả**: Submit kết quả game session

---

#### 2.4. Get Session

```http
GET /api/v1/games/session/{session_id}
```

**Path Parameters:**

- `session_id` (string, required): ID của session

**Response 200:**

```json
{
  "session_id": "string",
  "child_id": "string",
  "lesson_id": "string",
  "game_id": "string",
  "game_version": "string",
  "status": "completed",
  "assigned_at": "2026-01-10T13:00:00Z",
  "started_at": "2026-01-10T13:05:00Z",
  "completed_at": "2026-01-10T13:10:00Z",
  "result": {
    "score": 100,
    "stars": 3
  }
}
```

**Response 422:** Validation Error

**Mô tả**: Lấy thông tin chi tiết của một session

---

### 🎯 Module 3: Game Management - APIs thiếu (4 endpoints)

#### 3.1. Get Games by Lesson

```http
GET /api/v1/games/by_lesson/{lesson_id}
```

**Path Parameters:**

- `lesson_id` (string, required): ID của lesson

**Response 200:**

```json
[
  {
    "id": "string",
    "game_id": "string",
    "title": "string",
    "description": "string",
    "thumbnail": "string",
    "version": "string",
    "status": "published"
  }
]
```

**Response 422:** Validation Error

**Mô tả**: Lấy danh sách games được gán cho một lesson

**Tương đương ở backend tôi**: ❌ THIẾU

---

#### 3.2. Create Game Version

```http
POST /api/v1/games/{game_id}/versions
```

**Path Parameters:**

- `game_id` (string, required): ID của game

**Request Body:**

```json
{
  "version": "1.0.1",
  "storage_path": "string",
  "entry_file": "index.html",
  "changelog": "string"
}
```

**Response 200:**

```json
{
  "id": "string",
  "game_id": "string",
  "version": "1.0.1",
  "status": "draft",
  "created_at": "2026-01-10T13:33:02Z"
}
```

**Response 422:** Validation Error

**Mô tả**: Tạo version mới cho game

**Tương đương ở backend tôi**: Có logic trong `/api/upload-zip` nhưng không có endpoint riêng

---

#### 3.3. Update Game Version

```http
PUT /api/v1/games/{game_id}/versions/{version}
```

**Path Parameters:**

- `game_id` (string, required): ID của game
- `version` (string, required): Version string (e.g., "1.0.1")

**Request Body:**

```json
{
  "status": "published",
  "storage_path": "string",
  "entry_file": "index.html",
  "changelog": "string"
}
```

**Response 200:**

```json
{
  "id": "string",
  "game_id": "string",
  "version": "1.0.1",
  "status": "published",
  "updated_at": "2026-01-10T13:33:02Z"
}
```

**Response 422:** Validation Error

**Mô tả**: Cập nhật thông tin version

**Tương đương ở backend tôi**: ❌ THIẾU (có `/api/games/{id}/publish` nhưng khác logic)

---

#### 3.4. Delete Game Version

```http
DELETE /api/v1/games/{game_id}/versions/{version}
```

**Path Parameters:**

- `game_id` (string, required): ID của game
- `version` (string, required): Version string

**Response 200:**

```json
{
  "id": "string",
  "game_id": "string",
  "version": "1.0.1",
  "deleted": true,
  "deleted_at": "2026-01-10T13:33:02Z"
}
```

**Response 422:** Validation Error

**Mô tả**: Xóa một version

**Tương đương ở backend tôi**: ❌ THIẾU

---

## APIs thừa ở Backend tôi

### 🔐 Module 1: Authentication (3 endpoints)

> [!NOTE]
> Backend Vũ không có module Authentication - có thể họ dùng external auth service hoặc middleware

#### 1.1. Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**

```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "roles": ["dev", "qc"]
  }
}
```

**Response 400:** Email or password required  
**Response 401:** Invalid credentials  
**Response 403:** Account disabled

**Mô tả**: Đăng nhập và set session cookie

---

#### 1.2. Logout

```http
GET /api/auth/logout
POST /api/auth/logout
```

**Response 302:** Redirect to /login

**Mô tả**: Xóa session cookie và redirect về login

---

#### 1.3. Get Current User

```http
GET /api/auth/me
```

**Response 200:**

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "roles": ["dev"],
    "avatar": "string",
    "isActive": true
  }
}
```

**Response 401:** Unauthorized

**Mô tả**: Lấy thông tin user hiện tại

---

### 👥 Module 2: User Management (4 endpoints)

> [!NOTE]
> Backend Vũ không có user management - có thể quản lý users ở service khác

#### 2.1. List Users

```http
GET /api/users
```

**Response 200:**

```json
[
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "roles": ["admin"],
    "isActive": true
  }
]
```

**Mô tả**: Admin/CTO only - Lấy danh sách users

---

#### 2.2. Create User

```http
POST /api/users
```

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "roles": ["dev"]
}
```

**Response 201:** Created

**Mô tả**: Admin/CTO only - Tạo user mới

---

#### 2.3. Update User Status

```http
POST /api/users/{id}/status
```

**Path Parameters:**

- `id` (string, required): User ID

**Request Body:**

```json
{
  "isActive": false
}
```

**Response 200:** OK

**Mô tả**: Enable/disable user account

---

#### 2.4. Reset User Password

```http
POST /api/users/{id}/password
```

**Path Parameters:**

- `id` (string, required): User ID

**Response 200:** OK

**Mô tả**: Reset password cho user

---

### 🎮 Module 3: Game Workflow - APIs đặc thù (13 endpoints)

> [!TIP]
> Đây là các APIs hỗ trợ quy trình phát triển game: Draft → Self-QA → Submit QC → QC Review → Approve → Publish → Set Live

#### 3.1. Upload ZIP

```http
POST /api/upload-zip
```

**Request Body (multipart/form-data):**

- `zipFile` (binary, required): ZIP file chứa game build
- `thumbnailDesktop` (binary, optional): Desktop thumbnail
- `thumbnailMobile` (binary, optional): Mobile thumbnail
- `manifest` (string, required): JSON string của manifest
- `meta` (string, optional): Additional metadata

**Response 200:** OK  
**Response 400:** Missing fields or invalid manifest/ZIP  
**Response 403:** Forbidden

**Mô tả**: Upload game dạng ZIP, validate manifest, tạo/update game và version

---

#### 3.2. Get All Game IDs

```http
GET /api/games/ids
```

**Response 200:**

```json
{
  "ids": ["game-001", "game-002", "game-003"]
}
```

**Mô tả**: Lấy danh sách tất cả game IDs (để check duplicate)

---

#### 3.3. Update Game Metadata

```http
POST /api/games/update-metadata
```

**Request Body:**

```json
{
  "gameId": "game-001",
  "updates": {
    "title": "New Title",
    "description": "New Description"
  }
}
```

**Response 200:** OK

**Mô tả**: Cập nhật metadata của game

---

#### 3.4. Delete Game

```http
POST /api/games/delete
```

**Request Body:**

```json
{
  "gameId": "game-001",
  "hardDelete": false
}
```

**Response 200:** OK

**Mô tả**: Soft delete hoặc hard delete game

---

#### 3.5. Set Active Status

```http
POST /api/games/set-active
```

**Request Body:**

```json
{
  "gameId": "game-001",
  "isActive": true
}
```

**Response 200:** OK

**Mô tả**: Enable/disable game

---

#### 3.6. Submit for QC

```http
POST /api/games/submit-qc
```

**Request Body:**

```json
{
  "versionId": "version-001",
  "gameId": "game-001"
}
```

**Response 200:** OK  
**Response 400:** Self-QA incomplete or invalid status

**Mô tả**: Dev submit version (draft/qc_failed) để QC review

---

#### 3.7. Update Self-QA

```http
POST /api/games/self-qa
```

**Request Body:**

```json
{
  "versionId": "version-001",
  "gameId": "game-001",
  "checklist": {
    "testedDevices": true,
    "testedAudio": true,
    "gameplayComplete": true,
    "contentVerified": true
  },
  "note": "All tests passed"
}
```

**Response 200:** OK

**Mô tả**: Dev cập nhật Self-QA checklist

---

#### 3.8. Publish Version

```http
POST /api/games/{id}/publish
```

**Path Parameters:**

- `id` (string, required): Game ID

**Request Body:**

```json
{
  "versionId": "version-001",
  "setAsLive": false,
  "rolloutPercentage": 100
}
```

**Response 200:** OK  
**Response 400:** Error

**Mô tả**: Publish version (approved → published), optional set as live

---

#### 3.9. Approve Version

```http
POST /api/games/{id}/approve
```

**Path Parameters:**

- `id` (string, required): Game ID

**Response 200:** OK

**Mô tả**: CTO/CEO approve version sau khi QC passed

---

#### 3.10. Reject Version

```http
POST /api/games/{id}/reject
```

**Path Parameters:**

- `id` (string, required): Game ID

**Request Body:**

```json
{
  "reason": "UI issues found"
}
```

**Response 200:** OK

**Mô tả**: Reject version trong QC hoặc approval

---

#### 3.11. Set Live Version

```http
POST /api/games/{id}/set-live
```

**Path Parameters:**

- `id` (string, required): Game ID

**Request Body:**

```json
{
  "versionId": "version-001"
}
```

**Response 201:** OK

**Mô tả**: Set version cụ thể làm live version

---

#### 3.12. List Game Versions

```http
GET /api/games/{id}/versions
```

**Path Parameters:**

- `id` (string, required): Game ID

**Response 200:**

```json
[
  {
    "_id": "string",
    "gameId": "game-001",
    "version": "1.0.0",
    "status": "published",
    "submittedAt": "2026-01-10T13:33:02Z"
  }
]
```

**Mô tả**: Lấy danh sách versions của game

---

#### 3.13. Upload Thumbnail

```http
POST /api/games/upload-thumbnail
```

**Request Body (multipart/form-data):**

- `file` (binary, required): Thumbnail image
- `gameId` (string, required): Game ID
- `type` (string, required): "desktop" or "mobile"

**Response 200:** OK

**Mô tả**: Upload thumbnail riêng lẻ

---

### 📊 Module 4: System & Admin (4 endpoints)

#### 4.1. Dashboard Statistics

```http
GET /api/dashboard/stats
```

**Response 200:**

```json
{
  "games": {
    "total": 100,
    "draft": 20,
    "in_qc": 10,
    "published": 70
  },
  "recentActivities": []
}
```

**Mô tả**: Thống kê cho dashboard

---

#### 4.2. Audit Logs

```http
GET /api/audit-logs?userId={userId}&action={action}&targetId={targetId}&page=1&limit=50
```

**Query Parameters:**

- `userId` (string, optional): Filter by user
- `action` (string, optional): Filter by action
- `targetId` (string, optional): Filter by target
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 50): Items per page

**Response 200:**

```json
{
  "logs": [
    {
      "id": "string",
      "userId": "string",
      "action": "game.publish",
      "targetId": "game-001",
      "timestamp": "2026-01-10T13:33:02Z"
    }
  ],
  "total": 100,
  "page": 1
}
```

**Mô tả**: Xem audit logs (system:audit_view permission required)

---

#### 4.3. Get Notifications

```http
GET /api/notifications
```

**Response 200:**

```json
[
  {
    "id": "string",
    "type": "game.qc_passed",
    "message": "Your game has passed QC",
    "read": false,
    "createdAt": "2026-01-10T13:33:02Z"
  }
]
```

**Mô tả**: Lấy notifications của user

---

#### 4.4. Mark Notification as Read

```http
POST /api/notifications
```

**Request Body:**

```json
{
  "notificationId": "notif-001",
  "markAllRead": false
}
```

**Response 200:** OK

**Mô tả**: Đánh dấu notification đã đọc

---

### 🔧 Module 5: External Integration (2 endpoints)

#### 5.1. Run QC Check

```http
POST /api/qc/run
```

**Request Body:**

```json
{
  "versionId": "version-001",
  "gameId": "game-001"
}
```

**Response 200:** OK

**Mô tả**: Trigger automated QC check

---

#### 5.2. List GCS Files

```http
GET /api/gcs/files?path={path}
```

**Query Parameters:**

- `path` (string, optional): Path in GCS bucket

**Response 200:**

```json
{
  "files": [
    {
      "name": "game-001/1.0.0/index.html",
      "size": 12345,
      "updated": "2026-01-10T13:33:02Z"
    }
  ]
}
```

**Mô tả**: List files trong GCS storage

---

## APIs tương đương

### Bảng mapping chi tiết

| Chức năng       | Backend Vũ                       | Backend tôi                   | Khác biệt                              |
| --------------- | -------------------------------- | ----------------------------- | -------------------------------------- |
| **List games**  | `GET /api/v1/games/`             | `GET /api/games/list`         | Path khác, có thể có query params khác |
| **Create game** | `POST /api/v1/games/`            | `POST /api/games/create`      | Path khác, schema có thể khác          |
| **Get game**    | `GET /api/v1/games/{game_id}`    | `GET /api/games/{id}`         | Path param name khác                   |
| **Update game** | `PUT /api/v1/games/{game_id}`    | `POST /api/games/{id}/update` | Method khác (PUT vs POST)              |
| **Delete game** | `DELETE /api/v1/games/{game_id}` | `POST /api/games/delete`      | Method khác, body structure khác       |

### Chi tiết từng cặp API tương đương

#### 1. List Games

**Backend Vũ:**

```http
GET /api/v1/games/
```

**Backend tôi:**

```http
GET /api/games/list?status={status}&ownerId={ownerId}&subject={subject}&grade={grade}&isDeleted={isDeleted}
```

**Khác biệt:**

- Path khác: `/api/v1/games/` vs `/api/games/list`
- Backend tôi có nhiều query filters hơn
- Response schema có thể khác (cần check chi tiết)

---

#### 2. Create Game

**Backend Vũ:**

```http
POST /api/v1/games/
Content-Type: application/json

{
  "game_id": "string",
  "title": "string",
  "description": "string"
}
```

**Backend tôi:**

```http
POST /api/games/create
Content-Type: application/json

{
  "title": "string",
  "gameId": "string",
  "subject": "string",
  "grade": "string",
  "unit": "string",
  "gameType": "string",
  "priority": "string",
  "description": "string"
}
```

**Khác biệt:**

- Path khác
- Backend tôi có nhiều fields hơn (subject, grade, unit, gameType, priority)
- Field naming: `game_id` vs `gameId`

---

#### 3. Get Game

**Backend Vũ:**

```http
GET /api/v1/games/{game_id}
```

**Backend tôi:**

```http
GET /api/games/{id}
```

**Khác biệt:**

- Path param name: `game_id` vs `id`
- Response schema có thể khác

---

#### 4. Update Game

**Backend Vũ:**

```http
PUT /api/v1/games/{game_id}
Content-Type: application/json

{
  "title": "string",
  "description": "string"
}
```

**Backend tôi:**

```http
POST /api/games/{id}/update
Content-Type: application/json

{
  "title": "string",
  "subject": "string",
  "grade": "string",
  "description": "string",
  "unit": "string",
  "gameType": "string",
  "priority": "string"
}
```

**Khác biệt:**

- HTTP Method: PUT vs POST
- Path: `/{game_id}` vs `/{id}/update`
- Backend tôi có nhiều fields hơn

---

#### 5. Delete Game

**Backend Vũ:**

```http
DELETE /api/v1/games/{game_id}?deleted_by={deleted_by}&reason={reason}
```

**Backend tôi:**

```http
POST /api/games/delete
Content-Type: application/json

{
  "gameId": "string",
  "hardDelete": false
}
```

**Khác biệt:**

- HTTP Method: DELETE vs POST
- Backend Vũ: path param + query params
- Backend tôi: request body
- Backend tôi có option hardDelete

---

## Khuyến nghị triển khai

### 🎯 Ưu tiên 1: Bổ sung Game Lessons Module (CRITICAL)

> [!CAUTION]
> Nếu hệ thống cần tích hợp với learning path, module này là BẮT BUỘC

**Endpoints cần thêm (12):**

1. ✅ `GET /api/v1/game-lessons/subjects`
2. ✅ `GET /api/v1/game-lessons/age-bands`
3. ✅ `GET /api/v1/game-lessons/courses/{subject_id}/{age_band_id}`
4. ✅ `GET /api/v1/game-lessons/tracks` (query params)
5. ✅ `GET /api/v1/game-lessons/tracks/{course_id}`
6. ✅ `GET /api/v1/game-lessons/units/{track_id}`
7. ✅ `GET /api/v1/game-lessons/lessons` (query param)
8. ✅ `GET /api/v1/game-lessons/lessons/{unit_id}`
9. ✅ `GET /api/v1/game-lessons/skills`
10. ✅ `GET /api/v1/game-lessons/skills/filter`
11. ✅ `GET /api/v1/game-lessons/levels`
12. ✅ `GET /api/v1/game-lessons/themes`

**Cấu trúc database cần có:**

```
subjects
  ├─ age_bands
      ├─ courses
          ├─ tracks
              ├─ units
                  └─ lessons
                      ├─ skills (many-to-many)
                      ├─ level (one-to-one)
                      └─ theme (one-to-one)
```

---

### 🎯 Ưu tiên 2: Bổ sung Game Sessions Module (HIGH)

> [!IMPORTANT]
> Cần thiết cho tracking progress của học sinh và analytics

**Endpoints cần thêm (4):**

1. ✅ `POST /api/v1/games/session/assign`
2. ✅ `GET /api/v1/games/session/open`
3. ✅ `POST /api/v1/games/session/submit`
4. ✅ `GET /api/v1/games/session/{session_id}`

**Database schema:**

```javascript
GameSession {
  session_id: string (PK)
  child_id: string (FK)
  lesson_id: string (FK)
  game_id: string (FK)
  game_version: string
  status: enum ['assigned', 'in_progress', 'completed', 'abandoned']
  assigned_at: datetime
  started_at: datetime
  completed_at: datetime
  result: {
    score: number
    stars: number
    completed: boolean
    time_spent: number
    answers: array
  }
}
```

---

### 🎯 Ưu tiên 3: Bổ sung Game-Lesson Linking (MEDIUM)

**Endpoints cần thêm (1):**

1. ✅ `GET /api/v1/games/by_lesson/{lesson_id}`

**Database:**

```javascript
// Thêm field vào Game collection
Game {
  ...existing_fields,
  lesson_ids: [string] // Array of lesson IDs
}

// Hoặc tạo bảng mapping riêng
GameLessonMapping {
  game_id: string (FK)
  lesson_id: string (FK)
  order: number
}
```

---

### 🎯 Ưu tiên 4: Chuẩn hóa Version Management (OPTIONAL)

**Nếu muốn RESTful hơn, thêm:**

1. ✅ `POST /api/v1/games/{game_id}/versions` - Tạo version
2. ✅ `PUT /api/v1/games/{game_id}/versions/{version}` - Update version
3. ✅ `DELETE /api/v1/games/{game_id}/versions/{version}` - Xóa version

**Hoặc giữ nguyên workflow hiện tại** (upload-zip, publish, approve, reject) vì đã đầy đủ cho quy trình dev.

---

### 🎯 Quyết định về Authentication & User Management

**Backend Vũ không có Auth/User APIs** → Có 3 khả năng:

1. **Họ dùng external auth service** (Firebase Auth, Auth0, etc.)
2. **Auth được handle ở API Gateway/Middleware**
3. **Họ chưa implement (đang dev)**

**Khuyến nghị:**

- ✅ **GIỮ NGUYÊN** Auth & User Management APIs của bạn
- Đây là best practice cho internal tool
- Cần thiết cho audit logs và permissions

---

### 🎯 Quyết định về QA/QC Workflow

**Backend Vũ không có QC workflow** → Có thể:

1. QC được làm manual
2. QC ở hệ thống khác
3. Chưa có quy trình QC

**Khuyến nghị:**

- ✅ **GIỮ NGUYÊN** QA/QC workflow của bạn
- Đây là competitive advantage
- Giúp đảm bảo chất lượng game

---

## 📊 Tổng kết số liệu

### Backend Vũ

| Module        | Endpoints | Mô tả                        |
| ------------- | --------- | ---------------------------- |
| Game Lessons  | 12        | Learning path management     |
| Games CRUD    | 4         | Basic CRUD operations        |
| Game Versions | 3         | Version management (RESTful) |
| Game Sessions | 4         | Student session tracking     |
| **TOTAL**     | **20**    |                              |

### Backend tôi

| Module        | Endpoints | Mô tả                                 |
| ------------- | --------- | ------------------------------------- |
| Auth          | 3         | Login, logout, me                     |
| Games CRUD    | 5         | List, create, get, update, delete     |
| Game Workflow | 12        | QA/QC, publish, approve, reject, etc. |
| Users         | 4         | User management                       |
| System        | 4         | Dashboard, logs, notifications        |
| External      | 2         | QC automation, GCS                    |
| **TOTAL**     | **29**    |                                       |

### So sánh coverage

| Feature            | Backend Vũ     | Backend tôi       |
| ------------------ | -------------- | ----------------- |
| Learning Path      | ✅ Full (12)   | ❌ None           |
| Game Sessions      | ✅ Full (4)    | ❌ None           |
| Game CRUD          | ✅ Basic (4)   | ✅ Extended (5)   |
| Version Management | ✅ RESTful (3) | ⚠️ Workflow-based |
| Authentication     | ❌ None        | ✅ Full (3)       |
| User Management    | ❌ None        | ✅ Full (4)       |
| QA/QC Process      | ❌ None        | ✅ Full (12)      |
| System Admin       | ❌ None        | ✅ Full (4)       |

---

## 🚀 Implementation Plan

### Phase 1: Core Learning Path (Week 1-2)

```markdown
[ ] Thiết kế database schema cho Learning Path
[ ] Implement Subjects API
[ ] Implement Age Bands API
[ ] Implement Courses API
[ ] Implement Tracks API
[ ] Implement Units API
[ ] Implement Lessons API
[ ] Implement Skills API
[ ] Implement Levels API
[ ] Implement Themes API
[ ] Testing & Documentation
```

### Phase 2: Game Sessions (Week 3)

```markdown
[ ] Thiết kế database schema cho Game Sessions
[ ] Implement Assign Session API
[ ] Implement Get Open Session API
[ ] Implement Submit Session API
[ ] Implement Get Session API
[ ] Testing & Analytics integration
```

### Phase 3: Integration (Week 4)

```markdown
[ ] Implement Get Games by Lesson API
[ ] Link existing games với lessons
[ ] Update game creation flow để include lesson_ids
[ ] Migration script cho existing data
[ ] End-to-end testing
```

### Phase 4: Optional Enhancements

```markdown
[ ] RESTful version management endpoints
[ ] Bulk operations APIs
[ ] Advanced filtering & search
[ ] Performance optimization
[ ] API versioning strategy
```

---

## 📝 Notes

### Naming Conventions

**Backend Vũ:**

- Snake_case cho path params: `{game_id}`, `{subject_id}`
- Camel case trong response: `gameId`, `subjectId`

**Backend tôi:**

- Camel case cho path params: `{id}`
- Camel case trong request/response: `gameId`, `versionId`

### HTTP Methods

**Backend Vũ:**

- Tuân thủ RESTful: GET, POST, PUT, DELETE

**Backend tôi:**

- Ưu tiên POST cho nhiều operations
- Có thể do framework hoặc design choice

### Response Formats

**Backend Vũ:**

- Direct array cho lists: `[{...}, {...}]`
- Direct object cho single item: `{...}`

**Backend tôi:**

- Wrapped response: `{ games: [...] }`, `{ user: {...} }`
- Có metadata: `{ success: true, ... }`

---

## 🔗 References

- [Backend Vũ - BE_vu.json](file:///d:/Web/game-hub-manager-interface/docs/interface/BE_vu.json)
- [Backend tôi - api-spec.yaml](file:///d:/Web/game-hub-manager-interface/api-spec.yaml)
- OpenAPI 3.0 Specification
- RESTful API Design Best Practices

---

**Last Updated**: 2026-01-10  
**Version**: 1.0.0  
**Author**: API Comparison Tool
