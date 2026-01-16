# Real SDK Auto Testing Implementation

## Overview
Đã thay thế **fake/mock data** bằng **SDK thật** và **Playwright browser automation** để test game thực tế.

## Changes Made

### 1. AutoTestingService.ts - REAL SDK Integration

#### Before (Fake):
```typescript
// Mock SDK import
private static async mockSDKImport(): Promise<MiniGameSDK> {
  return {
    createIframeBridge: (options: any) => ({
      init: async () => { await this.delay(100); }, // FAKE delay
      // ...
    }),
    // ... all mocked
  }
}
```

#### After (Real):
```typescript
// Import REAL SDK
import * as SDK from '@iruka-edu/mini-game-sdk';
import { chromium, type Browser, type Page } from 'playwright';

// Use real browser for testing
private static async initializeBrowser(): Promise<Browser> {
  this.browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  return this.browser;
}
```

### 2. QA-01: Real Handshake Testing

#### Before (Fake):
```typescript
await hubBridge.init(); // Mock delay
const readyTime = Date.now();
results.initToReadyMs = readyTime - initStart;
```

#### After (Real):
```typescript
// Load actual game in browser
await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });

// Wait for real game initialization
await page.waitForFunction(() => {
  return document.readyState === 'complete' && 
         (document.querySelector('canvas') !== null || 
          (window as any).game !== undefined);
}, { timeout: 10000 });

// Measure REAL timing
results.initToReadyMs = Date.now() - initStart;
```

### 3. QA-02: Real Result Converter Testing

#### Before (Fake):
```typescript
const testResults: RawResult[] = [
  { score: 100, time: 30000, correct: 10, total: 10 }
];
// Hardcoded test data
```

#### After (Real):
```typescript
// Capture real game results
const testResults = await page.evaluate(async () => {
  if ((window as any).submitResult) {
    const result = await (window as any).submitResult(data);
    return result;
  }
});

// Use REAL SDK normalizeResult
const normalized = SDK.normalizeResult({
  score: rawResult.score,
  time: rawResult.time,
  correct: rawResult.correct,
  total: rawResult.total
} as RawResult);
```

### 4. QA-03: Real iOS Pack Testing

#### Before (Fake):
```typescript
const assetLoadTime = Math.random() * 2000 + 500; // FAKE random
results.auto.readyMs = assetLoadTime;
```

#### After (Real):
```typescript
// Monitor REAL network requests
page.on('response', response => {
  const url = response.url();
  if (url.match(/\.(png|jpg|mp3|wav)$/i)) {
    if (!response.ok()) {
      failedAssets.push(`${url} (${response.status()})`);
    }
  }
});

// Wait for REAL assets to load
await page.waitForLoadState('networkidle', { timeout: 15000 });
const assetLoadTime = Date.now() - assetLoadStart;
```

### 5. QA-04: Real Idempotency Testing

#### Before (Fake):
```typescript
// Mock submissions
for (let i = 0; i < 3; i++) {
  const result = await hubBridge.submitResult(testSubmission);
  submissions.push(result);
}
```

#### After (Real):
```typescript
// Track REAL submission requests
page.on('request', request => {
  const url = request.url();
  if (url.includes('/api/') && url.includes('submit')) {
    submissions.push({ url, method: request.method() });
  }
});

// Test with REAL game submission
const submissionResults = await page.evaluate(async (data) => {
  for (let i = 0; i < 3; i++) {
    if ((window as any).submitResult) {
      const result = await (window as any).submitResult(data);
      results.push({ id: result?.id, attempt: i + 1 });
    }
  }
  return results;
}, testSubmission);
```

### 6. MiniGameQCService.ts - Real Performance Testing

#### Before (Fake):
```typescript
const metrics: PerformanceMetrics = {
  loadTime: Math.random() * 3000 + 1000, // FAKE
  frameRate: Math.random() * 30 + 30,    // FAKE
  memoryUsage: Math.random() * 50 * 1024 * 1024, // FAKE
};
```

#### After (Real):
```typescript
// Use Playwright to measure REAL performance
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Track REAL network requests
page.on('response', response => {
  networkRequests++;
  totalBytes += body.length;
});

// Measure REAL load time
const loadStart = Date.now();
await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });
const loadTime = Date.now() - loadStart;

// Get REAL performance metrics
const perfMetrics = await page.evaluate(() => {
  const perf = performance.getEntriesByType('navigation')[0];
  const memory = (performance as any).memory;
  
  return {
    loadTime: perf?.loadEventEnd - perf?.fetchStart,
    memoryUsed: memory?.usedJSHeapSize
  };
});

// Measure REAL FPS
const fps = await page.evaluate(() => {
  return new Promise<number>((resolve) => {
    let frames = 0;
    function countFrame() {
      frames++;
      if (elapsed < 1000) {
        requestAnimationFrame(countFrame);
      } else {
        resolve(frames);
      }
    }
    requestAnimationFrame(countFrame);
  });
});
```

### 7. Real Device Compatibility Testing

#### Before (Fake):
```typescript
results.mobile.passed = Math.random() > 0.2; // FAKE 80% pass rate
results.tablet.passed = Math.random() > 0.1; // FAKE 90% pass rate
```

