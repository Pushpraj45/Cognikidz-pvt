/**
 * Jest Configuration for Pipeline Core Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.simple.test.js',
    '<rootDir>/tests/integration/pipeline-workflow.test.js',
    '<rootDir>/tests/integration/orchestrator.test.js',
    '<rootDir>/tests/unit/scoring/risk-calculator.simple.test.js',
    '<rootDir>/tests/unit/scoring/risk-calculator.test.js',
    '<rootDir>/tests/question-bank.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup-simple.js'],
  
  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'session/**/*.js',
    'summary/**/*.js',
    'scoring/**/*.js',
    'recommendations/**/*.js',
    'data/**/*.js',
    'utils/**/*.js',
    'orchestrator.js',
    '!tests/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Test timeout (longer for real AI service integration)
  testTimeout: 180000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Transform files (simplified)
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Global setup/teardown (simplified)
  // globalSetup: '<rootDir>/tests/global-setup.js',
  // globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // Test results processor (simplified)
  // testResultsProcessor: '<rootDir>/tests/results-processor.js',
  
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
  
  // Test name pattern
  testNamePattern: undefined,
  
  // Bail on first failure in CI
  bail: process.env.CI ? 1 : 0,
  
  // Force exit
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true
}; 