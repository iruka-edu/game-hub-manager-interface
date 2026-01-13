// src/hooks/useViewportHeight.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to get accurate viewport height that accounts for mobile browser UI
 * Uses the new CSS viewport units (svh, lvh, dvh) with fallbacks
 */
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [supportsSvh, setSupportsSvh] = useState<boolean>(false);

  useEffect(() => {
    // Check if browser supports svh unit
    const checkSvhSupport = () => {
      try {
        const testElement = document.createElement('div');
        testElement.style.height = '100svh';
        return testElement.style.height === '100svh';
      } catch {
        return false;
      }
    };

    setSupportsSvh(checkSvhSupport());

    const updateViewportHeight = () => {
      // Use window.innerHeight as fallback for older browsers
      const height = window.innerHeight;
      setViewportHeight(height);
      
      // Set CSS custom property for use in CSS
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
    };

    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Delay to account for browser UI animation
      setTimeout(updateViewportHeight, 100);
    });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return {
    viewportHeight,
    supportsSvh,
    // CSS value to use in styles
    cssHeight: supportsSvh ? '100svh' : `${viewportHeight}px`,
  };
};