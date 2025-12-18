import type { APIRoute } from 'astro';
import { uploadBuffer, uploadBufferBatch, type UploadItem } from '../../lib/gcs';
import { validateManifest } from '../../lib/validator';
import { AuditLogger } from '../../lib/audit';
import { GameRepository } from '../../models/Game';
import { GameVersionRepository } from '../../models/GameVersion';
import { GameHistoryService } from '../../lib/game-history';
import { ObjectId } from 'mongodb';

interface FileInfo {
  file: File;
  originalPath: string;
  cleanPath: string;
  folder: string;
}

/**
 * Find the root folder by locating index.html in the file list
 * Returns the folder path that contains index.html, or empty string if at root
 */
function findRootFolder(files: File[]): string {
  for (const file of files) {
    const relativePath = (file as any).webkitRelativePath || file.name;
    const fileName = relativePath.split('/').pop()?.toLowerCase();
    
    if (fileName === 'index.html') {
      const parts = relativePath.split('/');
      if (parts.length === 1) {
        return ''; // index.html is at root
      }
      // Return the folder path (everything except the filename)
      return parts.slice(0, -1).join('/');
    }
  }
  return ''; // No index.html found, assume root
}

/**
 * Normalize file path by removing the root folder prefix
 */
function normalizeFilePath(filePath: string, rootFolder: string): string {
  if (!rootFolder) {
    return filePath;
  }

  const prefix = rootFolder + '/';
  if (filePath.startsWith(prefix)) {
    return filePath.substring(prefix.length);
  }

  return filePath;
}

/**
 * Get content type based on file extension
 */
function getContentType(fileName: string, fileType?: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'wasm': 'application/wasm',
  };

  return contentTypes[ext || ''] || fileType || 'application/octet-stream';
}

