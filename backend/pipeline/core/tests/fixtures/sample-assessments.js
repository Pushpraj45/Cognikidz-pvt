/**
 * Sample Assessment Fixtures
 * Provides realistic test scenarios for different assessment types
 */

const adhdHighRisk = {
  sessionId: 'session_adhd_high_risk',
  assessmentType: 'ADHD',
  formData: {
    childName: 'Emma Rodriguez',
    age: 9,
    gender: 'female',
    childId: '64f5a1b2c3d4e5f6789012350',
  },
  responses: [
    {
      questionId: 'adhd_q1',
      question: 'Does your child have difficulty paying attention to details?',
      response: 'Always',
      evaluation: {
        confidence: 0.9,
        concerns: ['Severe attention difficulties'],
        strengths: [],
        domain: 'Attention',
      },
      riskIndicators: {
        riskScore: 0.9,
        indicators: ['severe_attention_concern'],
      },
    },
    {
      questionId: 'adhd_q2',
      question: 'Does your child fidget or squirm when seated?',
      response: 'Always',
      evaluation: {
        confidence: 0.85,
        concerns: ['High hyperactivity'],
        strengths: [],
        domain: 'Hyperactivity',
      },
      riskIndicators: {
        riskScore: 0.85,
        indicators: ['high_hyperactivity'],
      },
    },
    {
      questionId: 'adhd_q3',
      question: 'Does your child have trouble organizing tasks?',
      response: 'Often',
      evaluation: {
        confidence: 0.8,
        concerns: ['Executive function difficulties'],
        strengths: [],
        domain: 'Executive Function',
      },
      riskIndicators: {
        riskScore: 0.75,
        indicators: ['executive_function_concern'],
      },
    },
  ],
  expectedResults: {
    overallRiskScore: 8.3,
    riskLevel: 'High Risk',
    primaryDomains: ['Attention', 'Hyperactivity', 'Executive Function'],
    recommendedTimeframe: 'immediate',
  },
};

const autismModerateRisk = {
  sessionId: 'session_autism_moderate_risk',
  assessmentType: 'Autism',
  formData: {
    childName: 'Michael Chen',
    age: 5,
    gender: 'male',
    childId: '64f5a1b2c3d4e5f6789012351',
  },
  responses: [
    {
      questionId: 'autism_q1',
      question: 'Does your child have difficulty with social communication?',
      response: 'Sometimes',
      evaluation: {
        confidence: 0.7,
        concerns: ['Mild social communication challenges'],
        strengths: ['Some social awareness'],
        domain: 'Social Communication',
      },
      riskIndicators: {
        riskScore: 0.5,
        indicators: ['mild_social_concern'],
      },
    },
    {
      questionId: 'autism_q2',
      question: 'Does your child engage in repetitive behaviors?',
      response: 'Often',
      evaluation: {
        confidence: 0.8,
        concerns: ['Repetitive behavior patterns'],
        strengths: [],
        domain: 'Repetitive Behaviors',
      },
      riskIndicators: {
        riskScore: 0.7,
        indicators: ['repetitive_behavior_concern'],
      },
    },
    {
      questionId: 'autism_q3',
      question: 'Does your child have sensory sensitivities?',
      response: 'Sometimes',
      evaluation: {
        confidence: 0.6,
        concerns: ['Mild sensory processing differences'],
        strengths: [],
        domain: 'Sensory Processing',
      },
      riskIndicators: {
        riskScore: 0.4,
        indicators: ['mild_sensory_concern'],
      },
    },
  ],
  expectedResults: {
    overallRiskScore: 5.3,
    riskLevel: 'Moderate Risk',
    primaryDomains: ['Repetitive Behaviors', 'Social Communication'],
    recommendedTimeframe: '2-4 months',
  },
};

