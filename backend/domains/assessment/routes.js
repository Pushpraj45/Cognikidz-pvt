const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../auth/middleware");
const Assessment = require("../assessment/model");
const Intake = require("../intake/model");
const { BatteryConfig } = require("./battery-model");
const { ChildProgress } = require("./child-progress-model");
const SuiteSession = require("./suite-session-model");
const {
  ImageAssessmentSession,
} = require("../assessment/image-assessment/model");

// Import the assessment pipeline
const {
  startAssessment,
  processResponse,
  generateSummary,
} = require("../../pipeline");

// Import the assessment controller
const assessmentController = require("./controller");
const suiteController = require("./suite-controller");

const ProgressAnalysisService = require('./progress-analysis-service');

/**
 * @route   POST /api/start-assessment
 * @desc    Start a new assessment using intake data
 * @access  Private
 */
router.post("/start-assessment", protect, async (req, res) => {
  try {
    const { intakeId, assessmentType, gameBasedAssessment } = req.body;

    if (!intakeId) {
      return res.status(400).json({
        success: false,
        message: "Intake ID is required",
      });
    }

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(intakeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intake ID format",
      });
    }

    // Find the intake
    const intake = await Intake.findById(intakeId);
    if (!intake) {
      return res.status(404).json({
        success: false,
        message: "Intake not found",
      });
    }

    // Ensure intake belongs to the authenticated user
    if (
      !intake.userId ||
      intake.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to start this assessment",
      });
    }

    // Ensure intake has userId set (for legacy intakes)
    if (!intake.userId) {
      intake.userId = req.user._id;
      await intake.save();
    }

    // NEW: Handle game-based assessment routing
    if (gameBasedAssessment) {
      return handleGameBasedAssessmentStart(req, res, intake, assessmentType);
    }

    // EXISTING: Continue with traditional assessment flow
    if (assessmentType) {
      // Map the front-end assessment type to the backend value
      let mappedType;
      switch (assessmentType.toLowerCase()) {
        case "adhd":
          mappedType = "ADHD";
          break;
        case "autism":
        case "asd":
          mappedType = "Autism";
          break;
        case "dyslexia":
          mappedType = "Dyslexia";
          break;
        default:
          mappedType = "General";
      }

      if (!intake.primaryConcerns.includes(mappedType)) {
        intake.primaryConcerns = `${mappedType} assessment: ${intake.primaryConcerns}`;
        await intake.save();
      }
    }

    // Call the LangChain/LangGraph pipeline to start the assessment
    const assessmentData = {
      assessmentType: assessmentType ? assessmentType.toLowerCase() : "general",
      language: req.body.language || 'en', // Add language support
      formData: {
        childName: intake.childName,
        childAge: intake.age,
        concerns: intake.primaryConcerns ? [intake.primaryConcerns] : [],
        familyHistory: intake.familyHistory || "",
        developmentalHistory: `${intake.milestoneDelays || ""}. ${
          intake.speechMilestones || ""
        }`,
        sensorySensitivities: intake.sensorySensitivities || "",
        strengths: intake.areasOfStrength || "",
        language: req.body.language || 'en', // Add language to formData as well
        intake: intake,
      },
    };

    // 🔍 DEBUG: Log language parameter flow from API route
    console.log('🔍 [LANGUAGE DEBUG] API Route Language Flow:', {
      route: '/start-assessment',
      requestBody: req.body,
      requestLanguage: req.body.language,
      assessmentDataLanguage: assessmentData.language,
      formDataLanguage: assessmentData.formData.language,
      intakeId: intakeId,
      assessmentType: assessmentType,
      hasLanguageInBody: 'language' in req.body,
      hasLanguageInAssessmentData: 'language' in assessmentData,
      hasLanguageInFormData: 'language' in assessmentData.formData,
      languageType: typeof req.body.language,
      languageUndefined: req.body.language === undefined,
      languageNull: req.body.language === null
    });

    // Enforce access before starting (general is free) and usage limits
    const typeForAccess = (assessmentType ? `${assessmentType.toLowerCase()}-form` : 'general-form');
    if (typeForAccess !== 'general-form') {
      try {
        const pricingRouter = require('../pricing/controller');
        // Reuse check logic directly
        const accessRes = await pricingRouter.checkUserAccess({
          params: { assessmentType: typeForAccess },
          user: req.user,
        }, {
          json: (data) => data,
          status: (code) => ({ json: (obj) => ({ code, ...obj }) }),
        });
        if (accessRes && accessRes.success === true && accessRes.hasAccess !== true) {
          return res.status(402).json({ success: false, message: 'Payment required', pricing: accessRes.pricing || null });
        }
      } catch (enfErr) {
        console.warn('Access check failed, proceeding cautiously:', enfErr.message);
      }
      // Usage limit check for paid form assessments
      try {
        const { checkUsage } = require('../pricing/usage');
        const usageReq = { user: req.user, body: { resourceType: 'assessment', resourceKey: typeForAccess, assessmentType: typeForAccess } };
        let usageResult = null;
        await checkUsage(usageReq, {
          json: (d) => { usageResult = d; },
          status: (c) => ({ json: (o) => { usageResult = { code: c, ...o }; } }),
        });
        if (usageResult && usageResult.success === true && usageResult.allowed === false) {
          return res.status(402).json({ success: false, message: 'Usage limit reached', reason: 'limit_reached' });
        }
      } catch (usageErr) {
        console.warn('Usage check failed:', usageErr.message);
      }
    } else {
      // Optional: check free general usage soft limit; do not block start here (handled on increment)
    }

    const assessmentResult = await startAssessment(assessmentData, assessmentData.language);
    console.log(
      `Started assessment for child ${intake.childName}, session ID: ${assessmentResult.sessionId}, type: ${assessmentResult.assessmentType}, user: ${req.user._id}`
    );

    // Ensure the created assessment has the correct userId
    const assessment = await Assessment.findOne({
      sessionId: assessmentResult.sessionId,
    });
    if (
      assessment &&
      (!assessment.userId ||
        assessment.userId.toString() !== req.user._id.toString())
    ) {
      assessment.userId = req.user._id;
      await assessment.save();
      console.log(
        `Updated assessment ${assessmentResult.sessionId} with userId: ${req.user._id}`
      );
    }

    // Update the intake status
    intake.status = "in_progress";
    await intake.save();

    res.json({
      success: true,
      sessionId: assessmentResult.sessionId,
      questions: assessmentResult.question ? [assessmentResult.question] : [],
      assessmentType: assessmentResult.assessmentType || "General",
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error starting assessment",
    });
  }
});

/**
 * @route   POST /api/assessment/battery/configure
 * @desc    Configure battery structure for a child
 * @access  Private
 */
router.post(
  "/battery/configure",
  protect,
  assessmentController.configureBattery.bind(assessmentController)
);

/**
 * @route   POST /api/assessment/battery/start
 * @desc    Start a battery-based assessment session
 * @access  Private
 */
router.post(
  "/battery/start",
  protect,
  assessmentController.startBatteryAssessment.bind(assessmentController)
);

/**
 * @route   POST /api/assessment/game/complete
 * @desc    Complete a game and get next action
 * @access  Private
 */
router.post(
  "/game/complete",
  protect,
  assessmentController.completeGame.bind(assessmentController)
);

/**
 * @route   GET /api/assessment/child-game-performance/:childId
 * @desc    Get child's game performance data
 * @access  Private
 */
router.get(
  "/child-game-performance/:childId",
  protect,
  assessmentController.getChildGamePerformance.bind(assessmentController)
);

/**
 * @route   GET /api/assessment/progress/:sessionId
 * @desc    Get real-time assessment progress
 * @access  Private
 */
router.get("/progress/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const assessment = await Assessment.findOne({ sessionId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment session not found",
      });
    }

    // Calculate detailed progress
    const progressData = {
      overallProgress: assessment.progressTracking.overallProgress,
      batteryProgress: assessment.progressTracking.batteryProgress,
      gameProgress: assessment.progressTracking.gameProgress,
      currentBattery:
        assessment.batteryStructure.selectedBatteries[
          assessment.batteryStructure.currentBatteryIndex
        ],
      qualityMetrics: assessment.qualityMetrics,
      estimatedTimeRemaining: calculateTimeRemaining(assessment),
    };

    res.json({
      success: true,
      progress: progressData,
    });
  } catch (error) {
    console.error("Error getting progress:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error getting assessment progress",
    });
  }
});

/**
 * @route   GET /api/assessment/child-progress/:childId
 * @desc    Get child's historical progress across all assessments
 * @access  Private
 */
router.get("/child-progress/:childId", protect, async (req, res) => {
  try {
    const { childId } = req.params;

    const childProgress = await ChildProgress.findOne({ childId });
    if (!childProgress) {
      return res.json({
        success: true,
        progress: {
          overallMetrics: {
            totalAssessments: 0,
            completedAssessments: 0,
            averageEngagement: 0,
            progressTrend: "insufficient_data",
          },
          domainProgress: [],
          behavioralProfile: {},
          aiInsights: {},
        },
      });
    }

    res.json({
      success: true,
      progress: {
        overallMetrics: childProgress.overallMetrics,
        domainProgress: childProgress.domainProgress,
        behavioralProfile: childProgress.behavioralProfile,
        aiInsights: childProgress.aiInsights,
        milestones: childProgress.milestones,
        dataQuality: childProgress.dataQuality,
      },
    });
  } catch (error) {
    console.error("Error getting child progress:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error getting child progress",
    });
  }
});

