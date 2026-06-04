const express = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./controller");
const {
  feedbackValidationRules,
  handleValidationErrors,
} = require("./validator");

const router = express.Router();

// Rate limiting for feedback submission (more restrictive for public access)
const feedbackSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 feedback submissions per 15 minutes
  message: {
    success: false,
    error: "Too many feedback submissions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for feedback retrieval (for admin access)
const feedbackRetrievalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more requests for admin operations
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for public viewing (less restrictive than admin)
const feedbackViewLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Allow 30 requests per minute for viewing
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)
// Submit feedback - available to anyone
router.post(
  "/submit",
  feedbackSubmissionLimiter,
  feedbackValidationRules(),
  handleValidationErrors,
  controller.createFeedback
);

// Check if feedback submission is available
router.get("/status", controller.getSubmissionStatus);

// Public feedback viewing route - for owner to see all responses
router.get("/view", feedbackViewLimiter, controller.getAllFeedback);

// Public feedback stats route
router.get("/view/stats", feedbackViewLimiter, controller.getFeedbackStats);

// Admin routes (these would typically require authentication middleware)
// For now, they're available but with rate limiting
// In production, you should add authentication middleware before these routes

// Get all feedback with pagination and filtering
router.get("/", feedbackRetrievalLimiter, controller.getAllFeedback);

// Get feedback statistics
router.get("/stats", feedbackRetrievalLimiter, controller.getFeedbackStats);

// Search feedback
router.get("/search", feedbackRetrievalLimiter, controller.searchFeedback);

// Get specific feedback by ID
router.get("/:id", feedbackRetrievalLimiter, controller.getFeedbackById);

// Update feedback status
router.patch(
  "/:id/status",
  feedbackRetrievalLimiter,
  handleValidationErrors,
  controller.updateFeedbackStatus
);

// Update feedback priority
router.patch(
  "/:id/priority",
  feedbackRetrievalLimiter,
  handleValidationErrors,
  controller.updateFeedbackPriority
);

// Assign feedback to someone
router.patch(
  "/:id/assign",
  feedbackRetrievalLimiter,
  controller.assignFeedback
);

// Delete feedback (soft delete)
router.delete("/:id", feedbackRetrievalLimiter, controller.deleteFeedback);

module.exports = router;
