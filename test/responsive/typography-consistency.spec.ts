import { test, expect } from '@playwright/test';
import { RESPONSIVE_TYPOGRAPHY } from '../../src/lib/responsive/design-tokens';

/**
 * Property Test: Typography Consistency
 * Feature: console-responsive-redesign, Property 21
 * 
 * For any text component, the computed font sizes should match specified 
 * values (heading: 18-20px, body: 15-16px, meta: 13-14px) across breakpoints
 * 
 * Validates: Requirements 7.3
 */

const TYPOGRAPHY_CLASSES = {
  heading: ['.gh-responsive-heading', 'h1', 'h2', 'h3'],
  body: ['.gh-responsive-body', 'p', '.gh-text-base'],
  meta: ['.gh-responsive-meta', '.gh-text-sm', 'small']
};

const EXPECTED_RANGES = {
  heading: { min: 18, max: 20 },
  body: { min: 15, max: 16 },
  meta: { min: 14, max: 14 } // Upgraded to 14px minimum
};

const CONSOLE_PAGES = [
  '/console',
  '/console/games', 
  '/console/upload',
  '/console/qc-inbox'
];

test.describe('Typography Consistency Property Tests', () => {
  
  test('should maintain consistent typography sizing across breakpoints', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1200, height: 800, name: 'desktop' }
    ];
    
    for (const consolePage of CONSOLE_PAGES) {
      await page.goto(consolePage);
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
        
        // Test each typography category
        for (const [category, selectors] of Object.entries(TYPOGRAPHY_CLASSES)) {
          const expectedRange = EXPECTED_RANGES[category as keyof typeof EXPECTED_RANGES];
          
          for (const selector of selectors) {
            const elements = await page.locator(selector).all();
            
            for (let i = 0; i < Math.min(elements.length, 5); i++) { // Sample first 5 elements
              const element = elements[i];
              const isVisible = await element.isVisible();
              
              if (isVisible) {
                const fontSize = await element.evaluate((el) => {
                  return parseFloat(window.getComputedStyle(el).fontSize);
                });
                
                expect(fontSize, 
                  `${category} element ${selector}[${i}] on ${consolePage} at ${viewport.name} (${viewport.width}px) has font-size ${fontSize}px, expected ${expectedRange.min}-${expectedRange.max}px`
                ).toBeGreaterThanOrEqual(expectedRange.min);
                
                expect(fontSize, 
                  `${category} element ${selector}[${i}] on ${consolePage} at ${viewport.name} (${viewport.width}px) has font-size ${fontSize}px, expected ${expectedRange.min}-${expectedRange.max}px`
                ).toBeLessThanOrEqual(expectedRange.max);
              }
            }
          }
        }
      }
    }
  });

  test('should apply correct responsive typography tokens', async ({ page }) => {
    await page.goto('/console');
    
    const viewports = [
      { width: 375, height: 667, breakpoint: 'mobile' },
      { width: 768, height: 1024, breakpoint: 'tablet' },
      { width: 1200, height: 800, breakpoint: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      
      // Check CSS custom properties match expected values
      const actualTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        
        return {
          heading: parseFloat(styles.getPropertyValue('--gh-responsive-heading')),
          body: parseFloat(styles.getPropertyValue('--gh-responsive-body')),
          meta: parseFloat(styles.getPropertyValue('--gh-responsive-meta'))
        };
      });
      
      const expectedTokens = {
        heading: parseFloat(RESPONSIVE_TYPOGRAPHY.heading[viewport.breakpoint as keyof typeof RESPONSIVE_TYPOGRAPHY.heading]),
        body: parseFloat(RESPONSIVE_TYPOGRAPHY.body[viewport.breakpoint as keyof typeof RESPONSIVE_TYPOGRAPHY.body]),
        meta: parseFloat(RESPONSIVE_TYPOGRAPHY.meta[viewport.breakpoint as keyof typeof RESPONSIVE_TYPOGRAPHY.meta])
      };
      
      expect(actualTokens.heading, 
        `Heading token at ${viewport.breakpoint} (${viewport.width}px) is ${actualTokens.heading}px, expected ${expectedTokens.heading}px`
      ).toBe(expectedTokens.heading);
      
      expect(actualTokens.body, 
        `Body token at ${viewport.breakpoint} (${viewport.width}px) is ${actualTokens.body}px, expected ${expectedTokens.body}px`
      ).toBe(expectedTokens.body);
      
      expect(actualTokens.meta, 
        `Meta token at ${viewport.breakpoint} (${viewport.width}px) is ${actualTokens.meta}px, expected ${expectedTokens.meta}px`
      ).toBe(expectedTokens.meta);
    }
  });

  test('should maintain line height proportions', async ({ page }) => {
    await page.goto('/console/games');
    
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 1200, height: 800, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      
      // Check line height to font size ratios
      const elements = await page.locator('.gh-responsive-heading, .gh-responsive-body, .gh-responsive-meta').all();
      
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        const element = elements[i];
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const { fontSize, lineHeight } = await element.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              fontSize: parseFloat(styles.fontSize),
              lineHeight: parseFloat(styles.lineHeight)
            };
          });
          
          const ratio = lineHeight / fontSize;
          
          // Line height should be between 1.2 and 1.6 for good readability
          expect(ratio, 
            `Line height ratio for element at ${viewport.name} is ${ratio}, expected between 1.2 and 1.6`
          ).toBeGreaterThanOrEqual(1.2);
          
          expect(ratio, 
            `Line height ratio for element at ${viewport.name} is ${ratio}, expected between 1.2 and 1.6`
          ).toBeLessThanOrEqual(1.6);
        }
      }
    }
  });

  test('should never downgrade typography below minimum thresholds', async ({ page }) => {
    await page.goto('/console');
    
    // Test extreme viewport sizes
    const extremeViewports = [
      { width: 320, height: 568, name: 'very-small-mobile' },
      { width: 2560, height: 1440, name: 'very-large-desktop' }
    ];
    
    for (const viewport of extremeViewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      
      // All text should still meet minimum requirements
      const allTextElements = await page.locator('h1, h2, h3, p, span, button, td, th').all();
      
      for (let i = 0; i < Math.min(allTextElements.length, 10); i++) {
        const element = allTextElements[i];
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const fontSize = await element.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });
          
          expect(fontSize, 
            `Text element at extreme viewport ${viewport.name} (${viewport.width}px) has font-size ${fontSize}px, expected ≥14px`
          ).toBeGreaterThanOrEqual(14);
        }
      }
    }
  });
});