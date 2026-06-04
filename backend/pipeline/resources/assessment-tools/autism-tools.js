/**
 * Autism Screening Tools Configuration
 * Based on established screening instruments and their age-appropriate applications
 */

const AUTISM_SCREENING_TOOLS = {
  // 6-24 months: Communication and Symbolic Behavior Scales
  CSBS_DP: {
    ageRange: { min: 6, max: 24, unit: "months" },
    name: "Communication and Symbolic Behavior Scales Developmental Profile",
    domains: [
      "social_communication",
      "symbolic_abilities",
      "early_gestures",
      "joint_attention",
      "behavioral_regulation",
      "eye_contact",
      "social_smiling",
      "response_to_voice",
      "sensory_responsiveness",
      "imitation_early",
      "reciprocal_vocalization",
      "turn_taking_prelinguistic",
      "gesture_use",
      "shared_interest",
      "emotional_expression",
      "visual_tracking",
      "motor_mimicry",
      "orienting_to_name"
    ],
    questionTypes: ["observation", "parent_report"],
    sensitivity: 0.85,
    specificity: 0.88,
  },

  // 16-30 months: Modified Checklist for Autism in Toddlers
  M_CHAT: {
    ageRange: { min: 16, max: 30, unit: "months" },
    name: "Modified Checklist for Autism in Toddlers",
    domains: [
      "social_interest",
      "joint_attention",
      "pretend_play",
      "imitation",
      "response_to_name",
      "following_gaze",
      "pointing_to_share",
      "gesture_communication",
      "eye_gaze_coordination",
      "social_referencing",
      "shared_enjoyment",
      "play_flexibility",
      "sensory_seeking",
      "sensory_avoidance",
      "repetitive_movements",
      "routines_rituals",
      "unusual_interests",
      "emotional_responsiveness"
    ],
    questionTypes: ["yes_no", "behavioral_observation"],
    sensitivity: 0.78,
    specificity: 0.98,
  },

  // 18-35 months: Autism Behavior Checklist
  ABC: {
    ageRange: { min: 18, max: 35, unit: "months" },
    name: "Autism Behavior Checklist",
    domains: [
      "sensory_behaviors",
      "relating_behaviors",
      "body_object_use",
      "language_communication",
      "social_self_help",
      "emotional_regulation_autism",
      "attention_to_detail",
      "stereotyped_behaviors",
      "unusual_postures",
      "play_skills",
      "peer_interaction",
      "self_help_skills",
      "adaptive_functioning",
      "behavioral_challenges",
      "sleep_routines"
    ],
    questionTypes: ["frequency_scale", "behavioral_checklist"],
  },

  // 24-35 months: Screening Tool for Autism in Toddlers
  STAT: {
    ageRange: { min: 24, max: 35, unit: "months" },
    name: "Screening Tool for Autism in Toddlers",
    domains: [
      "play_behaviors",
      "communication_gestures",
      "imitation_skills",
      "joint_attention",
      "behavioral_requests",
      "shared_imagination",
      "symbolic_play",
      "motor_imitation",
      "requesting_help",
      "response_to_routines",
      "transition_handling",
      "emotion_sharing",
      "eye_gaze_sharing"
    ],
    questionTypes: ["interactive_observation", "structured_play"],
  },

  // 2-6 years: Trivandrum Autism Behavior Checklist
  TABC: {
    ageRange: { min: 2, max: 6, unit: "years" },
    name: "Trivandrum Autism Behavior Checklist",
    domains: [
      "social_interaction",
      "communication_language",
      "stereotyped_behaviors",
      "cognitive_development",
      "maladaptive_behaviors",
      "play_skills_complex",
      "peer_relationships",
      "academic_social_demands",
      "behavioral_flexibility",
      "sensory_modulation",
      "self_care_skills",
      "safety_awareness_autism",
      "rigidity_routines",
      "interest_intensity",
      "nonverbal_communication"
    ],
    questionTypes: ["parent_rating", "behavioral_frequency"],
  },

  // 1.5-10 years: Chandigarh Autism Screening Instrument
  CASI: {
    ageRange: { min: 1.5, max: 10, unit: "years" },
    name: "Chandigarh Autism Screening Instrument",
    domains: [
      "social_relatedness",
      "emotional_responsiveness",
      "speech_language_communication",
      "behavior_patterns",
      "sensory_aspects",
      "reciprocal_conversation",
      "pragmatic_language",
      "perspective_taking",
      "theory_of_mind",
      "restricted_interests",
      "movement_patterns",
      "anxiety_features",
      "attention_variability",
      "executive_functioning_autism",
      "school_functioning"
    ],
    questionTypes: ["developmental_checklist", "parent_interview"],
  },

  // 3-18 years: Indian Autism Screening Questionnaire
  IASQ: {
    ageRange: { min: 3, max: 18, unit: "years" },
    name: "Indian Autism Screening Questionnaire",
    domains: [
      "social_interaction",
      "communication",
      "behavioral_patterns",
      "developmental_history",
      "adaptive_functioning",
      "academic_functioning",
      "peer_conflict",
      "transition_management",
      "self_advocacy_autism",
      "community_navigation",
      "sensory_accommodation",
      "vocational_readiness",
      "family_stress_impact",
      "comorbid_conditions",
      "service_access"
    ],
    questionTypes: ["comprehensive_questionnaire", "developmental_history"],
  },

  // 4+ years: Social Communication Questionnaire
  SCQ: {
    ageRange: { min: 4, max: 18, unit: "years" },
    name: "Social Communication Questionnaire",
    domains: [
      "reciprocal_social_interaction",
      "communication",
      "restricted_repetitive_behaviors",
      "developmental_abnormalities",
      "peer_relationships",
      "emotional_regulation",
      "pragmatics",
      "nonliteral_language",
      "behavioral_flexibility",
      "sensory_profile",
      "daily_living_skills",
      "independent_functioning",
      "coping_strategies",
      "special_interests"
    ],
    questionTypes: ["parent_questionnaire", "lifetime_development"],
    items: 40,
  },
};

