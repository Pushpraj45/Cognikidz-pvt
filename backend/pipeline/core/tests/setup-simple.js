/**
 * Simple Jest Test Setup
 * Provides basic test environment configuration and utilities
 */

// Load environment variables from the backend directory
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Mock external services (if they exist)
// Note: Only mock modules that actually exist to avoid Jest errors

// Custom matchers for test assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidAssessmentState(received) {
    const requiredFields = ['sessionId', 'assessmentType', 'status'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
    
    if (hasAllFields) {
      return {
        message: () => `expected assessment state to be invalid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected assessment state to have fields: ${requiredFields.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Test utilities
global.testUtils = {
  // Performance measurement
  measurePerformance: (fn) => {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    return { result, duration: end - start };
  },

  // Memory monitoring
  getMemoryUsage: () => {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    };
  },

  // Test data generators
  generateTestSessionId: () => `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  generateTestFormData: (overrides = {}) => ({
    childName: 'Test Child',
    age: 8,
    gender: 'male',
    ...overrides
  }),
};

console.log('🧪 Simple Jest test environment initialized'); 