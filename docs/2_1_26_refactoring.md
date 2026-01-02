Dựa trên tài liệu `REPOSITORY_STRUCTURE_DOCUMENTATION.md` bạn cung cấp và yêu cầu tách biệt **Core Logic** (SDK) ra khỏi **Game Management** (CMS), tôi đề xuất chiến lược Refactor hệ thống thành 2 phần rõ rệt.

Cách tiếp cận này giúp bạn đạt được mục tiêu: **Repo quản lý chỉ lo việc quản lý (CRUD, Auth, Storage), còn Logic chuẩn hóa game nằm ở Core.**

---

### 🏗️ Kiến trúc Refactor (Before vs. After)

**Hiện tại (Monolithic):**

> `GameManagerRepo` = [ UI + Database + **ValidationLogic** + **MetadataTypes** + **HandshakeProtocol** ]

**Mới (Decoupled):**

1. **Repo A: `@iruka/game-core-sdk**` (Thư viện/Package)
* Chứa: Type definitions, Validation Rules, Manifest Schemas, Runtime Handshake (Client & Host).
* *Đặc điểm:* Pure JS/TS, không dính dáng đến MongoDB, React hay Astro.


2. **Repo B: `game-hub-manager**` (Ứng dụng hiện tại)
* Chứa: Astro, UI, API Routes, Database Models, GCS Upload.
* *Hành động:* Import `@iruka/game-core-sdk` để sử dụng.



---

### 1. Chi tiết Repo A: `@iruka/game-core-sdk`

Đây là nơi chứa "luật chơi" chung. Bạn sẽ tách các file logic thuần túy từ repo hiện tại sang đây.

**Cấu trúc thư mục đề xuất:**

```text
game-core-sdk/
├── package.json
├── src/
│   ├── types/                  # Định nghĩa TypeScript Interfaces
│   │   ├── manifest.ts         # (Từ src/lib/metadata-types.ts)
│   │   ├── game-config.ts
│   │   └── validation.ts
│   ├── validation/             # Logic kiểm tra (Pure functions)
│   │   ├── manifest-schema.ts  # Zod schemas hoặc JSON Schema
│   │   ├── rules/              # Các rule check rời (file size, extension)
│   │   └── validator.ts        # (Logic tách từ src/lib/lazy-validator.ts)
│   ├── runtime/                # Giao tiếp Iframe (Cho GM-03 sau này)
│   │   ├── host.ts             # Dùng cho Manager (Parent)
│   │   ├── client.ts           # Dùng cho Game (Child)
│   │   └── events.ts           # Định nghĩa Event Names
│   └── utils/
│       └── completeness.ts     # (Logic tính % hoàn thiện metadata)
└── dist/                       # Output build (ESM/CJS)

```

**Các file cần di chuyển từ Repo cũ sang đây:**

1. `src/lib/metadata-types.ts` → `src/types/manifest.ts`
2. `schema/` (JSON Schemas) → `src/validation/schemas/`
3. `src/lib/completeness-tracker.ts` (Phần logic tính toán thuần túy) → `src/utils/completeness.ts`
4. Logic validate trong `src/lib/lazy-validator.ts` (Tách phần logic ra khỏi phần gọi DB).

---

### 2. Chi tiết Repo B: `game-hub-manager` (Refactor)

Repo này sẽ trở nên nhẹ hơn, tập trung vào Business Flow.

**Thay đổi trong `package.json`:**

```json
{
  "dependencies": {
    "@iruka/game-core-sdk": "git+https://github.com/org/game-core-sdk.git#v1.0.0",
    ...
  }
}

```

**Cấu trúc thư mục sau khi dọn dẹp:**

```text
src/
├── ...
├── lib/
│   ├── metadata-types.ts       # ❌ XÓA (Đã chuyển sang SDK)
│   ├── lazy-validator.ts       # ⚠️ SỬA: Chỉ còn là wrapper gọi SDK
│   ├── completeness-tracker.ts # ⚠️ SỬA: Gọi hàm tính toán từ SDK
│   ├── mongodb.ts              # ✅ GIỮ NGUYÊN (Logic DB)
│   ├── gcs.ts                  # ✅ GIỮ NGUYÊN (Logic Storage)
│   └── metadata-service.ts     # ⚠️ SỬA: Dùng type từ SDK để query DB
├── models/
│   ├── Game.ts                 # Sửa: Implements IGameManifest từ SDK
│   └── ...
└── ...

```

