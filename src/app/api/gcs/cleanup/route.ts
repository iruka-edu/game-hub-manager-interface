import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { getUserFromHeaders } from '@/lib/auth';
import { gcsCache } from '@/lib/gcsCache';

/**
 * POST /api/gcs/cleanup
 * Delete orphaned files from GCS (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { filesToDelete, validGameIds, operation = 'cleanup' } = body;

    if (!Array.isArray(filesToDelete) || !Array.isArray(validGameIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
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

    let safeToDelete: string[] = [];
    const validGameIdsSet = new Set(validGameIds);

    for (const filePath of filesToDelete) {
      const gameIdMatch = filePath.match(/^games\/([^\/]+)\//);
      const gameId = gameIdMatch ? gameIdMatch[1] : null;

      if (gameId && !validGameIdsSet.has(gameId)) {
        safeToDelete.push(filePath);
      }
    }

    const batchSize = 10;
    let deletedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < safeToDelete.length; i += batchSize) {
      const batch = safeToDelete.slice(i, i + batchSize);

      const deletePromises = batch.map(async (filePath) => {
        try {
          await bucket.file(filePath).delete();
          deletedCount++;
          console.log(`Deleted: ${filePath}`);
        } catch (error) {
          const errorMsg = `Failed to delete ${filePath}: ${(error as Error).message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      });

      await Promise.allSettled(deletePromises);
    }

    gcsCache.invalidate('gcs-files');

    console.log(
      `GCS ${operation} completed by user ${user._id}: ${deletedCount} files deleted, ${errors.length} errors`
    );

    return NextResponse.json({
      success: true,
      operation,
      deletedCount,
      totalRequested: safeToDelete.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('GCS operation failed:', error);
    return NextResponse.json(
      { error: 'GCS operation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
