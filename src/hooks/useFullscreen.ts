// src/hooks/useFullscreen.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFullscreenOptions {
  onEnter?: () => void;
  onExit?: () => void;
}

export const useFullscreen = (options: UseFullscreenOptions = {}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
  }, []);

  const toggleFullscreen = useCallback(async (element?: HTMLElement) => {
    const targetElement = element || document.documentElement;

    try {
      if (isIOS) {
        // iOS doesn't support Fullscreen API, use viewport fullscreen
        if (!isFullscreen) {
          // Enter iOS fullscreen mode
          document.body.style.overflow = 'hidden';
          targetElement.style.position = 'fixed';
          targetElement.style.top = '0';
          targetElement.style.left = '0';
          targetElement.style.width = '100vw';
          targetElement.style.height = '100svh'; // Use svh for better mobile support
          targetElement.style.zIndex = '9999';
          targetElement.style.backgroundColor = '#000';
          
          // Hide Safari UI on iOS
          if ((window.navigator as any).standalone === false) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui';
            document.head.appendChild(meta);
          }
          
          setIsFullscreen(true);
          options.onEnter?.();
        } else {
          // Exit iOS fullscreen mode
          document.body.style.overflow = '';
          targetElement.style.position = '';
          targetElement.style.top = '';
          targetElement.style.left = '';
          targetElement.style.width = '';
          targetElement.style.height = '';
          targetElement.style.zIndex = '';
          targetElement.style.backgroundColor = '';
          
          setIsFullscreen(false);
          options.onExit?.();
        }
      } else {
        // Standard Fullscreen API for other devices
        if (!document.fullscreenElement) {
          await targetElement.requestFullscreen();
          setIsFullscreen(true);
          options.onEnter?.();
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
          options.onExit?.();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback to viewport fullscreen for all devices
      if (!isFullscreen) {
        document.body.style.overflow = 'hidden';
        targetElement.style.position = 'fixed';
        targetElement.style.top = '0';
        targetElement.style.left = '0';
        targetElement.style.width = '100vw';
        targetElement.style.height = '100svh';
        targetElement.style.zIndex = '9999';
        targetElement.style.backgroundColor = '#000';
        setIsFullscreen(true);
        options.onEnter?.();
      } else {
        document.body.style.overflow = '';
        targetElement.style.position = '';
        targetElement.style.top = '';
        targetElement.style.left = '';
        targetElement.style.width = '';
        targetElement.style.height = '';
        targetElement.style.zIndex = '';
        targetElement.style.backgroundColor = '';
        setIsFullscreen(false);
        options.onExit?.();
      }
    }
  }, [isFullscreen, isIOS, options]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!isIOS) {
        const newIsFullscreen = !!document.fullscreenElement;
        setIsFullscreen(newIsFullscreen);
        
        if (newIsFullscreen) {
          options.onEnter?.();
        } else {
          options.onExit?.();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isIOS, options]);

  return {
    isFullscreen,
    isIOS,
    toggleFullscreen,
  };
};