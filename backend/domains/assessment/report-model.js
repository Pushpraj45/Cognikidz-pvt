const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Basic Identification
  reportId: {
    type: String,
    required: true,
    unique: true,
    default: () => `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Child and Parent Information
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

  // Report Classification
  reportType: {
    type: String,
    enum: [
      'mini-report',
      'suite-progress-report',
      'comprehensive-assessment-report',
      'progress-alert-report',
      'concern-alert-report',
      'weekly-summary',
      'monthly-summary',
      'quarterly-summary'
    ],
    required: true,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },

  // Trigger Information
  trigger: {
    type: {
      type: String,
      enum: [
        'individual-game-milestone',
        'suite-completion',
        'battery-completion',
        'significant-progress',
        'concerns-detected',
        'scheduled-weekly',
        'scheduled-monthly',
        'scheduled-quarterly'
      ],
      required: true
    },
    gameId: String,
    assessmentType: String,
    milestone: Number,
    scheduledDate: Date,
    metadata: mongoose.Schema.Types.Mixed
  },

  // Report Content
  content: {
    // Main report text
    title: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    
    // Structured content sections
    sections: [{
      heading: String,
      content: String,
      type: {
        type: String,
        enum: ['text', 'list', 'chart-data', 'recommendations']
      },
      data: mongoose.Schema.Types.Mixed // For charts, lists, etc.
    }],

    // Key insights and recommendations
    insights: [String],
    recommendations: [String],
    
    // Performance data referenced in report
    performanceData: {
      gamePerformances: mongoose.Schema.Types.Mixed,
      trends: mongoose.Schema.Types.Mixed,
      benchmarks: mongoose.Schema.Types.Mixed,
      improvements: mongoose.Schema.Types.Mixed,
      concerns: mongoose.Schema.Types.Mixed
    },

    // AI generation metadata
    aiMetadata: {
      model: String,
      promptVersion: String,
      generationTime: Date,
      tokens: Number,
      confidence: Number
    }
  },

  // Status and Lifecycle
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'archived'],
    default: 'generating',
    index: true
  },
  
  visibility: {
    type: String,
    enum: ['private', 'shared-with-educators', 'shared-with-healthcare'],
    default: 'private'
  },

  // Notifications
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: Date,
    pushNotificationSent: {
      type: Boolean,
      default: false
    },
    pushNotificationSentAt: Date,
    viewedByParent: {
      type: Boolean,
      default: false
    },
    viewedAt: Date
  },

  // Timestamps
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  scheduledFor: Date,
  expiresAt: Date, // For time-sensitive reports

  // Versioning and Updates
  version: {
    type: Number,
    default: 1
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  
  // Tags for filtering and search
  tags: [String],
  
  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    actionsTaken: [{
      action: String, // 'downloaded', 'shared', 'printed', etc.
      timestamp: Date,
      metadata: mongoose.Schema.Types.Mixed
    }]
  }
}, {
  timestamps: true,
  collection: 'reports'
});

// Indexes for performance
reportSchema.index({ childId: 1, reportType: 1, generatedAt: -1 });
reportSchema.index({ parentId: 1, priority: 1, status: 1 });
reportSchema.index({ 'trigger.type': 1, generatedAt: -1 });
reportSchema.index({ scheduledFor: 1, status: 1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for report age
reportSchema.virtual('age').get(function() {
  return Date.now() - this.generatedAt.getTime();
});

// Static methods
reportSchema.statics.findByChild = function(childId, limit = 10) {
  return this.find({ childId })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .populate('childId', 'firstName lastName age');
};

reportSchema.statics.findByPriority = function(priority, limit = 20) {
  return this.find({ priority, status: 'completed' })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .populate('childId', 'firstName lastName age')
    .populate('parentId', 'name email');
};

reportSchema.statics.findPendingNotifications = function() {
  return this.find({
    status: 'completed',
    'notifications.emailSent': false,
    priority: { $in: ['high', 'critical'] }
  }).populate('childId', 'firstName lastName age')
    .populate('parentId', 'name email');
};

reportSchema.statics.findScheduledReports = function() {
  return this.find({
    scheduledFor: { $lte: new Date() },
    status: { $in: ['generating', 'failed'] }
  });
};

// Instance methods
reportSchema.methods.markAsViewed = function() {
  this.notifications.viewedByParent = true;
  this.notifications.viewedAt = new Date();
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

reportSchema.methods.markEmailSent = function() {
  this.notifications.emailSent = true;
  this.notifications.emailSentAt = new Date();
  return this.save();
};

reportSchema.methods.addAnalyticsAction = function(action, metadata = {}) {
  this.analytics.actionsTaken.push({
    action,
    timestamp: new Date(),
    metadata
  });
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema); 