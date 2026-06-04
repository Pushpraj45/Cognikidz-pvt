/**
 * Recommendations generation engine
 * Creates actionable recommendations based on assessment results
 */

/**
 * Generate recommendations based on assessment results
 * @param {Object} overallRisk - Overall risk assessment
 * @param {Object} domainScores - Domain-specific scores
 * @param {Object} state - Assessment state
 * @returns {Array} - Recommendations
 */
function generateRecommendations(overallRisk, domainScores, state) {
  const recommendations = [];
  
  // Risk-based recommendations
  if (overallRisk.level === 'high') {
    recommendations.push({
      type: 'urgent',
      text: 'Professional evaluation recommended within 1-2 weeks',
      priority: 'high',
    });
  } else if (overallRisk.level === 'medium') {
    recommendations.push({
      type: 'follow-up',
      text: 'Consider professional consultation within 1-2 months',
      priority: 'medium',
    });
  }
  
  // Domain-specific recommendations
  if (Array.isArray(domainScores)) {
    domainScores.forEach(domain => {
      if (domain.score > 7) {
        recommendations.push({
          type: 'domain-specific',
          text: `Focus on ${domain.domain} development and support`,
          priority: 'medium',
          domain: domain.domain,
        });
      }
    });
  }
  
  // General recommendations
  recommendations.push({
    type: 'general',
    text: 'Continue monitoring development and maintain regular pediatric check-ups',
    priority: 'low',
  });
  
  return recommendations;
}

module.exports = {
  generateRecommendations,
}; 