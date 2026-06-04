/**
 * Frontend Domain Mapping System
 * Synchronized with backend unified domain mapping
 */

export const UNIFIED_DOMAIN_MAP = {
  // Text assessment domains (standard cognitive domains)
  attention: 'Attention',
  memory: 'Memory',
  processing: 'Processing Speed',
  executive: 'Executive Function',
  executivefunction: 'Executive Function',
  executive_function: 'Executive Function',
  sensory: 'Sensory Processing',
  sensoryprocessing: 'Sensory Processing',
  sensory_processing: 'Sensory Processing',
  hyperactivity: 'Hyperactivity',

  // Image assessment domains (condition-specific domains)
  social_interaction: 'Social Communication',
  socialinteraction: 'Social Communication',
  social_communication: 'Social Communication',
  socialcommunication: 'Social Communication',
  social: 'Social Communication',

  behavior_patterns: 'Behavioral Regulation',
  behaviorpatterns: 'Behavioral Regulation',
  behavioral_regulation: 'Behavioral Regulation',
  behavioralregulation: 'Behavioral Regulation',
  behavioral: 'Behavioral Regulation',

  sensory_response: 'Sensory Processing',
  sensoryresponse: 'Sensory Processing',

  communication: 'Communication',

  emotion_recognition: 'Emotional Recognition',
  emotionrecognition: 'Emotional Recognition',
  emotional_recognition: 'Emotional Recognition',
  emotionalrecognition: 'Emotional Recognition',

  social_attention: 'Social Attention',
  socialattention: 'Social Attention',

  // ADHD-specific domains
  impulsivity: 'Impulsivity',
  hyperactivity: 'Hyperactivity',

  // Dyslexia-specific domains
  reading_fluency: 'Reading Fluency',
  readingfluency: 'Reading Fluency',
  phonological_awareness: 'Phonological Awareness',
  phonologicalawareness: 'Phonological Awareness',
  written_expression: 'Written Expression',
  writtenexpression: 'Written Expression',

  // General/fallback domains
  general: 'General Development',
  cognitive: 'Cognitive Development',
  cognitivedevelopment: 'Cognitive Development',
  emotional: 'Emotional Regulation',
  emotionalregulation: 'Emotional Regulation',
  academic: 'Academic Readiness',
  academicreadiness: 'Academic Readiness',

  // Risk assessment domains
  overall: 'Overall Assessment',
  risk: 'Risk Assessment',
  disorderrisk: 'Disorder Risk',
};

/**
 * Normalize domain name using unified mapping
 * @param {string} domainName - Original domain name from any source
 * @returns {string} Normalized, display-ready domain name
 */
export function normalizeDomainName(domainName) {
  if (!domainName) return 'General Development';

  // Clean the domain name (lowercase, remove special chars, spaces)
  const cleanDomainName = domainName
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .trim();

  // Try exact match first
  if (UNIFIED_DOMAIN_MAP[cleanDomainName]) {
    return UNIFIED_DOMAIN_MAP[cleanDomainName];
  }

  // Try partial matches for compound names
  for (const [key, value] of Object.entries(UNIFIED_DOMAIN_MAP)) {
    const cleanKey = key.replace(/[^a-z]/g, '');
    if (cleanDomainName.includes(cleanKey) || cleanKey.includes(cleanDomainName)) {
      return value;
    }
  }

  // Fallback: Format the original name properly
  return domainName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle camelCase
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

/**
 * Check if a domain name represents a cognitive/developmental domain
 * @param {string} domainName - Domain name to check
 * @returns {boolean} True if it's a valid developmental domain
 */
export function isValidDevelopmentalDomain(domainName) {
  if (!domainName) return false;

  const normalizedName = normalizeDomainName(domainName);

  // Exclude risk-only domains from developmental tracking
  const riskOnlyDomains = ['Risk Assessment', 'Disorder Risk', 'Overall Assessment'];

  return !riskOnlyDomains.includes(normalizedName) && normalizedName !== 'General Development';
}

/**
 * Get domain color for consistent visualization
 * @param {string} domainName - Normalized domain name
 * @returns {string} Color code for the domain
 */
export function getDomainColor(domainName) {
  const normalizedName = normalizeDomainName(domainName);

  const domainColors = {
    Attention: '#FF6B6B',
    Memory: '#4ECDC4',
    'Processing Speed': '#45B7D1',
    'Executive Function': '#96CEB4',
    'Sensory Processing': '#FFEAA7',
    'Social Communication': '#DDA0DD',
    'Behavioral Regulation': '#98D8C8',
    Communication: '#F7DC6F',
    'Emotional Recognition': '#F8C471',
    'Social Attention': '#BB8FCE',
    Hyperactivity: '#F1948A',
    Impulsivity: '#85C1E9',
    'Reading Fluency': '#82E0AA',
    'Phonological Awareness': '#F9E79F',
    'Written Expression': '#D7BDE2',
    'Cognitive Development': '#AED6F1',
    'Emotional Regulation': '#A9DFBF',
    'Academic Readiness': '#F4D03F',
  };

  return domainColors[normalizedName] || '#BDC3C7'; // Default gray
}

/**
 * Format domain score for display
 * @param {number} score - Raw score (0-100)
 * @param {string} format - Display format ('percentage', 'decimal', 'raw')
 * @returns {string} Formatted score
 */
export function formatDomainScore(score, format = 'percentage') {
  if (score === null || score === undefined || isNaN(score)) {
    return 'N/A';
  }

  const numScore = Number(score);

  switch (format) {
    case 'percentage':
      return `${Math.round(numScore)}%`;
    case 'decimal':
      return (numScore / 100).toFixed(2);
    case 'raw':
      return Math.round(numScore).toString();
    default:
      return `${Math.round(numScore)}%`;
  }
}

/**
 * Get performance level text based on score
 * @param {number} score - Score (0-100)
 * @returns {string} Performance level text
 */
export function getPerformanceLevel(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return 'Unknown';
  }

  const numScore = Number(score);

  if (numScore >= 80) return 'Excellent';
  if (numScore >= 60) return 'Good';
  if (numScore >= 40) return 'Average';
  if (numScore >= 20) return 'Below Average';
  return 'Needs Attention';
}

/**
 * Validate if data represents timeline-worthy progress
 * @param {Object} assessmentData - Assessment data object
 * @returns {boolean} True if data should be included in timeline
 */
export function isTimelineWorthy(assessmentData) {
  if (!assessmentData || !assessmentData.results) return false;

  // Check for valid domain scores
  if (
    assessmentData.results.domainScores &&
    Array.isArray(assessmentData.results.domainScores) &&
    assessmentData.results.domainScores.length > 0
  ) {
    const validDomains = assessmentData.results.domainScores.filter(
      domain =>
        isValidDevelopmentalDomain(domain.domain) &&
        domain.score !== null &&
        domain.score !== undefined
    );

    return validDomains.length > 0;
  }

  // Check for valid scores object
  if (assessmentData.results.scores && typeof assessmentData.results.scores === 'object') {
    const validScores = Object.keys(assessmentData.results.scores).filter(
      domain =>
        isValidDevelopmentalDomain(domain) &&
        assessmentData.results.scores[domain] !== null &&
        assessmentData.results.scores[domain] !== undefined
    );

    return validScores.length > 0;
  }

  return false;
}

export default {
  UNIFIED_DOMAIN_MAP,
  normalizeDomainName,
  isValidDevelopmentalDomain,
  getDomainColor,
  formatDomainScore,
  getPerformanceLevel,
  isTimelineWorthy,
};
