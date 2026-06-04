const express = require("express");
const router = express.Router();
const { protect } = require("../auth/middleware");
const universalPDFService = require("../../services/universal-pdf.service");
const logger = require("../../utils/logger");

/**
 * @route   GET /api/pdf/health
 * @desc    Check PDF service health
 * @access  Public (for monitoring)
 */
router.get("/health", async (req, res) => {
  try {
    const health = await universalPDFService.healthCheck();
    const statusCode = health.status === 'error' ? 503 : 200;
    
    res.status(statusCode).json({
      success: health.status !== 'error',
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("PDF health check failed:", error);
    res.status(503).json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/pdf/diagnostics
 * @desc    Detailed diagnostics for PDF service deployment
 * @access  Public (for debugging)
 */
router.get("/diagnostics", async (req, res) => {
  try {
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    // Check package availability
    let chromiumStatus = { available: false };
    try {
      const chromium = require("@sparticuz/chromium");
      chromiumStatus = { 
        available: true, 
        version: chromium.version || "unknown",
        executablePath: "available"
      };
    } catch (error) {
      chromiumStatus = { 
        available: false, 
        error: error.message,
        code: error.code 
      };
    }

    let puppeteerCoreStatus = { available: false };
    try {
      const puppeteerCore = require("puppeteer-core");
      puppeteerCoreStatus = { 
        available: true, 
        version: puppeteerCore.version || "unknown"
      };
    } catch (error) {
      puppeteerCoreStatus = { 
        available: false, 
        error: error.message 
      };
    }

    // Check chromium service method
    const chromiumCheck = await universalPDFService.checkChromiumAvailability();

    const diagnostics = {
      environment: {
        isServerless,
        nodeVersion: process.version,
        platform: process.platform,
        vercelEnv: process.env.VERCEL,
        lambdaEnv: process.env.AWS_LAMBDA_FUNCTION_NAME,
      },
      packages: {
        chromium: chromiumStatus,
        puppeteerCore: puppeteerCoreStatus,
      },
      serviceDiagnostics: chromiumCheck,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      suggestions: isServerless && !chromiumStatus.available ? [
        "Check that @sparticuz/chromium is in dependencies (not devDependencies)",
        "Verify Vercel build completed successfully",
        "Review deployment logs for npm install errors",
        "Try redeploying with fresh dependencies"
      ] : []
    };

    logger.info("📊 PDF Diagnostics requested:", diagnostics);

    res.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    logger.error("❌ PDF diagnostics failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    });
  }
});

// Import services for data fetching
const Article = require("../article/model").Article;
const ChildProfileService = require("../childprofile/service");
const Assessment = require("../assessment/model");
const {
  ImageAssessmentSession,
} = require("../assessment/image-assessment/model");

// Helper function to get child assessments
const getChildAssessments = async (childId, userId) => {
  try {
    // Get regular assessments
    const assessments = await Assessment.find({
      childId: childId,
      userId: userId,
    })
      .populate("childId", "firstName lastName dateOfBirth")
      .sort({ createdAt: -1 })
      .limit(20);

    // Get image assessments
    const imageAssessments = await ImageAssessmentSession.find({
      childId: childId,
      userId: userId,
    })
      .populate("childId", "firstName lastName dateOfBirth")
      .sort({ createdAt: -1 })
      .limit(20);

    // Combine and sort all assessments
    const allAssessments = [
      ...assessments.map((a) => ({
        ...a.toObject(),
        assessmentType: a.assessmentType || "General Assessment",
        status: a.status || "completed",
      })),
      ...imageAssessments.map((a) => ({
        ...a.toObject(),
        assessmentType: a.assessmentType || "Image Assessment",
        status: a.status || "completed",
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return allAssessments;
  } catch (error) {
    logger.error("Error fetching child assessments:", error);
    return [];
  }
};

/**
 * @route   GET /api/pdf/article/:articleId
 * @desc    Generate PDF for article
 * @access  Private
 */
router.get("/article/:articleId", protect, async (req, res, next) => {
  try {
    const { articleId } = req.params;

    // Fetch article data
    const article = await Article.findById(articleId)
      .populate("author", "firstName lastName")
      .populate({
        path: "comments",
        select: "content createdAt user",
        match: { isDeleted: false },
        populate: {
          path: "user",
          select: "firstName lastName",
        },
      });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    // Transform article data for PDF generation
    const transformedArticle = {
      ...article.toJSON(),
      content: article.body,
      image: article.bannerUrl,
      author: article.author ? {
        ...article.author.toJSON(),
        name: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || 'Anonymous'
      } : {
        name: 'Anonymous',
        firstName: '',
        lastName: ''
      }
    };

    // Generate PDF
    const pdfBuffer = await universalPDFService.generatePDF("article", transformedArticle);

    // Set response headers
    const fileName = `${article.title.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}-cognikidz.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);

    logger.info(`Article PDF generated: ${articleId}`);
  } catch (error) {
    logger.error("Article PDF generation failed:", error);
    next(error);
  }
});

/**
 * @route   GET /api/pdf/child-profile/:childId
 * @desc    Generate PDF for child profile
 * @access  Private
 */
router.get("/child-profile/:childId", protect, async (req, res, next) => {
  try {
    const { childId } = req.params;
    const userId = req.user._id;

    // Fetch child profile data
    const child = await ChildProfileService.getChildById(childId, userId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child profile not found",
      });
    }

    // Get assessment history for the child
    const assessments = await getChildAssessments(childId, userId);

    const profileData = {
      ...child,
      assessments,
      generatedAt: new Date(),
      parentName: `${req.user.firstName} ${req.user.lastName}`,
    };

    // Generate PDF
    const pdfBuffer = await universalPDFService.generatePDF(
      "child-profile",
      profileData
    );

    // Set response headers
    const fileName = `${child.firstName}-${child.lastName}-profile-cognikidz.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);

    logger.info(`Child profile PDF generated: ${childId}`);
  } catch (error) {
    logger.error("Child profile PDF generation failed:", error);
    next(error);
  }
});

/**
 * @route   GET /api/pdf/dashboard-progress
 * @desc    Generate PDF for dashboard progress overview
 * @access  Private
 */
router.get("/dashboard-progress", protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { childId } = req.query;

    // Fetch children and progress data
    const children = await ChildProfileService.getChildren(userId);

    // If specific child requested, filter data
    let filteredChildren = children;
    if (childId) {
      filteredChildren = children.filter(
        (child) => child._id.toString() === childId
      );
    }

    // Enhance children data with assessment info
    const enhancedChildren = await Promise.all(
      filteredChildren.map(async (child) => {
        const assessments = await getChildAssessments(child._id, userId);
        return {
          ...child.toObject(),
          assessments,
          completedAssessments: assessments.filter(
            (a) => a.status === "completed"
          ).length,
          inProgressAssessments: assessments.filter(
            (a) => a.status === "in_progress"
          ).length,
          lastAssessment:
            assessments.length > 0
              ? assessments[0].completedAt || assessments[0].createdAt
              : null,
          recentAssessments: assessments.slice(0, 3).map((a) => ({
            type: a.assessmentType,
            date: a.completedAt || a.createdAt,
            status: a.status,
          })),
        };
      })
    );

    const dashboardData = {
      children: enhancedChildren,
      parentName: `${req.user.firstName} ${req.user.lastName}`,
      generatedAt: new Date(),
      totalChildren: enhancedChildren.length,
      totalAssessments: enhancedChildren.reduce(
        (sum, child) => sum + child.assessments.length,
        0
      ),
    };

    // Generate PDF
    const pdfBuffer = await universalPDFService.generatePDF(
      "dashboard-progress",
      dashboardData
    );

    // Set response headers
    const fileName = `dashboard-progress-${
      new Date().toISOString().split("T")[0]
    }-cognikidz.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);

    logger.info(`Dashboard progress PDF generated for user: ${userId}`);
  } catch (error) {
    logger.error("Dashboard progress PDF generation failed:", error);
    next(error);
  }
});

/**
 * @route   GET /api/pdf/debug/sessions
 * @desc    Debug route to check user sessions (temporary)
 * @access  Private
 */
router.get("/debug/sessions", protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get regular assessments
    const regularAssessments = await Assessment.find({ userId })
      .select("_id assessmentType createdAt")
      .limit(5);

    // Get image assessment sessions
    const imageSessions = await ImageAssessmentSession.find({ userId })
      .select("sessionId assessmentType status createdAt")
      .limit(10);

    // Get all sessions without user filter (for debugging - remove in production)
    const allSessions = await ImageAssessmentSession.find({})
      .select("sessionId userId assessmentType status createdAt")
      .limit(20);

    res.json({
      success: true,
      data: {
        userId,
        regularAssessments: regularAssessments.map((a) => ({
          id: a._id,
          type: a.assessmentType,
          created: a.createdAt,
        })),
        userImageSessions: imageSessions.map((s) => ({
          sessionId: s.sessionId,
          type: s.assessmentType,
          status: s.status,
          created: s.createdAt,
        })),
        allImageSessions: allSessions.map((s) => ({
          sessionId: s.sessionId,
          userId: s.userId,
          type: s.assessmentType,
          status: s.status,
          created: s.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error("Debug sessions failed:", error);
    next(error);
  }
});

/**
 * @route   GET /api/pdf/assessment-report/:reportId
 * @desc    Generate enhanced PDF for assessment report
 * @access  Private
 */
router.get("/assessment-report/:reportId", protect, async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;
    const mongoose = require("mongoose");

    logger.info(
      `🔍 Looking for assessment/session with ID: ${reportId} for user: ${userId}`
    );

    let assessment = null;
    let isImageAssessment = false;

    // Check if reportId looks like a session ID
    if (reportId.startsWith("session_")) {
      logger.info(`🎯 Searching for session: ${reportId}`);

      // First try to find a regular assessment (like the assessment report route does)
      assessment = await Assessment.findOne({ sessionId: reportId })
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender",
        })
        .populate({
          path: "intakeId",
          select: "primaryConcerns childName age gender",
        });

      if (assessment) {
        logger.info(`✅ Found REGULAR assessment for session: ${reportId}`);

        // Check permissions for regular assessment
        const userIdMatches =
          !assessment.userId ||
          assessment.userId.toString() === userId.toString();

        if (!userIdMatches) {
          logger.warn(
            `⚠️ Regular assessment ${reportId} belongs to different user: ${assessment.userId} vs ${userId}`
          );
          assessment = null; // Clear assessment to trigger 404
        } else {
          logger.info(`✅ User has access to regular assessment: ${reportId}`);
          isImageAssessment = false;

          // Debug the assessment data
          logger.info(`📊 Regular assessment data:`, {
            sessionId: assessment.sessionId,
            assessmentType: assessment.assessmentType,
            status: assessment.status,
            hasResults: !!assessment.results,
            hasQuestions: !!assessment.questions,
            questionsCount: assessment.questions?.length || 0,
            hasResponses: !!assessment.responses,
            responsesCount: assessment.responses?.length || 0,
            hasGetResultsWithFallback:
              typeof assessment.getResultsWithFallback === "function",
            completedAt: assessment.completedAt,
            createdAt: assessment.createdAt,
            childId: assessment.childId?._id,
            childName:
              assessment.childId?.firstName +
              " " +
              (assessment.childId?.lastName || ""),
            childFirstName: assessment.childId?.firstName,
            childLastName: assessment.childId?.lastName,
            intakeChildName: assessment.intakeId?.childName,
            intakeAge: assessment.intakeId?.age,
            hasChildId: !!assessment.childId,
            hasIntakeId: !!assessment.intakeId,
          });
        }
      } else {
        logger.info(
          `❌ Regular assessment not found, trying image assessment...`
        );

        // If not found in regular assessments, try image assessments
        assessment = await ImageAssessmentSession.findOne({
          sessionId: reportId,
        }).populate("childId", "firstName lastName dateOfBirth");

        if (assessment) {
          logger.info(`✅ Found IMAGE assessment session: ${reportId}`);
          logger.info(`📊 Session belongs to user: ${assessment.userId}`);
          logger.info(`👤 Current request user: ${userId}`);

          // Now check if user has access to this session
          if (
            assessment.userId &&
            assessment.userId.toString() !== userId.toString()
          ) {
            logger.warn(
              `⚠️ Session ${reportId} belongs to different user: ${assessment.userId} vs ${userId}`
            );
            assessment = null; // Clear assessment to trigger 404
          } else {
            logger.info(`✅ User has access to session: ${reportId}`);
          }
          isImageAssessment = true;
        } else {
          logger.warn(`❌ Session ${reportId} does not exist in database`);
        }
      }
    } else if (mongoose.Types.ObjectId.isValid(reportId)) {
      logger.info(`🎯 Searching for assessment with ObjectId: ${reportId}`);

      // First try to find as regular assessment
      assessment = await Assessment.findOne({
        _id: reportId,
        userId: userId,
      })
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender",
        })
        .populate({
          path: "intakeId",
          select: "primaryConcerns childName age gender",
        });

      // If not found, try image assessment by ObjectId
      if (!assessment) {
        logger.info(
          `❌ Regular assessment not found, trying image assessment...`
        );
        assessment = await ImageAssessmentSession.findOne({
          _id: reportId,
          userId: userId,
        }).populate("childId", "firstName lastName dateOfBirth");
        if (assessment) {
          logger.info(`✅ Found image assessment by ObjectId: ${reportId}`);
          isImageAssessment = true;
        }
      } else {
        logger.info(`✅ Found regular assessment: ${reportId}`);
      }
    } else {
      logger.info(`🎯 Searching for session without prefix: ${reportId}`);
      // Try to find by sessionId in case it's not prefixed
      assessment = await ImageAssessmentSession.findOne({
        sessionId: reportId,
        userId: userId,
      }).populate("childId", "firstName lastName dateOfBirth");
      if (assessment) {
        logger.info(`✅ Found session without prefix: ${reportId}`);
      }
      isImageAssessment = true;
    }

    if (!assessment) {
      // Additional debugging - let's see what sessions exist for this user
      if (reportId.startsWith("session_")) {
        logger.info(
          `🔍 Debugging: Looking for any sessions for user ${userId}...`
        );
        const userSessions = await ImageAssessmentSession.find({
          userId: userId,
        })
          .select("sessionId status createdAt")
          .limit(5);

        logger.info(
          `📊 Found ${userSessions.length} sessions for user:`,
          userSessions.map((s) => ({
            sessionId: s.sessionId,
            status: s.status,
            created: s.createdAt,
          }))
        );

        // Check if there are any sessions with similar patterns
        const similarSessions = await ImageAssessmentSession.find({
          sessionId: {
            $regex: new RegExp(reportId.replace("session_", ""), "i"),
          },
        })
          .select("sessionId userId status")
          .limit(3);

        if (similarSessions.length > 0) {
          logger.info(
            `🔍 Found sessions with similar patterns:`,
            similarSessions.map((s) => ({
              sessionId: s.sessionId,
              userId: s.userId,
              status: s.status,
            }))
          );
        }
      }

      logger.warn(
        `❌ Assessment/session not found: ${reportId} for user: ${userId}`
      );
      return res.status(404).json({
        success: false,
        message: "Assessment report not found",
        debug: {
          reportId,
          userId: userId.toString(),
          searchType: reportId.startsWith("session_")
            ? "image-assessment"
            : "regular-assessment",
        },
      });
    }

    // Format child name properly and remove N/A
    const formatChildName = (firstName, lastName) => {
      const cleanFirstName =
        firstName &&
        firstName.trim() !== "" &&
        firstName.trim().toLowerCase() !== "n/a" &&
        firstName.trim().toLowerCase() !== "na"
          ? firstName.trim()
          : "";

      const cleanLastName =
        lastName &&
        lastName.trim() !== "" &&
        lastName.trim().toLowerCase() !== "n/a" &&
        lastName.trim().toLowerCase() !== "na" &&
        lastName.trim().toLowerCase() !== "undefined"
          ? lastName.trim()
          : "";

      if (cleanFirstName && cleanLastName) {
        return `${cleanFirstName} ${cleanLastName}`;
      } else if (cleanFirstName) {
        return cleanFirstName;
      } else if (cleanLastName) {
        return cleanLastName;
      }

      return "Child"; // Default fallback
    };

    // Enhanced child name extraction with multiple fallbacks
    let childName = "Child";

    // Priority 1: Child profile firstName + lastName
    if (assessment.childId) {
      const extractedName = formatChildName(
        assessment.childId.firstName,
        assessment.childId.lastName
      );
      if (extractedName !== "Child") {
        childName = extractedName;
      }
      // Fallback to name field if it exists
      else if (
        assessment.childId.name &&
        assessment.childId.name.trim() !== "" &&
        assessment.childId.name.toLowerCase() !== "n/a"
      ) {
        childName = assessment.childId.name.trim();
      }
    }

    // Priority 2: Image assessment metadata
    if (
      childName === "Child" &&
      isImageAssessment &&
      assessment.metadata?.childName
    ) {
      const metadataName = assessment.metadata.childName.trim();
      if (
        metadataName !== "Child Assessment" &&
        metadataName !== "Child" &&
        metadataName !== "" &&
        metadataName.toLowerCase() !== "n/a"
      ) {
        childName = metadataName;
      }
    }

    // Priority 3: Intake form child name
    if (childName === "Child" && assessment.intakeId?.childName) {
      const intakeName = assessment.intakeId.childName.trim();
      if (
        intakeName !== "Child Assessment" &&
        intakeName !== "Child" &&
        intakeName !== "" &&
        intakeName.toLowerCase() !== "n/a"
      ) {
        childName = intakeName;
      }
    }

    logger.info(`🧒 Child name resolved: "${childName}" from:`, {
      childIdExists: !!assessment.childId,
      childIdName: assessment.childId?.name,
      childIdFirstName: assessment.childId?.firstName,
      childIdLastName: assessment.childId?.lastName,
      metadataChildName: assessment.metadata?.childName,
      intakeChildName: assessment.intakeId?.childName,
      isImageAssessment,
    });

    // Calculate child age
    let childAge = null;
    try {
      if (assessment.childId?.dateOfBirth) {
        childAge = Math.floor(
          (Date.now() - new Date(assessment.childId.dateOfBirth)) /
            (365.25 * 24 * 60 * 60 * 1000)
        );
      } else if (isImageAssessment && assessment.metadata?.childAge) {
        childAge = assessment.metadata.childAge;
      } else if (assessment.intakeId?.age) {
        childAge = assessment.intakeId.age;
      }
    } catch (ageError) {
      logger.warn("Error calculating age:", ageError.message);
    }

    // Prepare report data based on assessment type
    let reportData;

    if (isImageAssessment) {
      // Format for image assessments
      reportData = {
        childName,
        childAge,
        childGender: assessment.childId?.gender,
        assessmentType: assessment.assessmentType || "Image Assessment",
        assessmentDate: assessment.completedAt || assessment.createdAt,
        assessmentCategory: "image",
        id: assessment.sessionId,
        riskScore: assessment.results?.riskScore || assessment.riskScore,
        summary: assessment.results?.summary || assessment.summary,
        recommendations:
          assessment.results?.recommendations ||
          assessment.recommendations ||
          [],
        domainScores:
          assessment.results?.domainScores || assessment.domainScores || [],
        aiReport: assessment.results?.aiReport || assessment.aiReport || {},
        totalQuestions: assessment.metadata?.totalQuestions,
        correctAnswers: assessment.metadata?.correctAnswers,
        accuracyRate: assessment.metadata?.accuracyRate,
        averageResponseTime: assessment.metadata?.averageResponseTime,
        questionsAndResponses: {
          questions: [], // Image assessments don't have traditional questions
          responses: assessment.responses || [],
        },
        questions: [],
        responses: assessment.responses || [],
      };
    } else {
      // Format for regular assessments (like the assessment report route)
      const results = assessment.results
        ? assessment.results
        : assessment.getResultsWithFallback
        ? assessment.getResultsWithFallback()
        : {};

      reportData = {
        childName,
        childAge,
        childGender: assessment.childId?.gender || assessment.intakeId?.gender,
        assessmentType: assessment.assessmentType || "Assessment",
        assessmentDate: assessment.completedAt || assessment.createdAt,
        assessmentCategory: "standard",
        id: assessment.sessionId,
        riskScore: results.riskScore || results.disorderRisk?.score,
        summary: results.summary || "",
        recommendations: results.recommendations || [],
        domainScores: results.domainScores || [],
        aiReport: results.aiReport || {},
        questionsAndResponses: {
          questions: assessment.questions || [],
          responses: assessment.responses || [],
        },
        questions: assessment.questions || [],
        responses: assessment.responses || [],
        totalQuestions: assessment.questions?.length || 0,
        answeredQuestions: assessment.responses?.length || 0,
        riskLevel: results.disorderRisk?.interpretation || results.riskLevel,
        interpretation: results.interpretation || "",
      };
    }

    // Debug the final report data
    logger.info(`📋 Final report data for PDF:`, {
      childName: reportData.childName,
      assessmentType: reportData.assessmentType,
      assessmentCategory: reportData.assessmentCategory,
      id: reportData.id,
      totalQuestions: reportData.totalQuestions,
      answeredQuestions: reportData.answeredQuestions,
      hasRiskScore: !!reportData.riskScore,
      riskScore: reportData.riskScore,
      hasSummary: !!reportData.summary,
      summaryLength: reportData.summary?.length || 0,
      recommendationsCount: reportData.recommendations?.length || 0,
      domainScoresCount: reportData.domainScores?.length || 0,
      questionsCount: reportData.questionsAndResponses?.questions?.length || 0,
      responsesCount: reportData.questionsAndResponses?.responses?.length || 0,
      directQuestionsCount: reportData.questions?.length || 0,
      directResponsesCount: reportData.responses?.length || 0,
    });

    // Generate PDF with fallback
    try {
      logger.info(`🔄 Starting PDF generation for assessment: ${reportId}`, {
        childName: reportData.childName,
        assessmentType: reportData.assessmentType,
        environment: process.env.VERCEL ? 'serverless' : 'server'
      });

      const pdfBuffer = await universalPDFService.generatePDF(
        "assessment-report",
        reportData
      );

      // Set response headers
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${childName.replace(
        /\s+/g,
        "-"
      )}-assessment-report-${timestamp}-cognikidz.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      res.send(pdfBuffer);

      logger.info(`✅ Assessment report PDF generated successfully: ${reportId}`, {
        size: pdfBuffer.length,
        fileName
      });
    } catch (pdfError) {
      logger.error("❌ PDF generation failed, providing JSON fallback:", {
        error: pdfError.message,
        reportId,
        childName: reportData.childName,
        environment: process.env.VERCEL ? 'serverless' : 'server',
        errorType: pdfError.constructor.name
      });
      
      // Provide enhanced JSON fallback when PDF generation fails
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${childName.replace(
        /\s+/g,
        "-"
      )}-assessment-report-${timestamp}-cognikidz.json`;
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      
      // Enhanced error response with more context
      const errorResponse = {
        error: "PDF generation temporarily unavailable",
        message: "Assessment report data provided in JSON format",
        reason: pdfError.message,
        environment: process.env.VERCEL ? 'serverless' : 'server',
        reportData: reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          format: 'json',
          originalFormat: 'pdf',
          reportId: reportId,
          version: '1.0'
        },
        instructions: {
          note: "This is your complete assessment report in JSON format.",
          usage: "You can save this file or share it with healthcare professionals.",
          conversion: "PDF generation may be available in the future or through direct download."
        }
      };
      
      res.json(errorResponse);
    }
  } catch (error) {
    logger.error("Assessment report PDF generation failed:", error);
    next(error);
  }
});

module.exports = router;
