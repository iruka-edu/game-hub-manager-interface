#!/usr/bin/env node

/**
 * Automated Testing Script for GameHub
 * 
 * This script runs automated performance and compatibility tests
 * based on the device testing checklist.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class GameHubTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4321';
    this.outputDir = options.outputDir || './test-results';
    this.devices = [
      {
        name: 'iPhone 12',
        viewport: { width: 390, height: 844, isMobile: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      },
      {
        name: 'iPad',
        viewport: { width: 768, height: 1024, isMobile: true },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      },
      {
        name: 'Android Phone',
        viewport: { width: 360, height: 800, isMobile: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      },
      {
        name: 'Desktop',
        viewport: { width: 1366, height: 768, isMobile: false },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    ];
    
    this.testResults = [];
  }

  async init() {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log('🚀 Starting GameHub Automated Testing...');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`📁 Output Directory: ${this.outputDir}`);
  }

  async runAllTests() {
    await this.init();

    for (const device of this.devices) {
      console.log(`\n📱 Testing on ${device.name}...`);
      await this.testDevice(device);
    }

    await this.generateReport();
    console.log('\n✅ All tests completed!');
  }

  async testDevice(device) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set device viewport and user agent
      await page.setViewport(device.viewport);
      await page.setUserAgent(device.userAgent);

      // Enable network throttling for mobile devices
      if (device.viewport.isMobile) {
        const client = await page.target().createCDPSession();
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
          uploadThroughput: 750 * 1024 / 8, // 750 Kbps
          latency: 40
        });
      }

      const deviceResult = {
        device: device.name,
        viewport: device.viewport,
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Homepage Loading
      console.log(`  🏠 Testing homepage...`);
      deviceResult.tests.homepage = await this.testPageLoad(page, this.baseUrl);

      // Test 2: Login Flow
      console.log(`  🔐 Testing login flow...`);
      deviceResult.tests.login = await this.testLogin(page);

      // Test 3: Console Dashboard
      console.log(`  📊 Testing console dashboard...`);
      deviceResult.tests.console = await this.testConsole(page);

      // Test 4: Game Library
      console.log(`  🎮 Testing game library...`);
      deviceResult.tests.gameLibrary = await this.testGameLibrary(page);

      // Test 5: Responsive Layout
      console.log(`  📐 Testing responsive layout...`);
      deviceResult.tests.responsive = await this.testResponsiveLayout(page);

      // Take screenshot
      const screenshotPath = path.join(this.outputDir, `${device.name.replace(/\s+/g, '_')}_screenshot.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      deviceResult.screenshot = screenshotPath;

      this.testResults.push(deviceResult);

    } catch (error) {
      console.error(`❌ Error testing ${device.name}:`, error.message);
      this.testResults.push({
        device: device.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await browser.close();
    }
  }

  async testPageLoad(page, url) {
    const startTime = Date.now();
    
    try {
      // Navigate and wait for network idle
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
          ttfb: timing.responseStart - timing.requestStart,
          domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
          fullLoad: timing.loadEventEnd - timing.navigationStart,
          lcp: navigation ? navigation.loadEventEnd : null,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });

      // Check for layout issues
      const layoutIssues = await this.checkLayoutIssues(page);

      return {
        success: true,
        loadTime,
        metrics,
        layoutIssues,
        url
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        url
      };
    }
  }

  async testLogin(page) {
    try {
      // Navigate to login page
      await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });

      // Check if login form exists
      const loginForm = await page.$('form');
      if (!loginForm) {
        return { success: false, error: 'Login form not found' };
      }

      // Check form elements
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      const submitButton = await page.$('button[type="submit"], input[type="submit"]');

      return {
        success: true,
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton,
        formAccessible: !!(emailInput && passwordInput && submitButton)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConsole(page) {
    try {
      // Try to access console (might need authentication)
      await page.goto(`${this.baseUrl}/console`, { waitUntil: 'networkidle2' });

      // Check if redirected to login (expected behavior)
      const currentUrl = page.url();
      const isLoginRedirect = currentUrl.includes('/login');

      // Check for console elements (if authenticated)
      const hasNavigation = await page.$('nav, .navigation, [role="navigation"]');
      const hasMainContent = await page.$('main, .main-content, [role="main"]');

      return {
        success: true,
        redirectsToLogin: isLoginRedirect,
        hasNavigation: !!hasNavigation,
        hasMainContent: !!hasMainContent,
        currentUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testGameLibrary(page) {
    try {
      await page.goto(`${this.baseUrl}/console/library`, { waitUntil: 'networkidle2' });

      // Check if redirected to login
      const currentUrl = page.url();
      const isLoginRedirect = currentUrl.includes('/login');

      if (isLoginRedirect) {
        return {
          success: true,
          redirectsToLogin: true,
          message: 'Correctly redirects to login when not authenticated'
        };
      }

      // If not redirected, check library elements
      const hasGameGrid = await page.$('.game-grid, .games-list, [data-testid="games"]');
      const hasFilters = await page.$('.filters, .search, input[type="search"]');

      return {
        success: true,
        redirectsToLogin: false,
        hasGameGrid: !!hasGameGrid,
        hasFilters: !!hasFilters
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testResponsiveLayout(page) {
    const issues = [];

    try {
      // Test different viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1200, height: 800 }  // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.waitForTimeout(500); // Wait for layout to adjust

        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        // Check for overlapping elements
        const hasOverlappingElements = await this.checkOverlappingElements(page);

        if (hasHorizontalScroll) {
          issues.push(`Horizontal scroll detected at ${viewport.width}x${viewport.height}`);
        }

        if (hasOverlappingElements.length > 0) {
          issues.push(`Overlapping elements at ${viewport.width}x${viewport.height}: ${hasOverlappingElements.join(', ')}`);
        }
      }

      return {
        success: true,
        issues,
        responsive: issues.length === 0
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkLayoutIssues(page) {
    const issues = [];

    try {
      // Check for elements outside viewport
      const elementsOutside = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const outside = [];
        
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 10) { // 10px tolerance
            outside.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
          }
        });
        
        return outside.slice(0, 5); // Limit to first 5
      });

      if (elementsOutside.length > 0) {
        issues.push(`Elements extending beyond viewport: ${elementsOutside.join(', ')}`);
      }

      // Check for very small text
      const smallText = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const small = [];
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 12 && el.textContent.trim()) {
            small.push(el.tagName);
          }
        });
        
        return small.slice(0, 3);
      });

      if (smallText.length > 0) {
        issues.push(`Very small text detected: ${smallText.join(', ')}`);
      }

    } catch (error) {
      issues.push(`Layout check error: ${error.message}`);
    }

    return issues;
  }

  async checkOverlappingElements(page) {
    return await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
      const overlapping = [];

      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[j].getBoundingClientRect();

          // Check if rectangles overlap
          if (rect1.left < rect2.right && rect2.left < rect1.right &&
              rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
            overlapping.push(`${elements[i].tagName} overlaps ${elements[j].tagName}`);
          }
        }
      }

      return overlapping.slice(0, 3); // Limit results
    });
  }

  async generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.testResults
    };

    // Generate JSON report
    const jsonPath = path.join(this.outputDir, 'test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlPath = path.join(this.outputDir, 'test-report.html');
    const htmlContent = this.generateHTMLReport(reportData);
    fs.writeFileSync(htmlPath, htmlContent);

    // Generate markdown summary
    const mdPath = path.join(this.outputDir, 'test-summary.md');
    const mdContent = this.generateMarkdownSummary(reportData);
    fs.writeFileSync(mdPath, mdContent);

    console.log(`\n📊 Reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Markdown: ${mdPath}`);
  }

  generateSummary() {
    const total = this.testResults.length;
    const successful = this.testResults.filter(r => !r.error).length;
    const failed = total - successful;

    const avgLoadTime = this.testResults
      .filter(r => r.tests?.homepage?.success)
      .reduce((sum, r) => sum + r.tests.homepage.loadTime, 0) / successful || 0;

    return {
      total,
      successful,
      failed,
      successRate: (successful / total * 100).toFixed(1),
      avgLoadTime: Math.round(avgLoadTime)
    };
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GameHub Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1e40af; }
        .device-result { background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .device-header { background: #f1f5f9; padding: 15px; font-weight: bold; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; padding: 20px; }
        .test-item { padding: 15px; border-radius: 6px; }
        .success { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .error { background: #fef2f2; border: 1px solid #fecaca; }
        .warning { background: #fffbeb; border: 1px solid #fed7aa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>GameHub Automated Test Report</h1>
        <p>Generated: ${data.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${data.summary.total}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary.successful}</div>
            <div>Successful</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary.successRate}%</div>
            <div>Success Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary.avgLoadTime}ms</div>
            <div>Avg Load Time</div>
        </div>
    </div>

    ${data.results.map(result => `
        <div class="device-result">
            <div class="device-header">${result.device} - ${result.viewport ? `${result.viewport.width}×${result.viewport.height}` : 'Unknown'}</div>
            ${result.error ? `
                <div class="test-grid">
                    <div class="test-item error">
                        <strong>Error:</strong> ${result.error}
                    </div>
                </div>
            ` : `
                <div class="test-grid">
                    ${Object.entries(result.tests || {}).map(([testName, testResult]) => `
                        <div class="test-item ${testResult.success ? 'success' : 'error'}">
                            <strong>${testName}</strong><br>
                            ${testResult.success ? '✅ Passed' : `❌ Failed: ${testResult.error || 'Unknown error'}`}
                            ${testResult.loadTime ? `<br>Load time: ${testResult.loadTime}ms` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `).join('')}
</body>
</html>
    `.trim();
  }

  generateMarkdownSummary(data) {
    return `
# GameHub Test Report

**Generated:** ${data.timestamp}

## Summary

- **Total Tests:** ${data.summary.total}
- **Successful:** ${data.summary.successful}
- **Failed:** ${data.summary.failed}
- **Success Rate:** ${data.summary.successRate}%
- **Average Load Time:** ${data.summary.avgLoadTime}ms

## Device Results

${data.results.map(result => `
### ${result.device}

**Viewport:** ${result.viewport ? `${result.viewport.width}×${result.viewport.height}` : 'Unknown'}

${result.error ? `
❌ **Error:** ${result.error}
` : `
${Object.entries(result.tests || {}).map(([testName, testResult]) => `
- **${testName}:** ${testResult.success ? '✅ Passed' : `❌ Failed - ${testResult.error || 'Unknown error'}`}${testResult.loadTime ? ` (${testResult.loadTime}ms)` : ''}
`).join('')}
`}
`).join('')}

## Recommendations

${data.summary.successRate < 100 ? `
- Review failed tests and fix identified issues
- Test manually on devices that failed automated tests
- Check responsive design for layout issues
` : `
- All automated tests passed! ✅
- Consider manual testing on real devices for final validation
- Monitor performance metrics in production
`}
    `.trim();
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:4321';
  const outputDir = args[1] || './test-results';

  const tester = new GameHubTester({ baseUrl, outputDir });
  
  tester.runAllTests().catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  });
}

module.exports = GameHubTester;