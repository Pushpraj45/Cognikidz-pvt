const jwt = require("jsonwebtoken");
const { ApiError } = require("../shared/error-middleware");
const User = require("../auth/model");
const logger = require("../../utils/logger");
const { sendEmail } = require("../../config/mail");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
} = require("./service");
const crypto = require("crypto");
const { awsS3Service } = require("../../services/aws-s3.service");

/**
 * Register a new user
 * @route POST /auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    logger.info(`Registration attempt for email: ${email}`);

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.info(
        `Registration failed: User with email ${email} already exists`
      );
      return next(new ApiError(400, "User already exists"));
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user with email verification token and isVerified set to false
    logger.info(`Creating new user for email: ${email}`);
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      authProvider: "local",
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email
    await sendVerificationEmail(user);

    // Generate token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return user data with token
    logger.info(`User registration successful for email: ${email}`);
    res.status(201).json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      token,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    logger.error("Registration error:", error);
    next(new ApiError(500, "Registration failed: " + error.message));
  }
};

/**
 * Verify user email
 * @route GET /auth/verify-email/:token
 * @access Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Log only once per verification attempt
    logger.info(
      `Email verification attempt with token: ${token ? token.substring(0, 10) + "..." : "undefined"}`
    );

    if (!token) {
      logger.error("Email verification failed: No token provided");
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    // Add response caching header to prevent multiple identical requests
    res.setHeader("Cache-Control", "private, max-age=60"); // Cache for 60 seconds

    // First check if a user with this token already exists but is verified
    // This helps with the case where the user clicks the link multiple times
    const alreadyVerifiedUser = await User.findOne({
      verificationToken: token,
      isVerified: true,
    });

    if (alreadyVerifiedUser) {
      logger.info(
        `Email already verified for user: ${alreadyVerifiedUser.email}`
      );
      return res.status(200).json({
        message: "Email already verified. You can now login to your account.",
        alreadyVerified: true,
      });
    }

    // Then check for a valid token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if token exists but has expired
      const expiredTokenUser = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $lte: Date.now() },
      });

      if (expiredTokenUser) {
        logger.error(
          `Email verification failed: Token expired for user: ${expiredTokenUser.email}`
        );
        return res.status(400).json({
          message:
            "Verification token has expired. Please request a new verification email.",
          expired: true,
        });
      }

      logger.error(
        `Email verification failed: Invalid or expired token: ${token.substring(0, 10)}...`
      );
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    // Mark user as verified and clear verification tokens
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    logger.info(`Email verification successful for user: ${user.email}`);
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    logger.error("Email verification error:", error);
    res
      .status(500)
      .json({ message: "Error verifying email", error: error.message });
  }
};

/**
 * Resend verification email
 * @route POST /auth/resend-verification
 * @access Public
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        errorType: "MISSING_EMAIL",
      });
    }

    logger.info(`Resend verification email requested for: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security reasons
      return res.status(200).json({
        message:
          "If your email is registered and unverified, you will receive a verification email shortly.",
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(200).json({
        message:
          "This email address is already verified. You can log in to your account.",
        alreadyVerified: true,
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user);

    logger.info(`Verification email resent to: ${email}`);

    res.status(200).json({
      message:
        "If your email is registered and unverified, you will receive a verification email shortly.",
    });
  } catch (error) {
    logger.error("Resend verification email error:", error);
    next(new ApiError(500, "Could not resend verification email"));
  }
};

/**
 * Login user
 * @route POST /auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    // Find user
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      logger.info(`Login failed: User not found for email: ${email}`);
      return res.status(401).json({
        message:
          "No account found with this email address. Please sign up first.",
        errorType: "USER_NOT_FOUND",
      });
    }

    // Check if user is using Google OAuth
    if (user.authProvider === "google") {
      logger.info(
        `Login failed: Google user attempted password login: ${email}`
      );
      return res.status(401).json({
        message: "Please use Google Sign-In for this account",
        errorType: "GOOGLE_AUTH_REQUIRED",
      });
    }

    // Check if password matches
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      logger.info(`Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({
        message: "Invalid password. Please check your password and try again.",
        errorType: "INVALID_PASSWORD",
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      logger.info(`Login failed: Unverified user attempted login: ${email}`);
      return res.status(401).json({
        message:
          "Please verify your email first. Check your inbox for the verification link.",
        isVerified: false,
        email: user.email,
        errorType: "EMAIL_NOT_VERIFIED",
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    logger.info(`Login successful for user: ${email}`);

    res.json({
      _id: user._id,
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      token,
    });
  } catch (error) {
    logger.error("Login error:", error);
    next(new ApiError(500, "Login failed"));
  }
};

/**
 * Get user profile
 * @route GET /auth/profile
 * @access Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    res.json({
      _id: user._id,
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      occupation: user.occupation,
      parental_role: user.parental_role,
      mentalHealthInfo: user.mentalHealthInfo,
      profilePicture: user.profilePicture,
      profile_picture: user.profilePicture,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    next(new ApiError(500, "Could not fetch user profile"));
  }
};

/**
 * Update user profile
 * @route PUT /auth/profile
 * @access Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Update fields
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.location = req.body.location || user.location;
    user.parental_role = req.body.parental_role || user.parental_role;

    // New fields
    if (req.body.dateOfBirth) {
      user.dateOfBirth = req.body.dateOfBirth;
    }
    if (req.body.occupation) {
      user.occupation = req.body.occupation;
    }

    // Handle mental health info if provided
    if (req.body.mentalHealthInfo) {
      user.mentalHealthInfo = {
        ...(user.mentalHealthInfo || {}),
        ...req.body.mentalHealthInfo,
      };
    }

    // If password is provided, update it
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      id: updatedUser._id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      address: updatedUser.address,
      location: updatedUser.location,
      dateOfBirth: updatedUser.dateOfBirth,
      occupation: updatedUser.occupation,
      parental_role: updatedUser.parental_role,
      mentalHealthInfo: updatedUser.mentalHealthInfo,
      profilePicture: updatedUser.profilePicture,
      isAdmin: updatedUser.isAdmin,
      isVerified: updatedUser.isVerified,
      message: "Profile updated successfully",
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    next(new ApiError(500, "Could not update user profile"));
  }
};

/**
 * Update user profile picture
 * @route PUT /auth/profile/picture
 * @access Private
 */
const updateProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Check if file was uploaded
    if (!req.file) {
      return next(new ApiError(400, "No file uploaded"));
    }

    let profilePictureUrl = "";

    try {
      // Delete old profile picture if exists
      if (user.profilePicture) {
        await awsS3Service.deleteFile(user.profilePicture);
      }

      // Upload new profile picture to AWS S3
      profilePictureUrl = await awsS3Service.uploadImage(
        req.file,
        "profile-pictures"
      );

      logger.info(
        `Profile picture uploaded successfully: ${profilePictureUrl}`
      );
    } catch (uploadError) {
      logger.error("Profile picture upload error:", uploadError);
      return next(new ApiError(500, "Failed to upload profile picture"));
    }

    // Update user profile with picture URL
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.json({
      _id: user._id,
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      profile_picture: profilePictureUrl,
      profilePicture: profilePictureUrl,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    logger.error("Update profile picture error:", error);
    next(new ApiError(500, "Could not update profile picture"));
  }
};

/**
 * Check if email exists
 * @route GET /auth/check-email
 * @access Public
 */
const checkEmailExists = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return next(new ApiError(400, "Email is required"));
    }

    logger.info(`Checking if email exists: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    // Return whether user exists or not
    return res.json({
      exists: !!user,
      email,
    });
  } catch (error) {
    logger.error("Error checking email:", error);
    next(new ApiError(500, "Error checking email"));
  }
};

/**
 * Request password reset
 * @route POST /auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    logger.info(`Password reset requested for email: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        message:
          "If your email is registered, you will receive a reset link shortly.",
      });
    }

    // Generate reset token using crypto
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store token and expiry in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      message:
        "If your email is registered, you will receive a reset link shortly.",
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    next(new ApiError(500, "Could not process password reset request"));
  }
};

