Dựa trên các tài liệu bạn cung cấp (đặc biệt là `MANIFEST.md`, cấu trúc `registry/index.json` và quy trình upload thủ công bằng script), tôi sẽ thiết kế lại project Astro để chuyển đổi quy trình CLI sang **Web Dashboard**.

Giải pháp này tập trung vào 3 yêu cầu cốt lõi của bạn:

1.  **Validation chặt chẽ:** Kiểm tra cấu trúc folder (phải có `index.html`, `manifest.json`) trước khi upload.
2.  **Workflow an toàn:** Upload -\> Validate -\> User confirm -\> Push GCS & Update Registry.
3.  **Quản lý toàn diện (CRUD):** Dashboard hiển thị danh sách game, các version, và cho phép xóa/sửa.

### Cấu trúc Project

```text
src/
├── components/
│   ├── GameUploadForm.tsx   (React: Xử lý chọn folder & validate client-side)
│   ├── GameList.tsx         (React: Hiển thị danh sách & version)
│   └── Layout.astro
├── lib/
│   ├── gcs.ts               (Kết nối Google Cloud Storage)
│   ├── registry.ts          (Quản lý file registry/index.json)
│   └── validator.ts         (Logic kiểm tra file)
├── pages/
│   ├── index.astro          (Dashboard)
│   ├── upload.astro         (Trang upload)
│   └── api/
│       ├── games/
│       │   ├── list.ts      (GET: Lấy registry)
│       │   ├── upload.ts    (POST: Upload game mới)
│       │   └── delete.ts    (DELETE: Xóa game/version)
```

-----

### Bước 1: Backend Core (`src/lib`)

Chúng ta cần 3 file chính để xử lý logic nghiệp vụ.

#### 1\. `src/lib/gcs.ts` - Kết nối Storage

```typescript
import { Storage } from '@google-cloud/storage';

// Khởi tạo client GCS
// Đảm bảo bạn đã set biến môi trường GOOGLE_APPLICATION_CREDENTIALS
const storage = new Storage();
const bucketName = process.env.GCLOUD_BUCKET_NAME || 'iruka-edu-mini-game';
export const bucket = storage.bucket(bucketName);
export const CDN_BASE = `https://storage.googleapis.com/${bucketName}`;

export const getFileContent = async (path: string) => {
  try {
    const [content] = await bucket.file(path).download();
    return JSON.parse(content.toString());
  } catch (e) {
    return null;
  }
};

export const saveFileContent = async (path: string, content: any, isPublic = true) => {
  const file = bucket.file(path);
  await file.save(JSON.stringify(content, null, 2), {
    contentType: 'application/json',
    metadata: { cacheControl: 'no-cache' } // Registry luôn no-cache
  });
  if (isPublic) await file.makePublic();
};
```

#### 2\. `src/lib/registry.ts` - Quản lý Registry (Database giả lập)

File này thay thế cho logic trong `upload-registry.mjs`.

```typescript
import { getFileContent, saveFileContent, CDN_BASE } from './gcs';

const REGISTRY_PATH = 'registry/index.json';

export interface GameEntry {
  id: string;
  version: string;
  latest: string;
  versions: string[];
  entryUrl: string;
  manifest: any; // Nội dung file manifest.json
  uploadedAt: string;
}

