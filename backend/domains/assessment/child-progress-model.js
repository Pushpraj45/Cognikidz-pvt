const mongoose = require("mongoose");

/**
 * Child Progress Tracking Schema
 * Tracks longitudinal progress across multiple assessment sessions
 */
const ChildProgressSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildProfile",
      required: true,
      unique: true,
    },
    
    // Overall progress metrics
    overallMetrics: {
      totalAssessments: {
        type: Number,
        default: 0,
      },
      completedAssessments: {
        type: Number,
        default: 0,
      },
      averageEngagement: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      progressTrend: {
        type: String,
        enum: ['improving', 'stable', 'declining', 'insufficient_data'],
        default: 'insufficient_data'
      },
      lastAssessmentDate: Date,
      firstAssessmentDate: Date,
    },
    
    // Domain-specific progress tracking
    domainProgress: [{
      domain: {
        type: String,
        required: true,
      },
      assessmentType: {
        type: String,
        required: true,
      },
      assessmentHistory: [{
        sessionId: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
        score: {
          type: Number,
          min: 0,
          max: 10,
        },
        accuracy: {
          type: Number,
          min: 0,
          max: 1,
        },
        improvement: Number, // compared to previous assessment
        behavioralNotes: String,
        qualityScore: {
          type: Number,
          min: 0,
          max: 1,
        }
      }],
      currentLevel: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
      },
      strengths: [String],
      challenges: [String],
      recommendations: [String],
      
      // Trend analysis
      trendAnalysis: {
        overallTrend: {
          type: String,
          enum: ['improving', 'stable', 'declining'],
        },
        improvementRate: Number, // points per month
        consistency: {
          type: Number,
          min: 0,
          max: 1,
        },
        plateauDetected: Boolean,
        concernThreshold: Boolean,
      }
    }],
    
    // Behavioral profile over time
    behavioralProfile: {
      attentionSpan: {
        average: Number, // in minutes
        trend: String,
        variance: Number,
        lastUpdated: Date,
      },
      optimalSessionLength: {
        type: Number, // in minutes
        default: 30,
      },
      preferredBreakFrequency: {
        type: Number, // minutes between breaks
        default: 10,
      },
      motivationTriggers: [String],
      frustrationThresholds: {
        accuracy: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.4,
        },
        time: {
          type: Number, // minutes before frustration
          default: 5,
        },
        complexity: {
          type: Number,
          min: 1,
          max: 5,
          default: 3,
        }
      },
      
      // Engagement patterns
      engagementPatterns: {
        bestTimeOfDay: String,
        optimalDifficulty: Number,
        preferredGameTypes: [String],
        socialInteractionPreference: String,
        rewardSensitivity: {
          type: String,
          enum: ['high', 'medium', 'low'],
          default: 'medium'
        }
      }
    },
    
    // AI-generated insights
    aiInsights: {
      learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'kinesthetic', 'mixed'],
      },
      recommendedApproach: String,
      predictedChallenges: [String],
      interventionSuggestions: [{
        category: String,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low'],
        },
        suggestion: String,
        evidence: String,
        timeline: String,
      }],
      
      // Risk assessment over time
      riskAssessment: {
        currentRiskLevel: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        riskTrend: String,
        specificRisks: [{
          domain: String,
          level: String,
          confidence: Number,
          lastAssessed: Date,
        }],
        protectiveFactors: [String],
      },
      
      lastAnalysisDate: Date,
      analysisVersion: {
        type: String,
        default: '1.0'
      }
    },
    
    // Parent/teacher feedback integration
    externalFeedback: [{
      source: {
        type: String,
        enum: ['parent', 'teacher', 'therapist', 'other'],
      },
      date: Date,
      observations: String,
      concerns: [String],
      improvements: [String],
      correlatesWithAssessment: Boolean,
      feedbackType: {
        type: String,
        enum: ['structured', 'unstructured', 'questionnaire'],
      }
    }],
    
    // Milestone tracking
    milestones: [{
      domain: String,
      milestone: String,
      achieved: Boolean,
      dateAchieved: Date,
      evidence: String,
      assessmentSessionId: String,
    }],
    
    // Intervention tracking
    interventions: [{
      type: String,
      startDate: Date,
      endDate: Date,
      provider: String,
      goals: [String],
      outcomes: String,
      effectiveness: {
        type: Number,
        min: 1,
        max: 5,
      },
      correlatedWithAssessmentImprovement: Boolean,
    }],
    
    // Data quality and reliability
    dataQuality: {
      overallReliability: {
        type: Number,
        min: 0,
        max: 1,
        default: 1,
      },
      consistencyScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 1,
      },
      flaggedSessions: [String], // sessionIds with quality concerns
      lastQualityCheck: Date,
    }
  },
  {
    timestamps: true,
    collection: "childProgress",
  }
);

// Indexes for efficient queries
ChildProgressSchema.index({ childId: 1 });
ChildProgressSchema.index({ 'domainProgress.domain': 1, 'domainProgress.assessmentType': 1 });
ChildProgressSchema.index({ 'overallMetrics.lastAssessmentDate': -1 });
ChildProgressSchema.index({ 'aiInsights.riskAssessment.currentRiskLevel': 1 });

// Methods for calculating progress
ChildProgressSchema.methods.calculateOverallProgress = function() {
  if (this.domainProgress.length === 0) return 0;
  
  const totalScore = this.domainProgress.reduce((sum, domain) => {
    return sum + (domain.currentLevel || 0);
  }, 0);
  
  return totalScore / this.domainProgress.length;
};

ChildProgressSchema.methods.getLatestScoreForDomain = function(domain, assessmentType) {
  const domainData = this.domainProgress.find(d => 
    d.domain === domain && d.assessmentType === assessmentType
  );
  
  if (!domainData || domainData.assessmentHistory.length === 0) {
    return null;
  }
  
  // Return the most recent assessment
  const latest = domainData.assessmentHistory.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0];
  
  return latest;
};

ChildProgressSchema.methods.addAssessmentResult = function(sessionId, domain, assessmentType, results) {
  let domainData = this.domainProgress.find(d => 
    d.domain === domain && d.assessmentType === assessmentType
  );
  
  if (!domainData) {
    domainData = {
      domain,
      assessmentType,
      assessmentHistory: [],
      currentLevel: 5,
      strengths: [],
      challenges: [],
      recommendations: []
    };
    this.domainProgress.push(domainData);
  }
  
  // Add new assessment result
  domainData.assessmentHistory.push({
    sessionId,
    date: new Date(),
    score: results.score,
    accuracy: results.accuracy,
    improvement: this.calculateImprovement(domainData, results.score),
    behavioralNotes: results.behavioralNotes,
    qualityScore: results.qualityScore || 1
  });
  
  // Update current level
  domainData.currentLevel = results.score;
  
  // Update overall metrics
  this.overallMetrics.totalAssessments++;
  if (results.completed) {
    this.overallMetrics.completedAssessments++;
  }
  this.overallMetrics.lastAssessmentDate = new Date();
  
  if (!this.overallMetrics.firstAssessmentDate) {
    this.overallMetrics.firstAssessmentDate = new Date();
  }
};

ChildProgressSchema.methods.calculateImprovement = function(domainData, newScore) {
  if (domainData.assessmentHistory.length === 0) {
    return 0; // No previous score to compare
  }
  
  const previousScore = domainData.assessmentHistory[domainData.assessmentHistory.length - 1].score;
  return newScore - previousScore;
};

const ChildProgress = mongoose.model("ChildProgress", ChildProgressSchema);

module.exports = { ChildProgress, ChildProgressSchema }; 