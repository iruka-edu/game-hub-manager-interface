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
    const { gameIds, keepInDatabase = true } = body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid game IDs provided' }), {
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

    let totalDeleted = 0;
    const errors: string[] = [];
    const deletedGames: string[] = [];

    // Process each game ID
    for (const gameId of gameIds) {
      try {
        // List all files for this specific game
        const [files] = await bucket.getFiles({
          prefix: `games/${gameId}/`,
        });

        if (files.length === 0) {
          console.log(`No files found for game: ${gameId}`);
          continue;
        }

        // Delete all files for this game
        const deletePromises = files.map(async (file) => {
          try {
            await file.delete();
            totalDeleted++;
            console.log(`Deleted: ${file.name}`);
          } catch (error) {
            const errorMsg = `Failed to delete ${file.name}: ${(error as Error).message}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        });

        await Promise.allSettled(deletePromises);
        deletedGames.push(gameId);

        console.log(`Deleted ${files.length} files for game: ${gameId}`);
      } catch (error) {
        const errorMsg = `Failed to process game ${gameId}: ${(error as Error).message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Invalidate cache after deletion
    gcsCache.invalidate('gcs-files');

    // Log activity
    console.log(`GCS game deletion completed by user ${user._id}: ${deletedGames.length} games processed, ${totalDeleted} files deleted, ${errors.length} errors`);

    return new Response(JSON.stringify({ 
      success: true,
      operation: 'deleteGame',
      processedGames: deletedGames,
      totalFilesDeleted: totalDeleted,
      gamesProcessed: deletedGames.length,
      keepInDatabase,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GCS game deletion failed:', error);
    return new Response(JSON.stringify({ 
      error: 'GCS game deletion failed',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};