export const RegistryManager = {
  async get() {
    const data = await getFileContent(REGISTRY_PATH);
    return data || { games: [], generatedAt: new Date().toISOString() };
  },

  async updateGame(gameId: string, version: string, manifest: any) {
    const registry = await this.get();
    let gameIndex = registry.games.findIndex((g: any) => g.id === gameId);

    const newGameData = {
      id: gameId,
      title: manifest.title || gameId,
      version: version, // Version hiện tại vừa up
      latest: version,  // Tạm thời coi version mới nhất là version vừa up (cần so sánh semver nếu kỹ hơn)
      versions: [],     // Sẽ populate bên dưới
      entryUrl: `${CDN_BASE}/games/${gameId}/${version}/index.html`,
      manifest: manifest,
      uploadedAt: new Date().toISOString(),
      // Các trường metadata từ manifest
      capabilities: manifest.capabilities || [],
      minHubVersion: manifest.minHubVersion,
    };

    if (gameIndex === -1) {
      // Game mới hoàn toàn
      newGameData.versions = [version];
      registry.games.push(newGameData);
    } else {
      // Update game cũ
      const existingGame = registry.games[gameIndex];
      const versionSet = new Set([...existingGame.versions, version]);
      // Sắp xếp version logic (dùng thư viện 'semver' ở đây là tốt nhất)
      newGameData.versions = Array.from(versionSet).sort(); 
      
      // Merge data
      registry.games[gameIndex] = { ...existingGame, ...newGameData };
    }

    registry.generatedAt = new Date().toISOString();
    
    // Lưu ngược lên GCS
    await saveFileContent(REGISTRY_PATH, registry);
    return registry;
  },

  async deleteVersion(gameId: string, version: string) {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g: any) => g.id === gameId);
    
    if (gameIndex === -1) return false;

    const game = registry.games[gameIndex];
    game.versions = game.versions.filter((v: string) => v !== version);

    if (game.versions.length === 0) {
      // Hết version thì xóa luôn game khỏi registry
      registry.games.splice(gameIndex, 1);
    } else {
      // Cập nhật lại latest version (đơn giản là lấy cái cuối mảng)
      game.latest = game.versions[game.versions.length - 1];
      game.version = game.latest;
      game.entryUrl = `${CDN_BASE}/games/${gameId}/${game.latest}/index.html`;
    }

    await saveFileContent(REGISTRY_PATH, registry);
    return true;
  }
};
```

#### 3\. `src/lib/validator.ts` - Logic kiểm tra

```typescript
export const validateGameFiles = (files: File[]) => {
  const errors: string[] = [];
  
  // 1. Kiểm tra file thiết yếu
  const hasIndex = files.some(f => f.name === 'index.html' || f.webkitRelativePath.endsWith('/index.html'));
  const hasManifest = files.some(f => f.name === 'manifest.json' || f.webkitRelativePath.endsWith('/manifest.json'));

  if (!hasIndex) errors.push("Thiếu file 'index.html'. Đây là entry point bắt buộc.");
  if (!hasManifest) errors.push("Thiếu file 'manifest.json'.");

  return {
    valid: errors.length === 0,
    errors
  };
};
```

-----

### Bước 2: API Routes (`src/pages/api`)

#### 1\. `src/pages/api/games/upload.ts` (POST)

Xử lý upload thực sự lên GCS và cập nhật Registry.

```typescript
import type { APIRoute } from 'astro';
import { bucket, CDN_BASE } from '../../../lib/gcs';
import { RegistryManager } from '../../../lib/registry';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const manifestFile = files.find(f => f.name.endsWith('manifest.json'));

  if (!manifestFile) {
    return new Response(JSON.stringify({ error: 'Không tìm thấy manifest.json trong gói upload' }), { status: 400 });
  }

  try {
    // 1. Parse Manifest để lấy ID và Version
    const manifestContent = await manifestFile.text();
    const manifest = JSON.parse(manifestContent);
    const { id, version } = manifest;

    if (!id || !version) {
      return new Response(JSON.stringify({ error: 'Manifest thiếu id hoặc version' }), { status: 400 });
    }

    // 2. Upload Files lên GCS
    const uploadPromises = files.map(async (file) => {
      // webkitRelativePath ví dụ: "dist/assets/image.png"
      // Ta cần: "games/<id>/<version>/assets/image.png"
      
      // Loại bỏ folder gốc (ví dụ 'dist') khỏi đường dẫn
      const pathParts = (file.webkitRelativePath || file.name).split('/');
      const cleanPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : file.name;
      
      const destination = `games/${id}/${version}/${cleanPath}`;
      const blob = bucket.file(destination);

      await blob.save(Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        resumable: false,
        metadata: {
          // Cache rule theo tài liệu của bạn
          cacheControl: cleanPath === 'index.html' 
            ? 'no-cache' 
            : 'public, max-age=31536000, immutable'
        }
      });
    });

    await Promise.all(uploadPromises);

    // 3. Cập nhật Registry
    await RegistryManager.updateGame(id, version, manifest);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Đã upload ${id} v${version} thành công!`,
      entryUrl: `${CDN_BASE}/games/${id}/${version}/index.html`
    }), { status: 200 });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
```

