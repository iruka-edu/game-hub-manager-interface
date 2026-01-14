'use client';

interface FullscreenExitButtonProps {
  onClick: () => void;
}

export function FullscreenExitButton({ onClick }: FullscreenExitButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-3 right-3 z-50 p-2 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 group"
      title="Thoát fullscreen"
    >
      <svg
        className="w-5 h-5 text-white/70 group-hover:text-white transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5"
        />
      </svg>
    </button>
  );
}
