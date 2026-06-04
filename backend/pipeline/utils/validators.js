/**
 * Validation Utilities
 * Functions for validating input data and assessment parameters
 */

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} - True if valid
 */
function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== "string") return false;
  // Session ID should be alphanumeric and reasonable length
  return /^[a-zA-Z0-9_-]{8,64}$/.test(sessionId);
}

/**
 * Validate assessment type
 * @param {string} assessmentType - Assessment type to validate
 * @returns {boolean} - True if valid
 */
function validateAssessmentType(assessmentType) {
  if (!assessmentType || typeof assessmentType !== "string") return false;

  const validTypes = ["autism", "asd", "adhd", "dyslexia", "general"];
  return validTypes.includes(assessmentType.toLowerCase());
}

/**
 * Validate child age
 * @param {number|string} age - Age to validate
 * @returns {boolean} - True if valid
 */
function validateChildAge(age) {
  // Handle null, undefined, or empty values
  if (age === null || age === undefined || age === "") {
    return false;
  }

  const numAge = Number(age);

  // Check if it's a valid number
  if (isNaN(numAge)) {
    return false;
  }

  // Check if age is within reasonable bounds (0.5 to 18 years)
  return numAge >= 0.5 && numAge <= 18;
}

/**
 * Validate difficulty level
 * @param {number|string} difficulty - Difficulty level to validate
 * @returns {boolean} - True if valid
 */
function validateDifficulty(difficulty) {
  const numDifficulty = Number(difficulty);
  return !isNaN(numDifficulty) && numDifficulty >= 1 && numDifficulty <= 5;
}

/**
 * Validate ability estimate
 * @param {number|string} abilityEstimate - Ability estimate to validate
 * @returns {boolean} - True if valid
 */
function validateAbilityEstimate(abilityEstimate) {
  const numEstimate = Number(abilityEstimate);
  return !isNaN(numEstimate) && numEstimate >= -3 && numEstimate <= 3;
}

/**
 * Validate risk score
 * @param {number|string} riskScore - Risk score to validate
 * @returns {boolean} - True if valid
 */
function validateRiskScore(riskScore) {
  const numScore = Number(riskScore);
  return !isNaN(numScore) && numScore >= 1 && numScore <= 10;
}

/**
 * Validate question object structure
 * @param {Object} question - Question object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateQuestion(question) {
  const errors = [];

  if (!question || typeof question !== "object") {
    return { isValid: false, errors: ["Question must be an object"] };
  }

  // Required fields
  if (!question.id || typeof question.id !== "string") {
    errors.push("Question must have a valid id");
  }

  if (!question.prompt || typeof question.prompt !== "string") {
    errors.push("Question must have a valid prompt");
  }

  if (!question.type || typeof question.type !== "string") {
    errors.push("Question must have a valid type");
  }

  if (!Array.isArray(question.options) || question.options.length === 0) {
    errors.push("Question must have valid options array");
  }

  if (!validateDifficulty(question.difficulty)) {
    errors.push("Question must have valid difficulty (1-5)");
  }

  if (!question.disorder || typeof question.disorder !== "string") {
    errors.push("Question must have a valid disorder");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate response object structure
 * @param {Object} response - Response object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateResponse(response) {
  const errors = [];

  if (!response || typeof response !== "object") {
    return { isValid: false, errors: ["Response must be an object"] };
  }

  // Required fields
  if (!response.questionId || typeof response.questionId !== "string") {
    errors.push("Response must have a valid questionId");
  }

  if (response.answer === undefined || response.answer === null) {
    errors.push("Response must have an answer");
  }

  // Optional but validated if present
  if (response.score !== undefined && !validateRiskScore(response.score)) {
    errors.push("Response score must be between 1-10 if provided");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate form data structure
 * @param {Object} formData - Form data object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateFormData(formData) {
  const errors = [];

  if (!formData || typeof formData !== "object") {
    return { isValid: false, errors: ["Form data must be an object"] };
  }

  // Required fields
  if (!formData.childName || typeof formData.childName !== "string") {
    errors.push("Child name is required");
  }

  if (!validateChildAge(formData.age)) {
    errors.push("Valid child age (0.5-18 years) is required");
  }

  // Optional but validated if present
  if (formData.gender && typeof formData.gender !== "string") {
    errors.push("Gender must be a string if provided");
  }

  if (formData.grade && typeof formData.grade !== "string") {
    errors.push("Grade must be a string if provided");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate assessment state structure
 * @param {Object} state - Assessment state object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
function validateAssessmentState(state) {
  const errors = [];

  if (!state || typeof state !== "object") {
    return { isValid: false, errors: ["State must be an object"] };
  }

  // Required fields
  if (!validateSessionId(state.sessionId)) {
    errors.push("Valid session ID is required");
  }

  if (!validateAssessmentType(state.assessmentType)) {
    errors.push("Valid assessment type is required");
  }

  if (!validateAbilityEstimate(state.abilityEstimate)) {
    errors.push("Valid ability estimate (-3 to 3) is required");
  }

  if (!Array.isArray(state.questions)) {
    errors.push("Questions must be an array");
  }

  if (!Array.isArray(state.responses)) {
    errors.push("Responses must be an array");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize text input to prevent injection attacks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/['"]/g, "") // Remove quotes that could break JSON
    .replace(/\\/g, "") // Remove backslashes
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize user input
 * @param {Object} input - Input object to validate and sanitize
 * @returns {Object} - Sanitized input object
 */
function sanitizeInput(input) {
  if (!input || typeof input !== "object") return {};

  const sanitized = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === "number") {
      sanitized[key] = isNaN(value) ? 0 : value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  validateSessionId,
  validateAssessmentType,
  validateChildAge,
  validateDifficulty,
  validateAbilityEstimate,
  validateRiskScore,
  validateQuestion,
  validateResponse,
  validateFormData,
  validateAssessmentState,
  sanitizeText,
  sanitizeInput,
};
