import { test, expect } from '@playwright/test';
import { BREAKPOINTS } from '../../src/lib/responsive/breakpoints';

/**
 * Property Test: Minimum Font Size Compliance
 * Feature: console-responsive-redesign, Property 1
 * 
 * For any text element across all breakpoints, the computed font size 
 * should be at least 14px
 * 
 * Validates: Requirements 1.3
 */

const TEXT_SELECTORS = [
  'h1, h2, h3, h4, h5, h6',           // Headings
  'p, span, div',                      // Body text
  'button, .gh-btn',                   // Buttons
  'input, textarea, select',           // Form elements
  'td, th',                           // Table cells
  '.gh-text-xs, .gh-text-sm, .gh-text-base, .gh-text-lg', // Typography classes
  '.gh-responsive-heading, .gh-responsive-body, .gh-responsive-meta' // Responsive classes
];

const CONSOLE_PAGES = [
  '/console',
  '/console/games',
  '/console/upload',
  '/console/qc-inbox',
  '/console/users'
];

test.describe('Font Size Compliance Property Tests', () => {
  
  CONSOLE_PAGES.forEach(page => {
    test(`should maintain minimum 14px font size on ${page} across all breakpoints`, async ({ page: playwright }) => {
      await playwright.goto(page);
      
      // Test across different viewport sizes
      const viewportSizes = [
        { width: 375, height: 667, breakpoint: 'mobile' },    // iPhone SE
        { width: 768, height: 1024, breakpoint: 'tablet' },   // iPad Portrait
        { width: 1024, height: 768, breakpoint: 'tablet' },   // iPad Landscape
        { width: 1200, height: 800, breakpoint: 'desktop' },  // Desktop Min
        { width: 1440, height: 900, breakpoint: 'desktop' },  // Desktop Standard
        { width: 1920, height: 1080, breakpoint: 'desktop' }  // Desktop Large
      ];

      for (const viewport of viewportSizes) {
        await playwright.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Wait for responsive styles to apply
        await playwright.waitForTimeout(100);
        
        for (const selector of TEXT_SELECTORS) {
          const elements = await playwright.locator(selector).all();
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Skip hidden elements
            const isVisible = await element.isVisible();
            if (!isVisible) continue;
            
            // Get computed font size
            const fontSize = await element.evaluate((el) => {
              const styles = window.getComputedStyle(el);
              return parseFloat(styles.fontSize);
            });
            
            // Assert minimum font size
            expect(fontSize, 
              `Element ${selector}[${i}] at ${viewport.width}x${viewport.height} (${viewport.breakpoint}) has font-size ${fontSize}px, expected ≥14px`
            ).toBeGreaterThanOrEqual(14);
          }
        }
      }
    });
  });

  test('should never use font sizes below 14px in CSS variables', async ({ page }) => {
    await page.goto('/console');
    
    // Check CSS custom properties
    const fontSizeVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      
      const variables = [
        '--gh-responsive-heading',
        '--gh-responsive-body', 
        '--gh-responsive-meta',
        '--gh-responsive-caption',
        '--gh-text-xs',
        '--gh-text-sm',
        '--gh-text-base',
        '--gh-text-lg'
      ];
      
      return variables.map(variable => ({
        name: variable,
        value: styles.getPropertyValue(variable).trim(),
        pixels: parseFloat(styles.getPropertyValue(variable))
      }));
    });
    
    fontSizeVariables.forEach(variable => {
      if (variable.pixels > 0) { // Only check if value is set
        expect(variable.pixels, 
          `CSS variable ${variable.name} has value ${variable.value} (${variable.pixels}px), expected ≥14px`
        ).toBeGreaterThanOrEqual(14);
      }
    });
  });

  test('should maintain font size compliance during breakpoint transitions', async ({ page }) => {
    await page.goto('/console/games');
    
    // Test transition points
    const transitionPoints = [
      { from: 800, to: 767, description: 'tablet to mobile' },
      { from: 1250, to: 1199, description: 'desktop to tablet' },
      { from: 767, to: 768, description: 'mobile to tablet' },
      { from: 1199, to: 1200, description: 'tablet to desktop' }
    ];
    
    for (const transition of transitionPoints) {
      // Set initial viewport
      await page.setViewportSize({ width: transition.from, height: 800 });
      await page.waitForTimeout(100);
      
      // Transition to new viewport
      await page.setViewportSize({ width: transition.to, height: 800 });
      await page.waitForTimeout(100);
      
      // Check font sizes after transition
      const textElements = await page.locator('p, span, button, h1, h2, h3').all();
      
      for (let i = 0; i < Math.min(textElements.length, 10); i++) { // Sample first 10 elements
        const element = textElements[i];
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const fontSize = await element.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });
          
          expect(fontSize, 
            `Element after ${transition.description} transition has font-size ${fontSize}px, expected ≥14px`
          ).toBeGreaterThanOrEqual(14);
        }
      }
    }
  });
});