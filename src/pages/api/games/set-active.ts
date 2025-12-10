import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { gameId, version } = body;

    if (!gameId || !version) {
      return new Response(
        JSON.stringify({ error: 'Thiếu gameId hoặc version' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await RegistryManager.setActiveVersion(gameId, version);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Game hoặc version không tồn tại' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Đã kích hoạt phiên bản ${version}`,
        activeVersion: result.activeVersion,
        entryUrl: result.entryUrl
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Set active version error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Lỗi server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
