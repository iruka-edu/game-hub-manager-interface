'use client';

export function GameStyles() {
  return (
    <style jsx>{`
      /* Mobile game container optimizations */
      .game-container {
        height: 100vh; /* Fallback */
        height: 100svh; /* Small viewport height - excludes mobile UI */
        width: 100vw;
        overflow: hidden;
        position: relative;
        background: #000;
      }

      .game-container-fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        height: 100svh !important;
        z-index: 9999 !important;
        background: #000 !important;
      }

      .game-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      .game-iframe-fullscreen {
        width: 100vw !important;
        height: 100vh !important;
        height: 100svh !important;
      }

      .no-zoom {
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }

      .game-toolbar-hidden {
        transform: translateY(-100%);
      }

      /* Mobile-specific adjustments */
      @media (max-width: 640px) {
        .game-toolbar {
          padding: 0.5rem 0.75rem;
          height: 3rem;
        }
      }

      /* iOS Safari specific optimizations */
      @supports (-webkit-touch-callout: none) {
        .game-container {
          /* Use safe area insets for notched devices */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        .game-container-fullscreen {
          /* Remove safe area padding in fullscreen */
          padding: 0 !important;
        }
      }

      /* Landscape mobile optimization */
      @media (max-height: 500px) and (orientation: landscape) {
        .game-toolbar {
          position: relative !important;
          height: 2.5rem;
        }
        
        .game-container {
          height: calc(100vh - 2.5rem) !important;
          height: calc(100svh - 2.5rem) !important;
        }
        
        .game-container-fullscreen {
          height: 100vh !important;
          height: 100svh !important;
        }
      }

      /* PWA mode adjustments */
      @media (display-mode: standalone) {
        .game-container {
          padding-top: 0;
        }
      }

      /* Loading and error overlays */
      .game-loading,
      .game-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .game-loading {
        background: #f8fafc;
      }

      .game-error {
        background: #fef2f2;
        flex-direction: column;
        padding: 2rem;
        text-align: center;
      }
    `}</style>
  );
}