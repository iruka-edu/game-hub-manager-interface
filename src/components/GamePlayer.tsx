'use client';

import { useState, useEffect } from 'react';

interface GamePlayerProps {
  gameUrl: string;
  gameTitle: string;
  gameVersion?: string;
  onBack?: () => void;
  backUrl?: string;
  detailsUrl?: string;
  className?: string;
  showToolbar?: boolean;
  testMode?: boolean;
}

export function GamePlayer({
  gameUrl,
  gameTitle,
  gameVersion,
  onBack,
  backUrl = '/console',
  detailsUrl,
  className = '',
  showToolbar = true,
  testMode = true,
}: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    // Detect device type
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', updateDeviceType);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreen = async () => {
    const container = document.getElementById('game-player-container');
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = backUrl;
    }
  };

  return (
    <div className={`game-player-wrapper ${className}`}>
      {showToolbar && (
        <div className="game-toolbar bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-900">{gameTitle}</span>
              {gameVersion && <span className="ml-2">v{gameVersion}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {detailsUrl && (
              <a
                href={detailsUrl}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                Chi tiết
              </a>
            )}
            <button
              onClick={handleFullscreen}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              {isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            </button>
          </div>
        </div>
      )}

      <div
        id="game-player-container"
        className={`game-container relative ${isFullscreen ? 'fullscreen' : ''}`}
        style={{
          height: showToolbar ? 'calc(100vh - 60px)' : '100vh',
          backgroundColor: '#000'
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Đang tải game...</p>
            </div>
          </div>
        )}

        <iframe
          src={gameUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          allow="fullscreen; autoplay; microphone; camera"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          title={gameTitle}
        />
      </div>

      <style jsx>{`
        .game-player-wrapper {
          position: relative;
          width: 100%;
          height: 100vh;
        }
        
        .game-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          background: #000;
        }
        
        .game-container.fullscreen iframe {
          width: 100vw;
          height: 100vh;
        }
      `}</style>
    </div>
  );
}