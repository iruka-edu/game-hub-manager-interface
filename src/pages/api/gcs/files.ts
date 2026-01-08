import type { APIRoute } from 'astro';
import { Storage } from '@google-cloud/storage';
import { getUserFromRequest } from '../../../lib/session';
import { gcsCache } from '../../../lib/gcsCache';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Auth check
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Role check - only admin
    const hasRole = (role: string) => user?.roles?.includes(role as any) ?? false;
    if (!hasRole('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    const cacheKey = 'gcs-files';
    
    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedFiles = gcsCache.get(cacheKey);
      if (cachedFiles) {
        return new Response(JSON.stringify({ 
          files: cachedFiles,
          total: cachedFiles.length,
          cached: true,
          cacheTime: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Initialize Google Cloud Storage
    const projectId = process.env.GCLOUD_PROJECT_ID;
    const bucketName = process.env.GCLOUD_BUCKET_NAME;
    const clientEmail = process.env.GCLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GCLOUD_PRIVATE_KEY;

    if (!projectId || !bucketName || !clientEmail || !privateKey) {
      throw new Error('Missing required GCS environment variables');
    }

    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });

    const bucket = storage.bucket(bucketName);

    // List all files in the games/ directory
    const [files] = await bucket.getFiles({
      prefix: 'games/',
      maxResults: 1000, // Adjust as needed
    });

    const fileList = files.map(file => ({
      name: file.name,
      size: parseInt(file.metadata.size || '0'),
      timeCreated: file.metadata.timeCreated,
      updated: file.metadata.updated,
      contentType: file.metadata.contentType,
    }));

    // Cache the results for 5 minutes
    gcsCache.set(cacheKey, fileList, 5 * 60 * 1000);

    return new Response(JSON.stringify({ 
      files: fileList,
      total: fileList.length,
      cached: false,
      loadTime: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to list GCS files:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to list GCS files',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};