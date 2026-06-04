/**
 * Chart Generator Utilities
 * Functions for generating chart data for visualization
 */

/**
 * Generate charts data for visualization
 * @param {Object} state - Assessment state object
 * @returns {Object} - Chart data object with timeline, risk distribution, etc.
 */
function generateChartsData(state) {
  const abilityScore = Math.min(
    10,
    Math.max(1, Math.round(Math.abs(state.abilityEstimate) * 2.5) + 1)
  );

  // Generate timeline data (progress over questions)
  const timelineData = state.responses.map((response, index) => ({
    question: index + 1,
    confidence: Math.max(
      1,
      Math.min(10, abilityScore + Math.floor(Math.random() * 4) - 2)
    ),
    difficulty: state.questions[index]?.difficulty || 3,
  }));

  // Generate risk distribution data
  const riskDistribution = [
    {
      category: "Low Risk",
      value: abilityScore <= 3 ? 100 : 0,
      color: "#10b981",
    },
    {
      category: "Moderate Risk",
      value: abilityScore > 3 && abilityScore <= 7 ? 100 : 0,
      color: "#f59e0b",
    },
    {
      category: "High Risk",
      value: abilityScore > 7 ? 100 : 0,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  return {
    timeline: timelineData,
    riskDistribution,
    overallScore: abilityScore,
    completionRate: (state.responses.length / state.questions.length) * 100,
  };
}

/**
 * Generate domain comparison chart data
 * @param {Array<Object>} domainScores - Array of domain score objects
 * @returns {Object} - Domain comparison chart data
 */
function generateDomainComparisonChart(domainScores) {
  return {
    labels: domainScores.map(domain => domain.domain),
    datasets: [{
      label: 'Domain Scores',
      data: domainScores.map(domain => domain.score),
      backgroundColor: domainScores.map(domain => {
        if (domain.score <= 3) return '#10b981'; // Green for low risk
        if (domain.score <= 7) return '#f59e0b'; // Yellow for moderate risk
        return '#ef4444'; // Red for high risk
      }),
      borderColor: '#374151',
      borderWidth: 1
    }]
  };
}

/**
 * Generate progress timeline chart data
 * @param {Array<Object>} responses - Array of response objects
 * @param {Array<Object>} questions - Array of question objects
 * @returns {Object} - Progress timeline chart data
 */
function generateProgressTimelineChart(responses, questions) {
  const timelineData = responses.map((response, index) => {
    const question = questions[index];
    return {
      x: index + 1,
      y: response.score || 0,
      difficulty: question?.difficulty || 3,
      timestamp: response.timestamp || new Date().toISOString()
    };
  });

  return {
    labels: timelineData.map((_, index) => `Q${index + 1}`),
    datasets: [{
      label: 'Response Scores',
      data: timelineData.map(point => point.y),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }, {
      label: 'Question Difficulty',
      data: timelineData.map(point => point.difficulty),
      borderColor: '#6b7280',
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      tension: 0.4,
      fill: false,
      borderDash: [5, 5]
    }]
  };
}

/**
 * Generate risk level pie chart data
 * @param {number} riskScore - Overall risk score (1-10)
 * @returns {Object} - Risk level pie chart data
 */
function generateRiskLevelPieChart(riskScore) {
  let riskLevel, color;
  
  if (riskScore <= 3) {
    riskLevel = 'Low Risk';
    color = '#10b981';
  } else if (riskScore <= 7) {
    riskLevel = 'Moderate Risk';
    color = '#f59e0b';
  } else {
    riskLevel = 'High Risk';
    color = '#ef4444';
  }

  return {
    labels: [riskLevel, 'Assessment Complete'],
    datasets: [{
      data: [riskScore, 10 - riskScore],
      backgroundColor: [color, '#e5e7eb'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2
    }]
  };
}

/**
 * Generate assessment completion chart data
 * @param {number} completedQuestions - Number of completed questions
 * @param {number} totalQuestions - Total number of questions
 * @returns {Object} - Assessment completion chart data
 */
function generateCompletionChart(completedQuestions, totalQuestions) {
  const completionPercentage = (completedQuestions / totalQuestions) * 100;
  
  return {
    labels: ['Completed', 'Remaining'],
    datasets: [{
      data: [completedQuestions, totalQuestions - completedQuestions],
      backgroundColor: ['#10b981', '#e5e7eb'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2
    }],
    completionPercentage: Math.round(completionPercentage)
  };
}

/**
 * Generate age-appropriate milestone chart data
 * @param {number} childAge - Child's age in years
 * @param {Array<Object>} responses - Array of response objects
 * @returns {Object} - Milestone chart data
 */
function generateMilestoneChart(childAge, responses) {
  // Define age-appropriate milestones
  const milestones = {
    2: ['Social Smiling', 'Following Objects', 'Responding to Name'],
    3: ['Pretend Play', 'Two-Word Phrases', 'Parallel Play'],
    4: ['Cooperative Play', 'Complete Sentences', 'Following Rules'],
    5: ['Peer Friendships', 'Complex Narratives', 'Self-Regulation'],
    6: ['Academic Readiness', 'Problem Solving', 'Independence']
  };

  const ageGroup = Math.min(6, Math.max(2, Math.floor(childAge)));
  const relevantMilestones = milestones[ageGroup] || milestones[6];
  
  // Calculate milestone achievement based on responses
  const achievementScores = relevantMilestones.map((milestone, index) => {
    const relatedResponses = responses.filter((_, responseIndex) => 
      responseIndex % relevantMilestones.length === index
    );
    
    if (relatedResponses.length === 0) return 50; // Default neutral score
    
    const avgScore = relatedResponses.reduce((sum, response) => 
      sum + (response.score || 5), 0) / relatedResponses.length;
    
    return Math.round(avgScore * 10); // Convert to percentage
  });

  return {
    labels: relevantMilestones,
    datasets: [{
      label: 'Milestone Achievement',
      data: achievementScores,
      backgroundColor: achievementScores.map(score => {
        if (score >= 70) return '#10b981'; // Green for achieved
        if (score >= 40) return '#f59e0b'; // Yellow for emerging
        return '#ef4444'; // Red for concern
      }),
      borderColor: '#374151',
      borderWidth: 1
    }]
  };
}

module.exports = {
  generateChartsData,
  generateDomainComparisonChart,
  generateProgressTimelineChart,
  generateRiskLevelPieChart,
  generateCompletionChart,
  generateMilestoneChart
}; 