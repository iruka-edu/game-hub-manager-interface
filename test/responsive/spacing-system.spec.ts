import { test, expect } from '@playwright/test';

/**
 * Responsive Spacing System Tests
 * 
 * Validates that the spacing system works correctly across all breakpoints
 * and maintains consistent proportional relationships.
 * 
 * Tests Requirements: 7.4 - Responsive spacing system
 */

test.describe('Responsive Spacing System', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test page with spacing examples
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/design-tokens.css">
        <style>
          .test-container {
            padding: 20px;
            background: #f0f0f0;
          }
          .spacing-example {
            background: #fff;
            border: 1px solid #ccc;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="test-container">
          <!-- Margin Tests -->
          <div class="gh-responsive-m-lg spacing-example" data-testid="margin-lg">
            Margin LG
          </div>
          
          <!-- Padding Tests -->
          <div class="gh-responsive-p-md spacing-example" data-testid="padding-md">
            Padding MD
          </div>
          
          <!-- Gap Tests -->
          <div class="gh-responsive-gap-sm" data-testid="gap-container" style="display: flex; flex-direction: column;">
            <div class="spacing-example">Item 1</div>
            <div class="spacing-example">Item 2</div>
          </div>
          
          <!-- Directional Spacing Tests -->
          <div class="gh-responsive-m-x-xl spacing-example" data-testid="margin-x-xl">
            Margin X XL
          </div>
          
          <div class="gh-responsive-p-y-lg spacing-example" data-testid="padding-y-lg">
            Padding Y LG
          </div>
          
          <!-- Component Tests -->
          <div class="gh-responsive-stack gh-responsive-gap-md" data-testid="stack-component">
            <div class="spacing-example">Stack Item 1</div>
            <div class="spacing-example">Stack Item 2</div>
          </div>
          
          <div class="gh-responsive-inline gh-responsive-gap-sm" data-testid="inline-component">
            <div class="spacing-example">Inline Item 1</div>
            <div class="spacing-example">Inline Item 2</div>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  test('should apply correct spacing values on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1400, height: 900 });
    
    // Test margin values
    const marginElement = page.getByTestId('margin-lg');
    const marginStyles = await marginElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft
      };
    });
    
    // Desktop lg spacing should be 16px
    expect(marginStyles.marginTop).toBe('16px');
    expect(marginStyles.marginRight).toBe('16px');
    expect(marginStyles.marginBottom).toBe('16px');
    expect(marginStyles.marginLeft).toBe('16px');
    
    // Test padding values
    const paddingElement = page.getByTestId('padding-md');
    const paddingStyles = await paddingElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft
      };
    });
    
    // Desktop md spacing should be 12px
    expect(paddingStyles.paddingTop).toBe('12px');
    expect(paddingStyles.paddingRight).toBe('12px');
    expect(paddingStyles.paddingBottom).toBe('12px');
    expect(paddingStyles.paddingLeft).toBe('12px');
  });

  test('should apply correct spacing values on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 900, height: 700 });
    
    // Test margin values
    const marginElement = page.getByTestId('margin-lg');
    const marginStyles = await marginElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft
      };
    });
    
    // Tablet lg spacing should be 12px
    expect(marginStyles.marginTop).toBe('12px');
    expect(marginStyles.marginRight).toBe('12px');
    expect(marginStyles.marginBottom).toBe('12px');
    expect(marginStyles.marginLeft).toBe('12px');
    
    // Test padding values
    const paddingElement = page.getByTestId('padding-md');
    const paddingStyles = await paddingElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft
      };
    });
    
    // Tablet md spacing should be 9px
    expect(paddingStyles.paddingTop).toBe('9px');
    expect(paddingStyles.paddingRight).toBe('9px');
    expect(paddingStyles.paddingBottom).toBe('9px');
    expect(paddingStyles.paddingLeft).toBe('9px');
  });

  test('should apply correct spacing values on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 400, height: 700 });
    
    // Test margin values
    const marginElement = page.getByTestId('margin-lg');
    const marginStyles = await marginElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft
      };
    });
    
    // Mobile lg spacing should be 8px
    expect(marginStyles.marginTop).toBe('8px');
    expect(marginStyles.marginRight).toBe('8px');
    expect(marginStyles.marginBottom).toBe('8px');
    expect(marginStyles.marginLeft).toBe('8px');
    
    // Test padding values
    const paddingElement = page.getByTestId('padding-md');
    const paddingStyles = await paddingElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft
      };
    });
    
    // Mobile md spacing should be 6px
    expect(paddingStyles.paddingTop).toBe('6px');
    expect(paddingStyles.paddingRight).toBe('6px');
    expect(paddingStyles.paddingBottom).toBe('6px');
    expect(paddingStyles.paddingLeft).toBe('6px');
  });

  test('should apply directional spacing correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    
    // Test horizontal margin
    const marginXElement = page.getByTestId('margin-x-xl');
    const marginXStyles = await marginXElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft
      };
    });
    
    // Should have horizontal margin (20px on desktop) but no vertical margin
    expect(marginXStyles.marginLeft).toBe('20px');
    expect(marginXStyles.marginRight).toBe('20px');
    expect(marginXStyles.marginTop).toBe('0px');
    expect(marginXStyles.marginBottom).toBe('0px');
    
    // Test vertical padding
    const paddingYElement = page.getByTestId('padding-y-lg');
    const paddingYStyles = await paddingYElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft
      };
    });
    
    // Should have vertical padding (16px on desktop) but no horizontal padding
    expect(paddingYStyles.paddingTop).toBe('16px');
    expect(paddingYStyles.paddingBottom).toBe('16px');
    expect(paddingYStyles.paddingLeft).toBe('0px');
    expect(paddingYStyles.paddingRight).toBe('0px');
  });

  test('should apply gap spacing correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    
    // Test gap container
    const gapContainer = page.getByTestId('gap-container');
    const gapValue = await gapContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.gap;
    });
    
    // Desktop sm gap should be 8px
    expect(gapValue).toBe('8px');
  });

  test('should maintain proportional spacing relationships', async ({ page }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1400, height: 900 });
    
    const getSpacingValue = async (selector: string, property: string) => {
      const element = page.locator(selector);
      return await element.evaluate((el, prop) => {
        const computed = window.getComputedStyle(el);
        return parseInt(computed[prop as any]);
      }, property);
    };
    
    // Get different spacing sizes
    await page.setContent(`
      <div class="gh-responsive-m-sm" data-testid="sm">SM</div>
      <div class="gh-responsive-m-md" data-testid="md">MD</div>
      <div class="gh-responsive-m-lg" data-testid="lg">LG</div>
      <div class="gh-responsive-m-xl" data-testid="xl">XL</div>
    `);
    
    const smValue = await getSpacingValue('[data-testid="sm"]', 'marginTop');
    const mdValue = await getSpacingValue('[data-testid="md"]', 'marginTop');
    const lgValue = await getSpacingValue('[data-testid="lg"]', 'marginTop');
    const xlValue = await getSpacingValue('[data-testid="xl"]', 'marginTop');
    
    // Verify proportional relationships (sm < md < lg < xl)
    expect(smValue).toBeLessThan(mdValue);
    expect(mdValue).toBeLessThan(lgValue);
    expect(lgValue).toBeLessThan(xlValue);
    
    // Test the same on mobile to ensure proportions are maintained
    await page.setViewportSize({ width: 400, height: 700 });
    
    const mobileSmValue = await getSpacingValue('[data-testid="sm"]', 'marginTop');
    const mobileMdValue = await getSpacingValue('[data-testid="md"]', 'marginTop');
    const mobileLgValue = await getSpacingValue('[data-testid="lg"]', 'marginTop');
    const mobileXlValue = await getSpacingValue('[data-testid="xl"]', 'marginTop');
    
    // Verify proportional relationships are maintained on mobile
    expect(mobileSmValue).toBeLessThan(mobileMdValue);
    expect(mobileMdValue).toBeLessThan(mobileLgValue);
    expect(mobileLgValue).toBeLessThan(mobileXlValue);
    
    // Verify mobile values are smaller than desktop values
    expect(mobileSmValue).toBeLessThan(smValue);
    expect(mobileMdValue).toBeLessThan(mdValue);
    expect(mobileLgValue).toBeLessThan(lgValue);
    expect(mobileXlValue).toBeLessThan(xlValue);
  });

  test('should apply layout component styles correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    
    // Test stack component
    const stackComponent = page.getByTestId('stack-component');
    const stackStyles = await stackComponent.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap
      };
    });
    
    expect(stackStyles.display).toBe('flex');
    expect(stackStyles.flexDirection).toBe('column');
    expect(stackStyles.gap).toBe('12px'); // md gap on desktop
    
    // Test inline component
    const inlineComponent = page.getByTestId('inline-component');
    const inlineStyles = await inlineComponent.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap
      };
    });
    
    expect(inlineStyles.display).toBe('flex');
    expect(inlineStyles.flexDirection).toBe('row');
    expect(inlineStyles.gap).toBe('8px'); // sm gap on desktop
  });

  test('should adapt layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    
    // Test that inline components stack on mobile
    const inlineComponent = page.getByTestId('inline-component');
    const inlineStyles = await inlineComponent.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        flexDirection: computed.flexDirection,
        gap: computed.gap
      };
    });
    
    // Should maintain row direction but with smaller gap
    expect(inlineStyles.flexDirection).toBe('row');
    expect(inlineStyles.gap).toBe('4px'); // sm gap on mobile
  });

  test('should provide consistent spacing constants', async ({ page }) => {
    // Test that CSS custom properties are defined correctly
    await page.setViewportSize({ width: 1400, height: 900 });
    
    const spacingValues = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      
      return {
        xs: computed.getPropertyValue('--gh-responsive-space-xs').trim(),
        sm: computed.getPropertyValue('--gh-responsive-space-sm').trim(),
        md: computed.getPropertyValue('--gh-responsive-space-md').trim(),
        lg: computed.getPropertyValue('--gh-responsive-space-lg').trim(),
        xl: computed.getPropertyValue('--gh-responsive-space-xl').trim(),
        '2xl': computed.getPropertyValue('--gh-responsive-space-2xl').trim()
      };
    });
    
    // Verify desktop spacing values
    expect(spacingValues.xs).toBe('4px');
    expect(spacingValues.sm).toBe('8px');
    expect(spacingValues.md).toBe('12px');
    expect(spacingValues.lg).toBe('16px');
    expect(spacingValues.xl).toBe('20px');
    expect(spacingValues['2xl']).toBe('24px');
  });
});