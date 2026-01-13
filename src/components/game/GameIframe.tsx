'use client';

import { forwardRef } from 'react';

interface GameIframeProps {
  src: string;
  title: string;
  isFullscreen: boolean;
  onLoad: () => void;
  onError: () => void;
}

export const GameIframe = forwardRef<HTMLIFrameElement, GameIframeProps>(
  ({ src, title, isFullscreen, onLoad, onError }, ref) => {
    return (
      <iframe
        ref={ref}
        src={src}
        className={`game-iframe ${isFullscreen ? 'game-iframe-fullscreen' : ''}`}
        onLoad={onLoad}
        onError={onError}
        allow="fullscreen; autoplay; microphone; camera; accelerometer; gyroscope"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals allow-orientation-lock"
        title={title}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    );
  }
);

GameIframe.displayName = 'GameIframe';