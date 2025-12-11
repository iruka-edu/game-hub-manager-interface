import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';

export const POST: APIRoute = async ({ request }) => {
  try {
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

    // Get current registry
    const registry = await RegistryManager.get();
    const gameIndex = registry.games.findIndex(g => g.id === id);

    if (gameIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Game không tồn tại' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const game = registry.games[gameIndex];

    // Update game information
    game.title = title.trim();
    game.owner = owner?.trim() || game.owner;
    game.updatedAt = new Date().toISOString();

    // Update manifest
    if (game.manifest) {
      game.manifest.title = title.trim();
      game.manifest.runtime = runtime;
      
      if (capabilities && Array.isArray(capabilities)) {
        game.manifest.capabilities = capabilities;
        game.capabilities = capabilities; // Also update the top-level capabilities
      }
      
      if (iconUrl && iconUrl.trim()) {
        game.manifest.iconUrl = iconUrl.trim();
      }
      
      if (minHubVersion && minHubVersion.trim()) {
        game.manifest.minHubVersion = minHubVersion.trim();
      }
      
      if (typeof disabled === 'boolean') {
        game.manifest.disabled = disabled;
      }
    }

    // Save updated registry
    await RegistryManager.save(registry);

    console.log(`[Update Game] Successfully updated game ${id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã cập nhật thông tin game ${title} thành công!`,
        game: {
          id: game.id,
          title: game.title,
          owner: game.owner,
          updatedAt: game.updatedAt
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