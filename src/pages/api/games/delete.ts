import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';
import { deleteFiles } from '../../../lib/gcs';

export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('id');
  const version = url.searchParams.get('version');

  if (!gameId) {
    return new Response(
      JSON.stringify({ error: 'Missing game id parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (version) {
      // Delete specific version
      const gcsPath = `games/${gameId}/${version}/`;
      await deleteFiles(gcsPath);
      await RegistryManager.deleteVersion(gameId, version);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Deleted version ${version} of game ${gameId}`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Delete entire game
      const gcsPath = `games/${gameId}/`;
      await deleteFiles(gcsPath);
      await RegistryManager.deleteGame(gameId);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Deleted game ${gameId} and all versions`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Delete failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
