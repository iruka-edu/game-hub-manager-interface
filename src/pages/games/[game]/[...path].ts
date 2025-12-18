import type { APIRoute } from 'astro';
import { getFileStream } from '../../../lib/storage';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';

/**
 * GET /games/[game]/[...path]
 * Serve game files from the live version's storage path
 * 
 * The [game] param is the game slug (gameId)
 * Files are served from the liveVersionId's storagePath
 */
export const GET: APIRoute = async ({ params }) => {
  const { game, path } = params;
  
  if (!game || !path) {
    return new Response('Not found', { status: 404 });
  }

  try {
    // Look up game by slug (gameId)
    const gameRepo = await GameRepository.getInstance();
    const gameDoc = await gameRepo.findByGameId(game);
    
    if (!gameDoc) {
      console.error(`Game not found: ${game}`);
      return new Response('Game not found', { status: 404 });
    }

    // Check if game has a live version
    if (!gameDoc.liveVersionId) {
      console.error(`No live version set for game: ${game}`);
      return new Response('Game not published', { status: 404 });
    }

    // Get the live version
    const versionRepo = await GameVersionRepository.getInstance();
    const liveVersion = await versionRepo.findById(gameDoc.liveVersionId.toString());
    
    if (!liveVersion) {
      console.error(`Live version not found: ${gameDoc.liveVersionId}`);
      return new Response('Version not found', { status: 404 });
    }

    // Construct file path using version's storagePath
    // storagePath format: "games/{slug}/{version}/"
    const gcsPath = `${liveVersion.storagePath}${path}`;

    // Basic MIME type inference
    let contentType = 'application/octet-stream';
    if (path.endsWith('.html')) contentType = 'text/html';
    else if (path.endsWith('.js')) contentType = 'application/javascript';
    else if (path.endsWith('.css')) contentType = 'text/css';
    else if (path.endsWith('.png')) contentType = 'image/png';
    else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (path.endsWith('.gif')) contentType = 'image/gif';
    else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (path.endsWith('.json')) contentType = 'application/json';
    else if (path.endsWith('.woff')) contentType = 'font/woff';
    else if (path.endsWith('.woff2')) contentType = 'font/woff2';
    else if (path.endsWith('.mp3')) contentType = 'audio/mpeg';
    else if (path.endsWith('.ogg')) contentType = 'audio/ogg';
    else if (path.endsWith('.wav')) contentType = 'audio/wav';
    else if (path.endsWith('.mp4')) contentType = 'video/mp4';
    else if (path.endsWith('.webm')) contentType = 'video/webm';

    // Create the stream and handle potential errors
    const stream = getFileStream(gcsPath);
    
    // Add error handling for the stream
    return new Promise<Response>((resolve) => {
      stream.on('error', (error) => {
        console.error(`Error streaming file ${gcsPath}:`, error);
        resolve(new Response('File not found', { status: 404 }));
      });

      // @ts-ignore - ReadableStream type mismatch between Node/Web standard
      resolve(new Response(stream, {
        headers: { 
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year (versioned files)
        }
      }));
    });
  } catch (error) {
    console.error(`Error accessing file for game ${game}:`, error);
    return new Response('Internal server error', { status: 500 });
  }
};