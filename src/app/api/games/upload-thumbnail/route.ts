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
    console.log('[Thumbnail] Starting thumbnail upload...');
    
    // Auth check
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      console.log('[Thumbnail] No session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      console.log('[Thumbnail] Invalid session');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);
    
    if (!user) {
      console.log('[Thumbnail] User not found:', session.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Role check - only dev and admin can upload
    const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
    if (!hasRole('dev') && !hasRole('admin')) {
      console.log('[Thumbnail] Permission denied for user:', user.email);
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Parse form data
    console.log('[Thumbnail] Parsing form data...');
    const formData = await request.formData();
    const mongoGameId = formData.get('mongoGameId') as string | null;
    const thumbnailDesktop = formData.get('thumbnailDesktop') as File | null;
    const thumbnailMobile = formData.get('thumbnailMobile') as File | null;

    console.log('[Thumbnail] Form data parsed:', {
      mongoGameId,
      hasDesktop: !!thumbnailDesktop,
      hasMobile: !!thumbnailMobile,
      desktopSize: thumbnailDesktop?.size,
      mobileSize: thumbnailMobile?.size,
    });

    // Validate required fields
    if (!mongoGameId) {
      console.log('[Thumbnail] Missing mongoGameId');
      return NextResponse.json({ error: 'mongoGameId is required' }, { status: 400 });
    }

    if (!thumbnailDesktop && !thumbnailMobile) {
      console.log('[Thumbnail] No thumbnails provided');
      return NextResponse.json({ error: 'At least one thumbnail is required' }, { status: 400 });
    }

    // Get game from database
    console.log('[Thumbnail] Looking up game:', mongoGameId);
    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findById(mongoGameId);

    if (!game) {
      console.log('[Thumbnail] Game not found:', mongoGameId);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    console.log('[Thumbnail] Found game:', game.gameId);

    // Check ownership (dev can only upload to own games)
    if (!hasRole('admin') && game.ownerId !== session.userId) {
      console.log('[Thumbnail] Ownership check failed:', { gameOwner: game.ownerId, userId: session.userId });
      return NextResponse.json(
        { error: 'You can only upload thumbnails to your own games' },
        { status: 403 }
      );
    }

    const uploadedUrls: { desktop?: string; mobile?: string } = {};

    console.log('[Thumbnail] Starting file uploads...');

    // Upload desktop thumbnail
    if (thumbnailDesktop) {
      console.log('[Thumbnail] Processing desktop thumbnail:', {
        name: thumbnailDesktop.name,
        size: thumbnailDesktop.size,
        type: thumbnailDesktop.type,
      });
      
      const validation = validateImage(thumbnailDesktop, 'desktop');
      if (validation.error) {
        console.log('[Thumbnail] Desktop validation failed:', validation.error);
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const buffer = Buffer.from(await thumbnailDesktop.arrayBuffer());
      const ext = getExtension(thumbnailDesktop.name);
      const destination = `games/${game.gameId}/thumbnails/desktop.${ext}`;
      
      console.log('[Thumbnail] Uploading desktop to:', destination);
      await uploadBuffer(destination, buffer, thumbnailDesktop.type, false);
      uploadedUrls.desktop = `${CDN_BASE}/${destination}`;
      
      console.log(`[Thumbnail] Uploaded desktop: ${destination}`);
    }

    // Upload mobile thumbnail
    if (thumbnailMobile) {
      console.log('[Thumbnail] Processing mobile thumbnail:', {
        name: thumbnailMobile.name,
        size: thumbnailMobile.size,
        type: thumbnailMobile.type,
      });
      
      const validation = validateImage(thumbnailMobile, 'mobile');
      if (validation.error) {
        console.log('[Thumbnail] Mobile validation failed:', validation.error);
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const buffer = Buffer.from(await thumbnailMobile.arrayBuffer());
      const ext = getExtension(thumbnailMobile.name);
      const destination = `games/${game.gameId}/thumbnails/mobile.${ext}`;
      
      console.log('[Thumbnail] Uploading mobile to:', destination);
      await uploadBuffer(destination, buffer, thumbnailMobile.type, false);
      uploadedUrls.mobile = `${CDN_BASE}/${destination}`;
      
      console.log(`[Thumbnail] Uploaded mobile: ${destination}`);
    }

    // Update game record with thumbnail URLs
    console.log('[Thumbnail] Updating game record with URLs:', uploadedUrls);
    const updateData: { thumbnailDesktop?: string; thumbnailMobile?: string } = {};
    if (uploadedUrls.desktop) updateData.thumbnailDesktop = uploadedUrls.desktop;
    if (uploadedUrls.mobile) updateData.thumbnailMobile = uploadedUrls.mobile;

    await gameRepo.updateMetadata(mongoGameId, updateData);
    console.log('[Thumbnail] Game record updated successfully');

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
