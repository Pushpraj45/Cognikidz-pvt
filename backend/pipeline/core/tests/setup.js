/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Set test timeout
jest.setTimeout(10000);

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified amount of time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create a mock function with specified return values
   */
  createMockWithValues: (values) => {
    const mock = jest.fn();
    values.forEach((value, index) => {
      mock.mockReturnValueOnce(value);
    });
    return mock;
  },
  
  /**
   * Generate a unique test ID
   */
  generateTestId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * Deep clone an object for test isolation
   */
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
  
  /**
   * Assert that a function throws with a specific message
   */
  expectToThrowWithMessage: (fn, message) => {
    expect(fn).toThrow();
    try {
      fn();
    } catch (error) {
      expect(error.message).toContain(message);
    }
  }
};

// Mock external modules that aren't needed for testing
// Only mock if they exist, otherwise skip
try {
  jest.mock('../../utils/logger', () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }));
} catch (e) {
  // Logger doesn't exist, skip mocking
}

try {
  jest.mock('../../utils/openai', () => ({
    createChatCompletion: jest.fn(),
  }));
} catch (e) {
  // OpenAI utils doesn't exist, skip mocking
}

// Performance testing utilities
global.performanceUtils = {
  /**
   * Measure execution time of a function
   */
  measureTime: async (fn) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    return {
      result,
      timeMs: Number(end - start) / 1000000,
    };
  },
  
  /**
   * Assert function executes within time limit
   */
  expectWithinTime: async (fn, maxTimeMs) => {
    const { result, timeMs } = await global.performanceUtils.measureTime(fn);
    expect(timeMs).toBeLessThan(maxTimeMs);
    return result;
  }
};

// Memory monitoring
global.memoryUtils = {
  /**
   * Get current memory usage
   */
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  },
  
  /**
   * Monitor memory during test execution
   */
  monitorMemory: (testName) => {
    const startMemory = global.memoryUtils.getMemoryUsage();
    return {
      finish: () => {
        const endMemory = global.memoryUtils.getMemoryUsage();
        const memoryDiff = {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        };
        if (memoryDiff.heapUsed > 50) { // Alert if more than 50MB increase
          console.warn(`Memory warning in ${testName}: +${memoryDiff.heapUsed}MB heap`);
        }
        return { startMemory, endMemory, memoryDiff };
      }
    };
  }
};

// Enhanced matchers
expect.extend({
  /**
   * Check if a value is within a range
   */
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

  /**
   * Check if execution time is acceptable
   */
  toExecuteWithinTime(received, maxTime) {
    return global.performanceUtils.measureTime(received).then(({ timeMs }) => {
      const pass = timeMs <= maxTime;
      if (pass) {
        return {
          message: () => `expected execution time ${timeMs}ms not to be within ${maxTime}ms`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected execution time ${timeMs}ms to be within ${maxTime}ms`,
          pass: false,
        };
      }
    });
  },

  /**
   * Check if an object has valid assessment structure
   */
  toBeValidAssessmentState(received) {
    const requiredFields = ['sessionId', 'assessmentType', 'formData', 'responses'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
    
    if (hasAllFields) {
      return {
        message: () => `expected object not to be a valid assessment state`,
        pass: true,
      };
    } else {
      const missingFields = requiredFields.filter(field => !received.hasOwnProperty(field));
      return {
        message: () => `expected object to be a valid assessment state, missing: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Global error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log
});

// Set NODE_ENV for tests
process.env.NODE_ENV = 'test';

console.log('🧪 Jest test environment initialized for Pipeline Core tests'); 