// Suite routes moved up to avoid conflict with parameterized routes
/**
 * @route   POST /api/assessments/suite/start
 * @desc    Start a new progressive suite session
 * @access  Private
 */
router.post(
  "/suite/start",
  protect,
  suiteController.startProgressiveSuite.bind(suiteController)
);

/**
 * @route   POST /api/assessments/suite/progress
 * @desc    Update suite progress
 * @access  Private
 */
router.post(
  "/suite/progress",
  protect,
  suiteController.updateSuiteProgress.bind(suiteController)
);

/**
 * @route   POST /api/assessments/suite/complete
 * @desc    Complete progressive suite
 * @access  Private
 */
router.post(
  "/suite/complete",
  protect,
  suiteController.completeProgressiveSuite.bind(suiteController)
);

// Test route to verify the endpoint is accessible
router.get("/suite/complete/test", protect, (req, res) => {
  res.json({ success: true, message: "Suite complete endpoint is accessible" });
});

// Debug route to list all available routes
router.get("/suite/routes/debug", protect, (req, res) => {
  const routes = [
    "POST /api/assessment/suite/start",
    "POST /api/assessment/suite/progress",
    "POST /api/assessment/suite/complete",
    "GET /api/assessment/suite/status/:sessionId",
    "GET /api/assessment/suite/history/:childId",
  ];
  res.json({
    success: true,
    message: "Available suite routes",
    routes,
  });
});

/**
 * @route   GET /api/assessments/suite/status/:sessionId
 * @desc    Get suite status
 * @access  Private
 */
router.get(
  "/suite/status/:sessionId",
  protect,
  suiteController.getSuiteStatus.bind(suiteController)
);

/**
 * @route   GET /api/assessments/suite/history/:childId
 * @desc    Get suite history for a child
 * @access  Private
 */
router.get("/suite/history/:childId", protect, async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user._id;

    // Check if the childId parameter is actually a sessionId
    // MongoDB ObjectId format: 24 hex characters
    const isSessionId = /^[0-9a-fA-F]{24}$/.test(childId);

    if (isSessionId) {
      // If it's a sessionId, try to get the childId from the session
      const session = await SuiteSession.findOne({
        sessionId: childId,
        parentId: userId,
      });
      if (session) {
        // Redirect to the correct endpoint with the actual childId
        req.params.childId = session.childId;
        return suiteController.getSuiteHistory(req, res);
      }
    }

    // Proceed with normal childId processing
    return suiteController.getSuiteHistory(req, res);
  } catch (error) {
    console.error("❌ Error in suite history route:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get suite history",
    });
  }
});

/**
 * @route   POST /api/assessments/suite/resume/:sessionId
 * @desc    Resume suite session
 * @access  Private
 */
router.post(
  "/suite/resume/:sessionId",
  protect,
  suiteController.resumeSuite.bind(suiteController)
);

/**
 * @route   PUT /api/assessment/suite/:sessionId/report-status
 * @desc    Update suite report status
 * @access  Private
 */
router.put(
  "/suite/:sessionId/report-status",
  protect,
  suiteController.updateReportStatus.bind(suiteController)
);

/**
 * @route   POST /api/assessments/suite-results
 * @desc    Save progressive suite results
 * @access  Private
 */
router.post(
  "/suite-results",
  protect,
  assessmentController.saveSuiteResults.bind(assessmentController)
);

/**
 * @route   GET /api/assessments/suite-results
 * @desc    Get progressive suite results for a child
 * @access  Private
 */
router.get(
  "/suite-results",
  protect,
  assessmentController.getSuiteResults.bind(assessmentController)
);

/**
 * @route   POST /api/assessment/:sessionId/complete
 * @desc    Manually complete an assessment session
 * @access  Private
 */
router.post("/:sessionId/complete", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`Manual completion requested for session: ${sessionId}`);

    // First check the cache
    let assessment = null;

    try {
      const {
        SessionManager,
      } = require("../../pipeline/memory/session-manager");
      assessment = SessionManager.getCachedState(sessionId);

      if (assessment) {
        console.log(
          `Assessment found in cache for manual completion: ${sessionId}`
        );

        // Check if it has enough responses
        const responseCount = assessment.responses
          ? assessment.responses.length
          : 0;

        if (responseCount < 15) {
          return res.status(400).json({
            success: false,
            message: `Assessment cannot be completed yet. Only ${responseCount} of 15 questions answered.`,
          });
        }

        // Complete the assessment using the pipeline
        const { completeAssessment } = require("../../pipeline");
        const completionResult = await completeAssessment(sessionId);

        if (completionResult.success) {
          console.log(
            `✅ Manual completion successful for session: ${sessionId}`
          );

          return res.json({
            success: true,
            message: "Assessment completed successfully",
            sessionId: sessionId,
            results: completionResult.summary,
            isComplete: true,
          });
        } else {
          console.error(
            `❌ Manual completion failed for session: ${sessionId}`,
            completionResult.error
          );
          return res.status(500).json({
            success: false,
            message: "Failed to complete assessment: " + completionResult.error,
          });
        }
      }
    } catch (cacheError) {
      console.warn(
        "Error accessing cache for manual completion:",
        cacheError.message
      );
    }

    // If not in cache, check database
    assessment = await Assessment.findOne({ sessionId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment session not found",
      });
    }

    // Check permissions
    if (
      assessment.userId &&
      assessment.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to complete this assessment",
      });
    }

    // Check if already completed
    if (assessment.status === "completed" && assessment.results) {
      console.log(
        `Assessment ${sessionId} already completed, returning existing results`
      );
      return res.json({
        success: true,
        message: "Assessment already completed",
        sessionId: sessionId,
        results: assessment.results,
        isComplete: true,
      });
    }

    // Check if it has enough responses
    const responseCount = assessment.responses
      ? assessment.responses.length
      : 0;

    if (responseCount < 15) {
      return res.status(400).json({
        success: false,
        message: `Assessment cannot be completed yet. Only ${responseCount} of 15 questions answered.`,
      });
    }

    // Try to complete using pipeline (for database assessments, this might not work as well)
    try {
      const { completeAssessment } = require("../../pipeline");
      const completionResult = await completeAssessment(sessionId);

      if (completionResult.success) {
        // Update database assessment
        assessment.status = "completed";
        assessment.completedAt = new Date();
        assessment.results = completionResult.summary;
        await assessment.save();

        console.log(
          `✅ Manual completion successful for database assessment: ${sessionId}`
        );

        return res.json({
          success: true,
          message: "Assessment completed successfully",
          sessionId: sessionId,
          results: completionResult.summary,
          isComplete: true,
        });
      }
    } catch (pipelineError) {
      console.warn(
        "Pipeline completion failed, using fallback:",
        pipelineError.message
      );
    }

    // Fallback completion for database assessments
    console.log(`Using fallback completion for assessment: ${sessionId}`);

    const fallbackResults = {
      summary:
        "Assessment completed successfully. Your detailed report has been processed and is ready for review.",
      disorderRisk: {
        score: Math.min(
          10,
          Math.max(
            1,
            Math.round(
              (assessment.responses.filter((r) => r.response >= 4).length /
                assessment.responses.length) *
                10
            )
          )
        ),
        interpretation:
          "Assessment completed. Results are based on your responses to the screening questions.",
      },
      recommendations: [
        "Continue monitoring your child's development",
        "Discuss results with your pediatrician if you have concerns",
        "Consider follow-up assessment in 6-12 months",
      ],
    };

    assessment.status = "completed";
    assessment.completedAt = new Date();
    assessment.results = fallbackResults;
    await assessment.save();

    res.json({
      success: true,
      message: "Assessment completed successfully",
      sessionId: sessionId,
      results: fallbackResults,
      isComplete: true,
    });
  } catch (error) {
    console.error("Error manually completing assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error completing assessment",
    });
  }
});

/**
 * @route   POST /api/assessment/:sessionId/answer
 * @desc    Submit an answer to the current question
 * @access  Private
 */
