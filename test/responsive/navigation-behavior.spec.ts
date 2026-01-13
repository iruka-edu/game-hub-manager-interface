import { test, expect } from '@playwright/test';

/**
 * Property Tests: Navigation Responsive Behavior
 * Feature: console-responsive-redesign
 * 
 * Tests adaptive navigation behavior across breakpoints
 */

const CONSOLE_PAGES = [
  '/console',
  '/console/games',
  '/console/upload',
  '/console/qc-inbox'
];

test.describe('Navigation Responsive Behavior Property Tests', () => {
  
  /**
   * Property 23: Navigation Responsive Behavior
   * For any navigation component, it should use fixed sidebar on desktop, 
   * hamburger menu on tablet, and bottom tabs on mobile
   * 
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  test('should display appropriate navigation pattern for each breakpoint', async ({ page }) => {
    const breakpointTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        expectedNav: 'fixed-sidebar',
        navSelector: '.gh-nav-desktop',
        shouldBeVisible: ['.gh-nav-desktop', '.gh-sidebar-desktop'],
        shouldBeHidden: ['.gh-nav-tablet', '.gh-nav-mobile', '.gh-hamburger-button']
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        expectedNav: 'hamburger-menu',
        navSelector: '.gh-nav-tablet',
        shouldBeVisible: ['.gh-nav-tablet', '.gh-hamburger-button'],
        shouldBeHidden: ['.gh-nav-desktop', '.gh-nav-mobile', '.gh-sidebar-desktop']
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        expectedNav: 'bottom-tabs',
        navSelector: '.gh-nav-mobile',
        shouldBeVisible: ['.gh-nav-mobile', '.gh-nav-tabs'],
        shouldBeHidden: ['.gh-nav-desktop', '.gh-nav-tablet', '.gh-sidebar-desktop']
      }
    ];
    
    for (const consolePage of CONSOLE_PAGES) {
      await page.goto(consolePage);
      
      for (const test of breakpointTests) {
        await page.setViewportSize(test.viewport);
        await page.waitForTimeout(100);
        
        // Check that correct navigation is visible
        for (const selector of test.shouldBeVisible) {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            await expect(element, 
              `${selector} should be visible on ${test.breakpoint} at ${consolePage}`
            ).toBeVisible();
          }
        }
        
        // Check that incorrect navigation is hidden
        for (const selector of test.shouldBeHidden) {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            await expect(element, 
              `${selector} should be hidden on ${test.breakpoint} at ${consolePage}`
            ).not.toBeVisible();
          }
        }
      }
    }
  });

  /**
   * Property 24: Breadcrumb Availability
   * For any page on desktop and tablet, breadcrumb navigation should be present and functional
   * 
   * Validates: Requirements 8.4
   */
  test('should show breadcrumbs on desktop and tablet, hide on mobile', async ({ page }) => {
    const breadcrumbTests = [
      { viewport: { width: 1200, height: 800 }, breakpoint: 'desktop', shouldShow: true },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet', shouldShow: true },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile', shouldShow: false }
    ];
    
    // Test on a page that should have breadcrumbs
    await page.goto('/console/games');
    
    for (const test of breadcrumbTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      const breadcrumb = page.locator('.gh-breadcrumb').first();
      
      if (await breadcrumb.count() > 0) {
        if (test.shouldShow) {
          await expect(breadcrumb, 
            `Breadcrumb should be visible on ${test.breakpoint}`
          ).toBeVisible();
          
          // Check breadcrumb structure
          const breadcrumbItems = page.locator('.gh-breadcrumb-item');
          const itemCount = await breadcrumbItems.count();
          
          expect(itemCount, 
            `Breadcrumb should have at least 1 item on ${test.breakpoint}`
          ).toBeGreaterThan(0);
          
        } else {
          await expect(breadcrumb, 
            `Breadcrumb should be hidden on ${test.breakpoint}`
          ).not.toBeVisible();
        }
      }
    }
  });

  test('should maintain proper touch targets for navigation elements', async ({ page }) => {
    await page.goto('/console');
    
    const touchTargetTests = [
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        elements: ['.gh-hamburger-button', '.gh-nav-link-tablet']
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        elements: ['.gh-nav-link-mobile']
      }
    ];
    
    for (const test of touchTargetTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      for (const selector of test.elements) {
        const elements = await page.locator(selector).all();
        
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          
          if (isVisible) {
            const box = await element.boundingBox();
            
            if (box) {
              expect(box.height, 
                `${selector}[${i}] height on ${test.breakpoint} should meet touch target minimum (44px)`
              ).toBeGreaterThanOrEqual(44);
              
              expect(box.width, 
                `${selector}[${i}] width on ${test.breakpoint} should meet touch target minimum (44px)`
              ).toBeGreaterThanOrEqual(44);
            }
          }
        }
      }
    }
  });

  test('should handle hamburger menu interaction on tablet', async ({ page }) => {
    await page.goto('/console');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(100);
    
    const hamburgerButton = page.locator('.gh-hamburger-button').first();
    
    if (await hamburgerButton.count() > 0) {
      // Initially menu should be closed
      const overlay = page.locator('.gh-nav-overlay').first();
      if (await overlay.count() > 0) {
        await expect(overlay).not.toBeVisible();
      }
      
      // Click hamburger button to open menu
      await hamburgerButton.click();
      await page.waitForTimeout(100);
      
      // Menu overlay should be visible
      if (await overlay.count() > 0) {
        await expect(overlay).toBeVisible();
        
        // Check menu content
        const menuItems = page.locator('.gh-nav-link-tablet');
        const itemCount = await menuItems.count();
        
        expect(itemCount, 
          'Hamburger menu should contain navigation items'
        ).toBeGreaterThan(0);
        
        // Click outside to close menu (click on overlay)
        await overlay.click({ position: { x: 400, y: 400 } });
        await page.waitForTimeout(100);
        
        // Menu should be closed
        await expect(overlay).not.toBeVisible();
      }
    }
  });

  test('should maintain navigation state during breakpoint transitions', async ({ page }) => {
    await page.goto('/console/games');
    
    const transitions = [
      { from: { width: 1300, height: 800 }, to: { width: 900, height: 800 }, desc: 'desktop to tablet' },
      { from: { width: 900, height: 800 }, to: { width: 600, height: 800 }, desc: 'tablet to mobile' },
      { from: { width: 600, height: 800 }, to: { width: 900, height: 800 }, desc: 'mobile to tablet' },
      { from: { width: 900, height: 800 }, to: { width: 1300, height: 800 }, desc: 'tablet to desktop' }
    ];
    
    for (const transition of transitions) {
      // Set initial viewport
      await page.setViewportSize(transition.from);
      await page.waitForTimeout(100);
      
      // Transition to new viewport
      await page.setViewportSize(transition.to);
      await page.waitForTimeout(200);
      
      // Check that appropriate navigation is visible
      const navElements = await page.locator('[class*="gh-nav-"]').all();
      let hasVisibleNav = false;
      
      for (const nav of navElements) {
        const isVisible = await nav.isVisible();
        if (isVisible) {
          hasVisibleNav = true;
          break;
        }
      }
      
      expect(hasVisibleNav, 
        `At least one navigation element should be visible after ${transition.desc} transition`
      ).toBe(true);
    }
  });

  test('should apply correct navigation styling at each breakpoint', async ({ page }) => {
    await page.goto('/console');
    
    const stylingTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        navSelector: '.gh-sidebar-desktop',
        expectedStyles: {
          position: 'fixed',
          width: '240px'
        }
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        navSelector: '.gh-nav-tablet',
        expectedStyles: {
          position: 'sticky'
        }
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        navSelector: '.gh-nav-mobile',
        expectedStyles: {
          position: 'fixed',
          bottom: '0px'
        }
      }
    ];
    
    for (const test of stylingTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      const navElement = page.locator(test.navSelector).first();
      
      if (await navElement.count() > 0 && await navElement.isVisible()) {
        const styles = await navElement.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            position: computed.position,
            width: computed.width,
            bottom: computed.bottom
          };
        });
        
        for (const [property, expectedValue] of Object.entries(test.expectedStyles)) {
          expect(styles[property as keyof typeof styles], 
            `${test.navSelector} ${property} on ${test.breakpoint} should be ${expectedValue}`
          ).toBe(expectedValue);
        }
      }
    }
  });

  test('should handle navigation accessibility features', async ({ page }) => {
    await page.goto('/console');
    
    const accessibilityTests = [
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet' },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile' }
    ];
    
    for (const test of accessibilityTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check hamburger button accessibility (tablet)
      if (test.breakpoint === 'tablet') {
        const hamburgerButton = page.locator('.gh-hamburger-button').first();
        
        if (await hamburgerButton.count() > 0) {
          const ariaLabel = await hamburgerButton.getAttribute('aria-label');
          expect(ariaLabel, 
            'Hamburger button should have aria-label'
          ).toBeTruthy();
        }
      }
      
      // Check navigation links have proper accessibility
      const navLinks = page.locator('[class*="gh-nav-link-"]');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const isVisible = await link.isVisible();
        
        if (isVisible) {
          const href = await link.getAttribute('href');
          const textContent = await link.textContent();
          
          expect(href || textContent, 
            `Navigation link ${i} should have href or text content for accessibility`
          ).toBeTruthy();
        }
      }
    }
  });
});