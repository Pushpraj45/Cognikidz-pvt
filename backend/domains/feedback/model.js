const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define feedback status enum
const FeedbackStatus = {
  NEW: "new",
  REVIEWED: "reviewed",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

// Define priority enum
const FeedbackPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const feedbackSchema = new Schema(
  {
    // Section 1: User Information
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    testingDuration: {
      type: String,
      // Accept any string value for testing duration
    },
    deviceInfo: {
      deviceType: String,
      browser: String,
      operatingSystem: String,
    },

    // Section 2: Feature Testing Feedback
    accountManagement: {
      createAccount: { type: String },
      emailVerification: { type: String },
      googleLogin: { type: String },
      updateProfile: { type: String },
      rating: { type: Number },
      issues: String,
    },

    childProfileManagement: {
      createProfile: { type: String },
      uploadAvatar: { type: String },
      editProfile: { type: String },
      addMultipleChildren: { type: String },
      rating: { type: Number },
      issues: String,
    },

    assessmentSystem: {
      assessmentsAttempted: [String], // Accept any string values
      assessmentDetails: [
        {
          type: String,
          easyToUnderstand: { type: Number },
          completed: { type: String },
          issues: String,
          reportGenerated: { type: String },
        },
      ],
      overallRating: { type: Number },
      suggestions: String,
    },

    dashboard: {
      navigationEase: { type: Number },
      informationClarity: { type: Number },
      loadingSpeed: { type: Number },
      visualAppeal: { type: Number },
      functionality: { type: Number },
      issues: {
        viewingResults: { hasIssue: Boolean, description: String },
        switchingChildren: { hasIssue: Boolean, description: String },
        accessingReports: { hasIssue: Boolean, description: String },
        usingFeatures: { hasIssue: Boolean, description: String },
      },
    },

    chatbot: {
      used: { type: String },
      helpful: { type: Number },
      responsive: { type: Number },
      understanding: { type: Number },
      issues: String,
    },

    articlesResources: {
      accessed: { type: String },
      contentQuality: { type: Number },
      organization: { type: Number },
      foundRelevantInfo: { type: String },
    },

    // Section 3: Technical Issues
    performanceIssues: {
      encountered: [String], // Accept any string values
      details: [
        {
          issue: String,
          frequency: { type: String },
          context: String,
          deviceBrowser: String,
        },
      ],
    },

    mobileResponsiveness: {
      used: { type: String },
      displayCorrect: { type: String },
      featuresAccessible: { type: String },
      specificIssues: String,
    },

    // Section 4: Security & Privacy
    securityConcerns: {
      dataSecurity: { hasConcern: Boolean, description: String },
      privacyProtection: { hasConcern: Boolean, description: String },
      informationSharing: { hasConcern: Boolean, description: String },
    },
    dataProtectionConfidence: { type: Number },

    // Section 5: Overall Experience
    overallRating: { type: Number },
    whatWorkedWell: String,
    needsImprovement: String,
    recommendationScore: { type: Number },
    additionalFeedback: String,

    // Section 6: Bug Reports
    bugReports: [
      {
        location: String,
        description: String,
        reproductionSteps: String,
        impact: { type: String }, // Accept any string value
        screenshotUrl: String,
      },
    ],

    // Section 7: Future Testing
    futureParticipation: { type: String },
    preferredFeatures: [String],
    contactPreference: [String],

    // Admin fields
    status: {
      type: String,
      enum: Object.values(FeedbackStatus),
      default: FeedbackStatus.NEW,
    },
    priority: {
      type: String,
      enum: Object.values(FeedbackPriority),
      default: FeedbackPriority.MEDIUM,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    adminNotes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,

    // Add metadata for tracking
    metadata: {
      ip: String,
      userAgent: String,
      submittedAt: Date,
    },
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields not defined in schema
  }
);

// Add indexes for better query performance
feedbackSchema.index({ email: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ createdAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = {
  Feedback,
  FeedbackStatus,
  FeedbackPriority,
};
