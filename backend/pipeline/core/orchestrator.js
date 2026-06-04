/**
 * Assessment Orchestrator - Clean Coordinator
 * Provides a unified interface for assessment operations using modular components
 */

// Import session management modules
const { startAssessment } = require('./session/starter');
const { processResponseAndContinue } = require('./session/processor');
const { completeAssessment } = require('./session/completer');

// Import summary generation
const { generateAssessmentSummary } = require('./summary/generator');

// Import scoring and analysis
const { calculateOverallRiskScore } = require('./scoring/risk-calculator');
const { generateDomainScores } = require('./scoring/domain-scorer');
const { compileKeyFindings } = require('./scoring/findings');

// Import recommendations
const { generateRecommendations } = require('./recommendations/engine');
const { generateFollowUpSchedule } = require('./recommendations/scheduler');

// Import data processing
const { generateChartsData } = require('./data/charts');
const { calculateProgress } = require('./data/progress');

// Import utilities
const { assessmentShouldContinue } = require('./utils/flow-control');
const { validateAssessmentData } = require('./utils/validators');
const { generateSessionId } = require('./utils/session-utils');

/**
 * Main Assessment Orchestrator Class
 * Coordinates all assessment operations through modular components
 */
class AssessmentOrchestrator {
  constructor() {
    this.version = '2.0.0';
    this.initialized = true; // Simple initialization for now
  }

  /**
   * Start a new assessment session
   * @param {Object} data - Assessment initialization data
   * @returns {Promise<Object>} - Assessment start result
   */
  async startAssessment(data) {
    return startAssessment(data);
  }

  /**
   * Process a response and continue assessment
   * @param {string} sessionId - Session identifier
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} - Next question or completion result
   */
  async processResponseAndContinue(sessionId, responseData) {
    return processResponseAndContinue(sessionId, responseData);
  }

  /**
   * Complete an assessment and generate summary
   * @param {string} sessionId - Session identifier
   * @param {string} reason - Completion reason
   * @returns {Promise<Object>} - Assessment completion result
   */
  async completeAssessment(sessionId, reason = 'natural_completion') {
    return completeAssessment(sessionId, reason);
  }

  /**
   * Generate assessment summary for an existing session
   * @param {string} sessionId - Session identifier
   * @param {Object} state - Assessment state (optional)
   * @returns {Promise<Object>} - Assessment summary
   */
  async generateAssessmentSummary(sessionId, state = null) {
    if (state) {
      return generateAssessmentSummary(sessionId, state);
    }
    
    // If no state provided, try to get it from session manager
    const { SessionManager } = require('../memory/session-manager');
    const sessionState = SessionManager.getCachedState(sessionId);
    
    if (!sessionState) {
      throw new Error(`No state found for session: ${sessionId}`);
    }
    
    return generateAssessmentSummary(sessionId, sessionState);
  }

  // Utility methods for direct access to scoring components
  
  /**
   * Calculate overall risk score from responses
   * @param {Array} responses - Assessment responses
   * @returns {Object} - Risk assessment
   */
  calculateOverallRiskScore(responses) {
    return calculateOverallRiskScore(responses);
  }

  /**
   * Generate domain scores
   * @param {Object} state - Assessment state
   * @param {number} riskScore - Risk score
   * @returns {Array} - Domain scores
   */
  generateDomainScores(state, riskScore) {
    return generateDomainScores(state, riskScore);
  }

  /**
   * Compile key findings from responses
   * @param {Array} responses - Assessment responses
   * @returns {Object} - Key findings
   */
  compileKeyFindings(responses) {
    return compileKeyFindings(responses);
  }

  /**
   * Generate recommendations
   * @param {Object} overallRisk - Overall risk assessment
   * @param {Object} domainScores - Domain scores
   * @param {Object} state - Assessment state
   * @returns {Array} - Recommendations
   */
  generateRecommendations(overallRisk, domainScores, state) {
    return generateRecommendations(overallRisk, domainScores, state);
  }

  /**
   * Generate follow-up schedule
   * @param {number} riskScore - Risk score
   * @param {string} assessmentType - Assessment type
   * @returns {Object} - Follow-up schedule
   */
  generateFollowUpSchedule(riskScore, assessmentType) {
    return generateFollowUpSchedule(riskScore, assessmentType);
  }

  /**
   * Generate charts data
   * @param {Object} state - Assessment state
   * @returns {Object} - Charts data
   */
  generateChartsData(state) {
    return generateChartsData(state);
  }

  /**
   * Calculate assessment progress
   * @param {Object} state - Assessment state
   * @param {Object} metadata - Assessment metadata
   * @returns {Object} - Progress information
   */
  calculateProgress(state, metadata) {
    return calculateProgress(state, metadata);
  }

  /**
   * Determine if assessment should continue
   * @param {Object} state - Assessment state
   * @param {Object} lastResponse - Last response
   * @returns {Object} - Continuation decision
   */
  assessmentShouldContinue(state, lastResponse) {
    return assessmentShouldContinue(state, lastResponse);
  }

  /**
   * Validate assessment data
   * @param {Object} data - Assessment data
   * @returns {Object} - Validation result
   */
  validateAssessmentData(data) {
    return validateAssessmentData(data);
  }

  /**
   * Generate unique session ID
   * @returns {string} - Session ID
   */
  generateSessionId() {
    return generateSessionId();
  }

  /**
   * Get orchestrator status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      components: {
        sessionManagement: true,
        summaryGeneration: true,
        scoring: true,
        recommendations: true,
        dataProcessing: true,
        utilities: true,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
const orchestrator = new AssessmentOrchestrator();

// Export main functions (backward compatibility)
module.exports = {
  // Primary assessment operations
  startAssessment: (data) => orchestrator.startAssessment(data),
  processResponseAndContinue: (sessionId, responseData) => 
    orchestrator.processResponseAndContinue(sessionId, responseData),
  completeAssessment: (sessionId, reason) => 
    orchestrator.completeAssessment(sessionId, reason),
  generateAssessmentSummary: (sessionId, state) => 
    orchestrator.generateAssessmentSummary(sessionId, state),
  
  // Scoring and analysis functions
  calculateOverallRiskScore: (responses) => 
    orchestrator.calculateOverallRiskScore(responses),
  generateDomainScores: (state, riskScore) => 
    orchestrator.generateDomainScores(state, riskScore),
  compileKeyFindings: (responses) => 
    orchestrator.compileKeyFindings(responses),
  
  // Recommendation functions
  generateRecommendations: (overallRisk, domainScores, state) => 
    orchestrator.generateRecommendations(overallRisk, domainScores, state),
  generateFollowUpSchedule: (riskScore, assessmentType) => 
    orchestrator.generateFollowUpSchedule(riskScore, assessmentType),
  
  // Data processing functions
  generateChartsData: (state) => 
    orchestrator.generateChartsData(state),
  calculateProgress: (state, metadata) => 
    orchestrator.calculateProgress(state, metadata),
  
  // Utility functions
  assessmentShouldContinue: (state, lastResponse) => 
    orchestrator.assessmentShouldContinue(state, lastResponse),
  validateAssessmentData: (data) => 
    orchestrator.validateAssessmentData(data),
  generateSessionId: () => 
    orchestrator.generateSessionId(),
  
  // Status and info
  getStatus: () => orchestrator.getStatus(),
  
  // Direct access to orchestrator instance
  orchestrator,
}; 