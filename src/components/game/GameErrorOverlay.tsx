'use client';

interface GameErrorOverlayProps {
  hasError: boolean;
  onRetry: () => void;
}

export function GameErrorOverlay({
  hasError,
  onRetry,
}: GameErrorOverlayProps) {
  if (!hasError) return null;

  return (
    <div className="game-error">
      <div className="text-center">
        <svg
          className="w-12 h-12 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Không thể tải game
        </h3>
        <p className="text-slate-600 mb-4">
          Game có thể đang được cập nhật hoặc có lỗi kỹ thuật.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}