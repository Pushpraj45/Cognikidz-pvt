/**
 * Unified Domain Mapping System
 * Single source of truth for domain name normalization across backend and frontend
 */

const UNIFIED_DOMAIN_MAP = {
  // Text assessment domains (standard cognitive domains)
  attention: "Attention",
  memory: "Memory",
  processing: "Processing Speed",
  executive: "Executive Function",
  executivefunction: "Executive Function",
  executive_function: "Executive Function",
  sensory: "Sensory Processing",
  sensoryprocessing: "Sensory Processing",
  sensory_processing: "Sensory Processing",
  hyperactivity: "Hyperactivity",

  // Image assessment domains (condition-specific domains)
  social_interaction: "Social Communication",
  socialinteraction: "Social Communication",
  social_communication: "Social Communication",
  socialcommunication: "Social Communication",
  social: "Social Communication",

  behavior_patterns: "Behavioral Regulation",
  behaviorpatterns: "Behavioral Regulation",
  behavioral_regulation: "Behavioral Regulation",
  behavioralregulation: "Behavioral Regulation",
  behavioral: "Behavioral Regulation",

  sensory_response: "Sensory Processing",
  sensoryresponse: "Sensory Processing",

  communication: "Communication",

  // Autism-specific domains
  restricted_interests: "Restricted Interests",
  restrictedinterests: "Restricted Interests",
  interests: "Restricted Interests",

  emotion_recognition: "Emotional Recognition",
  emotionrecognition: "Emotional Recognition",
  emotional_recognition: "Emotional Recognition",
  emotionalrecognition: "Emotional Recognition",

  social_attention: "Social Attention",
  socialattention: "Social Attention",

  // ADHD-specific domains
  impulsivity: "Impulsivity",
  hyperactivity: "Hyperactivity",

  // Dyslexia-specific domains
  reading_fluency: "Reading Fluency",
  readingfluency: "Reading Fluency",
  phonological_awareness: "Phonological Awareness",
  phonologicalawareness: "Phonological Awareness",
  written_expression: "Written Expression",
  writtenexpression: "Written Expression",

  // General/fallback domains
  general: "General Development",
  cognitive: "Cognitive Development",
  cognitivedevelopment: "Cognitive Development",
  emotional: "Emotional Regulation",
  emotionalregulation: "Emotional Regulation",
  academic: "Academic Readiness",
  academicreadiness: "Academic Readiness",

  // Risk assessment domains
  overall: "Overall Assessment",
  risk: "Risk Assessment",
  disorderrisk: "Disorder Risk",
};

// Domain color mapping for consistent visualization
const DOMAIN_COLORS = {
  "Social Communication": "#3B82F6", // Blue
  "Restricted Interests": "#8B5CF6", // Purple
  "Sensory Processing": "#06B6D4", // Cyan
  "Cognitive Development": "#10B981", // Emerald
  "Social Skills": "#F59E0B", // Amber
  "Language Development": "#EF4444", // Red
  "Motor Skills": "#84CC16", // Lime
  "Emotional Development": "#EC4899", // Pink
  "Attention & Focus": "#F97316", // Orange
  "Behavioral Regulation": "#6366F1", // Indigo
  "Communication": "#14B8A6", // Teal
  "Memory": "#A855F7", // Violet
  "Processing Speed": "#22C55E", // Green
  "Executive Function": "#06B6D4", // Cyan
  "Hyperactivity": "#F59E0B", // Amber
  "Impulsivity": "#EF4444", // Red
  "Reading Fluency": "#8B5CF6", // Purple
  "Phonological Awareness": "#06B6D4", // Cyan
  "Written Expression": "#10B981", // Emerald
  "Emotional Recognition": "#EC4899", // Pink
  "Social Attention": "#3B82F6", // Blue
  "Academic Readiness": "#F97316", // Orange
  "Emotional Regulation": "#EC4899", // Pink
  "General Development": "#6B7280", // Gray
};

/**
 * Get color for a domain name
 * @param {string} domainName - Domain name
 * @returns {string} Hex color code
 */
function getDomainColor(domainName) {
  if (!domainName) return "#6B7280"; // Default gray
  
  const normalizedName = normalizeDomainName(domainName);
  return DOMAIN_COLORS[normalizedName] || "#6B7280"; // Default gray if not found
}

/**
 * Normalize domain name using unified mapping
 * @param {string} domainName - Original domain name from any source
 * @returns {string} Normalized, display-ready domain name
 */
