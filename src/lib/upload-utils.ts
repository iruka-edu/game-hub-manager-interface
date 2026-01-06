/**
 * Upload Utility Functions
 * Focused on live validation and clear feedback
 */

import type { FileItem, ManifestData, LiveCheckItem, ValidationMessage } from '../types/upload-types';
import { UPLOAD_CONFIG } from '../types/upload-types';

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate total size
 */
export function calculateTotalSize(files: FileItem[]): number {
  return files.reduce((acc, f) => acc + f.size, 0);
}

/**
 * Check if file has index.html
 */
export function hasIndexFile(files: FileItem[]): boolean {
  return files.some(f => f.path.endsWith('index.html'));
}

/**
 * Find manifest file
 */
export function findManifestFile(files: FileItem[]): FileItem | undefined {
  return files.find(f => f.path.endsWith('manifest.json'));
}

/**
 * Parse manifest safely
 */
export async function parseManifestFile(file: File): Promise<ManifestData | null> {
  try {
    const text = await file.text();
    return JSON.parse(text) as ManifestData;
  } catch {
    return null;
  }
}

/**
 * Generate live checks based on current state
 * Only 2 required conditions: 1) Files uploaded, 2) Manifest info complete
 */
export function generateLiveChecks(
  files: FileItem[],
  manifest: ManifestData | null,
  hasDesktopThumb: boolean,
  hasMobileThumb: boolean,
  isZipMode: boolean
): LiveCheckItem[] {
  const checks: LiveCheckItem[] = [];
  const totalSize = calculateTotalSize(files);

  // 1. Files uploaded check (REQUIRED)
  checks.push({
    id: 'files',
    label: 'Files đã upload',
    status: files.length > 0 ? 'success' : 'error',
    message: files.length > 0 ? `${files.length} file(s)` : 'Chưa chọn file',
    action: files.length > 0 ? undefined : 'Upload file ZIP, thư mục hoặc files'
  });

  // 2. Manifest info complete check (REQUIRED)
  const manifestComplete = manifest && 
    manifest.id && 
    manifest.version && 
    manifest.title && 
    manifest.runtime && 
    manifest.entryUrl;
  
  checks.push({
    id: 'manifest',
    label: 'Thông tin manifest',
    status: manifestComplete ? 'success' : 'error',
    message: manifestComplete ? 'Đầy đủ' : 'Thiếu thông tin',
    action: manifestComplete ? undefined : 'Điền đầy đủ Game ID, Version, Tên, Runtime, Entry URL'
  });

  // 3. Size check (WARNING only)
  if (totalSize > 0) {
    const isOverLimit = totalSize >= UPLOAD_CONFIG.MAX_FILE_SIZE;
    const isNearLimit = totalSize >= UPLOAD_CONFIG.RECOMMENDED_SIZE && !isOverLimit;
    
    checks.push({
      id: 'size',
      label: `Size: ${formatFileSize(totalSize)}`,
      status: isOverLimit ? 'warning' : isNearLimit ? 'warning' : 'success',
      message: isOverLimit ? 'Vượt 10MB' : isNearLimit ? 'Gần ngưỡng' : 'OK',
      action: isOverLimit ? 'Khuyến nghị giảm dung lượng' : isNearLimit ? 'Khuyến nghị < 3MB để tải nhanh' : undefined
    });
  }

  // 4. index.html check (INFO only)
  if (isZipMode) {
    checks.push({
      id: 'index',
      label: 'index.html',
      status: 'pending',
      message: 'Kiểm tra sau upload'
    });
  } else {
    const hasIndex = hasIndexFile(files);
    checks.push({
      id: 'index',
      label: 'index.html',
      status: hasIndex ? 'success' : 'warning',
      message: hasIndex ? 'Có ở root' : 'Không tìm thấy',
      action: hasIndex ? undefined : 'Đảm bảo có index.html ở thư mục gốc'
    });
  }

  // 5. Thumbnail Desktop (OPTIONAL)
  checks.push({
    id: 'thumbDesktop',
    label: `Thumbnail Desktop (${UPLOAD_CONFIG.THUMBNAIL_DESKTOP.width}×${UPLOAD_CONFIG.THUMBNAIL_DESKTOP.height})`,
    status: hasDesktopThumb ? 'success' : 'warning',
    message: hasDesktopThumb ? 'Đã có' : 'Chưa có',
    action: hasDesktopThumb ? undefined : 'Upload ảnh để hiển thị đẹp hơn'
  });

  // 6. Thumbnail Mobile (OPTIONAL)
  checks.push({
    id: 'thumbMobile',
    label: `Thumbnail Mobile (${UPLOAD_CONFIG.THUMBNAIL_MOBILE.width}×${UPLOAD_CONFIG.THUMBNAIL_MOBILE.height})`,
    status: hasMobileThumb ? 'success' : 'warning',
    message: hasMobileThumb ? 'Đã có' : 'Chưa có',
    action: hasMobileThumb ? undefined : 'Upload ảnh để hiển thị đẹp hơn'
  });

  return checks;
}

/**
 * Generate validation message based on checks
 */
export function generateValidationMessage(checks: LiveCheckItem[]): ValidationMessage | null {
  const errors = checks.filter(c => c.status === 'error');
  const warnings = checks.filter(c => c.status === 'warning');

  if (errors.length > 0) {
    const firstError = errors[0];
    return {
      type: 'error',
      message: `${firstError.label}: ${firstError.message}`,
      action: firstError.action
    };
  }

  if (warnings.length > 0) {
    return {
      type: 'warning',
      message: warnings.map(w => w.message).join(', '),
      action: warnings[0].action
    };
  }

  const allSuccess = checks.every(c => c.status === 'success');
  if (allSuccess) {
    return {
      type: 'success',
      message: 'Build hợp lệ',
      action: 'Bạn có thể đăng bản build'
    };
  }

  return null;
}

/**
 * Check if can submit - only requires files and complete manifest
 */
export function canSubmitUpload(checks: LiveCheckItem[]): boolean {
  const filesCheck = checks.find(c => c.id === 'files');
  const manifestCheck = checks.find(c => c.id === 'manifest');
  
  return filesCheck?.status === 'success' && manifestCheck?.status === 'success';
}

/**
 * Build FormData for upload
 */
export function buildUploadFormData(
  files: FileItem[],
  manifest: ManifestData | null,
  thumbnailDesktop: File | null,
  thumbnailMobile: File | null,
  isZipMode: boolean
): FormData {
  const formData = new FormData();

  if (manifest) {
    formData.append('manifest', JSON.stringify(manifest));
  }

  if (isZipMode && files.length > 0) {
    formData.append('zipFile', files[0].file);
  } else {
    files.forEach(f => formData.append('files', f.file));
  }

  if (thumbnailDesktop) formData.append('thumbnailDesktop', thumbnailDesktop);
  if (thumbnailMobile) formData.append('thumbnailMobile', thumbnailMobile);

  return formData;
}

/**
 * Get upload endpoint
 */
export function getUploadEndpoint(isZipMode: boolean): string {
  return isZipMode ? '/api/upload-zip' : '/api/upload';
}