/**
 * Age-specific question focus areas for autism assessment
 */
const AGE_SPECIFIC_FOCUS = {
  // Early infancy (6-12 months)
  early_infancy: {
    ageRange: { min: 6, max: 12, unit: "months" },
    focusAreas: [
      "eye_contact_social_smiling",
      "response_to_name",
      "social_engagement",
      "early_communication_gestures",
      "sensory_responsiveness",
    ],
    keyBehaviors: [
      "sustained eye contact",
      "social smiling",
      "response to caregiver voice",
      "early babbling patterns",
      "reaction to sensory stimuli",
    ],
  },

  // Late infancy (12-24 months)
  late_infancy: {
    ageRange: { min: 12, max: 24, unit: "months" },
    focusAreas: [
      "joint_attention_skills",
      "imitation_abilities",
      "early_language_development",
      "pretend_play_emergence",
      "behavioral_regulation",
    ],
    keyBehaviors: [
      "pointing to share interest",
      "following gaze and gestures",
      "imitating actions and sounds",
      "first words and word combinations",
      "simple pretend play",
    ],
  },

  // Toddler (2-3 years)
  toddler: {
    ageRange: { min: 2, max: 3, unit: "years" },
    focusAreas: [
      "social_communication_skills",
      "play_development",
      "language_pragmatics",
      "behavioral_flexibility",
      "peer_interaction",
    ],
    keyBehaviors: [
      "conversational turn-taking",
      "imaginative and social play",
      "using language for social purposes",
      "adapting to routine changes",
      "showing interest in other children",
    ],
  },

  // Preschool (3-5 years)
  preschool: {
    ageRange: { min: 3, max: 5, unit: "years" },
    focusAreas: [
      "complex_social_interactions",
      "theory_of_mind_development",
      "advanced_communication",
      "behavioral_self_regulation",
      "academic_readiness",
    ],
    keyBehaviors: [
      "understanding others emotions",
      "cooperative play with peers",
      "complex sentence structures",
      "managing emotions and behavior",
      "pre-academic skills development",
    ],
  },

  // School age (5-12 years)
  school_age: {
    ageRange: { min: 5, max: 12, unit: "years" },
    focusAreas: [
      "peer_relationships",
      "academic_social_demands",
      "emotional_regulation",
      "independence_skills",
      "specialized_interests",
    ],
    keyBehaviors: [
      "forming and maintaining friendships",
      "classroom social expectations",
      "coping with frustration",
      "daily living skills",
      "intense interests or hobbies",
    ],
  },

  // Adolescent (12+ years)
  adolescent: {
    ageRange: { min: 12, max: 18, unit: "years" },
    focusAreas: [
      "identity_development",
      "complex_social_dynamics",
      "independence_transition",
      "academic_vocational_preparation",
      "mental_health_comorbidities",
    ],
    keyBehaviors: [
      "understanding social hierarchies",
      "romantic and intimate relationships",
      "planning for future",
      "managing increased academic demands",
      "coping with anxiety or depression",
    ],
  },
};

