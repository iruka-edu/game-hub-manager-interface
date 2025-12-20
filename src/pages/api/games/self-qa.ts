import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository, type SelfQAChecklist } from '../../../models/GameVersion';
import { getUserFromRequest } from '../../../lib/session';
import { ObjectId } from 'mongodb';

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

      // Try to get latest version from Game.latestVersionId first
      if (game.latestVersionId) {
        targetVersionId = game.latestVersionId.toString();
      } else {
        // Fallback: Find the most recent version for this game
        const versions = await versionRepo.findByGameId(gameId);
        if (versions.length === 0) {
          // Try to sync from GCS registry as last resort
          try {
            const { RegistryManager } = await import('../../../lib/registry');
            const registry = await RegistryManager.get();
            const registryEntry = registry.games.find(g => g.id === game.gameId);
            
            if (registryEntry && registryEntry.versions.length > 0) {
              console.log(`[Self-QA] Auto-syncing game ${game.gameId} from GCS registry`);
              
              // Create GameVersion records from registry
              let latestVersionId: any = null;
              for (const versionInfo of registryEntry.versions) {
                const gameVersion = await versionRepo.create({
                  gameId: game._id,
                  version: versionInfo.version,
                  storagePath: `games/${game.gameId}/${versionInfo.version}/`,
                  entryFile: 'index.html',
                  buildSize: versionInfo.size,
                  status: 'published', // Assume published since it's in registry
                  submittedBy: new ObjectId(user._id.toString()),
                  submittedAt: new Date(versionInfo.uploadedAt),
                  isDeleted: false,
                });
                latestVersionId = gameVersion._id;
              }
              
              // Update game's latestVersionId
              if (latestVersionId) {
                await gameRepo.updateLatestVersion(gameId, latestVersionId);
                targetVersionId = latestVersionId.toString();
              }
            }
          } catch (syncError) {
            console.error('[Self-QA] Auto-sync failed:', syncError);
          }
          
          // If still no version after sync attempt
          if (!targetVersionId) {
            return new Response(JSON.stringify({ 
              error: 'No version found for this game. Please upload a version first or sync from GCS registry.',
              suggestion: 'Use Admin Tools → Debug Games to sync this game from GCS registry.'
            }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } else {
          const latestVersion = versions[0];
          targetVersionId = latestVersion._id.toString();
          
          // Update game's latestVersionId for future calls
          await gameRepo.updateLatestVersion(gameId, latestVersion._id);
        }
      }
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