export const POST: APIRoute = async ({ request, locals }) => {
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

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Không có file nào được tải lên' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // 1. Parse and enhance manifest with server-generated fields
    const manifestContent = await manifestFile.text();
    let manifest;
    try {
      manifest = JSON.parse(manifestContent);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Manifest JSON không hợp lệ' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id, version } = manifest;
    
    // Generate entryUrl automatically
    const bucketName = process.env.GCLOUD_BUCKET_NAME || 'iruka-edu-mini-game';
    manifest.entryUrl = `https://storage.googleapis.com/${bucketName}/games/${id}/${version}/index.html`;
    
    // Add default iconUrl if not provided
    if (!manifest.iconUrl) {
      manifest.iconUrl = `https://storage.googleapis.com/${bucketName}/games/${id}/icon.png`;
    }
    
    // Add default minHubVersion if not provided
    if (!manifest.minHubVersion) {
      manifest.minHubVersion = '1.0.0';
    }
    
    // Add default disabled if not provided
    if (manifest.disabled === undefined) {
      manifest.disabled = false;
    }

    // Now validate the complete manifest
    const enhancedManifestContent = JSON.stringify(manifest);
    const validation = validateManifest(enhancedManifestContent);

    if (!validation.valid || !validation.manifest) {
      return new Response(
        JSON.stringify({ error: validation.errors.join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Upload] Processing ${files.length} files for game ${id} v${version}`);

    // 2. Find root folder by locating index.html
    const rootFolder = findRootFolder(files);
    
    if (rootFolder) {
      console.log(`[Upload] Detected root folder: "${rootFolder}" (contains index.html)`);
    } else {
      console.log(`[Upload] index.html is at root`);
    }

    // 3. Process files and normalize paths
    const fileInfos: FileInfo[] = [];
    const folderStats: Record<string, { total: number; files: string[] }> = {};

    for (const file of files) {
      const originalPath = (file as any).webkitRelativePath || file.name;
      
      // Normalize path relative to root folder
      let cleanPath = originalPath;
      
      // Remove leading slash if present
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
      }
      
      // Normalize based on detected root folder
      cleanPath = normalizeFilePath(cleanPath, rootFolder);
      
      // Skip if path is empty (file is outside root folder)
      if (!cleanPath || cleanPath.trim() === '') {
        console.log(`[Upload] Skipping: ${originalPath} (outside root folder)`);
        continue;
      }
      
      // Determine folder for stats
      const folder = cleanPath.includes('/') 
        ? cleanPath.split('/').slice(0, -1).join('/') 
        : 'root';
      
      fileInfos.push({
        file,
        originalPath,
        cleanPath,
        folder
      });
      
      // Track folder stats
      if (!folderStats[folder]) {
        folderStats[folder] = { total: 0, files: [] };
      }
      folderStats[folder].total++;
      folderStats[folder].files.push(file.name);
    }

    // Log folder structure
    console.log(`[Upload] Folder structure:`);
    Object.entries(folderStats).forEach(([folder, info]) => {
      console.log(`  ${folder}: ${info.total} files`);
    });

    // 4. Validate required files
    const hasIndex = fileInfos.some(f => f.cleanPath === 'index.html');
    if (!hasIndex) {
      return new Response(
        JSON.stringify({ 
          error: 'Không tìm thấy index.html. Đảm bảo index.html nằm trong thư mục gốc của game.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Prepare upload items
    const uploadItems: UploadItem[] = [];
    
    for (const info of fileInfos) {
      let buffer: Buffer;
      let contentType: string;
      
      // Special handling for manifest.json - use enhanced version
      if (info.cleanPath === 'manifest.json') {
        buffer = Buffer.from(enhancedManifestContent, 'utf-8');
        contentType = 'application/json';
      } else {
        buffer = Buffer.from(await info.file.arrayBuffer());
        contentType = getContentType(info.file.name, info.file.type);
      }
      
      uploadItems.push({
        destination: `games/${id}/${version}/${info.cleanPath}`,
        buffer,
        contentType,
        isHtml: info.cleanPath.endsWith('.html')
      });
    }

    // 6. Upload files in parallel (3 concurrent uploads)
    const concurrency = 3;
    console.log(`[Upload] Starting parallel upload (${concurrency} concurrent)`);
    
    const uploadResults = await uploadBufferBatch(
      uploadItems,
      concurrency,
      (completed, total, currentFile) => {
        const fileName = currentFile.split('/').pop();
        console.log(`[Upload] ✓ ${fileName} (${completed}/${total})`);
      }
    );

    // Check for failures
    const failedUploads = uploadResults.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.error(`[Upload] ${failedUploads.length} files failed to upload`);
      return new Response(
        JSON.stringify({ 
          error: `Một số file tải lên thất bại: ${failedUploads.map(f => f.destination.split('/').pop()).join(', ')}`,
          details: failedUploads
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Create or update Game and GameVersion records in MongoDB
    // NOTE: Do NOT add to registry index - game must go through QC and approval first
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    let game = await gameRepo.findByGameId(id);
    
    if (!game && locals.user) {
      // Create new game record
      game = await gameRepo.create({
        gameId: id,
        title: manifest.title || id,
        description: manifest.description || '',
        ownerId: locals.user._id.toString(),
      });
      
      // Record history
      await GameHistoryService.recordCreation(game._id.toString(), locals.user);
    }

    // 8. Create GameVersion record with status 'draft'
    let gameVersion = null;
    if (game && locals.user) {
      // Check if version already exists
      const existingVersion = await versionRepo.findByVersion(game._id.toString(), version);
      
      if (existingVersion) {
        // Update existing version (re-upload)
        gameVersion = existingVersion;
        console.log(`[Upload] Version ${version} already exists, files updated`);
      } else {
        // Create new version with draft status
        const totalSize = uploadItems.reduce((sum, item) => sum + item.buffer.length, 0);
        gameVersion = await versionRepo.create({
          gameId: game._id,
          version: version,
          storagePath: `games/${id}/${version}/`,
          entryFile: 'index.html',
          buildSize: totalSize,
          status: 'draft',
          submittedBy: new ObjectId(locals.user._id.toString()),
          releaseNote: manifest.releaseNote || '',
        });
        
        // Update game's latestVersionId
        await gameRepo.updateLatestVersion(game._id.toString(), gameVersion._id);
        
        console.log(`[Upload] Created new version ${version} with status 'draft'`);
      }
    }

    // 9. Log audit entry
    if (locals.user) {
      AuditLogger.log({
        actor: {
          user: locals.user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'GAME_UPLOAD',
        target: {
          entity: 'GAME',
          id: id,
          subId: version,
        },
        metadata: {
          method: 'FOLDER_UPLOAD',
          fileCount: fileInfos.length,
          rootFolder: rootFolder || '(root)',
          folders: Object.keys(folderStats).length,
        },
      });
    }

    // 9. Generate summary
    const folderSummary = Object.entries(folderStats)
      .map(([folder, info]) => `${folder}: ${info.total} files`)
      .join(', ');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã tải lên thành công ${manifest.title || id} v${version}! Game đang ở trạng thái Draft, cần hoàn thành Self-QA và submit để QC review.`,
        gameId: id,
        version: version,
        versionId: gameVersion?._id?.toString(),
        status: 'draft',
        entryUrl: manifest.entryUrl,
        summary: {
          rootFolder: rootFolder || '(root)',
          totalFiles: fileInfos.length,
          folders: Object.keys(folderStats).length,
          folderBreakdown: folderSummary,
          uploadConcurrency: concurrency
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    
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
