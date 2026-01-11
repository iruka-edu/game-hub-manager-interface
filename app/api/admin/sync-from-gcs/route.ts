import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { RegistryManager } from '@/src/lib/registry';
import { GameRepository } from '@/src/models/Game';
import { GameVersionRepository } from '@/src/models/GameVersion';
import { getUserFromHeaders } from '@/lib/auth';

/**
 * POST /api/admin/sync-from-gcs
 * Sync games from GCS registry to MongoDB
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromHeaders(request.headers);

  if (!user || !user.roles.includes('admin')) {
    return NextResponse.json(
      { error: 'Chỉ admin mới có quyền thực hiện thao tác này' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    const targetStatus = url.searchParams.get('status') || 'published';

    if (!['draft', 'published'].includes(targetStatus)) {
      return NextResponse.json(
        { error: 'Status phải là "draft" hoặc "published"' },
        { status: 400 }
      );
    }

    const registry = await RegistryManager.get();

    if (!registry.games || registry.games.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có game nào trong registry',
        imported: 0,
      });
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
        const existingGame = await gameRepo.findByGameId(entry.id);

        if (existingGame) {
          results.push({
            gameId: entry.id,
            title: entry.title,
            action: 'skipped',
            versions: entry.versions.map((v) => v.version),
          });
          continue;
        }

        if (dryRun) {
          results.push({
            gameId: entry.id,
            title: entry.title,
            action: 'created',
            versions: entry.versions.map((v) => v.version),
          });
          continue;
        }

        const game = await gameRepo.create({
          gameId: entry.id,
          title: entry.title || entry.id,
          description: '',
          ownerId: user._id.toString(),
          tags: entry.capabilities || [],
          disabled: false,
          rolloutPercentage: 100,
          publishedAt: targetStatus === 'published' ? new Date() : undefined,
          isDeleted: false,
        });

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
            submittedBy: new ObjectId(user._id.toString()),
            submittedAt: new Date(versionInfo.uploadedAt),
            isDeleted: false,
          });

          latestVersionId = gameVersion._id;

          if (versionInfo.version === entry.activeVersion && targetStatus === 'published') {
            liveVersionId = gameVersion._id;
          }
        }

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
          versions: entry.versions.map((v) => v.version),
        });
      } catch (error: any) {
        results.push({
          gameId: entry.id,
          title: entry.title,
          action: 'skipped',
          versions: entry.versions.map((v) => v.version),
          error: error.message,
        });
      }
    }

    const created = results.filter((r) => r.action === 'created').length;
    const skipped = results.filter((r) => r.action === 'skipped').length;

    return NextResponse.json({
      success: true,
      dryRun,
      targetStatus,
      message: dryRun
        ? `[DRY RUN] Sẽ import ${created} games, bỏ qua ${skipped} games đã tồn tại`
        : `Đã import ${created} games với status "${targetStatus}", bỏ qua ${skipped} games đã tồn tại`,
      summary: { total: registry.games.length, created, skipped },
      results,
    });
  } catch (error: any) {
    console.error('[Sync from GCS] Error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
