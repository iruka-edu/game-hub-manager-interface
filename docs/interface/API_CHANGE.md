# Game Hub API - Tổng Hợp Thay Đổi

## 📋 Tổng Quan

Tài liệu này tổng hợp các thay đổi API đã được thực hiện trong Game Hub service.

---

## 🔐 Permission Matrix (Ma trận quyền)

### Roles

| Role        | Mô tả                               |
| ----------- | ----------------------------------- |
| `dev`       | Developer - tạo, edit games         |
| `qc`        | QC Tester - kiểm tra games          |
| `reviewer`  | Reviewer - duyệt games              |
| `publisher` | Publisher - publish/unpublish games |
| `admin`     | Admin - có tất cả quyền             |

### API Permissions

| Endpoint                  | Method | Roles Allowed                       |
| ------------------------- | ------ | ----------------------------------- |
| `/games/create`           | POST   | dev, admin                          |
| `/games/list`             | GET    | dev, qc, reviewer, publisher, admin |
| `/games/{id}`             | GET    | dev, qc, reviewer, publisher, admin |
| `/games/{id}`             | PUT    | dev, admin (+ owner check)          |
| `/games/{id}`             | DELETE | **admin only**                      |
| `/games/upload`           | POST   | dev, admin                          |
| `/games/{id}/submit-qc`   | POST   | dev, admin (owner only)             |
| `/games/{id}/self-qa`     | POST   | dev, admin (owner only)             |
| `/qc/run`                 | POST   | qc, admin                           |
| `/qc/decision`            | POST   | qc, admin                           |
| `/qc/issues/assign`       | POST   | qc, admin                           |
| `/qc/issues/close`        | POST   | qc, admin                           |
| `/qc/issues/{version_id}` | GET    | qc, admin                           |
| `/release/{id}/approve`   | POST   | **reviewer, admin**                 |
| `/release/{id}/reject`    | POST   | **reviewer, admin**                 |
| `/release/{id}/publish`   | POST   | **publisher, admin**                |
| `/release/{id}/unpublish` | POST   | **publisher, admin**                |
| `/users/`                 | GET    | admin only                          |
| `/users/`                 | POST   | admin only                          |
| `/users/{id}/status`      | POST   | admin only                          |
| `/users/{id}/password`    | POST   | admin only                          |

---

## 🎮 Game Endpoints

### `GET /api/v1/games/list` - List Games với Filters

**Thay đổi:** Thêm nhiều query parameters để filter và sort.

| Parameter      | Type   | Description                                             |
| -------------- | ------ | ------------------------------------------------------- |
| `mine`         | bool   | Chỉ lấy games của user hiện tại (default: true)         |
| `status`       | string | Filter theo status: `draft`, `qc`, `review`, `approved` |
| `publishState` | string | Filter theo publish: `published`, `unpublished`         |
| `title`        | string | Tìm kiếm theo tên game (partial match)                  |
| `gameId`       | string | Tìm kiếm theo game_id (partial match)                   |
| `ownerId`      | UUID   | Filter theo owner (cho admin/qc views)                  |
| `createdFrom`  | date   | Games tạo từ ngày này                                   |
| `createdTo`    | date   | Games tạo đến ngày này                                  |
| `updatedFrom`  | date   | Games cập nhật từ ngày này                              |
| `updatedTo`    | date   | Games cập nhật đến ngày này                             |
| `sortBy`       | string | Sắp xếp theo: `created_at`, `updated_at`, `title`       |
| `sortOrder`    | string | `asc` hoặc `desc` (default: desc)                       |

**Ví dụ sử dụng:**

```
GET /api/v1/games/list?status=qc&mine=false        # QC Inbox
GET /api/v1/games/list?status=review&mine=false    # Review Queue
GET /api/v1/games/list?publishState=published      # Published Games
GET /api/v1/games/list?title=mario&sortBy=title    # Search by title
```

---

### `DELETE /api/v1/games/{game_id}` - Delete Game

**⚠️ THAY ĐỔI QUYỀN:** Chỉ Admin mới có quyền delete game.

| Before                          | After                         |
| ------------------------------- | ----------------------------- |
| Dev có thể delete game của mình | **Chỉ Admin mới delete được** |

**Response:**

- `204 No Content` - Success
- `403 Forbidden` - User không phải Admin

---

### `POST /api/v1/games/upload` - Upload Build

**Thay đổi:**

1. Auto-update `gcs_path` trong Game khi upload
2. Kiểm tra `is_locked` trước khi upload

**Error mới:**

- `409 Conflict` - Game is locked for editing (đang trong QC hoặc Review)

---

## ✅ QC Endpoints

### Permission: QC hoặc Admin

Tất cả QC endpoints yêu cầu role `qc` hoặc `admin`.

### `POST /api/v1/qc/run` - Run QC

Tạo QC report với status `open`.

---

### `POST /api/v1/qc/decision` - QC Decision

**⚠️ THAY ĐỔI VALIDATION:**

