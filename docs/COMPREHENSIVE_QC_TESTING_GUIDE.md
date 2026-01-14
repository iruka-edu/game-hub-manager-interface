# Comprehensive QC Testing Guide

## Tổng quan

Hệ thống Comprehensive QC Testing được thiết kế để tự động hóa quá trình kiểm tra chất lượng (QC) cho mini games, tích hợp với Mini Game SDK để đảm bảo games hoạt động hoàn hảo trước khi publish.

## Kiến trúc hệ thống

### 1. AutoTestingService (Enhanced)
- **Mục đích**: Thực hiện QA-01 đến QA-04 tests với SDK integration
- **Tính năng mới**:
  - Tích hợp với `@iruka-edu/mini-game-sdk`
  - Test SDK components (Bridge, Phaser, Audio, State Management)
  - Debug utilities với `__testSpy`
  - Enhanced error reporting

### 2. MiniGameQCService
- **Mục đích**: Orchestrate toàn bộ QC test suite
- **Tính năng**:
  - Pre-flight checks
  - Performance testing
  - Device compatibility testing
  - Comprehensive reporting
  - Recommendations engine

### 3. ComprehensiveQCTester (React Component)
- **Mục đích**: UI interface cho QC testers
- **Tính năng**:
  - Configurable test parameters
  - Real-time progress tracking
  - Detailed results visualization
  - Export test reports

## Test Categories

### QA-00: SDK Integration Tests (Mới)
Kiểm tra tất cả components của Mini Game SDK:

1. **Manifest Validation**
   - Validate game manifest structure
   - Check required fields và compatibility

2. **Bridge Creation**
   - Test iframe bridge creation
   - Verify communication channels

3. **Phaser Integration**
   - Test HowlerAudioManager
   - Test AssetManager
   - Test ScaleManager

4. **State Management**
   - Test AutoSaveManager
   - Test save/load functionality

5. **Debug Utilities**
   - Test __testSpy functionality
   - Verify event tracking

### QA-01: Enhanced Handshake Testing
- INIT→READY timing với SDK monitoring
- QUIT→COMPLETE timing
- SDK health checks
- Event timeline tracking

### QA-02: Enhanced Converter Testing
- Result accuracy calculation
- Completion rate validation
- SDK result submission testing
- Enhanced error handling

### QA-03: Enhanced iOS Pack Testing
- SDK asset management testing
- Audio functionality với HowlerAudioManager
- Scale management cho responsive design
- White screen detection với SDK monitoring

### QA-04: Enhanced Idempotency Testing
- Duplicate submission prevention
- AutoSaveManager integration testing
- Backend consistency checks
- SDK-based validation

### Performance Testing (Mới)
- Load time measurement
- Frame rate monitoring
- Memory usage tracking
- Bundle size analysis
- Network request optimization

### Device Compatibility Testing (Mới)
- Mobile compatibility
- Tablet compatibility
- Desktop compatibility
- Touch gesture validation
- Responsive design verification

## Cách sử dụng

### 1. API Endpoint Usage

```typescript
// Run comprehensive QC test
const response = await fetch('/api/qc/run-comprehensive-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameId: 'com.iruka.math-game',
    versionId: '507f1f77bcf86cd799439011',
    testConfig: {
      timeout: 120000,
      enableSDKDebugging: true,
      testEnvironment: 'staging',
      deviceSimulation: {
        mobile: true,
        tablet: true,
        desktop: true
      },
      performanceThresholds: {
        maxLoadTime: 5000,
        minFrameRate: 30,
        maxMemoryUsage: 100 * 1024 * 1024
      }
    }
  })
});

const result = await response.json();
console.log('Test Report:', result.testReport);
```

### 2. React Component Usage

```tsx
import { ComprehensiveQCTester } from '@/components/qc/ComprehensiveQCTester';

function QCPage() {
  const handleTestComplete = (report) => {
    console.log('QC Test completed:', report);
    // Handle test completion
  };

  return (
    <ComprehensiveQCTester
      gameId="com.iruka.math-game"
      versionId="507f1f77bcf86cd799439011"
      gameTitle="Math Adventure"
      version="1.2.0"
      onTestComplete={handleTestComplete}
    />
  );
}
```

### 3. Direct Service Usage

```typescript
import { MiniGameQCService } from '@/lib/MiniGameQCService';

const testSuite = {
  gameId: 'com.iruka.math-game',
  versionId: '507f1f77bcf86cd799439011',
  gameUrl: 'https://storage.googleapis.com/bucket/games/game/1.0.0/index.html',
  manifest: {
    runtime: 'iframe-html',
    capabilities: ['score', 'progress'],
    entryUrl: 'https://...',
    version: '1.0.0'
  },
  testConfig: {
    userId: 'user123',
    timeout: 120000,
    enableSDKDebugging: true,
    // ... other config
  }
};

const report = await MiniGameQCService.runQCTestSuite(testSuite);
console.log('QC Report:', report);
```

## Test Configuration Options

