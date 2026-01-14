import { DeviceType } from '@/types/game';

export interface ToolbarLayout {
  showDeviceIndicator: boolean;
  showFullText: boolean;
  buttonSize: 'sm' | 'md' | 'lg';
  spacing: 'tight' | 'normal' | 'loose';
  showFullscreenInToolbar: boolean;
  showGameDetailsLink: boolean;
}

export interface ButtonConfiguration {
  size: string;
  padding: string;
  fontSize: string;
  iconSize: string;
  touchTarget: string;
}

export interface SpacingConfiguration {
  gap: string;
  padding: string;
  margin: string;
}

export interface DeviceConfiguration {
  type: DeviceType;
  breakpoints: {
    min: number;
    max: number;
  };
  toolbar: {
    height: string;
    padding: string;
    fontSize: string;
  };
  controls: ButtonConfiguration;
  spacing: SpacingConfiguration;
  fullscreen: {
    togglePosition: 'toolbar' | 'floating' | 'both';
    autoHideDelay: number;
    showOnInteraction: boolean;
  };
}

export class ResponsiveControlManager {
  private static instance: ResponsiveControlManager;
  
  // Device breakpoints for responsive behavior
  private readonly breakpoints = {
    mobile: { min: 0, max: 639 },
    tablet: { min: 640, max: 1023 },
    desktop: { min: 1024, max: Infinity },
  };

  // Touch target sizes following accessibility guidelines
  private readonly touchTargets = {
    mobile: 44, // iOS HIG minimum
    tablet: 44, // Same as mobile for consistency
    desktop: 32, // Smaller for mouse precision
  };

  private deviceConfigurations: Record<DeviceType, DeviceConfiguration> = {
    mobile: {
      type: 'mobile',
      breakpoints: this.breakpoints.mobile,
      toolbar: {
        height: '3rem',
        padding: 'px-3 py-2',
        fontSize: 'text-sm',
      },
      controls: {
        size: 'w-10 h-10',
        padding: 'px-2 py-2',
        fontSize: 'text-xs',
        iconSize: 'w-4 h-4',
        touchTarget: `min-h-[${this.touchTargets.mobile}px] min-w-[${this.touchTargets.mobile}px]`,
      },
      spacing: {
        gap: 'gap-2',
        padding: 'px-3 py-2',
        margin: 'mx-1',
      },
      fullscreen: {
        togglePosition: 'toolbar',
        autoHideDelay: 3000,
        showOnInteraction: true,
      },
    },
    tablet: {
      type: 'tablet',
      breakpoints: this.breakpoints.tablet,
      toolbar: {
        height: '3.5rem',
        padding: 'px-4 py-3',
        fontSize: 'text-base',
      },
      controls: {
        size: 'w-11 h-11',
        padding: 'px-3 py-2',
        fontSize: 'text-sm',
        iconSize: 'w-5 h-5',
        touchTarget: `min-h-[${this.touchTargets.tablet}px] min-w-[${this.touchTargets.tablet}px]`,
      },
      spacing: {
        gap: 'gap-3',
        padding: 'px-4 py-3',
        margin: 'mx-2',
      },
      fullscreen: {
        togglePosition: 'toolbar',
        autoHideDelay: 3000,
        showOnInteraction: true,
      },
    },
    desktop: {
      type: 'desktop',
      breakpoints: this.breakpoints.desktop,
      toolbar: {
        height: '3.5rem',
        padding: 'px-4 py-3',
        fontSize: 'text-base',
      },
      controls: {
        size: 'w-auto h-10',
        padding: 'px-3 py-2',
        fontSize: 'text-sm',
        iconSize: 'w-4 h-4',
        touchTarget: `min-h-[${this.touchTargets.desktop}px] min-w-[${this.touchTargets.desktop}px]`,
      },
      spacing: {
        gap: 'gap-2',
        padding: 'px-4 py-3',
        margin: 'mx-2',
      },
      fullscreen: {
        togglePosition: 'toolbar',
        autoHideDelay: 3000,
        showOnInteraction: true,
      },
    },
  };

  public static getInstance(): ResponsiveControlManager {
    if (!ResponsiveControlManager.instance) {
      ResponsiveControlManager.instance = new ResponsiveControlManager();
    }
    return ResponsiveControlManager.instance;
  }

  public getLayoutConfig(deviceType: DeviceType, screenWidth: number): ToolbarLayout {
    const config = this.deviceConfigurations[deviceType];
    
    // Advanced layout calculations based on screen width and device type
    const isNarrowScreen = screenWidth < 480;
    const isWideScreen = screenWidth >= 1200;
    
    return {
      showDeviceIndicator: this.shouldShowDeviceIndicator(deviceType, screenWidth),
      showFullText: this.shouldShowFullText(deviceType, screenWidth),
      buttonSize: this.calculateButtonSize(deviceType, screenWidth),
      spacing: this.calculateSpacing(deviceType, screenWidth),
      showFullscreenInToolbar: true, // Always show in toolbar for unified experience
      showGameDetailsLink: this.shouldShowGameDetailsLink(deviceType, screenWidth),
    };
  }

  private shouldShowDeviceIndicator(deviceType: DeviceType, screenWidth: number): boolean {
    // Show device indicator on desktop and wide tablets
    return deviceType === 'desktop' || (deviceType === 'tablet' && screenWidth >= 768);
  }

