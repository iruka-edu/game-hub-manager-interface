import { ResponsiveControlManager } from '../responsive-control-manager';

describe('ResponsiveControlManager', () => {
  let manager: ResponsiveControlManager;

  beforeEach(() => {
    manager = ResponsiveControlManager.getInstance();
  });

  describe('getLayoutConfig', () => {
    it('should return mobile layout for mobile device', () => {
      const config = manager.getLayoutConfig('mobile', 375);
      
      expect(config.showDeviceIndicator).toBe(false);
      expect(config.showFullText).toBe(false);
      expect(config.buttonSize).toBe('md'); // Updated based on screen width
      expect(config.spacing).toBe('normal'); // Updated based on screen width
      expect(config.showFullscreenInToolbar).toBe(true);
      expect(config.showGameDetailsLink).toBe(false);
    });

    it('should return tablet layout for tablet device', () => {
      const config = manager.getLayoutConfig('tablet', 768);
      
      expect(config.showDeviceIndicator).toBe(true);
      expect(config.showFullText).toBe(true);
      expect(config.buttonSize).toBe('md');
      expect(config.spacing).toBe('normal');
      expect(config.showFullscreenInToolbar).toBe(true);
      expect(config.showGameDetailsLink).toBe(true);
    });

    it('should return desktop layout for desktop device', () => {
      const config = manager.getLayoutConfig('desktop', 1200);
      
      expect(config.showDeviceIndicator).toBe(true);
      expect(config.showFullText).toBe(true);
      expect(config.buttonSize).toBe('lg');
      expect(config.spacing).toBe('normal');
      expect(config.showFullscreenInToolbar).toBe(true);
      expect(config.showGameDetailsLink).toBe(true);
    });

    it('should adapt layout based on screen width', () => {
      // Very narrow mobile screen
      const narrowConfig = manager.getLayoutConfig('mobile', 320);
      expect(narrowConfig.buttonSize).toBe('sm');
      expect(narrowConfig.spacing).toBe('tight');

      // Wide mobile screen
      const wideConfig = manager.getLayoutConfig('mobile', 500);
      expect(wideConfig.showFullText).toBe(true);
    });
  });

  describe('detectDeviceType', () => {
    it('should detect mobile device correctly', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const deviceType = manager.detectDeviceType(375, 667, mobileUA);
      expect(deviceType).toBe('mobile');
    });

    it('should detect tablet device correctly', () => {
      const tabletUA = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const deviceType = manager.detectDeviceType(768, 1024, tabletUA);
      expect(deviceType).toBe('tablet');
    });

    it('should fallback to screen size detection', () => {
      const deviceType = manager.detectDeviceType(1920, 1080);
      expect(deviceType).toBe('desktop');
    });
  });

  describe('getOptimalToolbarHeight', () => {
    it('should reduce height in landscape mode on mobile', () => {
      const portraitHeight = manager.getOptimalToolbarHeight('mobile', false);
      const landscapeHeight = manager.getOptimalToolbarHeight('mobile', true);
      
      expect(portraitHeight).toBe('3rem');
      expect(landscapeHeight).toBe('2.5rem');
    });

    it('should maintain height on desktop regardless of orientation', () => {
      const portraitHeight = manager.getOptimalToolbarHeight('desktop', false);
      const landscapeHeight = manager.getOptimalToolbarHeight('desktop', true);
      
      expect(portraitHeight).toBe(landscapeHeight);
    });
  });

  describe('getResponsiveFontSize', () => {
    it('should return appropriate font sizes for each device', () => {
      expect(manager.getResponsiveFontSize('mobile', 'title')).toBe('text-sm');
      expect(manager.getResponsiveFontSize('tablet', 'title')).toBe('text-base');
      expect(manager.getResponsiveFontSize('desktop', 'title')).toBe('text-base');
    });
  });

  describe('getAnimationDuration', () => {
    it('should return shorter duration for mobile', () => {
      expect(manager.getAnimationDuration('mobile')).toBe(200);
      expect(manager.getAnimationDuration('tablet')).toBe(300);
      expect(manager.getAnimationDuration('desktop')).toBe(300);
    });
  });

  describe('getButtonConfig', () => {
    it('should return appropriate button config for each device type', () => {
      const mobileConfig = manager.getButtonConfig('mobile');
      const tabletConfig = manager.getButtonConfig('tablet');
      const desktopConfig = manager.getButtonConfig('desktop');

      expect(mobileConfig.touchTarget).toBe('min-h-[44px] min-w-[44px]');
      expect(tabletConfig.touchTarget).toBe('min-h-[44px] min-w-[44px]');
      expect(desktopConfig.touchTarget).toBe('min-h-[32px] min-w-[32px]');
    });
  });

  describe('shouldShowElement', () => {
    it('should hide device indicator on mobile', () => {
      expect(manager.shouldShowElement('mobile', 'deviceIndicator')).toBe(false);
      expect(manager.shouldShowElement('tablet', 'deviceIndicator')).toBe(true);
      expect(manager.shouldShowElement('desktop', 'deviceIndicator')).toBe(true);
    });

    it('should hide full text on mobile', () => {
      expect(manager.shouldShowElement('mobile', 'fullText')).toBe(false);
      expect(manager.shouldShowElement('tablet', 'fullText')).toBe(true);
      expect(manager.shouldShowElement('desktop', 'fullText')).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ResponsiveControlManager.getInstance();
      const instance2 = ResponsiveControlManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});