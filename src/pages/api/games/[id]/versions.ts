import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository, compareSemVer } from '../../../../models/GameVersion';
import { QcReportRepository } from '../../../../models/QcReport';
import { UserRepository } from '../../../../models/User';
import { getUserFromRequest } from '../../../../lib/session';

/**
 * GET /api/games/[id]/versions
 * Get all versions for a game with QC results
 */
export const GET: APIRoute = async ({ params, request }) => {
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
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QcReportRepository.getInstance();
    const userRepo = await UserRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all versions for this game (excluding deleted)
    const versions = await versionRepo.findByGameId(gameId);

    // Sort by createdAt descending (newest first) - this is the requirement
    versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get QC results and user names for each version
    const versionsWithQc = await Promise.all(versions.map(async (version) => {
      const qcReports = await qcRepo.findByVersionId(version._id.toString());
      const latestQc = qcReports.length > 0 ? qcReports[0] : null;
      
      // Get creator name
      const creator = await userRepo.findById(version.submittedBy.toString());
      const creatorName = creator?.name || 'Unknown';

      return {
        _id: version._id.toString(),
        version: version.version,
        status: version.status,
        storagePath: version.storagePath,
        entryFile: version.entryFile,
        buildSize: version.buildSize,
        selfQAChecklist: version.selfQAChecklist,
        releaseNote: version.releaseNote,
        submittedBy: version.submittedBy.toString(),
        submittedByName: creatorName, // Added creator name
        submittedAt: version.submittedAt?.toISOString(),
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString(),
        // QC info
        qcResult: latestQc?.result || null,
        qcSeverity: latestQc?.severity || null,
        qcNote: latestQc?.note || null,
        qcReviewCount: qcReports.length,
        isLatest: game.latestVersionId?.toString() === version._id.toString(),
        isLive: game.liveVersionId?.toString() === version._id.toString(),
      };
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      game: {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
      },
      versions: versionsWithQc,
      totalVersions: versions.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get versions error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
