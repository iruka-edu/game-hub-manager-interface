import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getUserFromRequest } from '../../../../lib/session';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { UserRepository } from '../../../../models/User';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Verify authentication using the existing session helper
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { gameId } = params;
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use repository pattern like other APIs
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const userRepo = await UserRepository.getInstance();

    // Get game details
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check permissions
    const userRoles = user.roles || [];
    const isAdmin = userRoles.includes('admin');
    const isCEO = userRoles.includes('ceo');
    const isCTO = userRoles.includes('cto');
    const isDev = userRoles.includes('dev');
    const isOwner = game.ownerId === user._id.toString();

    // Permission check
    if (!isAdmin && !isCEO && !isCTO && (!isDev || !isOwner)) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions to delete this game' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body for deletion reason
    const body = await request.json();
    const { reason } = body;

    // Delete the game using repository (soft delete)
    const gameDeleted = await gameRepo.delete(gameId);
    if (!gameDeleted) {
      return new Response(JSON.stringify({ error: 'Failed to delete game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete associated versions
    const versions = await versionRepo.findByGameId(gameId);
    for (const version of versions) {
      await versionRepo.softDelete(version._id.toString());
    }

    // Send notification to relevant users if dev deletes own game
    if (isDev && isOwner) {
      // Get notification targets
      const allUsers = await userRepo.findAll();
      const notificationTargets = allUsers.filter(u => 
        u.roles.some(role => ['qc', 'admin', 'cto', 'ceo'].includes(role))
      );

      // Note: Notification creation would go here
      // For now, we'll skip the notification implementation
      // as it requires the notification repository
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Game deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete game error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};