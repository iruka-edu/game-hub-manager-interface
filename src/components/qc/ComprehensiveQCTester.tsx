'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api-fetch';
import type { QCTestReport } from '@/lib/MiniGameQCService';

interface ComprehensiveQCTesterProps {
  gameId: string;
  versionId: string;
  gameTitle: string;
  version: string;
  onTestComplete?: (report: QCTestReport) => void;
}

interface TestConfig {
  timeout: number;
  skipManualTests: boolean;
  enableSDKDebugging: boolean;
  testEnvironment: 'development' | 'staging' | 'production';
  deviceSimulation: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
  performanceThresholds: {
    maxLoadTime: number;
    minFrameRate: number;
    maxMemoryUsage: number;
  };
}

export function ComprehensiveQCTester({
  gameId,
  versionId,
  gameTitle,
  version,
  onTestComplete
}: ComprehensiveQCTesterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testReport, setTestReport] = useState<QCTestReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  const [testConfig, setTestConfig] = useState<TestConfig>({
    timeout: 120000,
    skipManualTests: false,
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
  });

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestReport(null);
    setProgress('Initializing comprehensive QC test...');

    try {
      const result = await apiPost<any>('/api/v1/qc/run', {
        gameId,
        versionId,
        testConfig,
      });
      setTestReport(result.testReport);
      setProgress('Test completed successfully!');
      
      if (onTestComplete) {
        onTestComplete(result.testReport);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setProgress('Test failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getResultBadge = (result: 'PASS' | 'FAIL' | 'WARNING') => {
    const colors = {
      PASS: 'bg-green-100 text-green-800 border-green-200',
      FAIL: 'bg-red-100 text-red-800 border-red-200',
      WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${colors[result]}`}>
        {result}
      </span>
    );
  };

  const getBadge = (variant: 'success' | 'destructive' | 'secondary', text: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      destructive: 'bg-red-100 text-red-800 border-red-200',
      secondary: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${colors[variant]}`}>
        {text}
      </span>
    );
  };

  const formatBytes = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">🧪 Comprehensive QC Test Configuration</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Environment</label>
            <select
              value={testConfig.testEnvironment}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                testEnvironment: e.target.value as any
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isRunning}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
            <input
              type="number"
              value={testConfig.timeout}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                timeout: parseInt(e.target.value)
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Device Simulation */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Device Simulation</label>
          <div className="flex gap-4">
            {Object.entries(testConfig.deviceSimulation).map(([device, enabled]) => (
              <label key={device} className="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    deviceSimulation: {
                      ...prev.deviceSimulation,
                      [device]: e.target.checked
                    }
                  }))}
                  className="mr-2"
                  disabled={isRunning}
                />
                {device.charAt(0).toUpperCase() + device.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Performance Thresholds */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Performance Thresholds</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Load Time (ms)</label>
              <input
                type="number"
                value={testConfig.performanceThresholds.maxLoadTime}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  performanceThresholds: {
                    ...prev.performanceThresholds,
                    maxLoadTime: parseInt(e.target.value)
                  }
                }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Frame Rate (fps)</label>
              <input
                type="number"
                value={testConfig.performanceThresholds.minFrameRate}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  performanceThresholds: {
                    ...prev.performanceThresholds,
                    minFrameRate: parseInt(e.target.value)
                  }
                }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Memory (MB)</label>
              <input
                type="number"
                value={Math.round(testConfig.performanceThresholds.maxMemoryUsage / 1024 / 1024)}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  performanceThresholds: {
                    ...prev.performanceThresholds,
                    maxMemoryUsage: parseInt(e.target.value) * 1024 * 1024
                  }
                }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={testConfig.enableSDKDebugging}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                enableSDKDebugging: e.target.checked
              }))}
              className="mr-2"
              disabled={isRunning}
            />
            Enable SDK Debugging
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={testConfig.skipManualTests}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                skipManualTests: e.target.checked
              }))}
              className="mr-2"
              disabled={isRunning}
            />
            Skip Manual Tests
          </label>
        </div>

        <button
          onClick={runComprehensiveTest}
          disabled={isRunning}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
        >
          {isRunning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Comprehensive QC Test...
            </>
          ) : (
            '🚀 Run Comprehensive QC Test'
          )}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center">
            {isRunning && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span className="text-sm text-gray-600">{progress}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-red-800">
            <strong>❌ Test Failed:</strong> {error}
          </div>
        </div>
      )}

      {/* Test Results */}
      {testReport && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📊 Test Results</h3>
            {getResultBadge(testReport.overallResult)}
          </div>

          {/* Overall Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium mb-2">Game Information</h4>
              <div className="text-sm space-y-1">
                <div><strong>Game:</strong> {gameTitle}</div>
                <div><strong>Version:</strong> {version}</div>
                <div><strong>Test Date:</strong> {testReport.testTimestamp.toLocaleString()}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Summary</h4>
              <div className="text-sm space-y-1">
                <div><strong>QA Tests:</strong> {
                  [testReport.qaResults.qa01.pass, testReport.qaResults.qa02.pass, 
                   !testReport.qaResults.qa03.auto.assetError, testReport.qaResults.qa04.pass]
                    .filter(Boolean).length
                }/4 passed</div>
                <div><strong>SDK Tests:</strong> {testReport.sdkTestResults.passedTests}/{testReport.sdkTestResults.totalTests} passed</div>
                <div><strong>Duration:</strong> {Math.round(testReport.qaResults.testDuration / 1000)}s</div>
              </div>
            </div>
          </div>

          {/* QA Test Details */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">🔍 QA Test Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>QA-01 Handshake</span>
                  {getBadge(testReport.qaResults.qa01.pass ? 'success' : 'destructive', testReport.qaResults.qa01.pass ? 'PASS' : 'FAIL')}
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>QA-02 Converter</span>
                  {getBadge(testReport.qaResults.qa02.pass ? 'success' : 'destructive', testReport.qaResults.qa02.pass ? 'PASS' : 'FAIL')}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>QA-03 iOS Pack</span>
                  {getBadge(!testReport.qaResults.qa03.auto.assetError ? 'success' : 'destructive', !testReport.qaResults.qa03.auto.assetError ? 'PASS' : 'FAIL')}
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>QA-04 Idempotency</span>
                  {getBadge(testReport.qaResults.qa04.pass ? 'success' : 'destructive', testReport.qaResults.qa04.pass ? 'PASS' : 'FAIL')}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">⚡ Performance Metrics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(testReport.performanceMetrics.loadTime)}ms
                </div>
                <div className="text-sm text-blue-800">Load Time</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(testReport.performanceMetrics.frameRate)}fps
                </div>
                <div className="text-sm text-green-800">Frame Rate</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {formatBytes(testReport.performanceMetrics.memoryUsage)}
                </div>
                <div className="text-sm text-purple-800">Memory Usage</div>
              </div>
            </div>
          </div>

          {/* Device Compatibility */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">📱 Device Compatibility</h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(testReport.deviceCompatibility).map(([device, result]) => (
                <div key={device} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{device}</span>
                    {result.tested ? (
                      getBadge(result.passed ? 'success' : 'destructive', result.passed ? 'PASS' : 'FAIL')
                    ) : (
                      getBadge('secondary', 'SKIPPED')
                    )}
                  </div>
                  {result.issues.length > 0 && (
                    <div className="text-xs text-red-600">
                      {result.issues.map((issue: string, index: number) => (
                        <div key={index}>• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Issues and Recommendations */}
          {(testReport.criticalIssues.length > 0 || testReport.warnings.length > 0 || testReport.recommendations.length > 0) && (
            <div>
              <h4 className="font-medium mb-3">📋 Issues & Recommendations</h4>
              
              {testReport.criticalIssues.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <h5 className="font-medium text-red-800 mb-2">❌ Critical Issues</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {testReport.criticalIssues.map((issue: string, index: number) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testReport.warnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h5 className="font-medium text-yellow-800 mb-2">⚠️ Warnings</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {testReport.warnings.map((warning: string, index: number) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testReport.recommendations.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-800 mb-2">💡 Recommendations</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {testReport.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
