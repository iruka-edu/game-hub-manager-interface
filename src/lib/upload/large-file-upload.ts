/**
 * Large file upload utility for direct-to-GCS uploads
 * Bypasses Vercel serverless function size limits
 */

interface UploadOptions {
  gameId: string;
  version: string;
  mongoGameId?: string;
  file: File;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  success: boolean;
  version: {
    _id: string;
    version: string;
    storagePath: string;
    entryUrl: string;
    buildSize: number;
    filesCount: number;
  };
  game: {
    _id: string;
    gameId: string;
    title: string;
  };
  uploadInfo: {
    message: string;
    extractedFiles: string[];
  };
}

const SMALL_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB

/**
 * Upload game file with automatic routing based on size
 * - Small files (<4MB): Direct upload through API route
 * - Large files (>=4MB): Direct upload to GCS with signed URL
 */
export async function uploadGameFile(options: UploadOptions): Promise<UploadResult> {
  const { file, gameId, version, mongoGameId, onProgress } = options;

  // For small files, use the traditional upload endpoint
  if (file.size < SMALL_FILE_THRESHOLD) {
    return uploadSmallFile(options);
  }

  // For large files, use signed URL upload
  return uploadLargeFile(options);
}

/**
 * Upload small file through API route (traditional method)
 */
async function uploadSmallFile(options: UploadOptions): Promise<UploadResult> {
  const { file, gameId, version, mongoGameId, onProgress } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('gameId', gameId);
  formData.append('version', version);
  if (mongoGameId) {
    formData.append('mongoGameId', mongoGameId);
  }

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch (e) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', '/api/games/upload');
    xhr.send(formData);
  });
}

/**
 * Upload large file directly to GCS using signed URL
 */
async function uploadLargeFile(options: UploadOptions): Promise<UploadResult> {
  const { file, gameId, version, mongoGameId, onProgress } = options;

  try {
    // Step 1: Get signed URL
    if (onProgress) onProgress(5);
    
    const urlResponse = await fetch('/api/games/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId,
        version,
        mongoGameId,
        fileName: file.name,
      }),
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, storagePath, fileName } = await urlResponse.json();

    // Step 2: Upload directly to GCS
    if (onProgress) onProgress(10);

    try {
      await uploadToGCS(file, uploadUrl, (progress) => {
        // Map 10-80% to upload progress
        if (onProgress) onProgress(10 + progress * 0.7);
      });
    } catch (gcsError: any) {
      // GCS upload failed - the server will handle rollback
      throw new Error(`Upload lên GCS thất bại: ${gcsError.message}`);
    }

    // Step 3: Finalize upload (extract ZIP and create version)
    if (onProgress) onProgress(85);

    const completeResponse = await fetch('/api/games/upload-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId,
        version,
        mongoGameId,
        storagePath,
        fileName,
        fileSize: file.size,
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      // Server has already handled rollback if needed
      throw new Error(error.error || 'Failed to finalize upload');
    }

    if (onProgress) onProgress(100);

    return await completeResponse.json();
  } catch (error: any) {
    throw new Error(error.message || 'Upload failed');
  }
}

/**
 * Upload file to GCS using signed URL with progress tracking
 */
function uploadToGCS(
  file: File,
  signedUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`GCS upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during GCS upload'));
    });

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', 'application/zip');
    xhr.send(file);
  });
}
