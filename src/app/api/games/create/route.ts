import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { hasPermissionString } from '@/lib/auth-rbac';
import { AuditLogger } from '@/lib/audit';
import { GameHistoryService } from '@/lib/game-history';
import { generateStoragePath } from '@/lib/storage-path';
import { calculateCompleteness, DEFAULT_MANDATORY_FIELDS } from '@/lib/metadata-types';

/**
 * POST /api/games/create
 * Create a new game with initial version (atomic operation)
 * Migrated from: src/pages/api/games/create.ts
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check using cookies instead of headers
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
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
      // New metadata fields
      lessonNo,
      textbook,
      theme_primary,
      theme_secondary,
      context_tags,
      difficulty_levels,
      thumbnailDesktop,
      thumbnailMobile,
      tags,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Tên game là bắt buộc' }, { status: 400 });
    }

    // Validation for required metadata fields
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Subject là bắt buộc' }, { status: 400 });
    }

    if (!grade || !grade.trim()) {
      return NextResponse.json({ error: 'Grade level là bắt buộc' }, { status: 400 });
    }

    if (!gameType || !gameType.trim()) {
      return NextResponse.json({ error: 'Game type là bắt buộc' }, { status: 400 });
    }

    if (!lessonNo || lessonNo === '') {
      return NextResponse.json({ error: 'Lesson number là bắt buộc' }, { status: 400 });
    }

    const parsedBackendGameId =
      typeof backendGameId === "string" && ObjectId.isValid(backendGameId)
        ? new ObjectId(backendGameId)
        : backendGameId;

    const normalizedLesson =
      Array.isArray(lesson) ? (lesson[0] ?? "") : (typeof lesson === "string" ? lesson : undefined);

    const normalizedSkills = Array.isArray(skills) ? skills.filter(Boolean) : undefined;
    const normalizedThemes = Array.isArray(themes) ? themes.filter(Boolean) : undefined;
    const normalizedTags = Array.isArray(tags) ? tags.filter(Boolean) : undefined;
    const normalizedThemeSecondary = Array.isArray(theme_secondary) ? theme_secondary.filter(Boolean) : undefined;
    const normalizedContextTags = Array.isArray(context_tags) ? context_tags.filter(Boolean) : undefined;
    const normalizedDifficultyLevels = Array.isArray(difficulty_levels) ? difficulty_levels.filter(Boolean) : undefined;

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Build metadata object
    const metadata = {
      gameType,
      subject,
      grade,
      textbook: typeof textbook === "string" ? textbook : undefined,
      lessonNo: typeof lessonNo === "number" ? lessonNo : undefined,
      theme_primary: typeof theme_primary === "string" ? theme_primary : undefined,
      theme_secondary: normalizedThemeSecondary,
      context_tags: normalizedContextTags,
      difficulty_levels: normalizedDifficultyLevels,
      thumbnailUrl: typeof thumbnailDesktop === "string" ? thumbnailDesktop : undefined,
    };

    // Calculate metadata completeness
    const completeness = calculateCompleteness(metadata, DEFAULT_MANDATORY_FIELDS);

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
      tags: normalizedTags,
      thumbnailDesktop: typeof thumbnailDesktop === "string" ? thumbnailDesktop : undefined,
      thumbnailMobile: typeof thumbnailMobile === "string" ? thumbnailMobile : undefined,
      // Store metadata in the extensible metadata object
      metadata,
      metadataCompleteness: completeness,
      lastMetadataUpdate: new Date(),
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
