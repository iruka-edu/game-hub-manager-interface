import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { QcReportRepository } from '../../../../models/QcReport';
import { getUserFromRequest } from '../../../../lib/session';

/**
 * GET /api/games/[id]/qc-history
 * Get QC history for a game with version context
 * Shows all QC reviews across all versions
 */
export const GET: APIRoute = async ({ params, request, url }) => {
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

    // Optional: filter by versionId
    const versionIdFilter = url.searchParams.get('versionId');

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QcReportRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all QC reports for this game
    const qcReports = await qcRepo.findByGameId(gameId);

    // Get version info for each report
    const reportsWithVersion = await Promise.all(qcReports.map(async (report) => {
      const version = await versionRepo.findById(report.versionId.toString());
      
      return {
        _id: report._id.toString(),
        gameId: report.gameId.toString(),
        versionId: report.versionId.toString(),
        version: version?.version || 'unknown',
        reviewerId: report.reviewerId.toString(),
        reviewerEmail: report.reviewerEmail,
        startedAt: report.startedAt?.toISOString(),
        finishedAt: report.finishedAt?.toISOString(),
        result: report.result,
        severity: report.severity,
        checklist: report.checklist,
        note: report.note,
        evidenceUrls: report.evidenceUrls,
        attemptNumber: report.attemptNumber,
        createdAt: report.createdAt.toISOString(),
      };
    }));

    // Filter by versionId if provided
    const filteredReports = versionIdFilter
      ? reportsWithVersion.filter(r => r.versionId === versionIdFilter)
      : reportsWithVersion;

    // Group by version for comparison view
    const byVersion: Record<string, typeof filteredReports> = {};
    for (const report of filteredReports) {
      if (!byVersion[report.version]) {
        byVersion[report.version] = [];
      }
      byVersion[report.version].push(report);
    }

    // Calculate checklist changes between consecutive reviews
    const reportsWithChanges = filteredReports.map((report, index) => {
      const previousReport = filteredReports[index + 1]; // Reports are sorted newest first
      let checklistChanges: { category: string; from: string; to: string }[] = [];

      if (previousReport && report.checklist && previousReport.checklist) {
        for (const item of report.checklist) {
          const prevItem = previousReport.checklist.find(p => p.category === item.category);
          if (prevItem && prevItem.status !== item.status) {
            checklistChanges.push({
              category: item.category,
              from: prevItem.status,
              to: item.status,
            });
          }
        }
      }

      return {
        ...report,
        checklistChanges,
        isImprovement: checklistChanges.some(c => 
          (c.from === 'fail' && c.to !== 'fail') || 
          (c.from === 'warning' && c.to === 'ok')
        ),
      };
    });

    return new Response(JSON.stringify({
      success: true,
      game: {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
      },
      qcHistory: reportsWithChanges,
      byVersion,
      totalReviews: filteredReports.length,
      passCount: filteredReports.filter(r => r.result === 'pass').length,
      failCount: filteredReports.filter(r => r.result === 'fail').length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get QC history error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
