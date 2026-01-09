import type { APIRoute } from 'astro';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { uploadGameFiles } from '../../../lib/gcs';
import { generateStoragePath } from '../../../lib/storage-path';
import { AuditLogger } from '../../../lib/audit';
import { GameHistoryService } from '../../../lib/game-history';

/**
 * POST /api/games/upload
 * Upload game files (ZIP) to Google Cloud Storage
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    if (!hasPermissionString(user, 'games:create')) {
      return new Response(JSON.stringify({ error: 'Không có quyền tải lên game' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const gameId = formData.get('gameId') as string;
    const version = formData.get('version') as string;

    // Validate required fields
    if (!file) {
      return new Response(JSON.stringify({ error: 'Vui lòng chọn file để tải lên' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID là bắt buộc' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!version) {
      return new Response(JSON.stringify({ error: 'Phiên bản là bắt buộc' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return new Response(JSON.stringify({ error: 'Chỉ hỗ trợ file ZIP' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'Kích thước file vượt quá 50MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get repositories
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find the game
    const game = await gameRepo.findByGameId(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy game' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user owns the game or is admin
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Bạn chỉ có thể tải lên game của mình' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate storage path
    const storagePath = generateStoragePath(gameId, version);

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Upload to Google Cloud Storage
      const uploadResult = await uploadGameFiles(buffer, storagePath, file.name);

      // Create or update game version
      let gameVersion = await versionRepo.findByVersion(game._id.toString(), version);
      
      if (gameVersion) {
        // Update existing version using patchBuild
        const updatedVersion = await versionRepo.patchBuild(
          gameVersion._id.toString(),
          file.size,
          user._id
        );
        if (updatedVersion) {
          gameVersion = updatedVersion;
        }
      } else {
        // Create new version
        gameVersion = await versionRepo.create({
          gameId: game._id,
          version,
          storagePath,
          entryFile: 'index.html',
          buildSize: file.size,
          status: 'draft',
          submittedBy: user._id,
        });
      }

      if (!gameVersion) {
        return new Response(JSON.stringify({ error: 'Không thể tạo/cập nhật phiên bản game' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update game's latest version reference
      await gameRepo.update(game._id.toString(), {
        latestVersionId: gameVersion._id,
        updatedAt: new Date(),
      });

      // Log the upload
      await AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'GAME_UPLOAD',
        target: {
          entity: 'GAME',
          id: game._id.toString(),
        },
        metadata: {
          gameId,
          version,
          fileName: file.name,
          fileSize: file.size,
          storagePath,
        },
      });

      // Add to game history
      await GameHistoryService.addEntry(
        game._id.toString(),
        'Tải lên file mới',
        user,
        undefined,
        'draft',
        {
          version,
          fileName: file.name,
          fileSize: file.size,
        }
      );

      return new Response(JSON.stringify({
        success: true,
        message: 'Tải lên thành công',
        data: {
          gameId: game._id,
          versionId: gameVersion._id,
          version,
          storagePath,
          fileSize: file.size,
          uploadUrl: uploadResult.url,
          uploadedFiles: uploadResult.files,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (uploadError: any) {
      console.error('GCS upload failed:', uploadError);
      
      return new Response(JSON.stringify({
        error: 'Lỗi tải file lên storage',
        details: uploadError.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Upload API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Lỗi hệ thống',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};