-----

### Bước 3: Frontend Component (React)

#### 1\. `src/components/GameUploadForm.tsx`

Component này xử lý việc chọn folder, validate client-side và hiển thị tiến trình.

```tsx
import React, { useState } from 'react';

export default function GameUploadForm() {
  const [status, setStatus] = useState<'idle' | 'validating' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [manifestInfo, setManifestInfo] = useState<any>(null);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setStatus('validating');
    setMessage('Đang kiểm tra cấu trúc...');

    // 1. Validate Client-side
    const indexFile = files.find(f => f.name === 'index.html' || f.webkitRelativePath.endsWith('/index.html'));
    const manifestFile = files.find(f => f.name === 'manifest.json' || f.webkitRelativePath.endsWith('/manifest.json'));

    if (!indexFile) {
      setStatus('error');
      setMessage('Lỗi: Không tìm thấy file index.html');
      return;
    }

    if (!manifestFile) {
      setStatus('error');
      setMessage('Lỗi: Không tìm thấy file manifest.json');
      return;
    }

    // 2. Đọc thử manifest để hiển thị thông tin xác nhận
    try {
      const text = await manifestFile.text();
      const json = JSON.parse(text);
      if (!json.id || !json.version) {
        throw new Error('Manifest thiếu id hoặc version');
      }
      setManifestInfo(json);
      setStatus('idle'); 
      setMessage('Validation OK. Sẵn sàng upload.');
    } catch (err) {
      setStatus('error');
      setMessage('Lỗi đọc Manifest: ' + (err as Error).message);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById('folderInput') as HTMLInputElement;
    const files = input.files;
    
    if (!files || files.length === 0) return;

    setStatus('uploading');
    setMessage(`Đang upload ${files.length} file... Vui lòng không tắt tab.`);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => window.location.href = '/', 2000); // Redirect về trang chủ
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Upload thất bại: ' + (err as Error).message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Upload Game Mới</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn thư mục dist (chứa index.html & manifest.json)
        </label>
        <input 
          id="folderInput"
          type="file" 
          // @ts-ignore
          webkitdirectory="" directory="" multiple=""
          onChange={handleFolderSelect}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Vùng hiển thị thông tin Manifest xác nhận */}
      {manifestInfo && status !== 'error' && (
        <div className="bg-blue-50 p-4 rounded mb-4 text-sm border border-blue-100">
          <p><strong>Game ID:</strong> {manifestInfo.id}</p>
          <p><strong>Title:</strong> {manifestInfo.title}</p>
          <p><strong>Version:</strong> {manifestInfo.version}</p>
          <p><strong>Runtime:</strong> {manifestInfo.runtime}</p>
          <p className="text-gray-500 mt-1 italic">Vui lòng kiểm tra kỹ thông tin trước khi Upload.</p>
        </div>
      )}

      {/* Thông báo trạng thái */}
      {message && (
        <div className={`p-3 rounded mb-4 text-sm ${
          status === 'error' ? 'bg-red-100 text-red-700' :
          status === 'success' ? 'bg-green-100 text-green-700' :
          status === 'uploading' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-700'
        }`}>
          {message}
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={status === 'uploading' || !manifestInfo || status === 'error'}
        className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${
          status === 'uploading' || !manifestInfo || status === 'error'
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {status === 'uploading' ? 'Đang Upload...' : 'Xác nhận & Upload lên GCS'}
      </button>
    </div>
  );
}
```

#### 2\. `src/components/GameManager.tsx` (Dashboard)

Hiển thị danh sách và quản lý version.

