const { OpenAI } = require('openai');

/**
 * Progress Analysis Service
 * Analyzes assessment reports to provide progress insights using LLM
 */
class ProgressAnalysisService {
  constructor() {
    // Use Azure OpenAI configuration
    this.openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
      defaultQuery: { "api-version": "2023-12-01-preview" },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    });
    this.model = process.env.AZURE_DEPLOYMENT_NAME;
  }

  /**
   * Analyze progress from assessment report using LLM
   * @param {Object} assessmentReport - The assessment report data
   * @param {Object} childProfile - The child's profile data
   * @returns {Object} Progress analysis data
   */
  static async analyzeProgressFromReport(assessmentReport, childProfile = {}) {
    try {
      console.log('🤖 Analyzing progress from assessment report using LLM');

      // Check Azure OpenAI configuration
      if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_DEPLOYMENT_NAME) {
        console.warn('⚠️ Azure OpenAI not configured properly');
        throw new Error('Azure OpenAI configuration missing');
      }

      const service = new ProgressAnalysisService();
      const prompt = service.buildProgressAnalysisPrompt(assessmentReport, childProfile);
      const systemPrompt = service.getSystemPrompt();

      const completion = await service.openai.chat.completions.create({
        model: service.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      console.log('✅ Progress analysis completed successfully');
      return response;

    } catch (error) {
      console.error('❌ Error analyzing progress from report:', error);
      if (error.message.includes('Azure OpenAI')) {
        console.error('💡 Azure OpenAI Configuration Help:');
        console.error('- AZURE_OPENAI_API_KEY: Set your Azure OpenAI API key');
        console.error('- AZURE_OPENAI_ENDPOINT: Set your Azure OpenAI endpoint');
        console.error('- AZURE_DEPLOYMENT_NAME: Set your Azure OpenAI deployment name');
      }
      
      // Fallback to basic analysis if LLM fails
      return this.fallbackAnalysis(assessmentReport, childProfile);
    }
  }

  /**
   * Get system prompt for progress analysis
   */
  getSystemPrompt() {
    return `You are a child development specialist and educational psychologist with expertise in analyzing assessment progress. You analyze assessment reports to provide detailed progress insights with comprehensive chart data and meaningful goals.

Your analysis should be:
- Supportive and encouraging while being honest about progress
- Written for parents and educators (not clinical professionals)
- Actionable with specific next steps
- Focused on the child's growth and development
- Age-appropriate in language and expectations
- Generate meaningful scores (minimum 40% for any domain, avoid 0% scores)

Always respond with valid JSON in this format:

{
  "overallProgress": {
    "score": 75,
    "level": "good",
    "description": "Brief description of overall progress",
    "totalGoals": 25,
    "goalsAchieved": 8,
    "averageProgress": 75,
    "nearCompletion": 5
  },
  "goals": {
    "Social Communication Goals": {
      "title": "Social Communication Development",
      "description": "Improve social interaction and communication skills",
      "subgoals": [
        {
          "id": "sc_1",
          "title": "Eye Contact",
          "description": "Maintain appropriate eye contact during conversations",
          "completed": true,
          "priority": "high"
        },
        {
          "id": "sc_2", 
          "title": "Turn Taking",
          "description": "Practice taking turns in conversations and games",
          "completed": false,
          "priority": "medium"
        },
        {
          "id": "sc_3",
          "title": "Peer Interaction",
          "description": "Engage in positive interactions with peers",
          "completed": true,
          "priority": "high"
        },
        {
          "id": "sc_4",
          "title": "Emotional Recognition",
          "description": "Recognize and respond to others' emotions",
          "completed": false,
          "priority": "medium"
        },
        {
          "id": "sc_5",
          "title": "Group Activities",
          "description": "Participate actively in group activities",
          "completed": false,
          "priority": "low"
        }
      ]
    },
    "Sensory Processing Goals": {
      "title": "Sensory Processing Skills",
      "description": "Develop better sensory integration and processing",
      "subgoals": [
        {
          "id": "sp_1",
          "title": "Sensory Awareness",
          "description": "Recognize and respond to different sensory inputs",
          "completed": false,
          "priority": "medium"
        },
        {
          "id": "sp_2",
          "title": "Sensory Regulation",
          "description": "Learn to self-regulate sensory responses",
          "completed": false,
          "priority": "high"
        },
        {
          "id": "sp_3",
          "title": "Tactile Sensitivity",
          "description": "Improve tolerance to different textures",
          "completed": true,
          "priority": "medium"
        },
        {
          "id": "sp_4",
          "title": "Auditory Processing",
          "description": "Better process and respond to sounds",
          "completed": false,
          "priority": "high"
        },
        {
          "id": "sp_5",
          "title": "Visual Processing",
          "description": "Improve visual attention and tracking",
          "completed": false,
          "priority": "low"
        }
      ]
    },
    "Behavioral Regulation Goals": {
      "title": "Behavioral Regulation Skills",
      "description": "Develop self-control and emotional regulation",
      "subgoals": [
        {
          "id": "br_1",
          "title": "Impulse Control",
          "description": "Learn to wait and control immediate reactions",
          "completed": true,
          "priority": "high"
        },
        {
          "id": "br_2",
          "title": "Emotional Regulation",
          "description": "Manage emotions appropriately",
          "completed": false,
          "priority": "high"
        },
        {
          "id": "br_3",
          "title": "Routine Following",
          "description": "Follow daily routines consistently",
          "completed": true,
          "priority": "medium"
        },
        {
          "id": "br_4",
          "title": "Transitions",
          "description": "Handle transitions between activities smoothly",
          "completed": false,
          "priority": "medium"
        },
        {
          "id": "br_5",
          "title": "Self-Monitoring",
          "description": "Monitor and adjust own behavior",
          "completed": false,
          "priority": "low"
        }
      ]
    },
    "Cognitive Development Goals": {
      "title": "Cognitive Development Skills",
      "description": "Enhance thinking, learning, and problem-solving abilities",
      "subgoals": [
        {
          "id": "cd_1",
          "title": "Attention Span",
          "description": "Maintain focus on tasks for longer periods",
          "completed": false,
          "priority": "high"
        },
        {
          "id": "cd_2",
          "title": "Memory Skills",
          "description": "Improve short-term and working memory",
          "completed": true,
          "priority": "medium"
        },
        {
          "id": "cd_3",
          "title": "Problem Solving",
          "description": "Develop logical thinking and problem-solving skills",
          "completed": false,
          "priority": "medium"
        },
        {
          "id": "cd_4",
          "title": "Sequencing",
          "description": "Understand and follow step-by-step instructions",
          "completed": false,
          "priority": "low"
        },
        {
          "id": "cd_5",
          "title": "Abstract Thinking",
          "description": "Develop higher-order thinking skills",
          "completed": false,
          "priority": "low"
        }
      ]
    },
    "Language Development Goals": {
      "title": "Language and Communication Skills",
      "description": "Improve verbal and non-verbal communication",
      "subgoals": [
        {
          "id": "ld_1",
          "title": "Vocabulary Expansion",
          "description": "Learn and use new words regularly",
          "completed": true,
          "priority": "medium"
        },
        {
          "id": "ld_2",
          "title": "Sentence Structure",
          "description": "Form complete and grammatically correct sentences",
          "completed": false,
          "priority": "medium"
        },
        {
          "id": "ld_3",
          "title": "Conversation Skills",
          "description": "Engage in meaningful conversations",
          "completed": false,
          "priority": "high"
        },
        {
          "id": "ld_4",
          "title": "Non-verbal Communication",
          "description": "Understand and use gestures and body language",
          "completed": true,
          "priority": "low"
        },
        {
          "id": "ld_5",
          "title": "Storytelling",
          "description": "Retell events and create simple stories",
          "completed": false,
          "priority": "low"
        }
      ]
    }
  },
  "domains": {
    "Social Communication": {
      "currentScore": 80,
      "goal": 85,
      "progress": 94,
      "remaining": 5,
      "status": "near_completion",
      "insights": "Strong social communication skills with room for improvement in peer interactions",
      "recommendations": ["Practice turn-taking in conversations", "Engage in group activities"],
      "trend": "improving"
    },
    "Sensory Processing": {
      "currentScore": 65,
      "goal": 80,
      "progress": 81,
      "remaining": 15,
      "status": "in_progress",
      "insights": "Moderate sensory processing skills, needs continued support",
      "recommendations": ["Sensory integration activities", "Environmental adaptations"],
      "trend": "improving"
    },
    "Behavioral Regulation": {
      "currentScore": 70,
      "goal": 80,
      "progress": 88,
      "remaining": 10,
      "status": "near_completion",
      "insights": "Good behavioral regulation with some areas for improvement",
      "recommendations": ["Consistent routines", "Positive reinforcement"],
      "trend": "stable"
    },
    "Communication": {
      "currentScore": 60,
      "goal": 80,
      "progress": 75,
      "remaining": 20,
      "status": "in_progress",
      "insights": "Developing communication skills with good potential",
      "recommendations": ["Practice conversation skills", "Read together regularly"],
      "trend": "improving"
    },
    "General Development": {
      "currentScore": 70,
      "goal": 80,
      "progress": 88,
      "remaining": 10,
      "status": "in_progress",
      "insights": "Overall development progressing well",
      "recommendations": ["Continue current activities", "Monitor progress regularly"],
      "trend": "improving"
    }
  },
  "chartData": {
    "pieChart": [
      { "name": "Completed", "value": 2, "color": "#10B981" },
      { "name": "Near Completion", "value": 2, "color": "#F59E0B" },
      { "name": "In Progress", "value": 1, "color": "#3B82F6" }
    ],
    "barChart": [
      { "domain": "Social Communication", "score": 80, "goal": 85 },
      { "domain": "Sensory Processing", "score": 65, "goal": 80 },
      { "domain": "Behavioral Regulation", "score": 70, "goal": 80 },
      { "domain": "Communication", "score": 60, "goal": 80 },
      { "domain": "General Development", "score": 70, "goal": 80 }
    ],
    "radarChart": [
      { "domain": "Social Communication", "score": 80 },
      { "domain": "Sensory Processing", "score": 65 },
      { "domain": "Behavioral Regulation", "score": 70 },
      { "domain": "Communication", "score": 60 },
      { "domain": "General Development", "score": 70 }
    ],
    "timelineData": [
      {
        "date": "2025-08-01",
        "overallScore": 70,
        "domains": {
          "Social Communication": 75,
          "Sensory Processing": 60,
          "Behavioral Regulation": 65
        }
      },
      {
        "date": "2025-08-08",
        "overallScore": 75,
        "domains": {
          "Social Communication": 80,
          "Sensory Processing": 65,
          "Behavioral Regulation": 70
        }
      }
    ]
  },
  "learningInsights": {
    "topPerformingDomain": "Social Communication",
    "topPerformingScore": 80,
    "needsAttention": "Sensory Processing",
    "needsAttentionScore": 65,
    "keyStrengths": ["Strong social skills", "Good communication", "Improving behavior"],
    "areasForImprovement": ["Sensory processing", "Focus and attention"]
  },
  "strengths": [
    {
      "area": "Social Communication",
      "description": "Excellent social interaction skills"
    },
    {
      "area": "Behavioral Regulation",
      "description": "Good self-control and emotional regulation"
    }
  ],
  "improvementAreas": [
    {
      "area": "Sensory Processing",
      "priority": "medium",
      "description": "Needs support with sensory integration"
    }
  ],
  "recommendations": [
    {
      "type": "activity",
      "title": "Sensory Integration Activities",
      "description": "Engage in activities that help with sensory processing"
    },
    {
      "type": "routine",
      "title": "Consistent Daily Routines",
      "description": "Establish predictable daily schedules"
    }
  ],
  "nextSteps": [
    {
      "action": "Continue sensory activities",
      "timeline": "Daily",
      "description": "Practice sensory integration exercises"
    },
    {
      "action": "Monitor social progress",
      "timeline": "Weekly",
      "description": "Track improvements in peer interactions"
    }
  ],
  "riskLevel": "low",
  "confidence": 0.85
}`;
  }

  /**
   * Build prompt for progress analysis
   */
  buildProgressAnalysisPrompt(assessmentReport, childProfile) {
    const childInfo = childProfile ? `
Child Information:
- Name: ${childProfile.firstName || 'Unknown'}
- Age: ${childProfile.age || 'Unknown'}
- Gender: ${childProfile.gender || 'Unknown'}
` : '';

    const reportInfo = `
Assessment Report Data:
${JSON.stringify(assessmentReport, null, 2)}

${childInfo}

Please analyze this assessment report and provide detailed progress insights. Consider:
1. Overall progress trends
2. Domain-specific improvements or concerns
3. Child's strengths and areas for growth
4. Specific recommendations for next steps
5. Risk assessment based on the data

Focus on providing actionable insights that parents and educators can use to support the child's development.`;
  }

  /**
   * Fallback analysis when LLM is not available
   */
  static fallbackAnalysis(assessmentReport, childProfile = {}) {
    console.log('🔄 Using fallback analysis (LLM not available)');
    
    const progressData = {
      overallProgress: {
        score: this.calculateOverallScore(assessmentReport),
        level: this.getProgressLevel(this.calculateOverallScore(assessmentReport)),
        description: "Basic progress analysis completed"
      },
      domainProgress: this.extractDomainProgress(assessmentReport),
      strengths: this.identifyStrengths(assessmentReport),
      improvementAreas: this.identifyImprovementAreas(assessmentReport),
      recommendations: this.extractRecommendations(assessmentReport),
      nextSteps: this.generateBasicNextSteps(assessmentReport),
      riskLevel: this.assessRiskLevel(assessmentReport),
      confidence: 0.6
    };

    return progressData;
  }

  /**
   * Calculate overall score from assessment report
   * @param {Object} report - Assessment report
   * @returns {number} Overall score (0-100)
   */
  static calculateOverallScore(report) {
    if (!report || !report.scores) {
      return 0;
    }

    const scores = Object.values(report.scores).filter(score => 
      typeof score === 'number' && !isNaN(score)
    );

    if (scores.length === 0) {
      return 0;
    }

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Get progress level based on score
   */
  static getProgressLevel(score) {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'needs_improvement';
    return 'concern';
  }

  /**
   * Extract domain progress from report
   */
  static extractDomainProgress(report) {
    if (!report || !report.scores) {
      return [];
    }

    return Object.entries(report.scores).map(([domain, score]) => ({
      domain,
      score: typeof score === 'number' ? score : 0,
      trend: 'stable',
      description: `Progress in ${domain} domain`
    }));
  }

  /**
   * Extract domain-specific scores
   * @param {Object} report - Assessment report
   * @returns {Object} Domain scores
   */
  static extractDomainScores(report) {
    if (!report || !report.scores) {
      return {};
    }

    return report.scores;
  }

  /**
   * Extract recommendations from report
   * @param {Object} report - Assessment report
   * @returns {Array} List of recommendations
   */
  static extractRecommendations(report) {
    if (!report || !report.recommendations) {
      return [];
    }

    const recommendations = Array.isArray(report.recommendations) 
      ? report.recommendations 
      : [report.recommendations];

    return recommendations.map(rec => ({
      type: 'general',
      title: 'Professional Recommendation',
      description: rec
    }));
  }

  /**
   * Assess risk level based on scores
   * @param {Object} report - Assessment report
   * @returns {string} Risk level (low, medium, high)
   */
  static assessRiskLevel(report) {
    const overallScore = this.calculateOverallScore(report);
    
    if (overallScore >= 70) {
      return 'low';
    } else if (overallScore >= 40) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Identify areas that need improvement
   * @param {Object} report - Assessment report
   * @returns {Array} Areas needing improvement
   */
  static identifyImprovementAreas(report) {
    if (!report || !report.scores) {
      return [];
    }

    const improvementAreas = [];
    const threshold = 60; // Score below this needs improvement

    Object.entries(report.scores).forEach(([domain, score]) => {
      if (typeof score === 'number' && score < threshold) {
        improvementAreas.push({
          area: domain,
          priority: score < 40 ? 'high' : 'medium',
          description: `Current score: ${score}/100 in ${domain}`
        });
      }
    });

    return improvementAreas.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Identify strengths from assessment
   * @param {Object} report - Assessment report
   * @returns {Array} Areas of strength
   */
  static identifyStrengths(report) {
    if (!report || !report.scores) {
      return [];
    }

    const strengths = [];
    const threshold = 80; // Score above this indicates strength

    Object.entries(report.scores).forEach(([domain, score]) => {
      if (typeof score === 'number' && score >= threshold) {
        strengths.push({
          area: domain,
          description: `Strong performance in ${domain} (${score}/100)`
        });
      }
    });

    return strengths.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate basic next steps
   */
  static generateBasicNextSteps(report) {
    const nextSteps = [];
    const riskLevel = this.assessRiskLevel(report);
    const improvementAreas = this.identifyImprovementAreas(report);

    if (riskLevel === 'high') {
      nextSteps.push({
        action: 'Schedule follow-up assessment',
        timeline: 'immediate',
        description: 'High-risk areas detected require immediate attention'
      });
    }

    improvementAreas.forEach(area => {
      nextSteps.push({
        action: `Focus on ${area.area} development`,
        timeline: 'ongoing',
        description: `Continue working on ${area.area} skills`
      });
    });

    return nextSteps;
  }
}

module.exports = ProgressAnalysisService;
