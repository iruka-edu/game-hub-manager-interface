#!/usr/bin/env node

/**
 * MongoDB Performance Test Script
 * Tests connection performance before and after optimization
 */

const { performance } = require('perf_hooks');

// Simulate multiple API calls
async function testConnectionPerformance() {
  console.log('🧪 Testing MongoDB Connection Performance...\n');

  const testCases = [
    { name: 'Single API Call', calls: 1 },
    { name: 'Multiple API Calls (5)', calls: 5 },
    { name: 'Concurrent API Calls (10)', calls: 10 },
  ];

  for (const testCase of testCases) {
    console.log(`📊 ${testCase.name}:`);
    
    const startTime = performance.now();
    
    if (testCase.calls === 1) {
      // Single call
      await simulateAPICall();
    } else if (testCase.calls <= 5) {
      // Sequential calls
      for (let i = 0; i < testCase.calls; i++) {
        await simulateAPICall();
      }
    } else {
      // Concurrent calls
      const promises = Array(testCase.calls).fill().map(() => simulateAPICall());
      await Promise.all(promises);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`   ⏱️  Total time: ${duration.toFixed(2)}ms`);
    console.log(`   📈 Average per call: ${(duration / testCase.calls).toFixed(2)}ms`);
    console.log('');
  }
}

// Simulate an API call that uses MongoDB
async function simulateAPICall() {
  try {
    // Simulate repository operations
    const response = await fetch('http://localhost:3000/api/gcs/cache', {
      method: 'GET',
      headers: {
        'Cookie': 'iruka_session=test_session_token'
      }
    });
    
    if (!response.ok) {
      console.log(`   ⚠️  API call failed: ${response.status}`);
      return;
    }
    
    await response.json();
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Connection health check
async function testConnectionHealth() {
  console.log('🏥 Testing Connection Health...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/gcs/cache');
    
    if (response.ok) {
      console.log('   ✅ MongoDB connection is healthy');
    } else {
      console.log('   ❌ MongoDB connection issues detected');
    }
  } catch (error) {
    console.log('   ❌ Cannot reach server:', error.message);
  }
  
  console.log('');
}

// Memory usage monitoring
function monitorMemoryUsage() {
  console.log('💾 Memory Usage:');
  
  const usage = process.memoryUsage();
  
  console.log(`   RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
}

// Main test runner
async function runTests() {
  console.log('🚀 MongoDB Performance Test Suite\n');
  console.log('='.repeat(50));
  console.log('');
  
  // Initial memory check
  monitorMemoryUsage();
  
  // Connection health
  await testConnectionHealth();
  
  // Performance tests
  await testConnectionPerformance();
  
  // Final memory check
  console.log('📊 Final Results:');
  monitorMemoryUsage();
  
  console.log('✅ Performance test completed!');
  console.log('');
  console.log('💡 Tips for optimization:');
  console.log('   - Use repository manager for cached instances');
  console.log('   - Enable connection pooling');
  console.log('   - Use parallel database operations');
  console.log('   - Monitor connection health regularly');
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testConnectionPerformance,
  testConnectionHealth,
  monitorMemoryUsage,
  runTests
};