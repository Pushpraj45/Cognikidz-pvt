/**
 * Jest Global Teardown
 * Clean up test environment after all tests complete
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');

  // Calculate total test time
  if (global.__TEST_CONFIG__) {
    const totalTime = Date.now() - global.__TEST_CONFIG__.startTime;
    console.log(`⏱️  Total test execution time: ${totalTime}ms`);
  }

  // Clean up temporary files
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🗑️  Cleaned up temporary files');
    } catch (error) {
      console.warn('⚠️  Could not clean up temporary files:', error.message);
    }
  }

  // Clean up mock services
  if (global.__MOCK_SERVICES__) {
    Object.keys(global.__MOCK_SERVICES__).forEach(service => {
      if (global.__MOCK_SERVICES__[service] && typeof global.__MOCK_SERVICES__[service].cleanup === 'function') {
        global.__MOCK_SERVICES__[service].cleanup();
      }
    });
    console.log('🔌 Cleaned up mock services');
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    console.log('🧹 Forced garbage collection');
  }

  // Generate final test summary
  const summaryPath = path.join(__dirname, 'reports', 'test-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    totalTime: global.__TEST_CONFIG__ ? Date.now() - global.__TEST_CONFIG__.startTime : 0,
    environment: 'jest',
    nodeVersion: process.version,
    platform: process.platform,
  };

  try {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Test summary saved to: ${summaryPath}`);
  } catch (error) {
    console.warn('⚠️  Could not save test summary:', error.message);
  }

  console.log('✅ Test environment cleanup completed');
}; 