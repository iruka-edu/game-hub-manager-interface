"use client";

import { OrientationLock } from "@/components/OrientationLock";
import { GameToolbar } from "@/components/game/GameToolbar";
import { GameLoadingOverlay } from "@/components/game/GameLoadingOverlay";
import { GameErrorOverlay } from "@/components/game/GameErrorOverlay";
import { GameIframe } from "@/components/game/GameIframe";
import { GameContainer } from "@/components/game/GameContainer";
import { GameStyles } from "@/components/game/GameStyles";
import { FullscreenExitButton } from "@/components/game/FullscreenExitButton";
import { useGamePlayer } from "@/hooks/useGamePlayer";
import { SerializedGame, SerializedVersion } from "@/types/game";

interface GamePlayerProps {
  game: SerializedGame;
  version: SerializedVersion | null;
  gameUrl: string;
  gameId: string;
}

export function GamePlayer({
  game,
  version,
  gameUrl,
  gameId,
}: GamePlayerProps) {
  const {
    // State
    isFullscreen,
    isIOS,
    showToolbarInFullscreen,
    isLoading,
    loadError,
    deviceType,
    cssHeight,
    supportsSvh,
    
    // Refs
    iframeRef,
    containerRef,
    
    // Handlers
    handleFullscreenToggle,
    handleIframeLoad,
    handleIframeError,
    handleRetry,
  } = useGamePlayer(gameUrl);

  const showToolbar = !isFullscreen;

  return (
    <>
      <OrientationLock preferredOrientation="landscape">
        <GameContainer
          ref={containerRef}
          isFullscreen={isFullscreen}
          cssHeight={cssHeight}
          showToolbar={showToolbar}
        >
          {/* Game Toolbar - hidden in fullscreen */}
          {showToolbar && (
            <GameToolbar
              game={game}
              version={version}
              gameId={gameId}
              deviceType={deviceType}
              isFullscreen={isFullscreen}
              showInFullscreen={showToolbarInFullscreen}
              onFullscreenToggle={handleFullscreenToggle}
              onRefresh={handleRetry}
            />
          )}

          {/* Game Frame Container */}
          <div className="relative flex-1 w-full min-h-0">
            {/* Fullscreen Exit Button - only visible in fullscreen */}
            {isFullscreen && (
              <FullscreenExitButton onClick={handleFullscreenToggle} />
            )}

            {/* Loading Overlay */}
            <GameLoadingOverlay
              isLoading={isLoading}
              isIOS={isIOS}
              supportsSvh={supportsSvh}
            />

            {/* Error Overlay */}
            <GameErrorOverlay
              hasError={loadError}
              onRetry={handleRetry}
            />

            {/* Game Iframe */}
            <GameIframe
              ref={iframeRef}
              src={gameUrl}
              title={game.title}
              isFullscreen={isFullscreen}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        </GameContainer>
      </OrientationLock>

      {/* Game Styles */}
      <GameStyles />
    </>
  );
}
