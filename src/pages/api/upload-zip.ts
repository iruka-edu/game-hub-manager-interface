import type { APIRoute } from 'astro';
import JSZip from 'jszip';
import { uploadBuffer } from '../../lib/gcs';
import { RegistryManager } from '../../lib/registry';
import { validateManifest } from '../../lib/validator';

interface ExtractedFile {
  name: string;
  path: string;
  folder: string;
  content: Buffer;
  size: number;
}

interface ZipUploadProgress {
  totalFiles: number;
  extractedFiles: number;
  uploadedFiles: number;
  currentFile: string;
  folders: Record<string, { total: number; completed: number; files: string[] }>;
}

export const POST: APIRoute = async ({ request }) => {
  // Check credentials early
  if (!process.env.GCLOUD_PROJECT_ID || (!process.env.GCLOUD_CLIENT_EMAIL && !process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.error('[Upload ZIP] Missing GCS credentials');
    return new Response(
      JSON.stringify({ 
        error: 'Cấu hình server chưa đúng. Vui lòng kiểm tra environment variables' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const zipFile = formData.get('zipFile') as File;
    const manifestData = formData.get('manifest') as string;

    if (!zipFile) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy file ZIP' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!manifestData) {
      return new Response(
        JSON.stringify({ error: 'Thiếu thông tin manifest' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Parse and enhance manifest with server-generated fields
    let manifest;
    try {
      manifest = JSON.parse(manifestData);
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
    const enhancedManifestData = JSON.stringify(manifest);
    const validation = validateManifest(enhancedManifestData);
    if (!validation.valid || !validation.manifest) {
      return new Response(
        JSON.stringify({ error: validation.errors.join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Upload ZIP] Processing ${zipFile.name} for game ${id} v${version}`);

    // 2. Extract ZIP file
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);

    const extractedFiles: ExtractedFile[] = [];
    const progress: ZipUploadProgress = {
      totalFiles: 0,
      extractedFiles: 0,
      uploadedFiles: 0,
      currentFile: '',
      folders: {}
    };

    // Count total files first
    Object.keys(zipContent.files).forEach(fileName => {
      const file = zipContent.files[fileName];
      if (!file.dir) {
        progress.totalFiles++;
      }
    });

    console.log(`[Upload ZIP] Found ${progress.totalFiles} files in ZIP`);

    // Analyze ZIP structure to determine if there's a common root folder
    const allFilePaths = Object.keys(zipContent.files).filter(fileName => !zipContent.files[fileName].dir);
    let commonRootFolder = '';
    
    if (allFilePaths.length > 0) {
      // Check if all files share a common root folder
      const firstPath = allFilePaths[0];
      const firstPathParts = firstPath.split('/');
      
      if (firstPathParts.length > 1) {
        const potentialRoot = firstPathParts[0];
        const allHaveSameRoot = allFilePaths.every(path => path.startsWith(potentialRoot + '/'));
        
        if (allHaveSameRoot) {
          // Check if this root folder looks like a build output
          const rootLower = potentialRoot.toLowerCase();
          if (['dist', 'build', 'public', 'output', 'static', 'www'].includes(rootLower) || 
              potentialRoot.includes('-') || potentialRoot.includes('_')) {
            commonRootFolder = potentialRoot;
            console.log(`[Upload ZIP] Detected common root folder to remove: ${commonRootFolder}`);
          }
        }
      }
    }

    // 3. Extract all files from ZIP
    for (const fileName of Object.keys(zipContent.files)) {
      const file = zipContent.files[fileName];
      
      if (file.dir) continue; // Skip directories
      
      try {
        const content = await file.async('nodebuffer');
        
        // Clean up file path - handle different ZIP structures
        let cleanPath = fileName;
        
        // Remove leading slash if present
        if (cleanPath.startsWith('/')) {
          cleanPath = cleanPath.substring(1);
        }
        
        // Remove common root folder if detected
        if (commonRootFolder && cleanPath.startsWith(commonRootFolder + '/')) {
          cleanPath = cleanPath.substring(commonRootFolder.length + 1);
        }
        
        // Skip if cleanPath is empty after processing
        if (!cleanPath || cleanPath.trim() === '') {
          console.log(`[Upload ZIP] Skipping empty path for: ${fileName}`);
          continue;
        }
        
        // Determine folder structure
        const folderPath = cleanPath.includes('/') ? cleanPath.split('/').slice(0, -1).join('/') : 'root';
        const baseName = cleanPath.split('/').pop() || cleanPath;
        
        const extractedFile: ExtractedFile = {
          name: baseName,
          path: cleanPath,
          folder: folderPath,
          content,
          size: content.length
        };
        
        extractedFiles.push(extractedFile);
        progress.extractedFiles++;
        
        // Organize by folder
        if (!progress.folders[folderPath]) {
          progress.folders[folderPath] = {
            total: 0,
            completed: 0,
            files: []
          };
        }
        progress.folders[folderPath].total++;
        progress.folders[folderPath].files.push(baseName);
        
        console.log(`[Upload ZIP] Extracted: ${fileName} -> ${cleanPath} (${content.length} bytes)`);
        
      } catch (error) {
        console.error(`[Upload ZIP] Failed to extract ${fileName}:`, error);
      }
    }

    console.log(`[Upload ZIP] Successfully extracted ${extractedFiles.length} files`);
    
    // Debug: Log all extracted files and their folder structure
    console.log(`[Upload ZIP] Folder structure:`);
    Object.entries(progress.folders).forEach(([folder, info]) => {
      console.log(`  ${folder}: ${info.files.join(', ')}`);
    });

    // 4. Validate required files
    const hasIndex = extractedFiles.some(f => f.name === 'index.html' || f.path === 'index.html');
    if (!hasIndex) {
      return new Response(
        JSON.stringify({ error: 'File ZIP phải chứa index.html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Upload enhanced manifest first
    const manifestBuffer = Buffer.from(enhancedManifestData, 'utf-8');
    await uploadBuffer(`games/${id}/${version}/manifest.json`, manifestBuffer, 'application/json');

    // 6. Upload all extracted files
    const uploadResults: Array<{ success: boolean; file: string; error?: string }> = [];
    
    for (const [folderPath, folderInfo] of Object.entries(progress.folders)) {
      console.log(`[Upload ZIP] Processing folder: ${folderPath} (${folderInfo.total} files)`);
      
      const folderFiles = extractedFiles.filter(f => f.folder === folderPath);
      
      for (const file of folderFiles) {
        try {
          const destination = `games/${id}/${version}/${file.path}`;
          progress.currentFile = file.name;
          
          // Determine content type
          let contentType = 'application/octet-stream';
          const ext = file.name.split('.').pop()?.toLowerCase();
          
          if (ext === 'html') contentType = 'text/html';
          else if (ext === 'css') contentType = 'text/css';
          else if (ext === 'js') contentType = 'application/javascript';
          else if (ext === 'json') contentType = 'application/json';
          else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) contentType = `image/${ext}`;
          else if (['mp3', 'wav', 'ogg'].includes(ext || '')) contentType = `audio/${ext}`;
          else if (['mp4', 'webm'].includes(ext || '')) contentType = `video/${ext}`;
          
          const isHtml = file.path === 'index.html' || file.path.endsWith('.html');
          
          await uploadBuffer(destination, file.content, contentType, isHtml);
          
          progress.uploadedFiles++;
          progress.folders[folderPath].completed++;
          
          uploadResults.push({ success: true, file: file.path });
          
          console.log(`[Upload ZIP] ✓ ${file.path} (${progress.uploadedFiles}/${extractedFiles.length})`);
          
        } catch (error: any) {
          console.error(`[Upload ZIP] ✗ Failed to upload ${file.path}:`, error);
          
          uploadResults.push({ 
            success: false, 
            file: file.path, 
            error: error.message 
          });
        }
      }
    }

    // Check if any uploads failed
    const failedUploads = uploadResults.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.error(`[Upload ZIP] ${failedUploads.length} files failed to upload`);
      return new Response(
        JSON.stringify({ 
          error: `Một số file tải lên thất bại: ${failedUploads.map(f => f.file).join(', ')}`,
          details: failedUploads
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Update registry
    await RegistryManager.updateGame(id, version, manifest);

    // 8. Generate summary
    const folderSummary = Object.entries(progress.folders).map(([folder, info]) => 
      `${folder}: ${info.completed}/${info.total} files`
    ).join(', ');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã giải nén và tải lên thành công ${manifest.title || id} v${version} từ file ZIP!`,
        gameId: id,
        version: version,
        entryUrl: `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET_NAME}/games/${id}/${version}/index.html`,
        summary: {
          zipFile: zipFile.name,
          totalFiles: extractedFiles.length,
          folders: Object.keys(progress.folders).length,
          folderBreakdown: folderSummary,
          extractedSize: extractedFiles.reduce((sum, f) => sum + f.size, 0)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Upload ZIP] Error:', error);
    
    let errorMessage = error.message || 'Upload ZIP failed';
    
    if (error.message?.includes('Could not load the default credentials')) {
      errorMessage = 'Lỗi xác thực Google Cloud. Vui lòng kiểm tra environment variables.';
    } else if (error.message?.includes('403')) {
      errorMessage = 'Không có quyền truy cập GCS bucket.';
    } else if (error.message?.includes('corrupted')) {
      errorMessage = 'File ZIP bị hỏng hoặc không hợp lệ.';
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};