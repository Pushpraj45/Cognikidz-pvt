const mongoose = require("mongoose");

/**
 * Image Set Schema - represents a pair of positive/negative images for assessment
 */
const ImageSetSchema = new mongoose.Schema(
  {
    setId: { type: String, required: true, unique: true },
    assessmentType: { type: String, required: true },
    assessmentArea: { type: String, required: true },
    setNumber: { type: Number, required: true },

    // S3 Information
    s3Keys: {
      positive: String,
      negative: String,
    },

    // Public URLs (for reference)
    publicUrls: {
      positive: String,
      negative: String,
    },

    // Descriptions for LLM
    descriptions: {
      positive: { type: String, required: true },
      negative: { type: String, required: true },
    },

    // Correct answer for this image set
    correctAnswer: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
      default: "positive", // For autism assessment, positive images are typically correct
    },

    // Metadata
    difficulty: { type: Number, min: 1, max: 5, default: 3 },
    ageRange: { type: Array, default: [3, 12] },
    weight: { type: Number, default: 1.0 },
    tags: [String],

    // Usage tracking
    usageCount: { type: Number, default: 0 },
    lastUsed: Date,

    // Status
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

/**
 * Image Assessment Response Schema
 */
const ImageResponseSchema = new mongoose.Schema(
  {
    setId: { type: String, required: true },
    selectedImage: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
    },
    responseTime: { type: Number, required: true }, // in milliseconds
    isCorrect: { type: Boolean, required: true },
    difficulty: { type: Number, min: 1, max: 5 },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      assessmentArea: String,
      tags: [String],
      userAgent: String,
      deviceType: String,
    },
  },
  { _id: false, timestamps: false }
);

/**
 * Image Assessment Session Schema
 */
const ImageAssessmentSessionSchema = new mongoose.Schema(
  {
    // Session identifiers
    sessionId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: "ChildProfile" },

    // Assessment configuration
    assessmentType: { type: String, required: true, default: "autism" },
    totalQuestions: { type: Number, required: true, default: 20 },
    currentQuestion: { type: Number, default: 0 },

    // Session state
    status: {
      type: String,
      enum: ["active", "paused", "completed", "abandoned"],
      default: "active",
    },

    // Image sets presented
    imageSets: [String], // Array of setIds

    // User responses
    responses: [ImageResponseSchema],

    // Assessment results
    results: {
      totalQuestions: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      incorrectAnswers: { type: Number, default: 0 },
      accuracyRate: { type: Number, default: 0 }, // percentage
      averageResponseTime: { type: Number, default: 0 }, // in milliseconds

      // Domain-specific scores
      domainScores: {
        type: [
          {
            domain: { type: String, required: true },
            correct: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 },
          },
        ],
        default: [],
      },

      // Difficulty analysis
      difficultyAnalysis: {
        type: [
          {
            level: { type: Number, required: true },
            correct: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 },
          },
        ],
        default: [],
      },

      // Interpretation and risk assessment
      riskLevel: {
        type: String,
        enum: ["low", "moderate", "high"],
        default: "moderate",
      },
      riskScore: { type: Number, min: 1, max: 10, default: 5 },
      interpretation: {
        type: String,
        default: "Assessment completed successfully",
      },
      recommendations: {
        type: [String],
        default: [],
      },
      summary: {
        type: String,
        default: "Assessment completed. Results are being processed.",
      },

      // Raw scores for further analysis
      rawScores: {
        type: {
          socialInteraction: { type: Number, default: 0 },
          communication: { type: Number, default: 0 },
          behaviorPatterns: { type: Number, default: 0 },
          sensoryResponse: { type: Number, default: 0 },
        },
        default: {
          socialInteraction: 0,
          communication: 0,
          behaviorPatterns: 0,
          sensoryResponse: 0,
        },
      },

      // AI Enhancement flags
      aiEnhanced: { type: Boolean, default: false },
    },

    // Timestamps
    startedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    completedAt: Date,

  // Idempotency: mark when usage has been counted for this session's report
  usageCounted: { type: Boolean, default: false },

    // Settings
    settings: {
      randomizeOrder: { type: Boolean, default: true },
      timeLimit: Number, // in seconds, null for no limit
      showFeedback: { type: Boolean, default: false },
      enablePause: { type: Boolean, default: true },
    },

    // Metadata
    metadata: {
      userAgent: String,
      deviceType: String,
      screenResolution: String,
      startLocation: String,
      childName: String,
      childAge: Number,
    },

    // AI Report storage
    aiReport: {
      generatedAt: Date,
      analysis: {
        riskLevel: {
          type: String,
          enum: ["low", "moderate", "high"],
        },
        riskScore: {
          type: Number,
          min: 1,
          max: 10,
        },
        summary: String,
        keyFindings: [String],
        strengths: [String],
        concerns: [String],
        recommendations: [String],
        confidence: {
          type: Number,
          min: 0,
          max: 100,
        },
        professionalReferral: String,
        interpretation: String,
      },
      modelUsed: String,
      fallback: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Indexes for performance
ImageSetSchema.index({ assessmentType: 1, status: 1 });
ImageSetSchema.index({ setId: 1 });
ImageAssessmentSessionSchema.index({ sessionId: 1 });
ImageAssessmentSessionSchema.index({ userId: 1, status: 1 });
ImageAssessmentSessionSchema.index({ assessmentType: 1, status: 1 });

// Models
const ImageSet = mongoose.model("ImageSet", ImageSetSchema);
const ImageAssessmentSession = mongoose.model(
  "ImageAssessmentSession",
  ImageAssessmentSessionSchema
);

module.exports = {
  ImageSet,
  ImageAssessmentSession,
  ImageSetSchema,
  ImageAssessmentSessionSchema,
  ImageResponseSchema,
};