#### After (Real):
```typescript
// Use Playwright device emulation
const { chromium, devices } = await import('playwright');
const browser = await chromium.launch({ headless: true });

// Test REAL mobile device
const mobileDevice = devices['iPhone 12'];
const context = await browser.newContext({
  ...mobileDevice,
  viewport: { width: 390, height: 844 }
});
const page = await context.newPage();

await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });

// Check REAL mobile compatibility
const mobileCheck = await page.evaluate(() => {
  const hasCanvas = document.querySelector('canvas') !== null;
  const hasContent = document.body.offsetHeight > 100;
  const isTouchEnabled = 'ontouchstart' in window;
  
  return { hasCanvas, hasContent, isTouchEnabled };
});

results.mobile.passed = mobileCheck.hasCanvas && mobileCheck.hasContent;
```

## SDK Components Used

### From @iruka-edu/mini-game-sdk:

1. **SDK.validateManifest()** - Validate game manifest
2. **SDK.normalizeResult()** - Normalize game results
3. **SDK.AutoSaveManager** - Test auto-save functionality
4. **SDK.__testSpy** - Monitor SDK events and errors
5. **SDK.SDK_VERSION** - Check SDK version

### From Playwright:

1. **chromium.launch()** - Launch headless browser
2. **page.goto()** - Navigate to game URL
3. **page.evaluate()** - Execute code in browser context
4. **page.waitForFunction()** - Wait for conditions
5. **page.waitForLoadState()** - Wait for network idle
6. **page.on('response')** - Monitor network requests
7. **devices['iPhone 12']** - Device emulation

## Benefits

### ✅ Real Testing
- Tests actual game loading and initialization
- Measures real performance metrics
- Detects real asset loading issues
- Tests real device compatibility

### ✅ Accurate Results
- No more random fake data
- Real timing measurements
- Real network monitoring
- Real browser behavior

### ✅ SDK Integration
- Uses official @iruka-edu/mini-game-sdk
- Tests SDK functionality
- Validates SDK integration
- Monitors SDK events

### ✅ Browser Automation
- Playwright for real browser testing
- Device emulation for mobile/tablet
- Performance API for metrics
- Network monitoring for assets

## Testing Flow

```
User clicks "Chạy kiểm tra"
  ↓
POST /api/qc/run-comprehensive-test
  ↓
MiniGameQCService.runQCTestSuite()
  ↓
AutoTestingService.runComprehensiveQA()
  ↓
1. Initialize Playwright browser (chromium)
2. Enable SDK test spy
3. Run QA-00: SDK Integration Tests
   - Validate manifest with SDK.validateManifest()
   - Check SDK version
   - Test AutoSaveManager
4. Navigate to game URL with Playwright
5. Run QA-01: Real Handshake Test
   - Wait for game initialization
   - Measure INIT→READY timing
   - Test QUIT→COMPLETE timing
6. Run QA-02: Real Converter Test
   - Capture game results
   - Normalize with SDK.normalizeResult()
   - Validate accuracy/completion
7. Run QA-03: Real iOS Pack Test
   - Monitor network requests
   - Check asset loading
   - Test white screen/autoplay
8. Run QA-04: Real Idempotency Test
   - Test multiple submissions
   - Check for duplicates
   - Validate consistency
9. Run Performance Tests
   - Measure load time
   - Calculate FPS
   - Check memory usage
10. Run Device Compatibility Tests
    - Test mobile (iPhone 12 emulation)
    - Test tablet (iPad Pro emulation)
    - Test desktop (1920x1080)
  ↓
Generate comprehensive report
  ↓
Save to database (QCReport)
  ↓
Return results to frontend
```

## Requirements

### Dependencies:
- `@iruka-edu/mini-game-sdk@^0.3.2` ✅ (already installed)
- `playwright@^1.57.0` ✅ (already installed)

### Environment:
- Node.js runtime (for Playwright)
- Chromium browser (auto-downloaded by Playwright)

## Usage

No changes needed in frontend or API - everything works the same, but now with REAL testing instead of fake data!

```typescript
// Same API call
const response = await fetch('/api/qc/run-comprehensive-test', {
  method: 'POST',
  body: JSON.stringify({
    gameId: 'com.iruka.math-game',
    versionId: '507f1f77bcf86cd799439011',
    gameUrl: 'https://storage.googleapis.com/.../index.html'
  })
});

// But now returns REAL test results!
const data = await response.json();
console.log(data.testReport); // Real metrics, not fake
```

## Next Steps

1. ✅ Replace mock SDK with real SDK
2. ✅ Implement Playwright browser automation
3. ✅ Real performance measurements
4. ✅ Real device compatibility testing
5. 🔄 Test with actual games
6. 🔄 Fine-tune thresholds based on real data
7. 🔄 Add more detailed error reporting
8. 🔄 Implement screenshot capture on failures

## Notes

- Browser automation runs in headless mode (no UI)
- Tests run server-side (not in user's browser)
- Each test creates a new browser context for isolation
- Browser is reused across tests for performance
- Cleanup happens automatically after tests complete
