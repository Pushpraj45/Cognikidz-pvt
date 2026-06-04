/**
 * Domain-specific scoring utilities
 * Generates disorder-specific domain scores based on assessment type and risk
 */

/**
 * Generate domain scores based on assessment type and risk score
 * @param {Object} state - Assessment state
 * @param {number} riskScore - Risk score (1-10)
 * @returns {Array} - Domain scores
 */
function generateDomainScores(state, riskScore = null) {
  const assessmentType = state.assessmentType.toLowerCase();
  const scoreToUse = riskScore || 5; // Default to moderate score

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

module.exports = {
  generateDomainScores,
}; 