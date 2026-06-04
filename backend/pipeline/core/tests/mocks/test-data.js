/**
 * Test Data Mocks
 * Provides standardized test data for assessment pipeline testing
 */

const mockChildProfile = {
  _id: '64f5a1b2c3d4e5f6789012345',
  firstName: 'Alex',
  lastName: 'Johnson',
  age: 7,
  gender: 'male',
  dateOfBirth: new Date('2017-03-15'),
};

const mockIntake = {
  _id: '64f5a1b2c3d4e5f6789012346',
  childId: '64f5a1b2c3d4e5f6789012345',
  childName: 'Alex Johnson',
  age: 7,
  gender: 'male',
  grade: '2nd Grade',
  schoolName: 'Maple Elementary',
  parentName: 'Sarah Johnson',
  parentEmail: 'sarah.johnson@email.com',
  primaryConcerns: 'Attention and focus difficulties in classroom',
  familyHistory: 'Father has ADHD',
  attentionLevel: 2,
  emotionRegulation: 'Difficulty managing frustration',
  peerInteraction: 'Generally positive with peers',
  routineTransitions: 'Struggles with transitions',
  readingLevel: 'At grade level',
  mathDifficulties: 'Some difficulty with word problems',
  memoryDirections: 'Needs instructions repeated',
  areasOfStrength: 'Creative, good with hands-on activities',
  motivators: 'Praise, movement breaks, visual aids',
  homeEnvironment: 'Stable, supportive',
  screenTime: '2 hours per day',
};

const mockFormData = {
  childName: 'Alex Johnson',
  age: 7,
  gender: 'male',
  childId: '64f5a1b2c3d4e5f6789012345',
  intake: mockIntake,
  ...mockIntake,
};

const mockAssessmentState = {
  sessionId: 'session_1703680000000_1234_0_abc123def',
  assessmentType: 'ADHD',
  formData: mockFormData,
  intakeId: '64f5a1b2c3d4e5f6789012346',
  childId: '64f5a1b2c3d4e5f6789012345',
  userId: '64f5a1b2c3d4e5f6789012347',
  startedAt: '2024-12-27T10:00:00.000Z',
  completedAt: '2024-12-27T10:15:00.000Z',
  status: 'active',
  questions: [
    {
      id: 'q1',
      question: 'Does your child have difficulty paying attention to details?',
      type: 'multiple-choice',
      options: ['Never', 'Sometimes', 'Often', 'Always'],
      difficulty: 3,
    },
    {
      id: 'q2',
      question: 'Does your child have trouble organizing tasks and activities?',
      type: 'multiple-choice',
      options: ['Never', 'Sometimes', 'Often', 'Always'],
      difficulty: 3,
    },
  ],
  responses: [
    {
      questionId: 'q1',
      question: 'Does your child have difficulty paying attention to details?',
      response: 'Often',
      evaluation: {
        confidence: 0.8,
        concerns: ['Attention difficulties'],
        strengths: [],
        domain: 'Attention',
      },
      riskIndicators: {
        riskScore: 0.7,
        indicators: ['high_attention_concern'],
      },
      processedAt: '2024-12-27T10:05:00.000Z',
    },
    {
      questionId: 'q2',
      question: 'Does your child have trouble organizing tasks and activities?',
      response: 'Sometimes',
      evaluation: {
        confidence: 0.6,
        concerns: ['Mild organization difficulties'],
        strengths: [],
        domain: 'Executive Function',
      },
      riskIndicators: {
        riskScore: 0.4,
        indicators: ['mild_executive_concern'],
      },
      processedAt: '2024-12-27T10:10:00.000Z',
    },
  ],
  currentQuestionIndex: 2,
  currentQuestion: {
    id: 'q3',
    question: 'Does your child fidget or squirm when seated?',
    type: 'multiple-choice',
    options: ['Never', 'Sometimes', 'Often', 'Always'],
    difficulty: 3,
  },
};

const mockAIResponse = {
  choices: [
    {
      message: {
        content: `# Assessment Summary Report for Alex Johnson

## Assessment Overview
Alex Johnson, age 7, has completed an ADHD assessment with 2 questions. Based on the responses, there are some indicators of attention difficulties that warrant further monitoring. The assessment shows a risk score of 6/10.

## Strengths and Positive Indicators
- Creative thinking and problem-solving abilities
- Good social interaction with peers
- Responds well to positive reinforcement
- Shows engagement in hands-on learning activities

## Areas Requiring Attention
- Attention to detail needs improvement
- Organizational skills require development
- May benefit from structured routines
- Consider classroom accommodations

## Specific Recommendations
- Implement visual schedules and reminders
- Provide movement breaks during learning
- Consider consultation with school counselor
- Monitor progress with structured activities

## Follow-Up Schedule
- Schedule follow-up assessment in 3 months
- Monitor classroom behavior weekly
- Implement recommended strategies for 6 weeks`
      }
    }
  ]
};

const mockDomainScores = [
  {
    domain: 'Attention',
    score: 6,
    description: 'Ability to focus and sustain attention',
  },
  {
    domain: 'Hyperactivity',
    score: 4,
    description: 'Activity level and impulse control',
  },
  {
    domain: 'Executive Function',
    score: 5,
    description: 'Planning and organization skills',
  },
];

const mockFollowUpSchedule = {
  recommendedDate: '2025-03-27',
  focus: 'Professional consultation for ADHD monitoring and support',
  urgency: 'moderate',
  timeframe: '2-4 months',
  riskLevel: 'Moderate Risk',
};

const mockChartsData = {
  timeline: [
    { question: 1, confidence: 8, difficulty: 3 },
    { question: 2, confidence: 6, difficulty: 3 },
  ],
  riskDistribution: [
    { category: 'Moderate Risk', value: 100, color: '#f59e0b' },
  ],
  overallScore: 6,
  completionRate: 100,
};

const mockKeyFindings = {
  concerns: ['Attention difficulties', 'Mild organization difficulties'],
  strengths: ['Creative thinking', 'Good social skills'],
  redFlags: [],
  totalResponses: 2,
};

const mockValidationData = {
  valid: {
    assessmentType: 'ADHD',
    formData: mockFormData,
    userId: '64f5a1b2c3d4e5f6789012347',
  },
  invalid: {
    missing: {},
    wrongType: {
      assessmentType: 123,
      formData: 'not an object',
    },
    invalidAssessmentType: {
      assessmentType: 'INVALID_TYPE',
      formData: mockFormData,
    },
  },
};

module.exports = {
  mockChildProfile,
  mockIntake,
  mockFormData,
  mockAssessmentState,
  mockAIResponse,
  mockDomainScores,
  mockFollowUpSchedule,
  mockChartsData,
  mockKeyFindings,
  mockValidationData,
}; 