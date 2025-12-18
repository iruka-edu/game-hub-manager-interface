import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository, type SelfQAChecklist } from '../../../models/GameVersion';
import { getUserFromRequest } from '../../../lib/session';

/**
 * POST /api/games/self-qa
 * Update Self-QA checklist for a game version
 * 
 * Accepts either:
 * - versionId: Update specific version's Self-QA
 * - gameId: Update latest version's Self-QA (backward compatible)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { versionId, gameId, checklist, note } = body;

    if (!versionId && !gameId) {
      return new Response(JSON.stringify({ error: 'versionId or gameId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    let targetVersionId = versionId;

    // If gameId provided, get the latest version
    if (!targetVersionId && gameId) {
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

      if (!game.latestVersionId) {
        return new Response(JSON.stringify({ error: 'No version found for this game' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      targetVersionId = game.latestVersionId.toString();
    }

    // Get the version
    const version = await versionRepo.findById(targetVersionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If versionId was provided directly, verify ownership through game
    if (versionId) {
      const game = await gameRepo.findById(version.gameId.toString());
      if (!game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const isOwner = game.ownerId === user._id.toString();
      const isAdmin = user.roles.includes('admin');
      if (!isOwner && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Build Self-QA checklist
    const selfQAChecklist: SelfQAChecklist = {
      testedDevices: checklist?.testedDevices ?? false,
      testedAudio: checklist?.testedAudio ?? false,
      gameplayComplete: checklist?.gameplayComplete ?? false,
      contentVerified: checklist?.contentVerified ?? false,
      note: note || undefined,
    };

    const updated = await versionRepo.updateSelfQA(targetVersionId, selfQAChecklist);

    return new Response(JSON.stringify({ success: true, version: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Self-QA update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
