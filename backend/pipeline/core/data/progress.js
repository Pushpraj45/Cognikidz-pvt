/**
 * Progress calculation utilities
 * Handles assessment progress tracking and calculations
 */

const { getScreeningTool } = require("../../resources");

/**
 * Calculate assessment progress
 * @param {Object} state - Assessment state
 * @param {Object} metadata - Assessment metadata
 * @returns {Object} - Progress information
 */
function calculateProgress(state, metadata) {
  const estimatedQuestions = metadata?.estimatedQuestions || 15; // Updated to 15 for comprehensive assessments
  const currentQuestion = state.responses.length + 1;
  const percentComplete = Math.min(
    (currentQuestion / estimatedQuestions) * 100,
    100
  );

  return {
    currentQuestion,
    totalQuestions: estimatedQuestions,
    percentComplete: Math.round(percentComplete),
    questionsAnswered: state.responses.length,
  };
}

/**
 * Calculate domain coverage
 * @param {Object} state - Assessment state
 * @returns {number} - Domain coverage ratio (0-1)
 */
function calculateDomainCoverage(state) {
  const ageInMonths = (state.formData.childAge || 5) * 12;
  const screeningTool = getScreeningTool(state.assessmentType, ageInMonths);

  if (!screeningTool?.domains) return 1; // If no domains defined, assume full coverage

  const coveredDomains = new Set(
    state.responses.map((r) => r.evaluation?.domain).filter((domain) => domain)
  );

  return coveredDomains.size / screeningTool.domains.length;
}

module.exports = {
  calculateProgress,
  calculateDomainCoverage,
};
