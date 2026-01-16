import 'dotenv/config';
import { Storage, type StorageOptions } from '@google-cloud/storage';
import { constructFileUrl } from './storage-path';

/**
 * Initialize GCS client with support for multiple credential methods:
 * 1. Individual env vars: GCLOUD_CLIENT_EMAIL, GCLOUD_PRIVATE_KEY (recommended for Vercel)
 * 2. JSON string: GCLOUD_CREDENTIALS (full JSON as string)
 * 3. File path: GOOGLE_APPLICATION_CREDENTIALS (local development)
 */
function createStorageClient(): Storage {
  const options: StorageOptions = {
    projectId: process.env.GCLOUD_PROJECT_ID,
  };

  // Method 1: Individual credential fields (recommended for Vercel/.env)
  if (process.env.GCLOUD_CLIENT_EMAIL && process.env.GCLOUD_PRIVATE_KEY) {
    options.credentials = {
      client_email: process.env.GCLOUD_CLIENT_EMAIL,
      private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
    };
    console.log('[GCS] Using individual credential fields');
  }
  // Method 2: JSON credentials string
  else if (process.env.GCLOUD_CREDENTIALS) {
    try {
      const credentials = JSON.parse(process.env.GCLOUD_CREDENTIALS);
      options.credentials = credentials;
      console.log('[GCS] Using GCLOUD_CREDENTIALS JSON string');
    } catch (e) {
      console.error('[GCS] Failed to parse GCLOUD_CREDENTIALS:', e);
    }
  }
  // Method 3: File path (for local development)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log('[GCS] Using GOOGLE_APPLICATION_CREDENTIALS file path');
  }
  // No credentials found
  else {
    console.warn('[GCS] No credentials found! Set GCLOUD_CLIENT_EMAIL + GCLOUD_PRIVATE_KEY');
  }

  return new Storage(options);
}

const storage = createStorageClient();
const bucketName = process.env.GCLOUD_BUCKET_NAME || 'iruka-edu-mini-game';
export const bucket = storage.bucket(bucketName);
export const CDN_BASE = `https://storage.googleapis.com/${bucketName}`;

/**
 * Download and parse a JSON file from GCS
 */
export const getFileContent = async <T = unknown>(path: string): Promise<T | null> => {
  try {
    const [content] = await bucket.file(path).download();
    return JSON.parse(content.toString()) as T;
  } catch (e) {
    return null;
  }
};

/**
 * Save JSON content to GCS with proper headers
 */
export const saveFileContent = async (
  path: string,
  content: unknown
): Promise<void> => {
  const file = bucket.file(path);
  await file.save(JSON.stringify(content, null, 2), {
    contentType: 'application/json',
    metadata: { cacheControl: 'no-cache' },
  });
};

/**
 * Upload a file buffer to GCS with specified content type and cache rules
 */
export const uploadBuffer = async (
  destination: string,
  buffer: Buffer,
  contentType: string,
  isHtml = false
): Promise<void> => {
  const blob = bucket.file(destination);
  await blob.save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: isHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
    },
  });
};

/**
 * File upload item for batch upload
 */
export interface UploadItem {
  destination: string;
  buffer: Buffer;
  contentType: string;
  isHtml?: boolean;
}

/**
 * Upload multiple files in parallel with concurrency limit
 * @param items - Array of files to upload
 * @param concurrency - Number of parallel uploads (default: 3)
 * @param onProgress - Optional callback for progress updates
 * @returns Array of results with success/error status
 */
export const uploadBufferBatch = async (
  items: UploadItem[],
  concurrency = 3,
  onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<Array<{ destination: string; success: boolean; error?: string }>> => {
  const results: Array<{ destination: string; success: boolean; error?: string }> = [];
  let completed = 0;
  
  // Process items in chunks based on concurrency
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    
    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          await uploadBuffer(item.destination, item.buffer, item.contentType, item.isHtml);
          return { destination: item.destination, success: true };
        } catch (error: any) {
          return { destination: item.destination, success: false, error: error.message };
        }
      })
    );
    
    // Process results
    for (const result of chunkResults) {
      completed++;
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (onProgress) {
          onProgress(completed, items.length, result.value.destination);
        }
      } else {
        results.push({ destination: 'unknown', success: false, error: result.reason?.message });
      }
    }
  }
  
  return results;
};

