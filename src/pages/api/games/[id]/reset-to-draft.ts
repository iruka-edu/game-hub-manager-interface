import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { PublicRegistryManager } from '../../../../lib/public-registry';
import { AuditLogger } from '../../../../lib/audit';

/**
 * Admin API: Reset a game and all its versions to draft status
 * 
 * This removes the game from the Public Registry and resets all versions
 * to draft status, allowing the game to go through the QC workflow again.
 * 
 * POST /api/games/[id]/reset-to-draft
 * 
 * Body (optional):
 * - versionId: Reset only a specific version (if not provided, resets all versions)
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  // Check admin permission
  if (!locals.user || !locals.user.roles.includes('admin')) {
    return new Response(
      JSON.stringify({ error: 'Chỉ admin mới có quyền thực hiện thao tác này' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Game ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find game
    const game = await gameRepo.findById(id);
    if (!game) {
      return new Response(
        JSON.stringify({ error: 'Game không tồn tại' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse body for optional versionId
    let body: { versionId?: string } = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Ignore parse errors, use empty body
    }

    const resetVersions: string[] = [];

    if (body.versionId) {
      // Reset specific version
      const version = await versionRepo.findById(body.versionId);
      if (!version) {
        return new Response(
          JSON.stringify({ error: 'Version không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await versionRepo.updateStatus(body.versionId, 'draft');
      resetVersions.push(version.version);

      // If this was the live version, clear liveVersionId
      if (game.liveVersionId?.toString() === body.versionId) {
        await gameRepo.updateLiveVersion(id, null as any);
      }
    } else {
      // Reset all versions
      const versions = await versionRepo.findByGameId(id);
      
      for (const version of versions) {
        await versionRepo.updateStatus(version._id.toString(), 'draft');
        resetVersions.push(version.version);
      }

      // Clear liveVersionId
      await gameRepo.updateLiveVersion(id, null as any);
    }

    // Remove from Public Registry
    await PublicRegistryManager.removeGame(game.gameId);

    // Log audit entry
    AuditLogger.log({
      actor: {
        user: locals.user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_RESET_TO_DRAFT',
      target: {
        entity: 'GAME',
        id: game.gameId,
      },
      metadata: {
        resetVersions,
        specificVersion: body.versionId || null,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: body.versionId 
          ? `Đã reset version ${resetVersions[0]} về draft`
          : `Đã reset ${resetVersions.length} versions về draft`,
        gameId: game.gameId,
        resetVersions,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Reset to Draft] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Reset failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
