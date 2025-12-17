import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';
import { deleteFiles } from '../../../lib/gcs';
import { AuditLogger } from '../../../lib/audit';

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

    if (version) {
      // Delete specific version
      const result = await RegistryManager.deleteVersion(gameId, version);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
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
      const success = await RegistryManager.deleteGame(gameId);

      if (!success) {
        return new Response(
          JSON.stringify({ error: 'Game không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
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
