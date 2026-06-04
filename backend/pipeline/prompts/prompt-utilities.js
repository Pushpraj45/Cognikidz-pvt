/**
 * Prompt Utility Functions
 * Extracted from prompts.js to separate utility functions
 */

/**
 * Get comprehensive screening domains for mixed disorder assessment
 * Based on child's age and previous questions asked
 * Extracted from prompts.js lines 861-963
 */
function getComprehensiveScreeningDomains(ageInMonths, previousQuestions = []) {
  const age = Math.floor(ageInMonths / 12);

  // Define age-appropriate domains for comprehensive screening
  let allDomains = [];

  if (age < 6) {
    // Preschool domains (3-5 years)
    allDomains = [
      // ADHD domains
      "attention_span_preschool",
      "activity_level",
      "impulse_control_safety",

      // Autism domains
      "social_engagement",
      "eye_contact_communication",
      "pretend_play",
      "routine_transitions",

      // Dyslexia domains
      "speech_development",
      "rhyming_awareness",
      "letter_interest",

      // General development domains
      "emotional_regulation",
      "following_directions",
      "peer_interaction",
      "motor_skills",
    ];
  } else if (age < 12) {
    // Elementary domains (6-11 years)
    allDomains = [
      // ADHD domains
      "attention_to_schoolwork",
      "hyperactivity_classroom",
      "impulsivity_social",
      "organization_skills",

      // Autism domains
      "peer_social_skills",
      "restricted_interests",
      "sensory_sensitivities",
      "communication_patterns",

      // Dyslexia domains
      "reading_fluency",
      "phonological_awareness",
      "spelling_difficulties",
      "written_expression",

      // General development domains
      "academic_performance",
      "peer_relationships",
      "emotional_regulation_school",
      "adaptive_independence",
    ];
  } else {
    // Adolescent/Teen domains (12+ years)
    allDomains = [
      // ADHD domains
      "executive_functioning",
      "time_management",
      "emotional_regulation_teen",
      "academic_organization",

      // Autism domains
      "social_communication_complex",
      "routine_flexibility_teen",
      "sensory_processing_teen",
      "independence_challenges",

      // Dyslexia domains
      "reading_comprehension_complex",
      "written_expression_teen",
      "academic_accommodations",
      "language_processing_complex",

      // General development domains
      "mental_health_indicators",
      "social_adaptation",
      "independence_skills",
      "future_planning",
    ];
  }

  // Filter out domains that have been covered in previous questions
  const usedDomains = previousQuestions.map((q) => q.domain).filter(Boolean);
  const availableDomains = allDomains.filter(
    (domain) => !usedDomains.includes(domain)
  );

  // If we've used all domains, return a subset for variety
  if (availableDomains.length === 0) {
    return allDomains.slice(0, 5); // Return first 5 as fallback
  }

  return availableDomains;
}

/**
 * Get age-appropriate focus areas for comprehensive general assessment
 * Extracted from prompts.js lines 965-1041
 */
function getComprehensiveAgeFocus(ageInMonths) {
  const age = Math.floor(ageInMonths / 12);

  if (age < 6) {
    return {
      primary:
        "Early childhood comprehensive screening across multiple developmental domains",
      screening_focus: [
        "Early indicators of attention and activity regulation",
        "Social engagement and communication development",
        "Pre-literacy and language skills",
        "Emotional regulation and behavioral patterns",
        "Motor development and following directions",
      ],
      assessment_approach:
        "Play-based observation and parent report of daily behaviors",
      disorder_considerations: [
        "ADHD: Activity level, attention span, safety awareness",
        "Autism: Social interest, communication, play skills",
        "Dyslexia: Speech clarity, rhyming, letter recognition",
        "General: Emotional development, peer interaction",
      ],
    };
  } else if (age < 12) {
    return {
      primary:
        "School-age comprehensive screening for academic and social functioning",
      screening_focus: [
        "Academic attention and classroom behavior",
        "Peer relationships and social communication",
        "Reading, writing, and language processing skills",
        "Emotional regulation and behavioral adaptation",
        "Executive functioning and organization skills",
      ],
      assessment_approach:
        "Academic and social behavior assessment with standardized comparison",
      disorder_considerations: [
        "ADHD: Classroom attention, hyperactivity, organization",
        "Autism: Peer interactions, restricted interests, sensory issues",
        "Dyslexia: Reading fluency, spelling, phonological processing",
        "General: Academic performance, social adaptation",
      ],
    };
  } else {
    return {
      primary:
        "Adolescent comprehensive screening for complex academic and social demands",
      screening_focus: [
        "Executive functioning and time management",
        "Complex social communication and relationships",
        "Advanced academic skills and accommodations needed",
        "Emotional regulation and mental health indicators",
        "Independence and future planning skills",
      ],
      assessment_approach:
        "Self-report integration with parent observation for complex behaviors",
      disorder_considerations: [
        "ADHD: Executive dysfunction, emotional regulation, academic organization",
        "Autism: Social communication complexity, routine flexibility, sensory processing",
        "Dyslexia: Reading comprehension, written expression, academic accommodations",
        "General: Mental health, social adaptation, independence preparation",
      ],
    };
  }
}

module.exports = {
  getComprehensiveScreeningDomains,
  getComprehensiveAgeFocus
}; 