---

### 3. Ví dụ Code Refactor (Minh họa)

#### A. Type Definition (Trước đây nằm trong `src/lib`)

Bây giờ nằm trong **SDK**:

```typescript
// @iruka/game-core-sdk/src/types/manifest.ts
export interface GameMetadata {
  gameType: string;
  subject: string;
  grade: number | string;
  // ... các trường mở rộng
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

```

#### B. Database Model (Trong Manager Repo)

Sẽ import từ SDK để đảm bảo tính nhất quán:

```typescript
// src/models/Game.ts
import mongoose from 'mongoose';
// Import Interface từ SDK
import type { GameMetadata } from '@iruka/game-core-sdk'; 

// Schema Mongoose vẫn phải khai báo để map với DB, 
// nhưng Typescript sẽ check xem nó có khớp với Interface SDK không
const GameSchema = new mongoose.Schema({
  title: String,
  // Metadata fields được định nghĩa lỏng hoặc chặt tùy strategy lưu trữ
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Helper method sử dụng Validator từ SDK
import { validateManifest } from '@iruka/game-core-sdk';

GameSchema.methods.validateMetadata = function() {
  return validateManifest(this.metadata); // Logic check nằm ở SDK
};

```

#### C. Validation Service (Trong Manager Repo)

Thay vì tự viết logic `if/else`, Manager gọi SDK:

```typescript
// src/lib/lazy-validator.ts
import { validateManifest, ValidationProfile } from '@iruka/game-core-sdk';

export async function validateGameForPublish(gameData: any) {
  // 1. Validate Structure (Dùng SDK)
  const structuralCheck = validateManifest(gameData, ValidationProfile.PUBLISH);
  
  if (!structuralCheck.isValid) {
    return structuralCheck.errors;
  }

  // 2. Validate Business (Riêng của Manager - VD: Check user plan, check DB)
  // ... Code riêng của Manager ...
}

```

---

### 4. Lộ trình thực hiện (Action Plan)

Để chuyển đổi an toàn mà không làm hỏng hệ thống hiện tại:

1. **Bước 1: Khởi tạo SDK Repo.**
* Copy `src/lib/metadata-types.ts` và `schema/` sang repo mới.
* Thiết lập build process (tsup hoặc microbundle) để xuất ra file `.js` và `.d.ts`.


2. **Bước 2: Publish SDK (Local/Private).**
* Push lên Git hoặc dùng `npm link` để test cục bộ.


3. **Bước 3: Integrate vào Manager Repo.**
* `pnpm install @iruka/game-core-sdk`.
* Thay thế dần các import trong `src/models/` và `src/lib/`.


4. **Bước 4: Xóa code thừa.**
* Xóa các file cũ trong `src/lib/` đã được chuyển đi.


5. **Bước 5: Phát triển tính năng mới (Validation Dynamic).**
* Cập nhật SDK để hỗ trợ schema mới (MF-01).
* Manager Repo chỉ việc `pnpm update` là có logic validation mới.



---
Dựa trên cấu trúc file bạn cung cấp trong `REPOSITORY_STRUCTURE_DOCUMENTATION.md`, tôi sẽ hướng dẫn bạn refactor code trong repo **Game Management** để đáp ứng yêu cầu **MF-01** (Metadata mới) và chuẩn bị kiến trúc để đón **Core SDK** sau này.

Chúng ta sẽ tập trung vào 3 file/module chính:

1. **Model:** `src/models/Game.ts` (Cập nhật Schema lưu trữ).
2. **Logic:** `src/lib/metadata-validator.ts` (Tách logic validate ra khỏi `lazy-validator.ts` cũ).
3. **API:** `src/pages/api/games/[action].ts` (Xử lý flow Save Draft vs Publish).

---

### 1. Cập nhật Database Model (`src/models/Game.ts`)