const dyslexiaLowRisk = {
  sessionId: 'session_dyslexia_low_risk',
  assessmentType: 'Dyslexia',
  formData: {
    childName: 'Sophie Williams',
    age: 8,
    gender: 'female',
    childId: '64f5a1b2c3d4e5f6789012352',
  },
  responses: [
    {
      questionId: 'dyslexia_q1',
      question: 'Does your child have difficulty with reading fluency?',
      response: 'Sometimes',
      evaluation: {
        confidence: 0.6,
        concerns: ['Mild reading challenges'],
        strengths: ['Good comprehension when read to'],
        domain: 'Reading',
      },
      riskIndicators: {
        riskScore: 0.4,
        indicators: ['mild_reading_concern'],
      },
    },
    {
      questionId: 'dyslexia_q2',
      question: 'Does your child confuse similar letters?',
      response: 'Never',
      evaluation: {
        confidence: 0.8,
        concerns: [],
        strengths: ['Good letter recognition'],
        domain: 'Letter Recognition',
      },
      riskIndicators: {
        riskScore: 0.1,
        indicators: [],
      },
    },
    {
      questionId: 'dyslexia_q3',
      question: 'Does your child have difficulty with spelling?',
      response: 'Sometimes',
      evaluation: {
        confidence: 0.5,
        concerns: ['Age-appropriate spelling challenges'],
        strengths: ['Shows effort in spelling'],
        domain: 'Spelling',
      },
      riskIndicators: {
        riskScore: 0.3,
        indicators: ['mild_spelling_concern'],
      },
    },
  ],
  expectedResults: {
    overallRiskScore: 2.7,
    riskLevel: 'Low Risk',
    primaryDomains: ['Reading'],
    recommendedTimeframe: '6 months',
  },
};

const incompleteAssessment = {
  sessionId: 'session_incomplete',
  assessmentType: 'ADHD',
  formData: {
    childName: 'Alex Johnson',
    age: 7,
    gender: 'male',
    childId: '64f5a1b2c3d4e5f6789012345',
  },
  responses: [
    {
      questionId: 'adhd_q1',
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
        indicators: ['attention_concern'],
      },
    },
  ],
  expectedResults: {
    status: 'incomplete',
    message: 'Assessment needs more responses for reliable results',
    minimumRequiredResponses: 3,
  },
};

const errorScenarios = {
  invalidAssessmentType: {
    sessionId: 'session_invalid_type',
    assessmentType: 'INVALID_TYPE',
    formData: {},
    responses: [],
    expectedError: 'Invalid assessment type',
  },
  
  missingFormData: {
    sessionId: 'session_missing_data',
    assessmentType: 'ADHD',
    formData: null,
    responses: [],
    expectedError: 'Form data is required',
  },

  emptyResponses: {
    sessionId: 'session_empty_responses',
    assessmentType: 'ADHD',
    formData: {
      childName: 'Test Child',
      age: 7,
    },
    responses: [],
    expectedError: 'No responses provided',
  },
};

const performanceScenarios = {
  largeAssessment: {
    sessionId: 'session_large_assessment',
    assessmentType: 'ADHD',
    formData: {
      childName: 'Performance Test Child',
      age: 10,
      gender: 'male',
      childId: '64f5a1b2c3d4e5f6789012399',
    },
    responses: Array.from({ length: 50 }, (_, i) => ({
      questionId: `perf_q${i + 1}`,
      question: `Performance test question ${i + 1}`,
      response: i % 4 === 0 ? 'Always' : i % 4 === 1 ? 'Often' : i % 4 === 2 ? 'Sometimes' : 'Never',
      evaluation: {
        confidence: 0.7 + (Math.random() * 0.3),
        concerns: i % 3 === 0 ? [`Concern ${i + 1}`] : [],
        strengths: i % 5 === 0 ? [`Strength ${i + 1}`] : [],
        domain: ['Attention', 'Hyperactivity', 'Executive Function'][i % 3],
      },
      riskIndicators: {
        riskScore: Math.random(),
        indicators: i % 4 === 0 ? [`indicator_${i + 1}`] : [],
      },
    })),
    expectedResults: {
      processingTime: '<5000ms',
      memoryUsage: '<100MB',
    },
  },
};

module.exports = {
  adhdHighRisk,
  autismModerateRisk,
  dyslexiaLowRisk,
  incompleteAssessment,
  errorScenarios,
  performanceScenarios,
}; 