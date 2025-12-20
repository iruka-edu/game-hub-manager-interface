import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';
import { AuditLogger } from '../../../lib/audit';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { id, title, runtime, owner, capabilities, iconUrl, minHubVersion, disabled } = data;

    // Validation
    if (!id || !title || !runtime) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin bắt buộc: id, title, runtime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate title
    if (title.length < 3 || title.length > 40) {
      return new Response(
        JSON.stringify({ error: 'Tên game phải có độ dài 3-40 ký tự' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate runtime
    if (!['iframe-html', 'esm-module'].includes(runtime)) {
      return new Response(
        JSON.stringify({ error: 'Runtime phải là iframe-html hoặc esm-module' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate capabilities
    const validCapabilities = ['score', 'save-progress', 'levels', 'hints', 'audio', 'telemetry', 'leaderboard'];
    if (capabilities && Array.isArray(capabilities)) {
      const invalidCaps = capabilities.filter(cap => !validCapabilities.includes(cap));
      if (invalidCaps.length > 0) {
        return new Response(
          JSON.stringify({ error: `Capabilities không hợp lệ: ${invalidCaps.join(', ')}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate iconUrl if provided
    if (iconUrl && iconUrl.trim()) {
      try {
        new URL(iconUrl);
        if (!iconUrl.match(/\.(png|jpg|jpeg|webp|svg)$/i)) {
          return new Response(
            JSON.stringify({ error: 'Icon URL phải kết thúc bằng .png, .jpg, .jpeg, .webp, hoặc .svg' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: 'Icon URL không hợp lệ' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate minHubVersion if provided
    if (minHubVersion && minHubVersion.trim()) {
      if (!/^\d+\.\d+\.\d+$/.test(minHubVersion)) {
        return new Response(
          JSON.stringify({ error: 'Min Hub Version phải theo format x.y.z (ví dụ: 1.0.0)' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Find game by gameId (not MongoDB _id)
    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findByGameId(id);

    if (!game) {
      return new Response(
        JSON.stringify({ error: 'Game không tồn tại' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check ownership (only owner or admin can update)
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Bạn không có quyền cập nhật game này' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update game metadata
    const updatedGame = await gameRepo.updateMetadata(game._id.toString(), {
      title: title.trim(),
      description: game.description, // Keep existing description
      tags: capabilities && Array.isArray(capabilities) ? capabilities : game.tags,
    });

    if (!updatedGame) {
      return new Response(
        JSON.stringify({ error: 'Không thể cập nhật game' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_UPDATE_METADATA',
      target: {
        entity: 'GAME',
        id: game.gameId,
      },
      changes: [
        { field: 'title', oldValue: game.title, newValue: title.trim() },
        { field: 'tags', oldValue: game.tags, newValue: capabilities },
      ],
    });

    console.log(`[Update Game] Successfully updated game ${id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã cập nhật thông tin game ${title} thành công!`,
        game: {
          id: updatedGame.gameId,
          title: updatedGame.title,
          updatedAt: updatedGame.updatedAt.toISOString()
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Update Game] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Lỗi server khi cập nhật game' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};