/**
 * Get appropriate screening tool for child's age
 * @param {number} ageInMonths - Child's age in months
 * @returns {Object} - Appropriate screening tool configuration
 */
function getScreeningToolForAge(ageInMonths) {
  const ageInYears = ageInMonths / 12;

  // Find the most appropriate screening tool
  for (const [toolKey, tool] of Object.entries(AUTISM_SCREENING_TOOLS)) {
    const { min, max, unit } = tool.ageRange;
    const ageToCheck = unit === "months" ? ageInMonths : ageInYears;

    if (ageToCheck >= min && ageToCheck <= max) {
      return { key: toolKey, ...tool };
    }
  }

  // Fallback to most comprehensive tool for age
  if (ageInYears >= 4) {
    return { key: "SCQ", ...AUTISM_SCREENING_TOOLS.SCQ };
  } else if (ageInYears >= 2) {
    return { key: "TABC", ...AUTISM_SCREENING_TOOLS.TABC };
  } else {
    return { key: "M_CHAT", ...AUTISM_SCREENING_TOOLS.M_CHAT };
  }
}

/**
 * Get age-specific focus areas for assessment
 * @param {number} ageInMonths - Child's age in months
 * @returns {Object} - Age-specific focus configuration
 */
function getAgeFocusAreas(ageInMonths) {
  const ageInYears = ageInMonths / 12;

  if (ageInMonths < 12) {
    return AGE_SPECIFIC_FOCUS.early_infancy;
  } else if (ageInMonths < 24) {
    return AGE_SPECIFIC_FOCUS.late_infancy;
  } else if (ageInYears < 3) {
    return AGE_SPECIFIC_FOCUS.toddler;
  } else if (ageInYears < 5) {
    return AGE_SPECIFIC_FOCUS.preschool;
  } else if (ageInYears < 12) {
    return AGE_SPECIFIC_FOCUS.school_age;
  } else {
    return AGE_SPECIFIC_FOCUS.adolescent;
  }
}

/**
 * Generate question domains based on screening tool and avoid repetition
 * @param {Object} screeningTool - The screening tool configuration
 * @param {Array} previousQuestions - Previously asked questions
 * @returns {Array} - Available domains for next question
 */
function getAvailableQuestionDomains(screeningTool, previousQuestions = []) {
  const allDomains = screeningTool.domains;
  const usedDomains = previousQuestions.map((q) => q.domain).filter((d) => d);

  console.log(`🔍 DOMAIN FILTERING DEBUG:`);
  console.log(`All domains: ${allDomains.join(", ")}`);
  console.log(`Used domains: ${usedDomains.join(", ")}`);

  // Return domains that haven't been used yet
  const availableDomains = allDomains.filter(
    (domain) => !usedDomains.includes(domain)
  );

  console.log(`Available domains: ${availableDomains.join(", ")}`);

  // If all domains have been used, cycle through with priority on least used
  if (availableDomains.length === 0) {
    // Count usage of each domain
    const domainCounts = {};
    allDomains.forEach((domain) => {
      domainCounts[domain] = usedDomains.filter(
        (used) => used === domain
      ).length;
    });

    // Sort domains by usage count (least used first)
    const sortedDomains = allDomains.sort(
      (a, b) => domainCounts[a] - domainCounts[b]
    );
    console.log(
      `All domains used, cycling with least used first: ${sortedDomains.join(", ")}`
    );
    return sortedDomains;
  }

  return availableDomains;
}

module.exports = {
  AUTISM_SCREENING_TOOLS,
  AGE_SPECIFIC_FOCUS,
  getScreeningToolForAge,
  getAgeFocusAreas,
  getAvailableQuestionDomains,
};
