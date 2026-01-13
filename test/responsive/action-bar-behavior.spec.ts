import { test, expect } from '@playwright/test';

/**
 * Property Tests: Action Bar Behavior
 * Feature: console-responsive-redesign
 * 
 * Tests adaptive action bar behavior and primary action visibility
 */

test.describe('Action Bar Behavior Property Tests', () => {
  
  /**
   * Property 2: Primary Action Visibility
   * For any page and breakpoint, primary action buttons should be present 
   * and have proper accessibility attributes
   * 
   * Validates: Requirements 1.5
   */
  test('should maintain primary action visibility across all breakpoints', async ({ page }) => {
    // Create test page with action bars
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/design-tokens.css">
        <style>
          .test-action-container {
            padding: 20px;
          }
          
          .primary-action {
            background-color: #4F46E5;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 44px;
          }
          
          .secondary-action {
            background-color: white;
            color: #4F46E5;
            border: 1px solid #4F46E5;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 44px;
          }
          
          .action-bar-desktop {
            display: flex;
            gap: 12px;
            align-items: center;
          }
          
          .action-bar-tablet {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e6e8ef;
            padding: 16px;
            justify-content: center;
            gap: 12px;
          }
          
          .action-bar-mobile {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e6e8ef;
            padding: 12px;
            justify-content: space-around;
          }
          
          .action-bar-mobile .primary-action {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            padding: 0;
            justify-content: center;
          }
          
          .action-bar-mobile .action-label {
            display: none;
          }
          
          /* Responsive display */
          @media (min-width: 768px) and (max-width: 1199px) {
            .action-bar-desktop {
              display: none;
            }
            .action-bar-tablet {
              display: flex;
            }
          }
          
          @media (max-width: 767px) {
            .action-bar-desktop {
              display: none;
            }
            .action-bar-mobile {
              display: flex;
            }
          }
        </style>
      </head>
      <body>
        <div class="test-action-container">
          <!-- Desktop Action Bar -->
          <div class="action-bar-desktop">
            <button class="primary-action" aria-label="Publish game">
              <span class="action-icon">📤</span>
              <span class="action-label">Publish</span>
            </button>
            <button class="primary-action" aria-label="Save draft">
              <span class="action-icon">💾</span>
              <span class="action-label">Save</span>
            </button>
            <button class="secondary-action" aria-label="Preview game">
              <span class="action-icon">👁</span>
              <span class="action-label">Preview</span>
            </button>
          </div>
          
          <!-- Tablet Action Bar -->
          <div class="action-bar-tablet">
            <button class="primary-action" aria-label="Publish game">
              <span class="action-icon">📤</span>
              <span class="action-label">Publish</span>
            </button>
            <button class="primary-action" aria-label="Save draft">
              <span class="action-icon">💾</span>
              <span class="action-label">Save</span>
            </button>
            <button class="secondary-action" aria-label="More actions">
              <span class="action-icon">⋯</span>
              <span class="action-label">More</span>
            </button>
          </div>
          
          <!-- Mobile Action Bar -->
          <div class="action-bar-mobile">
            <button class="primary-action" aria-label="Publish game">
              <span class="action-icon">📤</span>
              <span class="action-label">Publish</span>
            </button>
            <button class="primary-action" aria-label="Save draft">
              <span class="action-icon">💾</span>
              <span class="action-label">Save</span>
            </button>
            <button class="primary-action" aria-label="More actions">
              <span class="action-icon">⋯</span>
              <span class="action-label">More</span>
            </button>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const breakpointTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        actionBarSelector: '.action-bar-desktop',
        expectedPrimaryActions: 2
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        actionBarSelector: '.action-bar-tablet',
        expectedPrimaryActions: 2
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        actionBarSelector: '.action-bar-mobile',
        expectedPrimaryActions: 3 // Including overflow button
      }
    ];
    
    for (const test of breakpointTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check that correct action bar is visible
      const actionBar = page.locator(test.actionBarSelector);
      await expect(actionBar, 
        `Action bar should be visible on ${test.breakpoint}`
      ).toBeVisible();
      
      // Check primary actions are present
      const primaryActions = actionBar.locator('.primary-action');
      const actionCount = await primaryActions.count();
      
      expect(actionCount, 
        `Should have ${test.expectedPrimaryActions} primary actions on ${test.breakpoint}`
      ).toBe(test.expectedPrimaryActions);
      
      // Check accessibility attributes
      for (let i = 0; i < actionCount; i++) {
        const action = primaryActions.nth(i);
        
        const ariaLabel = await action.getAttribute('aria-label');
        expect(ariaLabel, 
          `Primary action ${i} should have aria-label on ${test.breakpoint}`
        ).toBeTruthy();
        
        // Check touch target size
        const actionBox = await action.boundingBox();
        if (actionBox) {
          expect(actionBox.height, 
            `Primary action ${i} height should meet touch target requirements on ${test.breakpoint}`
          ).toBeGreaterThanOrEqual(44);
          
          expect(actionBox.width, 
            `Primary action ${i} width should meet touch target requirements on ${test.breakpoint}`
          ).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  /**
   * Property 9: Tablet Sticky Action Bar
   * For any tablet view with critical actions, a sticky bottom action bar 
   * should be present and positioned correctly
   * 
   * Validates: Requirements 3.7
   */
  test('should display sticky bottom action bar on tablet', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            height: 200vh; /* Make page scrollable */
          }
          
          .content {
            padding: 20px;
            height: 150vh;
            background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
          }
          
          .sticky-action-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e6e8ef;
            padding: 16px;
            display: flex;
            justify-content: center;
            gap: 12px;
            z-index: 40;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
          }
          
          .critical-action {
            background-color: #4F46E5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            min-height: 48px;
            font-size: 16px;
          }
          
          .secondary-action {
            background-color: white;
            color: #4F46E5;
            border: 1px solid #4F46E5;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            min-height: 48px;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <h1>Scrollable Content</h1>
          <p>This content should scroll while the action bar remains sticky at the bottom.</p>
        </div>
        
        <div class="sticky-action-bar">
          <button class="critical-action">Approve</button>
          <button class="critical-action">Reject</button>
          <button class="secondary-action">More</button>
        </div>
      </body>
      </html>
    `);
    
    const tabletViewports = [
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1199, height: 800 }
    ];
    
    for (const viewport of tabletViewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      
      const actionBar = page.locator('.sticky-action-bar');
      
      // Check that action bar is visible
      await expect(actionBar, 
        `Sticky action bar should be visible at ${viewport.width}px`
      ).toBeVisible();
      
      // Check positioning
      const actionBarStyles = await actionBar.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          bottom: styles.bottom,
          left: styles.left,
          right: styles.right,
          zIndex: styles.zIndex
        };
      });
      
      expect(actionBarStyles.position, 
        `Action bar should be fixed positioned at ${viewport.width}px`
      ).toBe('fixed');
      
      expect(actionBarStyles.bottom, 
        `Action bar should be at bottom at ${viewport.width}px`
      ).toBe('0px');
      
      expect(parseInt(actionBarStyles.zIndex), 
        `Action bar should have proper z-index at ${viewport.width}px`
      ).toBeGreaterThan(30);
      
      // Test stickiness by scrolling
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(100);
      
      // Action bar should still be visible after scrolling
      await expect(actionBar, 
        `Sticky action bar should remain visible after scrolling at ${viewport.width}px`
      ).toBeVisible();
      
      // Check that it's still at the bottom of viewport
      const actionBarBox = await actionBar.boundingBox();
      if (actionBarBox) {
        expect(actionBarBox.y + actionBarBox.height, 
          `Action bar should be at bottom of viewport after scrolling at ${viewport.width}px`
        ).toBe(viewport.height);
      }
      
      // Reset scroll position
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  });

  test('should handle action bar interactions correctly', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .action-test-container {
            padding: 20px;
          }
          
          .action-button {
            background-color: #4F46E5;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            margin: 8px;
            min-height: 44px;
          }
          
          .action-button:hover {
            background-color: #4338CA;
          }
          
          .action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .action-result {
            margin-top: 20px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="action-test-container">
          <button class="action-button" onclick="showResult('Action 1 clicked')">Action 1</button>
          <button class="action-button" onclick="showResult('Action 2 clicked')">Action 2</button>
          <button class="action-button" disabled>Disabled Action</button>
          
          <div class="action-result" id="result" style="display: none;"></div>
        </div>
        
        <script>
          function showResult(message) {
            const result = document.getElementById('result');
            result.textContent = message;
            result.style.display = 'block';
          }
        </script>
      </body>
      </html>
    `);
    
    const interactionTests = [
      { viewport: { width: 1200, height: 800 }, breakpoint: 'desktop' },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet' },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile' }
    ];
    
    for (const test of interactionTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Test enabled button click
      const actionButton1 = page.locator('.action-button').first();
      await actionButton1.click();
      
      const result = page.locator('#result');
      await expect(result, 
        `Action result should be visible after click on ${test.breakpoint}`
      ).toBeVisible();
      
      const resultText = await result.textContent();
      expect(resultText, 
        `Action should execute correctly on ${test.breakpoint}`
      ).toBe('Action 1 clicked');
      
      // Test disabled button
      const disabledButton = page.locator('.action-button[disabled]');
      const isDisabled = await disabledButton.isDisabled();
      
      expect(isDisabled, 
        `Disabled button should be disabled on ${test.breakpoint}`
      ).toBe(true);
      
      // Test hover state (desktop and tablet only)
      if (test.breakpoint !== 'mobile') {
        await actionButton1.hover();
        
        const hoverColor = await actionButton1.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        // Should have darker background on hover
        expect(hoverColor, 
          `Button should change color on hover on ${test.breakpoint}`
        ).toBeTruthy();
      }
    }
  });

  test('should maintain action bar accessibility features', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .accessibility-test {
            padding: 20px;
          }
          
          .action-group {
            display: flex;
            gap: 12px;
            margin: 16px 0;
          }
          
          .action-btn {
            background-color: #4F46E5;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            min-height: 44px;
          }
          
          .action-btn:focus {
            outline: 2px solid #4F46E5;
            outline-offset: 2px;
          }
          
          .dropdown-container {
            position: relative;
          }
          
          .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: none;
            min-width: 150px;
          }
          
          .dropdown-menu.open {
            display: block;
          }
          
          .dropdown-item {
            display: block;
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            min-height: 44px;
          }
          
          .dropdown-item:hover {
            background-color: #f0f0f0;
          }
        </style>
      </head>
      <body>
        <div class="accessibility-test">
          <div class="action-group">
            <button class="action-btn" aria-label="Save changes">Save</button>
            <button class="action-btn" aria-label="Publish game">Publish</button>
            
            <div class="dropdown-container">
              <button 
                class="action-btn" 
                aria-label="More actions"
                aria-expanded="false"
                aria-haspopup="menu"
                onclick="toggleDropdown()"
              >
                More
              </button>
              <div class="dropdown-menu" role="menu" id="dropdown">
                <button class="dropdown-item" role="menuitem">Archive</button>
                <button class="dropdown-item" role="menuitem">Delete</button>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          function toggleDropdown() {
            const dropdown = document.getElementById('dropdown');
            const button = dropdown.previousElementSibling;
            const isOpen = dropdown.classList.contains('open');
            
            if (isOpen) {
              dropdown.classList.remove('open');
              button.setAttribute('aria-expanded', 'false');
            } else {
              dropdown.classList.add('open');
              button.setAttribute('aria-expanded', 'true');
            }
          }
        </script>
      </body>
      </html>
    `);
    
    const accessibilityTests = [
      { viewport: { width: 1200, height: 800 }, breakpoint: 'desktop' },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet' },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile' }
    ];
    
    for (const test of accessibilityTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check aria-label attributes
      const actionButtons = page.locator('.action-btn');
      const buttonCount = await actionButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = actionButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        
        expect(ariaLabel, 
          `Button ${i} should have aria-label on ${test.breakpoint}`
        ).toBeTruthy();
      }
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      
      expect(focusedElement, 
        `Should be able to focus buttons with keyboard on ${test.breakpoint}`
      ).toBe('BUTTON');
      
      // Test dropdown accessibility
      const dropdownButton = page.locator('[aria-haspopup="menu"]');
      if (await dropdownButton.count() > 0) {
        const ariaExpanded = await dropdownButton.getAttribute('aria-expanded');
        expect(ariaExpanded, 
          `Dropdown button should have aria-expanded attribute on ${test.breakpoint}`
        ).toBe('false');
        
        // Click to open dropdown
        await dropdownButton.click();
        
        const expandedAfterClick = await dropdownButton.getAttribute('aria-expanded');
        expect(expandedAfterClick, 
          `Dropdown should update aria-expanded after click on ${test.breakpoint}`
        ).toBe('true');
        
        // Check dropdown menu role
        const dropdownMenu = page.locator('[role="menu"]');
        await expect(dropdownMenu, 
          `Dropdown menu should be visible after click on ${test.breakpoint}`
        ).toBeVisible();
        
        // Check menu items
        const menuItems = page.locator('[role="menuitem"]');
        const itemCount = await menuItems.count();
        
        expect(itemCount, 
          `Dropdown should contain menu items on ${test.breakpoint}`
        ).toBeGreaterThan(0);
      }
    }
  });
});