router.post("/:sessionId/answer", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, response } = req.body;

    if (!questionId || response === undefined) {
      return res.status(400).json({
        success: false,
        message: "Question ID and response are required",
      });
    }

    console.log(
      `Processing answer for session ${sessionId}, question ${questionId}, user: ${req.user._id}`
    );

    // Find the assessment
    const assessment = await Assessment.findOne({ sessionId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment session not found",
      });
    }

    // Ensure assessment belongs to authenticated user
    if (
      !assessment.userId ||
      assessment.userId.toString() !== req.user._id.toString()
    ) {
      // Try to fix missing userId if assessment exists but no user is set
      if (!assessment.userId) {
        assessment.userId = req.user._id;
        await assessment.save();
        console.log(`Fixed missing userId for assessment ${sessionId}`);
      } else {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to submit answers to this assessment",
        });
      }
    }

    // Add the response directly to the assessment
    // This ensures the response is saved even if the LLM processing fails
    const savedResponse = {
      questionId,
      response,
      timestamp: new Date(),
    };
    assessment.responses.push(savedResponse);
    await assessment.save();
    console.log("Response saved to assessment");

    // Configurable timeout and retry for LLM processing
    const timeoutMs = parseInt(process.env.AI_QA_TIMEOUT_MS || '900000', 10); // default 15 minutes
    const maxRetries = parseInt(process.env.AI_QA_RETRY_COUNT || '1', 10);

    const runWithTimeout = async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`LLM processing timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      const processingPromise = processResponse(sessionId, { 
        questionId, 
        response, 
        language: req.body.language || assessment.language || 'en' 
      });
      return Promise.race([processingPromise, timeoutPromise]);
    };

    // Try to process via LangChain with timeout and retry
    let result;
    let attempt = 0;
    let processingError;
    while (attempt <= maxRetries) {
      try {
        result = await runWithTimeout();
        console.log("LLM processing completed successfully");
        break;
      } catch (err) {
        processingError = err;
        console.warn(`LLM processing attempt ${attempt + 1} failed:`, err.message);
        attempt += 1;
        if (attempt <= maxRetries) {
          // brief backoff
          await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 10000)));
        }
      }
    }

    if (!result) {
      console.error("LLM processing error:", processingError);

      // Handle specific LLM errors
      if (
        processingError.message.includes("Question generation failed") ||
        processingError.message.includes("Failed to generate valid question")
      ) {
        // Try to continue by generating a fallback next question
        try {
          const { SessionManager } = require("../../pipeline/memory/session-manager");
          const questionGenerator = require("../../pipeline/core/question-generator");
          const state = SessionManager.getCachedState(sessionId);
          if (state) {
            // Ensure state reflects the saved response
            state.responses = state.responses || [];
            state.responses.push({
              questionId,
              response,
              timestamp: new Date(),
            });
            state.currentQuestionIndex = (state.currentQuestionIndex || 0) + 1;
            const next = await questionGenerator.generateQuestion(
              sessionId,
              state.assessmentType,
              state,
              state.formData
            );
            if (next && next.question) {
              state.questions = state.questions || [];
              state.questions.push(next.question);
              state.currentQuestion = next.question;
              SessionManager.setCachedState(sessionId, state);
              const count = state.responses.length;
              return res.json({
                success: true,
                nextQuestion: next.question,
                progress: {
                  current: count,
                  total: 15,
                  percentage: Math.min(100, Math.round((count / 15) * 100)),
                },
                isComplete: false,
                note: "Continued with AI-generated next question after a generation failure.",
              });
            }
          }
        } catch (e) {
          console.warn("Fallback question generation failed:", e.message);
        }
        return res.status(503).json({
          success: false,
          message: "Question generation failed. Please try again shortly.",
          errorType: "LLM_GENERATION_FAILED",
        });
      }

      if (processingError.message.includes("timeout")) {
        // Try to continue by generating a fallback next question
        try {
          const { SessionManager } = require("../../pipeline/memory/session-manager");
          const questionGenerator = require("../../pipeline/core/question-generator");
          const state = SessionManager.getCachedState(sessionId);
          if (state) {
            state.responses = state.responses || [];
            state.responses.push({
              questionId,
              response,
              timestamp: new Date(),
            });
            state.currentQuestionIndex = (state.currentQuestionIndex || 0) + 1;
            const next = await questionGenerator.generateQuestion(
              sessionId,
              state.assessmentType,
              state,
              state.formData
            );
            if (next && next.question) {
              state.questions = state.questions || [];
              state.questions.push(next.question);
              state.currentQuestion = next.question;
              SessionManager.setCachedState(sessionId, state);
              const count = state.responses.length;
              return res.json({
                success: true,
                nextQuestion: next.question,
                progress: {
                  current: count,
                  total: 15,
                  percentage: Math.min(100, Math.round((count / 15) * 100)),
                },
                isComplete: false,
                note: "Continued with AI-generated next question after timeout.",
              });
            }
          }
        } catch (e) {
          console.warn("Fallback question generation after timeout failed:", e.message);
        }
        return res.status(408).json({
          success: false,
          message: "Question generation timed out. Please try again shortly.",
          errorType: "LLM_TIMEOUT",
        });
      }

      // For other processing errors, try to continue with a simpler approach
      console.log("Attempting to continue assessment despite LLM error");

      // Check if we have enough responses to complete the assessment
      const updatedAssessment = await Assessment.findOne({ sessionId });
      if (updatedAssessment && updatedAssessment.responses.length >= 15) {
        console.log(
          "Assessment has enough responses, attempting to complete it"
        );

        try {
          // Try to generate summary even if question generation failed
          const summaryResult = await generateSummary(sessionId);

          return res.json({
            success: true,
            isComplete: true,
            progress: 100,
            summary: summaryResult,
            sessionId: sessionId,
          });
        } catch (summaryError) {
          console.error("Summary generation also failed:", summaryError);

          // Use fallback completion
          updatedAssessment.status = "completed";
          updatedAssessment.completedAt = new Date();
          updatedAssessment.results = {
            summary:
              "Assessment completed. A detailed report could not be generated at this time due to technical issues. Please contact support for assistance.",
            disorderRisk: {
              score: 5,
              interpretation:
                "Assessment completed but detailed analysis unavailable.",
            },
          };
          await updatedAssessment.save();

          return res.json({
            success: true,
            isComplete: true,
            progress: 100,
            summary: updatedAssessment.results,
            sessionId: sessionId,
          });
        }
      }

      // If we can't complete, return the error
      throw processingError;
    }

    // Handle successful processing
    if (!result) {
      throw new Error("No result returned from processing");
    }

    // If assessment is complete, explicitly generate the summary
    if (result?.isComplete) {
      console.log("Assessment is complete, generating summary");
      try {
        // Generate the assessment summary
        const summary = await generateSummary(sessionId);
        console.log("Summary generation successful");

        // Reload the assessment to get the updated results
        const updatedAssessment = await Assessment.findOne({ sessionId });

        if (updatedAssessment && updatedAssessment.results) {
          console.log("Assessment has results, returning them");

          // Make sure it's marked as completed
          if (updatedAssessment.status !== "completed") {
            updatedAssessment.status = "completed";
            updatedAssessment.completedAt = new Date();
            await updatedAssessment.save();
            console.log("Updated assessment status to completed");
          }

          return res.json({
            success: true,
            isComplete: true,
            progress: 100,
            summary: updatedAssessment.results,
            sessionId: sessionId,
          });
        } else {
          console.log(
            "Assessment updated but no results found, attempting to apply summary directly"
          );

          // Try to apply the summary directly to the assessment
          updatedAssessment.results = summary;
          updatedAssessment.status = "completed";
          updatedAssessment.completedAt = new Date();
          await updatedAssessment.save();

          return res.json({
            success: true,
            isComplete: true,
            progress: 100,
            summary: summary,
            sessionId: sessionId,
          });
        }
      } catch (summaryError) {
        console.error("Summary generation failed:", summaryError);

        // Try to provide a basic completion response
        const basicResults = {
          summary:
            "Assessment completed successfully. Detailed analysis is being processed and will be available shortly.",
          disorderRisk: {
            score: Math.min(
              10,
              Math.max(
                1,
                Math.round(
                  (assessment.responses.filter((r) => r.response >= 4).length /
                    assessment.responses.length) *
                    10
                )
              )
            ),
            interpretation:
              "Assessment completed. Full report processing in progress.",
          },
        };

        assessment.results = basicResults;
        assessment.status = "completed";
        assessment.completedAt = new Date();
        await assessment.save();

        return res.json({
          success: true,
          isComplete: true,
          progress: 100,
          summary: basicResults,
          sessionId: sessionId,
        });
      }
    }

    // Return the next question if assessment is not complete
    console.log("Returning next question");
    return res.json({
      success: true,
      nextQuestion: result.question,
      progress: result.progress,
      isComplete: false,
    });
  } catch (error) {
    console.error("Error processing answer:", error);

    // Provide specific error messages based on error type
    let errorMessage = "Could not process your answer";
    let statusCode = 500;

    if (error.message.includes("timeout")) {
      errorMessage = "Question generation timed out. Please try again.";
      statusCode = 408;
    } else if (error.message.includes("Question generation failed")) {
      errorMessage =
        "AI question generation failed. Please try starting a new assessment.";
      statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      errorType: error.message.includes("timeout")
        ? "TIMEOUT"
        : "PROCESSING_ERROR",
    });
  }
});

/**
 * @route   GET /api/assessment/:sessionId
 * @desc    Get assessment session details
 * @access  Private
 */
router.get("/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Check database first for completed assessments (they have results)
    let assessment = await Assessment.findOne({ sessionId });
    let isImageAssessment = false;

    if (assessment) {
      console.log(`Assessment found in database for session: ${sessionId}`);
    } else {
      // If not in database, check the cache (for active assessments)
      console.log(
        `Assessment not found in database, checking cache for session: ${sessionId}`
      );

      try {
        const {
          SessionManager,
        } = require("../../pipeline/memory/session-manager");
        const cachedState = SessionManager.getCachedState(sessionId);

        if (cachedState) {
          console.log(`Assessment found in cache for session: ${sessionId}`);
          // Convert cached state to assessment-like object
          assessment = {
            sessionId: cachedState.sessionId,
            assessmentType: cachedState.assessmentType,
            status: cachedState.status,
            questions: cachedState.questions,
            responses: cachedState.responses,
            currentQuestionIndex: cachedState.currentQuestionIndex,
            startedAt: cachedState.startedAt,
            lastActiveAt: cachedState.lastActiveAt,
            completedAt: cachedState.completedAt,
            results: cachedState.results,
            userId: null, // Cache entries don't have userId
            _fromCache: true,
          };
        }
      } catch (cacheError) {
        console.warn("Error accessing cache:", cacheError.message);
        assessment = null;
      }

      // If not found in regular assessments, try image assessments
      if (!assessment) {
        console.log(
          `Regular assessment not found, checking image assessments for session: ${sessionId}`
        );

        assessment = await ImageAssessmentSession.findOne({
          sessionId,
        });

        if (assessment) {
          isImageAssessment = true;
          console.log(`Found image assessment for session: ${sessionId}`);
        }
      }

      if (!assessment) {
        console.log(
          `Assessment not found in cache either for session: ${sessionId}`
        );
        return res.status(404).json({
          success: false,
          message: "Assessment session not found",
        });
      }
    }

    // Debug logging
    console.log(`=== GET ASSESSMENT DEBUG for ${sessionId} ===`);
    console.log(`Assessment found: ${assessment._id}`);
    console.log(`Assessment type: ${isImageAssessment ? "image" : "regular"}`);
    console.log(`Assessment status: ${assessment.status}`);
    console.log(`Assessment has results: ${!!assessment.results}`);
    if (assessment.results) {
      console.log(`Results keys: ${Object.keys(assessment.results)}`);
      console.log(`Has summary: ${!!assessment.results.summary}`);
      if (assessment.results.summary) {
        console.log(`Summary length: ${assessment.results.summary.length}`);
      }
    }
    console.log(`=== END DEBUG ===`);

    // Optional authentication parsing (without requiring auth)
    let user = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require("../auth/model");
        user = await User.findById(decoded.id).select("-password");
        req.user = user; // Set req.user for consistency
        console.log(`âœ… User authenticated: ${user.email}`);
      } catch (authError) {
        console.log(`âŒ Auth token invalid or expired: ${authError.message}`);
        // Continue without authentication
      }
    }

    // Check authentication and permissions
    const isLoggedIn = user && user._id;
    const hasAccess =
      assessment._fromCache || // Cached assessments are accessible (no userId)
      !assessment.userId ||
      !isLoggedIn ||
      (assessment.userId &&
        user._id &&
        assessment.userId.toString() === user._id.toString());

    console.log(
      `Authentication check: isLoggedIn=${!!isLoggedIn}, hasAccess=${hasAccess}, isImageAssessment=${isImageAssessment}`
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this assessment",
      });
    }

    // If not logged in, return limited information
    if (!isLoggedIn) {
      console.log(`ðŸ‘¤ Returning limited access response (not authenticated)`);
      return res.json({
        success: true,
        assessment: {
          sessionId: assessment.sessionId,
          assessmentType: assessment.assessmentType,
          status: assessment.status,
          questions: assessment.questions,
          progress: {
            percentage: assessment.completionPercentage,
          },
          isLimitedAccess: true, // Flag for frontend to show login prompt
        },
      });
    }

    console.log(`ðŸ” User is authenticated, returning full data`);

    // Check if assessment should be completed based on response count
    const responseCount = assessment.responses
      ? assessment.responses.length
      : 0;
    const shouldBeCompleted = responseCount >= 15; // Updated to 15 question limit for comprehensive assessment

    console.log(
      `Response count check: ${responseCount} responses, shouldBeCompleted: ${shouldBeCompleted}`
    );

    // If assessment has enough responses but isn't marked as completed, update status
    if (shouldBeCompleted && assessment.status !== "completed") {
      console.log(
        `Assessment has ${responseCount} responses but isn't completed. Updating status...`
      );

      // If results already exist, just update the status
      if (assessment.results) {
        console.log(
          `Assessment already has results, just updating status to completed`
        );
        assessment.status = "completed";
        if (!assessment.completedAt) {
          assessment.completedAt = new Date().toISOString();
        }

        // Save to database if it's a database assessment
        if (!assessment._fromCache && assessment.save) {
          try {
            await assessment.save();
            console.log(`✅ Status updated to completed in database`);
          } catch (saveError) {
            console.warn(
              `Warning: Could not save status update to database:`,
              saveError.message
            );
          }
        }
      } else {
        // No results yet, complete the assessment using the pipeline
        try {
          console.log(
            `⚠️ Assessment has ${responseCount} responses but no results. Attempting pipeline completion...`
          );
          const { completeAssessment } = require("../../pipeline");
          const completionResult = await completeAssessment(sessionId);

          if (completionResult.success) {
            console.log(`✅ Assessment completed automatically on refresh`);
            console.log(
              `✅ Completion result childName:`,
              completionResult.summary?.childName
            );
            // Update the assessment object with completion data
            assessment.status = "completed";
            assessment.completedAt = new Date().toISOString();
            assessment.results = completionResult.summary;

            // Save to database if it's a database assessment
            if (!assessment._fromCache && assessment.save) {
              try {
                await assessment.save();
                console.log(`✅ Completion saved to database`);
              } catch (saveError) {
                console.warn(
                  `Warning: Could not save completion to database:`,
                  saveError.message
                );
              }
            }
          } else {
            console.warn(
              `Warning: Could not complete assessment:`,
              completionResult.error
            );
          }
        } catch (completionError) {
          console.warn(
            `Warning: Error completing assessment on refresh:`,
            completionError.message
          );
        }
      }
    }

    // Return full assessment data for authenticated users
    let responseData;

    if (isImageAssessment) {
      // Handle image assessment response
      responseData = {
        sessionId: assessment.sessionId,
        assessmentType: assessment.assessmentType,
        assessmentCategory: "image",
        sourceType: "image",
        status: assessment.status,
        responses: assessment.responses || [],
        progress: {
          current: assessment.responses ? assessment.responses.length : 0,
          total: assessment.totalQuestions || 0,
          percentage: assessment.completionPercentage || 0,
        },
        startedAt: assessment.startedAt,
        lastActiveAt: assessment.lastActiveAt,
        completedAt: assessment.completedAt,
        metadata: assessment.metadata || {},
      };
    } else {
      // Handle regular assessment response
      responseData = {
        sessionId: assessment.sessionId,
        assessmentType: assessment.assessmentType,
        assessmentCategory: "text",
        sourceType: "text",
        status: assessment.status,
        questions: assessment.questions,
        responses: assessment.responses,
        currentQuestionIndex: assessment.currentQuestionIndex,
        progress: {
          current: responseCount,
          total: 15, // Updated to 15 total questions for comprehensive assessment
          percentage: Math.min(100, Math.round((responseCount / 15) * 100)),
        },
        startedAt: assessment.startedAt,
        lastActiveAt: assessment.lastActiveAt,
        completedAt: assessment.completedAt,
      };
    }

    // Include full results if assessment is completed
    console.log(`=== CONDITION CHECK ===`);
    console.log(`assessment.status: '${assessment.status}'`);
    console.log(
      `assessment.status === 'completed': ${assessment.status === "completed"}`
    );
    console.log(`assessment.results: ${!!assessment.results}`);
    console.log(
      `Condition met: ${
        assessment.status === "completed" && assessment.results
      }`
    );

    if (assessment.status === "completed" && assessment.results) {
      responseData.results = assessment.results;
      console.log(
        `âœ… Including results data for completed assessment ${sessionId}`
      );
      console.log(
        `âœ… Results keys included: ${Object.keys(assessment.results)}`
      );
    } else {
      console.log(`âŒ NOT including results data`);
      console.log(`âŒ Status check: ${assessment.status === "completed"}`);
      console.log(`âŒ Results check: ${!!assessment.results}`);
    }
    console.log(`=== END CONDITION CHECK ===`);

    // For completed assessments, disable caching to ensure fresh results
    if (assessment.status === "completed") {
      // Disable ETags to prevent 304 responses
      res.removeHeader("ETag");
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      // Also add a timestamp to ensure response is always different
      responseData.fetchedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      assessment: responseData,
    });
  } catch (error) {
    console.error("Error fetching assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching assessment",
    });
  }
});

