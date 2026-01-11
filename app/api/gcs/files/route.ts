import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { getUserFromHeaders } from '@/lib/auth';
import { gcsCache } from '@/src/lib/gcsCache';

/**
 * GET /api/gcs/files
 * List all files in GCS games directory (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const cacheKey = 'gcs-files';

    if (!forceRefresh) {
      const cachedFiles = gcsCache.get(cacheKey);
      if (cachedFiles) {
        return NextResponse.json({
          files: cachedFiles,
          total: cachedFiles.length,
          cached: true,
          cacheTime: new Date().toISOString(),
        });
      }
    }

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

    const [files] = await bucket.getFiles({
      prefix: 'games/',
      maxResults: 1000,
    });

    const fileList = files.map((file) => ({
      name: file.name,
      size: parseInt(String(file.metadata.size || '0')),
      timeCreated: file.metadata.timeCreated,
      updated: file.metadata.updated,
      contentType: file.metadata.contentType,
    }));

    gcsCache.set(cacheKey, fileList, 5 * 60 * 1000);

    return NextResponse.json({
      files: fileList,
      total: fileList.length,
      cached: false,
      loadTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to list GCS files:', error);
    return NextResponse.json(
      { error: 'Failed to list GCS files', details: (error as Error).message },
      { status: 500 }
    );
  }
}
