import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../lib/session';

/**
 * GET /api/games/[id]/release-note?versionId=xxx
 * Get release note for a specific version
 * 
 * POST /api/games/[id]/release-note
 * Update release note for a version
 */
export const GET: APIRoute = async ({ params, request, url }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameId = params.id;
    const versionId = url.searchParams.get('versionId');

    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get specific version or latest
    let version;
    if (versionId) {
      version = await versionRepo.findById(versionId);
    } else if (game.latestVersionId) {
      version = await versionRepo.findById(game.latestVersionId.toString());
    } else {
      // Fallback: Find the most recent version for this game
      const versions = await versionRepo.findByGameId(gameId);
      if (versions.length > 0) {
        version = versions[0]; // Most recent version
        // Update game's latestVersionId for future calls
        await gameRepo.updateLatestVersion(gameId, version._id);
      }
    }

    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      versionId: version._id.toString(),
      version: version.version,
      releaseNote: version.releaseNote || '',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get release note error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { versionId, releaseNote } = body;

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check ownership
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get target version
    let targetVersionId = versionId;
    if (!targetVersionId && game.latestVersionId) {
      targetVersionId = game.latestVersionId.toString();
    } else if (!targetVersionId) {
      // Fallback: Find the most recent version for this game
      const versions = await versionRepo.findByGameId(gameId);
      if (versions.length === 0) {
        return new Response(JSON.stringify({ error: 'No version found for this game. Please upload a version first.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const latestVersion = versions[0];
      targetVersionId = latestVersion._id.toString();
      
      // Update game's latestVersionId for future calls
      await gameRepo.updateLatestVersion(gameId, latestVersion._id);
    }

    const version = await versionRepo.findById(targetVersionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify version belongs to this game
    if (version.gameId.toString() !== game._id.toString()) {
      return new Response(JSON.stringify({ error: 'Version does not belong to this game' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update release note
    const updated = await versionRepo.updateReleaseNote(targetVersionId, releaseNote || '');

    return new Response(JSON.stringify({
      success: true,
      version: updated,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update release note error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
