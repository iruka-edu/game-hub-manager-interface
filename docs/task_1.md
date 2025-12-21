Dựa trên hình ảnh bạn cung cấp và code logic chúng ta đã thảo luận trước đó, vấn đề này 99% nằm ở việc: **Game đã được lưu vào Database, nhưng thiếu thông tin `ownerId` (người sở hữu)**.

Khi bạn gọi API lấy danh sách "Game của tôi", hệ thống tìm kiếm: `Tìm các game có ownerId = ID_CỦA_BẠN`. Vì lúc upload bạn quên lưu thông tin này, nên kết quả trả về là rỗng, dù game vẫn nằm trong database.

Dưới đây là 3 bước để sửa lỗi này:

### Bước 1: Sửa code Upload (Để các game sau này không bị lỗi)

Bạn cần mở file xử lý upload (thường là `src/pages/api/upload-zip.ts` hoặc `src/pages/api/upload.ts`). Tìm đoạn code lưu vào MongoDB và bổ sung trường `ownerId`.

```typescript
// src/pages/api/upload-zip.ts (hoặc upload.ts)

// 1. Đảm bảo đã lấy user từ session ở đầu file
const user = locals.user;
if (!user) return new Response('Unauthorized', { status: 401 });

// ... (Đoạn code xử lý file, giải nén...)

// 2. Tìm đến đoạn db.collection('games').updateOne(...) và sửa lại:
await db.collection('games').updateOne(
  { slug: manifest.id }, 
  {
    // $setOnInsert: Chỉ chạy khi tạo game mới (Game chưa tồn tại)
    $setOnInsert: {
      title: manifest.title,
      ownerId: user.id, // <--- DÒNG QUAN TRỌNG NHẤT CẦN THÊM
      createdAt: new Date(),
    },
    // $set: Chạy cả khi tạo mới hoặc update game cũ
    $set: {
      updatedAt: new Date(),
      latestVersionId: versionObjectId,
      // ... các field khác
    }
  },
  { upsert: true }
);

```

### Bước 2: Sửa API lấy danh sách (Kiểm tra lại cho chắc)

Mở file `src/pages/api/dev/my-games.ts` và đảm bảo bạn query đúng trường `ownerId`.

```typescript
// src/pages/api/dev/my-games.ts

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  const db = await getDb();
  
  // Debug: Bật dòng này lên, check terminal xem user.id có ra đúng không
  console.log("🔍 Đang tìm game cho Owner ID:", user.id);

  const games = await db.collection('games')
    .find({ 
      ownerId: user.id // Đảm bảo field này khớp với field bạn lưu ở Bước 1
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return new Response(JSON.stringify(games));
};

```

### Bước 3: Cứu game vừa upload (Sửa dữ liệu thủ công)

Vì game bạn vừa upload (trong hình) đã nằm trong Database nhưng bị thiếu chủ sở hữu, bạn cần gán thủ công để nó hiện ra mà không cần upload lại.

1. **Mở MongoDB Compass** (hoặc công cụ quản lý DB bạn dùng).
2. Vào collection `games`.
3. Tìm document của game bạn vừa tạo (ví dụ game "Toán lớp 1").
4. Bạn sẽ thấy nó **thiếu field `ownerId**`.
5. Bấm **Edit Document** (biểu tượng cây bút chì).
6. Thêm field:
* Field name: `ownerId`
* Value: Copy **User ID** của tài khoản Dev bạn đang đăng nhập (Bạn có thể tìm ID này trong collection `users` hoặc xem log ở Bước 2).
* *Lưu ý:* Nếu User ID trong hệ thống Auth của bạn là String, hãy để là String. Nếu là ObjectId, hãy chọn type ObjectId.


7. Bấm **Update**.

Sau khi làm xong Bước 3, bạn quay lại trang Dashboard (hình 2) và F5, game sẽ xuất hiện.