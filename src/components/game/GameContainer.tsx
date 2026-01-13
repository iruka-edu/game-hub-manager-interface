'use client';

import { ReactNode, forwardRef } from 'react';

interface GameContainerProps {
  isFullscreen: boolean;
  cssHeight: string;
  children: ReactNode;
}

export const GameContainer = forwardRef<HTMLDivElement, GameContainerProps>(
  ({ isFullscreen, cssHeight, children }, ref) => {
    return (
      <div 
        className={`game-container bg-slate-50 no-zoom ${isFullscreen ? 'game-container-fullscreen' : ''}`}
        id="game-container"
        ref={ref}
        style={{
          height: isFullscreen ? cssHeight : `calc(${cssHeight} - 3.5rem)`,
        }}
      >
        {children}
      </div>
    );
  }
);

GameContainer.displayName = 'GameContainer';