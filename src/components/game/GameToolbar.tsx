"use client";

import { SerializedGame, SerializedVersion } from "@/features/games/types";
import { ResponsiveControlManager } from "@/lib/responsive-control-manager";
import { useEffect, useState } from "react";

interface UnifiedGameToolbarProps {
  game: SerializedGame;
  version: SerializedVersion | null;
  gameId: string;
  deviceType: "mobile" | "tablet" | "desktop";
  isFullscreen: boolean;
  showInFullscreen: boolean;
  onFullscreenToggle: () => void;
  onInfoToggle?: () => void;
  onRefresh?: () => void;
  gameUrl?: string; // Optional: show URL for testing
}

export function GameToolbar({
  game,
  version,
  gameId,
  deviceType,
  isFullscreen,
  showInFullscreen,
  onFullscreenToggle,
  onInfoToggle,
  onRefresh,
  gameUrl,
}: UnifiedGameToolbarProps) {
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const controlManager = ResponsiveControlManager.getInstance();

  const deviceInfo = controlManager.getDetailedDeviceInfo(
    screenWidth,
    screenHeight,
    typeof navigator !== "undefined" ? navigator.userAgent : "",
  );

  useEffect(() => {
    const updateScreenDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenWidth(width);
      setScreenHeight(height);
      setIsLandscape(width > height);
    };

    updateScreenDimensions();
    window.addEventListener("resize", updateScreenDimensions);
    window.addEventListener("orientationchange", updateScreenDimensions);

    return () => {
      window.removeEventListener("resize", updateScreenDimensions);
      window.removeEventListener("orientationchange", updateScreenDimensions);
    };
  }, []);

  const layoutConfig = controlManager.getLayoutConfig(deviceType, screenWidth);
  const buttonConfig = controlManager.getButtonConfig(deviceType);
  const spacingConfig = controlManager.getSpacingConfig(deviceType);

  // Get responsive configurations
  const toolbarHeight = controlManager.getOptimalToolbarHeight(
    deviceType,
    isLandscape,
  );
  const titleFontSize = controlManager.getResponsiveFontSize(
    deviceType,
    "title",
  );
  const versionFontSize = controlManager.getResponsiveFontSize(
    deviceType,
    "version",
  );
  const buttonFontSize = controlManager.getResponsiveFontSize(
    deviceType,
    "button",
  );
  const animationDuration = controlManager.getAnimationDuration(deviceType);

  const toolbarClasses = controlManager.getToolbarClasses(
    deviceType,
    isFullscreen,
    showInFullscreen,
  );
  const buttonClasses = controlManager.getButtonClasses(
    deviceType,
    "secondary",
  );
  const primaryButtonClasses = controlManager.getButtonClasses(
    deviceType,
    "primary",
  );
  const infoButtonClasses = controlManager.getButtonClasses(deviceType, "info");
  const iconClasses = controlManager.getIconClasses(deviceType);
  return (
    <div
      className={toolbarClasses}
      style={{
        height: toolbarHeight,
        transition: `transform ${animationDuration}ms ease-in-out`,
      }}
    >
      <div className="flex items-center justify-between h-full">
        {/* Left side - Navigation and Game Info */}
        <div
          className={`flex items-center min-w-0 flex-1 ${spacingConfig.gap}`}
        >
          {/* Back to Console */}
          <a
            href="/console"
            className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
            title="Quay lại Console"
          >
            <svg
              className="w-5 h-5"
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
          </a>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 truncate max-w-[200px] md:max-w-[400px]">
                {game.title}
              </h1>
              {version && (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold tracking-tight">
                  v{version.version}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="truncate">{gameId}</span>
            </div>
          </div>
        </div>

        {/* Center - Detailed Device Status (Testing Info) */}
        <div className="hidden lg:flex items-center gap-6 px-6 border-x border-slate-100 mx-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Thiết bị
            </span>
            <span className="text-xs font-bold text-slate-700">
              {deviceInfo.model}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Hệ điều hành
            </span>
            <span className="text-xs font-bold text-slate-700">
              {deviceInfo.os}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Trình duyệt
            </span>
            <span className="text-xs font-bold text-slate-700">
              {deviceInfo.browser}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Kích thước
            </span>
            <span className="text-xs font-bold text-slate-700 font-mono">
              {deviceInfo.resolution}
            </span>
          </div>
        </div>

        {/* Right side - Controls */}
        <div className={`flex items-center shrink-0 ${spacingConfig.gap}`}>
          {/* Mobile/Tablet Device Chip */}
          {!layoutConfig.showFullText && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {deviceType}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          )}

          {/* Fullscreen Tooltip Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-bold text-[10px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Chế độ Test
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            {/* Copy URL Button */}
            {gameUrl && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gameUrl);
                  alert("Đã copy URL game!");
                }}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all`}
                title="Copy Game URL"
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
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span className="hidden xl:inline">Copy Link</span>
              </button>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                title="Làm mới game"
              >
                <svg
                  className={iconClasses}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {layoutConfig.showFullText && <span>Làm mới</span>}
              </button>
            )}

            {/* Unified Fullscreen Button */}
            <button
              onClick={onFullscreenToggle}
              className={`${buttonClasses} transition-all duration-${animationDuration}`}
              title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              <svg
                className={iconClasses}
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
              {layoutConfig.showFullText && (
                <span>{isFullscreen ? "Thoát" : "Toàn màn hình"}</span>
              )}
            </button>

            {/* Game Details Link */}
            {layoutConfig.showGameDetailsLink && (
              <a
                href={`/console/games/${gameId}`}
                className={infoButtonClasses}
              >
                <svg
                  className={iconClasses}
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
                {layoutConfig.showFullText && <span>Chi tiết</span>}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