/**
 * @route   POST /api/assessment/:sessionId/pause
 * @desc    Pause an assessment session
 * @access  Private
 */
router.post("/:sessionId/pause", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find the assessment
    const assessment = await Assessment.findOne({ sessionId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment session not found",
      });
    }

    // If authenticated, check permissions
    if (
      req.user &&
      assessment.userId &&
      assessment.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to pause this assessment",
      });
    }

    // Pause the assessment
    assessment.pause();
    await assessment.save();

    res.json({
      success: true,
      message: "Assessment paused successfully",
      sessionId: assessment.sessionId,
    });
  } catch (error) {
    console.error("Error pausing assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error pausing assessment",
    });
  }
});

/**
 * @route   POST /api/assessment/:sessionId/resume
 * @desc    Resume a paused assessment session
 * @access  Private
 */
router.post("/:sessionId/resume", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find the assessment
    const assessment = await Assessment.findOne({ sessionId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment session not found",
      });
    }

    // If authenticated, check permissions
    if (
      req.user &&
      assessment.userId &&
      assessment.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to resume this assessment",
      });
    }

    // Resume the assessment
    assessment.resume();
    await assessment.save();

    res.json({
      success: true,
      message: "Assessment resumed successfully",
      sessionId: assessment.sessionId,
      currentQuestion: assessment.questions[assessment.currentQuestionIndex],
    });
  } catch (error) {
    console.error("Error resuming assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error resuming assessment",
    });
  }
});

/**
 * @route   GET /api/assessment/assessments
 * @desc    Get all assessments for current user
 * @access  Private
 */
