'use client';

interface GameLoadingOverlayProps {
  isLoading: boolean;
  isIOS: boolean;
  supportsSvh: boolean;
}

export function GameLoadingOverlay({
  isLoading,
  isIOS,
  supportsSvh,
}: GameLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="game-loading">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Đang tải game...</p>
        <p className="text-xs text-slate-400 mt-2">
          {isIOS 
            ? "Đang tối ưu cho iOS..." 
            : supportsSvh 
            ? "Sử dụng viewport mới..." 
            : "Vui lòng đợi..."
          }
        </p>
      </div>
    </div>
  );
}