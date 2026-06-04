/**
 * Assessment Tool Selector
 * Unified interface for selecting and accessing assessment tools
 */

// Import all assessment tool modules
const autismTools = require("./assessment-tools/autism-tools");
const adhdTools = require("./assessment-tools/adhd-tools");
const dyslexiaTools = require("./assessment-tools/dyslexia-tools");

/**
 * Get the appropriate screening tool for a given age and assessment type
 * @param {string} assessmentType - Type of assessment (autism, adhd, dyslexia)
 * @param {number} ageInMonths - Child's age in months
 * @returns {Object|null} - Screening tool object or null if not found
 */
function getScreeningTool(assessmentType, ageInMonths) {
  const normalizedType = assessmentType.toLowerCase();

  switch (normalizedType) {
    case "autism":
    case "asd":
      return autismTools.getScreeningToolForAge(ageInMonths);

    case "adhd":
      return adhdTools.getAdhdScreeningToolForAge(ageInMonths);

    case "dyslexia":
      return dyslexiaTools.getDyslexiaScreeningToolForAge(ageInMonths);

    default:
      return null;
  }
}

/**
 * Get age-specific focus areas for assessment
 * @param {string} assessmentType - Type of assessment
 * @param {number} ageInMonths - Child's age in months
 * @returns {Object|null} - Age focus areas or null if not found
 */
function getAgeFocusAreas(assessmentType, ageInMonths) {
  const normalizedType = assessmentType.toLowerCase();

  switch (normalizedType) {
    case "autism":
    case "asd":
      return autismTools.getAgeFocusAreas(ageInMonths);

    case "adhd":
      return adhdTools.getAdhdAgeFocusAreas(ageInMonths);

    case "dyslexia":
      return dyslexiaTools.getDyslexiaAgeFocusAreas(ageInMonths);

    default:
      return null;
  }
}

/**
 * Get available question domains for a screening tool
 * @param {string} assessmentType - Type of assessment
 * @param {Object} screeningTool - Screening tool object
 * @param {Array} previousQuestions - Previously asked questions
 * @returns {Array} - Available domains
 */
function getAvailableQuestionDomains(
  assessmentType,
  screeningTool,
  previousQuestions = []
) {
  const normalizedType = assessmentType.toLowerCase();

  switch (normalizedType) {
    case "autism":
    case "asd":
      return autismTools.getAvailableQuestionDomains(
        screeningTool,
        previousQuestions
      );

    case "adhd":
      return adhdTools.getAvailableAdhdDomains(
        screeningTool,
        previousQuestions
      );

    case "dyslexia":
      return dyslexiaTools.getAvailableDyslexiaDomains(
        screeningTool,
        previousQuestions
      );

    default:
      return [];
  }
}

/**
 * Get all available assessment types
 * @returns {Array<string>} - Array of assessment type names
 */
function getAvailableAssessmentTypes() {
  return ["autism", "adhd", "dyslexia", "general"];
}

/**
 * Get assessment type metadata
 * @param {string} assessmentType - Type of assessment
 * @returns {Object|null} - Assessment metadata
 */
function getAssessmentMetadata(assessmentType) {
  const normalizedType = assessmentType.toLowerCase();

  const metadata = {
    autism: {
      name: "Autism Spectrum Disorder",
      description:
        "Screening for autism spectrum disorders and related developmental differences",
      ageRange: { min: 6, max: 216, unit: "months" }, // 6 months to 18 years
      primaryDomains: [
        "social_communication",
        "restricted_interests",
        "sensory_processing",
      ],
      screeningTools: ["CSBS-DP", "M-CHAT", "TABC", "SCQ", "CASI", "IASQ"],
      estimatedQuestions: 15, // Updated for comprehensive assessment
    },

    adhd: {
      name: "Attention Deficit Hyperactivity Disorder",
      description:
        "Screening for ADHD symptoms and attention-related challenges",
      ageRange: { min: 36, max: 216, unit: "months" }, // 3 years to 18 years
      primaryDomains: [
        "attention",
        "hyperactivity",
        "impulsivity",
        "executive_function",
      ],
      screeningTools: ["Vanderbilt", "Conners", "ADHD-RS-IV", "CBCL"],
      estimatedQuestions: 15, // Updated for comprehensive assessment
    },

    dyslexia: {
      name: "Dyslexia and Reading Difficulties",
      description:
        "Screening for dyslexia and reading-related learning differences",
      ageRange: { min: 48, max: 216, unit: "months" }, // 4 years to 18 years
      primaryDomains: [
        "phonological_awareness",
        "reading_fluency",
        "written_expression",
      ],
      screeningTools: ["CTOPP-2", "PAT", "RAN/RAS", "TOWRE-2", "GORT-5"],
      estimatedQuestions: 15, // Updated for comprehensive assessment
    },

    general: {
      name: "General Developmental Screening",
      description:
        "Comprehensive developmental screening across multiple domains",
      ageRange: { min: 6, max: 216, unit: "months" }, // 6 months to 18 years
      primaryDomains: ["cognitive", "social", "emotional", "academic"],
      screeningTools: ["Comprehensive Assessment"],
      estimatedQuestions: 15, // Updated for comprehensive assessment
    },
  };

  return metadata[normalizedType] || null;
}

