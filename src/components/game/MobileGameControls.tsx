'use client';

interface MobileGameControlsProps {
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}

export function MobileGameControls({
  isFullscreen,
  onFullscreenToggle,
}: MobileGameControlsProps) {
  return (
    <button
      onClick={onFullscreenToggle}
      className="fixed bottom-4 right-4 z-60 w-14 h-14 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
      title={isFullscreen ? "Thoát fullscreen" : "Fullscreen"}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isFullscreen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        )}
      </svg>
    </button>
  );
}