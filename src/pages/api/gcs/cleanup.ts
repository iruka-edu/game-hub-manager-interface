import type { APIRoute } from 'astro';
import { Storage } from '@google-cloud/storage';
import { getUserFromRequest } from '../../../lib/session';
import { gcsCache } from '../../../lib/gcsCache';

export const POST: APIRoute = async ({ request }) => {
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

    const body = await request.json();
    const { filesToDelete, validGameIds, operation = 'cleanup' } = body;

    if (!Array.isArray(filesToDelete) || !Array.isArray(validGameIds)) {
      return new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    let safeToDelete: string[] = [];

    if (operation === 'cleanup') {
      // Double-check files before deletion (cleanup mode)
      const validGameIdsSet = new Set(validGameIds);

      for (const filePath of filesToDelete) {
        // Extract game ID from file path
        const gameIdMatch = filePath.match(/^games\/([^\/]+)\//);
        const gameId = gameIdMatch ? gameIdMatch[1] : null;

        // Only delete if game ID is not in valid list
        if (gameId && !validGameIdsSet.has(gameId)) {
          safeToDelete.push(filePath);
        }
      }
    } else if (operation === 'deleteGame') {
      // Delete specific game files (keep games in validGameIds)
      const validGameIdsSet = new Set(validGameIds);

      for (const filePath of filesToDelete) {
        // Extract game ID from file path
        const gameIdMatch = filePath.match(/^games\/([^\/]+)\//);
        const gameId = gameIdMatch ? gameIdMatch[1] : null;

        // Delete if this specific game should be removed but keep valid games
        if (gameId && !validGameIdsSet.has(gameId)) {
          safeToDelete.push(filePath);
        }
      }
    }

    // Delete files in batches
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

    // Invalidate cache after deletion
    gcsCache.invalidate('gcs-files');

    // Log cleanup activity
    console.log(`GCS ${operation} completed by user ${user._id}: ${deletedCount} files deleted, ${errors.length} errors`);

    return new Response(JSON.stringify({ 
      success: true,
      operation,
      deletedCount,
      totalRequested: safeToDelete.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GCS operation failed:', error);
    return new Response(JSON.stringify({ 
      error: 'GCS operation failed',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};