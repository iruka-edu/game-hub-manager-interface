'use client';

import { SerializedGame, SerializedVersion } from '@/types/game';

interface GameToolbarProps {
  game: SerializedGame;
  version: SerializedVersion | null;
  gameId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isFullscreen: boolean;
  showInFullscreen: boolean;
  onFullscreenToggle: () => void;
}

export function GameToolbar({
  game,
  version,
  gameId,
  deviceType,
  isFullscreen,
  showInFullscreen,
  onFullscreenToggle,
}: GameToolbarProps) {
  return (
    <div
      className={`game-toolbar bg-white border-b border-slate-200 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-10 transition-transform duration-300 ${
        isFullscreen && !showInFullscreen
          ? "game-toolbar-hidden"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <a
            href="/console"
            className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 shrink-0"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Console</span>
          </a>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <h1 className="font-semibold text-slate-900 truncate text-sm sm:text-base">
            {game.title}
          </h1>
          {version && (
            <>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm text-slate-500 shrink-0">
                v{version.version}
              </span>
            </>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Device indicator */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                clipRule="evenodd"
              />
            </svg>
            {deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablet' : 'Desktop'}
          </div>

          {/* Test mode indicator */}
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Test
          </span>

          {/* Fullscreen button - Desktop/Tablet */}
          {deviceType !== 'mobile' && (
            <button
              onClick={onFullscreenToggle}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title={isFullscreen ? "Thoát fullscreen" : "Fullscreen"}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
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
              <span className="hidden sm:inline">
                {isFullscreen ? "Thoát" : "Fullscreen"}
              </span>
            </button>
          )}

          {/* Game details link */}
          <a
            href={`/console/games/${gameId}`}
            className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Chi tiết
          </a>
        </div>
      </div>
    </div>
  );
}