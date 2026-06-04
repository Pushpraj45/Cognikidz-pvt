const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Password is required only if googleId is not present
        return !this.googleId;
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: function () {
        // Last name is required only if googleId is not present (local auth)
        // For Google OAuth, lastName can be empty if not provided by Google
        return !this.googleId;
      },
      trim: true,
      default: "", // Add default empty string for Google users
    },
    profilePicture: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
    },
    parental_role: {
      type: String,
      enum: ["Mother", "Father", "Guardian", "Other", "Parent"],
      default: "Parent",
    },
    occupation: {
      type: String,
      default: "",
    },
    // Health-related information
    mentalHealthInfo: {
      hasMentalIllness: {
        type: Boolean,
        default: false,
      },
      mentalIllnessDetails: {
        type: String,
        default: "",
      },
      hasDepression: {
        type: Boolean,
        default: false,
      },
      hasAnxiety: {
        type: Boolean,
        default: false,
      },
      hasBipolarDisorder: {
        type: Boolean,
        default: false,
      },
      hasSchizophrenia: {
        type: Boolean,
        default: false,
      },
      // For female parents
      hadMaternalStress: {
        type: Boolean,
        default: false,
      },
      hadAutoimmuneDuringPregnancy: {
        type: Boolean,
        default: false,
      },
      hadThyroidIssuesDuringPregnancy: {
        type: Boolean,
        default: false,
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: function () {
        // Google users are automatically verified
        return this.authProvider === "google";
      },
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationToken: String,
    verificationTokenExpires: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.googleId;
        return ret;
      },
    },
  }
);

// Hash password before saving (only for local auth)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method (only for local auth)
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