```tsx
import React, { useState } from 'react';

interface Game {
  id: string;
  title: string;
  versions: string[];
  latest: string;
  entryUrl: string;
}

export default function GameManager({ initialGames }: { initialGames: Game[] }) {
  const [games, setGames] = useState(initialGames);
  const [loading, setLoading] = useState(false);

  const handleDeleteVersion = async (gameId: string, version: string) => {
    if (!confirm(`Bạn có chắc muốn xóa version ${version} của game ${gameId}? Hành động này sẽ xóa file trên GCS.`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/games/delete?id=${gameId}&version=${version}`, { method: 'DELETE' });
      if (res.ok) {
        // Refresh trang hoặc update state cục bộ
        window.location.reload(); 
      } else {
        alert('Xóa thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {games.map(game => (
        <div key={game.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{game.title} <span className="text-sm font-normal text-gray-500">({game.id})</span></h3>
              <a href={game.entryUrl} target="_blank" className="text-blue-600 hover:underline text-sm">Chơi bản mới nhất ({game.latest})</a>
            </div>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Versions History:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Version</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {game.versions.map(ver => (
                    <tr key={ver} className="border-b">
                      <td className="px-4 py-2 font-medium text-gray-900">{ver}</td>
                      <td className="px-4 py-2">
                        <button 
                          onClick={() => handleDeleteVersion(game.id, ver)}
                          className="text-red-600 hover:text-red-900 font-medium"
                          disabled={loading}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

-----

### Bước 4: Trang Chính (`src/pages/index.astro`)

```astro
---
import Layout from '../layouts/Layout.astro';
import GameManager from '../components/GameManager';
import { RegistryManager } from '../lib/registry';

// SSR: Lấy dữ liệu Registry ngay khi load trang
const registry = await RegistryManager.get();
const games = registry.games;
---

<Layout title="Iruka Game Hub Manager">
  <main class="max-w-6xl mx-auto p-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Game Hub Manager</h1>
        <p class="text-gray-600 mt-2">Quản lý mini-games trên Google Cloud Storage</p>
      </div>
      <a href="/upload" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
        <span>+ Upload Game Mới</span>
      </a>
    </div>

    <GameManager client:load initialGames={games} />
    
  </main>
</Layout>
```

### Bước 5: Trang Upload (`src/pages/upload.astro`)

```astro
---
import Layout from '../layouts/Layout.astro';
import GameUploadForm from '../components/GameUploadForm';
---

<Layout title="Upload Game - Iruka Hub">
  <main class="max-w-2xl mx-auto p-8 pt-12">
    <div class="mb-6">
      <a href="/" class="text-gray-500 hover:text-gray-900 mb-4 inline-block">&larr; Quay lại Dashboard</a>
      <h1 class="text-2xl font-bold text-gray-900">Upload Game Package</h1>
      <p class="text-sm text-gray-600 mt-1">Hệ thống sẽ tự động validate manifest.json và cấu trúc thư mục.</p>
    </div>

    <GameUploadForm client:load />

    <div class="mt-8 p-4 bg-gray-50 rounded text-sm text-gray-600">
      <h3 class="font-bold mb-2">Lưu ý trước khi upload:</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Folder upload phải là folder build cuối cùng (thường là <code>dist</code>).</li>
        <li>Bắt buộc phải có file <code>manifest.json</code> đúng chuẩn Iruka SDK.</li>
        <li>Version trong manifest phải là duy nhất hoặc cao hơn version cũ (nếu muốn update).</li>
      </ul>
    </div>
  </main>
</Layout>
```

-----

### Tổng kết luồng hoạt động mới

1.  **Member truy cập `/upload`**:
      * Kéo thả folder `dist`.
      * **Client-side Validation:** `GameUploadForm` đọc file ngay trên trình duyệt. Nếu thiếu `index.html` hoặc `manifest.json`, báo lỗi ngay lập tức, nút Upload bị disable.
      * Nếu Manifest hợp lệ, hiển thị thông tin (ID, Version, Title) để member check lại.
2.  **Upload**:
      * Member bấm "Upload". Dữ liệu gửi về `/api/games/upload`.
      * **Server-side**: Code parse lại Manifest -\> Upload file lên GCS theo path `games/{id}/{version}/...` -\> Update file `registry/index.json`.
3.  **Quản lý**:
      * Truy cập `/`, thấy danh sách các game load từ `registry/index.json`.
      * Có thể xóa từng version cụ thể (API `/api/games/delete` sẽ gọi GCS delete file và update registry).

Bạn có thể chạy `pnpm run dev` để test ngay luồng này. Nhớ cấu hình `.env` đầy đủ.