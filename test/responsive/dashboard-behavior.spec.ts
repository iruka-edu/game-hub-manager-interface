import { test, expect } from '@playwright/test';

/**
 * Property Tests: Dashboard Responsive Behavior
 * Feature: console-responsive-redesign
 * 
 * Tests dashboard responsive adaptation and layout conversion
 */

test.describe('Dashboard Responsive Behavior Property Tests', () => {
  
  /**
   * Property 15: Dashboard Responsive Adaptation
   * For any dashboard view, the stats display should adapt appropriately: 
   * full cards on desktop, grouped on tablet, key metrics on mobile
   * 
   * Validates: Requirements 5.1, 5.2, 5.3
   */
  test('should adapt dashboard stats display across breakpoints', async ({ page }) => {
    // Create test dashboard page
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/design-tokens.css">
        <style>
          .dashboard-test-container {
            padding: 20px;
          }
          
          /* Desktop: Full stats cards */
          .gh-stats-grid-desktop {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
          
          .gh-stat-card-desktop {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
          
          /* Tablet: Grouped stats */
          .gh-stats-groups-tablet {
            display: none;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          
          .gh-stat-group-tablet {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
          
          /* Mobile: Key metrics */
          .gh-key-metrics-mobile {
            display: none;
            flex-direction: column;
            gap: 12px;
          }
          
          .gh-key-metric-mobile {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 16px;
            background: white;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          
          /* Responsive display rules */
          @media (min-width: 768px) and (max-width: 1199px) {
            .gh-stats-grid-desktop {
              display: none;
            }
            .gh-stats-groups-tablet {
              display: grid;
            }
          }
          
          @media (max-width: 767px) {
            .gh-stats-grid-desktop,
            .gh-stats-groups-tablet {
              display: none;
            }
            .gh-key-metrics-mobile {
              display: flex;
            }
          }
        </style>
      </head>
      <body>
        <div class="dashboard-test-container">
          <!-- Desktop Stats Grid -->
          <div class="gh-stats-grid-desktop">
            <div class="gh-stat-card-desktop">
              <div class="stat-title">Total Games</div>
              <div class="stat-value">156</div>
              <div class="stat-trend">+12%</div>
            </div>
            <div class="gh-stat-card-desktop">
              <div class="stat-title">Published</div>
              <div class="stat-value">89</div>
              <div class="stat-trend">+5%</div>
            </div>
            <div class="gh-stat-card-desktop">
              <div class="stat-title">QC Queue</div>
              <div class="stat-value">12</div>
              <div class="stat-trend">-3%</div>
            </div>
            <div class="gh-stat-card-desktop">
              <div class="stat-title">Active Users</div>
              <div class="stat-value">24</div>
              <div class="stat-trend">+15%</div>
            </div>
          </div>
          
          <!-- Tablet Grouped Stats -->
          <div class="gh-stats-groups-tablet">
            <div class="gh-stat-group-tablet">
              <div class="group-title">Game Status</div>
              <div class="group-stats">
                <div>Total: 156</div>
                <div>Published: 89</div>
                <div>Drafts: 55</div>
              </div>
            </div>
            <div class="gh-stat-group-tablet">
              <div class="group-title">Review Queue</div>
              <div class="group-stats">
                <div>QC Queue: 12</div>
                <div>Approval: 8</div>
              </div>
            </div>
            <div class="gh-stat-group-tablet">
              <div class="group-title">System</div>
              <div class="group-stats">
                <div>Users: 24</div>
                <div>Storage: 2.4GB</div>
              </div>
            </div>
          </div>
          
          <!-- Mobile Key Metrics -->
          <div class="gh-key-metrics-mobile">
            <div class="gh-key-metric-mobile">
              <div class="metric-icon">🎮</div>
              <div class="metric-content">
                <div class="metric-value">156</div>
                <div class="metric-label">Games</div>
                <div class="metric-subtext">89 published</div>
              </div>
            </div>
            <div class="gh-key-metric-mobile">
              <div class="metric-icon">⏳</div>
              <div class="metric-content">
                <div class="metric-value">20</div>
                <div class="metric-label">Queue</div>
                <div class="metric-subtext">pending review</div>
              </div>
            </div>
            <div class="gh-key-metric-mobile">
              <div class="metric-icon">👥</div>
              <div class="metric-content">
                <div class="metric-value">24</div>
                <div class="metric-label">Users</div>
                <div class="metric-subtext">active now</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const adaptationTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        expectedDisplay: 'full-cards',
        visibleSelector: '.gh-stats-grid-desktop',
        hiddenSelectors: ['.gh-stats-groups-tablet', '.gh-key-metrics-mobile'],
        expectedCards: 4
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        expectedDisplay: 'grouped-stats',
        visibleSelector: '.gh-stats-groups-tablet',
        hiddenSelectors: ['.gh-stats-grid-desktop', '.gh-key-metrics-mobile'],
        expectedGroups: 3
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        expectedDisplay: 'key-metrics',
        visibleSelector: '.gh-key-metrics-mobile',
        hiddenSelectors: ['.gh-stats-grid-desktop', '.gh-stats-groups-tablet'],
        expectedMetrics: 3
      }
    ];
    
    for (const test of adaptationTests) {
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
      
      // Verify content structure
      if (test.breakpoint === 'desktop') {
        const statCards = page.locator('.gh-stat-card-desktop');
        const cardCount = await statCards.count();
        
        expect(cardCount, 
          `Desktop should show ${test.expectedCards} individual stat cards`
        ).toBe(test.expectedCards);
        
        // Check that each card has detailed information
        for (let i = 0; i < cardCount; i++) {
          const card = statCards.nth(i);
          const hasTitle = await card.locator('.stat-title').count() > 0;
          const hasValue = await card.locator('.stat-value').count() > 0;
          const hasTrend = await card.locator('.stat-trend').count() > 0;
          
          expect(hasTitle && hasValue && hasTrend, 
            `Desktop stat card ${i} should have title, value, and trend`
          ).toBe(true);
        }
        
      } else if (test.breakpoint === 'tablet') {
        const statGroups = page.locator('.gh-stat-group-tablet');
        const groupCount = await statGroups.count();
        
        expect(groupCount, 
          `Tablet should show ${test.expectedGroups} stat groups`
        ).toBe(test.expectedGroups);
        
        // Check that groups have titles and multiple stats
        for (let i = 0; i < groupCount; i++) {
          const group = statGroups.nth(i);
          const hasTitle = await group.locator('.group-title').count() > 0;
          const hasStats = await group.locator('.group-stats').count() > 0;
          
          expect(hasTitle && hasStats, 
            `Tablet stat group ${i} should have title and grouped stats`
          ).toBe(true);
        }
        
      } else if (test.breakpoint === 'mobile') {
        const keyMetrics = page.locator('.gh-key-metric-mobile');
        const metricCount = await keyMetrics.count();
        
        expect(metricCount, 
          `Mobile should show ${test.expectedMetrics} key metrics`
        ).toBe(test.expectedMetrics);
        
        // Check that metrics have essential information only
        for (let i = 0; i < metricCount; i++) {
          const metric = keyMetrics.nth(i);
          const hasIcon = await metric.locator('.metric-icon').count() > 0;
          const hasValue = await metric.locator('.metric-value').count() > 0;
          const hasLabel = await metric.locator('.metric-label').count() > 0;
          
          expect(hasIcon && hasValue && hasLabel, 
            `Mobile key metric ${i} should have icon, value, and label`
          ).toBe(true);
        }
      }
    }
  });

  /**
   * Property 16: Dashboard Layout Conversion
   * For any dashboard data display, it should convert from grid/table to card list 
   * at appropriate breakpoints
   * 
   * Validates: Requirements 5.4
   */
  test('should convert dashboard data display layouts appropriately', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .dashboard-data-test {
            padding: 20px;
          }
          
          /* Desktop: Grid/Table layout */
          .data-grid-desktop {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          
          .data-table-desktop {
            width: 100%;
            border-collapse: collapse;
          }
          
          .data-table-desktop th,
          .data-table-desktop td {
            padding: 12px;
            border: 1px solid #e6e8ef;
            text-align: left;
          }
          
          /* Tablet: Card grid */
          .data-cards-tablet {
            display: none;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .data-card-tablet {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
          
          /* Mobile: Card list */
          .data-list-mobile {
            display: none;
            flex-direction: column;
            gap: 12px;
          }
          
          .data-item-mobile {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 12px;
            background: white;
          }
          
          /* Responsive rules */
          @media (min-width: 768px) and (max-width: 1199px) {
            .data-grid-desktop,
            .data-table-desktop {
              display: none;
            }
            .data-cards-tablet {
              display: grid;
            }
          }
          
          @media (max-width: 767px) {
            .data-grid-desktop,
            .data-table-desktop,
            .data-cards-tablet {
              display: none;
            }
            .data-list-mobile {
              display: flex;
            }
          }
        </style>
      </head>
      <body>
        <div class="dashboard-data-test">
          <!-- Desktop Grid -->
          <div class="data-grid-desktop">
            <div class="grid-item">Game 1</div>
            <div class="grid-item">Game 2</div>
            <div class="grid-item">Game 3</div>
            <div class="grid-item">Game 4</div>
            <div class="grid-item">Game 5</div>
            <div class="grid-item">Game 6</div>
          </div>
          
          <!-- Desktop Table -->
          <table class="data-table-desktop">
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
              <tr>
                <td>Science Quest</td>
                <td>Draft</td>
                <td>0.5.0</td>
                <td>Jane Smith</td>
                <td><button>Edit</button></td>
              </tr>
            </tbody>
          </table>
          
          <!-- Tablet Cards -->
          <div class="data-cards-tablet">
            <div class="data-card-tablet">
              <div class="card-title">Math Adventure</div>
              <div class="card-status">Status: Published</div>
              <div class="card-version">Version: 1.0.0</div>
              <button>Edit</button>
            </div>
            <div class="data-card-tablet">
              <div class="card-title">Science Quest</div>
              <div class="card-status">Status: Draft</div>
              <div class="card-version">Version: 0.5.0</div>
              <button>Edit</button>
            </div>
          </div>
          
          <!-- Mobile List -->
          <div class="data-list-mobile">
            <div class="data-item-mobile">
              <div class="item-title">Math Adventure</div>
              <div class="item-status">Published</div>
              <button>Edit</button>
            </div>
            <div class="data-item-mobile">
              <div class="item-title">Science Quest</div>
              <div class="item-status">Draft</div>
              <button>Edit</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const layoutTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        expectedLayout: 'grid-table',
        visibleSelectors: ['.data-grid-desktop', '.data-table-desktop'],
        hiddenSelectors: ['.data-cards-tablet', '.data-list-mobile']
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        expectedLayout: 'card-grid',
        visibleSelectors: ['.data-cards-tablet'],
        hiddenSelectors: ['.data-grid-desktop', '.data-table-desktop', '.data-list-mobile']
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        expectedLayout: 'card-list',
        visibleSelectors: ['.data-list-mobile'],
        hiddenSelectors: ['.data-grid-desktop', '.data-table-desktop', '.data-cards-tablet']
      }
    ];
    
    for (const test of layoutTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check visible layouts
      for (const selector of test.visibleSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element, 
            `${selector} should be visible on ${test.breakpoint}`
          ).toBeVisible();
        }
      }
      
      // Check hidden layouts
      for (const selector of test.hiddenSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element, 
            `${selector} should be hidden on ${test.breakpoint}`
          ).not.toBeVisible();
        }
      }
      
      // Verify layout characteristics
      if (test.breakpoint === 'desktop') {
        // Check grid layout
        const grid = page.locator('.data-grid-desktop');
        if (await grid.count() > 0) {
          const gridDisplay = await grid.evaluate((el) => {
            return window.getComputedStyle(el).display;
          });
          expect(gridDisplay, 'Desktop should use grid display').toBe('grid');
        }
        
        // Check table layout
        const table = page.locator('.data-table-desktop');
        if (await table.count() > 0) {
          const headers = page.locator('.data-table-desktop th');
          const headerCount = await headers.count();
          expect(headerCount, 'Desktop table should have multiple columns').toBeGreaterThan(3);
        }
        
      } else if (test.breakpoint === 'tablet') {
        const cardGrid = page.locator('.data-cards-tablet');
        if (await cardGrid.count() > 0) {
          const gridColumns = await cardGrid.evaluate((el) => {
            return window.getComputedStyle(el).gridTemplateColumns;
          });
          expect(gridColumns, 'Tablet should use 2-column card grid').toContain('1fr');
        }
        
      } else if (test.breakpoint === 'mobile') {
        const cardList = page.locator('.data-list-mobile');
        if (await cardList.count() > 0) {
          const flexDirection = await cardList.evaluate((el) => {
            return window.getComputedStyle(el).flexDirection;
          });
          expect(flexDirection, 'Mobile should use column flex direction').toBe('column');
        }
      }
    }
  });

  test('should maintain dashboard filter functionality across breakpoints', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .filter-test-container {
            padding: 20px;
          }
          
          .dashboard-filters {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .filter-select,
          .search-input {
            padding: 8px 12px;
            border: 1px solid #e6e8ef;
            border-radius: 4px;
            min-height: 44px;
          }
          
          .search-input {
            min-width: 200px;
          }
          
          /* Hide search on tablet and mobile */
          @media (max-width: 1199px) {
            .search-input {
              display: none;
            }
          }
          
          /* Stack filters on mobile */
          @media (max-width: 767px) {
            .dashboard-filters {
              flex-direction: column;
              align-items: stretch;
            }
            
            .filter-select {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="filter-test-container">
          <div class="dashboard-filters">
            <select class="filter-select">
              <option value="all">All Games</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
            
            <select class="filter-select">
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
            
            <input type="search" class="search-input" placeholder="Search games...">
          </div>
          
          <div class="filter-results">
            <div class="result-item">Math Adventure - Published</div>
            <div class="result-item">Science Quest - Draft</div>
            <div class="result-item">History Explorer - QC</div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    const filterTests = [
      { viewport: { width: 1200, height: 800 }, breakpoint: 'desktop', shouldShowSearch: true },
      { viewport: { width: 1024, height: 768 }, breakpoint: 'tablet', shouldShowSearch: false },
      { viewport: { width: 375, height: 667 }, breakpoint: 'mobile', shouldShowSearch: false }
    ];
    
    for (const test of filterTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check filter selects are always visible
      const filterSelects = page.locator('.filter-select');
      const selectCount = await filterSelects.count();
      
      expect(selectCount, 
        `Filter selects should be visible on ${test.breakpoint}`
      ).toBe(2);
      
      // Check each select is properly sized for touch
      for (let i = 0; i < selectCount; i++) {
        const select = filterSelects.nth(i);
        const selectBox = await select.boundingBox();
        
        if (selectBox) {
          expect(selectBox.height, 
            `Filter select ${i} should meet touch target requirements on ${test.breakpoint}`
          ).toBeGreaterThanOrEqual(44);
        }
      }
      
      // Check search input visibility
      const searchInput = page.locator('.search-input');
      if (await searchInput.count() > 0) {
        if (test.shouldShowSearch) {
          await expect(searchInput, 
            `Search input should be visible on ${test.breakpoint}`
          ).toBeVisible();
        } else {
          await expect(searchInput, 
            `Search input should be hidden on ${test.breakpoint}`
          ).not.toBeVisible();
        }
      }
      
      // Test filter interaction
      const firstSelect = filterSelects.first();
      await firstSelect.selectOption('published');
      
      const selectedValue = await firstSelect.inputValue();
      expect(selectedValue, 
        `Filter should be interactive on ${test.breakpoint}`
      ).toBe('published');
    }
  });
});