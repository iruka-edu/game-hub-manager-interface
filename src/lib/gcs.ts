import 'dotenv/config';
import { Storage, type StorageOptions } from '@google-cloud/storage';

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
