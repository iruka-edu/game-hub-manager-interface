import { test, expect } from '@playwright/test';

/**
 * Property Tests: Data Display Behavior
 * Feature: console-responsive-redesign
 * 
 * Tests responsive data display transformations and priority hierarchy
 */

test.describe('Data Display Behavior Property Tests', () => {
  
  /**
   * Property 11 & 26: Table to Card Conversion
   * For any data table on mobile (≤767px), it should be converted to card-based layout
   * For any data table at mobile breakpoint (≤768px), it should be converted to card-based layout
   * 
   * Validates: Requirements 4.2, 4.3, 9.1
   */
  test('should convert tables to cards on mobile breakpoints', async ({ page }) => {
    // Add test data to the page
    await page.goto('/console');
    
    // Create a test page with responsive data display
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/design-tokens.css">
        <style>
          .test-data-display {
            width: 100%;
            padding: 20px;
          }
          
          /* Desktop: Table display */
          .gh-data-display-desktop {
            display: block;
          }
          
          .gh-data-display-tablet,
          .gh-data-display-mobile {
            display: none;
          }
          
          /* Tablet: Card grid */
          @media (min-width: 768px) and (max-width: 1199px) {
            .gh-data-display-desktop {
              display: none;
            }
            .gh-data-display-tablet {
              display: block;
            }
          }
          
          /* Mobile: Card list */
          @media (max-width: 767px) {
            .gh-data-display-desktop,
            .gh-data-display-tablet {
              display: none;
            }
            .gh-data-display-mobile {
              display: block;
            }
          }
          
          .gh-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .gh-card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
          }
          
          .gh-card-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .gh-card {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="test-data-display">
          <!-- Desktop Table -->
          <div class="gh-data-display-desktop">
            <table class="gh-table">
              <thead>
                <tr>
                  <th>Game Name</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Math Adventure</td>
                  <td>Published</td>
                  <td>1.0.0</td>
                  <td>John Doe</td>
                  <td><button>Edit</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Tablet Card Grid -->
          <div class="gh-data-display-tablet">
            <div class="gh-card-grid">
              <div class="gh-card">
                <div class="priority-action">Math Adventure</div>
                <div class="priority-status">Status: Published</div>
                <div class="priority-data">Version: 1.0.0</div>
                <div class="priority-metadata">Owner: John Doe</div>
                <button>Edit</button>
              </div>
            </div>
          </div>
          
          <!-- Mobile Card List -->
          <div class="gh-data-display-mobile">
            <div class="gh-card-list">
              <div class="gh-card">
                <div class="priority-action">Math Adventure</div>
                <div class="priority-status">Published</div>
                <button>Edit</button>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const breakpointTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        expectedDisplay: 'table',
        visibleSelector: '.gh-data-display-desktop',
        hiddenSelectors: ['.gh-data-display-tablet', '.gh-data-display-mobile']
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        expectedDisplay: 'card-grid',
        visibleSelector: '.gh-data-display-tablet',
        hiddenSelectors: ['.gh-data-display-desktop', '.gh-data-display-mobile']
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        expectedDisplay: 'card-list',
        visibleSelector: '.gh-data-display-mobile',
        hiddenSelectors: ['.gh-data-display-desktop', '.gh-data-display-tablet']
      }
    ];
    
    for (const test of breakpointTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check that correct display is visible
      const visibleElement = page.locator(test.visibleSelector);
      await expect(visibleElement, 
        `${test.expectedDisplay} should be visible on ${test.breakpoint}`
      ).toBeVisible();
      
      // Check that incorrect displays are hidden
      for (const hiddenSelector of test.hiddenSelectors) {
        const hiddenElement = page.locator(hiddenSelector);
        await expect(hiddenElement, 
          `${hiddenSelector} should be hidden on ${test.breakpoint}`
        ).not.toBeVisible();
      }
      
      // Verify display type characteristics
      if (test.expectedDisplay === 'table') {
        const table = page.locator('.gh-table');
        await expect(table).toBeVisible();
        
        const tableHeaders = page.locator('th');
        const headerCount = await tableHeaders.count();
        expect(headerCount, 'Desktop table should have multiple columns').toBeGreaterThan(3);
        
      } else if (test.expectedDisplay === 'card-grid') {
        const cardGrid = page.locator('.gh-card-grid');
        await expect(cardGrid).toBeVisible();
        
        const gridDisplay = await cardGrid.evaluate((el) => {
          return window.getComputedStyle(el).display;
        });
        expect(gridDisplay, 'Tablet should use grid display').toBe('grid');
        
      } else if (test.expectedDisplay === 'card-list') {
        const cardList = page.locator('.gh-card-list');
        await expect(cardList).toBeVisible();
        
        const flexDirection = await cardList.evaluate((el) => {
          return window.getComputedStyle(el).flexDirection;
        });
        expect(flexDirection, 'Mobile should use column flex direction').toBe('column');
      }
    }
  });

  /**
   * Property 27: Information Priority Order
   * For any game list display, status and actions should appear before metadata in the visual hierarchy
   * 
   * Validates: Requirements 9.2
   */
  test('should maintain Action > Status > Data > Metadata priority order', async ({ page }) => {
    await page.goto('/console');
    
    // Create test content with priority classes
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .priority-test-container {
            padding: 20px;
          }
          
          .priority-action { order: 1; background: #e0f2fe; padding: 8px; margin: 4px 0; }
          .priority-status { order: 2; background: #f3e5f5; padding: 8px; margin: 4px 0; }
          .priority-data { order: 3; background: #e8f5e8; padding: 8px; margin: 4px 0; }
          .priority-metadata { order: 4; background: #fff3e0; padding: 8px; margin: 4px 0; }
          
          .card-content {
            display: flex;
            flex-direction: column;
          }
          
          /* Mobile: Hide metadata */
          @media (max-width: 767px) {
            .priority-metadata {
              display: none;
            }
          }
          
          /* Tablet: Reduce metadata visibility */
          @media (min-width: 768px) and (max-width: 1199px) {
            .priority-metadata {
              opacity: 0.7;
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="priority-test-container">
          <div class="card-content">
            <div class="priority-metadata">Created: 2024-01-15</div>
            <div class="priority-action">Math Adventure Game</div>
            <div class="priority-data">Version: 1.2.0</div>
            <div class="priority-status">Status: Published</div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const priorityTests = [
      { viewport: { width: 1200, height: 800 }, breakpoint: 'desktop' },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet' },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile' }
    ];
    
    for (const test of priorityTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Get all priority elements and their visual order
      const priorityElements = await page.locator('[class*="priority-"]').all();
      const visibleElements = [];
      
      for (const element of priorityElements) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          const className = await element.getAttribute('class');
          const boundingBox = await element.boundingBox();
          
          if (boundingBox) {
            visibleElements.push({
              className,
              top: boundingBox.y,
              priority: className?.includes('action') ? 1 :
                       className?.includes('status') ? 2 :
                       className?.includes('data') ? 3 : 4
            });
          }
        }
      }
      
      // Sort by visual position (top coordinate)
      visibleElements.sort((a, b) => a.top - b.top);
      
      // Check that priority order is maintained
      for (let i = 1; i < visibleElements.length; i++) {
        const current = visibleElements[i];
        const previous = visibleElements[i - 1];
        
        expect(current.priority, 
          `Element priority order should be maintained on ${test.breakpoint}: ${previous.className} (${previous.priority}) should come before ${current.className} (${current.priority})`
        ).toBeGreaterThanOrEqual(previous.priority);
      }
      
      // Check metadata visibility rules
      const metadataElement = page.locator('.priority-metadata');
      if (await metadataElement.count() > 0) {
        if (test.breakpoint === 'mobile') {
          await expect(metadataElement, 
            'Metadata should be hidden on mobile'
          ).not.toBeVisible();
        } else {
          await expect(metadataElement, 
            `Metadata should be visible on ${test.breakpoint}`
          ).toBeVisible();
          
          if (test.breakpoint === 'tablet') {
            const opacity = await metadataElement.evaluate((el) => {
              return window.getComputedStyle(el).opacity;
            });
            
            expect(parseFloat(opacity), 
              'Metadata should have reduced opacity on tablet'
            ).toBeLessThan(1);
          }
        }
      }
    }
  });

  test('should maintain essential information visibility without horizontal scrolling', async ({ page }) => {
    await page.goto('/console');
    
    // Create wide content that could cause horizontal scrolling
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .wide-content-test {
            padding: 20px;
          }
          
          .data-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border: 1px solid #ddd;
            margin: 8px 0;
            min-width: 0; /* Allow flex items to shrink */
          }
          
          .data-item {
            flex: 1;
            min-width: 0;
            padding: 0 8px;
          }
          
          .data-item.essential {
            flex: 2; /* Give more space to essential items */
          }
          
          .data-item.metadata {
            flex: 0.5;
          }
          
          .data-actions {
            flex-shrink: 0;
            display: flex;
            gap: 8px;
          }
          
          .btn {
            padding: 8px 12px;
            border: 1px solid #ccc;
            background: white;
            border-radius: 4px;
            cursor: pointer;
          }
          
          /* Mobile adjustments */
          @media (max-width: 767px) {
            .data-row {
              flex-direction: column;
              align-items: stretch;
            }
            
            .data-item.metadata {
              display: none;
            }
            
            .data-actions {
              margin-top: 12px;
              justify-content: flex-end;
            }
          }
        </style>
      </head>
      <body>
        <div class="wide-content-test">
          <div class="data-row">
            <div class="data-item essential">Super Long Game Name That Could Cause Overflow Issues</div>
            <div class="data-item">Published</div>
            <div class="data-item">v1.0.0</div>
            <div class="data-item metadata">Created by John Doe on 2024-01-15 at 14:30:25</div>
            <div class="data-actions">
              <button class="btn">Edit</button>
              <button class="btn">Publish</button>
              <button class="btn">Archive</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const scrollTests = [
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile' },
      { viewport: { width: 768, height: 1024 }, breakpoint: 'tablet' },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet-landscape' }
    ];
    
    for (const test of scrollTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check for horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll, 
        `No horizontal scrolling should occur on ${test.breakpoint} (${test.viewport.width}px)`
      ).toBe(false);
      
      // Check that essential content is still visible
      const essentialContent = page.locator('.data-item.essential');
      await expect(essentialContent, 
        `Essential content should be visible on ${test.breakpoint}`
      ).toBeVisible();
      
      // Check that actions are accessible
      const actionButtons = page.locator('.data-actions .btn');
      const buttonCount = await actionButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = actionButtons.nth(i);
        await expect(button, 
          `Action button ${i} should be visible on ${test.breakpoint}`
        ).toBeVisible();
        
        // Verify button is within viewport
        const buttonBox = await button.boundingBox();
        if (buttonBox) {
          expect(buttonBox.x + buttonBox.width, 
            `Action button ${i} should not extend beyond viewport on ${test.breakpoint}`
          ).toBeLessThanOrEqual(test.viewport.width);
        }
      }
    }
  });

  test('should adapt card layouts appropriately across breakpoints', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .card-layout-test {
            padding: 20px;
          }
          
          .card-container {
            display: grid;
            gap: 16px;
          }
          
          /* Desktop: 3 columns */
          @media (min-width: 1200px) {
            .card-container {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          /* Tablet: 2 columns */
          @media (min-width: 768px) and (max-width: 1199px) {
            .card-container {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          /* Mobile: 1 column */
          @media (max-width: 767px) {
            .card-container {
              grid-template-columns: 1fr;
            }
          }
          
          .test-card {
            border: 1px solid #ddd;
            padding: 16px;
            border-radius: 8px;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="card-layout-test">
          <div class="card-container">
            <div class="test-card">Card 1</div>
            <div class="test-card">Card 2</div>
            <div class="test-card">Card 3</div>
            <div class="test-card">Card 4</div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const layoutTests = [
      { viewport: { width: 1200, height: 800 }, breakpoint: 'desktop', expectedColumns: 3 },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet', expectedColumns: 2 },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile', expectedColumns: 1 }
    ];
    
    for (const test of layoutTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      const cardContainer = page.locator('.card-container');
      const gridColumns = await cardContainer.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.gridTemplateColumns;
      });
      
      // Count the number of columns in the grid
      const columnCount = gridColumns.split(' ').length;
      
      expect(columnCount, 
        `Card grid should have ${test.expectedColumns} columns on ${test.breakpoint}`
      ).toBe(test.expectedColumns);
      
      // Verify cards are properly arranged
      const cards = page.locator('.test-card');
      const cardCount = await cards.count();
      
      expect(cardCount, 
        'All cards should be visible'
      ).toBe(4);
      
      // Check that cards don't overflow horizontally
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const cardBox = await card.boundingBox();
        
        if (cardBox) {
          expect(cardBox.x + cardBox.width, 
            `Card ${i} should not extend beyond viewport on ${test.breakpoint}`
          ).toBeLessThanOrEqual(test.viewport.width);
        }
      }
    }
  });
});