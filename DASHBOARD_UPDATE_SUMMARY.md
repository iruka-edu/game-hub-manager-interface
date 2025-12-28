# Dashboard Update Summary

## 📋 Tổng quan cập nhật

Đã cập nhật hệ thống dashboard để tập trung vào `/console` làm trang chính, với UI và logic rõ ràng cho từng role.

## 🔄 Thay đổi chính

### 1. **Redirect Dashboard**
- `/dashboard` → redirect 301 sang `/console`
- Tất cả links "Bảng điều khiển" giờ trỏ đến `/console`

### 2. **Layout Navigation**
- Cập nhật menu dropdown trong `Layout.astro`
- "Bảng điều khiển" → `/console`
- Thêm link "Thư viện Game" → `/console/library`

### 3. **Console Dashboard (`/console`)**
Trang dashboard chính với UI và logic riêng cho từng role:

#### 👨‍💻 **Developer Role**
**Mục đích:** Quản lý games cá nhân, theo dõi tiến độ QC

**Stats hiển thị:**
- 📝 Game nháp (draft)
- ⚠️ Cần sửa (qc_failed)

**Workflow:**
1. Tạo & Upload Game
2. Hoàn thành Self-QA
3. Submit cho QC
4. Theo dõi & Sửa lỗi

**Quick Actions:**
- Tạo game mới
- Xem games của tôi

---

#### 🔍 **QC Role**
**Mục đích:** Review và test game builds, đảm bảo chất lượng

**Stats hiển thị:**
- 📥 Chờ QC (uploaded)

**Workflow:**
1. Nhận game từ QC Inbox
2. Test & Review
3. Pass hoặc Fail

**Quick Actions:**
- Review game (nếu có games chờ QC)
- Xem QC Inbox

---

#### 👔 **CTO/CEO Role**
**Mục đích:** Phê duyệt games đã qua QC, quản lý quy trình xuất bản

**Stats hiển thị:**
- ✅ Chờ duyệt (qc_passed)

**Workflow:**
1. Review games đã qua QC
2. Phê duyệt hoặc Yêu cầu sửa
3. Theo dõi xuất bản

**Quick Actions:**
- Duyệt game (nếu có games chờ duyệt)
- Xem danh sách chờ approval

---

#### 🔧 **Admin Role**
**Mục đích:** Toàn quyền quản lý hệ thống

**Stats hiển thị:**
- 📝 Game nháp
- ⚠️ Cần sửa (QC)
- 📥 Chờ QC
- ✅ Chờ duyệt
- 🚀 Chờ xuất bản
- ✨ Đã xuất bản

**Workflow:**
- Toàn quyền thực hiện tất cả thao tác
- Quản lý users, games, workflow

**Quick Actions:**
- Tất cả actions của các roles khác
- Links nhanh đến: Library, QC Inbox, Approval, Publish

---

## 🎨 UI Improvements

### Loading States
- Skeleton UI hiển thị ngay lập tức
- Data load progressively từ server
- Auto-refresh mỗi 30 giây

### Role-based Headers
Mỗi role có header mô tả riêng:
- **Developer Dashboard** - Quản lý games của bạn, theo dõi tiến độ QC
- **QC Dashboard** - Review và test các game builds
- **CTO/CEO Dashboard** - Phê duyệt games đã qua QC
- **Admin Dashboard** - Toàn quyền quản lý hệ thống

### Workflow Guide Section
Hiển thị quy trình làm việc step-by-step cho từng role với:
- Numbered steps
- Clear descriptions
- Visual indicators
- Quick links (Admin only)

## 📊 Data Flow

```
Server-side (Initial Load)
    ↓
GameRepository + GameVersionRepository
    ↓
Calculate stats by role
    ↓
Render with data or skeleton
    ↓
Client-side (Auto-refresh)
    ↓
/api/dashboard/stats
    ↓
Update stats every 30s
```

## 🔐 Permission Logic

### Stats Visibility
- **Dev/Admin**: draftGames, qcFailedGames
- **QC/Admin**: uploadedGames
- **CTO/CEO/Admin**: qcPassedGames
- **Admin only**: approvedGames, publishedGames

### Quick Actions Visibility
- **Dev/Admin**: Tạo game mới
- **QC/Admin**: Review game (if uploadedGames > 0)
- **CTO/CEO/Admin**: Duyệt game (if qcPassedGames > 0)
- **Admin**: Xuất bản game (if approvedGames > 0)

## 📁 Files Changed

1. `src/layouts/Layout.astro` - Updated navigation links
2. `src/pages/dashboard/index.astro` - Redirect to /console
3. `src/pages/console/index.astro` - Complete dashboard with role-based UI
4. `src/pages/api/dashboard/stats.ts` - API endpoint for stats
5. `src/components/LoadingSkeleton.astro` - Reusable loading component

## ✅ Testing Checklist

- [ ] Developer role sees correct stats and workflow
- [ ] QC role sees QC-specific dashboard
- [ ] CTO/CEO role sees approval dashboard
- [ ] Admin role sees all stats and actions
- [ ] Loading skeleton displays correctly
- [ ] Auto-refresh works (30s interval)
- [ ] Navigation links work correctly
- [ ] /dashboard redirects to /console
- [ ] Quick actions show/hide based on data availability

## 🚀 Next Steps

1. Test với real users từng role
2. Gather feedback về UI/UX
3. Optimize performance nếu cần
4. Add more detailed analytics nếu yêu cầu
