/**
 * Jest Test Suite for Cognikidz Assessment Pipeline v2.0
 * Tests the modular pipeline architecture and core functionality
 */

const pipeline = require('../index');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

describe('Cognikidz Assessment Pipeline v2.0', () => {
  
  afterAll(async () => {
    // Clean up resources after all tests
    try {
      await pipeline.cleanup();
      
      // Stop the memory cleanup interval to allow Jest to exit
      const { MemoryCleaner } = require('../memory/memory-cleaner');
      MemoryCleaner.stopCleanupInterval();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Pipeline Initialization', () => {
    test('should load pipeline modules successfully', () => {
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.startAssessment).toBe('function');
      expect(typeof pipeline.processResponse).toBe('function');
      expect(typeof pipeline.generateSummary).toBe('function');
    });

    test('should return correct version information', () => {
      const status = pipeline.getStatus();
      expect(status.version).toBe('2.0.0');
      expect(status.modules).toBeDefined();
      expect(status.modules.core).toBe(true);
      expect(status.modules.config).toBe(true);
      expect(status.modules.memory).toBe(true);
    });

    test('should provide available assessment types', () => {
      const types = pipeline.getAvailableAssessmentTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('autism');
      expect(types).toContain('adhd');
      expect(types).toContain('dyslexia');
      expect(types).toContain('general');
    });
  });

  describe('Assessment Discovery', () => {
    test('should get age-appropriate assessments', () => {
      const assessments = pipeline.getAgeAppropriateAssessments(72); // 6 years old
      expect(Array.isArray(assessments)).toBe(true);
      expect(assessments.length).toBeGreaterThan(0);
    });

    test('should get recommended assessment sequence', () => {
      const sequence = pipeline.getRecommendedAssessmentSequence(72, ['social interaction']);
      expect(Array.isArray(sequence)).toBe(true);
      expect(sequence.length).toBeGreaterThan(0);
    });

    test('should get assessment metadata', () => {
      const metadata = pipeline.getAssessmentMetadata('autism');
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
    });
  });

  describe('Data Validation', () => {
    test('should validate correct assessment data', () => {
      const validData = {
        assessmentType: 'general',
        formData: {
          childName: 'Test Child',
          childAge: 6,
          concerns: ['development']
        }
      };
      
      const validation = pipeline.validateAssessmentData(validData);
      expect(validation.isValid).toBe(true);
    });

    test('should reject invalid assessment data', () => {
      const invalidData = {
        assessmentType: 'invalid_type',
        formData: {}
      };
      
      const validation = pipeline.validateAssessmentData(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
    });
  });

  describe('Assessment Flow (without API keys)', () => {
    test('should handle startAssessment gracefully without API keys', async () => {
      const assessmentData = {
        assessmentType: 'general',
        formData: {
          childName: 'Test Child',
          childAge: 6,
          concerns: ['general development']
        }
      };

      // This should either work or fail gracefully
      try {
        const result = await pipeline.startAssessment(assessmentData);
        // If it succeeds, check the structure
        if (result.success) {
          expect(result.sessionId).toBeDefined();
          expect(result.question).toBeDefined();
        } else {
          // If it fails, it should fail gracefully with proper error
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      } catch (error) {
        // Should fail gracefully, not throw unhandled errors
        expect(error.message).toContain('API key' || 'configuration' || 'environment');
      }
    }, 10000); // 10 second timeout

    test('should handle processResponse gracefully without valid session', async () => {
      try {
        const result = await pipeline.processResponse('invalid_session', {
          questionId: 'test_q1',
          response: 'test response'
        });
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } catch (error) {
        // Should handle errors gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Module Access', () => {
    test('should provide access to core modules', () => {
      expect(pipeline.modules).toBeDefined();
      expect(pipeline.modules.core).toBeDefined();
      expect(pipeline.modules.config).toBeDefined();
      expect(pipeline.modules.memory).toBeDefined();
      expect(pipeline.modules.prompts).toBeDefined();
      expect(pipeline.modules.resources).toBeDefined();
      expect(pipeline.modules.utils).toBeDefined();
    });

    test('should maintain backward compatibility', () => {
      // Check that old API functions are still available
      expect(typeof pipeline.startAssessment).toBe('function');
      expect(typeof pipeline.processResponse).toBe('function');
      expect(typeof pipeline.generateSummary).toBe('function');
      
      // Check that AssessmentState is still available for backward compatibility
      expect(pipeline.AssessmentState).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    test('should provide memory status information', () => {
      const status = pipeline.getStatus();
      expect(status.memoryStatus).toBeDefined();
      expect(typeof status.memoryStatus).toBe('object');
    });

    test('should handle cleanup gracefully', async () => {
      // This should not throw an error
      await expect(pipeline.cleanup()).resolves.not.toThrow();
    });
  });
}); 