**Yêu cầu mới để PASS:**

1. Tất cả issues phải đã được closed (0 open issues)
2. QA01, QA02, QA04 phải pass

**Error messages:**

```json
{
  "detail": "Cannot pass QC: X open issue(s) remaining. All issues must be resolved or closed before passing."
}
```

---

### `POST /api/v1/qc/issues/close` - **[NEW]** Close QC Issue

**Endpoint mới** để close một QC issue.

**Request:**

```json
{
  "issueId": "uuid",
  "notes": "Issue resolved"
}
```

---

### `POST /api/v1/qc/issues/assign` - Assign Issue

Assign issue cho developer.

---

### `GET /api/v1/qc/issues/{version_id}` - List Issues

Lấy danh sách issues của một version.

---

## 📤 Release Endpoints

### `POST /api/v1/release/{game_id}/approve` - Approve Game

**Permission: Reviewer hoặc Admin**

| Role      | Access           |
| --------- | ---------------- |
| dev       | ❌ 403 Forbidden |
| qc        | ❌ 403 Forbidden |
| reviewer  | ✅ Allowed       |
| publisher | ❌ 403 Forbidden |
| admin     | ✅ Allowed       |

**State Change:** `review` → `approved`

---

### `POST /api/v1/release/{game_id}/reject` - Reject Game

**Permission: Reviewer hoặc Admin**

**State Change:** `review` → `draft`

---

### `POST /api/v1/release/{game_id}/publish` - Publish Game

**Permission: Publisher hoặc Admin**

| Role      | Access           |
| --------- | ---------------- |
| dev       | ❌ 403 Forbidden |
| qc        | ❌ 403 Forbidden |
| reviewer  | ❌ 403 Forbidden |
| publisher | ✅ Allowed       |
| admin     | ✅ Allowed       |

**Yêu cầu:** Version status = `approved`

---

### `POST /api/v1/release/{game_id}/unpublish` - Unpublish Game

**Permission: Publisher hoặc Admin**

---

## 👥 User Management Endpoints

### Permission: Admin Only

Tất cả User Management endpoints yêu cầu role `admin`.

| Endpoint               | Method | Description      |
| ---------------------- | ------ | ---------------- |
| `/users/`              | GET    | List all users   |
| `/users/`              | POST   | Create user      |
| `/users/{id}/status`   | POST   | Lock/unlock user |
| `/users/{id}/password` | POST   | Reset password   |

---

## 🔒 is_locked Flag

**Thay đổi:** GameVersion có trường `is_locked` để chặn edit khi đang trong QC/Review.

| Status     | is_locked | Edit Allowed |
| ---------- | --------- | ------------ |
| `draft`    | false     | ✅ Yes       |
| `qc`       | true      | ❌ No        |
| `review`   | true      | ❌ No        |
| `approved` | false     | ✅ Yes       |

**Affected endpoints:**

- `POST /games/upload` - Chặn upload khi locked
- `PUT /games/{id}` - Chặn update khi locked

---

## 📊 Database Changes

### games Table

| Field      | Thay đổi                                          |
| ---------- | ------------------------------------------------- |
| `gcs_path` | Auto-update khi upload (format: `games/{gameId}`) |

### game_versions Table

| Field       | Thay đổi                            |
| ----------- | ----------------------------------- |
| `is_locked` | New column - bool, controls editing |

### qc_reports Table

| Field    | Thay đổi                                            |
| -------- | --------------------------------------------------- |
| `status` | Values: `open`, `in_progress`, `resolved`, `closed` |

---

## 🔄 Workflow Changes

### Complete Workflow với Roles

```
Developer (dev):
  1. Create game → status = draft
  2. Upload build
  3. Self-QA
  4. Submit QC → status = qc, is_locked = true

QC Tester (qc):
  5. Run QC → creates issues (open)
  6. Close issues when resolved
  7. QC Decision (pass) → status = review

Reviewer (reviewer):
  8. Approve → status = approved, is_locked = false

Publisher (publisher):
  9. Publish → publish_state = published

Admin (admin):
  - Can do all of the above
  - Can delete games
  - Can manage users
```

---

## 📁 Files Changed

### Endpoints

- `app/api/v1/endpoints/game.py` - Added filters, permission checks
- `app/api/v1/endpoints/game_upload.py` - Added is_locked check
- `app/api/v1/endpoints/qc.py` - Added issue management endpoints
- `app/api/v1/endpoints/release.py` - Uses reviewer/publisher deps

### Services

- `app/services/game_service.py` - Added filter logic
- `app/services/game_upload_service.py` - Auto-update gcs_path
- `app/services/qc_service.py` - Added open issues validation

### Repositories

- `app/db/repositories/game_repo.py` - Added filter queries
- `app/db/repositories/qc_repo.py` - Added issue management methods

### Dependencies

- `app/api/deps.py` - Added role-specific dependencies:
  - `get_current_reviewer_user`
  - `get_current_publisher_user`
  - `get_current_qc_user`
  - `RoleChecker` class
