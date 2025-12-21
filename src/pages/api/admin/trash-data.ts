import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';

/**
 * GET /api/admin/trash-data
 * Get data for trash management page
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check admin permission
    if (!hasPermissionString(user, 'system:admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameRepo = await GameRepository.getInstance();

    // Get all soft-deleted games
    const softDeleted = await gameRepo.findDeleted();

    // Get games marked for hard deletion
    const hardDeleteRequests = await gameRepo.findMarkedForHardDeletion();

    // Serialize the data
    const softDeletedSerialized = softDeleted.map(game => ({
      _id: game._id.toString(),
      gameId: game.gameId,
      title: game.title,
      ownerId: game.ownerId,
      deletedAt: game.deletedAt?.toISOString(),
      deletedBy: game.deletedBy,
      deleteReason: game.deleteReason,
      gcsPath: game.gcsPath
    }));

    const hardDeleteRequestsSerialized = hardDeleteRequests.map(game => ({
      _id: game._id.toString(),
      gameId: game.gameId,
      title: game.title,
      ownerId: game.ownerId,
      deletedAt: game.deletedAt?.toISOString(),
      deletedBy: game.deletedBy,
      deleteReason: game.deleteReason,
      gcsPath: game.gcsPath
    }));

    return new Response(JSON.stringify({
      softDeleted: softDeletedSerialized,
      hardDeleteRequests: hardDeleteRequestsSerialized,
      stats: {
        softDeletedCount: softDeleted.length,
        hardDeleteRequestsCount: hardDeleteRequests.length,
        retentionDays: 30
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Trash data error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};