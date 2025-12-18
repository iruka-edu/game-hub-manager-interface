import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { getUserFromRequest } from '../../../../lib/session';
import { hasPermissionString } from '../../../../auth/auth-rbac';
import { AuditLogger } from '../../../../lib/audit';
import { PublicRegistryManager } from '../../../../lib/public-registry';

/**
 * POST /api/games/[id]/disable
 * Toggle the disabled (kill-switch) flag for a game
 * When disabled, the game is immediately removed from the Public Registry
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission - requires publish permission to toggle kill-switch
    if (!hasPermissionString(user, 'games:publish')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { disabled, reason } = body;

    // Validate input
    if (typeof disabled !== 'boolean') {
      return new Response(JSON.stringify({ error: 'disabled field must be a boolean' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (disabled && (!reason || typeof reason !== 'string' || reason.trim() === '')) {
      return new Response(JSON.stringify({ error: 'Reason is required when disabling a game' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameRepo = await GameRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already in desired state
    if (game.disabled === disabled) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Game is already ${disabled ? 'disabled' : 'enabled'}`,
        disabled: game.disabled
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const oldDisabled = game.disabled;

    // Update disabled flag
    const updatedGame = await gameRepo.updateDisabled(gameId, disabled);
    if (!updatedGame) {
      return new Response(JSON.stringify({ error: 'Failed to update game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sync Public Registry immediately
    try {
      await PublicRegistryManager.sync();
    } catch (syncError) {
      console.error('[Disable] Failed to sync Public Registry:', syncError);
      // Don't fail the operation, just log the error
    }

    // Audit log
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
        { field: 'disabled', oldValue: oldDisabled, newValue: disabled },
      ],
      metadata: {
        gameId: game.gameId,
        reason: reason || 'Re-enabled',
        action: disabled ? 'disable' : 'enable',
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      disabled: updatedGame.disabled,
      message: disabled ? 'Game disabled successfully' : 'Game enabled successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Disable error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
