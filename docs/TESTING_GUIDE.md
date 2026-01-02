# GameHub Testing Guide

This guide provides comprehensive testing procedures for the GameHub application, including manual testing, automated testing, and performance monitoring.

## Quick Start

### For Testers
1. Print the [Testing Checklist](./TESTING_CHECKLIST.md)
2. Use the Performance Monitor (appears in development mode)
3. Press `Ctrl+Shift+D` to copy device information
4. Follow the device matrix and test procedures

### For Developers
1. Run `npm run test:devices:local` for automated testing
2. Use the Performance Monitor component in development
3. Check QC Performance Check in review pages
4. Monitor console for performance data

---

## Testing Components Overview

### 1. Performance Monitor
**Location:** Appears in development mode on all pages
**Features:**
- Real-time performance metrics (TTFB, LCP, DOM Load)
- Device and browser detection
- Memory usage monitoring
- Resource analysis
- Network timing information

**Usage:**
- Automatically appears in bottom-right corner during development
- Click `×` to hide/show
- Data is logged to console for easy copying
- Access via `window.perfMonitor.exportData()`

### 2. Device Information Component
**Location:** Available on all pages (development mode)
**Features:**
- Comprehensive device detection
- Browser version identification
- Screen resolution and viewport tracking
- Network type detection
- Capability testing (WebGL, localStorage, etc.)

**Usage:**
- Press `Ctrl+Shift+D` to copy device report to clipboard
- Access via `window.deviceInfo` in console
- Generates formatted testing reports

### 3. QC Performance Check
**Location:** Game review pages (`/console/games/[id]/review`)
**Features:**
- Automated game loading performance test
- Resource analysis and recommendations
- Performance scoring (0-100)
- Device environment reporting
- Integration with QC workflow

**Usage:**
- Click "Run Performance Test" button
- Wait for automated analysis
- Review performance score and recommendations
- Include results in QC reports

### 4. Manual Game Loading
**Location:** Game preview sections
**Features:**
- Prevents automatic resource loading
- Manual control over game testing
- Sandbox security restrictions
- Loading state feedback

**Usage:**
- Click "Tải Game để Test" to load game
- Button shows loading states
- Game loads in secure sandbox environment

---

## Testing Procedures

### Manual Testing Workflow

#### 1. Pre-Test Setup
```bash
# Start development server
npm run dev

# Open browser developer tools (F12)
# Enable device simulation if needed
```

#### 2. Device Matrix Testing
Test on these minimum devices:
- **Android Phone**: Samsung/Xiaomi (Chrome + Samsung Internet)
- **iPhone**: iOS Safari
- **Tablet**: iPad Safari or Android tablet
- **Desktop**: Windows Chrome + Edge

#### 3. Screen Resolution Testing
- **Mobile**: 360×800 (portrait), 800×360 (landscape)
- **Tablet**: 768×1024 (portrait), 1024×768 (landscape)  
- **Desktop**: 1366×768, 1920×1080

#### 4. Performance Testing
1. Open Chrome DevTools → Network tab
2. Enable "Disable cache"
3. Set throttling to "Fast 3G" or "Slow 4G"
4. Reload page and measure:
   - TTFB (Time to First Byte)
   - LCP (Largest Contentful Paint)
   - Total download size
   - Resource count

### Automated Testing Workflow

#### 1. Local Testing
```bash
# Test against local development server
npm run test:devices:local

# Or specify custom URL
npm run test:devices http://localhost:3000
```

#### 2. Staging Testing
```bash
# Test against staging environment
npm run test:devices:staging

# Or specify staging URL
npm run test:devices https://your-staging-url.vercel.app
```

#### 3. Review Results
Results are generated in `./test-results/`:
- `test-report.html` - Visual report with screenshots
- `test-report.json` - Raw data for analysis
- `test-summary.md` - Markdown summary for documentation

---

## Performance Standards

### Target Metrics
- **TTFB**: < 800ms
- **LCP**: < 3-4s on Slow 4G
- **Total Page Size**: < 2MB initial load
- **Game Load Time**: < 5s
- **No single request**: > 3s without reason

### Performance Score Calculation
- **100 points** base score
- **-30 points** for game load timeout (>10s)
- **-20 points** for slow game loading (>5s)
- **-15 points** for slow TTFB (>1s)
- **-15 points** for large total size (>5MB)
- **-10 points** for high memory usage (>100MB)
- **-5 points** per slow resource (>2s)

