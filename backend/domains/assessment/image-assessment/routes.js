const express = require("express");
const router = express.Router();
const { protect } = require("../../auth/middleware");
const imageAssessmentController = require("./controller");

/**
 * Image Assessment Routes
 * All routes are protected and require authentication
 */

/**
 * @route   POST /api/assessment/image/start
 * @desc    Start a new image assessment session
 * @access  Private
 * @body    { assessmentType, totalQuestions, settings, childId, screenResolution }
 */
router.post("/start", protect, imageAssessmentController.startAssessment);

/**
 * @route   POST /api/assessment/image/:sessionId/response
 * @desc    Submit a response to an image assessment question
 * @access  Private
 * @params  sessionId - Assessment session ID
 * @body    { setId, selectedImage, responseTime }
 */
router.post(
  "/:sessionId/response",
  protect,
  imageAssessmentController.submitResponse
);

/**
 * @route   GET /api/assessment/image/:sessionId
 * @desc    Get current assessment session status
 * @access  Private
 * @params  sessionId - Assessment session ID
 */
router.get("/:sessionId", protect, imageAssessmentController.getSession);

/**
 * @route   POST /api/assessment/image/:sessionId/pause
 * @desc    Pause an assessment session
 * @access  Private
 * @params  sessionId - Assessment session ID
 */
router.post(
  "/:sessionId/pause",
  protect,
  imageAssessmentController.pauseSession
);

/**
 * @route   POST /api/assessment/image/:sessionId/resume
 * @desc    Resume a paused assessment session
 * @access  Private
 * @params  sessionId - Assessment session ID
 */
router.post(
  "/:sessionId/resume",
  protect,
  imageAssessmentController.resumeSession
);

/**
 * @route   GET /api/assessment/image/:sessionId/results
 * @desc    Get assessment results for a completed session
 * @access  Private
 * @params  sessionId - Assessment session ID
 */
router.get(
  "/:sessionId/results",
  protect,
  imageAssessmentController.getResults
);

/**
 * @route   GET /api/assessment/image/:sessionId/report
 * @desc    Generate assessment report
 * @access  Private
 * @params  sessionId - Assessment session ID
 * @query   format - Report format (json, pdf)
 */
router.get(
  "/:sessionId/report",
  protect,
  imageAssessmentController.generateReport
);

/**
 * @route   GET /api/assessment/image/history
 * @desc    Get user's assessment history
 * @access  Private
 * @query   page, limit, assessmentType
 */
router.get("/history", protect, imageAssessmentController.getHistory);

module.exports = router;
