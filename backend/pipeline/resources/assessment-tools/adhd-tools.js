/**
 * ADHD Screening Tools and Age-Appropriate Assessment Methodologies
 * Based on established ADHD assessment frameworks and research from prominent rating scales
 */

/**
 * Age-based ADHD screening tools with specific domains and methodologies
 * Based on Vanderbilt, Conners, ADHD-RS-IV, and CBCL scales
 */
const adhdScreeningTools = {
  // Preschool Years (3-5): Early identification with caution due to normal developmental characteristics
  preschool: {
    key: "preschool_adhd",
    name: "Preschool ADHD Risk Assessment",
    ageRange: "3-5 years",
    focus:
      "Early ADHD symptoms while considering normal developmental characteristics",
    domains: [
      "attention_span",
      "activity_level",
      "inhibitory_control",
      "emotional_regulation",
      "social_interaction",
      "following_directions",
      "task_initiation",
      "transition_handling",
      "rule_following",
      "group_dynamics",
      "instruction_processing",
      "turn_taking",
      "frustration_tolerance",
      "self_monitoring",
      "persistence",
      "distractibility",
      "attention_shift",
      "safety_awareness",
      "routine_adherence"
    ],
    methodology:
      "Careful observation-based assessment considering high activity and short attention spans are normal at this age",
    keyBehaviors: [
      "Extreme difficulty sitting still compared to peers",
      "Cannot sustain attention even during preferred activities",
      "Excessive impulsivity in dangerous situations",
      "Severe difficulty following simple instructions",
      "Extreme emotional outbursts beyond typical tantrums",
    ],
    diagnosticCriteria:
      "6+ symptoms for diagnosis, must be present for 6+ months in 2+ settings",
  },

  // Elementary School (6-11): School demands make symptoms more apparent - Vanderbilt/Conners age range
  elementary: {
    key: "elementary_adhd",
    name: "Elementary School ADHD Assessment",
    ageRange: "6-11 years",
    focus: "Academic and social functioning impacts become prominent",
    domains: [
      "inattention_symptoms",
      "hyperactivity_symptoms",
      "impulsivity_symptoms",
      "academic_performance",
      "peer_relationships",
      "oppositional_behaviors",
      "executive_functioning",
      "task_initiation",
      "task_completion",
      "working_memory",
      "cognitive_flexibility",
      "transition_handling",
      "rule_following",
      "instruction_processing",
      "time_management",
      "planning_organization",
      "distractibility",
      "impulse_control",
      "classroom_behavior",
      "note_taking",
      "homework_management",
      "test_readiness",
      "emotional_regulation",
      "peer_conflict",
      "group_dynamics",
      "turn_taking",
      "self_monitoring"
    ],
    methodology:
      "Vanderbilt and Conners-based assessment focusing on school performance and social interactions",
    keyBehaviors: [
      "Fails to give close attention to details in schoolwork",
      "Difficulty sustaining attention in tasks or play",
      "Does not seem to listen when spoken to directly",
      "Fidgets with hands or feet, squirms in seat",
      "Leaves seat when remaining seated is expected",
      "Talks excessively and interrupts others",
    ],
    diagnosticCriteria:
      "6+ symptoms for diagnosis, must interfere with school and social functioning",
  },

  // Adolescent (12-18): Hyperactivity becomes internalized, focus on academic/organizational challenges
  adolescent: {
    key: "adolescent_adhd",
    name: "Adolescent ADHD Assessment",
    ageRange: "12-18 years",
    focus: "Internalized symptoms and academic/organizational challenges",
    domains: [
      "inattention_academic",
      "internalized_hyperactivity",
      "impulsivity_consequences",
      "organizational_skills",
      "emotional_regulation",
      "peer_relationships",
      "risk_taking_behaviors",
      "task_initiation",
      "task_completion",
      "working_memory",
      "cognitive_flexibility",
      "time_management",
      "planning_organization",
      "study_skills",
      "deadline_management",
      "self_advocacy",
      "group_dynamics",
      "relationship_conflict",
      "self_monitoring",
      "persistence"
    ],
    methodology:
      "ADHD-RS-IV and Conners-based assessment with focus on internalized restlessness and academic demands",
    keyBehaviors: [
      "Internal restlessness rather than overt hyperactivity",
      "Difficulty with organization and time management",
      "Academic underachievement despite adequate ability",
      "Impulsive decision-making with consequences",
      "Mood swings and irritability",
      "Difficulty maintaining peer relationships",
    ],
    diagnosticCriteria:
      "6+ symptoms for ages 12-16, 5+ symptoms for ages 17-18",
  },

  // Adult (18+): Symptoms persist but manifest differently - focus on work/life functioning
  adult: {
    key: "adult_adhd",
    name: "Adult ADHD Assessment",
    ageRange: "18+ years",
    focus: "Work performance, relationships, and daily life functioning",
    domains: [
      "workplace_attention",
      "restlessness_adults",
      "impulsivity_adults",
      "emotional_dysregulation",
      "relationship_functioning",
      "organization_time_management",
      "stress_tolerance",
      "task_initiation",
      "task_completion",
      "meeting_follow_through",
      "email_management",
      "financial_impulsivity",
      "driving_risk_taking",
      "conflict_resolution",
      "sleep_hygiene",
      "self_monitoring",
      "career_planning",
      "time_blindness"
    ],
    methodology:
      "Adult-specific assessment focusing on occupational and relationship functioning",
    keyBehaviors: [
      "Difficulty concentrating at work or during tasks",
      "Restlessness and need for constant stimulation",
      "Impulsive financial or relationship decisions",
      "Low tolerance for frustration and stress",
      "Frequent job changes or relationship problems",
      "Chronic disorganization and lateness",
    ],
    diagnosticCriteria:
      "5+ symptoms, must have begun in childhood (before age 12)",
  },
};

