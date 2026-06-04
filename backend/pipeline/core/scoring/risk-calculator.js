/**
 * Risk calculation and assessment utilities
 * Handles overall risk scoring based on assessment responses
 */

/**
 * Calculate overall risk score from all responses
 * @param {Array} responses - All assessment responses
 * @returns {Object} - Overall risk assessment
 */
function calculateOverallRiskScore(responses) {
  if (!responses || responses.length === 0) {
    return { score: 0, level: "unknown", confidence: 0 };
  }

  const scores = responses
    .map((r) => r.riskIndicators?.riskScore || 0)
    .filter((score) => score > 0);

  if (scores.length === 0) {
    return { score: 0, level: "low", confidence: 0 };
  }

  // Calculate weighted average (recent responses weighted more)
  let weightedSum = 0;
  let totalWeight = 0;

  scores.forEach((score, index) => {
    const weight = 1 + (index / scores.length) * 0.5; // Recent responses get higher weight
    weightedSum += score * weight;
    totalWeight += weight;
  });

  const averageScore = weightedSum / totalWeight;
  const confidence = Math.min(scores.length / 5, 1); // Higher confidence with more responses

  // Scale the score from 0-1 to 1-10 for consistency with test expectations
  const scaledScore = Math.round(averageScore * 10);

  return {
    score: scaledScore,
    level: scaledScore > 7 ? "high" : scaledScore > 4 ? "medium" : "low",
    confidence,
    responseCount: responses.length,
  };
}

/**
 * Calculate average confidence across responses
 * @param {Array} responses - Assessment responses
 * @returns {number} - Average confidence score
 */
function calculateAverageConfidence(responses) {
  if (!responses || responses.length === 0) return 0;

  const confidenceScores = responses
    .map((r) => r.evaluation?.confidence || 0)
    .filter((score) => score > 0);

  if (confidenceScores.length === 0) return 0;

  return (
    confidenceScores.reduce((sum, score) => sum + score, 0) /
    confidenceScores.length
  );
}

module.exports = {
  calculateOverallRiskScore,
  calculateAverageConfidence,
};
