import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../lib/session';

/**
 * GET /api/games/[id]/debug-versions
 * Debug endpoint to check what versions exist for a game
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Get the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all versions (including deleted)
    const allVersions = await versionRepo.findByGameIdIncludeDeleted(gameId);
    const activeVersions = await versionRepo.findByGameId(gameId);

    // Get latest version if referenced
    let latestVersionData = null;
    if (game.latestVersionId) {
      latestVersionData = await versionRepo.findById(game.latestVersionId.toString());
    }

    // Get live version if referenced
    let liveVersionData = null;
    if (game.liveVersionId) {
      liveVersionData = await versionRepo.findById(game.liveVersionId.toString());
    }

    return new Response(JSON.stringify({
      game: {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
        latestVersionId: game.latestVersionId?.toString() || null,
        liveVersionId: game.liveVersionId?.toString() || null,
        ownerId: game.ownerId,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt
      },
      versions: {
        total: allVersions.length,
        active: activeVersions.length,
        deleted: allVersions.length - activeVersions.length,
        list: allVersions.map(v => ({
          _id: v._id.toString(),
          version: v.version,
          status: v.status,
          isDeleted: v.isDeleted,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
          storagePath: v.storagePath,
          submittedAt: v.submittedAt
        }))
      },
      references: {
        latestVersion: latestVersionData ? {
          _id: latestVersionData._id.toString(),
          version: latestVersionData.version,
          status: latestVersionData.status,
          isDeleted: latestVersionData.isDeleted
        } : null,
        liveVersion: liveVersionData ? {
          _id: liveVersionData._id.toString(),
          version: liveVersionData.version,
          status: liveVersionData.status,
          isDeleted: liveVersionData.isDeleted
        } : null
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug versions error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};