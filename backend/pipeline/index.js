/**
 * Cognikidz Assessment Pipeline - Main Entry Point
 * 
 * This is the primary interface for the assessment pipeline, providing a clean,
 * unified API that abstracts the underlying modular architecture.
 * 
 * Usage:
 *   const pipeline = require('./pipeline');
 *   const result = await pipeline.startAssessment(data);
 */

// Import all major components
const core = require('./core');
const config = require('./config');
const memory = require('./memory');
const prompts = require('./prompts');
const resources = require('./resources');
const utils = require('./utils');

// Import state management
const AssessmentState = require('./state');

/**
 * Main Pipeline API
 * Provides the primary interface for assessment operations
 */
class AssessmentPipeline {
  constructor() {
    this.version = '2.0.0';
    this.initialized = false;
  }

  /**
   * Initialize the pipeline (optional - auto-initializes on first use)
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(options = {}) {
    try {
      // Validate environment configuration
      const configValidation = config.validateEnvironment();
      if (!configValidation.isValid) {
        throw new Error(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
      }

      // Initialize memory management
      memory.initializeMemoryManagement();

      this.initialized = true;
      console.log('🚀 Assessment Pipeline initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Pipeline initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Start a new assessment
   * @param {Object} data - Assessment initialization data
   * @returns {Promise<Object>} - Assessment start result
   */
  async startAssessment(data) {
    if (!this.initialized) {
      await this.initialize();
    }
    // Ensure language is properly passed through
    const assessmentData = {
      ...data,
      language: data.language || 'en'
    };
    return core.startAssessment(assessmentData);
  }

  /**
   * Process a response and continue assessment
   * @param {string} sessionId - Session identifier
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} - Next question or completion result
   */
  async processResponse(sessionId, responseData) {
    if (!this.initialized) {
      await this.initialize();
    }
    return core.processResponseAndContinue(sessionId, responseData);
  }

  /**
   * Complete an assessment
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} - Assessment completion result
   */
  async completeAssessment(sessionId) {
    if (!this.initialized) {
      await this.initialize();
    }
    return core.completeAssessment(sessionId);
  }

  /**
   * Generate assessment summary
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} - Assessment summary
   */
  async generateSummary(sessionId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Get the assessment state from session manager
    const { SessionManager } = require('./memory/session-manager');
    let state = SessionManager.getCachedState(sessionId);
    
    if (!state) {
      // Try to load from database if not in cache
      try {
        const AssessmentState = require('./state');
        const dbState = await AssessmentState.findOne({ sessionId });
        if (dbState) {
          state = dbState;
          // Cache the state for future use
          SessionManager.setCachedState(sessionId, state);
        }
      } catch (error) {
        console.warn('Could not load state from database:', error.message);
      }
    }
    
    // If still no state, throw an error
    if (!state) {
      throw new Error(`No assessment state found for session: ${sessionId}`);
    }
    
    return core.generateAssessmentSummary(sessionId, state);
  }

  /**
   * Get available assessment types
   * @returns {Array<string>} - Available assessment types
   */
  getAvailableAssessmentTypes() {
    return resources.getAvailableAssessmentTypes();
  }

  /**
   * Get assessment metadata
   * @param {string} assessmentType - Type of assessment
   * @returns {Object} - Assessment metadata
   */
  getAssessmentMetadata(assessmentType) {
    return resources.getAssessmentMetadata(assessmentType);
  }

  /**
   * Get age-appropriate assessments
   * @param {number} ageInMonths - Child's age in months
   * @returns {Array<string>} - Appropriate assessment types
   */
  getAgeAppropriateAssessments(ageInMonths) {
    return resources.getAgeAppropriateAssessments(ageInMonths);
  }

  /**
   * Get recommended assessment sequence
   * @param {number} ageInMonths - Child's age in months
   * @param {Array<string>} concerns - Array of concern areas
   * @returns {Array<string>} - Recommended assessment sequence
   */
  getRecommendedAssessmentSequence(ageInMonths, concerns = []) {
    return resources.getRecommendedAssessmentSequence(ageInMonths, concerns);
  }

  /**
   * Validate assessment data
   * @param {Object} data - Data to validate
   * @returns {Object} - Validation result
   */
  validateAssessmentData(data) {
    return core.orchestrator.validateAssessmentData(data);
  }

  /**
   * Get pipeline status and health
   * @returns {Object} - Pipeline status
   */
  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      modules: {
        core: !!core,
        config: !!config,
        memory: !!memory,
        prompts: !!prompts,
        resources: !!resources,
        utils: !!utils,
      },
      memoryStatus: memory.getMemoryStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      await memory.cleanupAllSessions();
      this.initialized = false;
      console.log('🧹 Pipeline cleanup completed');
    } catch (error) {
      console.error('❌ Pipeline cleanup failed:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const pipeline = new AssessmentPipeline();

// Export main API (recommended usage)
module.exports = {
  // Primary pipeline interface
  startAssessment: (data, language) => pipeline.startAssessment(data, language),
  processResponse: (sessionId, responseData) => pipeline.processResponse(sessionId, responseData),
  completeAssessment: (sessionId) => pipeline.completeAssessment(sessionId),
  generateSummary: (sessionId) => pipeline.generateSummary(sessionId),
  
  // Assessment discovery and metadata
  getAvailableAssessmentTypes: () => pipeline.getAvailableAssessmentTypes(),
  getAssessmentMetadata: (type) => pipeline.getAssessmentMetadata(type),
  getAgeAppropriateAssessments: (age) => pipeline.getAgeAppropriateAssessments(age),
  getRecommendedAssessmentSequence: (age, concerns) => pipeline.getRecommendedAssessmentSequence(age, concerns),
  
  // Validation and utilities
  validateAssessmentData: (data) => pipeline.validateAssessmentData(data),
  getStatus: () => pipeline.getStatus(),
  
  // Lifecycle management
  initialize: (options) => pipeline.initialize(options),
  cleanup: () => pipeline.cleanup(),
  
  // Direct module access (for advanced usage)
  modules: {
    core,
    config,
    memory,
    prompts,
    resources,
    utils,
  },
  
  // Backward compatibility exports
  AssessmentState,
  
  // Pipeline instance (for advanced usage)
  pipeline,
  
  // Version info
  version: pipeline.version,
};

// Backward compatibility - export functions that match original graph.js interface
module.exports.startAssessment = module.exports.startAssessment;
module.exports.processResponse = module.exports.processResponse;
module.exports.generateSummary = module.exports.generateSummary; 