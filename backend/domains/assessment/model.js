const mongoose = require("mongoose");

/**
 * Schema for assessment questions
 */
const QuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["MCQ", "MSQ", "SCALE", "VISUAL", "TEXT", "GAME_PERFORMANCE"],
      required: true,
    },
    options: [
      {
        type: String,
      },
    ],
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    disorder: {
      type: String,
      required: true,
    },
    skill: {
      type: String,
    },
    // Autism-specific fields for domain tracking and screening tools
    domain: {
      type: String,
    },
    screeningTool: {
      type: String,
    },
    ageAppropriate: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * Schema for assessment responses
 */
const ResponseSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * Assessment Session Schema
 *
 * Stores information about an assessment session, including questions and responses.
 */
const AssessmentSchema = new mongoose.Schema(
  {
    // Reference to the intake form that started this assessment
    intakeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intake",
      required: function () {
        // Only require intakeId for formal assessments, not individual games
        return this.assessmentType !== "individual-games";
      },
    },

    // Session identifier for LangChain/LangGraph
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    // Child profile reference (for individual games)
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildProfile",
      required: true,
    },

    // Assessment type/category
    assessmentType: {
      type: String,
      default: "General",
    }, // NEW: Battery-based assessment structure
    batteryStructure: {
      isGameBased: {
        type: Boolean,
        default: false, // Backward compatibility
      },
      selectedBatteries: [
        {
          batteryId: String,
          name: String,
          domain: String,
          games: [String],
          estimatedDuration: Number,
          status: {
            type: String,
            enum: ["pending", "active", "completed", "skipped"],
            default: "pending",
          },
        },
      ],
      currentBatteryIndex: {
        type: Number,
        default: 0,
      },
      totalBatteries: {
        type: Number,
        default: 1,
      },
    },

    // Assessment status
    status: {
      type: String,
      enum: ["active", "paused", "completed", "abandoned", "in_progress"],
      default: "active",
    },

    // Questions presented during this assessment
    questions: [QuestionSchema],

    // User responses to questions
    responses: [ResponseSchema],

    // Current question index/pointer
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    // NEW: Game performance tracking
    gamePerformances: [
      {
        gameId: String,
        batteryId: String,
        attempt: Number,
        startedAt: Date,
        completedAt: Date,

        // Basic Performance
        score: Number,
        accuracy: Number,
        completionRate: Number,
        duration: Number,
        level: { type: Number, default: 1 }, // Game level for progressive games

        // Enhanced Behavioral Data
        behavioralMetrics: {
          responseTimes: { type: [Number], default: [] },
          timeToFirstResponse: { type: Number, default: 0 },
          performanceOverTime: {
            type: [
              {
                timeSegment: Number,
                score: Number,
                accuracy: Number,
              },
            ],
            default: [],
          },
          breakRequests: { type: Number, default: 0 },

          errorAnalysis: {
            totalErrors: { type: Number, default: 0 },
            errorTypes: {
              type: [
                {
                  type: { type: String },
                  count: { type: Number, default: 0 },
                  timestamps: { type: [Number], default: [] },
                },
              ],
              default: [],
            },
            falsePositives: { type: Number, default: 0 },
            falseNegatives: { type: Number, default: 0 },
          },

          engagementData: {
            clickPatterns: {
              type: [
                {
                  x: Number,
                  y: Number,
                  timestamp: Number,
                  type: { type: String },
                },
              ],
              default: [],
            },
            helpRequests: { type: Number, default: 0 },
            distractionEvents: { type: Number, default: 0 },
            frustrationIndicators: { type: Number, default: 0 },
          },
        },

        // AI Analysis
        aiAnalysis: {
          performancePattern: String,
          riskIndicators: [String],
          strengthIndicators: [String],
          recommendedActions: [String],
        },

        // Game-specific data (for games like FocusFinder that have levels, targets, etc.)
        gameSpecificData: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],

    // NEW: Real-time progress tracking
    progressTracking: {
      overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      batteryProgress: [
        {
          batteryId: String,
          progress: Number,
          status: String,
          startedAt: Date,
          completedAt: Date,
        },
      ],
      gameProgress: [
        {
          gameId: String,
          batteryId: String,
          attempts: Number,
          bestScore: Number,
          status: String,
        },
      ],
    },

    // NEW: Quality assurance metrics
    qualityMetrics: {
      engagementScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 1,
      },
      dataQualityFlags: [String],
      reliabilityScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 1,
      },
      crossGameConsistency: Number,
    },

    // NEW: Break management
    breakHistory: [
      {
        timestamp: Date,
        duration: Number,
        type: String, // 'micro', 'regular', 'celebration'
        context: String,
        childResponse: String,
      },
    ],

    // Ability estimate from IRT model (theta parameter)
    abilityEstimate: {
      type: Number,
      default: 0,
    },

    // Summary results, populated on assessment completion
    results: {
      summary: String,
      childName: String,
      childAge: Number,
      childGender: String,
      assessmentType: String,
      assessmentDate: String,
      disorderRisk: {
        score: {
          type: Number,
          min: 1,
          max: 10,
        },
        interpretation: String,
      },
      strengthsAndChallenges: {
        strengths: [String],
        challenges: [String],
      },
      domainScores: [
        {
          domain: String,
          score: {
            type: Number,
            min: 1,
            max: 10,
          },
          description: String,
        },
      ],
      recommendations: [String],
      followUpSchedule: {
        recommendedDate: Date,
        focus: String,
        urgency: String,
        timeframe: String,
      },
      chartsData: mongoose.Schema.Types.Mixed,
      keyFindings: mongoose.Schema.Types.Mixed,
      assessmentMetadata: mongoose.Schema.Types.Mixed,
      disclaimer: String,

      // NEW: Enhanced reporting for game-based assessments
      gameBasedResults: {
        batteryResults: [
          {
            batteryId: String,
            domain: String,
            overallScore: Number,
            gameResults: [
              {
                gameId: String,
                score: Number,
                behavioralObservations: [String],
                riskIndicators: [String],
              },
            ],
          },
        ],
        behavioralProfile: {
          attentionPattern: String,
          engagementStyle: String,
          learningPreferences: [String],
          motivationTriggers: [String],
        },
        aiInsights: {
          immediateRecommendations: [String],
          interventionSuggestions: [String],
          followUpRecommendations: [String],
        },
      },
    },

    // Related metadata
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

  // Idempotency: mark when usage has been counted for this session's report
  usageCounted: {
    type: Boolean,
    default: false,
  },

    // Timestamps for session events
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },

    // NEW: Session metadata
    sessionMetadata: {
      deviceInfo: String,
      browserInfo: String,
      environmentNotes: String,
      parentPresent: Boolean,
      distractions: [String],
    },
  },
  {
    timestamps: true,
    collection: "assessments",
  }
);

