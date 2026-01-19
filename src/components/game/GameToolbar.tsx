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
}: UnifiedGameToolbarProps) {
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const controlManager = ResponsiveControlManager.getInstance();

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
            className={`flex items-center text-slate-600 hover:text-slate-900 shrink-0 transition-colors duration-${animationDuration} ${spacingConfig.gap}`}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {layoutConfig.showFullText && <span>Console</span>}
          </a>

          {/* Separator */}
          {layoutConfig.showFullText && (
            <span className="text-slate-300">•</span>
          )}

          {/* Game Title */}
          <h1
            className={`font-semibold text-slate-900 truncate ${titleFontSize}`}
          >
            {game.title}
          </h1>

          {/* Version Info */}
          {version && (
            <>
              {layoutConfig.showFullText && (
                <span className="text-slate-300">•</span>
              )}
              <span className={`text-slate-500 shrink-0 ${versionFontSize}`}>
                v{version.version}
              </span>
            </>
          )}
        </div>

        {/* Right side - Controls */}
        <div className={`flex items-center shrink-0 ${spacingConfig.gap}`}>
          {/* Device Indicator */}
          {layoutConfig.showDeviceIndicator && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                  clipRule="evenodd"
                />
              </svg>
              {deviceType === "mobile"
                ? "Mobile"
                : deviceType === "tablet"
                  ? "Tablet"
                  : "Desktop"}
              {/* Show orientation indicator on mobile/tablet */}
              {(deviceType === "mobile" || deviceType === "tablet") && (
                <span className="text-xs opacity-75">
                  {isLandscape ? "⟷" : "↕"}
                </span>
              )}
            </div>
          )}

          {/* Test Mode Indicator */}
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Test
          </span>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`${buttonClasses} transition-all duration-${animationDuration}`}
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

          {/* Unified Fullscreen Button - Now available on all devices */}
          <button
            onClick={onFullscreenToggle}
            className={`${buttonClasses} transition-all duration-${animationDuration}`}
            title={isFullscreen ? "Thoát fullscreen" : "Fullscreen"}
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
              <span>{isFullscreen ? "Thoát" : "Fullscreen"}</span>
            )}
          </button>

          {/* Game Details Link */}
          {layoutConfig.showGameDetailsLink && (
            <a
              href={`/console/games/${gameId}`}
              className={`${infoButtonClasses} transition-all duration-${animationDuration}`}
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
  );
}