router.get("/assessments", protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({ userId: req.user.id })
      .select(
        "sessionId assessmentType status startedAt lastActiveAt completedAt"
      )
      .sort("-lastActiveAt");

    res.json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching assessments",
    });
  }
});

/**
 * @route   POST /api/assessment/start
 * @desc    Alternative route to start assessment
 * @access  Private
 */
router.post("/start", protect, async (req, res) => {
  try {
    const { childId, childData, assessmentType, formData, language } = req.body;

    if (!childId || !childData || !assessmentType || !formData) {
      return res.status(400).json({
        success: false,
        message:
          "Child ID, child data, assessment type, and form data are required",
      });
    }

    console.log(
      `Starting ${assessmentType} assessment for child ID: ${childId}`
    );

    // Create an intake record for this assessment
    console.log(
      `Creating intake for child: "${childData.name}" (age: ${childData.age})`
    );

    // Clean the child name to remove any "undefined" parts
    const cleanChildName = childData.name
      .replace(/\s+undefined\s*/gi, "")
      .trim();

    const intake = new Intake({
      childName: cleanChildName, // Clean the name to remove "undefined"
      age: childData.age,
      gender: childData.gender,
      parentName: req.user?.name || "Parent",
      parentEmail: req.user?.email || "parent@example.com",
      primaryConcerns: `${assessmentType} assessment`,
      dataConsent: true,
      userId: req.user?._id,
      childId: childId,
      status: "pending",
    });

    // Save the intake
    await intake.save();

    // Start the assessment with the intake and form data
    const assessmentFormData = {
      ...formData,
      childName: intake.childName,
      childAge: intake.age,
      childId: childId, // Pass the childId to the pipeline
      // Include full intake for backward compatibility
      intake: intake,
    };

    console.log(
      `Starting assessment with formData.childName: "${assessmentFormData.childName}", childId: "${childId}"`
    );

    const assessmentResult = await startAssessment({
      assessmentType,
      formData: assessmentFormData,
      userId: req.user._id, // Pass the user ID to the pipeline
      language: language || 'en', // Pass the language parameter
    });

    console.log(
      `Started assessment with session ID: ${assessmentResult.sessionId}, type: ${assessmentResult.assessmentType}`
    );

    // Update the intake status
    intake.status = "in_progress";
    await intake.save();

    res.json({
      success: true,
      sessionId: assessmentResult.sessionId,
      questions: assessmentResult.question ? [assessmentResult.question] : [],
      assessmentType: assessmentResult.assessmentType,
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error starting assessment",
    });
  }
});

/**
 * @route   GET /api/assessment/childAssessments/:childId
 * @desc    Get assessments for a specific child
 * @access  Private
 */
router.get("/childAssessments/:childId", protect, async (req, res) => {
  try {
    const { childId } = req.params;
    const { assessmentType } = req.query;

    console.log(
      `Fetching assessments for child: ${childId}, user: ${req.user._id}, filter: ${assessmentType}`
    );

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "Child ID is required",
      });
    }

    let regularAssessments = [];
    let imageAssessments = [];

    // Build queries based on filter type
    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Find regular assessments for this child belonging to the current user
      let regularFilter = {
        $and: [
          { userId: req.user._id }, // Ensure user only sees their own assessments
          {
            $or: [
              { childId: childId }, // Direct childId match
              { "intakeId.childId": childId }, // childId in linked intake
            ],
          },
        ],
      };

      if (assessmentType === "text") {
        regularFilter.$and.push({
          assessmentType: { $regex: /^(adhd|asd|autism|dyslexia|general)$/i },
        });
      }

      regularAssessments = await Assessment.find(regularFilter)
        .populate({
          path: "intakeId",
          select: "childName childId age gender primaryConcerns",
        })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results childId"
        )
        .sort("-lastActiveAt");
    }

    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Find image assessments for this child
      imageAssessments = await ImageAssessmentSession.find({
        userId: req.user._id,
        childId: childId,
      })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results childId"
        )
        .sort("-lastActiveAt");
    }

    // Combine and transform assessments using the transformer
    const assessmentTransformer = require("../../services/assessment-data-transformer.service");
    const unifiedResponse = assessmentTransformer.createUnifiedResponse(
      regularAssessments,
      imageAssessments,
      assessmentType
    );

    const allAssessments = unifiedResponse.assessments;

    console.log(
      `Found ${allAssessments.length} assessments for child ${childId} (${unifiedResponse.typeBreakdown.regular} regular, ${unifiedResponse.typeBreakdown.image} image)`
    );

    // Format the response to include useful information from the results
    const formattedAssessments = allAssessments.map((assessment) => {
      const basicInfo = {
        sessionId: assessment.sessionId,
        assessmentType: assessment.assessmentType,
        assessmentCategory: assessment.assessmentCategory,
        sourceType: assessment.sourceType,
        status: assessment.status,
        startedAt: assessment.startedAt,
        lastActiveAt: assessment.lastActiveAt,
        completedAt: assessment.completedAt,
        childId: assessment.childId,
        childName: assessment.childName,
      };

      // If assessment is complete, include summary data from results
      if (assessment.status === "completed" && assessment.results) {
        return {
          ...basicInfo,
          summary: {
            disorderRisk: assessment.results.disorderRisk,
            followUpSchedule: assessment.results.followUpSchedule,
            domainScores: assessment.results.domainScores,
          },
        };
      }

      return basicInfo;
    });

    res.json({
      success: true,
      assessments: formattedAssessments,
      count: allAssessments.length,
      typeBreakdown: unifiedResponse.typeBreakdown,
    });
  } catch (error) {
    console.error("Error fetching child assessments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching child assessments",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * @route   GET /api/assessment/:sessionId/report
 * @desc    Get assessment report/results
 * @access  Private
 */
router.get("/:sessionId/report", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(
      `Retrieving report for session ID: ${sessionId}, User: ${req.user._id}`
    );

    // First, try to find a regular assessment
    let assessment = await Assessment.findOne({ sessionId })
      .populate({
        path: "childId",
        select: "name age gender grade",
      })
      .populate({
        path: "intakeId",
        select: "primaryConcerns childName age gender",
      });

    let isImageAssessment = false;

    // If not found in regular assessments, try image assessments
    if (!assessment) {
      console.log(
        `Regular assessment not found, checking image assessments for session: ${sessionId}`
      );

      assessment = await ImageAssessmentSession.findOne({
        sessionId,
        userId: req.user._id, // Ensure user owns the assessment
      }).populate({
        path: "childId",
        select: "firstName lastName dateOfBirth gender",
      });

      if (assessment) {
        isImageAssessment = true;
        console.log(`Found image assessment for session: ${sessionId}`);
      }
    }

    if (!assessment) {
      console.log(`Assessment not found for session ID: ${sessionId}`);
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Log assessment details for debugging
    console.log(
      `Found ${isImageAssessment ? "image" : "regular"} assessment: ${
        assessment._id
      }, userId: ${assessment.userId}, status: ${assessment.status}`
    );

    // Check permissions - Compare user IDs as strings
    const userIdMatches =
      !assessment.userId ||
      assessment.userId.toString() === req.user._id.toString();

    if (!userIdMatches) {
      console.log(
        `Permission denied: userID ${req.user._id} trying to access assessment owned by ${assessment.userId}`
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this assessment",
      });
    }

    // If assessment is not complete, return basic data
    if (assessment.status !== "completed") {
      console.log(
        `Assessment not complete: ${assessment.status}, progress: ${
          assessment.completionPercentage || "N/A"
        }`
      );
      return res.status(400).json({
        success: false,
        message: "Assessment is not complete yet. No report available.",
        progress: assessment.completionPercentage,
        status: assessment.status,
      });
    }

    // Log if results are missing
    if (!assessment.results) {
      console.log(`Warning: Completed assessment ${sessionId} has no results`);
    }

    // Format response based on assessment type
    let report;

    if (isImageAssessment) {
      // Format image assessment report
      const childName = assessment.childId
        ? `${assessment.childId.firstName} ${assessment.childId.lastName}`.trim()
        : assessment.metadata?.childName || "Child";

      // Calculate child age more robustly
      let childAge = null;
      try {
        if (assessment.childId?.dateOfBirth) {
          childAge = Math.floor(
            (Date.now() - new Date(assessment.childId.dateOfBirth)) /
              (365.25 * 24 * 60 * 60 * 1000)
          );
        } else if (assessment.metadata?.childAge) {
          childAge = assessment.metadata.childAge;
        }
      } catch (ageError) {
        console.warn(`Error calculating age:`, ageError);
        childAge = null;
      }

      const childGender = assessment.childId?.gender || null;

      report = {
        assessmentId: assessment._id,
        sessionId: assessment.sessionId,
        childName,
        childAge,
        childGender,
        assessmentType: assessment.assessmentType,
        assessmentCategory: "image",
        sourceType: "image",
        completedAt: assessment.completedAt,
        results: assessment.results || {},
        questionsAndResponses: {
          questions: [], // Image assessments don't have traditional questions
          responses: assessment.responses || [],
        },
        // Additional image assessment specific data
        accuracyRate: assessment.results?.accuracyRate || null,
        averageResponseTime: assessment.results?.averageResponseTime || null,
        totalQuestions: assessment.results?.totalQuestions || 0,
        correctAnswers: assessment.results?.correctAnswers || 0,
      };
    } else {
      // Format regular assessment report (existing logic)
      const childName =
        assessment.childId?.name || assessment.intakeId?.childName || "Child";

      // Calculate child age more robustly
      let childAge = null;
      try {
        if (assessment.childId?.dateOfBirth) {
          childAge = Math.floor(
            (Date.now() - new Date(assessment.childId.dateOfBirth)) /
              (365.25 * 24 * 60 * 60 * 1000)
          );
        } else if (assessment.intakeId?.age) {
          childAge = assessment.intakeId.age;
        } else if (assessment.childId?.age) {
          childAge = assessment.childId.age;
        }
      } catch (ageError) {
        console.warn(`Error calculating age:`, ageError);
        childAge = null;
      }

      const childGender =
        assessment.childId?.gender || assessment.intakeId?.gender || null;

      report = {
        assessmentId: assessment._id,
        sessionId: assessment.sessionId,
        childName,
        childAge,
        childGender,
        assessmentType: assessment.assessmentType,
        assessmentCategory: "text",
        sourceType: "text",
        completedAt: assessment.completedAt,
        results: assessment.results
          ? assessment.results
          : assessment.getResultsWithFallback(),
        questionsAndResponses: {
          questions: assessment.questions,
          responses: assessment.responses,
        },
      };
    }

    console.log(
      `Successfully generated ${
        isImageAssessment ? "image" : "regular"
      } assessment report for session ${sessionId}`
    );
    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error fetching assessment report:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching assessment report",
      error: error.stack,
    });
  }
});

