/**
 * Core Index
 * Central export point for all core assessment logic modules
 */

// Import core modules
const questionGenerator = require('./question-generator');
const responseProcessor = require('./response-processor');
const assessmentOrchestrator = require('./orchestrator');

// Main orchestrator functions (primary API)
const {
  startAssessment,
  processResponseAndContinue,
  completeAssessment,
  generateAssessmentSummary,
} = assessmentOrchestrator;

// Question generation functions
const {
  generateQuestion,
  parseGeneratedQuestion,
  generateFallbackQuestion,
  getNextQuestionDomain,
  validateQuestionParams,
} = questionGenerator;

// Response processing functions
const {
  processResponse,
  evaluateResponse,
  calculateRiskIndicators,
  generateFollowUpRecommendations,
} = responseProcessor;

// Export main API (recommended usage)
module.exports = {
  // Primary assessment flow functions
  startAssessment,
  processResponseAndContinue,
  completeAssessment,
  generateAssessmentSummary,
  
  // Question generation
  generateQuestion,
  generateFallbackQuestion,
  getNextQuestionDomain,
  
  // Response processing
  processResponse,
  evaluateResponse,
  calculateRiskIndicators,
  generateFollowUpRecommendations,
  
  // Validation utilities
  validateQuestionParams,
  
  // Direct module access (for advanced usage)
  modules: {
    questionGenerator,
    responseProcessor,
    assessmentOrchestrator,
  },
  
  // Convenience aliases for backward compatibility
  orchestrator: assessmentOrchestrator,
  questions: questionGenerator,
  responses: responseProcessor,
}; 