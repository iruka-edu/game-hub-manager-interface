import type { APIRoute } from 'astro';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';
import { bucket, CDN_BASE } from '../../../lib/gcs';

/**
 * POST /api/games/upload-thumbnail
 * Upload game thumbnail (desktop or mobile) to GCS
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
      return new Response(JSON.stringify({ error: 'Không có quyền tải lên' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const gameId = formData.get('gameId') as string;
    const type = formData.get('type') as string; // 'desktop' or 'mobile'

    // Validate required fields
    if (!file) {
      return new Response(JSON.stringify({ error: 'Vui lòng chọn file ảnh' }), {
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

    if (!type || !['desktop', 'mobile'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Loại thumbnail không hợp lệ (desktop/mobile)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Chỉ hỗ trợ file PNG, JPG, WebP' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (2MB limit for thumbnails)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'Kích thước file vượt quá 2MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `thumbnail-${type}.${ext}`;
    const storagePath = `games/${gameId}/thumbnails/${fileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Upload to GCS
      const blob = bucket.file(storagePath);
      await blob.save(buffer, {
        contentType: file.type,
        resumable: false,
        metadata: {
          cacheControl: 'public, max-age=86400', // 1 day cache
        },
      });

      const url = `${CDN_BASE}/${storagePath}`;

      console.log(`[GCS] Thumbnail ${type} uploaded: ${url}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Tải thumbnail thành công',
        url,
        type,
        fileName,
        fileSize: file.size,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (uploadError: any) {
      console.error('Thumbnail upload failed:', uploadError);
      
      return new Response(JSON.stringify({
        error: 'Lỗi tải thumbnail lên storage',
        details: uploadError.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Thumbnail API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Lỗi hệ thống',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
