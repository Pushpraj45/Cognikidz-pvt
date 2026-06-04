const ImageAssessmentService = require("./service");
const imageAssessmentService = new ImageAssessmentService();

/**
 * Helper method to determine device type from user agent
 */
function getDeviceType(userAgent) {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  } else {
    return "desktop";
  }
}

/**
 * Helper method to analyze response patterns
 */
function analyzeResponsePatterns(responses) {
  const patterns = {
    averageResponseTime: 0,
    responseTimeVariability: 0,
    accuracyTrends: [],
    difficultyCurve: [],
  };

  if (responses.length === 0) return patterns;

  // Calculate average response time
  const totalTime = responses.reduce((sum, r) => sum + r.responseTime, 0);
  patterns.averageResponseTime = Math.round(totalTime / responses.length);

  // Calculate response time variability (standard deviation)
  const mean = patterns.averageResponseTime;
  const variance =
    responses.reduce((sum, r) => sum + Math.pow(r.responseTime - mean, 2), 0) /
    responses.length;
  patterns.responseTimeVariability = Math.round(Math.sqrt(variance));

  // Analyze accuracy trends (rolling accuracy)
  const windowSize = Math.min(5, Math.floor(responses.length / 4));
  for (let i = windowSize - 1; i < responses.length; i++) {
    const window = responses.slice(i - windowSize + 1, i + 1);
    const accuracy =
      (window.filter((r) => r.isCorrect).length / window.length) * 100;
    patterns.accuracyTrends.push({
      questionRange: `${i - windowSize + 2}-${i + 1}`,
      accuracy: Math.round(accuracy),
    });
  }

  return patterns;
}

/**
 * Image Assessment Controller
 * Handles HTTP requests for image-based assessments
 */
class ImageAssessmentController {
  /**
   * Start a new image assessment session
   * POST /api/assessment/image/start
   */
  async startAssessment(req, res) {
    try {
      const { assessmentType, totalQuestions, settings } = req.body;
      const userId = req.user._id;
      const childId = req.body.childId;

      // Validate required fields with strict checking
      if (
        !childId ||
        childId === null ||
        childId === "null" ||
        childId === "" ||
        childId === "undefined"
      ) {
        console.error(
          "❌ Image Assessment Start - Missing or invalid childId:",
          {
            receivedChildId: childId,
            typeOfChildId: typeof childId,
            requestBody: req.body,
            userId: userId,
          }
        );
        return res.status(400).json({
          success: false,
          message:
            "Child ID is required to start an image assessment. Please select a child first.",
        });
      }

      console.log("✅ Image Assessment Start - Valid childId received:", {
        childId,
        userId,
        assessmentType: assessmentType || "autism",
      });

      // Enforce access before starting (image assessments are paid) and usage limits
      try {
        const { checkUserAccess } = require("../../pricing/controller");
        const accessType = `${(assessmentType || 'autism').toLowerCase()}-image`;
        const resp = await checkUserAccess(
          { params: { assessmentType: accessType }, user: req.user },
          { json: (d) => d, status: (c) => ({ json: (o) => ({ code: c, ...o }) }) }
        );
        if (resp && resp.success === true && resp.hasAccess !== true) {
          return res
            .status(402)
            .json({ success: false, message: "Payment required", pricing: resp.pricing || null });
        }
        // Usage limit check for image assessment
        try {
          const { checkUsage } = require('../../pricing/usage');
          const usageReq = { user: req.user, body: { resourceType: 'assessment', resourceKey: accessType, assessmentType: accessType } };
          let usageResult = null;
          await checkUsage(usageReq, {
            json: (d) => { usageResult = d; },
            status: (c) => ({ json: (o) => { usageResult = { code: c, ...o }; } }),
          });
          if (usageResult && usageResult.success === true && usageResult.allowed === false) {
            return res.status(402).json({ success: false, message: 'Usage limit reached', reason: 'limit_reached' });
          }
        } catch (uErr) {
          console.warn('Image assessment usage check failed:', uErr.message);
        }
      } catch (enfErr) {
        console.warn("Image assessment access check failed:", enfErr.message);
      }

      // Extract metadata from request
      const metadata = {
        userAgent: req.headers["user-agent"],
        deviceType: getDeviceType(req.headers["user-agent"]),
        screenResolution: req.body.screenResolution,
        startLocation: req.ip,
      };

      const result = await imageAssessmentService.startAssessment({
        userId,
        childId,
        assessmentType: assessmentType || "autism",
        totalQuestions: totalQuestions || 20,
        settings: settings || {},
        metadata,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error starting image assessment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error starting image assessment",
      });
    }
  }