/**
 * @route   GET /api/assessment/assessments/user
 * @desc    Get user's assessments
 * @access  Private
 */
router.get("/assessments/user", protect, async (req, res) => {
  try {
    const { status, assessmentType } = req.query;

    console.log(
      `Fetching assessments for user: ${req.user._id}, status: ${status}, type: ${assessmentType}`
    );

    let regularAssessments = [];
    let imageAssessments = [];

    // Build queries based on filter type
    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Build filter for regular assessments
      const regularFilter = { userId: req.user._id };
      if (status) {
        regularFilter.status = status;
      }
      if (assessmentType === "text") {
        regularFilter.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
      }

      // Find regular assessments for this user
      regularAssessments = await Assessment.find(regularFilter)
        .populate({
          path: "intakeId",
          select: "childName age gender primaryConcerns childId",
        })
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender avatar",
        })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results questions responses"
        )
        .sort("-lastActiveAt");
    }

    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Build filter for image assessments
      const imageFilter = { userId: req.user._id };
      if (status) {
        imageFilter.status = status;
      }

      // Find image assessments for this user
      imageAssessments = await ImageAssessmentSession.find(imageFilter)
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender avatar",
        })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results metadata"
        )
        .sort("-lastActiveAt");
    }

    // Combine and transform assessments using the transformer
    const assessmentTransformer = require("../../services/assessment-data-transformer.service");
    const unifiedResponse = assessmentTransformer.createUnifiedResponse(
      regularAssessments,
      imageAssessments,
      assessmentType
    );

    const allAssessments = unifiedResponse.assessments;

    console.log(
      `Found ${allAssessments.length} assessments for user ${req.user._id} (${unifiedResponse.typeBreakdown.regular} regular, ${unifiedResponse.typeBreakdown.image} image)`
    );

    const formattedAssessments = allAssessments.map((assessment) => {
      // Calculate child age if date of birth is available
      let childAge = null;
      if (assessment.childId?.dateOfBirth) {
        const birthDate = new Date(assessment.childId.dateOfBirth);
        const ageDiff = Date.now() - birthDate.getTime();
        childAge = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
      }

      return {
        sessionId: assessment.sessionId,
        assessmentType: assessment.assessmentType,
        assessmentCategory: assessment.assessmentCategory,
        sourceType: assessment.sourceType,
        status: assessment.status,
        childName: assessment.childName,
        childAge: childAge || assessment.intakeId?.age || null,
        childGender:
          assessment.childId?.gender || assessment.intakeId?.gender || null,
        childId: assessment.childId || assessment.intakeId?.childId || null,
        startedAt: assessment.startedAt,
        lastActiveAt: assessment.lastActiveAt,
        completedAt: assessment.completedAt,
        progress: assessment.progress || {
          current: assessment.responses?.length || 0,
          total: assessment.questions?.length || 15,
          percentage: assessment.progress?.completionPercentage || 0,
        },
        results:
          assessment.status === "completed" ? assessment.results || {} : null,
        hasQuestions: !!(
          assessment.questions && assessment.questions.length > 0
        ),
        questionsCount: assessment.questions?.length || 0,
        responsesCount: assessment.responses?.length || 0,
      };
    });

    res.json({
      success: true,
      count: allAssessments.length,
      assessments: formattedAssessments,
      typeBreakdown: unifiedResponse.typeBreakdown,
    });
  } catch (error) {
    console.error("Error fetching user assessments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user assessments",
    });
  }
});

/**
 * @route   GET /api/assessment/assessments/history
 * @desc    Get assessment history for current user
 * @access  Private
 */
router.get("/assessments/history", protect, async (req, res) => {
  try {
    const { assessmentType } = req.query;
    console.log(
      `Fetching assessment history for user: ${req.user._id}, filter: ${assessmentType}`
    );

    let regularAssessments = [];
    let imageAssessments = [];

    // Build queries based on filter type
    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Find completed regular assessments for this user
      let regularFilter = {
        userId: req.user._id,
        status: "completed",
      };

      if (assessmentType === "text") {
        regularFilter.assessmentType = {
          $in: ["adhd", "asd", "autism", "dyslexia"],
        };
      }

      regularAssessments = await Assessment.find(regularFilter)
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results questions responses"
        )
        .sort("-completedAt");
    }

    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Find completed image assessments for this user
      imageAssessments = await ImageAssessmentSession.find({
        userId: req.user._id,
        status: "completed",
      })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results"
        )
        .sort("-completedAt");
    }

    // Combine and transform assessments using the transformer
    const assessmentTransformer = require("../../services/assessment-data-transformer.service");
    const unifiedResponse = assessmentTransformer.createUnifiedResponse(
      regularAssessments,
      imageAssessments,
      assessmentType
    );

    const allAssessments = unifiedResponse.assessments;

    console.log(
      `Found ${allAssessments.length} completed assessments for user ${req.user._id} (${unifiedResponse.typeBreakdown.regular} regular, ${unifiedResponse.typeBreakdown.image} image)`
    );

    // Format the response with detailed information
    const formattedAssessments = allAssessments.map((assessment) => {
      const baseInfo = {
        sessionId: assessment.sessionId,
        assessmentType: assessment.assessmentType,
        assessmentCategory: assessment.assessmentCategory,
        sourceType: assessment.sourceType,
        status: assessment.status,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        results: assessment.results || {},
        summary: {
          riskScore: assessment.results?.disorderRisk?.score || 0,
          riskInterpretation:
            assessment.results?.disorderRisk?.interpretation || "",
          domainScores: assessment.results?.domainScores || [],
        },
      };

      // Add questions and responses for regular assessments
      if (assessment.sourceType === "text" && assessment.questions) {
        baseInfo.questionsAndResponses = assessment.questions.map(
          (question, index) => {
            const response = assessment.responses?.find(
              (r) => r.questionId === question.id
            );
            return {
              questionNumber: index + 1,
              question: question.prompt,
              questionType: question.type,
              skill: question.skill,
              response: response ? response.response : null,
            };
          }
        );
        baseInfo.summary.totalQuestions = assessment.questions.length;
      }

      return baseInfo;
    });

    res.json({
      success: true,
      count: allAssessments.length,
      assessments: formattedAssessments,
      typeBreakdown: unifiedResponse.typeBreakdown,
    });
  } catch (error) {
    console.error("Error fetching assessment history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching assessment history",
    });
  }
});

/**
 * @route   GET /api/assessment/assessments/timeline/:childId
 * @desc    Get assessment timeline data for a specific child (completed + scheduled)
 * @access  Private
 */