### Score Interpretation
- **80-100**: Excellent performance ✅
- **60-79**: Good performance, minor optimizations needed ⚠️
- **0-59**: Poor performance, requires optimization ❌

---

## QC Integration

### QC Review Process
1. **Load Game Preview**: Use manual loading button
2. **Run Performance Test**: Click "Run Performance Test"
3. **Review Metrics**: Check performance score and recommendations
4. **Test Device Matrix**: Use device preview controls
5. **Document Results**: Include performance data in QC report

### QC Report Template
```markdown
## Performance Test Results

**Test Date:** [Date]
**Tester:** [Name]
**Device:** [Device Info from Ctrl+Shift+D]

### Performance Metrics
- **Game Load Time:** [X]ms
- **Performance Score:** [X]/100
- **TTFB:** [X]ms
- **Total Resources:** [X] files ([X]KB)

### Device Compatibility
- [ ] Mobile (360×800) - [Pass/Fail]
- [ ] Tablet (768×1024) - [Pass/Fail]  
- [ ] Desktop (1366×768) - [Pass/Fail]

### Issues Found
- [List any issues]

### Recommendations
- [List recommendations from performance test]
```

---

## Troubleshooting

### Common Issues

#### Performance Monitor Not Showing
- **Cause**: Only appears in development mode
- **Solution**: Ensure `import.meta.env.DEV` is true

#### Device Info Not Available
- **Cause**: Component not loaded or JavaScript disabled
- **Solution**: Check browser console for errors

#### Automated Tests Failing
- **Cause**: Server not running or network issues
- **Solution**: 
  ```bash
  # Check if server is running
  curl http://localhost:4321
  
  # Install dependencies
  npm install
  
  # Run tests with verbose output
  DEBUG=* npm run test:devices:local
  ```

#### Game Preview Not Loading
- **Cause**: Manual loading not triggered or network issues
- **Solution**: Click "Tải Game để Test" button and check network tab

### Performance Issues

#### Slow Loading Times
1. **Check Network**: Use Chrome DevTools Network tab
2. **Analyze Resources**: Look for large files or slow requests
3. **Optimize Images**: Compress and use WebP format
4. **Enable Caching**: Check cache headers
5. **Code Splitting**: Reduce initial bundle size

#### High Memory Usage
1. **Check for Leaks**: Use Chrome DevTools Memory tab
2. **Optimize Game Code**: Review game JavaScript
3. **Limit Concurrent Games**: Avoid multiple game instances
4. **Clear Resources**: Properly dispose of game objects

---

## Best Practices

### For Testers
1. **Always test on real devices** when possible
2. **Use different network conditions** (3G, 4G, WiFi)
3. **Clear cache between tests** for accurate measurements
4. **Document device information** using Ctrl+Shift+D
5. **Take screenshots** of any issues found
6. **Test critical user flows** thoroughly

### For Developers
1. **Monitor performance metrics** during development
2. **Use the Performance Monitor** to catch issues early
3. **Optimize for mobile-first** design approach
4. **Implement proper loading states** for better UX
5. **Use sandbox restrictions** for security
6. **Test with throttled networks** regularly

### For QC Team
1. **Run performance tests** for every game review
2. **Include device matrix testing** in QC process
3. **Document performance scores** in reports
4. **Flag games with scores < 60** for optimization
5. **Verify manual loading** works correctly
6. **Test on target devices** for final approval

---

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Device Testing
on: [push, pull_request]

jobs:
  test-devices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run preview &
      - run: sleep 10
      - run: npm run test:devices http://localhost:4173
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Vercel Integration
Add to `vercel.json`:
```json
{
  "buildCommand": "npm run build && npm run test:devices:staging",
  "outputDirectory": "dist"
}
```

---

## Reporting and Analytics

### Performance Tracking
- Use the Performance Monitor data for trend analysis
- Track performance scores over time
- Monitor resource usage patterns
- Identify performance regressions

### Device Usage Analytics
- Track which devices are most commonly used
- Identify problematic device/browser combinations
- Monitor compatibility issues
- Plan testing priorities based on usage data

### QC Metrics
- Track QC performance test results
- Monitor game optimization trends
- Identify common performance issues
- Measure improvement over time

---

This testing guide ensures comprehensive coverage of device compatibility, performance standards, and quality assurance processes for the GameHub application.