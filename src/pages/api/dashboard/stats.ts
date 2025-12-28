import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { getUserFromRequest } from '../../../lib/session';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const userId = user._id.toString();
    const roles = user.roles || [];

    // Role checks
    const isAdmin = roles.includes('admin');
    const isDev = roles.includes('dev');
    const isQC = roles.includes('qc');
    const isCTO = roles.includes('cto');
    const isCEO = roles.includes('ceo');

    // Get all games and versions
    const allGames = await gameRepo.findAll();
    const myGames = allGames.filter(g => g.ownerId === userId);

    // Calculate stats based on game status (from latest version)
    let stats = {
      myGames: myGames.length,
      draftGames: 0,
      qcFailedGames: 0,
      uploadedGames: 0,
      qcPassedGames: 0,
      approvedGames: 0,
      publishedGames: 0,
      recentGames: [] as any[]
    };

    // Get version-based stats
    for (const game of allGames) {
      if (!game.latestVersionId) continue;
      
      const latestVersion = await versionRepo.findById(game.latestVersionId.toString());
      if (!latestVersion) continue;

      // Count by status
      switch (latestVersion.status) {
        case 'draft':
          if (game.ownerId === userId) stats.draftGames++;
          break;
        case 'qc_failed':
          if (game.ownerId === userId) stats.qcFailedGames++;
          break;
        case 'uploaded':
          stats.uploadedGames++;
          break;
        case 'qc_passed':
          stats.qcPassedGames++;
          break;
        case 'approved':
          stats.approvedGames++;
          break;
        case 'published':
          stats.publishedGames++;
          break;
      }
    }

    // Get recent games (last 5, sorted by updatedAt)
    const recentGames = allGames
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(game => ({
        _id: game._id.toString(),
        title: game.title,
        gameId: game.gameId,
        status: game.status || 'draft',
        updatedAt: game.updatedAt.toISOString()
      }));

    stats.recentGames = recentGames;

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};