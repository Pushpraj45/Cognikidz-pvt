/**
 * Jest Configuration for Backend Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/domains/**/*.test.js',
    '<rootDir>/pipeline/core/tests/**/*.test.js'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/pipeline/core/tests/fixtures/',
    '/pipeline/core/tests/mocks/',
    '/pipeline/core/tests/setup/'
  ],
  
  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'domains/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'config/**/*.js',
    'pipeline/**/*.js',
    '!**/tests/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!server.js'
  ],
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reporter configuration with summary reporter
  reporters: [
    'default',
    ['jest-summary-reporter', { 
      failuresOnly: false // Show all test results for comprehensive summary
    }]
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  maxWorkers: '50%',
  
  // Force exit
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true
}; 