function normalizeDomainName(domainName) {
  if (!domainName) return "General Development";

  // Handle special cases first - more comprehensive check
  if (domainName.includes('$') || domainName.includes('Is New') || domainName === '$Is New' || domainName === '$Is New') {
    return "General Development";
  }

  // Additional check for problematic domain names
  const problematicPatterns = ['$Is New', 'Is New', '$', 'new'];
  for (const pattern of problematicPatterns) {
    if (domainName.toLowerCase().includes(pattern.toLowerCase())) {
      return "General Development";
    }
  }

  // Clean the domain name (lowercase, remove special chars, spaces)
  const cleanDomainName = domainName
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();

  // Try exact match first
  if (UNIFIED_DOMAIN_MAP[cleanDomainName]) {
    return UNIFIED_DOMAIN_MAP[cleanDomainName];
  }

  // Try partial matches for compound names
  for (const [key, value] of Object.entries(UNIFIED_DOMAIN_MAP)) {
    const cleanKey = key.replace(/[^a-z]/g, "");
    if (
      cleanDomainName.includes(cleanKey) ||
      cleanKey.includes(cleanDomainName)
    ) {
      return value;
    }
  }

  // Additional mapping for common variations
  const additionalMappings = {
    'communication': 'Communication',
    'social': 'Social Communication',
    'behavioral': 'Behavioral Regulation',
    'sensory': 'Sensory Processing',
    'cognitive': 'Cognitive Development',
    'emotional': 'Emotional Regulation',
    'attention': 'Attention & Focus',
    'memory': 'Memory',
    'processing': 'Processing Speed',
    'executive': 'Executive Function'
  };

  if (additionalMappings[cleanDomainName]) {
    return additionalMappings[cleanDomainName];
  }

  // Fallback: Format the original name properly
  return domainName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}

/**
 * Validate domain score range and type
 * @param {*} score - Score value to validate
 * @param {string} sourceType - Source type ('image', 'text', etc.)
 * @returns {number|null} Normalized score (0-100) or null if invalid
 */
function validateAndNormalizeScore(score, sourceType = "unknown") {
  if (score === null || score === undefined || isNaN(score)) {
    return null;
  }

  const numScore = Number(score);

  // Image assessments return accuracy percentages (0-100) - higher is better
  if (sourceType === "image") {
    return Math.max(0, Math.min(100, Math.round(numScore)));
  }

  // Text assessments use 1-10 RISK scale - need to invert for performance display
  if (sourceType === "text" && numScore <= 10 && numScore >= 1) {
    // Risk score 1 (low risk) = Performance score 100 (good performance)
    // Risk score 10 (high risk) = Performance score 10 (poor performance)
    return Math.max(0, Math.min(100, Math.round((11 - numScore) * 10)));
  }

  // Already in 0-100 range or unknown source
  if (numScore >= 0 && numScore <= 100) {
    return Math.round(numScore);
  }

  // If score is in 1-10 range and source unknown, assume it's risk score - invert it
  if (numScore >= 1 && numScore <= 10) {
    return Math.max(0, Math.min(100, Math.round((11 - numScore) * 10)));
  }

  // Score is out of expected range, cap it
  return Math.max(0, Math.min(100, Math.round(numScore)));
}

/**
 * Check if a domain name represents a cognitive/developmental domain
 * @param {string} domainName - Domain name to check
 * @returns {boolean} True if it's a valid developmental domain
 */
function isValidDevelopmentalDomain(domainName) {
  if (!domainName) return false;

  const normalizedName = normalizeDomainName(domainName);

  // Exclude risk-only domains from developmental tracking
  const riskOnlyDomains = [
    "Risk Assessment",
    "Disorder Risk",
    "Overall Assessment",
  ];

  return (
    !riskOnlyDomains.includes(normalizedName) &&
    normalizedName !== "General Development"
  );
}

/**
 * Get all possible domain variations for a normalized domain name
 * @param {string} normalizedDomain - The normalized domain name
 * @returns {string[]} Array of possible variations
 */
function getDomainVariations(normalizedDomain) {
  const variations = [];

  // Find all keys that map to this normalized domain
  for (const [key, value] of Object.entries(UNIFIED_DOMAIN_MAP)) {
    if (value === normalizedDomain) {
      variations.push(key);
    }
  }

  return variations;
}

module.exports = {
  UNIFIED_DOMAIN_MAP,
  normalizeDomainName,
  validateAndNormalizeScore,
  isValidDevelopmentalDomain,
  getDomainVariations,
  getDomainColor,
};
