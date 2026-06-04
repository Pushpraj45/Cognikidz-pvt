/**
 * Shared domain mapping constants for consistency across frontend and backend
 * This ensures that domain names are consistently mapped throughout the application
 */

// Standardized domain mapping that matches backend calculations
export const DOMAIN_NAME_MAP = {
  // Backend calculation names (as keys) -> Frontend display names (as values)
  behavior_patterns: 'Behavioral Regulation',
  behaviorpatterns: 'Behavioral Regulation',
  'behavioral regulation': 'Behavioral Regulation',
  behavioral: 'Behavioral Regulation',

  communication: 'Communication',

  sensory_response: 'Sensory Processing',
  sensoryresponse: 'Sensory Processing',
  'sensory processing': 'Sensory Processing',
  sensory: 'Sensory Processing',

  social_interaction: 'Social Communication',
  socialinteraction: 'Social Communication',
  'social communication': 'Social Communication',
  social: 'Social Communication',

  attention: 'Attention',
  hyperactivity: 'Hyperactivity',
  executive_function: 'Executive Function',
  'executive function': 'Executive Function',
  executive: 'Executive Function',

  reading_fluency: 'Reading Fluency',
  'reading fluency': 'Reading Fluency',
  phonological_awareness: 'Phonological Awareness',
  'phonological awareness': 'Phonological Awareness',
  written_expression: 'Written Expression',
  'written expression': 'Written Expression',

  // Legacy/fallback mappings
  general: 'General Development',
  cognitive: 'Cognitive Development',
  emotional: 'Emotional Regulation',
  academic: 'Academic Readiness',
};

// Function to normalize domain names consistently
export const normalizeDomainName = domainName => {
  if (!domainName) return 'General Development';

  // Clean the domain name (lowercase, remove special chars)
  const cleanDomainName = domainName
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim();

  // Try exact match first
  if (DOMAIN_NAME_MAP[cleanDomainName]) {
    return DOMAIN_NAME_MAP[cleanDomainName];
  }

  // Try partial matches for compound names
  for (const [key, value] of Object.entries(DOMAIN_NAME_MAP)) {
    if (
      cleanDomainName.includes(key.replace(/[^a-z\s]/g, '')) ||
      key.replace(/[^a-z\s]/g, '').includes(cleanDomainName)
    ) {
      return value;
    }
  }

  // Fallback: Format the original name properly
  return domainName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
};

// Enhanced color schemes for consistent visualization
export const DOMAIN_COLORS = {
  // Standardized domain names
  'Behavioral Regulation': '#F59E0B', // Amber
  Communication: '#06B6D4', // Cyan
  'Sensory Processing': '#8B5CF6', // Violet
  'Social Communication': '#EC4899', // Pink

  // ADHD Assessment domains
  Attention: '#EF4444', // Red
  Hyperactivity: '#F97316', // Orange
  'Executive Function': '#8B5CF6', // Violet

  // Dyslexia Assessment domains
  'Reading Fluency': '#10B981', // Emerald
  'Phonological Awareness': '#3B82F6', // Blue
  'Written Expression': '#84CC16', // Lime

  // General Assessment domains
  'Cognitive Development': '#6366F1', // Indigo
  'Emotional Regulation': '#F59E0B', // Amber
  'Academic Readiness': '#14B8A6', // Teal
  'General Development': '#6B7280', // Gray

  // Legacy/fallback domains
  memory: '#10B981', // Emerald
  processing: '#F59E0B', // Amber
  language: '#06B6D4', // Cyan
  motor: '#84CC16', // Lime
};

export const DARK_DOMAIN_COLORS = {
  // Standardized domain names
  'Behavioral Regulation': '#FBBF24', // Light Amber
  Communication: '#22D3EE', // Light Cyan
  'Sensory Processing': '#A78BFA', // Light Violet
  'Social Communication': '#F472B6', // Light Pink

  // ADHD Assessment domains
  Attention: '#F87171', // Light Red
  Hyperactivity: '#FB923C', // Light Orange
  'Executive Function': '#A78BFA', // Light Violet

  // Dyslexia Assessment domains
  'Reading Fluency': '#34D399', // Light Emerald
  'Phonological Awareness': '#60A5FA', // Light Blue
  'Written Expression': '#A3E635', // Light Lime

  // General Assessment domains
  'Cognitive Development': '#818CF8', // Light Indigo
  'Emotional Regulation': '#FBBF24', // Light Amber
  'Academic Readiness': '#2DD4BF', // Light Teal
  'General Development': '#9CA3AF', // Light Gray

  // Legacy/fallback domains
  memory: '#34D399', // Light Emerald
  processing: '#FBBF24', // Light Amber
  language: '#22D3EE', // Light Cyan
  motor: '#A3E635', // Light Lime
};

