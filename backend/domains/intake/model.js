const mongoose = require('mongoose');

/**
 * Intake Schema
 * 
 * Stores information collected from the assessment intake form.
 */
const IntakeSchema = new mongoose.Schema(
  {
    // Basic Demographics
    childName: {
      type: String,
      required: [true, 'Child name is required'],
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: 0,
      max: 18
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', ''],
      default: ''
    },
    grade: {
      type: String,
      trim: true
    },
    schoolName: {
      type: String,
      trim: true
    },
    
    // Parent/Guardian Details
    parentName: {
      type: String,
      required: [true, 'Parent/guardian name is required'],
      trim: true
    },
    parentEmail: {
      type: String,
      required: [true, 'Parent/guardian email is required'],
      trim: true,
      lowercase: true
    },
    parentPhone: {
      type: String,
      trim: true
    },
    
    // Primary Concerns & History
    primaryConcerns: {
      type: String,
      trim: true
    },
    previousAssessments: {
      type: Boolean,
      default: false
    },
    familyHistory: {
      has: {
        type: Boolean,
        default: false
      },
      details: {
        type: String,
        trim: true
      }
    },
    
    // Developmental & Medical History
    milestoneDelays: {
      walking: {
        type: Number,
        min: 0
      },
      talking: {
        type: Number,
        min: 0
      },
      toiletTraining: {
        type: Number,
        min: 0
      }
    },
    speechMilestones: {
      firstWords: {
        type: String,
        trim: true
      },
      sentences: {
        type: String,
        trim: true
      }
    },
    sensorySensitivities: [{
      type: String,
      trim: true
    }],
    medicalConditions: {
      type: String,
      trim: true
    },
    priorTherapies: [{
      type: String,
      trim: true
    }],
    
    // Behavioral & Social Functioning
    attentionLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    emotionRegulation: {
      type: String,
      trim: true
    },
    peerInteraction: {
      type: String,
      trim: true
    },
    routineTransitions: {
      type: String,
      trim: true
    },
    
    // Cognitive & Academic Skills
    readingLevel: {
      type: String,
      trim: true
    },
    mathDifficulties: {
      type: String,
      trim: true
    },
    memoryDirections: {
      type: String,
      trim: true
    },
    
    // Strengths & Interests
    areasOfStrength: {
      type: String,
      trim: true
    },
    motivators: {
      type: String,
      trim: true
    },
    
    // Environment & Lifestyle
    homeEnvironment: {
      type: String,
      trim: true
    },
    screenTime: {
      type: String,
      trim: true
    },
    
    // Consent & Logistics
    dataConsent: {
      type: Boolean,
      required: [true, 'Data consent is required']
    },
    contactMethod: {
      type: String,
      enum: ['email', 'phone', 'text', ''],
      default: ''
    },
    sessionPreference: {
      type: Date
    },
    
    // Metadata
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChildProfile'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for age in years
IntakeSchema.virtual('ageInYears').get(function() {
  return this.age / 12;
});

// Pre-save middleware to validate data consent
IntakeSchema.pre('save', function(next) {
  if (!this.dataConsent) {
    const error = new Error('Data consent is required to save intake information');
    return next(error);
  }
  next();
});

const Intake = mongoose.model('Intake', IntakeSchema);

module.exports = Intake; 