/**
 * Delete all files with a given prefix
 */
export const deleteFiles = async (prefix: string): Promise<void> => {
  await bucket.deleteFiles({ prefix });
};

/**
 * List all files under a prefix
 */
export const listFiles = async (prefix: string): Promise<string[]> => {
  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => f.name);
};

/**
 * Upload game files (ZIP) to GCS
 * Extracts ZIP and uploads all files to the specified storage path
 * Automatically finds the root directory containing index.html
 * @param buffer - ZIP file buffer
 * @param storagePath - Base path in GCS (e.g., "games/my-game/1.0.0")
 * @param fileName - Original file name for logging
 * @returns Upload result with URL
 */
export const uploadGameFiles = async (
  buffer: Buffer,
  storagePath: string,
  fileName: string
): Promise<{ url: string; files: string[] }> => {
  const JSZip = (await import('jszip')).default;
  
  try {
    // Load ZIP file
    const zip = await JSZip.loadAsync(buffer);
    const uploadedFiles: string[] = [];
    const uploadItems: UploadItem[] = [];

    // Find the root directory containing index.html
    let rootPath = '';
    const allFiles = Object.keys(zip.files);
    
    // Look for index.html in all possible paths
    const indexHtmlPaths = allFiles.filter(path => 
      path.toLowerCase().endsWith('index.html') && !zip.files[path].dir
    );
    
    if (indexHtmlPaths.length === 0) {
      throw new Error('Không tìm thấy file index.html trong ZIP');
    }
    
    // Use the first index.html found and determine its root directory
    const indexPath = indexHtmlPaths[0];
    const pathParts = indexPath.split('/');
    
    if (pathParts.length > 1) {
      // index.html is in a subdirectory, use that as root
      rootPath = pathParts.slice(0, -1).join('/') + '/';
      console.log(`[GCS] Tìm thấy index.html tại: ${indexPath}, sử dụng root: ${rootPath}`);
    } else {
      // index.html is at ZIP root
      rootPath = '';
      console.log(`[GCS] index.html ở root của ZIP`);
    }

    // Iterate through all files in ZIP and filter by root path
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      // Skip directories
      if (zipEntry.dir) continue;

      // Skip files not in the root path
      if (rootPath && !relativePath.startsWith(rootPath)) {
        continue;
      }

      // Get file content
      const content = await zipEntry.async('nodebuffer');
      
      // Determine content type
      const contentType = getContentType(relativePath);
      const isHtml = relativePath.endsWith('.html') || relativePath.endsWith('.htm');
      
      // Calculate relative path from root (remove root prefix)
      const fileRelativePath = rootPath ? relativePath.substring(rootPath.length) : relativePath;
      
      // Build destination path
      const destination = `${storagePath}/${fileRelativePath}`;
      
      uploadItems.push({
        destination,
        buffer: content,
        contentType,
        isHtml,
      });
      
      uploadedFiles.push(fileRelativePath);
    }

    if (uploadItems.length === 0) {
      throw new Error('Không có file nào để upload sau khi xác định root directory');
    }

    // Upload all files in parallel
    console.log(`[GCS] Đang tải lên ${uploadItems.length} file từ ${fileName} (root: ${rootPath || 'ZIP root'})...`);
    
    const results = await uploadBufferBatch(uploadItems, 5, (completed, total, currentFile) => {
      console.log(`[GCS] Tiến độ: ${completed}/${total} - ${currentFile}`);
    });

    // Check for errors
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      console.error('[GCS] Một số file tải lên thất bại:', errors);
      throw new Error(`Tải lên thất bại cho ${errors.length} file`);
    }

    console.log(`[GCS] Tải lên thành công ${uploadedFiles.length} file`);

    // Return the entry URL (index.html)
    const entryUrl = constructFileUrl(storagePath, 'index.html', CDN_BASE);
    
    return {
      url: entryUrl,
      files: uploadedFiles,
    };
  } catch (error: any) {
    console.error('[GCS] Lỗi tải lên game:', error);
    throw new Error(`Lỗi tải lên game: ${error.message}`);
  }
};