Chúng ta cần cập nhật Mongoose Schema để hứng được các trường dữ liệu mới. Để đảm bảo tính mở rộng (extensibility), ta sẽ set `strict: false` cho `metadata` hoặc dùng cấu trúc linh hoạt, nhưng tốt nhất là định nghĩa rõ các trường "Core" để Query cho dễ.

```typescript
// src/models/Game.ts
import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa Interface cho Metadata (Sau này sẽ import từ SDK)
export interface IGameMetadata {
  // Các trường Core (MF-01)
  gameType?: string;
  subject?: string;
  grade?: string | number;
  lessonNo?: number;
  lessonSummary?: string;
  textbook?: string;
  thumbnailUrl?: string;
  
  // Các trường Array/Tags
  theme_primary?: string;
  theme_secondary?: string[];
  context_tags?: string[];
  difficulty_levels?: string[]; // ["easy", "medium", "hard"]
  
  // Dynamic fields (Cho phép mở rộng sau này)
  [key: string]: any; 
}

export interface IGame extends Document {
  gameId: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  schemaVersion: number; // QUAN TRỌNG: Để quản lý version metadata
  metadata: IGameMetadata;
  // ... các field cũ (ownerId, versions...)
}

const GameSchema = new Schema<IGame>({
  gameId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  schemaVersion: { type: Number, default: 1 }, // Version hiện tại là 1
  
  // Metadata Object
  metadata: {
    gameType: String,
    subject: String,
    grade: Schema.Types.Mixed, // Chấp nhận string "5" hoặc số 5
    lessonNo: Number,
    lessonSummary: String,
    textbook: String,
    thumbnailUrl: String,
    
    theme_primary: String,
    theme_secondary: [String],
    context_tags: [String],
    difficulty_levels: [String],
  } 
}, { 
  timestamps: true,
  minimize: false, // Giữ object rỗng nếu chưa có data
  strict: false    // Cho phép lưu các trường chưa định nghĩa trong Schema (Tính mở rộng)
});

// Index để tìm kiếm nhanh
GameSchema.index({ 'metadata.subject': 1, 'metadata.grade': 1 });
GameSchema.index({ status: 1 });

export const Game = mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);

```

---

### 2. Xây dựng Logic Validate (`src/lib/metadata-validator.ts`)

Thay vì viết `if/else`, ta dùng thư viện **Zod** để định nghĩa luật chơi. Đây là tiền đề để chuyển file này sang SDK sau này.

Bạn cần cài Zod: `pnpm add zod`

```typescript
// src/lib/metadata-validator.ts
import { z } from 'zod';

// --- SCHEMA ĐỊNH NGHĨA ---

// 1. Schema lỏng (Dùng cho Upload/Save Draft)
// Cho phép null, undefined, empty string
export const DraftMetadataSchema = z.object({
  gameType: z.string().optional(),
  subject: z.string().optional(),
  grade: z.union([z.string(), z.number()]).optional(),
  lessonNo: z.number().optional(),
  lessonSummary: z.string().optional(),
  textbook: z.string().optional(),
  thumbnailUrl: z.string().optional(), // Check URL valid sau
  
  theme_primary: z.string().optional(),
  theme_secondary: z.array(z.string()).optional(),
  context_tags: z.array(z.string()).optional(),
  difficulty_levels: z.array(z.string()).optional(),
});

// 2. Schema chặt (Dùng cho Publish)
// Kế thừa từ Draft nhưng bắt buộc các trường quan trọng
export const PublishMetadataSchema = DraftMetadataSchema.extend({
  gameType: z.string().min(1, { message: "Loại game là bắt buộc" }),
  subject: z.string().min(1, { message: "Môn học là bắt buộc" }),
  grade: z.union([z.string(), z.number()]).refine(val => val !== null && val !== undefined, { message: "Khối lớp là bắt buộc" }),
  
  thumbnailUrl: z.string().url({ message: "Thumbnail phải là đường dẫn hợp lệ" }),
  
  theme_primary: z.string().min(1, { message: "Chủ đề chính là bắt buộc" }),
  difficulty_levels: z.array(z.string()).min(1, { message: "Phải hỗ trợ ít nhất 1 độ khó" })
});

// --- HÀM XỬ LÝ ---

export type ValidationContext = 'draft' | 'publish';

export function validateGameMetadata(data: any, context: ValidationContext) {
  const schema = context === 'publish' ? PublishMetadataSchema : DraftMetadataSchema;
  
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { isValid: true, errors: [] };
  } else {
    // Format lỗi đẹp để trả về UI
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return { isValid: false, errors };
  }
}

```

