import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { GameRepository } from '../../../../../models/Game';
import { GameVersionRepository } from '../../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../../lib/session';
import { AuditLogger } from '../../../../../lib/audit';
import { GameHistoryService } from '../../../../../lib/game-history';

/**
 * POST /api/games/[id]/versions/create
 * Create a new version for a game
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

    const gameId = params.id;
    if (!gameId) {
      return new Response(
        JSON.stringify({ error: 'Game ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission - only owner or admin can create versions
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to create versions for this game' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { version: requestedVersion, releaseNote } = body;

    // Auto-increment version if not provided
    let versionNumber: string;
    if (requestedVersion) {
      versionNumber = requestedVersion;
    } else {
      versionNumber = await versionRepo.getNextVersion(gameId);
    }

    // Create storage path for the new version
    const storagePath = `games/${game.gameId}/${versionNumber}/`;
    const entryFile = 'index.html'; // Default entry file

    // Create the version
    const newVersion = await versionRepo.create({
      gameId: new ObjectId(gameId),
      version: versionNumber,
      storagePath,
      entryFile,
      status: 'draft',
      isDeleted: false,
      releaseNote: releaseNote || `Version ${versionNumber}`,
      submittedBy: user._id,
    });

    // Update game's latestVersionId
    await gameRepo.updateLatestVersion(gameId, newVersion._id);

    // Record history
    await GameHistoryService.recordVersionCreation(
      gameId,
      newVersion._id.toString(),
      versionNumber,
      user
    );

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'VERSION_CREATED',
      target: {
        entity: 'GAME_VERSION',
        id: newVersion._id.toString(),
      },
      changes: [
        {
          field: 'version',
          oldValue: null,
          newValue: versionNumber,
        },
      ],
    });

    return new Response(
      JSON.stringify({
        success: true,
        version: {
          _id: newVersion._id.toString(),
          gameId: newVersion.gameId.toString(),
          gameName: game.title, // Include game name as required
          version: newVersion.version,
          status: newVersion.status,
          storagePath: newVersion.storagePath,
          entryFile: newVersion.entryFile,
          releaseNote: newVersion.releaseNote,
          submittedBy: newVersion.submittedBy.toString(),
          createdAt: newVersion.createdAt.toISOString(),
        },
        message: `Version ${versionNumber} created successfully`,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create version error:', error);
    
    // Handle duplicate version error
    if (error.message?.includes('already exists')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
