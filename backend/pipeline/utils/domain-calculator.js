/**
 * Domain Calculator Utilities
 * Functions for calculating domain scores and follow-up schedules
 */

/**
 * Generate domain scores based on assessment data
 * @param {Object} state - Assessment state object
 * @param {number|null} riskScore - Optional risk score override
 * @returns {Array<Object>} - Array of domain score objects
 */
function generateDomainScores(state, riskScore = null) {
  const assessmentType = state.assessmentType.toLowerCase();
  const scoreToUse =
    riskScore ||
    Math.min(
      10,
      Math.max(1, Math.round(Math.abs(state.abilityEstimate) * 2.5) + 1)
    );

  // Generate domain scores based on assessment type
  const domainScores = [];

  if (assessmentType === "adhd") {
    domainScores.push(
      {
        domain: "Attention",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Ability to focus and sustain attention",
      },
      {
        domain: "Hyperactivity",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Activity level and impulse control",
      },
      {
        domain: "Executive Function",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Planning and organization skills",
      }
    );
  } else if (assessmentType === "autism" || assessmentType === "asd") {
    domainScores.push(
      {
        domain: "Social Communication",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Social interaction and communication skills",
      },
      {
        domain: "Restricted Interests",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Flexibility in interests and activities",
      },
      {
        domain: "Sensory Processing",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Response to sensory stimuli",
      }
    );
  } else if (assessmentType === "dyslexia") {
    domainScores.push(
      {
        domain: "Reading Fluency",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Reading speed and accuracy",
      },
      {
        domain: "Phonological Awareness",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Sound-letter relationships",
      },
      {
        domain: "Written Expression",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Writing and spelling abilities",
      }
    );
  } else {
    // General assessment - multiple domains
    domainScores.push(
      {
        domain: "Cognitive Development",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Overall cognitive functioning",
      },
      {
        domain: "Social Skills",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Peer interaction and social communication",
      },
      {
        domain: "Emotional Regulation",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Managing emotions and behavior",
      },
      {
        domain: "Academic Readiness",
        score: Math.max(
          1,
          Math.min(10, scoreToUse + Math.floor(Math.random() * 2) - 1)
        ),
        description: "Preparedness for learning tasks",
      }
    );
  }

  return domainScores;
}

/**
 * Generate follow-up schedule based on risk level
 * @param {number} riskScore - Risk score (1-10)
 * @param {string} assessmentType - Type of assessment
 * @returns {Object} - Follow-up schedule object
 */
function generateFollowUpSchedule(riskScore, assessmentType) {
  const currentDate = new Date();
  let followUpDate, focus, urgency, timeframe;

  if (riskScore >= 8) {
    // High risk - 1-2 months
    followUpDate = new Date(currentDate.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days (approx 1.5 months)
    focus = `Professional evaluation for ${assessmentType} recommended due to elevated risk indicators`;
    urgency = "high";
    timeframe = "1-2 months";
  } else if (riskScore >= 4) {
    // Moderate risk - 2-4 months
    followUpDate = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days (3 months)
    focus = `Professional consultation for ${assessmentType} monitoring and support`;
    urgency = "moderate";
    timeframe = "2-4 months";
  } else {
    // Low risk - 6 months screening
    followUpDate = new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days (6 months)
    focus = "Routine developmental screening and monitoring";
    urgency = "low";
    timeframe = "6 months";
  }

  return {
    recommendedDate: followUpDate.toISOString().split("T")[0],
    focus,
    urgency,
    timeframe,
    riskLevel:
      riskScore <= 3
        ? "Low Risk"
        : riskScore <= 7
          ? "Moderate Risk"
          : "High Risk",
  };
}

/**
 * Calculate overall risk score from domain scores
 * @param {Array<Object>} domainScores - Array of domain score objects
 * @returns {number} - Overall risk score (1-10)
 */
function calculateOverallRiskScore(domainScores) {
  if (!domainScores || domainScores.length === 0) return 1;
  
  const totalScore = domainScores.reduce((sum, domain) => sum + domain.score, 0);
  return Math.round(totalScore / domainScores.length);
}

/**
 * Get domain-specific recommendations based on scores
 * @param {Array<Object>} domainScores - Array of domain score objects
 * @param {string} assessmentType - Type of assessment
 * @returns {Array<string>} - Array of recommendations
 */
function getDomainRecommendations(domainScores, assessmentType) {
  const recommendations = [];
  const highRiskDomains = domainScores.filter(domain => domain.score >= 7);
  
  if (highRiskDomains.length === 0) {
    recommendations.push("Continue current developmental support and monitoring");
    return recommendations;
  }

  highRiskDomains.forEach(domain => {
    switch (domain.domain.toLowerCase()) {
      case "attention":
        recommendations.push("Consider attention-building activities and structured routines");
        break;
      case "hyperactivity":
        recommendations.push("Implement movement breaks and physical activity strategies");
        break;
      case "executive function":
        recommendations.push("Use visual schedules and organizational tools");
        break;
      case "social communication":
        recommendations.push("Practice social skills through structured play activities");
        break;
      case "restricted interests":
        recommendations.push("Gradually introduce new activities and interests");
        break;
      case "sensory processing":
        recommendations.push("Create sensory-friendly environments and coping strategies");
        break;
      case "reading fluency":
        recommendations.push("Implement daily reading practice with appropriate level texts");
        break;
      case "phonological awareness":
        recommendations.push("Use phonics-based reading programs and sound games");
        break;
      case "written expression":
        recommendations.push("Practice writing skills with assistive technology if needed");
        break;
      default:
        recommendations.push(`Focus on ${domain.domain.toLowerCase()} development activities`);
    }
  });

  return recommendations;
}

module.exports = {
  generateDomainScores,
  generateFollowUpSchedule,
  calculateOverallRiskScore,
  getDomainRecommendations
}; 