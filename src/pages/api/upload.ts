import type { APIRoute } from 'astro';
import { uploadBuffer } from '../../lib/gcs';
import { RegistryManager, type GameManifest } from '../../lib/registry';
import { validateManifest } from '../../lib/validator';

export const POST: APIRoute = async ({ request }) => {
  // Check credentials early
  if (!process.env.GCLOUD_PROJECT_ID || (!process.env.GCLOUD_CLIENT_EMAIL && !process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.error('[Upload] Missing GCS credentials');
    return new Response(
      JSON.stringify({ 
        error: 'Cấu hình server chưa đúng. Vui lòng kiểm tra environment variables (GCLOUD_PROJECT_ID, GCLOUD_CLIENT_EMAIL, GCLOUD_PRIVATE_KEY)' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Find manifest file
    const manifestFile = files.find(
      (f) => f.name === 'manifest.json' || (f as any).webkitRelativePath?.endsWith('/manifest.json')
    );

    if (!manifestFile) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy manifest.json trong các file đã tải lên' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Parse and validate manifest
    const manifestContent = await manifestFile.text();
    const validation = validateManifest(manifestContent);

    if (!validation.valid || !validation.manifest) {
      return new Response(
        JSON.stringify({ error: validation.errors.join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const manifest = validation.manifest;
    const { id, version } = manifest;

    // 2. Upload all files to GCS
    const uploadPromises = files.map(async (file) => {
      // webkitRelativePath: "dist/assets/image.png"
      // We need: "games/<id>/<version>/assets/image.png"
      const relativePath = (file as any).webkitRelativePath || file.name;
      const pathParts = relativePath.split('/');
      
      // Remove top-level folder (e.g., 'dist') from path
      const cleanPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : file.name;
      const destination = `games/${id}/${version}/${cleanPath}`;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const isHtml = cleanPath === 'index.html' || cleanPath.endsWith('.html');
      
      await uploadBuffer(destination, buffer, file.type || 'application/octet-stream', isHtml);
    });

    await Promise.all(uploadPromises);

    // 3. Update registry
    await RegistryManager.updateGame(id, version, manifest);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã tải lên thành công ${manifest.title || id} v${version}!`,
        gameId: id,
        version: version,
        entryUrl: `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET_NAME}/games/${id}/${version}/index.html`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Better error messages for common issues
    let errorMessage = error.message || 'Upload failed';
    
    if (error.message?.includes('Could not load the default credentials')) {
      errorMessage = 'Lỗi xác thực Google Cloud. Vui lòng kiểm tra GCLOUD_CLIENT_EMAIL và GCLOUD_PRIVATE_KEY trong environment variables.';
    } else if (error.message?.includes('403')) {
      errorMessage = 'Không có quyền truy cập GCS bucket. Kiểm tra service account permissions.';
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};