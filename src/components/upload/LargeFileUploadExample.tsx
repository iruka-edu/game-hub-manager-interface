'use client';

import { useState } from 'react';
import { uploadGameFile } from '@/lib/upload/large-file-upload';

/**
 * Example component showing how to use the large file upload utility
 * Replace your existing upload logic with this approach
 */
export function LargeFileUploadExample() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadGameFile({
        file,
        gameId: 'com.iruka.example-game', // Replace with actual gameId
        version: '1.0.0', // Replace with actual version
        mongoGameId: undefined, // Optional: MongoDB _id if updating existing game
        onProgress: (p) => setProgress(Math.round(p)),
      });

      console.log('Upload successful:', result);
      alert(`Upload thành công! ${result.uploadInfo.extractedFiles.length} files đã được extract.`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Chọn file ZIP (tối đa 100MB)
        </label>
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
          className="block w-full text-sm"
        />
      </div>

      {file && (
        <div className="text-sm text-gray-600">
          File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          {file.size >= 4 * 1024 * 1024 && (
            <span className="ml-2 text-blue-600">
              (Sẽ upload trực tiếp lên GCS)
            </span>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">
            {progress < 10 && 'Đang chuẩn bị...'}
            {progress >= 10 && progress < 85 && 'Đang upload...'}
            {progress >= 85 && 'Đang xử lý...'}
            {' '}
            {progress}%
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Đang upload...' : 'Upload Game'}
      </button>
    </div>
  );
}
