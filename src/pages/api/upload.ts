import type { APIRoute } from 'astro';
import { uploadBuffer } from '../../lib/gcs';
import { RegistryManager, type GameManifest } from '../../lib/registry';
import { validateManifest } from '../../lib/validator';

interface FileUploadProgress {
  fileName: string;
  folder: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadProgress {
  totalFiles: number;
  completedFiles: number;
  currentFile: string;
  folders: Record<string, { total: number; completed: number; files: FileUploadProgress[] }>;
}

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

    // 1. Parse and enhance manifest with server-generated fields
    const manifestContent = await manifestFile.text();
    let manifest;
    try {
      manifest = JSON.parse(manifestContent);
    } catch (error) {
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

    // 2. Organize files by folder structure
    const filesByFolder: Record<string, File[]> = {};
    const progress: UploadProgress = {
      totalFiles: files.length,
      completedFiles: 0,
      currentFile: '',
      folders: {}
    };

    // Create a map to store cleaned paths for each file
    const fileCleanPaths = new Map<File, string>();
    
    files.forEach((file) => {
      const relativePath = (file as any).webkitRelativePath || file.name;
      
      // Clean up file path - handle different folder structures
      let cleanPath = relativePath;
      
      // Remove leading slash if present
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
      }
      
      const pathParts = cleanPath.split('/');
      
      // If uploading from a folder, remove the top-level folder name
      // This handles cases like "dist/", "build/", etc.
      if (pathParts.length > 1 && (file as any).webkitRelativePath) {
        const rootFolder = pathParts[0].toLowerCase();
        if (['dist', 'build', 'public', 'output', 'static', 'www'].includes(rootFolder) || 
            pathParts[0].includes('-') || pathParts[0].includes('_')) {
          cleanPath = pathParts.slice(1).join('/');
        }
      }
      
      // If cleanPath is just the filename (no folders), use the original filename
      if (!cleanPath.includes('/') && cleanPath !== file.name) {
        cleanPath = file.name;
      }
      
      // Store the cleaned path for this file
      fileCleanPaths.set(file, cleanPath);
      
      const folderPath = cleanPath.includes('/') ? cleanPath.split('/').slice(0, -1).join('/') : 'root';
      
      if (!filesByFolder[folderPath]) {
        filesByFolder[folderPath] = [];
        progress.folders[folderPath] = {
          total: 0,
          completed: 0,
          files: []
        };
      }
      
      filesByFolder[folderPath].push(file);
      progress.folders[folderPath].total++;
      progress.folders[folderPath].files.push({
        fileName: file.name,
        folder: folderPath,
        status: 'pending'
      });
    });

    // Debug: Log all files and their folder structure
    console.log(`[Upload] File structure:`);
    Object.entries(progress.folders).forEach(([folder, info]) => {
      console.log(`  ${folder}: ${info.files.map(f => f.fileName).join(', ')}`);
    });

    // 3. Upload files folder by folder for better organization
    const uploadResults: Array<{ success: boolean; file: string; error?: string }> = [];
    
    for (const [folderPath, folderFiles] of Object.entries(filesByFolder)) {
      console.log(`[Upload] Processing folder: ${folderPath} (${folderFiles.length} files)`);
      
      // Upload files in this folder
      for (const file of folderFiles) {
        try {
          const cleanPath = fileCleanPaths.get(file) || file.name;
          const destination = `games/${id}/${version}/${cleanPath}`;
          
          progress.currentFile = file.name;
          
          // Update file status to uploading
          const fileProgress = progress.folders[folderPath].files.find(f => f.fileName === file.name);
          if (fileProgress) fileProgress.status = 'uploading';
          
          let buffer: Buffer;
          let contentType = file.type || 'application/octet-stream';
          
          // Special handling for manifest.json - use enhanced version
          if (cleanPath === 'manifest.json' || file.name === 'manifest.json') {
            buffer = Buffer.from(enhancedManifestContent, 'utf-8');
            contentType = 'application/json';
          } else {
            buffer = Buffer.from(await file.arrayBuffer());
          }
          
          const isHtml = cleanPath === 'index.html' || cleanPath.endsWith('.html');
          
          await uploadBuffer(destination, buffer, contentType, isHtml);
          
          // Update progress
          progress.completedFiles++;
          progress.folders[folderPath].completed++;
          if (fileProgress) fileProgress.status = 'success';
          
          uploadResults.push({ success: true, file: cleanPath });
          
          console.log(`[Upload] ✓ ${cleanPath} (${progress.completedFiles}/${progress.totalFiles})`);
          
        } catch (error: any) {
          console.error(`[Upload] ✗ Failed to upload ${file.name}:`, error);
          
          const fileProgress = progress.folders[folderPath].files.find(f => f.fileName === file.name);
          if (fileProgress) {
            fileProgress.status = 'error';
            fileProgress.error = error.message;
          }
          
          uploadResults.push({ 
            success: false, 
            file: file.name, 
            error: error.message 
          });
        }
      }
    }

    // Check if any uploads failed
    const failedUploads = uploadResults.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.error(`[Upload] ${failedUploads.length} files failed to upload`);
      return new Response(
        JSON.stringify({ 
          error: `Một số file tải lên thất bại: ${failedUploads.map(f => f.file).join(', ')}`,
          details: failedUploads
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update registry
    await RegistryManager.updateGame(id, version, manifest);

    // 5. Generate summary
    const folderSummary = Object.entries(progress.folders).map(([folder, info]) => 
      `${folder}: ${info.completed}/${info.total} files`
    ).join(', ');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã tải lên thành công ${manifest.title || id} v${version}!`,
        gameId: id,
        version: version,
        entryUrl: `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET_NAME}/games/${id}/${version}/index.html`,
        summary: {
          totalFiles: progress.totalFiles,
          folders: Object.keys(progress.folders).length,
          folderBreakdown: folderSummary
        }
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