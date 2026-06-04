/**
 * Configuration Index
 * Central export point for all configuration modules
 */

// Import configuration modules
const constants = require('./constants');
const aiConfig = require('./ai-config');
const memoryConfig = require('./memory-config');

/**
 * Validate overall environment configuration
 * @returns {Object} - Validation result
 */
function validateEnvironment() {
  const errors = [];
  
  try {
    // Validate AI configuration
    aiConfig.aiConfig.loadConfiguration().validateEnvironment();
  } catch (error) {
    errors.push(error.message);
  }
  
  // Add any other environment validations here
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  // Configuration modules
  constants,
  aiConfig,
  memoryConfig,
  
  // Re-export key functions for convenience
  getLLMInstance: aiConfig.getLLMInstance,
  validateEnvironment,
  getMemoryCleanupInterval: memoryConfig.getMemoryCleanupInterval,
  getSessionTimeout: memoryConfig.getSessionTimeout,
  getMaxSessions: memoryConfig.getMaxSessions,
}; 