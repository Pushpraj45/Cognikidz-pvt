/**
 * Dyslexia Screening Tools and Age-Appropriate Assessment Methodologies
 * Based on established dyslexia assessment frameworks and research
 */

/**
 * Age-based dyslexia screening tools with specific domains and methodologies
 */
const dyslexiaScreeningTools = {
  // Preschool Years (3-5): Pre-literacy and oral language development
  preschool: {
    key: "preschool_dyslexia",
    name: "Preschool Dyslexia Risk Assessment",
    ageRange: "3-5 years",
    focus: "Pre-literacy skills and oral language development",
    domains: [
      "phonological_awareness",
      "oral_language",
      "letter_knowledge",
      "rapid_naming",
      "vocabulary",
      "phoneme_isolation",
      "syllable_segmentation",
      "rhyme_production",
      "listening_comprehension",
      "story_retell",
      "print_awareness",
      "alphabetic_principle",
      "name_writing",
      "phonological_memory",
      "articulation_clarity"
    ],
    methodology:
      "Picture-based activities focusing on rhyming, syllable awareness, speech development, and basic letter recognition",
    keyBehaviors: [
      "Delayed speech development",
      "Persistent pronunciation problems",
      "Difficulty with rhyming games",
      "Trouble learning letter names",
      "Limited vocabulary for age",
    ],
  },

  // Kindergarten/Early Elementary (5-7): Foundational literacy skills
  early_elementary: {
    key: "early_elementary_dyslexia",
    name: "Early Elementary Dyslexia Assessment",
    ageRange: "5-7 years",
    focus: "Foundational reading and spelling skills",
    domains: [
      "phonemic_awareness",
      "sound_letter_correspondence",
      "decoding_skills",
      "sight_word_recognition",
      "spelling_patterns",
      "reading_fluency",
      "blending",
      "segmenting",
      "orthographic_mapping",
      "morphological_awareness",
      "high_frequency_words",
      "nonsense_word_decoding",
      "dictation_spelling",
      "reading_accuracy",
      "fluency_rate",
      "prosody",
      "reading_motivation"
    ],
    methodology:
      "CTOPP-2 and PAT inspired tasks focusing on phonological processing and early reading skills",
    keyBehaviors: [
      "Struggles with sound-letter correlation",
      "Difficulty decoding simple words",
      "Problems remembering sight words",
      "Inconsistent spelling patterns",
      "Slow reading progress compared to peers",
    ],
  },

  // Older Elementary (8+): Advanced reading and academic performance
  late_elementary: {
    key: "late_elementary_dyslexia",
    name: "Late Elementary Dyslexia Assessment",
    ageRange: "8+ years",
    focus: "Reading fluency, comprehension, and academic performance gaps",
    domains: [
      "reading_fluency",
      "reading_comprehension",
      "spelling_complexity",
      "written_expression",
      "academic_performance",
      "self_advocacy",
      "note_taking_skills",
      "organization_planning",
      "test_taking_strategies",
      "editing_revision",
      "vocabulary_acquisition",
      "background_knowledge",
      "reading_stamina",
      "inferencing_skills",
      "summarization",
      "paraphrasing",
      "text_structure_awareness"
    ],
    methodology:
      "Comprehensive assessment focusing on academic impact and compensatory strategies",
    keyBehaviors: [
      "Pronounced reading and spelling struggles",
      "Gap between cognitive abilities and academic performance",
      "Avoidance of reading tasks",
      "Difficulty with timed assessments",
      "Need for accommodations and support strategies",
    ],
  },
};

/**
 * Get appropriate screening tool based on child's age in months
 */
function getDyslexiaScreeningToolForAge(ageInMonths) {
  if (ageInMonths < 60) {
    // Under 5 years
    return dyslexiaScreeningTools.preschool;
  } else if (ageInMonths < 96) {
    // 5-8 years
    return dyslexiaScreeningTools.early_elementary;
  } else {
    // 8+ years
    return dyslexiaScreeningTools.late_elementary;
  }
}

/**
 * Age-specific focus areas for dyslexia assessment
 */