router.get("/assessments/timeline/:childId", protect, async (req, res) => {
  try {
    const { childId } = req.params;
    const { assessmentType } = req.query;
    const userId = req.user._id;

    console.log(
      `Fetching assessment timeline for child: ${childId}, user: ${userId}, filter: ${assessmentType}`
    );

    let regularAssessments = [];
    let imageAssessments = [];

    // Build queries based on filter type
    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Find regular assessments for this child and user
      let regularFilter = {
        userId: userId,
        $or: [{ childId: childId }, { "intakeId.childId": childId }],
      };

      if (assessmentType === "text") {
        regularFilter.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
      }

      regularAssessments = await Assessment.find(regularFilter)
        .populate({
          path: "intakeId",
          select: "childName age gender primaryConcerns childId",
        })
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender",
        })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results questions responses"
        )
        .sort("-completedAt -lastActiveAt");
    }

    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      // Find image assessments for this child and user
      imageAssessments = await ImageAssessmentSession.find({
        userId: userId,
        childId: childId,
      })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt completedAt results"
        )
        .sort("-completedAt -lastActiveAt");
    }

    // Combine and transform assessments using the transformer
    const assessmentTransformer = require("../../services/assessment-data-transformer.service");
    const unifiedResponse = assessmentTransformer.createUnifiedResponse(
      regularAssessments,
      imageAssessments,
      assessmentType
    );

    const allAssessments = unifiedResponse.assessments;

    console.log(
      `Found ${allAssessments.length} assessments for child ${childId} (${unifiedResponse.typeBreakdown.regular} regular, ${unifiedResponse.typeBreakdown.image} image)`
    );

    // Format assessments for timeline
    const timelineData = allAssessments.map((assessment) => {
      // Determine the date to use for timeline
      let timelineDate =
        assessment.completedAt ||
        assessment.lastActiveAt ||
        assessment.startedAt;

      // Get risk score and notes from results
      let riskScore = null;
      let notes = "Assessment in progress";

      if (assessment.status === "completed" && assessment.results) {
        // Use consistent risk score access from transformed data
        riskScore =
          assessment.riskScore ||
          assessment.results.disorderRisk?.score ||
          assessment.results.riskScore;

        // Use the comprehensive summary from transformed data, not short interpretation
        notes =
          assessment.summary ||
          assessment.results.summary ||
          assessment.results.interpretation ||
          "Assessment completed";
      }

      return {
        id: assessment.sessionId,
        date: timelineDate,
        type: assessment.assessmentType || "General",
        status: assessment.status,
        score: riskScore,
        childName: assessment.childName,
        notes: notes,
        assessmentCategory: assessment.assessmentCategory,
        sourceType: assessment.sourceType,
        reportUrl:
          assessment.status === "completed"
            ? `/assessment/complete/${assessment.sessionId}`
            : null,
        progress: {
          current: assessment.responses?.length || 0,
          total: assessment.questions?.length || 15,
          percentage:
            assessment.responses && assessment.questions
              ? Math.round(
                  (assessment.responses.length /
                    Math.max(assessment.questions.length, 15)) *
                    100
                )
              : 0,
        },
      };
    });

    // TODO: Add scheduled assessments from reports/recommendations
    // This would come from a separate collection or field in the assessment results
    const scheduledAssessments = await getScheduledAssessments(childId, userId);

    // Combine and sort all timeline data
    const allTimelineData = [...timelineData, ...scheduledAssessments].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      count: allTimelineData.length,
      timeline: allTimelineData,
      childId: childId,
      typeBreakdown: unifiedResponse.typeBreakdown,
    });
  } catch (error) {
    console.error("Error fetching assessment timeline:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching assessment timeline",
    });
  }
});

// Helper function to get scheduled assessments from reports
async function getScheduledAssessments(childId, userId) {
  try {
    // Find completed assessments that have recommendations for future assessments
    const completedAssessments = await Assessment.find({
      userId: userId,
      $or: [{ childId: childId }, { "intakeId.childId": childId }],
      status: "completed",
      "results.recommendations": { $exists: true },
    }).select("results sessionId assessmentType completedAt");

    const scheduledAssessments = [];

    completedAssessments.forEach((assessment) => {
      if (assessment.results && assessment.results.recommendations) {
        const recommendations = assessment.results.recommendations;

        // Look for follow-up recommendations
        if (recommendations.followUp) {
          const followUpDate = new Date(assessment.completedAt);

          // Add recommended follow-up period (default 3 months)
          const followUpMonths = recommendations.followUpMonths || 3;
          followUpDate.setMonth(followUpDate.getMonth() + followUpMonths);

          scheduledAssessments.push({
            id: `scheduled-${assessment.sessionId}-followup`,
            date: followUpDate,
            type: assessment.assessmentType,
            status: "scheduled",
            score: null,
            childName: null, // Will be filled by the main function
            notes: `Follow-up ${assessment.assessmentType} assessment recommended`,
            reportUrl: null,
            isRecommendation: true,
            originalAssessment: assessment.sessionId,
          });
        }

        // Look for additional assessment recommendations
        if (
          recommendations.additionalAssessments &&
          Array.isArray(recommendations.additionalAssessments)
        ) {
          recommendations.additionalAssessments.forEach(
            (additionalAssessment, index) => {
              const scheduledDate = new Date(assessment.completedAt);
              scheduledDate.setMonth(
                scheduledDate.getMonth() + (index + 1) * 2
              ); // Stagger additional assessments

              scheduledAssessments.push({
                id: `scheduled-${assessment.sessionId}-additional-${index}`,
                date: scheduledDate,
                type: additionalAssessment.type || "General",
                status: "scheduled",
                score: null,
                childName: null,
                notes:
                  additionalAssessment.reason ||
                  `Additional ${additionalAssessment.type} assessment recommended`,
                reportUrl: null,
                isRecommendation: true,
                originalAssessment: assessment.sessionId,
              });
            }
          );
        }
      }
    });

    return scheduledAssessments;
  } catch (error) {
    console.error("Error fetching scheduled assessments:", error);
    return [];
  }
}

// Import and mount image assessment routes
const imageAssessmentRoutes = require("./image-assessment/routes");
router.use("/image", imageAssessmentRoutes);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function handleGameBasedAssessmentStart(
  req,
  res,
  intake,
  assessmentType
) {
  const { childId } = req.body;

  try {
    // Get child age for battery selection
    const childAge = intake.age; // assuming age is in months

    // Configure batteries
    const batteries = await getRecommendedBatteries(assessmentType, childAge, [
      intake.primaryConcerns,
    ]);

    // Create battery structure
    const batteryStructure = {
      selectedBatteries: batteries.map((b) => ({
        batteryId: b.batteryId,
        name: b.name,
        domain: b.targetDomain,
        games: b.gameSequence.map((g) => g.gameId),
        estimatedDuration: b.estimatedTotalDuration,
      })),
      totalBatteries: batteries.length,
    };

    // Start battery-based assessment
    const sessionId = generateSessionId();

    const assessment = new Assessment({
      intakeId: intake._id,
      sessionId,
      assessmentType: assessmentType || "general",
      userId: req.user._id,
      childId,
      status: "active",

      // NEW: Battery-specific fields
      batteryStructure: {
        isGameBased: true,
        selectedBatteries: batteryStructure.selectedBatteries,
        currentBatteryIndex: 0,
        totalBatteries: batteryStructure.totalBatteries,
      },

      progressTracking: {
        overallProgress: 0,
        batteryProgress: batteryStructure.selectedBatteries.map((battery) => ({
          batteryId: battery.batteryId,
          progress: 0,
          status: "pending",
        })),
        gameProgress: [],
      },

      qualityMetrics: {
        engagementScore: 1,
        dataQualityFlags: [],
        reliabilityScore: 1,
      },
    });

    await assessment.save();

    res.json({
      success: true,
      sessionId,
      isGameBased: true,
      batteryStructure,
      firstGame: {
        gameId: batteryStructure.selectedBatteries[0].games[0],
        batteryId: batteryStructure.selectedBatteries[0].batteryId,
      },
    });
  } catch (error) {
    console.error("Error starting game-based assessment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error starting game-based assessment",
    });
  }
}

async function getRecommendedBatteries(assessmentType, ageMonths, concerns) {
  // Get age-appropriate batteries for the assessment type
  const batteries = await BatteryConfig.find({
    assessmentType: assessmentType.toLowerCase(),
    isActive: true,
    ageRecommendations: {
      $elemMatch: {
        minAge: { $lte: ageMonths },
        maxAge: { $gte: ageMonths },
        recommended: true,
      },
    },
  });

  if (batteries.length === 0) {
    // Fallback to default batteries if no age-specific ones found
    return await getDefaultBatteries(assessmentType);
  }

  return batteries;
}

async function getDefaultBatteries(assessmentType) {
  // Create default battery configurations for each assessment type
  const defaultBatteries = {
    adhd: [
      {
        batteryId: "adhd-attention",
        name: "Attention Assessment",
        targetDomain: "attention",
        gameSequence: [
          { gameId: "focus-finder", duration: 5, difficulty: "easy" },
          { gameId: "sound-shift", duration: 8, difficulty: "medium" },
          { gameId: "time-turtle", duration: 5, difficulty: "medium" },
        ],
        estimatedTotalDuration: 18,
        breakSchedule: [
          { afterGame: "focus-finder", duration: 30, type: "micro" },
        ],
      },
      {
        batteryId: "adhd-impulse",
        name: "Impulse Control Assessment",
        targetDomain: "impulse-control",
        gameSequence: [
          { gameId: "impulse-freeze", duration: 7, difficulty: "medium" },
          { gameId: "task-twister", duration: 5, difficulty: "hard" },
        ],
        estimatedTotalDuration: 12,
        breakSchedule: [],
      },
    ],
    dyslexia: [
      {
        batteryId: "dyslexia-phonological",
        name: "Phonological Assessment",
        targetDomain: "phonological",
        gameSequence: [
          { gameId: "rhyming-pairs", duration: 4, difficulty: "easy" },
          {
            gameId: "letter-sound-matching",
            duration: 7,
            difficulty: "medium",
          },
          { gameId: "syllable-clapper", duration: 4, difficulty: "medium" },
        ],
        estimatedTotalDuration: 15,
        breakSchedule: [
          { afterGame: "letter-sound-matching", duration: 30, type: "micro" },
        ],
      },
    ],
  };

  return defaultBatteries[assessmentType] || [];
}

