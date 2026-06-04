/**
 * Jest Global Setup
 * Initialize test environment before all tests run
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Initializing Pipeline Test Environment...');

  // Create test directories if they don't exist
  const testDirs = [
    path.join(__dirname, 'coverage'),
    path.join(__dirname, 'reports'),
    path.join(__dirname, 'temp'),
  ];

  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created test directory: ${path.basename(dir)}`);
    }
  });

  // Set global test configuration
  global.__TEST_CONFIG__ = {
    startTime: Date.now(),
    testEnvironment: 'jest',
    coverage: true,
    verbose: true,
  };

  // Initialize mock services
  global.__MOCK_SERVICES__ = {
    aiService: null,
    database: null,
    cache: null,
  };

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce noise during tests
  process.env.AI_SERVICE_TIMEOUT = '5000';
  process.env.TEST_TIMEOUT = '10000';

  console.log('✅ Test environment initialized successfully');
}; 