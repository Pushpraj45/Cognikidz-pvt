/**
 * Key findings compilation utilities
 * Extracts and organizes key insights from assessment responses
 */

/**
 * Compile key findings from responses
 * @param {Array} responses - Assessment responses
 * @returns {Object} - Key findings
 */
function compileKeyFindings(responses) {
  const concerns = [];
  const strengths = [];
  const redFlags = [];
  
  responses.forEach(response => {
    if (response.evaluation?.concerns) {
      concerns.push(...response.evaluation.concerns);
    }
    if (response.evaluation?.strengths) {
      strengths.push(...response.evaluation.strengths);
    }
    if (response.evaluation?.redFlags) {
      redFlags.push(...response.evaluation.redFlags);
    }
  });
  
  return {
    concerns: [...new Set(concerns)], // Remove duplicates
    strengths: [...new Set(strengths)],
    redFlags: [...new Set(redFlags)],
    totalResponses: responses.length,
  };
}

module.exports = {
  compileKeyFindings,
}; 