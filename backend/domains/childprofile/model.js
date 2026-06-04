// models/childprofile.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const childProfileSchema = new Schema(
  {
    parent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      required: true,
    },
    grade: {
      type: String,
      default: "",
    },
    languages: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
    },
    concerns: [
      {
        type: String,
        enum: [
          "adhd",
          "autism",
          "dyslexia",
          "communication",
          "motor_skills",
          "social",
          "behavior",
          "other",
        ],
      },
    ],
    otherConcern: {
      type: String,
    },
    diagnosis_details: {
      type: String,
    },
    notes: {
      type: String,
    },
    // Family History Fields
    familyHistory: {
      adhd: {
        type: Boolean,
        default: false,
      },
      autism: {
        type: Boolean,
        default: false,
      },
      dyslexia: {
        type: Boolean,
        default: false,
      },
      learningIssues: {
        type: Boolean,
        default: false,
      },
      otherConditions: {
        type: String,
      },
    },
    // Environmental Factors
    environmentalFactors: {
      traumaHistory: {
        type: Boolean,
        default: false,
      },
      traumaDetails: {
        type: String,
      },
      screenTimeHours: {
        type: Number,
        min: 0,
        max: 24,
      },
      parentingStyle: {
        type: String,
        enum: [
          "authoritative",
          "authoritarian",
          "permissive",
          "uninvolved",
          "other",
        ],
        default: "other",
      },
    },
    // School Records
    schoolRecords: {
      academicPerformance: {
        type: String,
        enum: [
          "excellent",
          "good",
          "average",
          "below_average",
          "poor",
          "unknown",
        ],
        default: "unknown",
      },
      learningDifficulties: {
        type: Boolean,
        default: false,
      },
      attentionIssues: {
        type: Boolean,
        default: false,
      },
      schoolNotes: {
        type: String,
      },
    },
    parental_consent: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for child's age
childProfileSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Virtual for assessments
childProfileSchema.virtual("assessments", {
  ref: "Assessment",
  localField: "_id",
  foreignField: "child",
});

const ChildProfile = mongoose.model("ChildProfile", childProfileSchema);

module.exports = ChildProfile;
