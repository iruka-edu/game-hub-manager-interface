import { Storage } from '@google-cloud/storage';

// Initialize GCS client
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

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
 * Note: Bucket uses uniform bucket-level access, so no makePublic() needed
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
 * Note: Bucket uses uniform bucket-level access, so no makePublic() needed
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
