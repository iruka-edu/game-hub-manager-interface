import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { getUserFromRequest } from '../../../../lib/session';
import { Storage } from '@google-cloud/storage';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    // Auth check
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get game and check permissions
    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findById(id);

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user can edit this game
    const hasRole = (role: string) => user?.roles?.includes(role as any) ?? false;
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = hasRole('admin');

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse form data
    const formData = await request.formData();
    
    // Extract text fields
    const updateData: any = {
      title: formData.get('title') as string || '',
      description: formData.get('description') as string || '',
      teamId: formData.get('teamId') as string || '',
      subject: formData.get('subject') as string || '',
      grade: formData.get('grade') as string || '',
      unit: formData.get('unit') as string || '',
      gameType: formData.get('gameType') as string || '',
    };

    // Handle thumbnail uploads
    const desktopThumbnail = formData.get('thumbnailDesktop') as File;
    const mobileThumbnail = formData.get('thumbnailMobile') as File;

    // Upload thumbnails to GCS if provided
    if (desktopThumbnail && desktopThumbnail.size > 0) {
      const thumbnailUrl = await uploadThumbnail(desktopThumbnail, game.gameId, 'desktop');
      if (thumbnailUrl) {
        updateData.thumbnailDesktop = thumbnailUrl;
      }
    }

    if (mobileThumbnail && mobileThumbnail.size > 0) {
      const thumbnailUrl = await uploadThumbnail(mobileThumbnail, game.gameId, 'mobile');
      if (thumbnailUrl) {
        updateData.thumbnailMobile = thumbnailUrl;
      }
    }

    // Update game in database
    const updatedGame = await gameRepo.updateMetadata(id, updateData);

    if (!updatedGame) {
      return new Response(JSON.stringify({ error: 'Failed to update game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      game: {
        _id: updatedGame._id.toString(),
        title: updatedGame.title,
        description: updatedGame.description,
        thumbnailDesktop: updatedGame.thumbnailDesktop,
        thumbnailMobile: updatedGame.thumbnailMobile,
        teamId: updatedGame.teamId,
        subject: updatedGame.subject,
        grade: updatedGame.grade,
        unit: updatedGame.unit,
        gameType: updatedGame.gameType,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to update game info:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update game info',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function uploadThumbnail(file: File, gameId: string, type: 'desktop' | 'mobile'): Promise<string | null> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      throw new Error('File size must be less than 2MB');
    }

    // Initialize Google Cloud Storage
    const projectId = process.env.GCLOUD_PROJECT_ID;
    const bucketName = process.env.GCLOUD_BUCKET_NAME;
    const clientEmail = process.env.GCLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GCLOUD_PRIVATE_KEY;

    if (!projectId || !bucketName || !clientEmail || !privateKey) {
      throw new Error('Missing required GCS environment variables');
    }

    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });

    const bucket = storage.bucket(bucketName);

    // Generate file path
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `games/${gameId}/thumbnails/${type}-thumbnail.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GCS
    const gcsFile = bucket.file(fileName);
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });

    // Make file publicly readable
    await gcsFile.makePublic();

    // Return public URL
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;

  } catch (error) {
    console.error('Failed to upload thumbnail:', error);
    return null;
  }
}