'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface GameMeta {
  grade: string;
  subject: string;
  lesson: string[];
  backendGameId: string;
  level: string;
  skills: string[];
  themes: string[];
  linkGithub: string;
  quyenSach: string;
}

interface GameUploadFormProps {
  meta: GameMeta;
}

interface ManifestData {
  gameId: string;
  version: string;
  runtime: string;
  entryPoint: string;
}

export function GameUploadForm({ meta }: GameUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const [manifest, setManifest] = useState<ManifestData>({
    gameId: 'my-awesome-game',
    version: '1.0.0',
    runtime: 'HTML5',
    entryPoint: 'index.html',
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Vui lòng chọn file ZIP');
      return;
    }
    setUploadedFile(file);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handlePublish = async () => {
    if (!uploadedFile) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Step 1: Create game record
      const createResponse = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manifest.gameId,
          gameId: manifest.gameId,
          subject: meta.subject,
          grade: meta.grade,
          lesson: meta.lesson,
          backendGameId: meta.backendGameId,
          level: meta.level,
          skills: meta.skills,
          themes: meta.themes,
          linkGithub: meta.linkGithub,
          gameType: 'html5',
          description: `Game được tải lên từ ${meta.linkGithub}`,
        }),
      });

      setUploadProgress(20);

      const createData = await createResponse.json();
      if (!createResponse.ok && !createData.existingGame) {
        throw new Error(createData.error || 'Không thể tạo game');
      }

      const gameId = createData.game?._id || createData.existingGame?._id;
      if (!gameId) {
        throw new Error('Không tìm thấy Game ID');
      }

      setUploadProgress(40);

      // Step 2: Upload file to GCS
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('gameId', manifest.gameId);
      formData.append('version', manifest.version);

      const uploadResponse = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Không thể tải file lên');
      }

      setUploadProgress(100);

      // Success - redirect to game detail
      router.push(`/console/games/${gameId}`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Tải lên file game</h3>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            uploadedFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {uploadedFile ? (
            <div>
              <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium text-slate-900">{uploadedFile.name}</p>
              <p className="text-sm text-slate-500">{formatFileSize(uploadedFile.size)}</p>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-medium text-slate-700">Kéo thả file ZIP vào đây</p>
              <p className="text-sm text-slate-500">hoặc click để chọn file</p>
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2 text-center">Đang tải lên... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Manifest Form */}
      {uploadedFile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin Manifest</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Game ID</label>
              <input
                type="text"
                value={manifest.gameId}
                onChange={(e) => setManifest({ ...manifest, gameId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
              <input
                type="text"
                value={manifest.version}
                onChange={(e) => setManifest({ ...manifest, version: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Runtime</label>
              <select
                value={manifest.runtime}
                onChange={(e) => setManifest({ ...manifest, runtime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HTML5">HTML5</option>
                <option value="Unity">Unity WebGL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Entry Point</label>
              <input
                type="text"
                value={manifest.entryPoint}
                onChange={(e) => setManifest({ ...manifest, entryPoint: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      {uploadedFile && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setUploadedFile(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handlePublish}
            disabled={uploading}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? 'Đang xử lý...' : 'Đăng Game'}
          </button>
        </div>
      )}
    </div>
  );
}