  private shouldShowFullText(deviceType: DeviceType, screenWidth: number): boolean {
    // Show full text labels when there's enough space
    if (deviceType === 'mobile') return screenWidth >= 480;
    if (deviceType === 'tablet') return screenWidth >= 640;
    return true; // Always show on desktop
  }

  private calculateButtonSize(deviceType: DeviceType, screenWidth: number): 'sm' | 'md' | 'lg' {
    if (deviceType === 'mobile') {
      return screenWidth < 375 ? 'sm' : 'md';
    }
    if (deviceType === 'tablet') {
      return screenWidth < 800 ? 'md' : 'lg';
    }
    return 'lg'; // Desktop
  }

  private calculateSpacing(deviceType: DeviceType, screenWidth: number): 'tight' | 'normal' | 'loose' {
    if (deviceType === 'mobile') {
      return screenWidth < 375 ? 'tight' : 'normal';
    }
    if (deviceType === 'tablet') {
      return 'normal';
    }
    return screenWidth >= 1400 ? 'loose' : 'normal'; // Desktop
  }

  private shouldShowGameDetailsLink(deviceType: DeviceType, screenWidth: number): boolean {
    // Show game details link on larger screens
    return screenWidth >= 640;
  }

  public getButtonConfig(deviceType: DeviceType): ButtonConfiguration {
    return this.deviceConfigurations[deviceType].controls;
  }

  public getSpacingConfig(deviceType: DeviceType): SpacingConfiguration {
    return this.deviceConfigurations[deviceType].spacing;
  }

  public getDeviceConfig(deviceType: DeviceType): DeviceConfiguration {
    return this.deviceConfigurations[deviceType];
  }

  public getToolbarClasses(deviceType: DeviceType, isFullscreen: boolean, showInFullscreen: boolean): string {
    const config = this.deviceConfigurations[deviceType];
    const baseClasses = `game-toolbar bg-white border-b border-slate-200 sticky top-0 z-10 transition-transform duration-300`;
    const paddingClasses = config.toolbar.padding;
    const hiddenClasses = isFullscreen && !showInFullscreen ? 'game-toolbar-hidden' : '';
    
    return `${baseClasses} ${paddingClasses} ${hiddenClasses}`;
  }

  public getButtonClasses(deviceType: DeviceType, variant: 'primary' | 'secondary' | 'info' = 'secondary'): string {
    const config = this.deviceConfigurations[deviceType];
    const spacing = this.getSpacingConfig(deviceType);
    
    const baseClasses = `flex items-center ${spacing.gap} ${config.controls.padding} ${config.controls.fontSize} rounded-lg transition-colors ${config.controls.touchTarget}`;
    
    const variantClasses = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
      info: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50',
    };
    
    return `${baseClasses} ${variantClasses[variant]}`;
  }

  public getIconClasses(deviceType: DeviceType): string {
    const config = this.deviceConfigurations[deviceType];
    return config.controls.iconSize;
  }

  public shouldShowElement(deviceType: DeviceType, element: 'deviceIndicator' | 'fullText' | 'gameDetails'): boolean {
    switch (element) {
      case 'deviceIndicator':
        return deviceType !== 'mobile';
      case 'fullText':
        return deviceType !== 'mobile';
      case 'gameDetails':
        return deviceType !== 'mobile';
      default:
        return true;
    }
  }

  /**
   * Detect device type based on screen dimensions and user agent
   */
  public detectDeviceType(screenWidth: number, screenHeight: number, userAgent?: string): DeviceType {
    // Check user agent for mobile devices first
    if (userAgent) {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(userAgent);
      
      if (isMobileUA && !isTabletUA) return 'mobile';
      if (isTabletUA) return 'tablet';
    }

    // Fallback to screen size detection
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);

    // Mobile: smaller dimension < 640px
    if (minDimension < 640) return 'mobile';
    
    // Tablet: smaller dimension >= 640px but < 1024px, or aspect ratio suggests tablet
    if (minDimension < 1024 || (maxDimension / minDimension < 1.5 && maxDimension < 1366)) {
      return 'tablet';
    }

    return 'desktop';
  }

  /**
   * Get optimal toolbar height based on device and orientation
   */
  public getOptimalToolbarHeight(deviceType: DeviceType, isLandscape: boolean): string {
    const config = this.deviceConfigurations[deviceType];
    
    // Reduce toolbar height in landscape mode on mobile/tablet to save space
    if ((deviceType === 'mobile' || deviceType === 'tablet') && isLandscape) {
      return deviceType === 'mobile' ? '2.5rem' : '3rem';
    }
    
    return config.toolbar.height;
  }

  /**
   * Calculate responsive font sizes
   */
  public getResponsiveFontSize(deviceType: DeviceType, element: 'title' | 'version' | 'button'): string {
    const baseSizes = {
      mobile: { title: 'text-sm', version: 'text-xs', button: 'text-xs' },
      tablet: { title: 'text-base', version: 'text-sm', button: 'text-sm' },
      desktop: { title: 'text-base', version: 'text-sm', button: 'text-sm' },
    };
    
    return baseSizes[deviceType][element];
  }

  /**
   * Get animation duration based on device performance
   */
  public getAnimationDuration(deviceType: DeviceType): number {
    // Shorter animations on mobile for better performance
    return deviceType === 'mobile' ? 200 : 300;
  }
}