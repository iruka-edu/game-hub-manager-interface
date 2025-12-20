import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { RegistryManager } from '../../../lib/registry';
import { ObjectId } from 'mongodb';

/**
 * Debug API: Fix game by creating version from GCS registry
 * POST /api/debug/fix-game
 * Body: { gameId: string, action: 'sync-from-gcs' | 'delete-game' | 'update-latest-version' }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Check admin permission
  if (!locals.user || !locals.user.roles.includes('admin')) {
    return new Response(
      JSON.stringify({ error: 'Admin only' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { gameId, action } = body;

    if (!gameId || !action) {
      return new Response(
        JSON.stringify({ error: 'gameId and action are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync-from-gcs') {
      // Try to find this game in GCS registry and create versions
      const registry = await RegistryManager.get();
      const registryEntry = registry.games.find(g => g.id === game.gameId);
      
      if (!registryEntry) {
        return new Response(
          JSON.stringify({ error: 'Game not found in GCS registry' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create GameVersion records for each version in registry
      const createdVersions = [];
      let latestVersionId: ObjectId | undefined;
      let liveVersionId: ObjectId | undefined;

      for (const versionInfo of registryEntry.versions) {
        const gameVersion = await versionRepo.create({
          gameId: game._id,
          version: versionInfo.version,
          storagePath: `games/${game.gameId}/${versionInfo.version}/`,
          entryFile: 'index.html',
          buildSize: versionInfo.size,
          status: 'published', // Assume published since it's in registry
          submittedBy: new ObjectId(locals.user._id.toString()),
          submittedAt: new Date(versionInfo.uploadedAt),
          isDeleted: false,
        });

        createdVersions.push(gameVersion);
        latestVersionId = gameVersion._id;

        // Set live version if this is the active version
        if (versionInfo.version === registryEntry.activeVersion) {
          liveVersionId = gameVersion._id;
        }
      }

      // Update game with version references
      if (latestVersionId) {
        await gameRepo.updateLatestVersion(gameId, latestVersionId);
      }
      if (liveVersionId) {
        await gameRepo.updateLiveVersion(gameId, liveVersionId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Created ${createdVersions.length} versions from GCS registry`,
          createdVersions: createdVersions.map(v => ({
            _id: v._id.toString(),
            version: v.version,
            status: v.status,
          })),
          latestVersionId: latestVersionId?.toString(),
          liveVersionId: liveVersionId?.toString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } else if (action === 'delete-game') {
      // Soft delete the game
      await gameRepo.delete(gameId);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Game deleted successfully',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } else if (action === 'update-latest-version') {
      // Find the most recent version and update latestVersionId
      const versions = await versionRepo.findByGameId(gameId);
      
      if (versions.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No versions found for this game' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const latestVersion = versions[0]; // Already sorted by createdAt desc
      await gameRepo.updateLatestVersion(gameId, latestVersion._id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Updated latestVersionId',
          latestVersionId: latestVersion._id.toString(),
          version: latestVersion.version,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: sync-from-gcs, delete-game, or update-latest-version' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('[Debug Fix Game] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};