/**
 * Get appropriate screening tool based on child's age in months
 */
function getAdhdScreeningToolForAge(ageInMonths) {
  const ageInYears = ageInMonths / 12;

  if (ageInYears < 6) {
    return adhdScreeningTools.preschool;
  } else if (ageInYears < 12) {
    return adhdScreeningTools.elementary;
  } else if (ageInYears < 18) {
    return adhdScreeningTools.adolescent;
  } else {
    return adhdScreeningTools.adult;
  }
}

/**
 * Age-specific focus areas for ADHD assessment
 */
function getAdhdAgeFocusAreas(ageInMonths) {
  const tool = getAdhdScreeningToolForAge(ageInMonths);

  const focusAreas = {
    preschool_adhd: {
      primary:
        "Early ADHD identification while considering normal developmental variation",
      assessment_focus: [
        "Extreme activity levels that exceed typical preschool behavior",
        "Attention span significantly shorter than peers during preferred activities",
        "Impulsivity that creates safety concerns beyond normal exploration",
        "Difficulty following simple, age-appropriate instructions",
        "Emotional regulation challenges that interfere with daily routines",
      ],
      question_types:
        "Parent observations of extreme behaviors compared to same-age peers, structured play observations",
    },

    elementary_adhd: {
      primary: "Academic and social functioning impacts from ADHD symptoms",
      assessment_focus: [
        "Inattention symptoms that interfere with schoolwork and learning",
        "Hyperactivity that disrupts classroom and social situations",
        "Impulsivity affecting peer relationships and rule-following",
        "Executive functioning challenges with organization and planning",
        "Academic performance gaps despite adequate cognitive ability",
      ],
      question_types:
        "Vanderbilt-style questions focusing on school performance, teacher observations, peer interactions",
    },

    adolescent_adhd: {
      primary: "Internalized symptoms and complex academic/social demands",
      assessment_focus: [
        "Internal restlessness and mental hyperactivity rather than physical movement",
        "Advanced organizational and time management skill deficits",
        "Impulsivity affecting academic decisions and peer relationships",
        "Emotional regulation challenges with increased independence demands",
        "Risk-taking behaviors and decision-making difficulties",
      ],
      question_types:
        "Self-report and parent observations of internal experiences, academic performance tracking",
    },

    adult_adhd: {
      primary: "Occupational and relationship functioning impacts",
      assessment_focus: [
        "Workplace attention and concentration difficulties",
        "Adult manifestations of restlessness and need for stimulation",
        "Impulsivity in major life decisions and financial management",
        "Stress tolerance and frustration management in adult contexts",
        "Relationship patterns and communication challenges",
      ],
      question_types:
        "Adult self-report measures, occupational functioning assessments, relationship impact measures",
    },
  };

  return focusAreas[tool.key] || focusAreas.elementary_adhd;
}

/**
 * Generate question domains based on screening tool and avoid repetition
 */
function getAvailableAdhdDomains(screeningTool, previousQuestions = []) {
  const allDomains = screeningTool.domains;
  const usedDomains = previousQuestions.map((q) => q.domain).filter((d) => d);

  console.log(`🔍 ADHD DOMAIN FILTERING DEBUG:`);
  console.log(`All domains: ${allDomains.join(", ")}`);
  console.log(`Used domains: ${usedDomains.join(", ")}`);

  // Return domains that haven't been used yet
  const availableDomains = allDomains.filter(
    (domain) => !usedDomains.includes(domain)
  );

  console.log(`Available domains: ${availableDomains.join(", ")}`);

  // If all domains have been used, cycle through them again
  if (availableDomains.length === 0) {
    console.log(`⚠️ All domains used, cycling through all domains again`);
    return allDomains;
  }

  return availableDomains;
}

/**
 * Domain-specific question examples for different age groups based on established rating scales
 */
