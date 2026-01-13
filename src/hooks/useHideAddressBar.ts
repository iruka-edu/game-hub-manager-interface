// src/hooks/useHideAddressBar.ts
'use client';

import { useEffect } from 'react';

/**
 * Hook to hide address bar on mobile Safari by scrolling trick
 * Safari will automatically hide the address bar when user scrolls down
 */
export const useHideAddressBar = () => {
  useEffect(() => {
    const hideAddressBar = () => {
      // Only apply on mobile devices
      if (window.innerWidth <= 768) {
        // Scroll to hide address bar on Safari
        window.scrollTo(0, 1);
        
        // Set body height slightly larger to enable scroll
        document.body.style.minHeight = '100.1vh';
        
        // Reset after a short delay
        setTimeout(() => {
          document.body.style.minHeight = '';
        }, 100);
      }
    };

    // Hide on load
    hideAddressBar();

    // Hide on orientation change
    const handleOrientationChange = () => {
      setTimeout(hideAddressBar, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', hideAddressBar);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', hideAddressBar);
      document.body.style.minHeight = '';
    };
  }, []);
};