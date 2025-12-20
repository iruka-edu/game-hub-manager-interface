import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';

/**
 * Debug API: Check game and its versions
 * GET /api/debug/check-game?gameId=xxx
 */
export const GET: APIRoute = async ({ request, locals, url }) => {
  // Check admin permission
  if (!locals.user || !locals.user.roles.includes('admin')) {
    return new Response(
      JSON.stringify({ error: 'Admin only' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const gameId = url.searchParams.get('gameId');
    if (!gameId) {
      return new Response(
        JSON.stringify({ error: 'gameId parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Get game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all versions for this game
    const versions = await versionRepo.findByGameId(gameId);
    const versionsIncludeDeleted = await versionRepo.findByGameIdIncludeDeleted(gameId);

    // Check if latestVersionId exists
    let latestVersionExists = false;
    if (game.latestVersionId) {
      const latestVersion = await versionRepo.findById(game.latestVersionId.toString());
      latestVersionExists = !!latestVersion;
    }

    // Check if liveVersionId exists
    let liveVersionExists = false;
    if (game.liveVersionId) {
      const liveVersion = await versionRepo.findById(game.liveVersionId.toString());
      liveVersionExists = !!liveVersion;
    }

    return new Response(
      JSON.stringify({
        game: {
          _id: game._id.toString(),
          gameId: game.gameId,
          title: game.title,
          ownerId: game.ownerId,
          latestVersionId: game.latestVersionId?.toString(),
          liveVersionId: game.liveVersionId?.toString(),
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        },
        versions: {
          active: versions.map(v => ({
            _id: v._id.toString(),
            version: v.version,
            status: v.status,
            createdAt: v.createdAt,
            isDeleted: v.isDeleted,
          })),
          includeDeleted: versionsIncludeDeleted.map(v => ({
            _id: v._id.toString(),
            version: v.version,
            status: v.status,
            createdAt: v.createdAt,
            isDeleted: v.isDeleted,
          })),
        },
        analysis: {
          totalVersions: versions.length,
          totalVersionsIncludeDeleted: versionsIncludeDeleted.length,
          latestVersionIdExists: latestVersionExists,
          liveVersionIdExists: liveVersionExists,
          hasActiveVersions: versions.length > 0,
        },
        recommendations: versions.length === 0 ? [
          'Game has no versions - need to upload a version first',
          'Or sync this game from GCS if it exists there',
          'Or delete this game record if it\'s orphaned'
        ] : [
          'Game has versions - check if latestVersionId needs to be updated'
        ]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Debug Check Game] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};