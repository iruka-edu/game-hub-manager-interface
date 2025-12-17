import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';
import { AuditLogger } from '../../../lib/audit';

/**
 * POST /api/games/qc-review
 * QC reviews a game - pass or fail
 * Changes status: uploaded -> qc_passed or qc_failed
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check role
    const isQC = user.roles.includes('qc');
    const isAdmin = user.roles.includes('admin');
    if (!isQC && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { gameId, result, note } = body;

    if (!gameId || !result) {
      return new Response(JSON.stringify({ error: 'gameId and result are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['pass', 'fail'].includes(result)) {
      return new Response(JSON.stringify({ error: 'result must be "pass" or "fail"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findById(gameId);

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check current status
    if (game.status !== 'uploaded') {
      return new Response(JSON.stringify({ error: 'Game is not in QC review status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update status
    const newStatus = result === 'pass' ? 'qc_passed' : 'qc_failed';
    const updated = await gameRepo.updateStatus(gameId, newStatus);

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_STATUS_CHANGE',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      changes: [
        { field: 'status', oldValue: 'uploaded', newValue: newStatus },
      ],
      metadata: result === 'fail' ? { reason: note || 'No reason provided' } : undefined,
    });

    return new Response(JSON.stringify({ success: true, game: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('QC review error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