// Utility function to get appropriate color for a domain
export const getDomainColor = (domainName, isDarkMode = false) => {
  const normalizedName = normalizeDomainName(domainName);
  const colorMap = isDarkMode ? DARK_DOMAIN_COLORS : DOMAIN_COLORS;
  return colorMap[normalizedName] || (isDarkMode ? '#9CA3AF' : '#6B7280');
};

// Utility function to validate and normalize domain scores
export const normalizeDomainScore = score => {
  if (typeof score === 'string') {
    const parsed = parseFloat(score);
    return isNaN(parsed) ? 0 : Math.round(Math.max(0, Math.min(100, parsed)));
  }
  if (typeof score === 'number') {
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  return 0;
};

// Utility function to process domain data consistently
export const processDomainData = domainsObject => {
  if (!domainsObject || typeof domainsObject !== 'object') {
    return [];
  }

  return Object.entries(domainsObject)
    .map(([domain, value]) => ({
      domain: normalizeDomainName(domain),
      value: normalizeDomainScore(value),
      originalDomain: domain,
      originalValue: value,
    }))
    .filter(item => item.value > 0); // Filter out zero values
};

// Utility functions for consistent assessment display and calculations

/**
 * Convert risk score (1-10) to display text
 * @param {number} score - Risk score from 1-10
 * @returns {string} Risk level text
 */
export const getRiskLevelText = score => {
  if (!score || isNaN(score)) return 'Assessment Complete';
  if (score <= 3) return 'Low Risk';
  if (score <= 7) return 'Moderate Risk';
  return 'High Risk';
};

/**
 * Convert risk score to color class
 * @param {number} score - Risk score from 1-10
 * @returns {string} CSS color class
 */
export const getRiskLevelColor = score => {
  if (!score || isNaN(score)) return 'text-blue-600';
  if (score <= 3) return 'text-green-600';
  if (score <= 7) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Convert risk score to background color class
 * @param {number} score - Risk score from 1-10
 * @returns {string} CSS background color class
 */
export const getRiskLevelBgColor = score => {
  if (!score || isNaN(score)) return 'bg-blue-100';
  if (score <= 3) return 'bg-green-100';
  if (score <= 7) return 'bg-yellow-100';
  return 'bg-red-100';
};

/**
 * Validate that overall accuracy and risk level are consistent
 * @param {number} accuracyRate - Accuracy percentage (0-100)
 * @param {number} riskScore - Risk score (1-10)
 * @returns {object} Validation result with corrected values if needed
 */
export const validateRiskConsistency = (accuracyRate, riskScore) => {
  // Calculate expected risk score based on accuracy
  let expectedRiskScore = 2; // Default low risk
  if (accuracyRate < 50) {
    expectedRiskScore = 8; // High risk
  } else if (accuracyRate < 70) {
    expectedRiskScore = 5; // Moderate risk
  }

  const isConsistent = Math.abs(riskScore - expectedRiskScore) <= 1;

  return {
    isConsistent,
    correctedRiskScore: isConsistent ? riskScore : expectedRiskScore,
    expectedRiskScore,
    actualRiskScore: riskScore,
    warning: !isConsistent
      ? `Risk score (${riskScore}) inconsistent with accuracy (${accuracyRate}%). Expected: ${expectedRiskScore}`
      : null,
  };
};

/**
 * Format domain scores for consistent display
 * @param {Array} domainScores - Array of domain score objects
 * @returns {Array} Formatted domain scores
 */
export const formatDomainScores = domainScores => {
  if (!domainScores || !Array.isArray(domainScores)) return [];

  return domainScores.map(domain => ({
    domain: domain.domain || 'Unknown Domain',
    score: Math.max(0, Math.min(100, domain.score || 0)), // Ensure 0-100 range
    accuracy: domain.accuracy || domain.score || 0,
    correct: domain.correct || 0,
    total: domain.total || 0,
    description: domain.description || `${domain.correct || 0}/${domain.total || 0} correct`,
  }));
};

/**
 * Generate dynamic strengths based on assessment data
 * @param {Object} assessmentData - Assessment results data
 * @returns {Array} Array of strength statements
 */
export const generateDynamicStrengths = assessmentData => {
  const strengths = [];
  const { accuracyRate, domainScores, avgResponseTime, totalQuestions } = assessmentData;

  // Always include completion
  strengths.push(`Successfully completed all ${totalQuestions || 'assessment'} questions`);

  // Accuracy-based strengths
  if (accuracyRate >= 80) {
    strengths.push('Demonstrated strong visual processing and attention abilities');
  } else if (accuracyRate >= 60) {
    strengths.push('Showed good visual attention and engagement throughout assessment');
  } else if (accuracyRate >= 40) {
    strengths.push('Maintained focus and effort throughout the assessment despite challenges');
  } else {
    strengths.push('Demonstrated persistence and engagement with challenging visual tasks');
  }

  // Response time strengths
  if (avgResponseTime && avgResponseTime < 5000) {
    strengths.push('Efficient decision-making and response times during visual tasks');
  } else if (avgResponseTime && avgResponseTime < 10000) {
    strengths.push('Thoughtful consideration of visual stimuli before responding');
  }

  // Domain-specific strengths
  if (domainScores && Array.isArray(domainScores)) {
    const strongDomains = domainScores.filter(d => d.accuracy >= 60);
    if (strongDomains.length > 0) {
      const domainNames = strongDomains.map(d => d.domain).join(', ');
      strengths.push(`Particular strengths observed in: ${domainNames}`);
    }

    // Check for consistency
    const consistentPerformance = domainScores.every(
      d => Math.abs(d.accuracy - accuracyRate) <= 20
    );
    if (consistentPerformance) {
      strengths.push('Consistent performance across different types of visual tasks');
    }
  }

  return strengths;
};

/**
 * Generate dynamic concerns based on assessment data
 * @param {Object} assessmentData - Assessment results data
 * @returns {Array} Array of concern statements
 */
export const generateDynamicConcerns = assessmentData => {
  const concerns = [];
  const { accuracyRate, domainScores, avgResponseTime } = assessmentData;

  // Accuracy-based concerns
  if (accuracyRate < 40) {
    concerns.push(
      'Significant challenges with visual attention and processing tasks requiring targeted support'
    );
  } else if (accuracyRate < 60) {
    concerns.push('Some difficulties with complex visual processing and attention tasks');
  }

  // Response time concerns
  if (avgResponseTime && avgResponseTime > 15000) {
    concerns.push(
      'Extended processing time suggesting possible attention or decision-making challenges'
    );
  } else if (avgResponseTime && avgResponseTime > 10000) {
    concerns.push('Longer response times may indicate need for additional processing support');
  }

  // Domain-specific concerns
  if (domainScores && Array.isArray(domainScores)) {
    const weakDomains = domainScores.filter(d => d.accuracy < 50);
    if (weakDomains.length > 0) {
      const domainNames = weakDomains.map(d => d.domain).join(', ');
      concerns.push(`Areas requiring focused attention and support: ${domainNames}`);
    }

    // Check for significant variability
    const scores = domainScores.map(d => d.accuracy);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    if (maxScore - minScore > 40) {
      concerns.push('Variable performance across domains suggesting uneven skill development');
    }
  }

  // If no specific concerns, provide general monitoring advice
  if (concerns.length === 0) {
    concerns.push('Continue monitoring developmental progress in assessed areas');
  }

  return concerns;
};

/**
 * Generate dynamic recommendations based on assessment data
 * @param {Object} assessmentData - Assessment results data
 * @param {Array} baseRecommendations - Original recommendations
 * @returns {Array} Array of recommendation statements
 */
export const generateDynamicRecommendations = (assessmentData, baseRecommendations = []) => {
  const recommendations = [...baseRecommendations];
  const { riskScore, domainScores, accuracyRate, assessmentType } = assessmentData;

  // Domain-specific recommendations
  if (domainScores && Array.isArray(domainScores)) {
    domainScores.forEach(domain => {
      if (domain.accuracy < 50) {
        const domainName = domain.domain.toLowerCase();
        if (domainName.includes('social')) {
          recommendations.push(
            'Consider social skills training and structured peer interaction opportunities'
          );
        } else if (domainName.includes('communication')) {
          recommendations.push(
            'Support communication development through visual and interactive activities'
          );
        } else if (domainName.includes('sensory')) {
          recommendations.push(
            'Explore sensory processing support and environmental accommodations'
          );
        } else if (domainName.includes('behavior')) {
          recommendations.push(
            'Implement behavioral regulation strategies and predictable routines'
          );
        } else if (domainName.includes('attention')) {
          recommendations.push('Provide attention support strategies and shorter task segments');
        }
      }
    });
  }

  // Assessment-type specific recommendations
  if (assessmentType === 'autism' && accuracyRate < 60) {
    recommendations.push('Consider visual supports and structured learning environments');
    recommendations.push('Explore autism-specific intervention approaches (ABA, TEACCH, etc.)');
  } else if (assessmentType === 'adhd' && accuracyRate < 60) {
    recommendations.push('Implement attention and focus support strategies');
    recommendations.push('Consider environmental modifications to reduce distractions');
  }

  // Accuracy-based recommendations
  if (accuracyRate < 50) {
    recommendations.push(
      'Provide additional visual processing support and break down complex tasks'
    );
  }

  return [...new Set(recommendations)]; // Remove duplicates
};

/**
 * Enhanced risk level conversion with proper text mapping
 * @param {number} score - Risk score from 1-10
 * @returns {string} Risk level text with proper capitalization
 */
export const getRiskLevelTextEnhanced = score => {
  if (!score || isNaN(score)) return 'Assessment Complete';
  if (score <= 3) return 'Low Risk';
  if (score <= 7) return 'Moderate Risk';
  return 'High Risk';
};

/**
 * Get risk level from accuracy rate (for consistency checks)
 * @param {number} accuracyRate - Accuracy percentage (0-100)
 * @returns {object} Risk information
 */
export const getRiskLevelFromAccuracy = accuracyRate => {
  let riskScore = 2;
  let riskLevel = 'Low Risk';

  if (accuracyRate < 50) {
    riskScore = 8;
    riskLevel = 'High Risk';
  } else if (accuracyRate < 70) {
    riskScore = 5;
    riskLevel = 'Moderate Risk';
  }

  return {
    score: riskScore,
    level: riskLevel,
    text: riskLevel,
  };
};

/**
 * Fix gender pronoun consistency in assessment text
 * @param {string} text - Assessment text that may contain gender inconsistencies
 * @param {string} childName - Child's name
 * @param {string} gender - Child's gender ('male', 'female', or other)
 * @returns {string} Text with consistent gender pronouns
 */
export const fixGenderConsistency = (text, childName, gender) => {
  if (!text || !childName) return text;

  const pronouns = {
    male: { subject: 'he', object: 'him', possessive: 'his' },
    female: { subject: 'she', object: 'her', possessive: 'her' },
    other: { subject: 'they', object: 'them', possessive: 'their' },
  };

  const genderPronouns = pronouns[gender?.toLowerCase()] || pronouns.other;

  // Replace inconsistent pronouns
  const fixedText = text
    .replace(/\b(he|she|they)\b/gi, genderPronouns.subject)
    .replace(/\b(him|her|them)\b/gi, genderPronouns.object)
    .replace(/\b(his|her|their)\b/gi, genderPronouns.possessive)
    // Fix specific pattern mentioned in the issue: "her preferences" then "Raju's ability"
    .replace(/\b(her|his|their) preferences/gi, `${genderPronouns.possessive} preferences`)
    .replace(/\b(her|his|their) ability/gi, `${genderPronouns.possessive} ability`);

  return fixedText;
};

/**
 * Validate and fix assessment report for common issues
 * @param {Object} report - Assessment report object
 * @returns {Object} Fixed assessment report
 */
export const validateAndFixAssessmentReport = report => {
  const fixedReport = { ...report };

  // Fix risk level consistency
  if (report.accuracyRate && report.riskScore) {
    const consistencyCheck = validateRiskConsistency(report.accuracyRate, report.riskScore);
    if (!consistencyCheck.isConsistent) {
      console.warn('Risk consistency issue detected:', consistencyCheck.warning);
      fixedReport.riskScore = consistencyCheck.correctedRiskScore;
      fixedReport.riskLevel = getRiskLevelTextEnhanced(consistencyCheck.correctedRiskScore);
    }
  }

  // Fix gender consistency in summary
  if (report.summary && report.childName && report.childGender) {
    fixedReport.summary = fixGenderConsistency(
      report.summary,
      report.childName,
      report.childGender
    );
  }

  // Ensure domain scores are properly formatted
  if (report.domainScores) {
    fixedReport.domainScores = formatDomainScores(report.domainScores);
  }

  return fixedReport;
};
