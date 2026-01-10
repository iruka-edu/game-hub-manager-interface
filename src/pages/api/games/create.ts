import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';
import { AuditLogger } from '../../../lib/audit';
import { GameHistoryService } from '../../../lib/game-history';
import { generateStoragePath } from '../../../lib/storage-path';

/**
 * POST /api/games/create
 * Create a new game with initial version (atomic operation)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    if (!hasPermissionString(user, 'games:create')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const {
      title,
      gameId,
      subject,
      grade,
      unit,
      gameType,
      priority,
      description,

      backendGameId,
      lesson,
      level,
      skills,
      themes,
      linkGithub,
    } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Tên game là bắt buộc' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!gameId || !gameId.trim()) {
      return new Response(JSON.stringify({ error: 'Game ID là bắt buộc' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // backendGameId: FE thường gửi string -> convert ObjectId nếu hợp lệ
    const parsedBackendGameId =
      typeof backendGameId === "string" && ObjectId.isValid(backendGameId)
        ? new ObjectId(backendGameId)
        : backendGameId;

    // lesson: model hiện tại là string, FE bạn lại gửi string[]
    const normalizedLesson =
      Array.isArray(lesson) ? (lesson[0] ?? "") : (typeof lesson === "string" ? lesson : undefined);

    const normalizedSkills = Array.isArray(skills) ? skills.filter(Boolean) : undefined;
    const normalizedThemes = Array.isArray(themes) ? themes.filter(Boolean) : undefined;

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Create game (without version references initially)
    const game = await gameRepo.create({
      gameId: gameId.trim(),
      title: title.trim(),
      description,
      ownerId: user._id.toString(),
      subject,
      grade,
      unit,
      gameType,
      priority,

      backendGameId: parsedBackendGameId,
      lesson: normalizedLesson,
      level: typeof level === "string" ? level : undefined,
      skills: normalizedSkills,
      themes: normalizedThemes,
      linkGithub: typeof linkGithub === "string" ? linkGithub : undefined,

      isDeleted: false,
    });

    // Create initial GameVersion (version 1.0.0)
    const initialVersion = '1.0.0';
    const storagePath = generateStoragePath(gameId.trim(), initialVersion);
    
    const version = await versionRepo.create({
      gameId: game._id,
      version: initialVersion,
      storagePath,
      entryFile: 'index.html',
      status: 'draft',
      submittedBy: new ObjectId(user._id.toString()),
    });

    // Update game with latestVersionId
    await gameRepo.updateLatestVersion(game._id.toString(), version._id);

    // Record history
    await GameHistoryService.recordCreation(game._id.toString(), user);

    // Audit log
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_UPLOAD',
      target: {
        entity: 'GAME',
        id: game.gameId,
      },
      metadata: {
        method: 'CREATE_NEW',
        title: game.title,
        version: initialVersion,
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      game: { ...game, latestVersionId: version._id },
      version 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Create game error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('already exists')) {
      // Tìm game đã tồn tại và trả về
      try {
        const gameRepo = await GameRepository.getInstance();
        const existingGame = await gameRepo.findByGameId(
          (await request.clone().json()).gameId?.trim()
        );
        
        if (existingGame) {
          return new Response(JSON.stringify({ 
            success: true,
            message: 'Game đã tồn tại, sử dụng game hiện có',
            game: existingGame,
            existingGame: existingGame,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error('Error finding existing game:', e);
      }
      
      return new Response(JSON.stringify({ error: 'Game ID đã tồn tại' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Lỗi hệ thống' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
