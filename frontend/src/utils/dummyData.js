/**
 * Dummy data for Progress Visualization and Assessment Timeline components
 */

// Sample ADHD progress data
export const dummyProgressData = {
  timelines: [
    {
      date: '2023-10-15',
      scores: {
        attention: 45,
        memory: 60,
        processing: 52,
        executive: 48,
        sensory: 65,
      },
    },
    {
      date: '2023-11-01',
      scores: {
        attention: 50,
        memory: 63,
        processing: 55,
        executive: 52,
        sensory: 68,
      },
    },
    {
      date: '2023-12-08',
      scores: {
        attention: 58,
        memory: 67,
        processing: 60,
        executive: 59,
        sensory: 70,
      },
    },
    {
      date: '2024-01-15',
      scores: {
        attention: 65,
        memory: 72,
        processing: 68,
        executive: 64,
        sensory: 73,
      },
    },
    {
      date: '2024-02-23',
      scores: {
        attention: 70,
        memory: 75,
        processing: 72,
        executive: 69,
        sensory: 75,
      },
    },
    {
      date: '2024-03-30',
      scores: {
        attention: 75,
        memory: 78,
        processing: 74,
        executive: 72,
        sensory: 78,
      },
    },
  ],
  domains: {
    attention: 75,
    memory: 78,
    processing: 74,
    executive: 72,
    sensory: 78,
  },
  currentScores: {
    attention: 75,
    memory: 78,
    processing: 74,
    executive: 72,
    sensory: 78,
  },
};

// Sample assessment timeline data
export const dummyAssessmentData = [
  {
    id: 'ass-001',
    date: '2023-09-20T10:00:00Z',
    type: 'ADHD',
    status: 'completed',
    score: 75,
    childName: 'Michael Thompson',
    notes: 'Initial assessment completed with positive progress observed in attentional control.',
    reportUrl: '/reports/adhd-001',
  },
  {
    id: 'ass-002',
    date: '2023-10-15T14:30:00Z',
    type: 'Anxiety',
    status: 'completed',
    score: 62,
    childName: 'Sarah Williams',
    notes: 'Moderate anxiety levels detected. Recommended follow-up in 2 months.',
    reportUrl: '/reports/anxiety-001',
  },
  {
    id: 'ass-003',
    date: '2023-11-05T11:00:00Z',
    type: 'Depression',
    status: 'completed',
    score: 45,
    childName: 'Michael Thompson',
    notes: 'Low risk of depression symptoms. Continue monitoring.',
    reportUrl: '/reports/depression-001',
  },
  {
    id: 'ass-004',
    date: '2023-12-20T09:15:00Z',
    type: 'ADHD',
    status: 'completed',
    score: 82,
    childName: 'Sarah Williams',
    notes: 'Follow-up assessment shows improvement in focus and attention.',
    reportUrl: '/reports/adhd-002',
  },
  {
    id: 'ass-005',
    date: '2024-01-10T13:00:00Z',
    type: 'Autism',
    status: 'completed',
    score: 35,
    childName: 'James Rodriguez',
    notes: 'Initial screening shows minimal autism spectrum indicators.',
    reportUrl: '/reports/autism-001',
  },
  {
    id: 'ass-006',
    date: '2024-02-15T15:00:00Z',
    type: 'Anxiety',
    status: 'completed',
    score: 58,
    childName: 'Sarah Williams',
    notes: 'Reduction in anxiety symptoms compared to previous assessment.',
    reportUrl: '/reports/anxiety-002',
  },
  {
    id: 'ass-007',
    date: '2024-03-01T10:30:00Z',
    type: 'ADHD',
    status: 'completed',
    score: 88,
    childName: 'Michael Thompson',
    notes: 'Significant improvement in all domains. Continue current intervention approach.',
    reportUrl: '/reports/adhd-003',
  },
  {
    id: 'ass-008',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'Autism',
    status: 'scheduled',
    childName: 'James Rodriguez',
    notes: 'Follow-up assessment to evaluate progress.',
  },
  {
    id: 'ass-009',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'ADHD',
    status: 'scheduled',
    childName: 'Sarah Williams',
    notes: 'Quarterly follow-up assessment.',
  },
  {
    id: 'ass-010',
    date: '2023-11-15T09:00:00Z',
    type: 'Depression',
    status: 'missed',
    childName: 'James Rodriguez',
    notes: 'Patient did not attend. Rescheduling required.',
  },
];

