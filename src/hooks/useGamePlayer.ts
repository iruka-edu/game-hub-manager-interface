'use client';

import { useState, useEffect, useRef } from 'react';
import { useFullscreen } from './useFullscreen';
import { useHideAddressBar } from './useHideAddressBar';
import { useViewportHeight } from './useViewportHeight';
import { DeviceType } from '@/types/game';
import { ResponsiveControlManager } from '@/lib/responsive-control-manager';

export function useGamePlayer(gameUrl: string) {
  const [showToolbarInFullscreen, setShowToolbarInFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { isFullscreen, isIOS, toggleFullscreen } = useFullscreen({
    onEnter: () => setShowToolbarInFullscreen(false),
    onExit: () => setShowToolbarInFullscreen(false),
  });
  
  useHideAddressBar();
  const { cssHeight, supportsSvh } = useViewportHeight();

  // Enhanced device type detection using ResponsiveControlManager
  useEffect(() => {
    const controlManager = ResponsiveControlManager.getInstance();
    
    const updateDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;
      
      // Use enhanced device detection
      const detectedType = controlManager.detectDeviceType(width, height, userAgent);
      setDeviceType(detectedType);
    };

    updateDeviceType();
    
    // Listen for both resize and orientation change events
    window.addEventListener('resize', updateDeviceType);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(updateDeviceType, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateDeviceType);
      window.removeEventListener('orientationchange', updateDeviceType);
    };
  }, []);

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (containerRef.current) {
      toggleFullscreen(containerRef.current);
    }
  };

  // Handle iframe loading
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error and retry
  const handleIframeError = () => {
    setLoadError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setLoadError(false);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = gameUrl;
    }
  };

  // Handle iframe loading with better error handling
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
        setLoadError(false);
      }, 500);
    };

    const handleError = () => {
      setIsLoading(false);
      setLoadError(true);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Backup timeout - hide loading after 15 seconds
    const backupTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setLoadError(true);
      }
    }, 15000);

    // If iframe is already loaded (cached), hide loading immediately
    try {
      if (iframe.contentDocument?.readyState === "complete") {
        handleLoad();
      }
    } catch (e) {
      // Ignore cross-origin errors
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      clearTimeout(backupTimeout);
    };
  }, [gameUrl, isLoading]);

  // Handle escape key for fullscreen exit
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // Auto-hide toolbar in fullscreen with device-specific timing
  useEffect(() => {
    if (!isFullscreen) return;

    const controlManager = ResponsiveControlManager.getInstance();
    const deviceConfig = controlManager.getDeviceConfig(deviceType);
    const autoHideDelay = deviceConfig.fullscreen.autoHideDelay;

    let hideTimeout: NodeJS.Timeout;
    
    const showToolbar = () => {
      setShowToolbarInFullscreen(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        setShowToolbarInFullscreen(false);
      }, autoHideDelay);
    };

    const handleMouseMove = () => showToolbar();
    const handleTouchStart = () => showToolbar();

    // Show toolbar initially
    showToolbar();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
      clearTimeout(hideTimeout);
    };
  }, [isFullscreen, deviceType]);

  // Prevent zoom on double tap for mobile
  useEffect(() => {
    let lastTouchEnd = 0;
    const handleTouchEnd = (event: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return {
    // State
    isFullscreen,
    isIOS,
    showToolbarInFullscreen,
    isLoading,
    loadError,
    deviceType,
    cssHeight,
    supportsSvh,
    
    // Refs
    iframeRef,
    containerRef,
    
    // Handlers
    handleFullscreenToggle,
    handleIframeLoad,
    handleIframeError,
    handleRetry,
    setShowToolbarInFullscreen,
  };
}