import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { ObjectId } from 'mongodb';

/**
 * Admin API: Sync games from GCS registry to MongoDB
 * 
 * This endpoint reads the existing registry/index.json from GCS
 * and creates corresponding Game and GameVersion records in MongoDB.
 * 
 * Games are imported with status 'published' by default since they
 * were already live in the old system.
 * 
 * POST /api/admin/sync-from-gcs
 * 
 * Query params:
 * - dryRun=true: Preview changes without writing to DB
 * - status=draft|published: Set initial status (default: published)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Check admin permission
  if (!locals.user || !locals.user.roles.includes('admin')) {
    return new Response(
      JSON.stringify({ error: 'Chỉ admin mới có quyền thực hiện thao tác này' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    const targetStatus = url.searchParams.get('status') || 'published';
    
    // Validate status
    if (!['draft', 'published'].includes(targetStatus)) {
      return new Response(
        JSON.stringify({ error: 'Status phải là "draft" hoặc "published"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get registry from GCS
    const registry = await RegistryManager.get();
    
    if (!registry.games || registry.games.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Không có game nào trong registry',
          imported: 0 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    const results: Array<{
      gameId: string;
      title: string;
      action: 'created' | 'skipped' | 'updated';
      versions: string[];
      error?: string;
    }> = [];

    for (const entry of registry.games) {
      try {
        // Check if game already exists
        const existingGame = await gameRepo.findByGameId(entry.id);
        
        if (existingGame) {
          results.push({
            gameId: entry.id,
            title: entry.title,
            action: 'skipped',
            versions: entry.versions.map(v => v.version),
          });
          continue;
        }

        if (dryRun) {
          results.push({
            gameId: entry.id,
            title: entry.title,
            action: 'created',
            versions: entry.versions.map(v => v.version),
          });
          continue;
        }

        // Create Game record
        const game = await gameRepo.create({
          gameId: entry.id,
          title: entry.title || entry.id,
          description: '',
          ownerId: locals.user._id.toString(), // Admin becomes owner
          tags: entry.capabilities || [],
          disabled: false,
          rolloutPercentage: 100,
          publishedAt: targetStatus === 'published' ? new Date() : undefined,
          isDeleted: false,
        });

        // Create GameVersion records for each version
        let latestVersionId: ObjectId | undefined;
        let liveVersionId: ObjectId | undefined;
        
        for (const versionInfo of entry.versions) {
          const gameVersion = await versionRepo.create({
            gameId: game._id,
            version: versionInfo.version,
            storagePath: `games/${entry.id}/${versionInfo.version}/`,
            entryFile: 'index.html',
            buildSize: versionInfo.size,
            status: targetStatus as 'draft' | 'published',
            submittedBy: new ObjectId(locals.user._id.toString()),
            submittedAt: new Date(versionInfo.uploadedAt),
            isDeleted: false,
          });

          // Track latest version
          latestVersionId = gameVersion._id;
          
          // Set live version if this is the active version and status is published
          if (versionInfo.version === entry.activeVersion && targetStatus === 'published') {
            liveVersionId = gameVersion._id;
          }
        }

        // Update game with version references
        if (latestVersionId) {
          await gameRepo.updateLatestVersion(game._id.toString(), latestVersionId);
        }
        if (liveVersionId) {
          await gameRepo.updateLiveVersion(game._id.toString(), liveVersionId);
        }

        results.push({
          gameId: entry.id,
          title: entry.title,
          action: 'created',
          versions: entry.versions.map(v => v.version),
        });

      } catch (error: any) {
        results.push({
          gameId: entry.id,
          title: entry.title,
          action: 'skipped',
          versions: entry.versions.map(v => v.version),
          error: error.message,
        });
      }
    }

    const created = results.filter(r => r.action === 'created').length;
    const skipped = results.filter(r => r.action === 'skipped').length;

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        targetStatus,
        message: dryRun 
          ? `[DRY RUN] Sẽ import ${created} games, bỏ qua ${skipped} games đã tồn tại`
          : `Đã import ${created} games với status "${targetStatus}", bỏ qua ${skipped} games đã tồn tại`,
        summary: {
          total: registry.games.length,
          created,
          skipped,
        },
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Sync from GCS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Sync failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
