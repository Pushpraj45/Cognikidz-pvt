/**
 * Question Bank System
 * Pre-built questions for all assessment types to eliminate LLM repetition
 * Supports multiple languages and maintains assessment quality
 */

const { getLanguageInstructions } = require('../utils/language-validator');

/**
 * Base question structure for all question types
 */
class QuestionTemplate {
  constructor(data) {
    this.id = data.id;
    this.basePrompt = data.basePrompt;
    this.domain = data.domain;
    this.disorder = data.disorder;
    this.skill = data.skill;
    this.difficulty = data.difficulty;
    this.type = data.type;
    this.options = data.options || ["1", "2", "3", "4", "5"];
    this.optionLabels = data.optionLabels || ["Never", "Rarely", "Sometimes", "Often", "Very Often"];
    this.ageRange = data.ageRange;
    this.screeningTool = data.screeningTool;
    this.metadata = data.metadata || {};
  }

  /**
   * Personalize question for specific child
   */
  personalize(childName, childAge, language = 'en') {
    const personalizedPrompt = this.basePrompt
      .replace(/{childName}/g, childName)
      .replace(/{childAge}/g, childAge);

    return {
      id: `${this.id}_${Date.now()}`,
      prompt: personalizedPrompt,
      question: personalizedPrompt,
      domain: this.domain,
      disorder: this.disorder,
      type: this.type,
      options: this.options,
      optionLabels: this.optionLabels,
      difficulty: this.difficulty,
      skill: this.skill,
      screeningTool: this.screeningTool,
      ageAppropriate: this.isAgeAppropriate(childAge),
      language: language,
      timestamp: new Date().toISOString(),
      metadata: {
        ...this.metadata,
        source: 'question_bank',
        originalId: this.id
      }
    };
  }

  /**
   * Check if question is appropriate for child's age
   */
  isAgeAppropriate(childAge) {
    if (!this.ageRange) return true;
    
    const age = parseInt(childAge);
    if (isNaN(age)) return true;
    
    return age >= this.ageRange.min && age <= this.ageRange.max;
  }
}

/**
 * ADHD Question Bank
 */
