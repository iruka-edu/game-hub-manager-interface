# DESIGN_SPECS.md

## 1. Design Philosophy (Triết lý thiết kế)
* **Minimal & Functional:** Loại bỏ các yếu tố trang trí thừa. Tập trung vào dữ liệu: Tên game, Version, Status, Size.
* **High Contrast & Readability:** Sử dụng text màu đậm trên nền trắng để dễ đọc dưới điều kiện ánh sáng văn phòng.
* **Visual Hierarchy:** Sử dụng kích thước font và màu sắc để phân cấp thông tin (Tiêu đề > Metadata > Actions).
* **Feedback Oriented:** Mọi hành động (Upload, Delete) đều phải có phản hồi thị giác rõ ràng (Loading, Success, Error).

## 2. Design Tokens (Tailwind CSS Config)

Chúng ta sẽ sử dụng hệ màu **Slate** (Xám xanh) của Tailwind làm màu chủ đạo để tạo cảm giác "công nghệ" và "cao cấp" hơn màu xám đơn thuần.

### 2.1. Color Palette (Bảng màu)

| Token Name | Tailwind Class | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Backgrounds** | | | |
| `bg-background` | `bg-white` | `#ffffff` | Nền chính, nền Card |
| `bg-surface` | `bg-slate-50` | `#f8fafc` | Nền layout tổng, nền table header |
| `bg-surface-active`| `bg-slate-100` | `#f1f5f9` | Hover states, selected items |
| **Foregrounds (Text)**| | | |
| `text-primary` | `text-slate-900` | `#0f172a` | Tiêu đề, dữ liệu quan trọng |
| `text-secondary` | `text-slate-500` | `#64748b` | Metadata, label, description |
| `text-muted` | `text-slate-400` | `#94a3b8` | Disabled text, placeholder |
| **Brand (Action)** | | | |
| `brand-primary` | `bg-indigo-600` | `#4f46e5` | Button chính, Links, Active states |
| `brand-hover` | `bg-indigo-700` | `#4338ca` | Hover state của Button chính |
| **Semantic (Status)** | | | |
| `status-success` | `text-emerald-700 bg-emerald-50` | -- | Trạng thái: Active, Upload thành công |
| `status-warning` | `text-amber-700 bg-amber-50` | -- | Trạng thái: Testing, Checking |
| `status-error` | `text-red-700 bg-red-50` | -- | Trạng thái: Error, Deleted, Validation Fail |
| `status-info` | `text-blue-700 bg-blue-50` | -- | Trạng thái: Draft, Processing |

### 2.2. Typography (Font chữ)

* **Font Family:** `Inter` (Google Fonts). Đây là chuẩn mực cho UI hiện đại, số hiển thị rất rõ ràng (tốt cho Version numbers).
* **Scale:**
    * `text-xs` (12px): Badge, Tag, Timestamp.
    * `text-sm` (14px): Body text, Table content, Button text (Đây là size chủ đạo).
    * `text-base` (16px): Input values, Card titles.
    * `text-xl` (20px): Page Titles.

### 2.3. Shapes & Spacing

* **Border Radius:** `rounded-md` (6px) hoặc `rounded-lg` (8px). Không dùng bo tròn hoàn toàn (`rounded-full`) trừ các badge trạng thái.
* **Shadow:**
    * Card: `shadow-sm` (Nhẹ nhàng, tinh tế).
    * Dropdown/Modal: `shadow-lg`.
* **Border:** `border-slate-200` (Mỏng, nhẹ).

---

## 3. Component System (Thư viện `shadcn/ui`)

Chúng ta sẽ cài đặt thư viện **shadcn/ui** để đảm bảo tính nhất quán và tốc độ development. Dưới đây là cách mapping các component vào use-case của dự án:

### 3.1. Atoms (Thành phần cơ bản)

1.  **Buttons:**
    * `Variant: Default` (Indigo): Dùng cho nút "Upload Game", "Confirm".
    * `Variant: Outline` (White + Border): Dùng cho nút "Cancel", "View Details".
    * `Variant: Ghost` (Transparent): Dùng cho các nút hành động trong bảng (Icon Delete, Icon Edit).
    * `Variant: Destructive` (Red): Dùng cho nút "Delete Version".

2.  **Badge (Status Label):**
    * Hiển thị version: `v1.0.2` (Gray Badge).
    * Hiển thị trạng thái: `Live` (Green), `Deprecated` (Red).

3.  **Input / Form:**
    * Sử dụng style input chuẩn của shadcn (có ring focus màu Indigo).
    * Đặc biệt chú ý hiển thị lỗi (`border-red-500`) ngay bên dưới input khi validate sai cấu trúc folder.

### 3.2. Molecules (Thành phần ghép)

1.  **Game Card (Item trong danh sách):**
    * Layout: Grid hoặc List view.
    * Header: Tên Game (Bold) + Icon Game.
    * Body: Thông tin ID, Latest Version, Ngày update.
    * Footer: Link "Play", Nút "Manage".

2.  **Version History Table:**
    * Dành cho trang chi tiết.
    * Cột: Version | Uploaded At | Size | Status | Actions.
    * Dòng mới nhất sẽ được highlight (`bg-indigo-50/50`).

3.  **Upload Zone (Dropzone):**
    * Vùng nét đứt (`border-dashed`).
    * State Idle: "Kéo thả folder dist vào đây".
    * State Dragover: "Thả tay để upload" (Đổi màu nền).
    * State Validating: Hiển thị Spinner.
    * State Error: Viền đỏ + List lỗi chi tiết.

---

## 4. Layout Structure

### 4.1. Global Layout (`Layout.astro`)
* **Header (Navbar):**
    * Logo (Trái).
    * Breadcrumb (Điều hướng: Home > Game Detail).
    * User Profile / Logout (Phải - nếu có auth sau này).
* **Main Content:**
    * `max-w-7xl` (Rộng nhưng có giới hạn để dễ đọc trên màn hình lớn).
    * Padding: `p-6` hoặc `p-8`.

### 4.2. Page Layouts
1.  **Dashboard (Home):**
    * Top: Thống kê nhanh (Total Games, Total Builds).
    * Action Bar: Search input + Button "New Upload".
    * Content: Grid các Game Card.

2.  **Upload Page:**
    * Layout tập trung (Centered layout).
    * Form upload nằm giữa màn hình, width khoảng `max-w-2xl`.
    * Bên dưới là log/console output (giả lập terminal để QC xem chi tiết quá trình validate).

---

## 5. Next Steps

Bạn có đồng ý với bảng "Design Specs" này không?
Nếu đồng ý, bước tiếp theo tôi sẽ:

1.  Cài đặt `shadcn/ui` và cấu hình `tailwind.config.mjs` theo đúng bảng màu trên.
2.  Tạo layout cơ bản (Header, Container).