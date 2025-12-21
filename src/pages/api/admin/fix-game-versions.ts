import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { getUserFromRequest } from '../../../lib/session';

/**
 * POST /api/admin/fix-game-versions
 * Admin utility to fix games with missing latestVersionId references
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.roles.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { gameId, dryRun = true } = body;

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const results = [];

    if (gameId) {
      // Fix specific game
      const game = await gameRepo.findById(gameId);
      if (!game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const versions = await versionRepo.findByGameId(gameId);
      const result: any = {
        gameId: game._id.toString(),
        gameSlug: game.gameId,
        title: game.title,
        currentLatestVersionId: game.latestVersionId?.toString() || null,
        currentLiveVersionId: game.liveVersionId?.toString() || null,
        versionsFound: versions.length,
        action: 'none'
      };

      if (versions.length > 0 && !game.latestVersionId) {
        const latestVersion = versions[0]; // Already sorted by createdAt desc
        result.action = 'update_latest_version';
        result.newLatestVersionId = latestVersion._id.toString();
        result.newLatestVersion = latestVersion.version;

        if (!dryRun) {
          await gameRepo.updateLatestVersion(gameId, latestVersion._id);
          result.updated = true;
        }
      }

      results.push(result);
    } else {
      // Fix all games with missing latestVersionId
      const games = await gameRepo.findAll();
      
      for (const game of games) {
        if (game.isDeleted) continue;

        const versions = await versionRepo.findByGameId(game._id.toString());
        const result: any = {
          gameId: game._id.toString(),
          gameSlug: game.gameId,
          title: game.title,
          currentLatestVersionId: game.latestVersionId?.toString() || null,
          versionsFound: versions.length,
          action: 'none'
        };

        if (versions.length > 0 && !game.latestVersionId) {
          const latestVersion = versions[0];
          result.action = 'update_latest_version';
          result.newLatestVersionId = latestVersion._id.toString();
          result.newLatestVersion = latestVersion.version;

          if (!dryRun) {
            await gameRepo.updateLatestVersion(game._id.toString(), latestVersion._id);
            result.updated = true;
          }
        }

        results.push(result);
      }
    }

    const summary = {
      total: results.length,
      needsUpdate: results.filter(r => r.action !== 'none').length,
      updated: dryRun ? 0 : results.filter(r => r.updated).length,
      dryRun
    };

    return new Response(JSON.stringify({
      summary,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fix game versions error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};