import { test, expect } from '@playwright/test';

/**
 * Property Tests: Layout Structure
 * Feature: console-responsive-redesign
 * 
 * Tests responsive layout transformations across breakpoints
 */

const CONSOLE_PAGES = [
  '/console',
  '/console/games',
  '/console/upload'
];

test.describe('Layout Structure Property Tests', () => {
  
  /**
   * Property 3: Desktop Layout Structure
   * For any console page at desktop breakpoint (≥1200px), 
   * the layout should display multi-column structure with fixed sidebar
   * 
   * Validates: Requirements 2.1, 2.3
   */
  test('should display desktop multi-column layout with fixed sidebar', async ({ page }) => {
    const desktopViewports = [
      { width: 1200, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ];
    
    for (const consolePage of CONSOLE_PAGES) {
      await page.goto(consolePage);
      
      for (const viewport of desktopViewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
        
        // Check for multi-column layout
        const layoutElement = await page.locator('.gh-layout-desktop').first();
        if (await layoutElement.count() > 0) {
          const gridColumns = await layoutElement.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
          });
          
          expect(gridColumns, 
            `Desktop layout at ${viewport.width}px should have multi-column grid`
          ).toContain('240px'); // Sidebar width
        }
        
        // Check for fixed sidebar
        const sidebar = await page.locator('.gh-sidebar-desktop').first();
        if (await sidebar.count() > 0) {
          const sidebarStyles = await sidebar.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              position: styles.position,
              width: styles.width
            };
          });
          
          expect(sidebarStyles.position, 
            `Sidebar at ${viewport.width}px should be fixed positioned`
          ).toBe('fixed');
          
          expect(sidebarStyles.width, 
            `Sidebar at ${viewport.width}px should have correct width`
          ).toBe('240px');
        }
      }
    }
  });

  /**
   * Property 6: Tablet Layout Transformation
   * For any console page at tablet breakpoint (768px-1199px), 
   * the layout should convert from multi-column to single-column with collapsible navigation
   * 
   * Validates: Requirements 3.1, 3.2
   */
  test('should transform to tablet single-column layout with collapsible navigation', async ({ page }) => {
    const tabletViewports = [
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1199, height: 800 }
    ];
    
    for (const consolePage of CONSOLE_PAGES) {
      await page.goto(consolePage);
      
      for (const viewport of tabletViewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
        
        // Check for single-column layout
        const tabletLayout = await page.locator('.gh-layout-tablet').first();
        if (await tabletLayout.count() > 0) {
          const flexDirection = await tabletLayout.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return styles.flexDirection;
          });
          
          expect(flexDirection, 
            `Tablet layout at ${viewport.width}px should be single-column (flex-direction: column)`
          ).toBe('column');
        }
        
        // Check for hamburger menu button
        const hamburgerButton = await page.locator('.gh-hamburger-button').first();
        if (await hamburgerButton.count() > 0) {
          await expect(hamburgerButton).toBeVisible();
          
          // Verify touch target size
          const buttonSize = await hamburgerButton.boundingBox();
          if (buttonSize) {
            expect(buttonSize.height, 
              `Hamburger button at ${viewport.width}px should meet touch target requirements`
            ).toBeGreaterThanOrEqual(44);
            
            expect(buttonSize.width, 
              `Hamburger button at ${viewport.width}px should meet touch target requirements`
            ).toBeGreaterThanOrEqual(44);
          }
        }
        
        // Desktop sidebar should be hidden
        const desktopSidebar = await page.locator('.gh-sidebar-desktop');
        if (await desktopSidebar.count() > 0) {
          await expect(desktopSidebar).not.toBeVisible();
        }
      }
    }
  });

  /**
   * Property 10: Mobile Layout Simplification
   * For any console page at mobile breakpoint (≤767px), 
   * the layout should implement one-column, one-focus design
   * 
   * Validates: Requirements 4.1
   */
  test('should implement mobile one-column, one-focus layout', async ({ page }) => {
    const mobileViewports = [
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 428, height: 926 },
      { width: 767, height: 800 }
    ];
    
    for (const consolePage of CONSOLE_PAGES) {
      await page.goto(consolePage);
      
      for (const viewport of mobileViewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
        
        // Check for single-column layout
        const mobileLayout = await page.locator('.gh-layout-mobile').first();
        if (await mobileLayout.count() > 0) {
          const flexDirection = await mobileLayout.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return styles.flexDirection;
          });
          
          expect(flexDirection, 
            `Mobile layout at ${viewport.width}px should be single-column (flex-direction: column)`
          ).toBe('column');
        }
        
        // Check for bottom navigation
        const mobileNav = await page.locator('.gh-nav-mobile').first();
        if (await mobileNav.count() > 0) {
          const navStyles = await mobileNav.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              position: styles.position,
              bottom: styles.bottom
            };
          });
          
          expect(navStyles.position, 
            `Mobile navigation at ${viewport.width}px should be fixed positioned`
          ).toBe('fixed');
          
          expect(navStyles.bottom, 
            `Mobile navigation at ${viewport.width}px should be at bottom`
          ).toBe('0px');
        }
        
        // Desktop and tablet elements should be hidden
        const desktopElements = await page.locator('.gh-layout-desktop, .gh-sidebar-desktop');
        const tabletElements = await page.locator('.gh-layout-tablet, .gh-nav-tablet');
        
        if (await desktopElements.count() > 0) {
          await expect(desktopElements.first()).not.toBeVisible();
        }
        
        if (await tabletElements.count() > 0) {
          await expect(tabletElements.first()).not.toBeVisible();
        }
      }
    }
  });

  test('should maintain layout consistency during breakpoint transitions', async ({ page }) => {
    await page.goto('/console/games');
    
    const transitions = [
      { from: { width: 1300, height: 800 }, to: { width: 1100, height: 800 }, desc: 'desktop to tablet' },
      { from: { width: 900, height: 800 }, to: { width: 600, height: 800 }, desc: 'tablet to mobile' },
      { from: { width: 600, height: 800 }, to: { width: 900, height: 800 }, desc: 'mobile to tablet' },
      { from: { width: 1100, height: 800 }, to: { width: 1300, height: 800 }, desc: 'tablet to desktop' }
    ];
    
    for (const transition of transitions) {
      // Set initial viewport
      await page.setViewportSize(transition.from);
      await page.waitForTimeout(100);
      
      // Transition to new viewport
      await page.setViewportSize(transition.to);
      await page.waitForTimeout(200); // Allow more time for layout changes
      
      // Check that layout is stable and no elements are broken
      const body = await page.locator('body');
      const bodyBox = await body.boundingBox();
      
      expect(bodyBox?.width, 
        `Body width after ${transition.desc} transition should match viewport`
      ).toBeLessThanOrEqual(transition.to.width);
      
      // Check for horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll, 
        `No horizontal scrolling should occur after ${transition.desc} transition`
      ).toBe(false);
    }
  });

  test('should apply correct CSS custom properties at each breakpoint', async ({ page }) => {
    await page.goto('/console');
    
    const breakpointTests = [
      { 
        viewport: { width: 375, height: 667 }, 
        breakpoint: 'mobile',
        expectedHeading: '18px',
        expectedSpacing: '8px' // lg spacing on mobile
      },
      { 
        viewport: { width: 768, height: 1024 }, 
        breakpoint: 'tablet',
        expectedHeading: '18px',
        expectedSpacing: '12px' // lg spacing on tablet
      },
      { 
        viewport: { width: 1200, height: 800 }, 
        breakpoint: 'desktop',
        expectedHeading: '20px',
        expectedSpacing: '16px' // lg spacing on desktop
      }
    ];
    
    for (const test of breakpointTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      const tokens = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        
        return {
          heading: styles.getPropertyValue('--gh-responsive-heading').trim(),
          spacing: styles.getPropertyValue('--gh-responsive-space-lg').trim()
        };
      });
      
      expect(tokens.heading, 
        `Heading token at ${test.breakpoint} (${test.viewport.width}px) should be ${test.expectedHeading}`
      ).toBe(test.expectedHeading);
      
      expect(tokens.spacing, 
        `Spacing token at ${test.breakpoint} (${test.viewport.width}px) should be ${test.expectedSpacing}`
      ).toBe(test.expectedSpacing);
    }
  });
});