function getDyslexiaAgeFocusAreas(ageInMonths) {
  const tool = getDyslexiaScreeningToolForAge(ageInMonths);

  const focusAreas = {
    preschool_dyslexia: {
      primary: "Pre-literacy skills and oral language development",
      assessment_focus: [
        "Phonological awareness through rhyming and syllable games",
        "Oral language complexity and vocabulary development",
        "Letter recognition and basic pre-reading skills",
        "Speech development and pronunciation clarity",
        "Family history and early risk indicators",
      ],
      question_types:
        "Picture-based activities, oral responses, parent observations of daily activities",
    },

    early_elementary_dyslexia: {
      primary: "Foundational reading and spelling acquisition",
      assessment_focus: [
        "Phonemic awareness and sound manipulation skills",
        "Letter-sound correspondence and decoding abilities",
        "Sight word recognition and reading fluency",
        "Spelling patterns and phonetic awareness",
        "Reading motivation and confidence levels",
      ],
      question_types:
        "Structured literacy tasks, reading samples, spelling assessments, parent/teacher observations",
    },

    late_elementary_dyslexia: {
      primary: "Reading fluency, comprehension, and academic impact",
      assessment_focus: [
        "Reading fluency and automaticity with grade-level texts",
        "Reading comprehension strategies and difficulties",
        "Written expression and complex spelling patterns",
        "Academic performance across subject areas",
        "Self-advocacy skills and accommodation needs",
      ],
      question_types:
        "Academic performance measures, reading comprehension tasks, writing samples, self-report measures",
    },
  };

  return focusAreas[tool.key] || focusAreas.early_elementary_dyslexia;
}

/**
 * Generate question domains based on screening tool and avoid repetition
 */
function getAvailableDyslexiaDomains(screeningTool, previousQuestions = []) {
  const allDomains = screeningTool.domains;
  const usedDomains = previousQuestions.map((q) => q.domain).filter((d) => d);

  console.log(`🔍 DYSLEXIA DOMAIN FILTERING DEBUG:`);
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
 * Domain-specific question examples for different age groups
 */
const dyslexiaDomainExamples = {
  // Preschool (3-5 years)
  preschool_dyslexia: {
    phonological_awareness:
      "Does {childName} enjoy rhyming games and can identify words that rhyme?",
    oral_language:
      "How clearly does {childName} speak compared to other children of the same age?",
    letter_knowledge:
      "Can {childName} recognize and name most letters of the alphabet?",
    rapid_naming:
      "How quickly can {childName} name familiar objects or colors when shown pictures?",
    vocabulary: "Does {childName} use a wide variety of words when speaking?",
  },

  // Early Elementary (5-7 years)
  early_elementary_dyslexia: {
    phonemic_awareness:
      "Can {childName} identify the first sound in words like 'cat' or 'sun'?",
    sound_letter_correspondence:
      "Does {childName} know what sounds most letters make?",
    decoding_skills:
      "How well can {childName} sound out simple three-letter words like 'cat' or 'dog'?",
    sight_word_recognition:
      "Can {childName} recognize common words like 'the', 'and', 'said' without sounding them out?",
    spelling_patterns:
      "When {childName} tries to spell words, do the letters make sense phonetically?",
    reading_fluency:
      "How smoothly does {childName} read simple sentences aloud?",
  },

  // Late Elementary (8+ years)
  late_elementary_dyslexia: {
    reading_fluency:
      "How quickly and accurately does {childName} read grade-level passages?",
    reading_comprehension:
      "Does {childName} understand and remember what they read?",
    spelling_complexity:
      "Can {childName} spell multi-syllabic words and use spelling rules correctly?",
    written_expression:
      "How well can {childName} express ideas in writing with proper grammar and organization?",
    academic_performance:
      "Is there a noticeable gap between {childName}'s intelligence and reading/writing performance?",
    self_advocacy:
      "Does {childName} ask for help or accommodations when struggling with reading tasks?",
  },
};

/**
 * Get example questions for specific domains and age groups
 */
function getDyslexiaDomainExamples(ageInMonths, domain) {
  const tool = getDyslexiaScreeningToolForAge(ageInMonths);

  return dyslexiaDomainExamples[tool.key]?.[domain] || null;
}

module.exports = {
  dyslexiaScreeningTools,
  getDyslexiaScreeningToolForAge,
  getDyslexiaAgeFocusAreas,
  getAvailableDyslexiaDomains,
  getDyslexiaDomainExamples,
};
