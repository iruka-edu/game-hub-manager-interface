'use client';

import { useState, useEffect } from 'react';

interface OrientationLockProps {
  preferredOrientation?: 'landscape' | 'portrait' | 'any';
  children: React.ReactNode;
}

export function OrientationLock({ 
  preferredOrientation = 'any', 
  children 
}: OrientationLockProps) {
  const [currentOrientation, setCurrentOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setCurrentOrientation(isLandscape ? 'landscape' : 'portrait');
      
      // Show hint if orientation doesn't match preference on mobile
      if (preferredOrientation !== 'any' && window.innerWidth <= 640) {
        const shouldShowHint = (
          (preferredOrientation === 'landscape' && !isLandscape) ||
          (preferredOrientation === 'portrait' && isLandscape)
        );
        setShowHint(shouldShowHint);
      } else {
        setShowHint(false);
      }
    };

    updateOrientation();
    
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', () => {
      // Delay to account for browser UI changes
      setTimeout(updateOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [preferredOrientation]);

  // Try to lock orientation if supported
  useEffect(() => {
    if (preferredOrientation !== 'any' && 'screen' in window && 'orientation' in window.screen) {
      const lockOrientation = async () => {
        try {
          if (preferredOrientation === 'landscape') {
            await (window.screen.orientation as any).lock('landscape');
          } else if (preferredOrientation === 'portrait') {
            await (window.screen.orientation as any).lock('portrait');
          }
        } catch (error) {
          // Orientation lock failed, that's okay
          console.log('Orientation lock not supported or failed');
        }
      };

      lockOrientation();
    }

    return () => {
      // Unlock orientation when component unmounts
      if ('screen' in window && 'orientation' in window.screen) {
        try {
          (window.screen.orientation as any).unlock();
        } catch (error) {
          // Ignore unlock errors
        }
      }
    };
  }, [preferredOrientation]);

  return (
    <div className={`orientation-container ${showHint ? 'orientation-mismatch' : ''}`}>
      {children}
      
      {/* Orientation hint overlay */}
      {showHint && (
        <div className="orientation-hint">
          <div className="text-center">
            <div className="mb-4">
              {preferredOrientation === 'landscape' ? (
                <svg className="w-16 h-16 mx-auto text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.01 7L1 17c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H3c-1.1 0-1.99.9-1.99 2zM19 7v10H5V7h14z"/>
                </svg>
              ) : (
                <svg className="w-16 h-16 mx-auto text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">
              {preferredOrientation === 'landscape' 
                ? 'Xoay ngang để chơi game' 
                : 'Xoay dọc để chơi game'
              }
            </h3>
            
            <p className="text-sm opacity-90">
              {preferredOrientation === 'landscape'
                ? 'Game này được thiết kế để chơi ở chế độ ngang'
                : 'Game này được thiết kế để chơi ở chế độ dọc'
              }
            </p>
            
            <button
              onClick={() => setShowHint(false)}
              className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .orientation-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .orientation-mismatch {
          overflow: hidden;
        }
        
        .orientation-hint {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 2rem;
        }
        
        @media (min-width: 641px) {
          .orientation-hint {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}