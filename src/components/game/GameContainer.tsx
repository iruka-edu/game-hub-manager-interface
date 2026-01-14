'use client';

import { ReactNode, forwardRef } from 'react';

interface GameContainerProps {
  isFullscreen: boolean;
  cssHeight: string;
  showToolbar: boolean;
  children: ReactNode;
}

export const GameContainer = forwardRef<HTMLDivElement, GameContainerProps>(
  ({ isFullscreen, cssHeight, showToolbar, children }, ref) => {
    return (
      <div 
        className={`game-container bg-slate-50 no-zoom ${isFullscreen ? 'game-container-fullscreen' : ''}`}
        id="game-container"
        ref={ref}
        style={{
          height: cssHeight,
        }}
      >
        {children}
      </div>
    );
  }
);

GameContainer.displayName = 'GameContainer';