import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { GameRepository } from '@/models/Game';
import { uploadBuffer, CDN_BASE } from '@/lib/gcs';

// Max image size: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * POST /api/games/upload-thumbnail
 * Upload game thumbnails (desktop and/or mobile) to GCS
 * 
 * FormData:
 * - mongoGameId: MongoDB _id of the game (required)
 * - thumbnailDesktop: Desktop thumbnail image (308×211) (optional)
 * - thumbnailMobile: Mobile thumbnail image (343×170) (optional)
 */
export async function POST(request: Request) {
  try {
    // Auth check
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

    // Role check - only dev and admin can upload
    const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
    if (!hasRole('dev') && !hasRole('admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const mongoGameId = formData.get('mongoGameId') as string | null;
    const thumbnailDesktop = formData.get('thumbnailDesktop') as File | null;
    const thumbnailMobile = formData.get('thumbnailMobile') as File | null;

    // Validate required fields
    if (!mongoGameId) {
      return NextResponse.json({ error: 'mongoGameId is required' }, { status: 400 });
    }

    if (!thumbnailDesktop && !thumbnailMobile) {
      return NextResponse.json({ error: 'At least one thumbnail is required' }, { status: 400 });
    }

    // Get game from database
    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findById(mongoGameId);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check ownership (dev can only upload to own games)
    if (!hasRole('admin') && game.ownerId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only upload thumbnails to your own games' },
        { status: 403 }
      );
    }

    const uploadedUrls: { desktop?: string; mobile?: string } = {};

    // Upload desktop thumbnail
    if (thumbnailDesktop) {
      const validation = validateImage(thumbnailDesktop, 'desktop');
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const buffer = Buffer.from(await thumbnailDesktop.arrayBuffer());
      const ext = getExtension(thumbnailDesktop.name);
      const destination = `games/${game.gameId}/thumbnails/desktop.${ext}`;
      
      await uploadBuffer(destination, buffer, thumbnailDesktop.type, false);
      uploadedUrls.desktop = `${CDN_BASE}/${destination}`;
      
      console.log(`[Thumbnail] Uploaded desktop: ${destination}`);
    }

    // Upload mobile thumbnail
    if (thumbnailMobile) {
      const validation = validateImage(thumbnailMobile, 'mobile');
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const buffer = Buffer.from(await thumbnailMobile.arrayBuffer());
      const ext = getExtension(thumbnailMobile.name);
      const destination = `games/${game.gameId}/thumbnails/mobile.${ext}`;
      
      await uploadBuffer(destination, buffer, thumbnailMobile.type, false);
      uploadedUrls.mobile = `${CDN_BASE}/${destination}`;
      
      console.log(`[Thumbnail] Uploaded mobile: ${destination}`);
    }

    // Update game record with thumbnail URLs
    const updateData: { thumbnailDesktop?: string; thumbnailMobile?: string } = {};
    if (uploadedUrls.desktop) updateData.thumbnailDesktop = uploadedUrls.desktop;
    if (uploadedUrls.mobile) updateData.thumbnailMobile = uploadedUrls.mobile;

    await gameRepo.updateMetadata(mongoGameId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Thumbnails uploaded successfully',
      thumbnails: uploadedUrls,
      game: {
        _id: game._id.toString(),
        gameId: game.gameId,
      },
    });
  } catch (error: any) {
    console.error('[Thumbnail] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Thumbnail upload failed' },
      { status: 500 }
    );
  }
}

/**
 * Validate image file
 */
function validateImage(file: File, type: 'desktop' | 'mobile'): { error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Invalid ${type} thumbnail type. Allowed: PNG, JPG, WebP` };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return { error: `${type} thumbnail too large. Max size is 5MB` };
  }

  return {};
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  // Normalize extensions
  if (ext === 'jpeg') return 'jpg';
  if (ext === 'png' || ext === 'jpg' || ext === 'webp') return ext;
  
  return 'png'; // Default fallback
}