  /**
   * Submit a response to an image assessment question
   * POST /api/assessment/image/:sessionId/response
   */
  async submitResponse(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;
      const { setId, selectedImage, responseTime } = req.body;

      if (!setId || !selectedImage || !responseTime) {
        return res.status(400).json({
          success: false,
          message: "setId, selectedImage, and responseTime are required",
        });
      }

      if (!["positive", "negative"].includes(selectedImage)) {
        return res.status(400).json({
          success: false,
          message: 'selectedImage must be either "positive" or "negative"',
        });
      }

      const result = await imageAssessmentService.submitResponse(sessionId, {
        setId,
        selectedImage,
        responseTime,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error submitting image assessment response:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error submitting response",
      });
    }
  }

  /**
   * Get current assessment session status
   * GET /api/assessment/image/:sessionId
   */
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await imageAssessmentService.getSession(
        sessionId,
        userId
      );

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          assessmentType: session.assessmentType,
          status: session.status,
          currentQuestion: session.currentQuestion,
          totalQuestions: session.totalQuestions,
          startedAt: session.startedAt,
          lastActiveAt: session.lastActiveAt,
          completedAt: session.completedAt,
          results: session.results,
          settings: session.settings,
        },
      });
    } catch (error) {
      console.error("Error getting image assessment session:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error getting session",
      });
    }
  }

  /**
   * Pause an assessment session
   * POST /api/assessment/image/:sessionId/pause
   */
  async pauseSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      await imageAssessmentService.pauseSession(sessionId, userId);

      res.status(200).json({
        success: true,
        message: "Assessment session paused successfully",
      });
    } catch (error) {
      console.error("Error pausing image assessment session:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error pausing session",
      });
    }
  }

  /**
   * Resume a paused assessment session
   * POST /api/assessment/image/:sessionId/resume
   */
  async resumeSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const result = await imageAssessmentService.resumeSession(
        sessionId,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error resuming image assessment session:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error resuming session",
      });
    }
  }

  /**
   * Get assessment results
   * GET /api/assessment/image/:sessionId/results
   */
  async getResults(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await imageAssessmentService.getSession(
        sessionId,
        userId
      );

      if (session.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Assessment not completed yet",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          assessmentType: session.assessmentType,
          completedAt: session.completedAt,
          results: session.results,
          responses: session.responses,
        },
      });
    } catch (error) {
      console.error("Error getting image assessment results:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error getting results",
      });
    }
  }

  /**
   * Get user's assessment history
   * GET /api/assessment/image/history
   */
  async getHistory(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, assessmentType } = req.query;

      const query = { userId };
      if (assessmentType) {
        query.assessmentType = assessmentType;
      }

      const sessions = await ImageAssessmentSession.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select(
          "sessionId assessmentType status startedAt completedAt results.accuracyRate results.riskLevel"
        );

      const total = await ImageAssessmentSession.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          sessions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalSessions: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error getting assessment history:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error getting history",
      });
    }
  }

  /**
   * Generate assessment report
   * GET /api/assessment/image/:sessionId/report
   */
  async generateReport(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;
      const { format = "json", type = "basic" } = req.query;

      const session = await imageAssessmentService.getSession(
        sessionId,
        userId
      );

      if (session.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Assessment not completed yet",
        });
      }

      let reportData;

      if (type === "ai") {
        // Generate AI-powered report using LLM
        reportData = await imageAssessmentService.generateAIReport(
          sessionId,
          userId
        );
      } else {
        // Generate basic report
        reportData = {
          sessionInfo: {
            sessionId: session.sessionId,
            assessmentType: session.assessmentType,
            completedAt: session.completedAt,
            duration: session.completedAt - session.startedAt,
          },
          results: session.results,
          summary: {
            totalQuestions: session.results.totalQuestions,
            accuracy: session.results.accuracyRate,
            riskLevel: session.results.riskLevel,
            interpretation: session.results.interpretation,
            recommendations: session.results.recommendations,
          },
          detailedAnalysis: {
            domainScores: session.results.domainScores,
            difficultyAnalysis: session.results.difficultyAnalysis,
            responsePatterns: analyzeResponsePatterns(session.responses),
          },
        };
      }

      // Send assessment completion email
      try {
        const EmailNotificationService = require("../email-notification-service");
        const ChildProfile = require("../../childprofile/model");
        const User = require("../../auth/model");

        const childProfile = await ChildProfile.findById(session.childId);
        const parent = await User.findById(userId);

        if (childProfile && parent) {
          const emailResult =
            await EmailNotificationService.sendAssessmentCompletionEmail(
              reportData,
              childProfile,
              parent,
              "image"
            );

          console.log(
            `📧 Image assessment completion email result:`,
            emailResult
          );
        }
      } catch (emailError) {
        console.error(
          "❌ Error sending image assessment completion email:",
          emailError
        );
        // Don't fail the report generation if email fails
      }

      if (format === "pdf") {
        // TODO: Generate PDF report
        return res.status(501).json({
          success: false,
          message: "PDF generation not implemented yet",
        });
      }

      // Increment usage for image assessments once per session
      try {
        const { incrementUsage } = require('../../pricing/usage');
        const accessType = `${(session.assessmentType || 'autism').toLowerCase()}-image`;
        const { ImageAssessmentSession } = require('./model');
        const sess = await ImageAssessmentSession.findOne({ sessionId, userId });
        if (sess && sess.usageCounted !== true) {
          let incResult = null;
          await incrementUsage({ user: req.user, body: { resourceType: 'assessment', resourceKey: accessType, assessmentType: accessType } }, {
            json: (d) => { incResult = d; },
            status: (c) => ({ json: (o) => { incResult = { code: c, ...o }; } }),
          });
          console.log('🧮 Usage increment (image) result:', incResult);
          sess.usageCounted = true;
          await sess.save();
        }
      } catch (incErr) {
        console.warn('Image assessment usage increment failed:', incErr.message);
      }

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error("Error generating assessment report:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error generating report",
      });
    }
  }
}

// Import ImageAssessmentSession model for history endpoint
const { ImageAssessmentSession } = require("./model");

module.exports = new ImageAssessmentController();
