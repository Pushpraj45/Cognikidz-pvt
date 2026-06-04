const mongoose = require("mongoose");

/**
 * Battery Configuration Schema
 * Defines structured assessment batteries with games, breaks, and adaptive settings
 */
const BatteryConfigSchema = new mongoose.Schema(
  {
    batteryId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    assessmentType: {
      type: String,
      required: true,
      enum: ['adhd', 'dyslexia', 'autism', 'comprehensive']
    },
    targetDomain: {
      type: String,
      required: true,
    },
    description: String,
    
    // Game sequence configuration
    gameSequence: [{
      gameId: {
        type: String,
        required: true,
      },
      position: {
        type: Number,
        required: true,
      },
      duration: {
        type: Number, // in minutes
        required: true,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'adaptive'],
        default: 'medium'
      },
      adaptiveSettings: {
        minDifficulty: {
          type: Number,
          min: 1,
          max: 5,
          default: 1
        },
        maxDifficulty: {
          type: Number,
          min: 1,
          max: 5,
          default: 5
        },
        targetSuccessRate: {
          type: Number,
          min: 0.1,
          max: 1.0,
          default: 0.7
        }
      },
      required: {
        type: Boolean,
        default: true,
      }
    }],
    
    // Break schedule
    breakSchedule: [{
      afterGame: String, // gameId after which break occurs
      duration: {
        type: Number, // in seconds
        default: 30
      },
      type: {
        type: String,
        enum: ['micro', 'regular', 'celebration'],
        default: 'micro'
      },
      activity: String, // break activity description
      optional: {
        type: Boolean,
        default: false
      }
    }],
    
    // Age recommendations
    ageRecommendations: [{
      minAge: {
        type: Number, // in months
        required: true,
      },
      maxAge: {
        type: Number, // in months
        required: true,
      },
      recommended: {
        type: Boolean,
        default: true,
      },
      modifications: {
        duration: Number,
        difficultyAdjustment: Number,
        breakFrequency: String,
        specialInstructions: String
      }
    }],
    
    // Success criteria
    completionCriteria: {
      minimumGames: {
        type: Number,
        default: 1,
      },
      minimumAccuracy: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.3
      },
      allowPartialCompletion: {
        type: Boolean,
        default: true,
      }
    },
    
    // Metadata
    version: {
      type: String,
      default: '1.0'
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    estimatedTotalDuration: Number, // in minutes
  },
  {
    timestamps: true,
    collection: "batteryConfigs",
  }
);

// Index for efficient queries
BatteryConfigSchema.index({ assessmentType: 1, isActive: 1 });
BatteryConfigSchema.index({ 'ageRecommendations.minAge': 1, 'ageRecommendations.maxAge': 1 });

const BatteryConfig = mongoose.model("BatteryConfig", BatteryConfigSchema);

module.exports = { BatteryConfig, BatteryConfigSchema }; 