/**
 * Extract ZIP file that's already uploaded to GCS
 * Downloads ZIP from GCS, extracts it, and uploads extracted files
 * @param storagePath - Base path in GCS (e.g., "games/my-game/1.0.0")
 * @param zipFileName - Name of the ZIP file in GCS
 * @returns Extraction result with URL and file list
 */
export const extractZipFromGCS = async (
  storagePath: string,
  zipFileName: string
): Promise<{ url: string; files: string[] }> => {
  const JSZip = (await import('jszip')).default;
  
  try {
    // Download ZIP from GCS
    const zipPath = `${storagePath}/${zipFileName}`;
    console.log(`[GCS] Downloading ZIP from ${zipPath}...`);
    
    const [buffer] = await bucket.file(zipPath).download();
    
    // Load ZIP file
    const zip = await JSZip.loadAsync(buffer);
    const uploadedFiles: string[] = [];
    const uploadItems: UploadItem[] = [];

    // Find the root directory containing index.html
    let rootPath = '';
    const allFiles = Object.keys(zip.files);
    
    const indexHtmlPaths = allFiles.filter(path => 
      path.toLowerCase().endsWith('index.html') && !zip.files[path].dir
    );
    
    if (indexHtmlPaths.length === 0) {
      throw new Error('Không tìm thấy file index.html trong ZIP');
    }
    
    const indexPath = indexHtmlPaths[0];
    const pathParts = indexPath.split('/');
    
    if (pathParts.length > 1) {
      rootPath = pathParts.slice(0, -1).join('/') + '/';
      console.log(`[GCS] Tìm thấy index.html tại: ${indexPath}, sử dụng root: ${rootPath}`);
    } else {
      rootPath = '';
      console.log(`[GCS] index.html ở root của ZIP`);
    }

    // Extract files
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      if (rootPath && !relativePath.startsWith(rootPath)) continue;

      const content = await zipEntry.async('nodebuffer');
      const contentType = getContentType(relativePath);
      const isHtml = relativePath.endsWith('.html') || relativePath.endsWith('.htm');
      const fileRelativePath = rootPath ? relativePath.substring(rootPath.length) : relativePath;
      const destination = `${storagePath}/${fileRelativePath}`;
      
      uploadItems.push({
        destination,
        buffer: content,
        contentType,
        isHtml,
      });
      
      uploadedFiles.push(fileRelativePath);
    }

    if (uploadItems.length === 0) {
      throw new Error('Không có file nào để upload sau khi xác định root directory');
    }

    console.log(`[GCS] Đang tải lên ${uploadItems.length} file đã extract...`);
    
    const results = await uploadBufferBatch(uploadItems, 5, (completed, total, currentFile) => {
      console.log(`[GCS] Tiến độ: ${completed}/${total} - ${currentFile}`);
    });

    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      console.error('[GCS] Một số file tải lên thất bại:', errors);
      throw new Error(`Tải lên thất bại cho ${errors.length} file`);
    }

    // Delete the original ZIP file
    console.log(`[GCS] Xóa file ZIP gốc: ${zipPath}`);
    await bucket.file(zipPath).delete();

    console.log(`[GCS] Extract thành công ${uploadedFiles.length} file`);

    const entryUrl = constructFileUrl(storagePath, 'index.html', CDN_BASE);
    
    return {
      url: entryUrl,
      files: uploadedFiles,
    };
  } catch (error: any) {
    console.error('[GCS] Lỗi extract ZIP:', error);
    throw new Error(`Lỗi extract ZIP: ${error.message}`);
  }
};

/**
 * Get content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // Web
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    
    // Fonts
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'eot': 'application/vnd.ms-fontobject',
    
    // Data
    'wasm': 'application/wasm',
    'bin': 'application/octet-stream',
    'data': 'application/octet-stream',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}