function generateSessionId() {
  return (
    "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
}

async function analyzeGamePerformance(performanceData, assessment) {
  // Placeholder for AI analysis - would integrate with your existing AI pipeline
  return {
    performancePattern:
      performanceData.accuracy > 0.8 ? "strong" : "needs_support",
    riskIndicators: performanceData.accuracy < 0.5 ? ["low_accuracy"] : [],
    strengthIndicators: performanceData.accuracy > 0.8 ? ["high_accuracy"] : [],
    recommendedActions: [],
  };
}

async function updateAssessmentProgress(assessment, gameId, batteryId) {
  // Update game progress
  const gameProgressIndex = assessment.progressTracking.gameProgress.findIndex(
    (g) => g.gameId === gameId && g.batteryId === batteryId
  );

  if (gameProgressIndex === -1) {
    assessment.progressTracking.gameProgress.push({
      gameId,
      batteryId,
      attempts: 1,
      bestScore:
        assessment.gamePerformances[assessment.gamePerformances.length - 1]
          .score,
      status: "completed",
    });
  } else {
    assessment.progressTracking.gameProgress[gameProgressIndex].attempts += 1;
    assessment.progressTracking.gameProgress[gameProgressIndex].status =
      "completed";
  }

  // Update battery progress
  const batteryProgressIndex =
    assessment.progressTracking.batteryProgress.findIndex(
      (b) => b.batteryId === batteryId
    );

  if (batteryProgressIndex !== -1) {
    const currentBattery = assessment.batteryStructure.selectedBatteries.find(
      (b) => b.batteryId === batteryId
    );
    const completedGames = assessment.progressTracking.gameProgress.filter(
      (g) => g.batteryId === batteryId && g.status === "completed"
    ).length;

    const progress = Math.round(
      (completedGames / currentBattery.games.length) * 100
    );
    assessment.progressTracking.batteryProgress[batteryProgressIndex].progress =
      progress;

    if (progress === 100) {
      assessment.progressTracking.batteryProgress[batteryProgressIndex].status =
        "completed";
      assessment.progressTracking.batteryProgress[
        batteryProgressIndex
      ].completedAt = new Date();
    }
  }

  // Update overall progress
  const totalGames = assessment.batteryStructure.selectedBatteries.reduce(
    (sum, battery) => sum + battery.games.length,
    0
  );
  const completedGames = assessment.progressTracking.gameProgress.filter(
    (g) => g.status === "completed"
  ).length;

  assessment.progressTracking.overallProgress = Math.round(
    (completedGames / totalGames) * 100
  );
}

async function determineNextAction(assessment) {
  const currentBatteryIndex = assessment.batteryStructure.currentBatteryIndex;
  const currentBattery =
    assessment.batteryStructure.selectedBatteries[currentBatteryIndex];

  // Check if current battery is complete
  const batteryProgress = assessment.progressTracking.batteryProgress.find(
    (b) => b.batteryId === currentBattery.batteryId
  );

  if (batteryProgress && batteryProgress.progress === 100) {
    // Move to next battery or complete assessment
    if (currentBatteryIndex + 1 < assessment.batteryStructure.totalBatteries) {
      assessment.batteryStructure.currentBatteryIndex += 1;
      const nextBattery =
        assessment.batteryStructure.selectedBatteries[currentBatteryIndex + 1];

      return {
        action: "nextBattery",
        data: {
          nextBattery,
          nextGame: {
            gameId: nextBattery.games[0],
            batteryId: nextBattery.batteryId,
          },
        },
      };
    } else {
      // Assessment complete
      assessment.status = "completed";
      assessment.completedAt = new Date();

      return {
        action: "complete",
        data: {
          message: "Assessment completed successfully!",
        },
      };
    }
  } else {
    // Continue with next game in current battery
    const completedGamesInBattery =
      assessment.progressTracking.gameProgress.filter(
        (g) =>
          g.batteryId === currentBattery.batteryId && g.status === "completed"
      ).length;

    const nextGameIndex = completedGamesInBattery;

    if (nextGameIndex < currentBattery.games.length) {
      return {
        action: "nextGame",
        data: {
          nextGame: {
            gameId: currentBattery.games[nextGameIndex],
            batteryId: currentBattery.batteryId,
          },
        },
      };
    } else {
      // Battery completed - this shouldn't happen but handle gracefully
      return {
        action: "break",
        data: {
          breakType: "celebration",
          duration: 60,
          message: "Great job completing this section!",
        },
      };
    }
  }
}

async function initializeChildProgress(childId, sessionId) {
  try {
    let childProgress = await ChildProgress.findOne({ childId });

    if (!childProgress) {
      childProgress = new ChildProgress({
        childId,
        overallMetrics: {
          totalAssessments: 1,
          completedAssessments: 0,
          averageEngagement: 0,
          progressTrend: "insufficient_data",
          firstAssessmentDate: new Date(),
        },
        domainProgress: [],
        behavioralProfile: {
          optimalSessionLength: 30,
          preferredBreakFrequency: 10,
          motivationTriggers: [],
          frustrationThresholds: {
            accuracy: 0.4,
            time: 5,
            complexity: 3,
          },
        },
      });

      await childProgress.save();
    } else {
      childProgress.overallMetrics.totalAssessments += 1;
      await childProgress.save();
    }
  } catch (error) {
    console.error("Error initializing child progress:", error);
  }
}

async function updateChildProgress(childId, sessionId, gamePerformance) {
  try {
    const childProgress = await ChildProgress.findOne({ childId });
    if (!childProgress) return;

    // Update engagement metrics
    const engagementScore = calculateEngagementScore(gamePerformance);
    const currentAverage = childProgress.overallMetrics.averageEngagement;
    const totalAssessments = childProgress.overallMetrics.totalAssessments;

    childProgress.overallMetrics.averageEngagement =
      (currentAverage * (totalAssessments - 1) + engagementScore) /
      totalAssessments;

    childProgress.overallMetrics.lastAssessmentDate = new Date();

    await childProgress.save();
  } catch (error) {
    console.error("Error updating child progress:", error);
  }
}

function calculateEngagementScore(gamePerformance) {
  // Simple engagement calculation based on completion rate and behavioral metrics
  let engagementScore = gamePerformance.completionRate || 0;

  // Adjust based on behavioral metrics
  if (gamePerformance.behavioralMetrics) {
    const metrics = gamePerformance.behavioralMetrics;

    // Penalize for excessive help requests
    if (metrics.engagementData && metrics.engagementData.helpRequests > 3) {
      engagementScore *= 0.9;
    }

    // Penalize for high distraction events
    if (
      metrics.engagementData &&
      metrics.engagementData.distractionEvents > 2
    ) {
      engagementScore *= 0.8;
    }
  }

  return Math.max(0, Math.min(1, engagementScore));
}

function calculateTimeRemaining(assessment) {
  const currentBatteryIndex = assessment.batteryStructure.currentBatteryIndex;
  const remainingBatteries =
    assessment.batteryStructure.selectedBatteries.slice(currentBatteryIndex);

  let timeRemaining = 0;

  remainingBatteries.forEach((battery, index) => {
    if (index === 0) {
      // Current battery - calculate remaining games
      const completedGames = assessment.progressTracking.gameProgress.filter(
        (g) => g.batteryId === battery.batteryId && g.status === "completed"
      ).length;

      const remainingGamesInBattery = battery.games.length - completedGames;
      const avgGameDuration = battery.estimatedDuration / battery.games.length;
      timeRemaining += remainingGamesInBattery * avgGameDuration;
    } else {
      // Future batteries - full duration
      timeRemaining += battery.estimatedDuration;
    }
  });

  return Math.round(timeRemaining);
}

/**
 * @route   POST /api/assessment/suite/:sessionId/generate-report
 * @desc    Generate report for existing suite session
 * @access  Private
 */
router.post(
  "/suite/:sessionId/generate-report",
  protect,
  suiteController.generateReportForSession.bind(suiteController)
);

/**
 * @route   GET /api/assessment/reports/child/:childId
 * @desc    Get reports for a specific child
 * @access  Private
 */
router.get(
  "/reports/child/:childId",
  protect,
  assessmentController.getChildReports.bind(assessmentController)
);

/**
 * @route   GET /api/assessment/reports/:reportId
 * @desc    Get a specific report by ID
 * @access  Private
 */
router.get(
  "/reports/:reportId",
  protect,
  assessmentController.getReportById.bind(assessmentController)
);

/**
 * @route   GET /api/assessment/reports/priority/:priority
 * @desc    Get reports by priority level
 * @access  Private
 */
router.get(
  "/reports/priority/:priority",
  protect,
  assessmentController.getReportsByPriority.bind(assessmentController)
);

/**
 * @route   PUT /api/assessment/reports/:reportId/viewed
 * @desc    Mark report as viewed
 * @access  Private
 */
router.put(
  "/reports/:reportId/viewed",
  protect,
  assessmentController.markReportAsViewed.bind(assessmentController)
);

/**
 * @route   GET /api/assessment/reports/summary
 * @desc    Get reports dashboard summary
 * @access  Private
 */
router.get(
  "/reports/summary",
  protect,
  assessmentController.getReportsSummary.bind(assessmentController)
);

// Add progress analysis endpoint
router.post('/analyze-progress', async (req, res) => {
  try {
    const { assessmentReport, childProfile } = req.body;

    if (!assessmentReport) {
      return res.status(400).json({
        success: false,
        error: 'Assessment report is required'
      });
    }

    const progressData = await ProgressAnalysisService.analyzeProgressFromReport(
      assessmentReport,
      childProfile || {}
    );

    res.json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error('Error analyzing progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze progress data'
    });
  }
});

// Export the router
module.exports = router;
