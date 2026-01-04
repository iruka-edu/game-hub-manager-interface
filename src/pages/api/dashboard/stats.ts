import type { APIRoute } from 'astro';
import { MongoClient, ObjectId } from 'mongodb';
import { getUserFromRequest } from '../../../lib/session';

const MONGODB_URI = import.meta.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'game_hub';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify authentication using the existing session helper
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const userId = user._id.toString();
    const userRoles = user.roles || [];

    // Get all games and versions
    const allGames = await db.collection('games').find({ isDeleted: false }).toArray();
    const allVersions = await db.collection('game_versions').find({}).toArray();

    // Create version lookup
    const versionLookup = new Map();
    allVersions.forEach(version => {
      versionLookup.set(version._id.toString(), version);
    });

    // Initialize stats
    const stats = {
      myGames: 0,
      draftGames: 0,
      qcFailedGames: 0,
      uploadedGames: 0,
      qcPassedGames: 0,
      approvedGames: 0,
      publishedGames: 0,
      recentGames: [] as any[]
    };

    // Calculate stats
    for (const game of allGames) {
      const isMyGame = game.ownerId === userId;
      
      if (isMyGame) {
        stats.myGames++;
      }

      // Get latest version status
      let latestVersionStatus = 'draft';
      if (game.latestVersionId) {
        const latestVersion = versionLookup.get(game.latestVersionId.toString());
        if (latestVersion) {
          latestVersionStatus = latestVersion.status;
        }
      }

      // Count by status
      switch (latestVersionStatus) {
        case 'draft':
          if (isMyGame) stats.draftGames++;
          break;
        case 'qc_failed':
          if (isMyGame) stats.qcFailedGames++;
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

    // Get recent games (last 5)
    stats.recentGames = allGames
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(game => {
        const latestVersion = game.latestVersionId 
          ? versionLookup.get(game.latestVersionId.toString())
          : null;
        
        return {
          _id: game._id.toString(),
          title: game.title,
          gameId: game.gameId,
          status: latestVersion?.status || 'draft',
          updatedAt: game.updatedAt
        };
      });

    await client.close();

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};