// Additional domain-specific data for ADHD
export const adhdDetailedData = {
  childName: 'Michael Thompson',
  age: 8,
  assessmentDate: '2024-03-30',
  domains: {
    attention: {
      score: 75,
      percentile: 82,
      improvement: '+10 points since last assessment',
      details: [
        { subDomain: 'Sustained Attention', score: 78 },
        { subDomain: 'Selective Attention', score: 72 },
        { subDomain: 'Divided Attention', score: 76 },
      ],
    },
    memory: {
      score: 78,
      percentile: 85,
      improvement: '+6 points since last assessment',
      details: [
        { subDomain: 'Working Memory', score: 75 },
        { subDomain: 'Short-term Memory', score: 80 },
        { subDomain: 'Long-term Memory', score: 79 },
      ],
    },
    processing: {
      score: 74,
      percentile: 80,
      improvement: '+8 points since last assessment',
      details: [
        { subDomain: 'Processing Speed', score: 72 },
        { subDomain: 'Visual Processing', score: 76 },
        { subDomain: 'Auditory Processing', score: 74 },
      ],
    },
    executive: {
      score: 72,
      percentile: 78,
      improvement: '+7 points since last assessment',
      details: [
        { subDomain: 'Planning', score: 70 },
        { subDomain: 'Organization', score: 71 },
        { subDomain: 'Self-Monitoring', score: 75 },
      ],
    },
    sensory: {
      score: 78,
      percentile: 84,
      improvement: '+5 points since last assessment',
      details: [
        { subDomain: 'Sensory Integration', score: 77 },
        { subDomain: 'Sensory Regulation', score: 80 },
        { subDomain: 'Sensory Sensitivity', score: 77 },
      ],
    },
  },
  recommendations: [
    'Continue current intervention plan focusing on attention training exercises',
    'Maintain consistent daily routines to support executive function development',
    'Consider integrating more sensory-based activities into daily schedule',
    'Follow up with cognitive assessment in 3 months to track progress',
  ],
  timeline: [
    { date: '2023-10-15', score: 45, notes: 'Initial assessment' },
    { date: '2023-12-08', score: 58, notes: 'Good improvement after 2 months' },
    { date: '2024-01-15', score: 65, notes: 'Continued progress' },
    { date: '2024-03-30', score: 75, notes: 'Excellent progress in all domains' },
  ],
};

/**
 * Generates mock child assessment data compatible with the dashboard visualization
 * @param {string} childId - Child identifier
 * @param {string} childName - Child's name
 * @param {string} assessmentType - Type of assessment (ADHD, Anxiety, etc.)
 * @returns {Array} - Array of assessment objects
 */
export const generateChildProgressData = (
  childId = 'child123',
  childName = 'Test Child',
  assessmentType = 'ADHD'
) => {
  // Generate dates for the past 6 months, one assessment per month
  const dates = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    date.setDate(15); // Middle of month
    dates.push(date);
  }

  // Create assessment objects
  const assessments = dates.map((date, index) => {
    const completedAt = date.toISOString();
    const sessionId = `session-${childId}-${index}`;

    // Increasing scores to show improvement over time
    const baseScore = 40 + index * 7; // Starts at 40, increases by 7 each month

    return {
      sessionId,
      childId,
      assessmentType,
      status: 'completed',
      completedAt,
      lastActiveAt: completedAt,
      results: {
        disorderRisk: {
          score: Math.min(10, Math.round(baseScore / 10)), // Convert to 1-10 scale
          interpretation:
            baseScore < 50 ? 'High Risk' : baseScore < 70 ? 'Moderate Risk' : 'Low Risk',
        },
        summary: `${assessmentType} assessment completed on ${date.toLocaleDateString()}. Overall score: ${baseScore}/100`,
        // Domain scores (0-10 scale, will be converted to 0-100 in the visualization component)
        scores: {
          attention: Math.min(10, (baseScore - 5 + Math.random() * 10) / 10),
          memory: Math.min(10, (baseScore + Math.random() * 10) / 10),
          processing: Math.min(10, (baseScore - 3 + Math.random() * 10) / 10),
          executive: Math.min(10, (baseScore - 2 + Math.random() * 10) / 10),
          sensory: Math.min(10, (baseScore + 2 + Math.random() * 10) / 10),
        },
      },
    };
  });

  // Add an upcoming scheduled assessment
  const futureDate = new Date(today);
  futureDate.setMonth(today.getMonth() + 1);
  futureDate.setDate(15);

  assessments.push({
    sessionId: `session-${childId}-future`,
    childId,
    assessmentType,
    status: 'scheduled',
    completedAt: null,
    lastActiveAt: futureDate.toISOString(),
    notes: 'Scheduled follow-up assessment',
  });

  return assessments;
};

/**
 * Generate data for multiple children to test dashboard functionality
 * @returns {Object} Object with child profiles and their assessment data
 */
export const generateDashboardDemoData = () => {
  // Create demo children
  const children = [
    {
      id: 'child1',
      name: 'Emily Johnson',
      age: 7,
      dob: '2017-03-12',
      gender: 'Female',
      grade: '2nd Grade',
    },
    {
      id: 'child2',
      name: 'Ethan Williams',
      age: 9,
      dob: '2015-07-24',
      gender: 'Male',
      grade: '4th Grade',
    },
    {
      id: 'child3',
      name: 'Sophie Martinez',
      age: 6,
      dob: '2018-11-05',
      gender: 'Female',
      grade: '1st Grade',
    },
  ];

  // Generate assessments for each child with different types
  const assessments = {
    child1: generateChildProgressData('child1', 'Emily Johnson', 'ADHD'),
    child2: generateChildProgressData('child2', 'Ethan Williams', 'Anxiety'),
    child3: generateChildProgressData('child3', 'Sophie Martinez', 'Autism'),
  };

  return {
    children,
    assessments,
  };
};
