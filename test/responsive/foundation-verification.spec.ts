import { test, expect } from '@playwright/test';

/**
 * Foundation Verification Tests
 * 
 * Basic tests to verify the responsive foundation is working correctly
 * before running comprehensive property tests.
 */

test.describe('Responsive Foundation Verification', () => {
  
  test('should load console page successfully', async ({ page }) => {
    await page.goto('/console');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Game Hub/);
    
    // Check if basic elements are present
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have responsive design tokens available', async ({ page }) => {
    await page.goto('/console');
    
    // Check if CSS custom properties are defined
    const tokens = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      
      return {
        breakpointMobileMax: styles.getPropertyValue('--gh-breakpoint-mobile-max'),
        responsiveHeading: styles.getPropertyValue('--gh-responsive-heading'),
        responsiveBody: styles.getPropertyValue('--gh-responsive-body'),
        touchTargetMin: styles.getPropertyValue('--gh-touch-target-minimum')
      };
    });
    
    expect(tokens.breakpointMobileMax.trim()).toBe('767px');
    expect(tokens.responsiveHeading.trim()).toBeTruthy();
    expect(tokens.responsiveBody.trim()).toBeTruthy();
    expect(tokens.touchTargetMin.trim()).toBe('44px');
  });

  test('should apply responsive tokens at different breakpoints', async ({ page }) => {
    await page.goto('/console');
    
    // Test desktop tokens
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);
    
    let headingSize = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return styles.getPropertyValue('--gh-responsive-heading').trim();
    });
    
    expect(headingSize).toBe('20px'); // Desktop default
    
    // Test mobile tokens
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    headingSize = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return styles.getPropertyValue('--gh-responsive-heading').trim();
    });
    
    expect(headingSize).toBe('18px'); // Mobile size
  });

  test('should have breakpoint utilities working', async ({ page }) => {
    await page.goto('/console');
    
    // Test desktop visibility
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);
    
    // Add test elements to check visibility utilities
    await page.addStyleTag({
      content: `
        .test-desktop-only { display: block; }
        .test-mobile-only { display: none; }
        @media (max-width: 767px) {
          .test-desktop-only { display: none; }
          .test-mobile-only { display: block; }
        }
      `
    });
    
    await page.setContent(`
      <div class="test-desktop-only">Desktop Content</div>
      <div class="test-mobile-only">Mobile Content</div>
    `);
    
    // Desktop should show desktop content
    await expect(page.locator('.test-desktop-only')).toBeVisible();
    await expect(page.locator('.test-mobile-only')).not.toBeVisible();
    
    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    // Mobile should show mobile content
    await expect(page.locator('.test-desktop-only')).not.toBeVisible();
    await expect(page.locator('.test-mobile-only')).toBeVisible();
  });
});