/**
 * Reset password with token
 * @route POST /auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    logger.info("Processing password reset");

    // Find user by token and check expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.error("User not found for reset token or token expired");
      return next(
        new ApiError(400, "Password reset token is invalid or has expired")
      );
    }

    // Check password requirements
    if (!password || password.length < 8) {
      return next(
        new ApiError(400, "Password must be at least 8 characters long")
      );
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return next(
        new ApiError(
          400,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&)"
        )
      );
    }

    // Update password and clear reset token fields
    user.password = password; // This will trigger the pre-save hook to hash the password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Force the password to be hashed by marking it as modified
    user.markModified("password");

    // Save the user with the new password
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);

    // Send password changed confirmation email
    await sendPasswordChangedEmail(user);

    res.status(200).json({
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    next(new ApiError(500, "Could not reset password"));
  }
};

/**
 * Google OAuth Success Handler
 * @route GET /auth/google/success
 * @access Private (via passport)
 */
const googleAuthSuccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Google authentication failed"));
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, isAdmin: req.user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    logger.info(`Google OAuth successful for user: ${req.user.email}`);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error("Google auth success error:", error);
    const errorUrl = `${process.env.FRONTEND_URL}/auth/google/error?message=${encodeURIComponent("Authentication failed")}`;
    res.redirect(errorUrl);
  }
};

/**
 * Google OAuth Failure Handler
 * @route GET /auth/google/failure
 * @access Public
 */
const googleAuthFailure = (req, res) => {
  logger.error("Google OAuth failure");
  const errorUrl = `${process.env.FRONTEND_URL}/auth/google/error?message=${encodeURIComponent("Google authentication failed")}`;
  res.redirect(errorUrl);
};

/**
 * Verify Google credential from frontend
 * @route POST /auth/google/verify
 * @access Public
 */
