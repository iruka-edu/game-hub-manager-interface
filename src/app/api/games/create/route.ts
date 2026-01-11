import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { getUserFromHeaders } from '@/lib/auth';
import { hasPermissionString } from '@/lib/auth-rbac';
import { AuditLogger } from '@/lib/audit';
import { GameHistoryService } from '@/lib/game-history';
import { generateStoragePath } from '@/lib/storage-path';

/**
 * POST /api/games/create
 * Create a new game with initial version (atomic operation)
 * Migrated from: src/pages/api/games/create.ts
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermissionString(user, 'games:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Tên game là bắt buộc' }, { status: 400 });
    }

    if (!gameId || !gameId.trim()) {
      return NextResponse.json({ error: 'Game ID là bắt buộc' }, { status: 400 });
    }

    const parsedBackendGameId =
      typeof backendGameId === "string" && ObjectId.isValid(backendGameId)
        ? new ObjectId(backendGameId)
        : backendGameId;

    const normalizedLesson =
      Array.isArray(lesson) ? (lesson[0] ?? "") : (typeof lesson === "string" ? lesson : undefined);

    const normalizedSkills = Array.isArray(skills) ? skills.filter(Boolean) : undefined;
    const normalizedThemes = Array.isArray(themes) ? themes.filter(Boolean) : undefined;

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

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

    await gameRepo.updateLatestVersion(game._id.toString(), version._id);
    await GameHistoryService.recordCreation(game._id.toString(), user);

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

    return NextResponse.json({ 
      success: true, 
      game: { ...game, latestVersionId: version._id },
      version 
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create game error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('already exists')) {
      try {
        const gameRepo = await GameRepository.getInstance();
        const body = await request.clone().json();
        const existingGame = await gameRepo.findByGameId(body.gameId?.trim());
        
        if (existingGame) {
          return NextResponse.json({ 
            success: true,
            message: 'Game đã tồn tại, sử dụng game hiện có',
            game: existingGame,
            existingGame: existingGame,
          }, { status: 200 });
        }
      } catch (e) {
        console.error('Error finding existing game:', e);
      }
      
      return NextResponse.json({ error: 'Game ID đã tồn tại' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