### Basic Configuration
```typescript
interface QCTestConfig {
  userId: string;                    // QC tester user ID
  timeout: number;                   // Test timeout (ms)
  skipManualTests: boolean;          // Skip manual validation
  enableSDKDebugging: boolean;       // Enable SDK debug mode
  testEnvironment: 'development' | 'staging' | 'production';
}
```

### Device Simulation
```typescript
deviceSimulation: {
  mobile: boolean;    // Test mobile compatibility
  tablet: boolean;    // Test tablet compatibility
  desktop: boolean;   // Test desktop compatibility
}
```

### Performance Thresholds
```typescript
performanceThresholds: {
  maxLoadTime: number;      // Maximum load time (ms)
  minFrameRate: number;     // Minimum frame rate (fps)
  maxMemoryUsage: number;   // Maximum memory usage (bytes)
}
```

## Test Results Structure

### QC Test Report
```typescript
interface QCTestReport {
  gameId: string;
  versionId: string;
  testTimestamp: Date;
  overallResult: 'PASS' | 'FAIL' | 'WARNING';
  
  // Core test results
  qaResults: QATestResults;           // QA-01 to QA-04
  sdkTestResults: SDKTestSummary;     // SDK integration tests
  performanceMetrics: PerformanceMetrics;
  deviceCompatibility: DeviceCompatibilityResults;
  
  // Analysis
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  loadTime: number;         // Game load time (ms)
  frameRate: number;        // Average frame rate (fps)
  memoryUsage: number;      // Peak memory usage (bytes)
  bundleSize: number;       // Total bundle size (bytes)
  assetLoadTime: number;    // Asset loading time (ms)
  networkRequests: number;  // Number of network requests
}
```

## Integration với QC Workflow

### 1. Automatic Testing
- QC tester clicks "Run Comprehensive Test"
- System automatically runs all test categories
- Results saved to database
- Version status updated based on results

### 2. Manual Review
- QC tester reviews automated test results
- Can override automated decisions if needed
- Add manual notes và observations
- Final approval/rejection decision

### 3. Reporting
- Comprehensive test reports
- Performance benchmarks
- Device compatibility matrix
- Recommendations for improvements

## Best Practices

### 1. Test Configuration
- Use `staging` environment for most tests
- Enable SDK debugging for detailed analysis
- Set realistic performance thresholds
- Test all target devices

### 2. Performance Optimization
- Monitor bundle size regularly
- Optimize asset loading
- Implement efficient memory management
- Minimize network requests

### 3. SDK Integration
- Always test SDK components
- Verify manifest compatibility
- Test save/load functionality
- Monitor SDK events với debug tools

### 4. Error Handling
- Review all critical issues before approval
- Address performance warnings
- Follow optimization recommendations
- Document known limitations

## Troubleshooting

### Common Issues

1. **SDK Loading Failures**
   - Check network connectivity
   - Verify SDK version compatibility
   - Review console errors

2. **Performance Issues**
   - Optimize asset sizes
   - Implement lazy loading
   - Review memory leaks
   - Optimize rendering

3. **Device Compatibility**
   - Test touch interactions
   - Verify responsive design
   - Check orientation handling
   - Validate input methods

### Debug Tools

1. **SDK Test Spy**
   ```typescript
   import { __testSpy } from '@iruka-edu/mini-game-sdk';
   
   __testSpy.enable();
   // Run tests
   const summary = __testSpy.getSummary();
   console.log('SDK Events:', summary);
   ```

2. **Performance Monitoring**
   - Use browser DevTools
   - Monitor network requests
   - Check memory usage
   - Analyze frame rates

3. **Error Logging**
   - Review test error logs
   - Check browser console
   - Monitor network errors
   - Analyze SDK events

## Future Enhancements

### Planned Features
1. **Visual Regression Testing**
   - Screenshot comparison
   - UI element validation
   - Layout consistency checks

2. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast validation

3. **Security Testing**
   - XSS vulnerability checks
   - Content Security Policy validation
   - Data sanitization testing

4. **Load Testing**
   - Concurrent user simulation
   - Stress testing
   - Performance under load

### Integration Roadmap
1. **CI/CD Integration**
   - Automated testing in build pipeline
   - Pre-deployment validation
   - Continuous monitoring

2. **Analytics Integration**
   - Performance tracking
   - Error rate monitoring
   - User experience metrics

3. **Advanced Reporting**
   - Historical trend analysis
   - Comparative reports
   - Performance benchmarking

---

## Kết luận

Hệ thống Comprehensive QC Testing cung cấp một giải pháp toàn diện để đảm bảo chất lượng mini games trước khi publish. Với việc tích hợp Mini Game SDK và các công cụ testing tiên tiến, QC testers có thể nhanh chóng và chính xác đánh giá chất lượng games, đảm bảo trải nghiệm người dùng tốt nhất.

Hệ thống này không chỉ tự động hóa các test cases cơ bản mà còn cung cấp insights sâu sắc về performance, compatibility, và SDK integration, giúp developers cải thiện chất lượng games một cách hiệu quả.