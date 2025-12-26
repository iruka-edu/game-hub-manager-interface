# Game Hub / Game Console UIUX Rules & Checklist (Internal Tools)

> Mục tiêu: **nhanh – rõ – an toàn – ít sai** cho Dev / QC / Admin / CTO.  
> Tài liệu này dùng để **rà soát UI** + làm chuẩn **Design Tokens** + **UI Standards**.

---

## 1) Nguyên tắc vàng (Rules)

### 1.1 Ưu tiên theo nhiệm vụ (Task-first)
- Mỗi màn hình chỉ phục vụ **1–2 nhiệm vụ chính**.
- Người dùng phải trả lời được trong **3 giây**:
  - “Đang ở đâu?”
  - “Đang thao tác trên game/version/env nào?”
  - “Việc chính cần làm là gì?”

### 1.2 Mật độ thông tin (Information density)
- **Scan nhanh** là ưu tiên số 1 (list/table/card).
- Chỉ giữ **1–2 dòng thông tin chính**, phần còn lại **ẩn/thu gọn** (drawer/tooltip/popover).
- Card/list không được “dài vì meta”.

### 1.3 An toàn thao tác (Safety UX)
- Hành động nguy hiểm (delete/rollback/publish/disable) phải:
  - nằm trong menu `⋯`,
  - có confirm,
  - có cảnh báo **Production**,
  - có audit log (lưu ai làm gì, lúc nào).

### 1.4 Feedback rõ ràng (States)
- Bắt buộc có: **Loading / Empty / Error / Success**.
- Validation phải **inline** (báo đúng field, đúng dòng).

### 1.5 Nhất quán (Consistency)
- Thuật ngữ, format thời gian, format dung lượng, tên runtime/env phải thống nhất.

---

## 2) Design Tokens (Chuẩn hoá để FE code nhanh)

> Khuyến nghị: dùng CSS variables hoặc Tailwind tokens, đặt theo namespace `--gh-*`.

### 2.1 Typography Tokens (Base 16px)
**Base:** `16px`  
**Line-height mặc định:** `1.5`

| Token | Size | Line-height | Gợi ý dùng |
|---|---:|---:|---|
| `text-xs` | 12 | 16 | caption, helper, meta phụ |
| `text-sm` | 14 | 20 | table cell, label nhỏ |
| `text-base` | 16 | 24 | body chuẩn |
| `text-lg` | 18 | 28 | section lead, form title nhỏ |
| `text-xl` | 20 | 28 | heading phụ |
| `text-2xl` | 24 | 32 | heading trang |
| `text-3xl` | 30 | 36 | chỉ dùng cho hero (hạn chế) |

**Font-weight:**
- Regular 400 (body)
- Medium 500 (label, chip)
- Semibold 600 (title, button primary)

**Rules:**
- Label form: 14–16 (không nhỏ hơn 12).
- Meta (owner, runtime…): 12–14.
- Không dùng quá 3 weight trong 1 màn.

### 2.2 Spacing Tokens (Grid 8px)
- `space-1 = 4px`
- `space-2 = 8px`
- `space-3 = 12px`
- `space-4 = 16px`
- `space-5 = 20px`
- `space-6 = 24px`
- `space-8 = 32px`
- `space-10 = 40px`
- `space-12 = 48px`

**Rules:**
- Card padding: 16–24.
- Khoảng cách giữa section: 24–32.
- Table row height: 40 (compact) / 48–56 (comfortable).

### 2.3 Radius Tokens
- `radius-sm = 8px` (inputs, chips)
- `radius-md = 12px` (cards)
- `radius-lg = 16px` (modals/drawers)

### 2.4 Shadow Tokens (tiết chế)
- `shadow-1`: card nhẹ
- `shadow-2`: modal/drawer
> Không dùng nhiều shadow levels gây “lòe loẹt”.

### 2.5 Color Tokens (Semantic-first)
**Neutral:**
- `bg`: #F7F8FA
- `surface`: #FFFFFF
- `border`: #E6E8EF
- `text`: #111827
- `muted`: #6B7280

**Primary (Brand):**
- `primary`: (màu tím Iruka hiện tại)
- `primary-foreground`: trắng
- `primary-soft`: nền nhạt dùng cho highlight nhẹ

**Semantic:**
- `success` / `success-soft`
- `warning` / `warning-soft`
- `error` / `error-soft`
- `info` / `info-soft`

**Rules:**
- 1 màn hình: **1 primary + semantic**, còn lại neutral.
- Badge nền nhạt phải đủ tương phản chữ.
- Không truyền đạt ý nghĩa chỉ bằng màu (phải có icon + text).

### 2.6 Z-index Tokens
- `z-dropdown = 50`
- `z-sticky = 40`
- `z-drawer = 60`
- `z-modal = 70`
- `z-toast = 80`

---

## 3) UI Standards (Chuẩn component & layout)

### 3.1 Layout chuẩn Admin Tool
- Header: brand + CTA chính (role-based) + user menu.
- Toolbar: search + filter + sort + view toggle.
- Content: list (card/table) + drawer detail.

**Rule:** không trùng CTA (Dashboard/Trang chủ) ở nhiều nơi.

### 3.2 List/Card chuẩn (giảm chiều cao)
Card game **chỉ nên có**:
- Header: title + env badge + live version/status + menu `⋯`
- Meta 1 dòng: updated · owner · runtime · size (rút gọn)
- Tags: tối đa 3 + `+N`
- Actions row: `Play / Versions / Manifest / Logs` (compact)