const ADHD_QUESTIONS = [
  // Attention Domain (10 questions)
  new QuestionTemplate({
    id: 'adhd_attention_01',
    basePrompt: 'How often does {childName} have difficulty paying attention to details or making careless mistakes in schoolwork or other activities?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Attention to detail',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),
  
  new QuestionTemplate({
    id: 'adhd_attention_02',
    basePrompt: 'How often does {childName} have trouble sustaining attention in tasks or play activities?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Sustained attention',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_03',
    basePrompt: 'How often does {childName} seem to not listen when spoken to directly?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Listening attention',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_04',
    basePrompt: 'How often does {childName} get easily distracted by external stimuli like sounds or movements?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Distraction resistance',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_05',
    basePrompt: 'How often does {childName} have difficulty following through on instructions and completing tasks?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Instruction following',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_06',
    basePrompt: 'How often does {childName} appear to be daydreaming or "in their own world"?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Mental focus',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_07',
    basePrompt: 'How often does {childName} have trouble concentrating on reading or written work?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Reading concentration',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_08',
    basePrompt: 'How often does {childName} lose track of what they were doing or saying?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Task continuity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_09',
    basePrompt: 'How often does {childName} have difficulty switching attention between different tasks?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Attention switching',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_attention_10',
    basePrompt: 'How often does {childName} appear to be "tuned out" during group activities or conversations?',
    domain: 'attention_span',
    disorder: 'ADHD',
    skill: 'Group attention',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  // Hyperactivity Domain (10 questions)
  new QuestionTemplate({
    id: 'adhd_hyperactivity_01',
    basePrompt: 'How often does {childName} fidget with hands or feet or squirm in seat?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Motor restlessness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_02',
    basePrompt: 'How often does {childName} leave seat in classroom or other situations where remaining seated is expected?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Seat behavior',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_03',
    basePrompt: 'How often does {childName} run about or climb excessively in situations where it is inappropriate?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Physical activity control',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_04',
    basePrompt: 'How often does {childName} have difficulty playing or engaging in leisure activities quietly?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Quiet play',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_05',
    basePrompt: 'How often does {childName} talk excessively?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Speech control',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_06',
    basePrompt: 'How often does {childName} seem to be "on the go" or act as if "driven by a motor"?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Energy level',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_07',
    basePrompt: 'How often does {childName} have difficulty staying in one place during meals or other quiet activities?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Sitting still',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_08',
    basePrompt: 'How often does {childName} move around constantly, even when asked to stay in one area?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Movement control',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_09',
    basePrompt: 'How often does {childName} have trouble waiting in line or taking turns?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Patience',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_hyperactivity_10',
    basePrompt: 'How often does {childName} appear restless or unable to relax even during quiet time?',
    domain: 'hyperactivity',
    disorder: 'ADHD',
    skill: 'Relaxation ability',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  // Impulsivity Domain (8 questions)
  new QuestionTemplate({
    id: 'adhd_impulsivity_01',
    basePrompt: 'How often does {childName} blurt out answers before questions have been completed?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Response inhibition',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_02',
    basePrompt: 'How often does {childName} have difficulty waiting his/her turn?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Turn-taking',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_03',
    basePrompt: 'How often does {childName} interrupt or intrude on others?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Social boundaries',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_04',
    basePrompt: 'How often does {childName} act without thinking about the consequences?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Consequence awareness',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_05',
    basePrompt: 'How often does {childName} grab toys or objects from other children without asking?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Sharing behavior',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_06',
    basePrompt: 'How often does {childName} start activities without waiting for instructions?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Instruction following',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_07',
    basePrompt: 'How often does {childName} make decisions quickly without considering alternatives?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Decision making',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_impulsivity_08',
    basePrompt: 'How often does {childName} have difficulty stopping an activity when asked?',
    domain: 'impulsivity',
    disorder: 'ADHD',
    skill: 'Activity transition',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  // Executive Functioning Domain (8 questions)
  new QuestionTemplate({
    id: 'adhd_executive_01',
    basePrompt: 'How often does {childName} have difficulty organizing tasks and activities?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Task organization',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_02',
    basePrompt: 'How often does {childName} avoid, dislike, or be reluctant to engage in tasks that require sustained mental effort?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Mental effort tolerance',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_03',
    basePrompt: 'How often does {childName} lose things necessary for tasks or activities?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Object management',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_04',
    basePrompt: 'How often does {childName} have difficulty planning ahead or thinking about the future?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Future planning',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_05',
    basePrompt: 'How often does {childName} have trouble managing time or meeting deadlines?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Time management',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_06',
    basePrompt: 'How often does {childName} have difficulty breaking down complex tasks into smaller steps?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Task breakdown',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_07',
    basePrompt: 'How often does {childName} forget to complete daily routines or chores?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Routine completion',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_executive_08',
    basePrompt: 'How often does {childName} have difficulty monitoring their own behavior or progress?',
    domain: 'executive_functioning',
    disorder: 'ADHD',
    skill: 'Self-monitoring',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  // Emotional Regulation Domain (6 questions)
  new QuestionTemplate({
    id: 'adhd_emotional_01',
    basePrompt: 'How often does {childName} have difficulty managing frustration or anger?',
    domain: 'emotional_regulation',
    disorder: 'ADHD',
    skill: 'Frustration tolerance',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_emotional_02',
    basePrompt: 'How often does {childName} have intense emotional outbursts that seem excessive for the situation?',
    domain: 'emotional_regulation',
    disorder: 'ADHD',
    skill: 'Emotional intensity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_emotional_03',
    basePrompt: 'How often does {childName} have difficulty calming down after becoming upset?',
    domain: 'emotional_regulation',
    disorder: 'ADHD',
    skill: 'Emotional recovery',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_emotional_04',
    basePrompt: 'How often does {childName} overreact to minor problems or disappointments?',
    domain: 'emotional_regulation',
    disorder: 'ADHD',
    skill: 'Emotional perspective',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_emotional_05',
    basePrompt: 'How often does {childName} have difficulty understanding how others are feeling?',
    domain: 'emotional_regulation',
    disorder: 'ADHD',
    skill: 'Empathy',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_emotional_06',
    basePrompt: 'How often does {childName} have mood swings or rapid changes in emotional state?',
    domain: 'emotional_regulation',
    disorder: 'ADHD',
    skill: 'Emotional stability',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  // Academic Performance Domain (6 questions)
  new QuestionTemplate({
    id: 'adhd_academic_01',
    basePrompt: 'How often do {childName}\'s attention problems interfere with completing schoolwork?',
    domain: 'academic_performance',
    disorder: 'ADHD',
    skill: 'Academic focus',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_academic_02',
    basePrompt: 'How often does {childName} forget to turn in completed homework assignments?',
    domain: 'academic_performance',
    disorder: 'ADHD',
    skill: 'Assignment completion',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_academic_03',
    basePrompt: 'How often does {childName} have difficulty understanding or following classroom instructions?',
    domain: 'academic_performance',
    disorder: 'ADHD',
    skill: 'Instruction comprehension',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_academic_04',
    basePrompt: 'How often does {childName} struggle with reading comprehension or math problem-solving?',
    domain: 'academic_performance',
    disorder: 'ADHD',
    skill: 'Academic problem-solving',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_academic_05',
    basePrompt: 'How often does {childName} have difficulty studying or preparing for tests?',
    domain: 'academic_performance',
    disorder: 'ADHD',
    skill: 'Study skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_academic_06',
    basePrompt: 'How often does {childName} perform below their potential in school despite effort?',
    domain: 'academic_performance',
    disorder: 'ADHD',
    skill: 'Academic achievement',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 18 },
    screeningTool: 'General'
  }),

  // Peer Relationships Domain (6 questions)
  new QuestionTemplate({
    id: 'adhd_peer_01',
    basePrompt: 'How often does {childName} have difficulty playing or engaging in leisure activities quietly?',
    domain: 'peer_relationships',
    disorder: 'ADHD',
    skill: 'Quiet play',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'Vanderbilt'
  }),

  new QuestionTemplate({
    id: 'adhd_peer_02',
    basePrompt: 'How often does {childName} have difficulty making and keeping friends?',
    domain: 'peer_relationships',
    disorder: 'ADHD',
    skill: 'Friendship maintenance',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_peer_03',
    basePrompt: 'How often does {childName} have conflicts with peers due to impulsive behavior?',
    domain: 'peer_relationships',
    disorder: 'ADHD',
    skill: 'Peer conflict resolution',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_peer_04',
    basePrompt: 'How often does {childName} have difficulty understanding social cues or rules?',
    domain: 'peer_relationships',
    disorder: 'ADHD',
    skill: 'Social understanding',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_peer_05',
    basePrompt: 'How often does {childName} feel left out or excluded by other children?',
    domain: 'peer_relationships',
    disorder: 'ADHD',
    skill: 'Social inclusion',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_peer_06',
    basePrompt: 'How often does {childName} have difficulty cooperating in group activities or team sports?',
    domain: 'peer_relationships',
    disorder: 'ADHD',
    skill: 'Group cooperation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  // Family Relationships Domain (4 questions)
  new QuestionTemplate({
    id: 'adhd_family_01',
    basePrompt: 'How often does {childName} have difficulty following family rules or routines?',
    domain: 'family_relationships',
    disorder: 'ADHD',
    skill: 'Rule following',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_family_02',
    basePrompt: 'How often does {childName} have conflicts with siblings or family members?',
    domain: 'family_relationships',
    disorder: 'ADHD',
    skill: 'Family conflict resolution',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_family_03',
    basePrompt: 'How often does {childName} have difficulty participating in family activities or outings?',
    domain: 'family_relationships',
    disorder: 'ADHD',
    skill: 'Family participation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_family_04',
    basePrompt: 'How often does {childName} require extra supervision or assistance from parents?',
    domain: 'family_relationships',
    disorder: 'ADHD',
    skill: 'Independence',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  // Sleep and Rest Domain (4 questions)
  new QuestionTemplate({
    id: 'adhd_sleep_01',
    basePrompt: 'How often does {childName} have difficulty falling asleep at night?',
    domain: 'sleep_rest',
    disorder: 'ADHD',
    skill: 'Sleep initiation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_sleep_02',
    basePrompt: 'How often does {childName} wake up frequently during the night?',
    domain: 'sleep_rest',
    disorder: 'ADHD',
    skill: 'Sleep maintenance',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_sleep_03',
    basePrompt: 'How often does {childName} have difficulty waking up in the morning?',
    domain: 'sleep_rest',
    disorder: 'ADHD',
    skill: 'Morning routine',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_sleep_04',
    basePrompt: 'How often does {childName} appear tired or have low energy during the day?',
    domain: 'sleep_rest',
    disorder: 'ADHD',
    skill: 'Daytime energy',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  // Self-Esteem Domain (4 questions)
  new QuestionTemplate({
    id: 'adhd_self_esteem_01',
    basePrompt: 'How often does {childName} express negative feelings about themselves or their abilities?',
    domain: 'self_esteem',
    disorder: 'ADHD',
    skill: 'Self-perception',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_self_esteem_02',
    basePrompt: 'How often does {childName} give up easily when faced with challenges?',
    domain: 'self_esteem',
    disorder: 'ADHD',
    skill: 'Persistence',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_self_esteem_03',
    basePrompt: 'How often does {childName} compare themselves unfavorably to other children?',
    domain: 'self_esteem',
    disorder: 'ADHD',
    skill: 'Social comparison',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'adhd_self_esteem_04',
    basePrompt: 'How often does {childName} avoid trying new activities due to fear of failure?',
    domain: 'self_esteem',
    disorder: 'ADHD',
    skill: 'Risk-taking',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  })
];

/**
 * Autism Question Bank
 */
const AUTISM_QUESTIONS = [
  // Social Communication Domain (10 questions)
  new QuestionTemplate({
    id: 'autism_social_01',
    basePrompt: 'How often does {childName} make eye contact during conversations with family members?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Eye contact',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_social_02',
    basePrompt: 'How often does {childName} respond when you call his/her name?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Name response',
    difficulty: 1,
    type: 'SCALE',
    ageRange: { min: 1, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_social_03',
    basePrompt: 'How often does {childName} use gestures like pointing or waving along with words?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Gesture use',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 1, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_social_04',
    basePrompt: 'How often does {childName} initiate conversations or social interactions?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Social initiation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_social_05',
    basePrompt: 'How often does {childName} respond appropriately to others\' emotions or facial expressions?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Emotional recognition',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_social_06',
    basePrompt: 'How often does {childName} understand and use appropriate social greetings?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Social greetings',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_social_07',
    basePrompt: 'How often does {childName} take turns in conversations appropriately?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Conversation turn-taking',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_social_08',
    basePrompt: 'How often does {childName} share personal experiences or stories with others?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Personal sharing',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_social_09',
    basePrompt: 'How often does {childName} ask questions to learn about others or their interests?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Social curiosity',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_social_10',
    basePrompt: 'How often does {childName} use appropriate body language during social interactions?',
    domain: 'social_communication',
    disorder: 'Autism',
    skill: 'Body language',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Joint Attention Domain (8 questions)
  new QuestionTemplate({
    id: 'autism_joint_01',
    basePrompt: 'When you point at something interesting, does {childName} look where you are pointing?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Following gaze',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 1, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_02',
    basePrompt: 'Does {childName} point with one finger to show you something interesting?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Declarative pointing',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 1, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_03',
    basePrompt: 'Does {childName} bring objects to show you?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Object sharing',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 1, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_04',
    basePrompt: 'How often does {childName} look back and forth between you and an object of interest?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Shared attention',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 8 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_05',
    basePrompt: 'How often does {childName} follow your gaze or head turn to look at something?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Gaze following',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 8 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_06',
    basePrompt: 'How often does {childName} try to direct your attention to something they find interesting?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Attention directing',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 8 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_07',
    basePrompt: 'How often does {childName} respond to your attempts to share attention on an activity?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Joint activity engagement',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 8 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_joint_08',
    basePrompt: 'How often does {childName} look at you for approval or reaction during play?',
    domain: 'joint_attention',
    disorder: 'Autism',
    skill: 'Social referencing',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 2, max: 8 },
    screeningTool: 'M-CHAT'
  }),

  // Pretend Play Domain (6 questions)
  new QuestionTemplate({
    id: 'autism_pretend_01',
    basePrompt: 'Does {childName} pretend to drink from an empty cup or feed a doll?',
    domain: 'pretend_play',
    disorder: 'Autism',
    skill: 'Symbolic play',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_pretend_02',
    basePrompt: 'Does {childName} pretend with objects, like using a banana as a phone?',
    domain: 'pretend_play',
    disorder: 'Autism',
    skill: 'Object substitution',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_pretend_03',
    basePrompt: 'How often does {childName} engage in role-playing games (e.g., playing doctor, teacher)?',
    domain: 'pretend_play',
    disorder: 'Autism',
    skill: 'Role-playing',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 8 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_pretend_04',
    basePrompt: 'How often does {childName} create imaginary scenarios or stories during play?',
    domain: 'pretend_play',
    disorder: 'Autism',
    skill: 'Imaginative scenarios',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 8 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_pretend_05',
    basePrompt: 'How often does {childName} assign roles or characters to toys or play partners?',
    domain: 'pretend_play',
    disorder: 'Autism',
    skill: 'Character assignment',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 8 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_pretend_06',
    basePrompt: 'How often does {childName} engage in cooperative pretend play with other children?',
    domain: 'pretend_play',
    disorder: 'Autism',
    skill: 'Cooperative play',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 8 },
    screeningTool: 'SCQ'
  }),

  // Social Interest Domain (6 questions)
  new QuestionTemplate({
    id: 'autism_interest_01',
    basePrompt: 'Is {childName} interested in other children? Does he/she watch them or try to go to them?',
    domain: 'social_interest',
    disorder: 'Autism',
    skill: 'Peer interest',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_interest_02',
    basePrompt: 'How often does {childName} try to get your attention by looking at you and vocalizing?',
    domain: 'social_interest',
    disorder: 'Autism',
    skill: 'Attention seeking',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 1, max: 6 },
    screeningTool: 'M-CHAT'
  }),

  new QuestionTemplate({
    id: 'autism_interest_03',
    basePrompt: 'How often does {childName} show interest in joining group activities or games?',
    domain: 'social_interest',
    disorder: 'Autism',
    skill: 'Group participation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_interest_04',
    basePrompt: 'How often does {childName} seek out social interaction with family members?',
    domain: 'social_interest',
    disorder: 'Autism',
    skill: 'Family interaction',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_interest_05',
    basePrompt: 'How often does {childName} show concern for others\' feelings or well-being?',
    domain: 'social_interest',
    disorder: 'Autism',
    skill: 'Empathy',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_interest_06',
    basePrompt: 'How often does {childName} try to comfort others when they are upset?',
    domain: 'social_interest',
    disorder: 'Autism',
    skill: 'Comforting behavior',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Routine Flexibility Domain (6 questions)
  new QuestionTemplate({
    id: 'autism_routine_01',
    basePrompt: 'How often does {childName} become upset when daily routines or plans change unexpectedly?',
    domain: 'routine_flexibility',
    disorder: 'Autism',
    skill: 'Change tolerance',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_routine_02',
    basePrompt: 'How often does {childName} insist on following the same route or doing things the same way every time?',
    domain: 'routine_flexibility',
    disorder: 'Autism',
    skill: 'Routine adherence',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_routine_03',
    basePrompt: 'How often does {childName} have difficulty transitioning between different activities?',
    domain: 'routine_flexibility',
    disorder: 'Autism',
    skill: 'Activity transitions',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_routine_04',
    basePrompt: 'How often does {childName} become anxious when plans are uncertain or unclear?',
    domain: 'routine_flexibility',
    disorder: 'Autism',
    skill: 'Uncertainty tolerance',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_routine_05',
    basePrompt: 'How often does {childName} need advance notice before changes in routine?',
    domain: 'routine_flexibility',
    disorder: 'Autism',
    skill: 'Change preparation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_routine_06',
    basePrompt: 'How often does {childName} create their own rigid routines or rituals?',
    domain: 'routine_flexibility',
    disorder: 'Autism',
    skill: 'Ritual creation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Sensory Responses Domain (8 questions)
  new QuestionTemplate({
    id: 'autism_sensory_01',
    basePrompt: 'How often does {childName} seem bothered by everyday sounds like vacuum cleaners or hand dryers?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Auditory sensitivity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_02',
    basePrompt: 'How often does {childName} seem bothered by certain textures or clothing tags?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Tactile sensitivity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_03',
    basePrompt: 'How often does {childName} seem bothered by bright lights or visual stimuli?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Visual sensitivity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_04',
    basePrompt: 'How often does {childName} seek out certain sensory experiences (e.g., spinning, rocking)?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Sensory seeking',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_05',
    basePrompt: 'How often does {childName} have unusual responses to smells or tastes?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Olfactory/gustatory sensitivity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_06',
    basePrompt: 'How often does {childName} seem unaware of pain or temperature extremes?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Pain/temperature awareness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_07',
    basePrompt: 'How often does {childName} have difficulty with balance or coordination?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Proprioceptive awareness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_sensory_08',
    basePrompt: 'How often does {childName} seem overwhelmed by busy or crowded environments?',
    domain: 'sensory_responses',
    disorder: 'Autism',
    skill: 'Environmental overload',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Communication Patterns Domain (6 questions)
  new QuestionTemplate({
    id: 'autism_communication_01',
    basePrompt: 'How often does {childName} repeat words or phrases over and over in the same way?',
    domain: 'communication_patterns',
    disorder: 'Autism',
    skill: 'Echolalia',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_communication_02',
    basePrompt: 'How often does {childName} have difficulty understanding simple questions or instructions?',
    domain: 'communication_patterns',
    disorder: 'Autism',
    skill: 'Language comprehension',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_communication_03',
    basePrompt: 'How often does {childName} use unusual speech patterns or intonation?',
    domain: 'communication_patterns',
    disorder: 'Autism',
    skill: 'Speech patterns',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_communication_04',
    basePrompt: 'How often does {childName} have difficulty with conversational reciprocity?',
    domain: 'communication_patterns',
    disorder: 'Autism',
    skill: 'Conversational skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_communication_05',
    basePrompt: 'How often does {childName} take language literally or have difficulty with figurative speech?',
    domain: 'communication_patterns',
    disorder: 'Autism',
    skill: 'Literal understanding',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_communication_06',
    basePrompt: 'How often does {childName} have difficulty understanding humor or sarcasm?',
    domain: 'communication_patterns',
    disorder: 'Autism',
    skill: 'Humor comprehension',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Repetitive Behaviors Domain (6 questions)
  new QuestionTemplate({
    id: 'autism_repetitive_01',
    basePrompt: 'How often does {childName} engage in repetitive body movements (e.g., hand flapping, rocking)?',
    domain: 'repetitive_behaviors',
    disorder: 'Autism',
    skill: 'Body movements',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_repetitive_02',
    basePrompt: 'How often does {childName} line up toys or objects in a specific order?',
    domain: 'repetitive_behaviors',
    disorder: 'Autism',
    skill: 'Object ordering',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 12 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_repetitive_03',
    basePrompt: 'How often does {childName} become fixated on specific topics or interests?',
    domain: 'repetitive_behaviors',
    disorder: 'Autism',
    skill: 'Special interests',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_repetitive_04',
    basePrompt: 'How often does {childName} insist on sameness in their environment or activities?',
    domain: 'repetitive_behaviors',
    disorder: 'Autism',
    skill: 'Environmental sameness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_repetitive_05',
    basePrompt: 'How often does {childName} engage in self-stimulatory behaviors when excited or stressed?',
    domain: 'repetitive_behaviors',
    disorder: 'Autism',
    skill: 'Self-stimulation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 2, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_repetitive_06',
    basePrompt: 'How often does {childName} have difficulty stopping repetitive behaviors when asked?',
    domain: 'repetitive_behaviors',
    disorder: 'Autism',
    skill: 'Behavior control',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Emotional Regulation Domain (4 questions)
  new QuestionTemplate({
    id: 'autism_emotional_01',
    basePrompt: 'How often does {childName} have difficulty managing frustration or anger?',
    domain: 'emotional_regulation',
    disorder: 'Autism',
    skill: 'Frustration management',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_emotional_02',
    basePrompt: 'How often does {childName} have intense emotional reactions to minor events?',
    domain: 'emotional_regulation',
    disorder: 'Autism',
    skill: 'Emotional intensity',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_emotional_03',
    basePrompt: 'How often does {childName} have difficulty calming down after becoming upset?',
    domain: 'emotional_regulation',
    disorder: 'Autism',
    skill: 'Emotional recovery',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_emotional_04',
    basePrompt: 'How often does {childName} have difficulty understanding or expressing their own emotions?',
    domain: 'emotional_regulation',
    disorder: 'Autism',
    skill: 'Emotional awareness',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  // Academic and Learning Domain (4 questions)
  new QuestionTemplate({
    id: 'autism_academic_01',
    basePrompt: 'How often does {childName} have difficulty following classroom instructions or routines?',
    domain: 'academic_learning',
    disorder: 'Autism',
    skill: 'Classroom compliance',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_academic_02',
    basePrompt: 'How often does {childName} struggle with abstract concepts or problem-solving?',
    domain: 'academic_learning',
    disorder: 'Autism',
    skill: 'Abstract thinking',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_academic_03',
    basePrompt: 'How often does {childName} have difficulty with group work or collaborative learning?',
    domain: 'academic_learning',
    disorder: 'Autism',
    skill: 'Collaborative learning',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'SCQ'
  }),

  new QuestionTemplate({
    id: 'autism_academic_04',
    basePrompt: 'How often does {childName} show uneven development in different academic areas?',
    domain: 'academic_learning',
    disorder: 'Autism',
    skill: 'Academic development',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'SCQ'
  })
];

/**
 * Dyslexia Question Bank
 */
const DYSLEXIA_QUESTIONS = [
  // Phonological Awareness Domain (10 questions)
  new QuestionTemplate({
    id: 'dyslexia_phonological_01',
    basePrompt: 'Does {childName} enjoy rhyming games and can identify words that rhyme?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Rhyming ability',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_02',
    basePrompt: 'Can {childName} identify the first sound in words like "cat" or "sun"?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Sound identification',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_03',
    basePrompt: 'How well can {childName} blend sounds together to make words?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Sound blending',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_04',
    basePrompt: 'Can {childName} identify the last sound in words like "cat" or "sun"?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Final sound identification',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_05',
    basePrompt: 'How well can {childName} segment words into individual sounds?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Sound segmentation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_06',
    basePrompt: 'Can {childName} identify syllables in words like "butterfly" or "elephant"?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Syllable awareness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_07',
    basePrompt: 'How well can {childName} manipulate sounds in words (e.g., change "cat" to "bat")?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Sound manipulation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_08',
    basePrompt: 'Can {childName} identify words that start with the same sound?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Sound matching',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_09',
    basePrompt: 'How well can {childName} count the number of sounds in simple words?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Sound counting',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_phonological_10',
    basePrompt: 'Can {childName} identify words that end with the same sound?',
    domain: 'phonological_awareness',
    disorder: 'Dyslexia',
    skill: 'Ending sound matching',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  // Letter Knowledge Domain (8 questions)
  new QuestionTemplate({
    id: 'dyslexia_letter_01',
    basePrompt: 'Can {childName} recognize and name most letters of the alphabet?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Letter recognition',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 7 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_02',
    basePrompt: 'Does {childName} know what sounds most letters make?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Sound-letter correspondence',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_03',
    basePrompt: 'Can {childName} identify both uppercase and lowercase letters?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Case recognition',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 7 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_04',
    basePrompt: 'How well can {childName} write letters when given the sound?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Sound-to-letter writing',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_05',
    basePrompt: 'Can {childName} identify letters in different fonts or styles?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Font recognition',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 7 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_06',
    basePrompt: 'How well can {childName} sequence letters in alphabetical order?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Alphabetical sequencing',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 7 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_07',
    basePrompt: 'Can {childName} identify letters when they are written in different sizes?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Size variation recognition',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 7 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_letter_08',
    basePrompt: 'How well can {childName} distinguish between similar-looking letters (b/d, p/q)?',
    domain: 'letter_knowledge',
    disorder: 'Dyslexia',
    skill: 'Letter discrimination',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  // Decoding Skills Domain (8 questions)
  new QuestionTemplate({
    id: 'dyslexia_decoding_01',
    basePrompt: 'How well can {childName} sound out simple three-letter words?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Word decoding',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_02',
    basePrompt: 'How well can {childName} sound out unfamiliar words when reading?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Unfamiliar word decoding',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_03',
    basePrompt: 'How well can {childName} read words with common letter patterns (sh, ch, th)?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Digraph recognition',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 9 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_04',
    basePrompt: 'How well can {childName} read words with silent letters (knight, write)?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Silent letter recognition',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_05',
    basePrompt: 'How well can {childName} read multisyllabic words?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Multisyllabic word reading',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_06',
    basePrompt: 'How well can {childName} use context clues to figure out unknown words?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Context clue usage',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_07',
    basePrompt: 'How well can {childName} read words with prefixes and suffixes?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Affix recognition',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_decoding_08',
    basePrompt: 'How well can {childName} break down complex words into smaller parts?',
    domain: 'decoding_skills',
    disorder: 'Dyslexia',
    skill: 'Word analysis',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 11 },
    screeningTool: 'General'
  }),

  // Reading Fluency Domain (6 questions)
  new QuestionTemplate({
    id: 'dyslexia_fluency_01',
    basePrompt: 'How smoothly does {childName} read simple sentences aloud?',
    domain: 'reading_fluency',
    disorder: 'Dyslexia',
    skill: 'Oral reading fluency',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_fluency_02',
    basePrompt: 'How quickly and accurately does {childName} read grade-level passages?',
    domain: 'reading_fluency',
    disorder: 'Dyslexia',
    skill: 'Grade-level reading',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_fluency_03',
    basePrompt: 'How well does {childName} maintain reading pace without frequent pauses?',
    domain: 'reading_fluency',
    disorder: 'Dyslexia',
    skill: 'Reading pace',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_fluency_04',
    basePrompt: 'How well can {childName} read with appropriate expression and intonation?',
    domain: 'reading_fluency',
    disorder: 'Dyslexia',
    skill: 'Reading expression',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_fluency_05',
    basePrompt: 'How well can {childName} read silently at an appropriate speed?',
    domain: 'reading_fluency',
    disorder: 'Dyslexia',
    skill: 'Silent reading speed',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_fluency_06',
    basePrompt: 'How well can {childName} adjust reading speed based on text difficulty?',
    domain: 'reading_fluency',
    disorder: 'Dyslexia',
    skill: 'Speed adjustment',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  // Spelling Domain (8 questions)
  new QuestionTemplate({
    id: 'dyslexia_spelling_01',
    basePrompt: 'When {childName} tries to spell words, do the letters make sense phonetically?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Phonetic spelling',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 6, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_02',
    basePrompt: 'Can {childName} spell multi-syllabic words and use spelling rules correctly?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Complex spelling',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_03',
    basePrompt: 'How well can {childName} spell words with common patterns (ight, tion, sion)?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Pattern spelling',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_04',
    basePrompt: 'How well can {childName} remember and apply spelling rules?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Rule application',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_05',
    basePrompt: 'How well can {childName} spell homophones correctly (there/their, to/too)?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Homophone spelling',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_06',
    basePrompt: 'How well can {childName} spell words with silent letters?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Silent letter spelling',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_07',
    basePrompt: 'How well can {childName} spell words with prefixes and suffixes?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Affix spelling',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_spelling_08',
    basePrompt: 'How well can {childName} proofread and correct spelling errors?',
    domain: 'spelling_patterns',
    disorder: 'Dyslexia',
    skill: 'Spelling proofreading',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  // Reading Comprehension Domain (6 questions)
  new QuestionTemplate({
    id: 'dyslexia_comprehension_01',
    basePrompt: 'Does {childName} understand and remember what they read?',
    domain: 'reading_comprehension',
    disorder: 'Dyslexia',
    skill: 'Reading comprehension',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_comprehension_02',
    basePrompt: 'Can {childName} answer questions about stories they have read?',
    domain: 'reading_comprehension',
    disorder: 'Dyslexia',
    skill: 'Story comprehension',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_comprehension_03',
    basePrompt: 'How well can {childName} identify the main idea of a passage?',
    domain: 'reading_comprehension',
    disorder: 'Dyslexia',
    skill: 'Main idea identification',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_comprehension_04',
    basePrompt: 'How well can {childName} make predictions about what will happen next in a story?',
    domain: 'reading_comprehension',
    disorder: 'Dyslexia',
    skill: 'Prediction making',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_comprehension_05',
    basePrompt: 'How well can {childName} draw conclusions from what they have read?',
    domain: 'reading_comprehension',
    disorder: 'Dyslexia',
    skill: 'Conclusion drawing',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_comprehension_06',
    basePrompt: 'How well can {childName} summarize what they have read in their own words?',
    domain: 'reading_comprehension',
    disorder: 'Dyslexia',
    skill: 'Summarization',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  // Rapid Naming Domain (4 questions)
  new QuestionTemplate({
    id: 'dyslexia_rapid_01',
    basePrompt: 'How quickly can {childName} name familiar objects or colors when shown pictures?',
    domain: 'rapid_naming',
    disorder: 'Dyslexia',
    skill: 'Rapid naming',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_rapid_02',
    basePrompt: 'How quickly can {childName} identify letters and numbers?',
    domain: 'rapid_naming',
    disorder: 'Dyslexia',
    skill: 'Letter/number naming',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_rapid_03',
    basePrompt: 'How quickly can {childName} name common words when shown pictures?',
    domain: 'rapid_naming',
    disorder: 'Dyslexia',
    skill: 'Word naming',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  new QuestionTemplate({
    id: 'dyslexia_rapid_04',
    basePrompt: 'How quickly can {childName} switch between naming different types of items?',
    domain: 'rapid_naming',
    disorder: 'Dyslexia',
    skill: 'Naming flexibility',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 8 },
    screeningTool: 'CTOPP-2'
  }),

  // Writing Skills Domain (4 questions)
  new QuestionTemplate({
    id: 'dyslexia_writing_01',
    basePrompt: 'How well can {childName} write simple sentences with correct spelling?',
    domain: 'writing_skills',
    disorder: 'Dyslexia',
    skill: 'Sentence writing',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_writing_02',
    basePrompt: 'How well can {childName} organize their thoughts when writing?',
    domain: 'writing_skills',
    disorder: 'Dyslexia',
    skill: 'Writing organization',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_writing_03',
    basePrompt: 'How well can {childName} use punctuation and capitalization correctly?',
    domain: 'writing_skills',
    disorder: 'Dyslexia',
    skill: 'Writing mechanics',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 11 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_writing_04',
    basePrompt: 'How well can {childName} revise and edit their own writing?',
    domain: 'writing_skills',
    disorder: 'Dyslexia',
    skill: 'Writing revision',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  // Memory and Processing Domain (4 questions)
  new QuestionTemplate({
    id: 'dyslexia_memory_01',
    basePrompt: 'How well can {childName} remember sequences of letters or numbers?',
    domain: 'memory_processing',
    disorder: 'Dyslexia',
    skill: 'Sequence memory',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_memory_02',
    basePrompt: 'How well can {childName} process and remember verbal instructions?',
    domain: 'memory_processing',
    disorder: 'Dyslexia',
    skill: 'Verbal memory',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_memory_03',
    basePrompt: 'How well can {childName} remember sight words after repeated exposure?',
    domain: 'memory_processing',
    disorder: 'Dyslexia',
    skill: 'Sight word memory',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'dyslexia_memory_04',
    basePrompt: 'How well can {childName} work with information presented at a normal pace?',
    domain: 'memory_processing',
    disorder: 'Dyslexia',
    skill: 'Processing speed',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 10 },
    screeningTool: 'General'
  })
];

/**
 * General Development Question Bank
 */
const GENERAL_QUESTIONS = [
  // Motor Skills Domain (8 questions)
  new QuestionTemplate({
    id: 'general_motor_01',
    basePrompt: 'How well can {childName} complete age-appropriate self-care tasks independently?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Self-care independence',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_02',
    basePrompt: 'How well does {childName} follow directions and complete simple tasks?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Task completion',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_03',
    basePrompt: 'How well can {childName} coordinate hand and eye movements for precise tasks?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Hand-eye coordination',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_04',
    basePrompt: 'How well can {childName} maintain balance during physical activities?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Balance control',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_05',
    basePrompt: 'How well can {childName} control their body movements during sports or games?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Movement control',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_06',
    basePrompt: 'How well can {childName} use writing tools (pencils, crayons) appropriately?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Writing tool usage',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_07',
    basePrompt: 'How well can {childName} participate in physical activities with peers?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Physical participation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_08',
    basePrompt: 'How well can {childName} complete fine motor tasks like buttoning clothes or tying shoes?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Fine motor skills',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  // Emotional Regulation Domain (8 questions)
  new QuestionTemplate({
    id: 'general_emotional_01',
    basePrompt: 'How often does {childName} have difficulty managing big emotions or calming down after being upset?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Emotional control',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_02',
    basePrompt: 'How well does {childName} adapt to new situations or changes in routine?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Adaptability',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_03',
    basePrompt: 'How well can {childName} express their feelings in appropriate ways?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Emotional expression',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_04',
    basePrompt: 'How well can {childName} understand how others are feeling?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Empathy',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_05',
    basePrompt: 'How well can {childName} handle disappointment or frustration?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Frustration tolerance',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_06',
    basePrompt: 'How well can {childName} stay calm in stressful situations?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Stress management',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_07',
    basePrompt: 'How well can {childName} regulate their energy level based on the situation?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Energy regulation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_emotional_08',
    basePrompt: 'How well can {childName} recover emotionally after difficult experiences?',
    domain: 'emotional_regulation',
    disorder: 'General',
    skill: 'Emotional resilience',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  // Peer Relationships Domain (8 questions)
  new QuestionTemplate({
    id: 'general_peer_01',
    basePrompt: 'How often does {childName} successfully make and maintain friendships with children their age?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Friendship skills',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_02',
    basePrompt: 'How well does {childName} play cooperatively with other children?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Cooperative play',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_03',
    basePrompt: 'How well does {childName} resolve conflicts with peers peacefully?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Conflict resolution',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_04',
    basePrompt: 'How well does {childName} include others in their activities?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Inclusiveness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_05',
    basePrompt: 'How well does {childName} understand and follow group rules during play?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Group rule following',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_06',
    basePrompt: 'How well does {childName} share toys and materials with others?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Sharing behavior',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_07',
    basePrompt: 'How well does {childName} take turns in group activities?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Turn-taking',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_peer_08',
    basePrompt: 'How well does {childName} show empathy and concern for peers?',
    domain: 'peer_relationships',
    disorder: 'General',
    skill: 'Peer empathy',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  // Academic Performance Domain (8 questions)
  new QuestionTemplate({
    id: 'general_academic_01',
    basePrompt: 'How often does {childName} perform at grade level across different school subjects?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Grade-level performance',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_02',
    basePrompt: 'How well does {childName} complete homework assignments on time?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Homework completion',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_03',
    basePrompt: 'How well does {childName} organize their school materials and workspace?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Organization skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_04',
    basePrompt: 'How well does {childName} study and prepare for tests?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Study skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_05',
    basePrompt: 'How well does {childName} participate actively in classroom discussions?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Classroom participation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_06',
    basePrompt: 'How well does {childName} ask for help when they don\'t understand something?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Help-seeking behavior',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_07',
    basePrompt: 'How well does {childName} set academic goals and work toward them?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Goal setting',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_08',
    basePrompt: 'How well does {childName} manage their time for academic tasks?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Time management',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 18 },
    screeningTool: 'General'
  }),

  // Language Development Domain (8 questions)
  new QuestionTemplate({
    id: 'general_language_01',
    basePrompt: 'How clearly does {childName} speak compared to other children of the same age?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Speech clarity',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 2, max: 8 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_02',
    basePrompt: 'How well does {childName} understand and follow verbal instructions?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Language comprehension',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_03',
    basePrompt: 'How well does {childName} express their thoughts and ideas verbally?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Verbal expression',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_04',
    basePrompt: 'How well does {childName} use age-appropriate vocabulary?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Vocabulary usage',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_05',
    basePrompt: 'How well does {childName} use proper grammar and sentence structure?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Grammar usage',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_06',
    basePrompt: 'How well does {childName} engage in conversations with adults and peers?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Conversation skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_07',
    basePrompt: 'How well does {childName} understand figurative language and idioms?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Figurative language',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_language_08',
    basePrompt: 'How well does {childName} tell stories or describe events in sequence?',
    domain: 'language_development',
    disorder: 'General',
    skill: 'Narrative skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  // Social Skills Domain (8 questions)
  new QuestionTemplate({
    id: 'general_social_01',
    basePrompt: 'How often does {childName} show appropriate social behavior in different settings?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Social appropriateness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_02',
    basePrompt: 'How well does {childName} understand and respect personal boundaries?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Boundary understanding',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_03',
    basePrompt: 'How well does {childName} read social cues and body language?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Social cue reading',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_04',
    basePrompt: 'How well does {childName} adapt their behavior to different social situations?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Social adaptation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_05',
    basePrompt: 'How well does {childName} show respect for authority figures?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Authority respect',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_06',
    basePrompt: 'How well does {childName} handle social pressure from peers?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Peer pressure handling',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_07',
    basePrompt: 'How well does {childName} show leadership skills in group situations?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Leadership skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_08',
    basePrompt: 'How well does {childName} show cultural awareness and respect for diversity?',
    domain: 'social_skills',
    disorder: 'General',
    skill: 'Cultural awareness',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  // Cognitive Development Domain (6 questions)
  new QuestionTemplate({
    id: 'general_cognitive_01',
    basePrompt: 'How well can {childName} solve problems and think creatively?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Problem-solving',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_cognitive_02',
    basePrompt: 'How well can {childName} remember and recall information?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Memory skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_cognitive_03',
    basePrompt: 'How well can {childName} focus and maintain attention on tasks?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Attention focus',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 4, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_cognitive_04',
    basePrompt: 'How well can {childName} plan and organize their activities?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Planning skills',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_cognitive_05',
    basePrompt: 'How well can {childName} think abstractly and understand complex concepts?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Abstract thinking',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 18 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_cognitive_06',
    basePrompt: 'How well can {childName} learn from their mistakes and experiences?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Learning from experience',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 18 },
    screeningTool: 'General'
  }),

  // Self-Care and Independence Domain (4 questions)
  new QuestionTemplate({
    id: 'general_selfcare_01',
    basePrompt: 'How well can {childName} dress themselves independently?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Dressing independence',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_selfcare_02',
    basePrompt: 'How well can {childName} manage their personal hygiene routines?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Hygiene management',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_selfcare_03',
    basePrompt: 'How well can {childName} manage their belongings and keep track of their things?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Belonging management',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_selfcare_04',
    basePrompt: 'How well can {childName} make age-appropriate decisions for themselves?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Decision making',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 12 },
    screeningTool: 'General'
  }),

  // Additional questions to prevent repetition
  new QuestionTemplate({
    id: 'general_selfcare_05',
    basePrompt: 'How well can {childName} organize their daily routine and activities?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Routine organization',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_selfcare_06',
    basePrompt: 'How well can {childName} take responsibility for their own learning and homework?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Learning responsibility',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_selfcare_07',
    basePrompt: 'How well can {childName} manage their time and prioritize tasks?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Time management',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_selfcare_08',
    basePrompt: 'How well can {childName} set goals and work towards achieving them?',
    domain: 'selfcare_independence',
    disorder: 'General',
    skill: 'Goal setting',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 8, max: 12 },
    screeningTool: 'General'
  }),

  // Additional motor skills questions
  new QuestionTemplate({
    id: 'general_motor_09',
    basePrompt: 'How well can {childName} coordinate both sides of their body for activities?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Bilateral coordination',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_motor_10',
    basePrompt: 'How well can {childName} perform rhythmic movements and follow beat patterns?',
    domain: 'motor_skills',
    disorder: 'General',
    skill: 'Rhythmic movement',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  // Additional cognitive development questions
  new QuestionTemplate({
    id: 'general_cognitive_09',
    basePrompt: 'How well can {childName} understand and follow multi-step instructions?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Multi-step instruction following',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_cognitive_10',
    basePrompt: 'How well can {childName} think logically and solve problems step by step?',
    domain: 'cognitive_development',
    disorder: 'General',
    skill: 'Logical thinking',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 7, max: 12 },
    screeningTool: 'General'
  }),

  // Additional social-emotional questions
  new QuestionTemplate({
    id: 'general_social_09',
    basePrompt: 'How well can {childName} understand and respect others\' personal space?',
    domain: 'social_emotional',
    disorder: 'General',
    skill: 'Personal space awareness',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_social_10',
    basePrompt: 'How well can {childName} show empathy and understanding towards others\' feelings?',
    domain: 'social_emotional',
    disorder: 'General',
    skill: 'Empathy',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  // Additional communication questions
  new QuestionTemplate({
    id: 'general_communication_09',
    basePrompt: 'How well can {childName} use appropriate tone and volume when speaking?',
    domain: 'communication',
    disorder: 'General',
    skill: 'Voice modulation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_communication_10',
    basePrompt: 'How well can {childName} adapt their communication style for different situations?',
    domain: 'communication',
    disorder: 'General',
    skill: 'Communication adaptation',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 6, max: 12 },
    screeningTool: 'General'
  }),

  // Additional academic performance questions
  new QuestionTemplate({
    id: 'general_academic_09',
    basePrompt: 'How well can {childName} stay focused during classroom activities and lessons?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Classroom focus',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_academic_10',
    basePrompt: 'How well can {childName} participate actively in classroom discussions and activities?',
    domain: 'academic_performance',
    disorder: 'General',
    skill: 'Classroom participation',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  // Additional motor skills sub-domains
  new QuestionTemplate({
    id: 'general_gross_motor_01',
    basePrompt: 'How well can {childName} run, jump, and climb on playground equipment?',
    domain: 'gross_motor_skills',
    disorder: 'General',
    skill: 'Gross motor coordination',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_gross_motor_02',
    basePrompt: 'How well can {childName} throw and catch a ball with accuracy?',
    domain: 'gross_motor_skills',
    disorder: 'General',
    skill: 'Ball skills',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_gross_motor_03',
    basePrompt: 'How well can {childName} ride a bicycle or tricycle?',
    domain: 'gross_motor_skills',
    disorder: 'General',
    skill: 'Cycling ability',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_gross_motor_04',
    basePrompt: 'How well can {childName} skip, hop, and perform rhythmic movements?',
    domain: 'gross_motor_skills',
    disorder: 'General',
    skill: 'Rhythmic movement',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  // Additional fine motor skills
  new QuestionTemplate({
    id: 'general_fine_motor_01',
    basePrompt: 'How well can {childName} use scissors to cut along lines?',
    domain: 'fine_motor_skills',
    disorder: 'General',
    skill: 'Scissor skills',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_fine_motor_02',
    basePrompt: 'How well can {childName} build with small blocks or Legos?',
    domain: 'fine_motor_skills',
    disorder: 'General',
    skill: 'Block building',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_fine_motor_03',
    basePrompt: 'How well can {childName} string beads or complete threading activities?',
    domain: 'fine_motor_skills',
    disorder: 'General',
    skill: 'Threading skills',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 10 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_fine_motor_04',
    basePrompt: 'How well can {childName} draw recognizable shapes and figures?',
    domain: 'fine_motor_skills',
    disorder: 'General',
    skill: 'Drawing ability',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  // Additional cognitive development sub-domains
  new QuestionTemplate({
    id: 'general_memory_01',
    basePrompt: 'How well can {childName} remember and follow multi-step instructions?',
    domain: 'memory_skills',
    disorder: 'General',
    skill: 'Working memory',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_memory_02',
    basePrompt: 'How well can {childName} recall events from earlier in the day or week?',
    domain: 'memory_skills',
    disorder: 'General',
    skill: 'Episodic memory',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_memory_03',
    basePrompt: 'How well can {childName} remember names of people they meet?',
    domain: 'memory_skills',
    disorder: 'General',
    skill: 'Name recall',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_memory_04',
    basePrompt: 'How well can {childName} remember where they put their belongings?',
    domain: 'memory_skills',
    disorder: 'General',
    skill: 'Object location memory',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  // Additional problem-solving skills
  new QuestionTemplate({
    id: 'general_problem_solving_01',
    basePrompt: 'How well can {childName} figure out how to solve simple puzzles or problems?',
    domain: 'problem_solving',
    disorder: 'General',
    skill: 'Puzzle solving',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_problem_solving_02',
    basePrompt: 'How well can {childName} think of alternative solutions when something doesn\'t work?',
    domain: 'problem_solving',
    disorder: 'General',
    skill: 'Flexible thinking',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_problem_solving_03',
    basePrompt: 'How well can {childName} plan ahead for simple activities or tasks?',
    domain: 'problem_solving',
    disorder: 'General',
    skill: 'Planning ability',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_problem_solving_04',
    basePrompt: 'How well can {childName} learn from mistakes and try different approaches?',
    domain: 'problem_solving',
    disorder: 'General',
    skill: 'Learning from experience',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  // Additional social skills sub-domains
  new QuestionTemplate({
    id: 'general_empathy_01',
    basePrompt: 'How well does {childName} recognize and respond to others\' feelings?',
    domain: 'empathy_skills',
    disorder: 'General',
    skill: 'Emotional recognition',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_empathy_02',
    basePrompt: 'How well does {childName} comfort others when they are upset?',
    domain: 'empathy_skills',
    disorder: 'General',
    skill: 'Comforting behavior',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_empathy_03',
    basePrompt: 'How well does {childName} share toys or materials with others?',
    domain: 'empathy_skills',
    disorder: 'General',
    skill: 'Sharing behavior',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_empathy_04',
    basePrompt: 'How well does {childName} take turns in games or activities?',
    domain: 'empathy_skills',
    disorder: 'General',
    skill: 'Turn-taking',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  // Additional communication sub-domains
  new QuestionTemplate({
    id: 'general_listening_01',
    basePrompt: 'How well does {childName} listen attentively when others are speaking?',
    domain: 'listening_skills',
    disorder: 'General',
    skill: 'Active listening',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_listening_02',
    basePrompt: 'How well does {childName} follow conversations in group settings?',
    domain: 'listening_skills',
    disorder: 'General',
    skill: 'Group conversation following',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_listening_03',
    basePrompt: 'How well does {childName} remember details from stories or conversations?',
    domain: 'listening_skills',
    disorder: 'General',
    skill: 'Auditory memory',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_listening_04',
    basePrompt: 'How well does {childName} respond appropriately to questions or requests?',
    domain: 'listening_skills',
    disorder: 'General',
    skill: 'Appropriate responses',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  // Additional self-care sub-domains
  new QuestionTemplate({
    id: 'general_hygiene_01',
    basePrompt: 'How well can {childName} maintain personal hygiene (washing hands, brushing teeth)?',
    domain: 'hygiene_skills',
    disorder: 'General',
    skill: 'Personal hygiene',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_hygiene_02',
    basePrompt: 'How well can {childName} dress themselves appropriately for different weather?',
    domain: 'hygiene_skills',
    disorder: 'General',
    skill: 'Weather-appropriate dressing',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_hygiene_03',
    basePrompt: 'How well can {childName} organize their personal belongings and space?',
    domain: 'hygiene_skills',
    disorder: 'General',
    skill: 'Organization skills',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_hygiene_04',
    basePrompt: 'How well can {childName} clean up after themselves after activities?',
    domain: 'hygiene_skills',
    disorder: 'General',
    skill: 'Clean-up responsibility',
    difficulty: 2,
    type: 'SCALE',
    ageRange: { min: 3, max: 12 },
    screeningTool: 'General'
  }),

  // Additional emotional regulation sub-domains
  new QuestionTemplate({
    id: 'general_stress_management_01',
    basePrompt: 'How well can {childName} calm themselves down when feeling upset or frustrated?',
    domain: 'stress_management',
    disorder: 'General',
    skill: 'Self-calming',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_stress_management_02',
    basePrompt: 'How well can {childName} use breathing or relaxation techniques when needed?',
    domain: 'stress_management',
    disorder: 'General',
    skill: 'Relaxation techniques',
    difficulty: 4,
    type: 'SCALE',
    ageRange: { min: 5, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_stress_management_03',
    basePrompt: 'How well can {childName} ask for help when feeling overwhelmed?',
    domain: 'stress_management',
    disorder: 'General',
    skill: 'Help-seeking behavior',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  }),

  new QuestionTemplate({
    id: 'general_stress_management_04',
    basePrompt: 'How well can {childName} express their feelings in appropriate ways?',
    domain: 'stress_management',
    disorder: 'General',
    skill: 'Emotional expression',
    difficulty: 3,
    type: 'SCALE',
    ageRange: { min: 4, max: 12 },
    screeningTool: 'General'
  })
];

/**
 * Question Bank Manager
 */
class QuestionBankManager {
  constructor() {
    this.questionBanks = {
      adhd: ADHD_QUESTIONS,
      autism: AUTISM_QUESTIONS,
      dyslexia: DYSLEXIA_QUESTIONS,
      general: GENERAL_QUESTIONS
    };
    
    this.usedQuestions = new Map(); // Track used questions per session
    this.usedQuestionIds = new Map(); // Track used question IDs per session
  }

  /**
   * Get available questions for assessment type and age
   */
  getAvailableQuestions(assessmentType, childAge, usedDomains = []) {
    const bank = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
    
    return bank.filter(question => {
      // Check age appropriateness
      if (!question.isAgeAppropriate(childAge)) {
        return false;
      }
      
      // Check if domain has been used
      if (usedDomains.includes(question.domain)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Select next question based on assessment progress
   */
  selectNextQuestion(sessionId, assessmentType, childAge, usedDomains, childName, language = 'en') {
    // Get questions that haven't been used in this session
    const availableQuestions = this.getAvailableQuestions(assessmentType, childAge, usedDomains);
    const usedIds = this.usedQuestionIds.get(sessionId) || new Set();
    
    // Filter out questions that have already been used in this session
    const unusedQuestions = availableQuestions.filter(q => !usedIds.has(q.id));
    
    if (unusedQuestions.length === 0) {
      // Check if we've used all available questions for this assessment type
      const totalQuestions = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
      const ageAppropriateQuestions = totalQuestions.filter(q => q.isAgeAppropriate(childAge));
      
      if (usedIds.size >= ageAppropriateQuestions.length) {
        // All questions have been used, end the assessment
        console.log(`🏁 All ${ageAppropriateQuestions.length} questions have been used for session ${sessionId}. Assessment complete.`);
        return null;
      }
      
      // If no unused questions available but we haven't used all questions,
      // reset tracking and try again with different domain selection
      console.log(`🔄 No unused questions available for session ${sessionId}, resetting tracking`);
      this.usedQuestions.delete(sessionId);
      this.usedQuestionIds.delete(sessionId);
      
      // Try to select from different domains to avoid immediate repetition
      const alternativeDomains = this.getSmartDomainRotation(assessmentType, childAge, usedDomains, sessionId);
      if (alternativeDomains.length > 0) {
        return this.selectNextQuestion(sessionId, assessmentType, childAge, alternativeDomains, childName, language);
      }
      
      return this.selectNextQuestion(sessionId, assessmentType, childAge, [], childName, language);
    }

    // Select question with highest priority (based on domain coverage and difficulty)
    const selectedQuestion = this.selectOptimalQuestion(unusedQuestions, usedDomains, childAge);
    
    // Personalize the question
    const personalizedQuestion = selectedQuestion.personalize(childName, childAge, language);
    
    // Track used domains and question IDs for this session
    if (!this.usedQuestions.has(sessionId)) {
      this.usedQuestions.set(sessionId, new Set());
    }
    if (!this.usedQuestionIds.has(sessionId)) {
      this.usedQuestionIds.set(sessionId, new Set());
    }
    
    this.usedQuestions.get(sessionId).add(selectedQuestion.domain);
    this.usedQuestionIds.get(sessionId).add(selectedQuestion.id);
    
    console.log(`✅ Selected question ${selectedQuestion.id} from domain ${selectedQuestion.domain} for session ${sessionId}`);
    console.log(`📊 Session ${sessionId} has used ${this.usedQuestionIds.get(sessionId).size} questions across ${this.usedQuestions.get(sessionId).size} domains`);
    
    return personalizedQuestion;
  }

  /**
   * Select optimal question based on domain coverage and difficulty
   */
  selectOptimalQuestion(availableQuestions, usedDomains, childAge) {
    // Prioritize questions that cover new domains
    const newDomainQuestions = availableQuestions.filter(q => !usedDomains.includes(q.domain));
    
    if (newDomainQuestions.length > 0) {
      // Select from new domains, prioritizing by difficulty appropriateness
      // For General assessment, also consider domain diversity within the new domains
      if (newDomainQuestions.length > 1) {
        // Group by domain and select from the domain with fewer questions to maximize diversity
        const domainGroups = {};
        newDomainQuestions.forEach(q => {
          if (!domainGroups[q.domain]) domainGroups[q.domain] = [];
          domainGroups[q.domain].push(q);
        });
        
        // Find domain with fewest questions to maximize coverage
        const domainsByCount = Object.keys(domainGroups).sort((a, b) => 
          domainGroups[a].length - domainGroups[b].length
        );
        
        if (domainsByCount.length > 0) {
          const selectedDomain = domainsByCount[0];
          return this.selectByDifficulty(domainGroups[selectedDomain], childAge);
        }
      }
      
      return this.selectByDifficulty(newDomainQuestions, childAge);
    }
    
    // If all domains used, select by difficulty appropriateness
    return this.selectByDifficulty(availableQuestions, childAge);
  }

  /**
   * Select question by difficulty appropriateness for age
   */
  selectByDifficulty(questions, childAge) {
    const age = parseInt(childAge);
    
    // Define difficulty preferences by age
    let preferredDifficulty;
    if (age <= 5) {
      preferredDifficulty = [1, 2, 3]; // Prefer easier questions for young children
    } else if (age <= 11) {
      preferredDifficulty = [2, 3, 4]; // Balanced difficulty for school-age children
    } else {
      preferredDifficulty = [3, 4, 5]; // Prefer more challenging questions for older children
    }
    
    // Sort by preference and select
    const sortedQuestions = questions.sort((a, b) => {
      const aPreference = preferredDifficulty.indexOf(a.difficulty);
      const bPreference = preferredDifficulty.indexOf(b.difficulty);
      
      if (aPreference === -1 && bPreference === -1) return 0;
      if (aPreference === -1) return 1;
      if (bPreference === -1) return -1;
      
      return aPreference - bPreference;
    });
    
    return sortedQuestions[0];
  }

  /**
   * Clear session tracking
   */
  clearSession(sessionId) {
    this.usedQuestions.delete(sessionId);
    this.usedQuestionIds.delete(sessionId);
    console.log(`🧹 Cleared session tracking for session ${sessionId}`);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const usedDomains = this.usedQuestions.get(sessionId) || new Set();
    const usedQuestionIds = this.usedQuestionIds.get(sessionId) || new Set();
    
    return {
      usedDomains: Array.from(usedDomains),
      usedQuestionIds: Array.from(usedQuestionIds),
      totalQuestionsUsed: usedQuestionIds.size,
      totalDomainsUsed: usedDomains.size
    };
  }

  /**
   * Get question statistics
   */
  getQuestionStats() {
    const stats = {};
    
    Object.keys(this.questionBanks).forEach(disorder => {
      const questions = this.questionBanks[disorder];
      stats[disorder] = {
        total: questions.length,
        byDomain: {},
        byDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      
      questions.forEach(q => {
        // Count by domain
        if (!stats[disorder].byDomain[q.domain]) {
          stats[disorder].byDomain[q.domain] = 0;
        }
        stats[disorder].byDomain[q.domain]++;
        
        // Count by difficulty
        stats[disorder].byDifficulty[q.difficulty]++;
      });
    });
    
    return stats;
  }

  /**
   * Get alternative domains to avoid immediate repetition
   */
  getAlternativeDomains(assessmentType, childAge, usedDomains) {
    const bank = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
    const allDomains = [...new Set(bank.map(q => q.domain))];
    const availableDomains = allDomains.filter(domain => !usedDomains.includes(domain));
    
    // Return more domains to ensure better diversity
    // For General assessment, return up to 6 domains to prevent cycling too quickly
    const maxDomains = assessmentType.toLowerCase() === 'general' ? 6 : 4;
    return availableDomains.slice(0, Math.min(maxDomains, availableDomains.length));
  }

  /**
   * Get smart domain rotation to maximize diversity
   */
  getSmartDomainRotation(assessmentType, childAge, usedDomains, sessionId) {
    const bank = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
    const allDomains = [...new Set(bank.map(q => q.domain))];
    
    // If this is a reset scenario, prioritize domains that haven't been used recently
    if (usedDomains.length === 0) {
      // For General assessment, start with a diverse set of domains
      if (assessmentType.toLowerCase() === 'general') {
        const priorityDomains = [
          'motor_skills', 'cognitive_development', 'social_skills', 
          'academic_performance', 'selfcare_independence', 'emotional_regulation'
        ];
        return priorityDomains.filter(domain => allDomains.includes(domain));
      }
      return allDomains.slice(0, Math.min(4, allDomains.length));
    }
    
    // If we have used domains, prioritize unused ones
    const unusedDomains = allDomains.filter(domain => !usedDomains.includes(domain));
    
    // For General assessment, ensure we don't cycle back to recently used domains
    if (assessmentType.toLowerCase() === 'general' && unusedDomains.length > 0) {
      // Return more unused domains to prevent quick cycling
      return unusedDomains.slice(0, Math.min(6, unusedDomains.length));
    }
    
    return unusedDomains.slice(0, Math.min(4, unusedDomains.length));
  }
}

// Create singleton instance
const questionBankManager = new QuestionBankManager();

module.exports = {
  QuestionTemplate,
  QuestionBankManager,
  questionBankManager,
  ADHD_QUESTIONS,
  AUTISM_QUESTIONS,
  DYSLEXIA_QUESTIONS,
  GENERAL_QUESTIONS
};
