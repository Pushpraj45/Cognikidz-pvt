/**
 * Risk Calculator Unit Tests
 * Tests for backend/pipeline/core/scoring/risk-calculator.js
 */

const { calculateOverallRiskScore, calculateAverageConfidence } = require('../../../scoring/risk-calculator');

describe('Risk Calculator', () => {
  describe('calculateOverallRiskScore', () => {
    test('should return zero score for empty responses', () => {
      const result = calculateOverallRiskScore([]);
      
      expect(result.score).toBe(0);
      expect(result.level).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    test('should handle null or undefined responses', () => {
      const result = calculateOverallRiskScore(null);
      
      expect(result.score).toBe(0);
      expect(result.level).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

         test('should calculate risk score from responses with risk indicators', () => {
       const responses = [
         {
           questionId: 'q1',
           riskIndicators: { riskScore: 0.8 }
         },
         {
           questionId: 'q2', 
           riskIndicators: { riskScore: 0.9 }
         }
       ];

       const result = calculateOverallRiskScore(responses);
       
       expect(result.score).toBeGreaterThan(0.7);
       expect(result.level).toBe('high');
       expect(result.confidence).toBeGreaterThan(0);
       expect(result.responseCount).toBe(2);
     });

    test('should return low risk for low scores', () => {
      const responses = [
        {
          questionId: 'q1',
          riskIndicators: { riskScore: 0.2 }
        }
      ];

      const result = calculateOverallRiskScore(responses);
      
      expect(result.level).toBe('low');
    });

    test('should return medium risk for medium scores', () => {
      const responses = [
        {
          questionId: 'q1',
          riskIndicators: { riskScore: 0.5 }
        }
      ];

      const result = calculateOverallRiskScore(responses);
      
      expect(result.level).toBe('medium');
    });

    test('should handle responses without risk indicators', () => {
      const responses = [
        { questionId: 'q1' },
        { questionId: 'q2' }
      ];

      const result = calculateOverallRiskScore(responses);
      
      expect(result.score).toBe(0);
      expect(result.level).toBe('low');
    });

    test('should weight recent responses more heavily', () => {
      const responses = [
        { questionId: 'q1', riskIndicators: { riskScore: 0.3 } },
        { questionId: 'q2', riskIndicators: { riskScore: 0.9 } }
      ];

      const result = calculateOverallRiskScore(responses);
      
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.score).toBeLessThan(0.9);
    });
  });

  describe('calculateAverageConfidence', () => {
    test('should return zero for empty responses', () => {
      const result = calculateAverageConfidence([]);
      
      expect(result).toBe(0);
    });

    test('should handle null or undefined responses', () => {
      const result = calculateAverageConfidence(null);
      
      expect(result).toBe(0);
    });

    test('should calculate average confidence from evaluations', () => {
      const responses = [
        {
          questionId: 'q1',
          evaluation: { confidence: 0.8 }
        },
        {
          questionId: 'q2',
          evaluation: { confidence: 0.6 }
        }
      ];

      const result = calculateAverageConfidence(responses);
      
      expect(result).toBe(0.7);
    });

    test('should handle responses without evaluations', () => {
      const responses = [
        { questionId: 'q1' },
        { questionId: 'q2' }
      ];

      const result = calculateAverageConfidence(responses);
      
      expect(result).toBe(0);
    });

    test('should ignore zero confidence scores', () => {
      const responses = [
        { questionId: 'q1', evaluation: { confidence: 0 } },
        { questionId: 'q2', evaluation: { confidence: 0.8 } }
      ];

      const result = calculateAverageConfidence(responses);
      
      expect(result).toBe(0.8);
    });

    test('should handle mixed responses with and without evaluations', () => {
      const responses = [
        { questionId: 'q1', evaluation: { confidence: 0.9 } },
        { questionId: 'q2' },
        { questionId: 'q3', evaluation: { confidence: 0.7 } }
      ];

      const result = calculateAverageConfidence(responses);
      
      expect(result).toBe(0.8);
    });
  });

  describe('Integration Tests', () => {
    test('should provide consistent results across multiple calculations', () => {
      const responses = [
        { questionId: 'q1', riskIndicators: { riskScore: 0.7 } }
      ];
      
      const calc1 = calculateOverallRiskScore(responses);
      const calc2 = calculateOverallRiskScore(responses);
      
      expect(calc1.score).toBe(calc2.score);
      expect(calc1.level).toBe(calc2.level);
    });

    test('should handle large datasets efficiently', () => {
      const responses = Array.from({ length: 100 }, (_, i) => ({
        questionId: `q${i}`,
        riskIndicators: { riskScore: 0.5 }
      }));
      
      const startTime = Date.now();
      const result = calculateOverallRiskScore(responses);
      const endTime = Date.now();
      
      expect(result.responseCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
}); 