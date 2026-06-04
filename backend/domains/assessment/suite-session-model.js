const mongoose = require('mongoose');

const SuiteSessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  childId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChildProfile', 
    required: true,
    index: true
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  suiteType: { 
    type: String, 
    enum: ['adhd', 'dyslexia'], 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'abandoned'], 
    default: 'active',
    index: true
  },
  
  // Progress tracking
  currentGameIndex: { type: Number, default: 0 },
  completedGames: [{ type: String }],
  gameResults: [{
    gameId: String,
    score: Number,
    accuracy: Number,
    duration: Number,
    level: { type: Number, default: 1 },
    behavioralMetrics: {
      responseTimes: [Number],
      timeToFirstResponse: Number,
      performanceOverTime: [{
        timeSegment: Number,
        score: Number,
        accuracy: Number
      }],
      breakRequests: Number,
      errorAnalysis: {
        totalErrors: Number,
        // errorTypes field removed to prevent validation issues
        // errorTypes: {
        //   type: [{
        //     type: String,
        //     count: Number,
        //     timestamps: [Number]
        //   }],
        //   default: []
        // },
        falsePositives: Number,
        falseNegatives: Number
      },
      engagementData: {
        clickPatterns: [{
          x: Number,
          y: Number,
          timestamp: Number,
          type: String
        }],
        helpRequests: Number,
        distractionEvents: Number,
        frustrationIndicators: Number
      }
    },
    completedAt: Date
  }],
  
  // Session metadata
  startTime: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  totalDuration: { type: Number, default: 0 },
  pauseHistory: [{
    timestamp: Date,
    duration: Number,
    reason: String
  }],
  
  // AI Analysis preparation
  behavioralProfile: {
    attentionPattern: String,
    engagementStyle: String,
    learningPreferences: [String],
    motivationTriggers: [String],
    frustrationIndicators: [String]
  },

  // Suite configuration
  suiteConfig: {
    totalGames: { type: Number, default: 5 },
    estimatedDuration: { type: Number, default: 45 },
    games: [{
      id: String,
      title: String,
      difficulty: String,
      duration: Number,
      skills: [String]
    }]
  },

  // Summary metrics
  summaryMetrics: {
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    gamesCompleted: { type: Number, default: 0 }
  },

  // Quality metrics
  qualityMetrics: {
    engagementScore: { type: Number, min: 0, max: 1, default: 1 },
    dataQualityFlags: [String],
    reliabilityScore: { type: Number, min: 0, max: 1, default: 1 }
  },

  // Report generation status
  reportStatus: {
    generated: { type: Boolean, default: false },
    reportId: { type: String },
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date
  },

  // Idempotency: mark when usage has been counted for this suite report
  usageCounted: { type: Boolean, default: false }
}, { 
  timestamps: true,
  collection: 'suite_sessions'
});

// Indexes for performance
SuiteSessionSchema.index({ childId: 1, suiteType: 1, status: 1 });
SuiteSessionSchema.index({ sessionId: 1 });
SuiteSessionSchema.index({ parentId: 1, status: 1 });
SuiteSessionSchema.index({ startTime: -1 });
SuiteSessionSchema.index({ 'reportStatus.generated': 1 });

// Virtual for session age
SuiteSessionSchema.virtual('age').get(function() {
  return Date.now() - this.startTime;
});

// Virtual for progress percentage
SuiteSessionSchema.virtual('progressPercentage').get(function() {
  return this.completedGames.length / this.suiteConfig.totalGames * 100;
});

// Pre-save middleware to update summary metrics
SuiteSessionSchema.pre('save', function(next) {
  if (this.gameResults.length > 0) {
    const totalScore = this.gameResults.reduce((sum, game) => sum + (game.score || 0), 0);
    const totalAccuracy = this.gameResults.reduce((sum, game) => sum + (game.accuracy || 0), 0);
    
    this.summaryMetrics = {
      totalScore,
      averageScore: totalScore / this.gameResults.length,
      completionRate: (this.completedGames.length / this.suiteConfig.totalGames) * 100,
      averageAccuracy: totalAccuracy / this.gameResults.length,
      gamesCompleted: this.completedGames.length
    };
  }
  next();
});

module.exports = mongoose.model('SuiteSession', SuiteSessionSchema); 