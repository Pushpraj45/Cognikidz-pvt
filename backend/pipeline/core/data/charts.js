/**
 * Chart data generation utilities
 * Creates visualization-ready data from assessment results
 */

/**
 * Generate charts data for visualization
 * @param {Object} state - Assessment state
 * @returns {Object} - Charts data
 */
function generateChartsData(state) {
  // Calculate ability score with fallback
  const abilityScore = state.abilityEstimate 
    ? Math.min(10, Math.max(1, Math.round(Math.abs(state.abilityEstimate) * 2.5) + 1))
    : 5; // Default fallback

  // Generate timeline data (progress over questions)
  const timelineData = state.responses?.map((response, index) => ({
    question: index + 1,
    confidence: Math.max(
      1,
      Math.min(10, abilityScore + Math.floor(Math.random() * 4) - 2)
    ),
    difficulty: state.questions?.[index]?.difficulty || 3,
  })) || [];

  // Generate risk distribution data
  const riskDistribution = [
    {
      category: "Low Risk",
      value: abilityScore <= 3 ? 100 : 0,
      color: "#10b981",
    },
    {
      category: "Moderate Risk",
      value: abilityScore > 3 && abilityScore <= 7 ? 100 : 0,
      color: "#f59e0b",
    },
    {
      category: "High Risk",
      value: abilityScore > 7 ? 100 : 0,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  return {
    timeline: timelineData,
    riskDistribution,
    overallScore: abilityScore,
    completionRate: state.questions?.length 
      ? (state.responses.length / state.questions.length) * 100 
      : 100, // If no questions tracked, assume 100% completion
  };
}

module.exports = {
  generateChartsData,
}; 