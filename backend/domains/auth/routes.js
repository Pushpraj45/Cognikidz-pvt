// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const passport = require("../../config/passport");
const { protect } = require("../auth/middleware");
const authController = require("./controller");
const authValidator = require("./validator");
const logger = require("../../utils/logger");
const { ApiError } = require("../shared/error-middleware");

// Configure multer for file uploads with enhanced security
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    fieldNameSize: 100, // Limit field name size to prevent CVE-2025-48997
    fieldSize: 1 * 1024 * 1024, // 1MB limit for field values
    fields: 10, // Maximum number of fields
    files: 1, // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Enhanced security checks
    if (!file.fieldname || file.fieldname.trim() === '') {
      return cb(new Error('Invalid field name detected'), false);
    }
    
    // Check for path traversal in filename
    if (file.originalname && (file.originalname.includes('../') || file.originalname.includes('..\\') || /[<>:"|?*]/.test(file.originalname))) {
      return cb(new Error('Invalid filename detected'), false);
    }
    
    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed!'), false);
    }
    
    cb(null, true);
  },
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "File too large. Maximum size is 2MB."));
    }
    return next(new ApiError(400, `Upload error: ${err.message}`));
  } else if (err) {
    return next(new ApiError(400, err.message));
  }
  next();
};

// Test route to check if auth routes are accessible
router.get("/test", (req, res) => {
  logger.info("Auth test route accessed");
  res.json({
    status: "success",
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Test authentication route for integration testing
router.post("/test-login", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for test login"
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Generate test token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    logger.info(`Test login successful for user: ${email}`);
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    logger.error("Test login error:", error);
    res.status(500).json({
      success: false,
      message: "Test login failed"
    });
  }
});

// Public routes
router.post(
  "/register",
  authValidator.validateRegistration,
  authController.register
);
router.post("/login", authValidator.validateLogin, authController.login);
router.get("/check-email", authController.checkEmailExists);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
  }),
  authController.googleAuthSuccess
);

router.get("/google/failure", authController.googleAuthFailure);

// Google credential verification route (for frontend Google login)
router.post("/google/verify", authController.verifyGoogleCredential);

// Protected routes
router.get("/profile", protect, authController.getUserProfile);
router.put(
  "/profile",
  protect,
  authValidator.validateProfileUpdate,
  authController.updateUserProfile
);
router.put(
  "/profile/picture",
  protect,
  upload.single("avatar"),
  handleMulterError,
  authController.updateProfilePicture
);

// Email verification route
router.get("/verify-email/:token", authController.verifyEmail);

// Resend verification email route
router.post("/resend-verification", authController.resendVerificationEmail);

// Forgot password route
router.post("/forgot-password", authController.forgotPassword);

// Reset password route
router.post("/reset-password/:token", authController.resetPassword);

// Add specific error handling middleware for auth routes
router.use((err, req, res, next) => {
  console.error("Auth route error:", err);

  // Handle specific auth errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data format",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Authentication error occurred",
  });
});

module.exports = router;
