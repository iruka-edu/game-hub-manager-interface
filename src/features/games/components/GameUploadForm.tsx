'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

interface ThumbnailData {
  file: File | null;
  preview: string | null;
}

export function GameUploadForm({ meta }: GameUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopThumbRef = useRef<HTMLInputElement>(null);
  const mobileThumbRef = useRef<HTMLInputElement>(null);

  // ZIP file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Thumbnail states
  const [desktopThumbnail, setDesktopThumbnail] = useState<ThumbnailData>({ file: null, preview: null });
  const [mobileThumbnail, setMobileThumbnail] = useState<ThumbnailData>({ file: null, preview: null });
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [error, setError] = useState('');

  const [manifest, setManifest] = useState<ManifestData>({
    gameId: meta.backendGameId || 'my-awesome-game',
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

  // Handle ZIP file selection
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Vui lòng chọn file ZIP');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File quá lớn. Tối đa 100MB');
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

  // Handle thumbnail selection
  const handleThumbnailSelect = (file: File, type: 'desktop' | 'mobile') => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh quá lớn. Tối đa 5MB');
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    
    if (type === 'desktop') {
      // Revoke old preview URL
      if (desktopThumbnail.preview) URL.revokeObjectURL(desktopThumbnail.preview);
      setDesktopThumbnail({ file, preview });
    } else {
      if (mobileThumbnail.preview) URL.revokeObjectURL(mobileThumbnail.preview);
      setMobileThumbnail({ file, preview });
    }
    setError('');
  };

  const removeThumbnail = (type: 'desktop' | 'mobile') => {
    if (type === 'desktop') {
      if (desktopThumbnail.preview) URL.revokeObjectURL(desktopThumbnail.preview);
      setDesktopThumbnail({ file: null, preview: null });
    } else {
      if (mobileThumbnail.preview) URL.revokeObjectURL(mobileThumbnail.preview);
      setMobileThumbnail({ file: null, preview: null });
    }
  };

  const handlePublish = async () => {
    if (!uploadedFile) {
      setError('Vui lòng chọn file ZIP game');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Step 1: Create game record
      setUploadStep('Đang tạo game...');
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

      setUploadProgress(15);

      const createData = await createResponse.json();
      if (!createResponse.ok && !createData.existingGame) {
        throw new Error(createData.error || 'Không thể tạo game');
      }

      const mongoGameId = createData.game?._id || createData.existingGame?._id;
      if (!mongoGameId) {
        throw new Error('Không tìm thấy Game ID');
      }

      setUploadProgress(25);

      // Step 2: Upload ZIP file to GCS
      setUploadStep('Đang tải file game lên...');
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('gameId', manifest.gameId);
      formData.append('version', manifest.version);
      formData.append('mongoGameId', mongoGameId);

      const uploadResponse = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(60);

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Không thể tải file lên');
      }

      // Step 3: Upload thumbnails (if provided)
      if (desktopThumbnail.file || mobileThumbnail.file) {
        setUploadStep('Đang tải thumbnail...');
        
        const thumbFormData = new FormData();
        thumbFormData.append('mongoGameId', mongoGameId);
        
        if (desktopThumbnail.file) {
          thumbFormData.append('thumbnailDesktop', desktopThumbnail.file);
        }
        if (mobileThumbnail.file) {
          thumbFormData.append('thumbnailMobile', mobileThumbnail.file);
        }

        const thumbResponse = await fetch('/api/games/upload-thumbnail', {
          method: 'POST',
          body: thumbFormData,
        });

        setUploadProgress(90);

        if (!thumbResponse.ok) {
          const thumbData = await thumbResponse.json();
          console.warn('Thumbnail upload warning:', thumbData.error);
          // Don't fail the whole upload for thumbnail errors
        }
      }

      setUploadProgress(100);
      setUploadStep('Hoàn thành!');

      // Success - redirect to game detail
      setTimeout(() => {
        router.push(`/console/games/${mongoGameId}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      setUploadStep('');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = uploadedFile && manifest.gameId && manifest.version;

  return (
    <div className="space-y-6">
      {/* ZIP Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">File Game (ZIP)</h3>
        <p className="text-sm text-slate-500 mb-4">Tải lên file ZIP chứa game HTML5. Tối đa 100MB.</p>

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
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Xóa file
              </button>
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

        {/* ZIP Structure Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Tự động phát hiện cấu trúc ZIP</h4>
              <p className="text-sm text-blue-700">
                Hệ thống sẽ tự động tìm thư mục chứa <code className="bg-blue-100 px-1 rounded">index.html</code> và coi đó là root của game. 
                Các thư mục như <code className="bg-blue-100 px-1 rounded">build/</code>, <code className="bg-blue-100 px-1 rounded">dist/</code>, 
                <code className="bg-blue-100 px-1 rounded">src/</code> sẽ được xử lý tự động.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Thumbnail (Tùy chọn)</h3>
        <p className="text-sm text-slate-500 mb-4">Ảnh preview cho game. Hỗ trợ PNG, JPG, WebP. Tối đa 5MB.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desktop Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Desktop (308×211)
            </label>
            <div
              onClick={() => desktopThumbRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
                desktopThumbnail.preview ? 'border-green-400' : 'border-slate-300 hover:border-indigo-400'
              }`}
              style={{ aspectRatio: '308/211' }}
            >
              <input
                ref={desktopThumbRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files?.[0] && handleThumbnailSelect(e.target.files[0], 'desktop')}
                className="hidden"
              />
              
              {desktopThumbnail.preview ? (
                <>
                  <Image
                    src={desktopThumbnail.preview}
                    alt="Desktop thumbnail"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeThumbnail('desktop'); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">308 × 211</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile (343×170)
            </label>
            <div
              onClick={() => mobileThumbRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
                mobileThumbnail.preview ? 'border-green-400' : 'border-slate-300 hover:border-indigo-400'
              }`}
              style={{ aspectRatio: '343/170' }}
            >
              <input
                ref={mobileThumbRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files?.[0] && handleThumbnailSelect(e.target.files[0], 'mobile')}
                className="hidden"
              />
              
              {mobileThumbnail.preview ? (
                <>
                  <Image
                    src={mobileThumbnail.preview}
                    alt="Mobile thumbnail"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeThumbnail('mobile'); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">343 × 170</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manifest Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin Game</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Game ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manifest.gameId}
              onChange={(e) => setManifest({ ...manifest, gameId: e.target.value })}
              placeholder="com.iruka.my-game"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">Định dạng: chữ thường, số, dấu chấm, gạch ngang</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manifest.version}
              onChange={(e) => setManifest({ ...manifest, version: e.target.value })}
              placeholder="1.0.0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">Định dạng SemVer: X.Y.Z</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Runtime</label>
            <select
              value={manifest.runtime}
              onChange={(e) => setManifest({ ...manifest, runtime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              placeholder="index.html"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-700">{uploadStep}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">{uploadProgress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          onClick={handlePublish}
          disabled={uploading || !canSubmit}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Đăng Game
            </>
          )}
        </button>
      </div>
    </div>
  );
}
