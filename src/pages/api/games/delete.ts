import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { deleteFiles } from '../../../lib/gcs';
import { AuditLogger } from '../../../lib/audit';
import { PublicRegistryManager } from '../../../lib/public-registry';

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('id');
    const version = url.searchParams.get('version');

    if (!gameId) {
      return new Response(
        JSON.stringify({ error: 'Thiếu id game' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    if (version) {
      // Delete specific version
      const game = await gameRepo.findByGameId(gameId);
      if (!game) {
        return new Response(
          JSON.stringify({ error: 'Game không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const gameVersion = await versionRepo.findByVersion(game._id.toString(), version);
      if (!gameVersion) {
        return new Response(
          JSON.stringify({ error: 'Phiên bản không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if this is the only version
      const allVersions = await versionRepo.findByGameId(game._id.toString());
      if (allVersions.length === 1) {
        return new Response(
          JSON.stringify({ error: 'Không thể xóa phiên bản cuối cùng. Hãy xóa toàn bộ game thay vì xóa phiên bản.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if this is the live version
      if (game.liveVersionId && game.liveVersionId.equals(gameVersion._id)) {
        return new Response(
          JSON.stringify({ error: 'Không thể xóa phiên bản đang được publish. Hãy publish phiên bản khác trước.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Soft delete the version
      await versionRepo.softDelete(gameVersion._id.toString());

      // Update latest version if needed
      if (game.latestVersionId && game.latestVersionId.equals(gameVersion._id)) {
        const remainingVersions = await versionRepo.findByGameId(game._id.toString());
        if (remainingVersions.length > 0) {
          await gameRepo.updateLatestVersion(game._id.toString(), remainingVersions[0]._id);
        }
      }

      // Delete files from GCS
      await deleteFiles(`games/${gameId}/${version}/`);

      // Log audit entry for version deletion
      if (locals.user) {
        AuditLogger.log({
          actor: {
            user: locals.user,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || undefined,
          },
          action: 'GAME_DELETE_VERSION',
          target: {
            entity: 'GAME',
            id: gameId,
            subId: version,
          },
          metadata: {
            triggerBy: 'Manual deletion',
          },
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Đã xóa phiên bản ${version}` 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Delete entire game
      const game = await gameRepo.findByGameId(gameId);
      if (!game) {
        return new Response(
          JSON.stringify({ error: 'Game không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Soft delete all versions first
      const versions = await versionRepo.findByGameId(game._id.toString());
      for (const version of versions) {
        await versionRepo.softDelete(version._id.toString());
      }

      // Soft delete the game
      await gameRepo.delete(game._id.toString());

      // Remove from public registry if published
      if (game.liveVersionId) {
        try {
          await PublicRegistryManager.removeGame(gameId);
        } catch (error) {
          console.warn('Failed to remove from public registry:', error);
          // Continue with deletion even if public registry update fails
        }
      }

      // Delete all game files from GCS
      await deleteFiles(`games/${gameId}/`);

      // Log audit entry for full game deletion
      if (locals.user) {
        AuditLogger.log({
          actor: {
            user: locals.user,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || undefined,
          },
          action: 'GAME_DELETE_FULL',
          target: {
            entity: 'GAME',
            id: gameId,
          },
          metadata: {
            triggerBy: 'Manual deletion',
          },
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Đã xóa game ${gameId}` 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Lỗi server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
