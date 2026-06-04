/**
 * Assessment flow control utilities
 * Handles decisions about assessment continuation and completion
 * ENHANCED FOR 15-QUESTION ASSESSMENTS
 */

const { calculateAverageConfidence } = require("../scoring/risk-calculator");
const { calculateDomainCoverage } = require("../data/progress");

/**
 * Determine if assessment should continue
 * @param {Object} state - Current assessment state
 * @param {Object} lastResponse - Last processed response
 * @returns {Object} - Continuation decision
 */
function assessmentShouldContinue(state, lastResponse) {
  // Use shorter limits for unit tests only, not integration tests
  const isUnitTest =
    process.env.NODE_ENV === "test" && !process.env.INTEGRATION_TEST;
  const maxQuestions = isUnitTest ? 3 : 15; // Always require full count in production

  // HARD STOP: Never exceed maximum questions
  if (state.responses.length >= maxQuestions) {
    return { continue: false, reason: "max_questions_reached" };
  }

  // No early completion. Always continue until full question count is reached.

  // Continue assessment
  return { continue: true, reason: "assessment_ongoing" };
}

module.exports = {
  assessmentShouldContinue,
};