/**
 * Validate if an assessment type is supported
 * @param {string} assessmentType - Type of assessment to validate
 * @returns {boolean} - True if supported
 */
function isValidAssessmentType(assessmentType) {
  const validTypes = getAvailableAssessmentTypes();
  return validTypes.includes(assessmentType.toLowerCase());
}

/**
 * Get age-appropriate assessment types for a given age
 * @param {number} ageInMonths - Child's age in months
 * @returns {Array<string>} - Array of appropriate assessment types
 */
function getAgeAppropriateAssessments(ageInMonths) {
  const appropriateTypes = [];

  // Autism screening available from 6 months
  if (ageInMonths >= 6) {
    appropriateTypes.push("autism");
  }

  // ADHD screening typically starts around 3 years
  if (ageInMonths >= 36) {
    appropriateTypes.push("adhd");
  }

  // Dyslexia screening typically starts around 4 years
  if (ageInMonths >= 48) {
    appropriateTypes.push("dyslexia");
  }

  // General screening available for all ages
  appropriateTypes.push("general");

  return appropriateTypes;
}

/**
 * Get recommended assessment sequence based on concerns and age
 * @param {number} ageInMonths - Child's age in months
 * @param {Array<string>} concerns - Array of concern areas
 * @returns {Array<string>} - Recommended assessment sequence
 */
function getRecommendedAssessmentSequence(ageInMonths, concerns = []) {
  const sequence = [];
  const appropriateTypes = getAgeAppropriateAssessments(ageInMonths);

  // Prioritize based on concerns
  const concernMapping = {
    social: "autism",
    communication: "autism",
    attention: "adhd",
    hyperactivity: "adhd",
    reading: "dyslexia",
    learning: "dyslexia",
  };

  // Add assessments based on specific concerns
  concerns.forEach((concern) => {
    const mappedType = concernMapping[concern.toLowerCase()];
    if (
      mappedType &&
      appropriateTypes.includes(mappedType) &&
      !sequence.includes(mappedType)
    ) {
      sequence.push(mappedType);
    }
  });

  // Add remaining appropriate assessments
  appropriateTypes.forEach((type) => {
    if (!sequence.includes(type)) {
      sequence.push(type);
    }
  });

  return sequence;
}

/**
 * Get comprehensive tool information for all assessment types
 * @returns {Object} - Complete tool information
 */
function getAllToolInformation() {
  return {
    autism: {
      tools: autismTools.AUTISM_SCREENING_TOOLS || {},
      ageFocus: autismTools.AGE_SPECIFIC_FOCUS || {},
      metadata: getAssessmentMetadata("autism"),
    },
    adhd: {
      tools: adhdTools.adhdScreeningTools || {},
      ageFocus: adhdTools.adhdAgeFocusAreas || {},
      metadata: getAssessmentMetadata("adhd"),
    },
    dyslexia: {
      tools: dyslexiaTools.dyslexiaScreeningTools || {},
      ageFocus: dyslexiaTools.dyslexiaAgeFocusAreas || {},
      metadata: getAssessmentMetadata("dyslexia"),
    },
  };
}

module.exports = {
  // Core tool selection functions
  getScreeningTool,
  getAgeFocusAreas,
  getAvailableQuestionDomains,

  // Assessment type utilities
  getAvailableAssessmentTypes,
  getAssessmentMetadata,
  isValidAssessmentType,
  getAgeAppropriateAssessments,
  getRecommendedAssessmentSequence,

  // Information access
  getAllToolInformation,

  // Direct access to tool modules (for backward compatibility)
  autismTools,
  adhdTools,
  dyslexiaTools,
};
