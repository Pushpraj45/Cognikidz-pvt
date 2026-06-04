/**
 * Assessment validation utilities
 * Handles validation of assessment data and parameters
 */

const { 
  validateSessionId, 
  validateAssessmentType, 
  validateFormData 
} = require('../../utils/validators');

/**
 * Validate assessment initialization data
 * @param {Object} data - Assessment data to validate
 * @returns {Object} - Validation result
 */
function validateAssessmentData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Assessment data is required');
    return { isValid: false, errors };
  }
  
  if (!validateAssessmentType(data.assessmentType)) {
    errors.push('Valid assessment type is required');
  }
  
  if (!validateFormData(data.formData)) {
    errors.push('Valid form data is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateAssessmentData,
}; 