---

### 3. API Route Update (`src/pages/api/games/update.ts`)

Cập nhật API để xử lý logic update metadata.

```typescript
// src/pages/api/games/update.ts
import type { APIRoute } from 'astro';
import { Game } from '../../../models/Game';
import { validateGameMetadata } from '../../../lib/metadata-validator';
import { connectToDb } from '../../../lib/mongodb';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { gameId, metadata, action } = body; // action: 'save' | 'publish'

    await connectToDb();

    // 1. Validate dựa trên hành động
    const validationContext = action === 'publish' ? 'publish' : 'draft';
    const check = validateGameMetadata(metadata, validationContext);

    // Nếu muốn publish mà data sai -> Chặn luôn
    if (action === 'publish' && !check.isValid) {
      return new Response(JSON.stringify({
        success: false,
        message: "Dữ liệu chưa đủ điều kiện để Publish",
        errors: check.errors
      }), { status: 400 });
    }

    // 2. Chuẩn bị dữ liệu update
    const updateData: any = {
      metadata: metadata,
      schemaVersion: 1 // Gắn version hiện tại vào
    };

    // Nếu publish thành công -> cập nhật status
    if (action === 'publish') {
      updateData.status = 'published';
    }

    // 3. Thực hiện Update vào DB
    const updatedGame = await Game.findOneAndUpdate(
      { gameId },
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!updatedGame) {
      return new Response(JSON.stringify({ success: false, message: "Game not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedGame,
      validation: check // Trả về kết quả validate (kể cả khi save draft) để UI hiện cảnh báo
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
};

```

---

### 4. Giải pháp Bảo trì & Kiểm tra Game cũ (Maintenance Strategy)

Để đảm bảo yêu cầu *"nếu thêm mới thì phải có cách để kiểm tra lại các game cũ"*, bạn sẽ tạo một API hoặc Script (ví dụ `src/pages/api/admin/compliance.ts`) dùng MongoDB Aggregation.

**Ví dụ: Tìm tất cả game đã Publish nhưng thiếu trường `subject` (do yêu cầu mới thêm):**

```typescript
// src/lib/compliance-checker.ts
import { Game } from '../models/Game';

export async function checkMetadataCompliance() {
  // Định nghĩa các trường BẮT BUỘC hiện tại
  const requiredFields = ['subject', 'grade', 'gameType', 'thumbnailUrl'];
  
  // Tạo query dynamic
  const missingConditions = requiredFields.map(field => ({
    [`metadata.${field}`]: { $exists: false }
  }));

  // Query: Status = Published VÀ (Thiếu field 1 HOẶC Thiếu field 2...)
  const nonCompliantGames = await Game.find({
    status: 'published',
    $or: missingConditions
  }).select('gameId title metadata');

  return nonCompliantGames.map(game => {
    // Logic tìm cụ thể thiếu trường nào để report
    const missing = requiredFields.filter(f => !game.metadata?.[f]);
    return {
      gameId: game.gameId,
      title: game.title,
      missingFields: missing
    };
  });
}

```

### Tổng kết

Với cấu trúc này, repo quản lý game của bạn đã:

1. **Linh hoạt:** `strict: false` trong Model cho phép thêm trường mới mà không sửa DB schema.
2. **An toàn:** `metadata-validator.ts` dùng Zod đảm bảo dữ liệu "sạch" trước khi Publish.
3. **Tương thích:** API trả về danh sách lỗi cụ thể để Frontend hiển thị form điền thiếu.
4. **Sẵn sàng cho SDK:** Các file `metadata-validator.ts` và Interface hoàn toàn độc lập, dễ dàng cắt dán sang repo SDK sau này.