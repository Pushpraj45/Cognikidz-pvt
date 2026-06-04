/**
 * Resources Index
 * Central export point for all assessment resources
 */

// Import the tool selector (main interface)
const toolSelector = require('./tool-selector');

// Import individual tool modules for direct access
const autismTools = require('./assessment-tools/autism-tools');
const adhdTools = require('./assessment-tools/adhd-tools');
const dyslexiaTools = require('./assessment-tools/dyslexia-tools');

// Export everything through the tool selector interface
module.exports = {
  // Main tool selector interface (recommended)
  toolSelector,
  
  // Direct access to individual tool modules (for backward compatibility)
  autismTools,
  adhdTools,
  dyslexiaTools,
  
  // Re-export key functions from tool selector for convenience
  getScreeningTool: toolSelector.getScreeningTool,
  getAgeFocusAreas: toolSelector.getAgeFocusAreas,
  getAvailableQuestionDomains: toolSelector.getAvailableQuestionDomains,
  getAvailableAssessmentTypes: toolSelector.getAvailableAssessmentTypes,
  getAssessmentMetadata: toolSelector.getAssessmentMetadata,
  isValidAssessmentType: toolSelector.isValidAssessmentType,
  getAgeAppropriateAssessments: toolSelector.getAgeAppropriateAssessments,
  getRecommendedAssessmentSequence: toolSelector.getRecommendedAssessmentSequence,
  getAllToolInformation: toolSelector.getAllToolInformation
}; 