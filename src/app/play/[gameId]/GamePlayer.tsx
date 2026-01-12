'use client';

import { useEffect, useState } from 'react';

interface SerializedGame {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  ownerId: string;
  teamId?: string;
  latestVersionId?: string;
  liveVersionId?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  priority?: string;
  tags?: string[];
  lesson?: string;
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  disabled?: boolean;
  rolloutPercentage?: number;
  publishedAt?: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SerializedVersion {
  _id: string;
  gameId?: string;
  version: string;
  storagePath?: string;
  entryFile?: string;
  buildSize?: number;
  status: string;
  isDeleted: boolean;
  selfQAChecklist?: any;
  releaseNote?: string;
  submittedBy?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GamePlayerProps {
  game: SerializedGame;
  version: SerializedVersion | null;
  gameUrl: string;
  gameId: string;
}

export function GamePlayer({ game, version, gameUrl, gameId }: GamePlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbarInFullscreen, setShowToolbarInFullscreen] = useState(false);

  useEffect(() => {
    // Handle iframe loading
    const iframe = document.querySelector('iframe');
    const loading = document.getElementById('game-loading');
    
    if (iframe && loading) {
      // Show loading initially
      loading.style.display = 'flex';
      
      // Hide loading when iframe loads
      const handleIframeLoad = () => {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          if (loading) {
            loading.style.display = 'none';
          }
        }, 100);
      };
      
      // Add load event listener
      iframe.addEventListener('load', handleIframeLoad);
      
      // Backup timeout - hide loading after 10 seconds regardless
      const backupTimeout = setTimeout(() => {
        if (loading && loading.style.display !== 'none') {
          console.log('Loading timeout - hiding loading overlay');
          loading.style.display = 'none';
        }
      }, 10000);
      
      // Cleanup function
      const cleanup = () => {
        iframe.removeEventListener('load', handleIframeLoad);
        clearTimeout(backupTimeout);
      };
      
      // If iframe is already loaded (cached), hide loading immediately
      if (iframe.complete || iframe.readyState === 'complete') {
        handleIframeLoad();
      }
      
      return cleanup;
    }
  }, [gameUrl]); // Re-run when gameUrl changes

  useEffect(() => {
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      setShowToolbarInFullscreen(false); // Hide toolbar when entering fullscreen
      
      const container = document.getElementById('game-container');
      if (isNowFullscreen) {
        container?.classList.add('fullscreen-active');
      } else {
        container?.classList.remove('fullscreen-active');
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Prevent zoom on double tap for mobile
    let lastTouchEnd = 0;
    const handleTouchEnd = (event: TouchEvent) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    document.addEventListener('touchend', handleTouchEnd, false);
    
    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleFullscreen = () => {
    const container = document.getElementById('game-container');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  return (
    <>
      {/* Game Play Interface */}
      <div className="min-h-screen bg-slate-50" id="game-container">
        {/* Game Toolbar - Hidden in fullscreen unless toggled */}
        <div className={`bg-white border-b border-slate-200 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-10 transition-transform duration-300 ${
          isFullscreen && !showToolbarInFullscreen ? '-translate-y-full' : 'translate-y-0'
        }`}>
          <div className="flex items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <a 
                href="/console" 
                className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Console</span>
              </a>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <h1 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{game.title}</h1>
              {version && (
                <>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-xs sm:text-sm text-slate-500 shrink-0">v{version.version}</span>
                </>
              )}
            </div>
            
            {/* Right side - Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Device indicator */}
              <div className="hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                </svg>
                Desktop
              </div>
              
              {/* Test mode indicator */}
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Test
              </span>
              
              {/* Fullscreen button */}
              <button
                onClick={handleFullscreen}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Fullscreen"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
              
              {/* Game details link */}
              <a 
                href={`/console/games/${gameId}`}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chi tiết
              </a>
            </div>
          </div>
        </div>

        {/* Fullscreen Toolbar Toggle Button */}
        {isFullscreen && (
          <button
            onClick={() => setShowToolbarInFullscreen(!showToolbarInFullscreen)}
            className={`fixed top-4 left-4 z-50 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-300 ${
              showToolbarInFullscreen ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
            title={showToolbarInFullscreen ? 'Ẩn thanh công cụ' : 'Hiện thanh công cụ'}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${showToolbarInFullscreen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Game Frame Container - Responsive */}
        <div className="relative">
          {/* Game Frame */}
          <div 
            className="w-full" 
            style={{ 
              height: isFullscreen ? '100vh' : 'calc(100vh - 60px)' 
            }}
          >
            <iframe
              src={gameUrl}
              className="w-full h-full border-0 bg-white"
              title={game.title}
              allow="fullscreen; autoplay; microphone; camera"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
              loading="lazy"
            />
          </div>
          
          {/* Loading overlay */}
          <div 
            id="game-loading" 
            className="absolute inset-0 bg-white flex items-center justify-center cursor-pointer"
            style={{ display: 'none' }}
            onClick={() => {
              const loading = document.getElementById('game-loading');
              if (loading) {
                loading.style.display = 'none';
              }
            }}
            title="Click để ẩn loading"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Đang tải game...</p>
              <p className="text-xs text-slate-400 mt-2">Click để ẩn nếu game đã sẵn sàng</p>
            </div>
          </div>
        </div>

        {/* Mobile-specific controls - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="sm:hidden fixed bottom-4 right-4 z-20">
            <div className="flex flex-col gap-2">
              {/* Mobile fullscreen button */}
              <button
                onClick={handleFullscreen}
                className="w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50"
                title="Fullscreen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              
              {/* Mobile game details button */}
              <a 
                href={`/console/games/${gameId}`}
                className="w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50"
                title="Chi tiết game"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 640px) {
          #game-container {
            padding: 0;
          }
        }
        
        /* Fullscreen styles */
        #game-container:fullscreen {
          background: white;
        }
        
        /* Device-specific optimizations */
        @media (max-width: 768px) {
          iframe {
            touch-action: manipulation;
          }
        }
        
        /* Landscape mobile optimization */
        @media (max-height: 500px) and (orientation: landscape) {
          .sticky {
            position: relative !important;
          }
        }
        
        /* Fullscreen toolbar animations */
        .fullscreen-active .sticky {
          position: fixed !important;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
        }
      `}</style>
    </>
  );
}