### 3.3 Table/Compact view (bắt buộc khi > 30 game)
Cột gợi ý:
- Name | GameID (copy) | Env | Live version | Updated | Owner | Actions

### 3.4 Buttons & Hit-area
- Chiều cao button: **36–40px** (primary/secondary)
- Icon size: 20–24px
- Hit-area tối thiểu: 36x36

**Rule:** action hay dùng không được bé hơn action phụ.

### 3.5 Forms & Validation
- Inline validation (hiển thị ngay dưới field).
- Error message phải có:
  - lỗi là gì,
  - sửa thế nào (ví dụ format).

### 3.6 States (Loading/Empty/Error)
**Loading**
- KPI: skeleton
- List: skeleton rows/cards
- Disable actions khi đang loading

**Empty**
- Thông báo ngắn + CTA:
  - “Xóa bộ lọc”
  - “Tạo game mới”
  - “Upload build”

**Error**
- Banner + nút Retry + requestId/errorCode nhỏ.

### 3.7 Drawer/Modal chuẩn
- Drawer: chi tiết nhanh, giữ ngữ cảnh list.
- Modal: chỉ dùng cho confirm/destructive/setting nhỏ.

### 3.8 RBAC UI (Role-based UI)
- QC: Play, Logs, QC actions; không thấy Delete/Publish.
- Admin: Upload, Versions, Disable; Delete hạn chế.
- CTO: full + manifest raw + rollback + audit.

---

## 4) Chuẩn dữ liệu hiển thị (Data formatting)

### 4.1 Version
- SemVer: `v1.2.3`
- Live chip: `Live v1.2.3`

### 4.2 Dung lượng
- Auto format: `KB/MB/GB` (ví dụ `15.7 MB`, không để `16050 KB`).

### 4.3 Thời gian
- Relative: `12 giờ trước`, `1 ngày trước`.
- Nếu hiển thị ngày: format thống nhất `DD-MM` hoặc `DD/MM`.

### 4.4 Runtime
- Hiển thị 1 chuẩn: `Iframe HTML` (UI)
- Value máy: `iframe-html` (manifest)

---

## 5) Checklist rà soát UI (Dùng để nghiệm thu)

### 5.1 Navigation & Context
- [ ] Có breadcrumb hoặc title rõ ràng.
- [ ] Luôn thấy env (Prod/Staging/Draft) khi thao tác.
- [ ] Không trùng CTA/điều hướng.

### 5.2 Dashboard/Overview
- [ ] KPI cards: rõ ràng, không chiếm quá nhiều chiều cao.
- [ ] Card “cảnh báo” click được để xem chi tiết lỗi.

### 5.3 Toolbar
- [ ] Search hoạt động theo: name, gameId, owner.
- [ ] Filter chips nhanh: All / Production / Draft-Review / Có lỗi (QC).
- [ ] Sort rõ ràng (mới cập nhật, A–Z…).
- [ ] Toggle Card/Table.

### 5.4 List/Card density
- [ ] Card không quá cao; meta tối đa 1 dòng.
- [ ] Action chính không “to quá”; action phụ không “bé quá”.
- [ ] Tags hiển thị tối đa 3 + `+N`.

### 5.5 Actions & Safety
- [ ] More menu `⋯` có group: Actions / Manage / Dangerous.
- [ ] Delete/Rollback/Publish có confirm + cảnh báo Prod.
- [ ] Có audit log cho hành động quan trọng.

### 5.6 Versions
- [ ] Mặc định chỉ tóm tắt 1 dòng, bấm mới mở list.
- [ ] Activate có confirm.
- [ ] Delete có confirm + rule RBAC.

### 5.7 Manifest
- [ ] Có form thân thiện + JSON advanced.
- [ ] Validate inline; lỗi chỉ đúng field.
- [ ] Có history/diff (khuyến nghị).

### 5.8 Logs
- [ ] Có filter theo loại logs (upload/runtime/validate).
- [ ] Có search keyword.
- [ ] Có copy/export.

### 5.9 UI States
- [ ] Loading skeleton cho KPI + list.
- [ ] Empty state có CTA (clear filter, create, upload).
- [ ] Error banner có retry + requestId.

### 5.10 Accessibility & Usability
- [ ] Contrast đủ cho text nhỏ (12–14).
- [ ] Hit-area tối thiểu 36x36.
- [ ] Không dùng màu làm tín hiệu duy nhất.

---

## 6) Checklist Typography/Token nhanh (đúng ý “chữ dễ đọc, 16px chuẩn”)
- [ ] Body dùng `16px` (text-base).
- [ ] Meta dùng `12–14px` (xs/sm).
- [ ] Heading trang `24px`, section `18–20px`.
- [ ] Line-height body `24px` (1.5).
- [ ] Không dùng quá 3 kích cỡ chữ trong 1 card.

---

## 7) Gợi ý chuẩn hoá tên (nên thống nhất)
- “Game Hub Manager” / “Game Console” → chọn 1 brand trong nội bộ.
- “Tải Game Mới” vs “Tạo Game Mới” → tách:
  - Tạo game (metadata/registry)
  - Upload build (đăng bản build)

---

**Phiên bản tài liệu:** v1.0  
**Dành cho:** FE/BE/QC/PM/CTO
