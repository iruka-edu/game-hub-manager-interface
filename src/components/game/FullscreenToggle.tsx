'use client';

interface FullscreenToggleProps {
  showToolbar: boolean;
  onToggle: () => void;
}

export function FullscreenToggle({
  showToolbar,
  onToggle,
}: FullscreenToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-4 left-4 z-50 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-300 ${
        showToolbar
          ? "opacity-100"
          : "opacity-60 hover:opacity-100"
      }`}
      title={showToolbar ? "Ẩn thanh công cụ" : "Hiện thanh công cụ"}
    >
      <svg
        className={`w-5 h-5 transition-transform duration-300 ${
          showToolbar ? "rotate-180" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}