const express = require("express");
const router = express.Router();
const { protect } = require("../auth/middleware");
const {
  getDashboardOverview,
  getRecentAssessments,
  getInProgressAssessments,
  getDashboardStats,
  getAssessmentCounts,
  getChildProgress,
  getProgressOverview,
  getChildReports,
  getAllUserReports,
  getReportById,
  downloadReport,
  deleteReport,
} = require("./controller");

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview with parent details and basic stats
 * @access  Private
 */
router.get("/overview", protect, getDashboardOverview);

/**
 * @route   GET /api/dashboard/recent-assessments
 * @desc    Get recent assessment results (top 5 per child)
 * @access  Private
 */
router.get("/recent-assessments", protect, getRecentAssessments);

/**
 * @route   GET /api/dashboard/in-progress-assessments
 * @desc    Get all in-progress assessments
 * @access  Private
 */
router.get("/in-progress-assessments", protect, getInProgressAssessments);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics summary
 * @query   ?assessmentType=all|text|image|game - Filter by assessment type
 * @access  Private
 */
router.get("/stats", protect, getDashboardStats);

/**
 * @route   GET /api/dashboard/assessment-counts
 * @desc    Get assessment counts by type for filter badges
 * @access  Private
 */
router.get("/assessment-counts", protect, getAssessmentCounts);

/**
 * @route   GET /api/dashboard/child-progress/:childId
 * @desc    Get progress visualization data for a specific child
 * @query   ?assessmentType=all|text|image|game - Filter by assessment type
 * @access  Private
 */
router.get("/child-progress/:childId", protect, getChildProgress);

/**
 * @route   GET /api/dashboard/progress-overview
 * @desc    Get progress overview for all children
 * @query   ?assessmentType=all|text|image|game - Filter by assessment type
 * @access  Private
 */
router.get("/progress-overview", protect, getProgressOverview);

/**
 * @route   GET /api/dashboard/reports
 * @desc    Get all reports for current user
 * @access  Private
 */
router.get("/reports", protect, getAllUserReports);

/**
 * @route   GET /api/dashboard/reports/child/:childId
 * @desc    Get reports for a specific child with optional filtering
 * @query   ?assessmentType=all|text|image|game - Filter by assessment type
 * @query   ?page=1&limit=10 - Pagination parameters
 * @access  Private
 */
router.get("/reports/child/:childId", protect, getChildReports);

/**
 * @route   GET /api/dashboard/reports/:reportId
 * @desc    Get a specific report by ID
 * @access  Private
 */
router.get("/reports/:reportId", protect, getReportById);

/**
 * @route   GET /api/dashboard/reports/:reportId/download
 * @desc    Download a report as PDF
 * @access  Private
 */
router.get("/reports/:reportId/download", protect, downloadReport);

/**
 * @route   DELETE /api/dashboard/reports/:reportId
 * @desc    Delete a report
 * @access  Private
 */
router.delete("/reports/:reportId", protect, deleteReport);

module.exports = router;
