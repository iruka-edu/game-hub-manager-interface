import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getUserRepository, getGameRepository, getGameVersionRepository } from "@/lib/repository-manager";
import { Storage } from "@google-cloud/storage";

// Initialize GCS client with optimized settings
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEY_FILE,
  credentials: process.env.GCLOUD_PRIVATE_KEY ? {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  } : undefined,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

interface GCSFile {
  name: string;
  size: number;
  updated: string;
  gameId?: string;
  version?: string;
  inDatabase: boolean;
  gameTitle?: string;
  status?: string;
}

interface GCSGameFolder {
  gameId: string;
  gameTitle?: string;
  inDatabase: boolean;
  totalFiles: number;
  totalSize: number;
  versions: string[];
  lastUpdated: string;
  files: GCSFile[];
}

async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("iruka_session");

  if (!sessionCookie?.value) {
    return null;
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    return null;
  }

  const userRepo = await getUserRepository();
  return userRepo.findById(session.userId);
}

/**
 * GET /api/gcs/files
 * List all files in GCS bucket and compare with database
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can access GCS management
    if (!currentUser.roles.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can access GCS management." },
        { status: 403 }
      );
    }

    // Parallel execution for better performance
    const [gcsFilesResult, gameRepo, versionRepo] = await Promise.all([
      bucket.getFiles({ prefix: 'games/' }),
      getGameRepository(),
      getGameVersionRepository()
    ]);

    const [files] = gcsFilesResult;

    // Get all games and versions from database using cached repositories
    const [allGames, allVersions] = await Promise.all([
      gameRepo.findAll(),
      // Get all versions from database directly
      (async () => {
        const { db } = await import('@/lib/mongodb').then(m => m.getMongoClient());
        const versionsCollection = db.collection('game_versions');
        return versionsCollection.find({ isDeleted: { $ne: true } }).toArray();
      })()
    ]);

    // Create lookup maps for O(1) access
    const gameMap = new Map(allGames.map((g: any) => [g.gameId, g]));
    const versionMap = new Map(allVersions.map((v: any) => [v.storagePath, v]));

    // Process GCS files and group by game folders
    const gameFiles: GCSFile[] = files.map(file => {
      const metadata = file.metadata;
      const fileName = file.name;
      
      // Extract gameId and version from path (format: games/{gameId}/{version}/...)
      const pathParts = fileName.split('/');
      let gameId: string | undefined;
      let version: string | undefined;
      
      if (pathParts.length >= 3 && pathParts[0] === 'games') {
        gameId = pathParts[1];
        version = pathParts[2];
      }

      // Check if this file corresponds to a database entry
      const gameVersion = versionMap.get(fileName) || 
                         (gameId && version ? versionMap.get(`games/${gameId}/${version}/`) : undefined);
      const game = gameId ? gameMap.get(gameId) : undefined;

      return {
        name: fileName,
        size: parseInt(metadata.size?.toString() || '0'),
        updated: metadata.updated || metadata.timeCreated || '',
        gameId,
        version,
        inDatabase: !!gameVersion,
        gameTitle: game?.title || undefined,
        status: gameVersion?.status || undefined,
      };
    });

    // Group files by gameId to create folder structure
    const gameFoldersMap = new Map<string, GCSGameFolder>();
    
    gameFiles.forEach(file => {
      if (!file.gameId) return; // Skip files not in game folders
      
      if (!gameFoldersMap.has(file.gameId)) {
        const game = gameMap.get(file.gameId);
        gameFoldersMap.set(file.gameId, {
          gameId: file.gameId,
          gameTitle: game?.title,
          inDatabase: !!game,
          totalFiles: 0,
          totalSize: 0,
          versions: [],
          lastUpdated: file.updated,
          files: [],
        });
      }
      
      const folder = gameFoldersMap.get(file.gameId)!;
      folder.files.push(file);
      folder.totalFiles++;
      folder.totalSize += file.size;
      
      // Track versions
      if (file.version && !folder.versions.includes(file.version)) {
        folder.versions.push(file.version);
      }
      
      // Update last updated time
      if (new Date(file.updated) > new Date(folder.lastUpdated)) {
        folder.lastUpdated = file.updated;
      }
    });

    // Convert to array and sort
    const gameFolders = Array.from(gameFoldersMap.values());
    gameFolders.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    // Sort versions within each folder
    gameFolders.forEach(folder => {
      folder.versions.sort((a, b) => {
        // Try to sort by semantic version
        const aVersion = a.split('.').map(n => parseInt(n) || 0);
        const bVersion = b.split('.').map(n => parseInt(n) || 0);
        
        for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
          const aPart = aVersion[i] || 0;
          const bPart = bVersion[i] || 0;
          if (aPart !== bPart) {
            return bPart - aPart; // Descending order (newest first)
          }
        }
        return 0;
      });
    });

    // Calculate statistics
    const stats = {
      totalFolders: gameFolders.length,
      totalFiles: gameFiles.length,
      totalSize: gameFiles.reduce((sum, file) => sum + file.size, 0),
      inDatabase: gameFolders.filter(f => f.inDatabase).length,
      orphaned: gameFolders.filter(f => !f.inDatabase).length,
    };

    return NextResponse.json({
      success: true,
      folders: gameFolders,
      stats,
    });

  } catch (error) {
    console.error("[GCS] List files error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}