const adhdDomainExamples = {
  // Preschool (3-5 years)
  preschool_adhd: {
    attention_span:
      "How long can {childName} focus on a preferred activity compared to other children their age?",
    activity_level:
      "Does {childName} have difficulty sitting still during story time or meals compared to peers?",
    inhibitory_control:
      "How often does {childName} act without thinking, even in potentially dangerous situations?",
    emotional_regulation:
      "How often does {childName} have intense emotional outbursts that seem excessive for the situation?",
    social_interaction:
      "Does {childName} have difficulty playing cooperatively with other children their age?",
    following_directions:
      "How well does {childName} follow simple, one-step instructions compared to other children?",
  },

  // Elementary (6-11 years) - Based on Vanderbilt and Conners scales
  elementary_adhd: {
    inattention_symptoms:
      "How often does {childName} fail to give close attention to details in schoolwork or other activities?",
    hyperactivity_symptoms:
      "How often does {childName} fidget with hands or feet or squirm in their seat?",
    impulsivity_symptoms:
      "How often does {childName} blurt out answers before questions have been completed?",
    academic_performance:
      "How often do {childName}'s attention problems interfere with their schoolwork?",
    peer_relationships:
      "How often does {childName} have difficulty playing or engaging in activities with other children?",
    oppositional_behaviors:
      "How often does {childName} argue with adults or refuse to comply with rules?",
    executive_functioning:
      "How often does {childName} have trouble organizing tasks and activities?",
  },

  // Adolescent (12-18 years) - Based on ADHD-RS-IV and Conners
  adolescent_adhd: {
    inattention_academic:
      "How often does {childName} have difficulty sustaining attention during lectures or homework?",
    internalized_hyperactivity:
      "How often does {childName} feel restless or 'on edge' even when sitting still?",
    impulsivity_consequences:
      "How often does {childName} make impulsive decisions that they later regret?",
    organizational_skills:
      "How often does {childName} struggle with time management and meeting deadlines?",
    emotional_regulation:
      "How often does {childName} have intense mood swings or irritability?",
    peer_relationships:
      "How often do {childName}'s ADHD symptoms interfere with friendships?",
    risk_taking_behaviors:
      "How often does {childName} engage in risky behaviors without considering consequences?",
  },

  // Adult (18+ years) - Adult-specific manifestations
  adult_adhd: {
    workplace_attention:
      "How often do you have difficulty concentrating during work tasks or meetings?",
    restlessness_adults:
      "How often do you feel restless or need to keep busy with multiple activities?",
    impulsivity_adults:
      "How often do you make impulsive purchases or major decisions without thinking them through?",
    emotional_dysregulation:
      "How often do you experience intense frustration or anger over minor inconveniences?",
    relationship_functioning:
      "How often do your attention or impulsivity issues cause problems in relationships?",
    organization_time_management:
      "How often do you struggle with organization and time management in daily life?",
    stress_tolerance:
      "How often do you feel overwhelmed by everyday stress and responsibilities?",
  },
};

/**
 * Get example questions for specific domains and age groups
 */
function getAdhdDomainExamples(ageInMonths, domain) {
  const tool = getAdhdScreeningToolForAge(ageInMonths);

  return adhdDomainExamples[tool.key]?.[domain] || null;
}

/**
 * ADHD-specific rating scale implementations
 */
const adhdRatingScales = {
  vanderbilt: {
    name: "Vanderbilt ADHD Diagnostic Rating Scale",
    ageRange: "6-12 years",
    domains: [
      "inattention",
      "hyperactivity_impulsivity",
      "oppositional_defiant",
      "conduct_disorder",
      "anxiety_depression",
    ],
    responseOptions: ["Never", "Occasionally", "Often", "Very Often"],
  },
  conners: {
    name: "Conners' Rating Scales",
    ageRange: "6-18 years",
    domains: [
      "inattention",
      "hyperactivity_impulsivity",
      "aggression",
      "behavioral_problems",
    ],
    responseOptions: [
      "Not True at All",
      "Just a Little True",
      "Pretty Much True",
      "Very Much True",
    ],
  },
  adhd_rs_iv: {
    name: "ADHD Rating Scale-IV",
    ageRange: "5-18 years",
    domains: ["inattention", "hyperactivity_impulsivity"],
    responseOptions: ["Never or Rarely", "Sometimes", "Often", "Very Often"],
  },
  cbcl: {
    name: "Child Behavior Checklist",
    ageRange: "6-18 years",
    domains: [
      "attention_problems",
      "aggressive_behavior",
      "anxious_depressed",
      "rule_breaking",
    ],
    responseOptions: [
      "Not True",
      "Somewhat or Sometimes True",
      "Very True or Often True",
    ],
  },
};

module.exports = {
  adhdScreeningTools,
  getAdhdScreeningToolForAge,
  getAdhdAgeFocusAreas,
  getAvailableAdhdDomains,
  getAdhdDomainExamples,
  adhdRatingScales,
};