// Virtual for completion percentage
AssessmentSchema.virtual("completionPercentage").get(function () {
  if (!this.responses.length) return 0;
  return Math.min(100, Math.round((this.responses.length / 15) * 100)); // Updated to 15 questions
});

// Method to add a new response
AssessmentSchema.methods.addResponse = function (questionId, response) {
  this.responses.push({
    questionId,
    response,
    timestamp: new Date(),
  });

  this.lastActiveAt = new Date();
  this.currentQuestionIndex = this.responses.length;

  return this;
};

// Method to get assessment results with fallback data
AssessmentSchema.methods.getResultsWithFallback = function () {
  // If we have complete results, return them
  if (this.results && Object.keys(this.results).length > 0) {
    return this.results;
  }

  // Otherwise, generate minimal results based on responses
  const fallbackResults = {
    summary:
      "Assessment completed. This is an automatically generated summary as the full report is not available.",
    disorderRisk: {
      score: 5, // Default middle value
      interpretation:
        "This assessment identified some potential indicators that should be reviewed by a professional.",
    },
    strengthsAndChallenges: {
      strengths: [],
      challenges: [],
    },
    recommendations: [
      "Consult with a healthcare professional for a comprehensive evaluation.",
      "Consider discussing these results with your child's doctor or specialist.",
    ],
    disclaimer:
      "This is an automatically generated report based on your responses. It is not a medical diagnosis. Always consult qualified healthcare professionals for proper evaluation and diagnosis.",
  };

  // If we have responses, try to estimate risk score based on response values
  if (this.responses && this.responses.length > 0) {
    // For SCALE questions where higher responses (4-5) indicate more symptoms
    const highResponses = this.responses.filter((r) => r.response >= 4).length;
    const totalResponses = this.responses.length;
    const ratio = highResponses / totalResponses;

    // Use ratio to calculate a risk score between 1-10
    if (totalResponses > 0) {
      fallbackResults.disorderRisk.score = Math.max(
        1,
        Math.min(10, Math.round(ratio * 10) || 5)
      );
    }
  }

  return fallbackResults;
};

// Method to mark assessment as completed
AssessmentSchema.methods.complete = function (results) {
  this.status = "completed";
  this.completedAt = new Date();
  this.results = results || {};

  return this;
};

// Method to pause assessment
AssessmentSchema.methods.pause = function () {
  this.status = "paused";
  this.lastActiveAt = new Date();

  return this;
};

// Method to resume assessment
AssessmentSchema.methods.resume = function () {
  this.status = "active";
  this.lastActiveAt = new Date();

  return this;
};

// Pre-save middleware to update lastActiveAt
AssessmentSchema.pre("save", function (next) {
  this.lastActiveAt = new Date();
  next();
});

const Assessment = mongoose.model("Assessment", AssessmentSchema);

module.exports = Assessment;