const verifyGoogleCredential = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      logger.error("Google credential is missing from request");
      return next(new ApiError(400, "Google credential is required"));
    }

    logger.info("Starting Google credential verification process");

    // Verify the Google JWT token with improved error handling
    let OAuth2Client;
    try {
      // Try different import methods for better compatibility
      let googleAuthLib;
      try {
        googleAuthLib = require("google-auth-library");
      } catch (importError) {
        logger.error("Primary google-auth-library import failed:", importError);
        // Try alternative import
        try {
          const { OAuth2Client: OAuth2ClientAlt } = await import(
            "google-auth-library"
          );
          OAuth2Client = OAuth2ClientAlt;
          logger.info(
            "Successfully imported google-auth-library via ES6 import"
          );
        } catch (esImportError) {
          logger.error("ES6 import also failed:", esImportError);
          throw importError;
        }
      }

      if (!OAuth2Client && googleAuthLib) {
        OAuth2Client = googleAuthLib.OAuth2Client;
        logger.info("Successfully imported google-auth-library via CommonJS");
      }

      if (!OAuth2Client) {
        throw new Error("Could not find OAuth2Client in google-auth-library");
      }
    } catch (importError) {
      logger.error("Failed to import google-auth-library:", importError);
      logger.error("Error details:", {
        code: importError.code,
        message: importError.message,
        stack: importError.stack?.split("\n")[0],
      });

      // Log additional debugging information
      logger.error("Node version:", process.version);
      logger.error("NPM version from environment:", process.env.npm_version);

      return next(
        new ApiError(
          500,
          "Google authentication library is not available. Please contact support."
        )
      );
    }

    // Check if Google Client ID is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      logger.error("GOOGLE_CLIENT_ID environment variable is not set");
      return next(new ApiError(500, "Google OAuth is not properly configured"));
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    logger.info("OAuth2Client initialized successfully");

    let ticket;
    try {
      logger.info("Attempting to verify Google ID token");
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      logger.info("Google ID token verified successfully");
    } catch (verifyError) {
      logger.error("Google token verification failed:", verifyError);

      if (
        verifyError.message.includes("Token used too early") ||
        verifyError.message.includes("Token used too late")
      ) {
        return next(
          new ApiError(
            400,
            "Google token timing error. Please try signing in again."
          )
        );
      }

      if (
        verifyError.message.includes("Invalid token") ||
        verifyError.message.includes("Wrong recipient")
      ) {
        return next(
          new ApiError(
            400,
            "Invalid Google credential. Please try signing in again."
          )
        );
      }

      if (verifyError.message.includes("audience")) {
        logger.error(
          "Google Client ID mismatch - check GOOGLE_CLIENT_ID environment variable"
        );
        return next(
          new ApiError(400, "Google authentication configuration error")
        );
      }

      // Generic verification error
      return next(new ApiError(400, "Failed to verify Google credential"));
    }

    const payload = ticket.getPayload();

    if (!payload) {
      logger.error("Google token payload is empty");
      return next(new ApiError(400, "Invalid Google token payload"));
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture,
    } = payload;

    if (!email || !googleId) {
      logger.error("Missing required fields in Google token payload", {
        email: !!email,
        googleId: !!googleId,
      });
      return next(new ApiError(400, "Incomplete Google profile information"));
    }

    logger.info(`Google credential verification for email: ${email}`);

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      // Check if user exists with same email but different auth provider
      user = await User.findOne({ email });
      if (user) {
        // Link Google account to existing user
        try {
          user.googleId = googleId;
          user.authProvider = "google";
          user.isVerified = true;
          user.lastLogin = Date.now();
          if (!user.profilePicture && picture) {
            user.profilePicture = picture;
          }
          await user.save();
          logger.info(`Google account linked to existing user: ${user.email}`);
        } catch (saveError) {
          logger.error("Error linking Google account to existing user:", saveError);
          return next(new ApiError(500, "Failed to link Google account"));
        }
      } else {
        // Create new user
        try {
          user = await User.create({
            googleId,
            authProvider: "google",
            email,
            firstName: firstName || "User",
            lastName: lastName || "",
            profilePicture: picture || "",
            isVerified: true,
            lastLogin: Date.now(),
          });
          logger.info(`New Google user created: ${user.email}`);
          isNewUser = true;
        } catch (createError) {
          logger.error("Error creating new Google user:", createError);
          if (createError.code === 11000) {
            return next(new ApiError(409, "An account with this email already exists"));
          }
          if (createError.name === "ValidationError") {
            const validationErrors = Object.values(createError.errors).map((err) => err.message);
            logger.error("User validation errors:", validationErrors);
            logger.error("User data attempted:", {
              googleId,
              email,
              firstName: firstName || "User",
              lastName: lastName || "",
              hasFirstName: !!firstName,
              hasLastName: !!lastName,
            });
            return next(new ApiError(400, `Validation error: ${validationErrors.join(", ")}`));
          }
          return next(new ApiError(500, "Failed to create user account"));
        }
      }
    } else {
      // User exists with Google ID, update last login
      try {
        user.lastLogin = Date.now();
        await user.save();
        logger.info(`Google login successful for existing user: ${user.email}`);
      } catch (saveError) {
        logger.error("Error updating user last login:", saveError);
        // Continue anyway - authentication was successful
      }
    }

    // Only send welcome email if this is a new user
    if (isNewUser) {
      try {
        logger.info(`Attempting to send welcome email to new Google user: ${user.email}`);
        await sendWelcomeEmail(user);
        logger.info(`Welcome email sent to new Google user: ${user.email}`);
      } catch (emailError) {
        logger.error("Failed to send welcome email to new Google user:", emailError);
        // Do not block signup if email fails
      }
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
    } catch (tokenError) {
      logger.error("Error generating JWT token:", tokenError);
      return next(new ApiError(500, "Failed to generate authentication token"));
    }

    if (!token) {
      logger.error("Generated token is empty");
      return next(new ApiError(500, "Authentication token generation failed"));
    }

    logger.info(`Google authentication successful for user: ${user.email}`);

    res.json({
      _id: user._id,
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      token,
    });
  } catch (error) {
    logger.error("Google credential verification error:", error);

    // Check for specific error types
    if (error.name === "MongoError" || error.name === "MongooseError") {
      return next(new ApiError(500, "Database connection error"));
    }

    if (error.message && error.message.includes("GOOGLE_CLIENT_ID")) {
      return next(new ApiError(500, "Google OAuth configuration error"));
    }

    // Generic error fallback
    next(new ApiError(500, "Google authentication failed. Please try again."));
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  checkEmailExists,
  forgotPassword,
  resetPassword,
  googleAuthSuccess,
  googleAuthFailure,
  verifyGoogleCredential,
};
