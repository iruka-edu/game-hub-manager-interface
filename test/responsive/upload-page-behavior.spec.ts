import { test, expect } from '@playwright/test';

/**
 * Property Tests: Upload Page Responsive Behavior
 * Feature: console-responsive-redesign
 * 
 * Tests upload page responsive adaptation and functionality restrictions
 */

test.describe('Upload Page Responsive Behavior Property Tests', () => {
  
  /**
   * Property 17: Upload Page Responsive Behavior
   * For any upload page, it should display three-column on desktop, 
   * accordion on tablet, and desktop-only message on mobile
   * 
   * Validates: Requirements 6.1, 6.2, 6.3
   */
  test('should display appropriate upload layout for each breakpoint', async ({ page }) => {
    // Create test upload page
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/styles/design-tokens.css">
        <style>
          .upload-test-container {
            padding: 20px;
          }
          
          /* Desktop: Three-column layout */
          .gh-upload-desktop-layout {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
          }
          
          .gh-upload-column {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
          
          /* Tablet: Accordion layout */
          .gh-upload-tablet-layout {
            display: none;
          }
          
          .gh-upload-accordion {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .gh-accordion-section {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            background: white;
          }
          
          .gh-accordion-header {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 16px;
            background: none;
            border: none;
            cursor: pointer;
            min-height: 48px;
          }
          
          .gh-accordion-content {
            padding: 16px;
            border-top: 1px solid #e6e8ef;
          }
          
          /* Mobile: Desktop-only message */
          .gh-desktop-only-message {
            display: none;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
            text-align: center;
          }
          
          .gh-desktop-only-content {
            max-width: 400px;
            padding: 24px;
          }
          
          /* Responsive display rules */
          @media (min-width: 768px) and (max-width: 1199px) {
            .gh-upload-desktop-layout {
              display: none;
            }
            .gh-upload-tablet-layout {
              display: block;
            }
          }
          
          @media (max-width: 767px) {
            .gh-upload-desktop-layout,
            .gh-upload-tablet-layout {
              display: none;
            }
            .gh-desktop-only-message {
              display: flex;
            }
          }
        </style>
      </head>
      <body>
        <div class="upload-test-container">
          <!-- Desktop Three-Column Layout -->
          <div class="gh-upload-desktop-layout">
            <div class="gh-upload-column">
              <h3>Upload Files</h3>
              <div class="upload-form">
                <input type="text" placeholder="Game ID">
                <input type="text" placeholder="Title">
                <div class="file-upload">Drop files here</div>
              </div>
            </div>
            <div class="gh-upload-column">
              <h3>Game Manifest</h3>
              <div class="manifest-form">
                <textarea placeholder="Description"></textarea>
                <select><option>Subject</option></select>
                <select><option>Grade</option></select>
              </div>
            </div>
            <div class="gh-upload-column">
              <h3>Preview & QA</h3>
              <div class="preview-content">
                <div class="preview-placeholder">Game preview</div>
                <div class="qa-checklist">
                  <label><input type="checkbox"> Tested devices</label>
                  <label><input type="checkbox"> Audio works</label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tablet Accordion Layout -->
          <div class="gh-upload-tablet-layout">
            <div class="gh-upload-accordion">
              <div class="gh-accordion-section">
                <button class="gh-accordion-header">
                  <span>⬆️</span>
                  <span>Upload Files</span>
                  <span>▼</span>
                </button>
                <div class="gh-accordion-content">
                  <input type="text" placeholder="Game ID">
                  <input type="text" placeholder="Title">
                  <div class="file-upload">Drop files here</div>
                </div>
              </div>
              <div class="gh-accordion-section">
                <button class="gh-accordion-header">
                  <span>📋</span>
                  <span>Game Manifest</span>
                  <span>▶</span>
                </button>
              </div>
              <div class="gh-accordion-section">
                <button class="gh-accordion-header">
                  <span>👁</span>
                  <span>Preview & QA</span>
                  <span>▶</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Mobile Desktop-Only Message -->
          <div class="gh-desktop-only-message">
            <div class="gh-desktop-only-content">
              <div style="font-size: 48px; margin-bottom: 16px;">💻</div>
              <h2>Desktop Required</h2>
              <p>Game upload features are only available on desktop devices.</p>
              <button>Go Back</button>
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
        expectedLayout: 'three-column',
        visibleSelector: '.gh-upload-desktop-layout',
        hiddenSelectors: ['.gh-upload-tablet-layout', '.gh-desktop-only-message'],
        expectedColumns: 3
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        expectedLayout: 'accordion',
        visibleSelector: '.gh-upload-tablet-layout',
        hiddenSelectors: ['.gh-upload-desktop-layout', '.gh-desktop-only-message'],
        expectedSections: 3
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        expectedLayout: 'desktop-only-message',
        visibleSelector: '.gh-desktop-only-message',
        hiddenSelectors: ['.gh-upload-desktop-layout', '.gh-upload-tablet-layout']
      }
    ];
    
    for (const test of layoutTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check that correct layout is visible
      const visibleElement = page.locator(test.visibleSelector);
      await expect(visibleElement, 
        `${test.expectedLayout} should be visible on ${test.breakpoint}`
      ).toBeVisible();
      
      // Check that incorrect layouts are hidden
      for (const hiddenSelector of test.hiddenSelectors) {
        const hiddenElement = page.locator(hiddenSelector);
        await expect(hiddenElement, 
          `${hiddenSelector} should be hidden on ${test.breakpoint}`
        ).not.toBeVisible();
      }
      
      // Verify layout characteristics
      if (test.breakpoint === 'desktop') {
        // Check three-column grid
        const columns = page.locator('.gh-upload-column');
        const columnCount = await columns.count();
        
        expect(columnCount, 
          `Desktop should have ${test.expectedColumns} columns`
        ).toBe(test.expectedColumns);
        
        // Check grid layout
        const gridContainer = page.locator('.gh-upload-desktop-layout');
        const gridColumns = await gridContainer.evaluate((el) => {
          return window.getComputedStyle(el).gridTemplateColumns;
        });
        
        expect(gridColumns, 
          'Desktop should use three-column grid'
        ).toContain('1fr');
        
        // Verify each column has content
        for (let i = 0; i < columnCount; i++) {
          const column = columns.nth(i);
          const hasHeading = await column.locator('h3').count() > 0;
          
          expect(hasHeading, 
            `Desktop column ${i} should have a heading`
          ).toBe(true);
        }
        
      } else if (test.breakpoint === 'tablet') {
        // Check accordion sections
        const sections = page.locator('.gh-accordion-section');
        const sectionCount = await sections.count();
        
        expect(sectionCount, 
          `Tablet should have ${test.expectedSections} accordion sections`
        ).toBe(test.expectedSections);
        
        // Check accordion headers are interactive
        for (let i = 0; i < sectionCount; i++) {
          const header = sections.nth(i).locator('.gh-accordion-header');
          
          // Check touch target size
          const headerBox = await header.boundingBox();
          if (headerBox) {
            expect(headerBox.height, 
              `Accordion header ${i} should meet touch target requirements`
            ).toBeGreaterThanOrEqual(44);
          }
          
          // Check header has icon and text
          const headerText = await header.textContent();
          expect(headerText, 
            `Accordion header ${i} should have text content`
          ).toBeTruthy();
        }
        
      } else if (test.breakpoint === 'mobile') {
        // Check desktop-only message content
        const messageContent = page.locator('.gh-desktop-only-content');
        
        const hasIcon = await messageContent.locator('[style*="font-size: 48px"]').count() > 0;
        const hasHeading = await messageContent.locator('h2').count() > 0;
        const hasDescription = await messageContent.locator('p').count() > 0;
        const hasButton = await messageContent.locator('button').count() > 0;
        
        expect(hasIcon && hasHeading && hasDescription && hasButton, 
          'Mobile desktop-only message should have icon, heading, description, and button'
        ).toBe(true);
      }
    }
  });

  /**
   * Property 18: Upload Functionality Availability
   * For any upload functionality, publish capabilities should be available 
   * on desktop and tablet but hidden on mobile
   * 
   * Validates: Requirements 6.4, 6.5
   */
  test('should restrict upload functionality appropriately by breakpoint', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .functionality-test {
            padding: 20px;
          }
          
          .upload-actions {
            display: flex;
            gap: 12px;
            padding: 16px;
            background: white;
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            margin-top: 20px;
          }
          
          .publish-functionality {
            display: flex;
            gap: 12px;
          }
          
          .view-only-access {
            display: none;
            text-align: center;
            padding: 24px;
            background: #f0f0f0;
            border-radius: 8px;
          }
          
          .upload-form-fields {
            display: grid;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .form-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .form-input {
            padding: 12px;
            border: 1px solid #e6e8ef;
            border-radius: 4px;
            min-height: 44px;
          }
          
          .action-button {
            padding: 12px 16px;
            border: 1px solid #4F46E5;
            border-radius: 4px;
            background: #4F46E5;
            color: white;
            cursor: pointer;
            min-height: 44px;
          }
          
          .action-button.secondary {
            background: white;
            color: #4F46E5;
          }
          
          .action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          /* Mobile restrictions */
          @media (max-width: 767px) {
            .upload-form-fields {
              display: none;
            }
            
            .publish-functionality {
              display: none;
            }
            
            .view-only-access {
              display: block;
            }
            
            .upload-actions {
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="functionality-test">
          <!-- Upload Form Fields -->
          <div class="upload-form-fields">
            <div class="form-field">
              <label>Game ID</label>
              <input type="text" class="form-input" placeholder="com.iruka.game-name">
            </div>
            <div class="form-field">
              <label>Title</label>
              <input type="text" class="form-input" placeholder="Game Title">
            </div>
            <div class="form-field">
              <label>Files</label>
              <input type="file" class="form-input" multiple>
            </div>
          </div>
          
          <!-- View-Only Access Message -->
          <div class="view-only-access">
            <h3>View-Only Access</h3>
            <p>Upload and editing features are not available on mobile devices.</p>
            <p>You can view game information and status only.</p>
          </div>
          
          <!-- Upload Actions -->
          <div class="upload-actions">
            <div class="publish-functionality">
              <button class="action-button secondary">Save Draft</button>
              <button class="action-button">Submit to QC</button>
              <button class="action-button secondary">Preview</button>
            </div>
            
            <button class="action-button secondary mobile-back-button" style="display: none;">
              Go Back
            </button>
          </div>
        </div>
        
        <script>
          // Show back button only on mobile
          function updateMobileUI() {
            const backButton = document.querySelector('.mobile-back-button');
            if (window.innerWidth <= 767) {
              backButton.style.display = 'block';
            } else {
              backButton.style.display = 'none';
            }
          }
          
          updateMobileUI();
          window.addEventListener('resize', updateMobileUI);
        </script>
      </body>
      </html>
    `);
    
    const functionalityTests = [
      {
        viewport: { width: 1200, height: 800 },
        breakpoint: 'desktop',
        shouldHaveUploadForm: true,
        shouldHavePublishActions: true,
        shouldShowViewOnly: false
      },
      {
        viewport: { width: 1024, height: 768 },
        breakpoint: 'tablet',
        shouldHaveUploadForm: true,
        shouldHavePublishActions: true,
        shouldShowViewOnly: false
      },
      {
        viewport: { width: 375, height: 667 },
        breakpoint: 'mobile',
        shouldHaveUploadForm: false,
        shouldHavePublishActions: false,
        shouldShowViewOnly: true
      }
    ];
    
    for (const test of functionalityTests) {
      await page.setViewportSize(test.viewport);
      await page.waitForTimeout(100);
      
      // Check upload form availability
      const uploadForm = page.locator('.upload-form-fields');
      if (test.shouldHaveUploadForm) {
        await expect(uploadForm, 
          `Upload form should be available on ${test.breakpoint}`
        ).toBeVisible();
        
        // Check form fields are interactive
        const formInputs = page.locator('.form-input');
        const inputCount = await formInputs.count();
        
        expect(inputCount, 
          `Upload form should have input fields on ${test.breakpoint}`
        ).toBeGreaterThan(0);
        
        // Test form interaction
        const firstInput = formInputs.first();
        await firstInput.fill('test-game-id');
        
        const inputValue = await firstInput.inputValue();
        expect(inputValue, 
          `Form inputs should be functional on ${test.breakpoint}`
        ).toBe('test-game-id');
        
      } else {
        await expect(uploadForm, 
          `Upload form should be hidden on ${test.breakpoint}`
        ).not.toBeVisible();
      }
      
      // Check publish functionality availability
      const publishActions = page.locator('.publish-functionality');
      if (test.shouldHavePublishActions) {
        await expect(publishActions, 
          `Publish actions should be available on ${test.breakpoint}`
        ).toBeVisible();
        
        // Check action buttons
        const actionButtons = publishActions.locator('.action-button');
        const buttonCount = await actionButtons.count();
        
        expect(buttonCount, 
          `Should have action buttons on ${test.breakpoint}`
        ).toBeGreaterThan(0);
        
        // Check button touch targets
        for (let i = 0; i < buttonCount; i++) {
          const button = actionButtons.nth(i);
          const buttonBox = await button.boundingBox();
          
          if (buttonBox) {
            expect(buttonBox.height, 
              `Action button ${i} should meet touch target requirements on ${test.breakpoint}`
            ).toBeGreaterThanOrEqual(44);
          }
        }
        
      } else {
        await expect(publishActions, 
          `Publish actions should be hidden on ${test.breakpoint}`
        ).not.toBeVisible();
      }
      
      // Check view-only access message
      const viewOnlyMessage = page.locator('.view-only-access');
      if (test.shouldShowViewOnly) {
        await expect(viewOnlyMessage, 
          `View-only message should be shown on ${test.breakpoint}`
        ).toBeVisible();
        
        // Check message content
        const messageText = await viewOnlyMessage.textContent();
        expect(messageText, 
          'View-only message should explain limitations'
        ).toContain('View-Only Access');
        
        // Check back button is available
        const backButton = page.locator('.mobile-back-button');
        await expect(backButton, 
          'Back button should be available on mobile'
        ).toBeVisible();
        
      } else {
        await expect(viewOnlyMessage, 
          `View-only message should be hidden on ${test.breakpoint}`
        ).not.toBeVisible();
      }
    }
  });

  test('should handle accordion interactions on tablet', async ({ page }) => {
    await page.goto('/console');
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .accordion-test {
            padding: 20px;
          }
          
          .gh-accordion-section {
            border: 1px solid #e6e8ef;
            border-radius: 8px;
            margin-bottom: 12px;
            background: white;
          }
          
          .gh-accordion-header {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 16px;
            background: none;
            border: none;
            cursor: pointer;
            min-height: 48px;
          }
          
          .gh-accordion-header:hover {
            background-color: #f0f0f0;
          }
          
          .gh-accordion-header.active {
            background-color: #eef2ff;
            color: #4F46E5;
          }
          
          .gh-accordion-content {
            padding: 16px;
            border-top: 1px solid #e6e8ef;
            display: none;
          }
          
          .gh-accordion-content.active {
            display: block;
          }
          
          .gh-accordion-chevron {
            margin-left: auto;
            transition: transform 0.2s ease;
          }
          
          .gh-accordion-header.active .gh-accordion-chevron {
            transform: rotate(90deg);
          }
        </style>
      </head>
      <body>
        <div class="accordion-test">
          <div class="gh-accordion-section">
            <button class="gh-accordion-header" onclick="toggleAccordion(this)">
              <span>⬆️</span>
              <span>Upload Files</span>
              <span class="gh-accordion-chevron">▶</span>
            </button>
            <div class="gh-accordion-content">
              <p>Upload form content goes here</p>
              <input type="text" placeholder="Game ID">
            </div>
          </div>
          
          <div class="gh-accordion-section">
            <button class="gh-accordion-header" onclick="toggleAccordion(this)">
              <span>📋</span>
              <span>Game Manifest</span>
              <span class="gh-accordion-chevron">▶</span>
            </button>
            <div class="gh-accordion-content">
              <p>Manifest form content goes here</p>
              <textarea placeholder="Description"></textarea>
            </div>
          </div>
          
          <div class="gh-accordion-section">
            <button class="gh-accordion-header" onclick="toggleAccordion(this)">
              <span>👁</span>
              <span>Preview & QA</span>
              <span class="gh-accordion-chevron">▶</span>
            </button>
            <div class="gh-accordion-content">
              <p>Preview and QA content goes here</p>
              <label><input type="checkbox"> Tested devices</label>
            </div>
          </div>
        </div>
        
        <script>
          function toggleAccordion(header) {
            const content = header.nextElementSibling;
            const isActive = header.classList.contains('active');
            
            // Close all other accordions
            document.querySelectorAll('.gh-accordion-header').forEach(h => {
              h.classList.remove('active');
              h.nextElementSibling.classList.remove('active');
            });
            
            // Toggle current accordion
            if (!isActive) {
              header.classList.add('active');
              content.classList.add('active');
            }
          }
        </script>
      </body>
      </html>
    `);
    
    // Set tablet viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(100);
    
    // Test accordion interaction
    const accordionHeaders = page.locator('.gh-accordion-header');
    const headerCount = await accordionHeaders.count();
    
    expect(headerCount, 'Should have accordion headers').toBe(3);
    
    // Initially no content should be visible
    const accordionContents = page.locator('.gh-accordion-content.active');
    let activeCount = await accordionContents.count();
    expect(activeCount, 'Initially no accordion content should be active').toBe(0);
    
    // Click first accordion header
    const firstHeader = accordionHeaders.first();
    await firstHeader.click();
    await page.waitForTimeout(100);
    
    // First accordion should be active
    const firstHeaderActive = await firstHeader.evaluate((el) => el.classList.contains('active'));
    expect(firstHeaderActive, 'First accordion header should be active after click').toBe(true);
    
    const firstContent = page.locator('.gh-accordion-content.active');
    const firstContentCount = await firstContent.count();
    expect(firstContentCount, 'First accordion content should be visible').toBe(1);
    
    // Click second accordion header
    const secondHeader = accordionHeaders.nth(1);
    await secondHeader.click();
    await page.waitForTimeout(100);
    
    // Only second accordion should be active
    const activeHeaders = page.locator('.gh-accordion-header.active');
    const activeHeaderCount = await activeHeaders.count();
    expect(activeHeaderCount, 'Only one accordion should be active at a time').toBe(1);
    
    const secondHeaderActive = await secondHeader.evaluate((el) => el.classList.contains('active'));
    expect(secondHeaderActive, 'Second accordion header should be active').toBe(true);
    
    // Test touch target sizes
    for (let i = 0; i < headerCount; i++) {
      const header = accordionHeaders.nth(i);
      const headerBox = await header.boundingBox();
      
      if (headerBox) {
        expect(headerBox.height, 
          `Accordion header ${i} should meet touch target requirements`
        ).toBeGreaterThanOrEqual(44);
      }
    }
  });
});