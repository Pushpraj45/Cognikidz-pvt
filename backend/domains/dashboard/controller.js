const { ApiError } = require("../shared/error-middleware");
const User = require("../auth/model");
const Assessment = require("../assessment/model");
const {
  ImageAssessmentSession,
} = require("../assessment/image-assessment/model");
const ChildProfile = require("../childprofile/model");
const logger = require("../../utils/logger");
const universalPDFService = require("../../services/universal-pdf.service");
const assessmentTransformer = require("../../services/assessment-data-transformer.service");
const {
  normalizeDomainName,
  validateAndNormalizeScore,
  isValidDevelopmentalDomain,
} = require("../../utils/domainMapping");

/**
 * Helper function to format child names properly and remove N/A
 */
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
    lastName.trim().toLowerCase() !== "na"
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

/**
 * Get dashboard overview data with filtering support
 * @route GET /api/dashboard/overview
 * @access Private
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { assessmentType } = req.query;

    // Get parent details
    const parentDetails = await User.findById(userId).select(
      "firstName lastName email isVerified createdAt"
    );

    if (!parentDetails) {
      return next(new ApiError(404, "User not found"));
    }

    // Get children count (always the same regardless of filter)
    const childrenCount = await ChildProfile.countDocuments({
      parent: userId,
      isDeleted: false,
    });

    // Build filter-based queries
    let regularAssessmentQuery = { userId: userId };
    let imageAssessmentQuery = { userId: userId };
    let regularCompletedQuery = { userId: userId, status: "completed" };
    let imageCompletedQuery = { userId: userId, status: "completed" };
    let regularInProgressQuery = {
      userId: userId,
      status: { $in: ["active", "paused"] },
    };
    let imageInProgressQuery = {
      userId: userId,
      status: { $in: ["active", "paused"] },
    };

    // Apply assessment type filter if specified
    if (assessmentType && assessmentType !== "all") {
      if (assessmentType === "text") {
        // Only count regular assessments - using regex to match all text-based assessment types
        regularAssessmentQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        regularCompletedQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        regularInProgressQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        // Set image queries to return 0
        imageAssessmentQuery = { _id: { $exists: false } };
        imageCompletedQuery = { _id: { $exists: false } };
        imageInProgressQuery = { _id: { $exists: false } };
      } else if (assessmentType === "image") {
        // Only count image assessments, set regular queries to return 0
        regularAssessmentQuery = { _id: { $exists: false } };
        regularCompletedQuery = { _id: { $exists: false } };
        regularInProgressQuery = { _id: { $exists: false } };
      } else if (assessmentType === "game") {
        // For future game assessments
        regularAssessmentQuery.assessmentType = "game";
        regularCompletedQuery.assessmentType = "game";
        regularInProgressQuery.assessmentType = "game";
        imageAssessmentQuery = { _id: { $exists: false } };
        imageCompletedQuery = { _id: { $exists: false } };
        imageInProgressQuery = { _id: { $exists: false } };
      }
    }

    // Count regular and image assessments
    const [
      regularTotal,
      regularCompleted,
      regularInProgress,
      imageTotal,
      imageCompleted,
      imageInProgress,
    ] = await Promise.all([
      Assessment.countDocuments(regularAssessmentQuery),
      Assessment.countDocuments(regularCompletedQuery),
      Assessment.countDocuments(regularInProgressQuery),
      ImageAssessmentSession.countDocuments(imageAssessmentQuery),
      ImageAssessmentSession.countDocuments(imageCompletedQuery),
      ImageAssessmentSession.countDocuments(imageInProgressQuery),
    ]);

    // Calculate totals
    const totalAssessments = regularTotal + imageTotal;
    const completedAssessments = regularCompleted + imageCompleted;
    const inProgressAssessments = regularInProgress + imageInProgress;

    logger.info(
      `Dashboard overview accessed by user: ${req.user.email}, filter: ${
        assessmentType || "all"
      }, counts: ${totalAssessments} total, ${completedAssessments} completed, ${inProgressAssessments} in progress`
    );
    logger.info(
      `Dashboard overview breakdown - Regular: ${regularTotal} total, ${regularCompleted} completed, ${regularInProgress} in progress`
    );
    logger.info(
      `Dashboard overview breakdown - Image: ${imageTotal} total, ${imageCompleted} completed, ${imageInProgress} in progress`
    );

    res.json({
      success: true,
      data: {
        parentDetails: {
          name: `${parentDetails.firstName} ${parentDetails.lastName}`,
          email: parentDetails.email,
          status: parentDetails.isVerified ? "Active" : "Pending Verification",
          memberSince: parentDetails.createdAt,
        },
        stats: {
          childrenCount,
          totalAssessments,
          completedAssessments,
          inProgressAssessments,
        },
      },
    });
  } catch (error) {
    logger.error("Get dashboard overview error:", error);
    next(new ApiError(500, "Could not fetch dashboard overview"));
  }
};

/**
 * Get recent assessment results (top 5 per child)
 * @route GET /api/dashboard/recent-assessments
 * @access Private
 */
const getRecentAssessments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { assessmentType } = req.query;

    // Get all children for this user
    const children = await ChildProfile.find({
      parent: userId,
      isDeleted: false,
    }).select("firstName lastName");

    if (children.length === 0) {
      return res.json({
        success: true,
        data: {
          recentAssessments: [],
          message:
            "No children profiles found. Add a child profile to start assessments.",
        },
      });
    }

    const recentAssessments = [];

    // Process each child
    for (const child of children) {
      let regularAssessments = [];
      let imageAssessments = [];

      // Build queries based on filter type
      if (
        assessmentType === "text" ||
        assessmentType === "all" ||
        !assessmentType
      ) {
        // Query regular assessments
        let regularQuery = {
          userId: userId,
          childId: child._id,
          status: "completed",
          results: { $exists: true, $ne: null },
        };

        if (assessmentType === "text") {
          regularQuery.assessmentType = {
            $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
          };
        }

        regularAssessments = await Assessment.find(regularQuery)
          .populate("childId", "firstName lastName avatar")
          .sort({ completedAt: -1 })
          .limit(5)
          .select("sessionId assessmentType completedAt results childId");
      }

      if (
        assessmentType === "image" ||
        assessmentType === "all" ||
        !assessmentType
      ) {
        // Query image assessments - only for this specific child
        let imageQuery = {
          userId: userId,
          childId: child._id,
          status: "completed",
          results: { $exists: true, $ne: null },
        };

        imageAssessments = await ImageAssessmentSession.find(imageQuery)
          .populate("childId", "firstName lastName avatar")
          .sort({ completedAt: -1 })
          .limit(5)
          .select(
            "sessionId assessmentType completedAt results childId metadata"
          );

        // Debug logging for image assessments
        if (imageAssessments.length > 0) {
          logger.info(
            `Found ${imageAssessments.length} image assessments for child ${child._id}`
          );
          imageAssessments.forEach((assessment, index) => {
            logger.info(
              `Image assessment ${index + 1}: childId=${
                assessment.childId?._id
              }, firstName=${assessment.childId?.firstName}, lastName=${
                assessment.childId?.lastName
              }`
            );
          });
        }
      }

      // Transform and combine assessments using the transformer
      const unifiedResponse = assessmentTransformer.createUnifiedResponse(
        regularAssessments,
        imageAssessments,
        assessmentType
      );

      // Format for child-specific response with proper child name handling
      const childName = formatChildName(child.firstName, child.lastName);

      // Ensure each assessment has the correct child name
      const formattedAssessments = unifiedResponse.assessments
        .slice(0, 5)
        .map((assessment) => ({
          ...assessment,
          // Use assessment's child name if it exists and is valid, otherwise use profile name
          childName:
            assessment.childName && assessment.childName !== "Child Assessment"
              ? assessment.childName
              : childName,
          childId: child._id,
        }));

      recentAssessments.push({
        childId: child._id,
        childName: childName,
        assessments: formattedAssessments,
      });
    }

    // Create global recent list (top 10 most recent across all children)
    let globalRegularAssessments = [];
    let globalImageAssessments = [];

    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      let globalRegularQuery = {
        userId: userId,
        status: "completed",
        results: { $exists: true, $ne: null },
      };

      if (assessmentType === "text") {
        globalRegularQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
      }

      globalRegularAssessments = await Assessment.find(globalRegularQuery)
        .populate("childId", "firstName lastName avatar")
        .sort({ completedAt: -1 })
        .limit(10)
        .select("sessionId assessmentType completedAt results childId");
    }

    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      let globalImageQuery = {
        userId: userId,
        status: "completed",
        results: { $exists: true, $ne: null },
        // Don't exclude assessments without child ID - we'll handle this in the fallback logic
      };

      globalImageAssessments = await ImageAssessmentSession.find(
        globalImageQuery
      )
        .populate("childId", "firstName lastName avatar")
        .sort({ completedAt: -1 })
        .limit(10)
        .select(
          "sessionId assessmentType completedAt results childId metadata"
        );

      // Debug logging for global image assessments
      if (globalImageAssessments.length > 0) {
        logger.info(
          `Found ${globalImageAssessments.length} global image assessments`
        );
        globalImageAssessments.forEach((assessment, index) => {
          logger.info(
            `Global image assessment ${index + 1}: childId=${
              assessment.childId?._id
            }, firstName=${assessment.childId?.firstName}, lastName=${
              assessment.childId?.lastName
            }`
          );
        });
      }
    }

    // Transform and combine global assessments
    const globalUnified = assessmentTransformer.createUnifiedResponse(
      globalRegularAssessments,
      globalImageAssessments,
      assessmentType
    );

    // Ensure global assessments also have proper child names
    const globalAssessmentsWithNames = globalUnified.assessments
      .slice(0, 10)
      .map((assessment) => {
        // Use assessment's child name if it exists and is valid
        if (
          assessment.childName &&
          assessment.childName !== "Child Assessment"
        ) {
          return assessment;
        }

        // Otherwise, find the child from our children list to get the correct name
        const childProfile = children.find(
          (child) => child._id.toString() === assessment.childId?.toString()
        );
        if (childProfile) {
          return {
            ...assessment,
            childName: formatChildName(
              childProfile.firstName,
              childProfile.lastName
            ),
          };
        }

        // For assessments without child IDs, use the first child if user has only one child
        if (!assessment.childId && children.length === 1) {
          return {
            ...assessment,
            childName: formatChildName(
              children[0].firstName,
              children[0].lastName
            ),
            childId: children[0]._id,
          };
        }

        // For assessments without child IDs and multiple children, keep as is
        return assessment;
      });

    logger.info(
      `Recent assessments retrieved for user: ${req.user.email} - ${recentAssessments.length} children, ${globalUnified.totalCount} total recent assessments (${globalUnified.typeBreakdown.regular} regular, ${globalUnified.typeBreakdown.image} image)`
    );

    res.json({
      success: true,
      data: {
        recentAssessmentsByChild: recentAssessments,
        globalRecentAssessments: globalAssessmentsWithNames,
        totalChildren: children.length,
        typeBreakdown: globalUnified.typeBreakdown,
      },
    });
  } catch (error) {
    logger.error("Get recent assessments error:", error);
    next(new ApiError(500, "Could not fetch recent assessments"));
  }
};

/**
 * Get in-progress assessments
 * @route GET /api/dashboard/in-progress-assessments
 * @access Private
 */
const getInProgressAssessments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { assessmentType } = req.query;

    let regularInProgress = [];
    let imageInProgress = [];

    // Get in-progress regular assessments
    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      let regularQuery = {
        userId: userId,
        status: { $in: ["active", "paused"] },
      };

      if (assessmentType === "text") {
        regularQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
      }

      regularInProgress = await Assessment.find(regularQuery)
        .populate("childId", "firstName lastName avatar")
        .populate("intakeId", "childName")
        .sort({ lastActiveAt: -1 })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt currentQuestionIndex responses childId intakeId questions"
        );
    }

    // Get in-progress image assessments
    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      imageInProgress = await ImageAssessmentSession.find({
        userId: userId,
        status: { $in: ["active", "paused"] },
      })
        .populate("childId", "firstName lastName avatar")
        .sort({ lastActiveAt: -1 })
        .select(
          "sessionId assessmentType status startedAt lastActiveAt currentQuestion responses childId totalQuestions metadata"
        );
    }

    // Transform and combine in-progress assessments
    const unifiedInProgress = assessmentTransformer.createUnifiedResponse(
      regularInProgress,
      imageInProgress,
      assessmentType
    );

    // Format assessments with progress information
    const formattedAssessments = unifiedInProgress.assessments.map(
      (assessment) => ({
        id: assessment.id,
        sessionId: assessment.sessionId,
        childId: assessment.childId,
        childName: assessment.childName,
        assessmentType: assessment.assessmentType,
        assessmentCategory: assessment.assessmentCategory,
        sourceType: assessment.sourceType,
        status: assessment.status,
        startedAt: assessment.startedAt,
        lastActiveAt: assessment.lastActiveAt,
        progress: assessment.progress || {
          answeredQuestions: 0,
          totalQuestions: 0,
          completionPercentage: 0,
        },
      })
    );

    logger.info(
      `In-progress assessments retrieved for user: ${req.user.email} - ${formattedAssessments.length} assessments (${unifiedInProgress.typeBreakdown.regular} regular, ${unifiedInProgress.typeBreakdown.image} image)`
    );

    res.json({
      success: true,
      data: {
        inProgressAssessments: formattedAssessments,
        count: formattedAssessments.length,
        typeBreakdown: unifiedInProgress.typeBreakdown,
      },
    });
  } catch (error) {
    logger.error("Get in-progress assessments error:", error);
    next(new ApiError(500, "Could not fetch in-progress assessments"));
  }
};

/**
 * Get assessment counts by type for filter badges
 * @route GET /api/dashboard/assessment-counts
 * @access Private
 */
const getAssessmentCounts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all completed traditional assessments for this user
    const allAssessments = await Assessment.find({
      userId: userId,
      status: "completed",
      results: { $exists: true, $ne: null },
    }).select("assessmentType");

    // Get all completed image assessments for this user
    const allImageAssessments = await ImageAssessmentSession.find({
      userId: userId,
      status: "completed",
      results: { $exists: true, $ne: null },
    }).select("assessmentType");

    // Count assessments by type categories
    const counts = {
      text: 0,
      image: 0,
      game: 0,
    };

    // Count traditional assessments (all regular assessments are text-based by definition)
    allAssessments.forEach((assessment) => {
      const assessmentTypeLower =
        assessment.assessmentType?.toLowerCase() || "";

      // Check if it's a game assessment
      if (
        assessmentTypeLower.includes("game") ||
        assessmentTypeLower === "interactive"
      ) {
        counts.game++;
      } else {
        // All regular assessments are text-based
        counts.text++;
      }
    });

    // Count image assessments (all image assessments are image-based by definition)
    allImageAssessments.forEach((assessment) => {
      const assessmentTypeLower =
        assessment.assessmentType?.toLowerCase() || "";

      // Check if it's a game assessment
      if (
        assessmentTypeLower.includes("game") ||
        assessmentTypeLower === "interactive"
      ) {
        counts.game++;
      } else {
        // All image assessments are image-based
        counts.image++;
      }
    });

    const totalCount = allAssessments.length + allImageAssessments.length;

    res.json({
      success: true,
      data: {
        counts,
        total: totalCount,
      },
    });
  } catch (error) {
    logger.error("Get assessment counts error:", error);
    next(new ApiError(500, "Could not fetch assessment counts"));
  }
};

/**
 * Get dashboard stats summary
 * @route GET /api/dashboard/stats
 * @access Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { assessmentType } = req.query;

    // Build filter-based queries
    let regularQuery = { userId: userId };
    let regularCompletedQuery = { userId: userId, status: "completed" };
    let regularInProgressQuery = {
      userId: userId,
      status: { $in: ["active", "paused"] },
    };
    let regularWeekQuery = {
      userId: userId,
      completedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    };
    let regularMonthQuery = {
      userId: userId,
      completedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    };

    let imageQuery = { userId: userId };
    let imageCompletedQuery = { userId: userId, status: "completed" };
    let imageInProgressQuery = {
      userId: userId,
      status: { $in: ["active", "paused"] },
    };
    let imageWeekQuery = {
      userId: userId,
      completedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    };
    let imageMonthQuery = {
      userId: userId,
      completedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    };

    // Apply assessment type filter if specified
    if (assessmentType && assessmentType !== "all") {
      if (assessmentType === "text") {
        // Only include text-based assessments - make case insensitive and more inclusive
        regularQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        regularCompletedQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        regularInProgressQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        regularWeekQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        regularMonthQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };

        // Set image queries to return 0
        imageQuery = { _id: { $exists: false } };
        imageCompletedQuery = { _id: { $exists: false } };
        imageInProgressQuery = { _id: { $exists: false } };
        imageWeekQuery = { _id: { $exists: false } };
        imageMonthQuery = { _id: { $exists: false } };
      } else if (assessmentType === "image") {
        // Only include image-based assessments
        regularQuery = { _id: { $exists: false } };
        regularCompletedQuery = { _id: { $exists: false } };
        regularInProgressQuery = { _id: { $exists: false } };
        regularWeekQuery = { _id: { $exists: false } };
        regularMonthQuery = { _id: { $exists: false } };
      } else if (assessmentType === "game") {
        regularQuery.assessmentType = { $regex: /^game$/i };
        imageQuery = { _id: { $exists: false } };
        imageCompletedQuery = { _id: { $exists: false } };
        imageInProgressQuery = { _id: { $exists: false } };
        imageWeekQuery = { _id: { $exists: false } };
        imageMonthQuery = { _id: { $exists: false } };
      }
    }

    // Get comprehensive stats
    const [
      childrenCount,
      regularTotal,
      regularCompleted,
      regularInProgress,
      regularThisWeek,
      regularThisMonth,
      imageTotal,
      imageCompleted,
      imageInProgress,
      imageThisWeek,
      imageThisMonth,
    ] = await Promise.all([
      ChildProfile.countDocuments({ parent: userId, isDeleted: false }),
      Assessment.countDocuments(regularQuery),
      Assessment.countDocuments(regularCompletedQuery),
      Assessment.countDocuments(regularInProgressQuery),
      Assessment.countDocuments(regularWeekQuery),
      Assessment.countDocuments(regularMonthQuery),
      ImageAssessmentSession.countDocuments(imageQuery),
      ImageAssessmentSession.countDocuments(imageCompletedQuery),
      ImageAssessmentSession.countDocuments(imageInProgressQuery),
      ImageAssessmentSession.countDocuments(imageWeekQuery),
      ImageAssessmentSession.countDocuments(imageMonthQuery),
    ]);

    // Calculate totals
    const totalAssessments = regularTotal + imageTotal;
    const completedAssessments = regularCompleted + imageCompleted;
    const inProgressAssessments = regularInProgress + imageInProgress;
    const thisWeekAssessments = regularThisWeek + imageThisWeek;
    const thisMonthAssessments = regularThisMonth + imageThisMonth;

    logger.info(
      `Dashboard stats retrieved for user: ${req.user.email}, filter: ${
        assessmentType || "all"
      }`
    );

    res.json({
      success: true,
      data: {
        children: childrenCount,
        assessments: {
          total: totalAssessments,
          completed: completedAssessments,
          inProgress: inProgressAssessments,
          thisWeek: thisWeekAssessments,
          thisMonth: thisMonthAssessments,
        },
      },
    });
  } catch (error) {
    logger.error("Get dashboard stats error:", error);
    next(new ApiError(500, "Could not fetch dashboard stats"));
  }
};

/**
 * Get progress visualization data for a specific child
 * @route GET /api/dashboard/child-progress/:childId
 * @access Private
 */
const getChildProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { childId } = req.params;
    const { assessmentType, scoreMode } = req.query;

    if (!childId) {
      return next(new ApiError(400, "Child ID is required"));
    }

    // Validate child belongs to user
    const child = await ChildProfile.findOne({
      _id: childId,
      parent: userId,
      isDeleted: false,
    });

    if (!child) {
      return next(new ApiError(404, "Child profile not found"));
    }

    // Build assessment queries based on filter
    let regularQuery = {
      userId: userId,
      childId: childId,
      status: "completed",
      results: { $exists: true, $ne: null },
    };

    let imageQuery = {
      userId: userId,
      childId: childId,
      status: "completed",
      results: { $exists: true, $ne: null },
    };

    // Apply assessment type filter if specified
    if (assessmentType && assessmentType !== "all") {
      if (assessmentType === "text") {
        // Only include text-based assessments - make case insensitive and more inclusive
        regularQuery.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
        imageQuery = { _id: { $exists: false } }; // Exclude image assessments
      } else if (assessmentType === "image") {
        // Only include image-based assessments
        regularQuery = { _id: { $exists: false } }; // Exclude regular assessments
        // imageQuery remains as is to include all image assessments
      } else if (assessmentType === "game") {
        regularQuery.assessmentType = { $regex: /^game$/i };
        imageQuery = { _id: { $exists: false } }; // Exclude image assessments
      }
    }

    // Get assessments with proper population
    const [regularAssessments, imageAssessments] = await Promise.all([
      Assessment.find(regularQuery)
        .populate("childId", "firstName lastName")
        .sort({ completedAt: -1 }),
      ImageAssessmentSession.find(imageQuery)
        .populate("childId", "firstName lastName")
        .sort({ completedAt: -1 }),
    ]);

    // Transform assessments with proper categorization
    const transformedRegularAssessments = regularAssessments.map(
      (assessment) => {
        const transformedAssessment =
          assessmentTransformer.transformRegularAssessment(assessment);
        return {
          ...transformedAssessment,
          assessmentCategory: "text",
          sourceType: "text",
          originalData: assessment.toObject(),
        };
      }
    );

    const transformedImageAssessments = imageAssessments.map((assessment) => {
      const transformedAssessment =
        assessmentTransformer.transformImageAssessment(assessment);
      return {
        ...transformedAssessment,
        assessmentCategory: "image",
        sourceType: "image",
        originalData: assessment.toObject(),
      };
    });

    const allAssessments = [
      ...transformedRegularAssessments,
      ...transformedImageAssessments,
    ].sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt) -
        new Date(a.completedAt || a.createdAt)
    );

    if (allAssessments.length === 0) {
      return res.json({
        success: true,
        data: {
          timelines: [],
          domains: {},
          currentScores: {},
          childName: formatChildName(child.firstName, child.lastName),
          totalAssessments: 0,
          assessmentBreakdown: {
            text: 0,
            image: 0,
            total: 0,
          },
          message:
            assessmentType === "text"
              ? "No completed text-based assessments found for this child."
              : assessmentType === "image"
              ? "No completed image-based assessments found for this child."
              : "No completed assessments found for this child.",
          hasDetailedScores: false,
          activeFilter: assessmentType || "all",
        },
      });
    }

    const timelines = [];
    let latestScores = {};
    let hasRealDomainScores = false;
    let assessmentBreakdown = {
      text: transformedRegularAssessments.length,
      image: transformedImageAssessments.length,
      total: allAssessments.length,
    };

    // Sort assessments chronologically before processing
    const sortedAssessments = allAssessments.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.createdAt);
      const dateB = new Date(b.completedAt || b.createdAt);
      return dateA.getTime() - dateB.getTime(); // Ascending chronological order
    });

    logger.info(
      `Processing ${sortedAssessments.length} assessments for child ${childId} (${transformedRegularAssessments.length} regular, ${transformedImageAssessments.length} image)`
    );

    // Extract domain scores from assessment results
    const extractDomainScores = (assessment) => {
      const scores = {};

      // Handle different result structures
      if (
        assessment.results?.domainScores &&
        Array.isArray(assessment.results.domainScores)
      ) {
        assessment.results.domainScores.forEach((domainObj) => {
          if (
            domainObj.domain &&
            domainObj.score !== undefined &&
            domainObj.score !== null
          ) {
            const normalizedDomain = normalizeDomainName(domainObj.domain);
            let score = domainObj.score;

            // IMPORTANT: Handle different score scales properly
            // Text assessments use RISK scores (1-10): 1 = low risk (good), 10 = high risk (bad)
            // Progress visualization uses PERFORMANCE scores (0-100): 100 = good performance, 0 = poor performance
            // So we INVERT the risk scores for display: Risk 1 → Performance 100, Risk 10 → Performance 0
            if (assessment.sourceType === "text" && score <= 10 && score >= 1) {
              // Convert risk score to performance score: (11 - riskScore) * 10
              score = Math.round((11 - score) * 10);
              logger.info(
                `Converted text risk score ${domainObj.score} to performance score ${score} for domain ${normalizedDomain}`
              );
            } else if (score > 10) {
              // Already in 0-100 range (image assessments typically use performance scores)
              score = Math.round(score);
            }

            scores[normalizedDomain] = Math.max(0, Math.min(100, score));
          }
        });
      }

      // Handle scores object format
      if (
        assessment.results?.scores &&
        typeof assessment.results.scores === "object"
      ) {
        Object.keys(assessment.results.scores).forEach((domain) => {
          const normalizedDomain = normalizeDomainName(domain);
          let score = assessment.results.scores[domain];

          if (score !== undefined && score !== null) {
            // Apply same conversion logic as above
            if (assessment.sourceType === "text" && score <= 10 && score >= 1) {
              // Convert risk score to performance score
              score = Math.round((11 - score) * 10);
              logger.info(
                `Converted text risk score ${assessment.results.scores[domain]} to performance score ${score} for domain ${normalizedDomain}`
              );
            } else if (score > 10) {
              // Already in 0-100 range
              score = Math.round(score);
            }

            scores[normalizedDomain] = Math.max(0, Math.min(100, score));
          }
        });
      }

      // Handle raw scores from image assessments
      if (
        assessment.results?.rawScores &&
        typeof assessment.results.rawScores === "object"
      ) {
        Object.keys(assessment.results.rawScores).forEach((domain) => {
          const normalizedDomain = normalizeDomainName(domain);
          let score = assessment.results.rawScores[domain];

          if (score !== undefined && score !== null) {
            // Raw scores from image assessments are typically accuracy percentages
            scores[normalizedDomain] = Math.max(
              0,
              Math.min(100, Math.round(score))
            );
          }
        });
      }

      return scores;
    };

    // Process each assessment to extract domain scores
    sortedAssessments.forEach((assessment, index) => {
      logger.info(
        `Processing assessment ${index + 1}/${sortedAssessments.length}: ${
          assessment.assessmentType
        } (${assessment.sourceType})`
      );

      const domainScores = extractDomainScores(assessment);

      logger.info(
        `Extracted domain scores for ${assessment.assessmentType}:`,
        domainScores
      );

      // Only add to timeline if we have real domain scores
      if (Object.keys(domainScores).length > 0) {
        hasRealDomainScores = true;

        const date = new Date(assessment.completedAt || assessment.createdAt)
          .toISOString()
          .split("T")[0];

        // Check if we already have an entry for this date
        const existingTimelineIndex = timelines.findIndex(
          (t) => t.date === date
        );

        if (existingTimelineIndex !== -1) {
          // Merge scores with existing entry (use the latest/highest scores)
          Object.keys(domainScores).forEach((domain) => {
            timelines[existingTimelineIndex].scores[domain] =
              domainScores[domain];
          });
        } else {
          // Create new timeline entry
          timelines.push({
            date: date,
            scores: domainScores,
            assessmentType: assessment.assessmentType,
            assessmentCategory: assessment.assessmentCategory,
            sourceType: assessment.sourceType,
          });
        }

        // Update latest scores
        Object.keys(domainScores).forEach((domain) => {
          latestScores[domain] = domainScores[domain];
        });

        logger.info(
          `Added timeline entry for ${date} with ${
            Object.keys(domainScores).length
          } domain scores`
        );
      } else {
        logger.warn(
          `No domain scores found for assessment ${assessment.assessmentType} (${assessment.sourceType})`
        );
      }
    });

    // If no real domain scores found, create meaningful fallback data
    if (!hasRealDomainScores) {
      logger.warn(
        `No domain scores found for child ${childId}, creating fallback data`
      );

      // Create basic fallback based on available assessments
      if (allAssessments.length > 0) {
        const latestAssessment = allAssessments[0];
        const fallbackDomains = getFallbackDomains(
          latestAssessment.assessmentType,
          latestAssessment.sourceType
        );

        latestScores = fallbackDomains;
        timelines.push({
          date: new Date(
            latestAssessment.completedAt || latestAssessment.createdAt
          )
            .toISOString()
            .split("T")[0],
          scores: fallbackDomains,
          assessmentType: latestAssessment.assessmentType,
          assessmentCategory: latestAssessment.assessmentCategory,
          sourceType: latestAssessment.sourceType,
        });
      }
    }

    // Sort timelines chronologically for proper graph display
    timelines.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    logger.info(
      `Child progress data retrieved for child ${childId}, filter: ${
        assessmentType || "all"
      }, assessments: ${
        allAssessments.length
      }, hasRealDomainScores: ${hasRealDomainScores}, timelines: ${
        timelines.length
      }`
    );

    // Final validation of data structure
    const hasValidScores =
      Object.keys(latestScores).length > 0 &&
      Object.values(latestScores).some(
        (score) => score !== null && score !== undefined && score >= 0
      );

    logger.info(
      `Final latestScores:`,
      latestScores,
      `hasValidScores: ${hasValidScores}`
    );
    logger.info(`Timeline data for graph:`, timelines);

    res.json({
      success: true,
      data: {
        timelines: timelines,
        domains: latestScores,
        currentScores: latestScores,
        childName: formatChildName(child.firstName, child.lastName),
        totalAssessments: allAssessments.length,
        assessmentBreakdown: assessmentBreakdown,
        hasDetailedScores: hasRealDomainScores,
        activeFilter: assessmentType || "all",
        latestAssessmentDate:
          allAssessments.length > 0
            ? allAssessments[0].completedAt || allAssessments[0].createdAt
            : null,
        hasValidScores: hasValidScores,
        scoreExplanation: {
          note: "Progress scores show PERFORMANCE (0-100): 100 = excellent, 0 = needs improvement",
          riskToPerformanceConversion:
            "Text assessment risk scores (1-10) are inverted: Risk 1 → Performance 100, Risk 10 → Performance 0",
          interpretation:
            "High performance scores (90-100) indicate LOW RISK, which is GOOD!",
        },
      },
    });
  } catch (error) {
    logger.error("Get child progress error:", error);
    next(new ApiError(500, "Could not fetch child progress data"));
  }
};

// Helper function to generate fallback domain scores
const getFallbackDomains = (assessmentType, sourceType) => {
  const baseScore = 65; // Neutral score

  if (sourceType === "image") {
    return {
      "Social Communication": baseScore,
      "Behavioral Regulation": baseScore,
      "Sensory Processing": baseScore,
      Communication: baseScore,
    };
  } else {
    // Text-based assessment fallback
    if (assessmentType === "autism" || assessmentType === "asd") {
      return {
        "Social Communication": baseScore,
        "Restricted Interests": baseScore,
        "Sensory Processing": baseScore,
      };
    } else if (assessmentType === "adhd") {
      return {
        Attention: baseScore,
        Hyperactivity: baseScore,
        Impulsivity: baseScore,
      };
    } else if (assessmentType === "dyslexia") {
      return {
        "Reading Fluency": baseScore,
        "Phonological Awareness": baseScore,
        "Written Expression": baseScore,
      };
    } else {
      return {
        "Cognitive Development": baseScore,
        "Social Communication": baseScore,
        Attention: baseScore,
      };
    }
  }
};

/**
 * Get progress data for all children
 * @route GET /api/dashboard/progress-overview
 * @access Private
 */
const getProgressOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { assessmentType } = req.query;

    // Get all children for this user
    const children = await ChildProfile.find({
      parent: userId,
      isDeleted: false,
    }).select("firstName lastName");

    if (children.length === 0) {
      return res.json({
        success: true,
        data: {
          children: [],
          message: "No children profiles found",
        },
      });
    }

    // Helper function to generate domain scores based on assessment type and risk score
    const generateDomainScores = (assessmentType, riskScore) => {
      // Fix: Don't invert the risk score - higher risk should mean higher score
      // Convert risk score (1-10) to percentage (10-100)
      const baseScore = Math.max(10, Math.min(100, riskScore * 10));

      // Different patterns based on assessment type
      const patterns = {
        ADHD: {
          attention: 0, // Lower for ADHD
          memory: 5, // Slightly affected
          processing: -3, // Processing speed affected
          executive: -5, // Executive function most affected
          sensory: 2, // Less affected
        },
        Anxiety: {
          attention: -3, // Anxiety affects attention
          memory: -2, // Working memory affected
          processing: -1, // Slightly slower processing
          executive: -4, // Executive function affected
          sensory: 3, // Sensory may be heightened
        },
        Autism: {
          attention: 2, // May have focused attention
          memory: 3, // Often good memory
          processing: -2, // Processing differences
          executive: -6, // Executive function challenges
          sensory: -4, // Sensory processing differences
        },
        Depression: {
          attention: -4, // Concentration affected
          memory: -3, // Memory affected
          processing: -5, // Slower processing
          executive: -3, // Executive function affected
          sensory: 0, // Less impact on sensory
        },
        Dyslexia: {
          attention: -2, // Slightly affected
          memory: -1, // Working memory can be affected
          processing: -4, // Language processing affected
          executive: -3, // Executive function affected
          sensory: 1, // Less impact on sensory
        },
        General: {
          attention: 0,
          memory: 0,
          processing: 0,
          executive: 0,
          sensory: 0,
        },
      };

      const pattern = patterns[assessmentType] || patterns["General"];

      return {
        attention: Math.max(0, Math.min(100, baseScore + pattern.attention)),
        memory: Math.max(0, Math.min(100, baseScore + pattern.memory)),
        processing: Math.max(0, Math.min(100, baseScore + pattern.processing)),
        executive: Math.max(0, Math.min(100, baseScore + pattern.executive)),
        sensory: Math.max(0, Math.min(100, baseScore + pattern.sensory)),
      };
    };

    const progressData = [];

    // Get progress data for each child
    for (const child of children) {
      let regularAssessments = [];
      let imageAssessments = [];

      // Build queries based on filter type
      if (
        assessmentType === "text" ||
        assessmentType === "all" ||
        !assessmentType
      ) {
        // Get latest regular assessment for this child
        let regularFilter = {
          userId: userId,
          childId: child._id,
          status: "completed",
          results: { $exists: true, $ne: null },
        };

        if (assessmentType === "text") {
          regularFilter.assessmentType = {
            $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
          };
        }

        regularAssessments = await Assessment.find(regularFilter)
          .sort({ completedAt: -1 })
          .limit(1)
          .select("results assessmentType");
      }

      if (
        assessmentType === "image" ||
        assessmentType === "all" ||
        !assessmentType
      ) {
        // Get latest image assessment for this child
        imageAssessments = await ImageAssessmentSession.find({
          userId: userId,
          childId: child._id,
          status: "completed",
          results: { $exists: true, $ne: null },
        })
          .sort({ completedAt: -1 })
          .limit(1)
          .select("results assessmentType");
      }

      let latestScores = {};
      let overallScore = 0;

      // Use the most recent assessment (regular or image)
      const allChildAssessments = [
        ...regularAssessments,
        ...imageAssessments,
      ].sort(
        (a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
      );

      if (allChildAssessments.length > 0) {
        const assessment = allChildAssessments[0];

        if (
          assessment.results.domainScores &&
          Array.isArray(assessment.results.domainScores)
        ) {
          // Convert array of domain objects to simple object
          assessment.results.domainScores.forEach((domainObj) => {
            if (domainObj.domain && domainObj.score) {
              const normalizedDomain = normalizeDomainName(domainObj.domain);
              let score = domainObj.score;

              // Handle different score scales properly
              if (score <= 10 && score >= 1) {
                // Text assessment risk scores (1-10) - invert to performance scores (0-100)
                score = Math.round((11 - score) * 10);
              } else if (score > 10) {
                // Already in 0-100 range (image assessments)
                score = Math.round(score);
              }

              latestScores[normalizedDomain] = Math.max(
                0,
                Math.min(100, score)
              );
            }
          });

          // FIXED: Remove restrictive cognitive domain validation
          // Accept any valid domain scores instead of requiring specific domains
          const hasAnyValidDomains = Object.keys(latestScores).some(
            (domain) => {
              const score = latestScores[domain];
              return (
                score !== null &&
                score !== undefined &&
                score >= 0 &&
                score <= 100
              );
            }
          );

          if (!hasAnyValidDomains) {
            latestScores = {}; // Only clear if truly no valid scores
          }
        } else if (
          assessment.results.scores &&
          typeof assessment.results.scores === "object"
        ) {
          Object.keys(assessment.results.scores).forEach((domain) => {
            const normalizedDomain = normalizeDomainName(domain);
            let score = assessment.results.scores[domain];

            // Handle different score scales properly
            if (score <= 10 && score >= 1) {
              // Text assessment risk scores - invert to performance scores
              score = Math.round((11 - score) * 10);
            } else if (score > 10) {
              // Already in 0-100 range
              score = Math.round(score);
            }

            latestScores[normalizedDomain] = Math.max(0, Math.min(100, score));
          });

          // FIXED: Remove restrictive cognitive domain validation
          // Accept any valid domain scores instead of requiring specific domains
          const hasAnyValidDomains = Object.keys(latestScores).some(
            (domain) => {
              const score = latestScores[domain];
              return (
                score !== null &&
                score !== undefined &&
                score >= 0 &&
                score <= 100
              );
            }
          );

          if (!hasAnyValidDomains) {
            latestScores = {}; // Only clear if truly no valid scores
          }
        } else {
          // No real domain scores available - leave empty
          latestScores = {};
        }

        // Ensure scores are in 0-100 range
        Object.keys(latestScores).forEach((domain) => {
          latestScores[domain] = Math.max(
            0,
            Math.min(100, latestScores[domain])
          );
        });

        // Calculate overall score
        const scores = Object.values(latestScores);
        overallScore =
          scores.length > 0
            ? Math.round(
                scores.reduce((sum, score) => sum + score, 0) / scores.length
              )
            : 0;
      }

      progressData.push({
        childId: child._id,
        childName: formatChildName(child.firstName, child.lastName),
        latestScores,
        overallScore,
        hasData: allChildAssessments.length > 0,
        hasDetailedScores: Object.keys(latestScores).length > 0,
      });
    }

    logger.info(
      `Progress overview retrieved for user: ${req.user.email}, filter: ${
        assessmentType || "all"
      } - ${children.length} children`
    );

    res.json({
      success: true,
      data: {
        children: progressData,
        totalChildren: children.length,
      },
    });
  } catch (error) {
    logger.error("Get progress overview error:", error);
    next(new ApiError(500, "Could not fetch progress overview"));
  }
};

/**
 * Get all reports for current user
 * @route GET /api/dashboard/reports
 * @access Private
 */
const getAllUserReports = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, childId, assessmentType, page = 1, limit = 20 } = req.query;

    logger.info(
      `Fetching reports for user: ${req.user.email}, filter: ${
        assessmentType || "all"
      }`
    );

    let regularAssessments = [];
    let imageAssessments = [];

    // Build base filters
    const baseFilter = {
      userId: userId,
      results: { $exists: true, $ne: null },
    };

    // Handle status filtering
    if (status && status !== "all") {
      baseFilter.status = status;
    } else {
      baseFilter.status = "completed";
    }

    if (childId && childId !== "all") {
      baseFilter.childId = childId;
    }

    // Query regular assessments
    if (
      assessmentType === "text" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      let regularFilter = { ...baseFilter };

      if (assessmentType === "text") {
        regularFilter.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
      }

      logger.info(`Querying regular assessments with filter:`, regularFilter);

      regularAssessments = await Assessment.find(regularFilter)
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender avatar",
        })
        .populate({
          path: "intakeId",
          select: "childName age gender primaryConcerns",
        })
        .select(
          "sessionId assessmentType status startedAt completedAt results childId intakeId"
        )
        .sort({ completedAt: -1 });

      logger.info(`Found ${regularAssessments.length} regular assessments`);
    }

    // Query image assessments
    if (
      assessmentType === "image" ||
      assessmentType === "all" ||
      !assessmentType
    ) {
      let imageFilter = { ...baseFilter };

      logger.info(`Querying image assessments with filter:`, imageFilter);

      imageAssessments = await ImageAssessmentSession.find(imageFilter)
        .populate({
          path: "childId",
          select: "firstName lastName dateOfBirth gender avatar",
        })
        .select(
          "sessionId assessmentType status startedAt completedAt results childId metadata"
        )
        .sort({ completedAt: -1 });

      logger.info(`Found ${imageAssessments.length} image assessments`);

      // ENHANCED: Fix missing child names by re-populating from child profiles
      for (let assessment of imageAssessments) {
        if (assessment.childId) {
          const childProfile = assessment.childId;
          let childName = null;

          // Try to get name from populated child profile
          if (childProfile?.firstName || childProfile?.lastName) {
            const firstName = childProfile.firstName || "";
            const lastName =
              childProfile.lastName && childProfile.lastName !== "undefined"
                ? childProfile.lastName
                : "";
            childName = `${firstName} ${lastName}`.trim() || firstName || null;
          }

          // If we have a valid child name, ensure it's in metadata
          if (
            childName &&
            childName !== "Child" &&
            childName !== "" &&
            !childName.includes("undefined")
          ) {
            if (!assessment.metadata) assessment.metadata = {};

            // Only update if current metadata is missing or invalid
            if (
              !assessment.metadata.childName ||
              assessment.metadata.childName === "Child Assessment" ||
              assessment.metadata.childName === "undefined undefined" ||
              assessment.metadata.childName.includes("undefined") ||
              assessment.metadata.childName === "null null"
            ) {
              assessment.metadata.childName = childName;

              // Save the updated assessment for future reference
              try {
                await assessment.save();
                logger.info(
                  `Updated child name for assessment ${assessment.sessionId}: ${childName}`
                );
              } catch (saveError) {
                console.warn(
                  `Could not save updated child name for assessment ${assessment.sessionId}:`,
                  saveError.message
                );
              }
            }
          }
        }
      }

      // Debug log first few image assessments
      if (imageAssessments.length > 0) {
        imageAssessments.slice(0, 3).forEach((assessment, index) => {
          logger.info(`Image assessment ${index + 1}:`, {
            sessionId: assessment.sessionId,
            assessmentType: assessment.assessmentType,
            childId: assessment.childId?._id,
            childName: assessment.childId
              ? formatChildName(
                  assessment.childId.firstName,
                  assessment.childId.lastName
                )
              : assessment.metadata?.childName,
            hasResults: !!assessment.results,
            completedAt: assessment.completedAt,
          });
        });
      }
    }

    // Transform and combine using the transformer
    const unifiedResponse = assessmentTransformer.createUnifiedResponse(
      regularAssessments,
      imageAssessments,
      assessmentType
    );

    logger.info(
      `Unified response contains ${unifiedResponse.totalCount} assessments (${unifiedResponse.typeBreakdown.regular} regular, ${unifiedResponse.typeBreakdown.image} image)`
    );

    // Apply pagination to the unified results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + Number(limit);
    const paginatedAssessments = unifiedResponse.assessments.slice(
      startIndex,
      endIndex
    );

    // Format reports with unified structure
    const reports = paginatedAssessments.map((assessment) => {
      const report = {
        id: assessment.sessionId,
        reportId: assessment.id,
        childId: assessment.childId,
        childName: assessment.childName,
        assessmentType: assessment.assessmentType || "General Assessment",
        assessmentCategory: assessment.assessmentCategory,
        sourceType: assessment.sourceType,
        assessmentDate: assessment.completedAt || assessment.startedAt,
        status: assessment.status,
        summary: assessment.results?.summary || "",
        riskScore: assessment.results?.disorderRisk?.score || null,
        riskLevel: assessment.results?.disorderRisk?.interpretation || null,
        domainScores: assessment.results?.domainScores || [],
        recommendations: assessment.results?.recommendations || [],
        accuracyRate: assessment.results?.accuracyRate || null,
        averageResponseTime: assessment.results?.averageResponseTime || null,
      };

      // Log each report for debugging
      logger.debug(`Report ${report.id}:`, {
        childName: report.childName,
        assessmentType: report.assessmentType,
        sourceType: report.sourceType,
        hasResults: !!assessment.results,
      });

      return report;
    });

    logger.info(
      `Retrieved ${reports.length} reports for user: ${req.user.email} (${unifiedResponse.typeBreakdown.regular} regular, ${unifiedResponse.typeBreakdown.image} image)`
    );

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: unifiedResponse.totalCount,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(unifiedResponse.totalCount / limit),
        },
        typeBreakdown: unifiedResponse.typeBreakdown,
        debug: {
          regularCount: regularAssessments.length,
          imageCount: imageAssessments.length,
          unifiedCount: unifiedResponse.totalCount,
          filterApplied: assessmentType || "all",
        },
      },
    });
  } catch (error) {
    logger.error("Get all user reports error:", error);
    next(new ApiError(500, "Could not fetch reports"));
  }
};

/**
 * Get reports for a specific child
 * @route GET /api/dashboard/reports/child/:childId
 * @access Private
 */
const getChildReports = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { childId } = req.params;
    const { page = 1, limit = 10, assessmentType } = req.query;

    logger.info(
      `Fetching reports for child: ${childId}, user: ${req.user.email}`
    );

    // Verify child belongs to user
    const child = await ChildProfile.findOne({
      _id: childId,
      parent: userId,
      isDeleted: false,
    });

    if (!child) {
      return next(new ApiError(404, "Child not found"));
    }

    // Build filter
    const filter = {
      userId: userId,
      childId: childId,
      status: "completed",
      results: { $exists: true, $ne: null },
    };

    // Add assessment type filter if provided
    if (assessmentType && assessmentType !== "all") {
      // Map filter types to assessment types
      if (assessmentType === "text") {
        filter.assessmentType = {
          $regex: /^(adhd|asd|autism|dyslexia|general)$/i,
        };
      } else if (assessmentType === "image") {
        // For image assessments, we'll need to also query ImageAssessmentSession
        // For now, we'll handle text assessments only
        filter.assessmentType = { $in: [] }; // This will return no results for image filter
      } else if (assessmentType === "game") {
        // For game assessments, we'll need specific game types
        filter.assessmentType = { $in: ["game"] }; // Adjust based on your game assessment types
      } else {
        filter.assessmentType = assessmentType;
      }
    }

    // Get assessments from regular assessments and image assessments
    let allAssessments = [];
    let total = 0;

    // Handle different assessment types
    if (
      !assessmentType ||
      assessmentType === "all" ||
      assessmentType === "text"
    ) {
      const textAssessments = await Assessment.find(filter)
        .select("sessionId assessmentType status startedAt completedAt results")
        .sort({ completedAt: -1 });

      allAssessments = [...allAssessments, ...textAssessments];
    }

    if (
      !assessmentType ||
      assessmentType === "all" ||
      assessmentType === "image"
    ) {
      // Query image assessments
      const imageFilter = {
        userId: userId,
        childId: childId,
        status: "completed",
        results: { $exists: true, $ne: null },
      };

      const imageAssessments = await ImageAssessmentSession.find(imageFilter)
        .select(
          "sessionId assessmentType status startedAt completedAt results metadata"
        )
        .sort({ completedAt: -1 });

      allAssessments = [...allAssessments, ...imageAssessments];
    }

    // Sort all assessments by completion date
    allAssessments.sort(
      (a, b) =>
        new Date(b.completedAt || b.startedAt) -
        new Date(a.completedAt || a.startedAt)
    );

    // Apply pagination
    total = allAssessments.length;
    const assessments = allAssessments.slice((page - 1) * limit, page * limit);

    // Format reports
    const reports = assessments.map((assessment) => {
      // Calculate child age safely
      let childAge = null;
      try {
        if (child.dateOfBirth) {
          childAge = Math.floor(
            (Date.now() - new Date(child.dateOfBirth)) /
              (365.25 * 24 * 60 * 60 * 1000)
          );
        }
      } catch (ageError) {
        logger.warn(`Error calculating age for child ${childId}:`, ageError);
      }

      return {
        id: assessment.sessionId,
        reportId: assessment._id,
        childId: childId,
        childName: formatChildName(child.firstName, child.lastName),
        childAge,
        childGender: child.gender,
        assessmentType: assessment.assessmentType || "General Assessment",
        assessmentDate: assessment.completedAt || assessment.startedAt,
        status: "completed",
        summary: assessment.results?.summary || "",
        riskScore: assessment.results?.disorderRisk?.score || null,
        riskLevel: assessment.results?.disorderRisk?.interpretation || null,
        domainScores: assessment.results?.domainScores || [],
        recommendations: assessment.results?.recommendations || [],
      };
    });

    logger.info(
      `Retrieved ${reports.length} reports for child: ${childId}, user: ${req.user.email}`
    );

    res.json({
      success: true,
      data: {
        reports,
        childInfo: {
          id: child._id,
          name: formatChildName(child.firstName, child.lastName),
          dateOfBirth: child.dateOfBirth,
          age: child.dateOfBirth
            ? Math.floor(
                (Date.now() - new Date(child.dateOfBirth)) /
                  (365.25 * 24 * 60 * 60 * 1000)
              )
            : null,
          gender: child.gender,
        },
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get child reports error:", error);
    next(new ApiError(500, "Could not fetch child reports"));
  }
};

/**
 * Get a specific report by ID
 * @route GET /api/dashboard/reports/:reportId
 * @access Private
 */
const getReportById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { reportId } = req.params;

    logger.info(
      `🔍 [VIEW REPORT] Fetching report: ${reportId} for user: ${req.user.email}`
    );

    // Build query to avoid ObjectId casting errors
    let query = { userId: userId };

    // Check if reportId looks like an ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(reportId);
    logger.info(
      `🔍 [VIEW REPORT] reportId format check - isObjectId: ${isObjectId}, reportId: ${reportId}`
    );

    if (isObjectId) {
      // If it looks like an ObjectId, search both sessionId and _id
      query.$or = [{ sessionId: reportId }, { _id: reportId }];
    } else {
      // If it doesn't look like an ObjectId, only search sessionId
      query.sessionId = reportId;
    }

    logger.info(
      `🔍 [VIEW REPORT] Searching regular assessments with query:`,
      query
    );

    // First, try to find a regular assessment
    let assessment = await Assessment.findOne(query)
      .populate({
        path: "childId",
        select: "firstName lastName dateOfBirth gender",
      })
      .populate({
        path: "intakeId",
        select: "childName age gender primaryConcerns",
      });

    let isImageAssessment = false;

    logger.info(`🔍 [VIEW REPORT] Regular assessment found: ${!!assessment}`);

    // If not found in regular assessments, try image assessments
    if (!assessment) {
      const imageQuery = { userId: userId };

      if (isObjectId) {
        imageQuery.$or = [{ sessionId: reportId }, { _id: reportId }];
      } else {
        imageQuery.sessionId = reportId;
      }

      logger.info(
        `🔍 [VIEW REPORT] Searching image assessments with query:`,
        imageQuery
      );

      assessment = await ImageAssessmentSession.findOne(imageQuery).populate({
        path: "childId",
        select: "firstName lastName dateOfBirth gender",
      });

      if (assessment) {
        isImageAssessment = true;
        logger.info(`🔍 [VIEW REPORT] Image assessment found!`, {
          sessionId: assessment.sessionId,
          assessmentType: assessment.assessmentType,
          hasResults: !!assessment.results,
          hasAIReport: !!assessment.aiReport,
          status: assessment.status,
          riskScore: assessment.results?.riskScore,
          summaryLength: assessment.results?.summary?.length || 0,
          interpretationLength: assessment.results?.interpretation?.length || 0,
          recommendationsCount:
            assessment.results?.recommendations?.length || 0,
          responsesCount: assessment.responses?.length || 0,
        });
      } else {
        logger.warn(
          `🔍 [VIEW REPORT] No image assessment found for reportId: ${reportId}`
        );
      }
    }

    if (!assessment) {
      logger.error(`🔍 [VIEW REPORT] Report not found anywhere: ${reportId}`);
      return next(new ApiError(404, "Report not found"));
    }

    // Check if assessment has results (for completed assessments)
    if (
      assessment.status === "completed" &&
      (!assessment.results ||
        (!assessment.results.summary && !assessment.results.interpretation))
    ) {
      logger.error(
        `🔍 [VIEW REPORT] Report data not available for ${reportId} - no results/summary/interpretation`
      );
      return next(new ApiError(404, "Report data not available"));
    }

    const childName = assessment.childId
      ? formatChildName(
          assessment.childId.firstName,
          assessment.childId.lastName
        )
      : isImageAssessment
      ? assessment.metadata?.childName || "Unknown Child"
      : assessment.intakeId?.childName || "Unknown Child";

    logger.info(`🔍 [VIEW REPORT] Child name resolved: ${childName}`);

    // Calculate child age safely
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
      logger.warn(`Error calculating age for report ${reportId}:`, ageError);
    }

    logger.info(`🔍 [VIEW REPORT] Child age resolved: ${childAge}`);

    // Format report based on assessment type
    let report;

    if (isImageAssessment) {
      logger.info(`🔍 [VIEW REPORT] Formatting IMAGE assessment report`);

      // Get the full AI analysis from results if available
      const fullAIAnalysis =
        assessment.results?.fullAIAnalysis || assessment.aiReport?.analysis;

      // Format image assessment report with detailed logging - Use comprehensive AI analysis
      const summary =
        fullAIAnalysis?.summary ||
        fullAIAnalysis?.clinicalSummary ||
        assessment.results?.summary ||
        assessment.results?.interpretation ||
        "Assessment completed successfully.";

      const interpretation =
        fullAIAnalysis?.detailedInterpretation ||
        fullAIAnalysis?.interpretation ||
        assessment.results?.interpretation ||
        "Professional evaluation recommended for comprehensive assessment.";

      const riskScore =
        fullAIAnalysis?.riskScore || assessment.results?.riskScore || 5;

      const riskLevel =
        fullAIAnalysis?.riskLevel ||
        assessment.results?.riskLevel ||
        "moderate";

      // Get comprehensive recommendations
      const recommendations = fullAIAnalysis?.clinicalRecommendations ||
        fullAIAnalysis?.recommendations ||
        assessment.results?.recommendations || [
          "Professional evaluation recommended for comprehensive assessment",
        ];

      // Get detailed analysis sections
      const keyFindings = fullAIAnalysis?.keyFindings || [];
      const strengths =
        fullAIAnalysis?.developmentalStrengths ||
        fullAIAnalysis?.strengths ||
        [];
      const concerns =
        fullAIAnalysis?.areasOfConcern || fullAIAnalysis?.concerns || [];
      const nextSteps = fullAIAnalysis?.nextSteps || [];
      const parentGuidance = fullAIAnalysis?.parentGuidance || [];
      const monitoringAreas = fullAIAnalysis?.monitoringAreas || [];
      const positiveIndicators =
        fullAIAnalysis?.positivePrognosticIndicators ||
        fullAIAnalysis?.positiveIndicators ||
        [];
      const clinicalNotes = fullAIAnalysis?.clinicalNotes;
      const followUpSchedule = fullAIAnalysis?.followUpSchedule;

      logger.info(`🔍 [VIEW REPORT] Image assessment AI analysis details:`, {
        hasFullAIAnalysis: !!fullAIAnalysis,
        summaryLength: summary?.length || 0,
        interpretationLength: interpretation?.length || 0,
        riskScore,
        riskLevel,
        recommendationsCount: recommendations?.length || 0,
        keyFindingsCount: keyFindings?.length || 0,
        strengthsCount: strengths?.length || 0,
        concernsCount: concerns?.length || 0,
        hasFollowUpSchedule: !!followUpSchedule,
      });

      report = {
        id: assessment.sessionId,
        reportId: assessment._id,
        childId: assessment.childId?._id,
        childName,
        childAge,
        childGender: assessment.childId?.gender,
        assessmentType: assessment.assessmentType || "Image Assessment",
        assessmentCategory: "image",
        sourceType: "image",
        assessmentDate: assessment.completedAt || assessment.startedAt,
        status:
          assessment.status === "completed" ? "completed" : assessment.status,
        summary,
        interpretation,
        riskScore,
        riskLevel,
        domainScores: assessment.results?.domainScores || [],
        recommendations,
        accuracyRate: assessment.results?.accuracyRate || null,
        averageResponseTime: assessment.results?.averageResponseTime || null,
        totalQuestions: assessment.results?.totalQuestions || 0,
        correctAnswers: assessment.results?.correctAnswers || 0,
        questionsAndResponses: {
          questions: [], // Image assessments don't have traditional questions
          responses: assessment.responses || [],
        },
        // Enhanced AI analysis sections
        aiAnalysis: {
          keyFindings,
          strengths,
          concerns,
          nextSteps,
          parentGuidance,
          monitoringAreas,
          positiveIndicators,
          clinicalNotes,
          followUpSchedule,
          confidence: fullAIAnalysis?.confidence,
          professionalReferral: fullAIAnalysis?.professionalReferral,
        },
        hasEnhancedAI: !!fullAIAnalysis,
        isFallback: assessment.aiReport?.fallback || false,
      };

      logger.info(`🔍 [VIEW REPORT] Final IMAGE report object:`, {
        id: report.id,
        childName: report.childName,
        assessmentType: report.assessmentType,
        hasSummary: !!report.summary,
        summaryLength: report.summary?.length || 0,
        hasInterpretation: !!report.interpretation,
        interpretationLength: report.interpretation?.length || 0,
        riskScore: report.riskScore,
        hasEnhancedAI: report.hasEnhancedAI,
        isFallback: report.isFallback,
        recommendationsCount: report.recommendations?.length || 0,
        aiAnalysisKeyFindingsCount: report.aiAnalysis?.keyFindings?.length || 0,
        aiAnalysisStrengthsCount: report.aiAnalysis?.strengths?.length || 0,
      });
    } else {
      logger.info(`🔍 [VIEW REPORT] Formatting REGULAR assessment report`);

      // Format regular assessment report
      report = {
        id: assessment.sessionId,
        reportId: assessment._id,
        childId: assessment.childId?._id,
        childName,
        childAge,
        childGender: assessment.childId?.gender || assessment.intakeId?.gender,
        assessmentType: assessment.assessmentType || "General Assessment",
        assessmentCategory: "text",
        sourceType: "text",
        assessmentDate: assessment.completedAt || assessment.startedAt,
        status:
          assessment.status === "completed" ? "completed" : assessment.status,
        summary: assessment.results?.summary || "",
        riskScore: assessment.results?.disorderRisk?.score || null,
        riskLevel: assessment.results?.disorderRisk?.interpretation || null,
        domainScores: assessment.results?.domainScores || [],
        recommendations: assessment.results?.recommendations || [],
        questionsAndResponses: {
          questions: assessment.questions || [],
          responses: assessment.responses || [],
        },
      };
    }

    logger.info(
      `✅ [VIEW REPORT] Successfully retrieved ${
        isImageAssessment ? "image" : "text"
      } assessment report: ${reportId} for user: ${req.user.email}`
    );

    res.json({
      success: true,
      data: {
        report,
      },
    });
  } catch (error) {
    logger.error("🚨 [VIEW REPORT] Get report by ID error:", error);
    next(new ApiError(500, "Could not fetch report"));
  }
};

/**
 * Download a report as PDF
 * @route GET /api/dashboard/reports/:reportId/download
 * @access Private
 */
const downloadReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { reportId } = req.params;

    logger.info(`Downloading report: ${reportId} for user: ${req.user.email}`);

    // Build query to avoid ObjectId casting errors
    let query = { userId: userId };

    // Check if reportId looks like an ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(reportId);

    if (isObjectId) {
      // If it looks like an ObjectId, search both sessionId and _id
      query.$or = [{ sessionId: reportId }, { _id: reportId }];
    } else {
      // If it doesn't look like an ObjectId, only search sessionId
      query.sessionId = reportId;
    }

    // First, try to find a regular assessment
    let assessment = await Assessment.findOne(query)
      .populate({
        path: "childId",
        select: "firstName lastName dateOfBirth gender",
      })
      .populate({
        path: "intakeId",
        select: "childName age gender primaryConcerns",
      });

    let isImageAssessment = false;

    // If not found in regular assessments, try image assessments
    if (!assessment) {
      const imageQuery = { userId: userId };

      if (isObjectId) {
        imageQuery.$or = [{ sessionId: reportId }, { _id: reportId }];
      } else {
        imageQuery.sessionId = reportId;
      }

      assessment = await ImageAssessmentSession.findOne(imageQuery).populate({
        path: "childId",
        select: "firstName lastName dateOfBirth gender",
      });

      if (assessment) {
        isImageAssessment = true;
      }
    }

    if (!assessment) {
      return next(new ApiError(404, "Report not found"));
    }

    // Check if assessment is completed
    if (assessment.status !== "completed" || !assessment.results) {
      return next(new ApiError(400, "Assessment not completed yet"));
    }

    const childName = assessment.childId
      ? formatChildName(
          assessment.childId.firstName,
          assessment.childId.lastName
        )
      : isImageAssessment
      ? formatChildName(assessment.metadata?.childName) || "Child Assessment"
      : formatChildName(assessment.intakeId?.childName) || "Child Assessment";

    // Calculate child age safely
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

    // Helper function to get risk level text
    const getRiskLevelText = (score) => {
      if (!score || isNaN(score)) return "Assessment Complete";
      if (score <= 3) return "Low Risk";
      if (score <= 7) return "Moderate Risk";
      return "High Risk";
    };

    // Prepare report data for PDF generation based on assessment type
    let reportData;

    if (isImageAssessment) {
      logger.info(`Image assessment data found:`, {
        sessionId: assessment.sessionId,
        assessmentType: assessment.assessmentType,
        hasResults: !!assessment.results,
        hasAIReport: !!assessment.aiReport,
        hasFullAIAnalysis: !!assessment.results?.fullAIAnalysis,
        riskScore: assessment.results?.riskScore,
        summaryLength: assessment.results?.summary?.length || 0,
        recommendationsCount: assessment.results?.recommendations?.length || 0,
        responsesCount: assessment.responses?.length || 0,
      });

      // Get the comprehensive AI analysis
      const fullAIAnalysis =
        assessment.results?.fullAIAnalysis || assessment.aiReport?.analysis;

      // Prepare image assessment report data with comprehensive AI analysis
      reportData = {
        id: assessment.sessionId,
        childName,
        childAge,
        childGender: assessment.childId?.gender,
        assessmentType: assessment.assessmentType || "Image Assessment",
        assessmentCategory: "image",
        sourceType: "image",
        assessmentDate: assessment.completedAt || assessment.startedAt,
        summary:
          fullAIAnalysis?.summary ||
          fullAIAnalysis?.clinicalSummary ||
          assessment.results?.summary ||
          assessment.results?.interpretation ||
          "Assessment completed successfully.",
        interpretation:
          fullAIAnalysis?.detailedInterpretation ||
          fullAIAnalysis?.interpretation ||
          assessment.results?.interpretation ||
          "Professional evaluation recommended for comprehensive assessment.",
        riskScore:
          fullAIAnalysis?.riskScore || assessment.results?.riskScore || 5,
        riskLevel: fullAIAnalysis?.riskScore
          ? getRiskLevelText(fullAIAnalysis.riskScore)
          : fullAIAnalysis?.riskLevel ||
            assessment.results?.riskLevel ||
            "Assessment Complete",
        domainScores: assessment.results?.domainScores || [],
        recommendations: fullAIAnalysis?.clinicalRecommendations ||
          fullAIAnalysis?.recommendations ||
          assessment.results?.recommendations || [
            "Professional evaluation recommended for comprehensive assessment",
          ],
        accuracyRate: assessment.results?.accuracyRate || null,
        averageResponseTime: assessment.results?.averageResponseTime || null,
        totalQuestions: assessment.results?.totalQuestions || 0,
        correctAnswers: assessment.results?.correctAnswers || 0,
        // Additional image assessment specific data
        responses: assessment.responses || [],
        aiReport: assessment.aiReport || null,
        // Enhanced AI analysis sections for comprehensive PDF
        aiAnalysis: {
          keyFindings: fullAIAnalysis?.keyFindings || [],
          strengths:
            fullAIAnalysis?.developmentalStrengths ||
            fullAIAnalysis?.strengths ||
            [],
          concerns:
            fullAIAnalysis?.areasOfConcern || fullAIAnalysis?.concerns || [],
          nextSteps: fullAIAnalysis?.nextSteps || [],
          parentGuidance: fullAIAnalysis?.parentGuidance || [],
          monitoringAreas: fullAIAnalysis?.monitoringAreas || [],
          positiveIndicators:
            fullAIAnalysis?.positivePrognosticIndicators ||
            fullAIAnalysis?.positiveIndicators ||
            [],
          clinicalNotes: fullAIAnalysis?.clinicalNotes,
          followUpSchedule: fullAIAnalysis?.followUpSchedule,
          confidence: fullAIAnalysis?.confidence,
          professionalReferral: fullAIAnalysis?.professionalReferral,
        },
        hasEnhancedAI: !!fullAIAnalysis,
        isFallback: assessment.aiReport?.fallback || false,
      };
    } else {
      // Prepare regular assessment report data
      reportData = {
        id: assessment.sessionId,
        childName,
        childAge,
        childGender: assessment.childId?.gender || assessment.intakeId?.gender,
        assessmentType: assessment.assessmentType || "General Assessment",
        assessmentCategory: "text",
        sourceType: "text",
        assessmentDate: assessment.completedAt || assessment.startedAt,
        summary: assessment.results?.summary || "",
        riskScore: assessment.results?.disorderRisk?.score || null,
        riskLevel: assessment.results?.disorderRisk?.score
          ? getRiskLevelText(assessment.results.disorderRisk.score)
          : "Assessment Complete",
        domainScores: assessment.results?.domainScores || [],
        recommendations: assessment.results?.recommendations || [],
        responses: assessment.responses || [],
        questions: assessment.questions || [],
      };
    }

    logger.info(
      `Generating PDF for ${
        isImageAssessment ? "image" : "text"
      } assessment: ${reportId}`
    );

    // Generate the PDF buffer using the universal PDF service
    const pdfBuffer = await universalPDFService.generatePDF(
      "assessment-report",
      reportData
    );

    // Set response data
    const contentType = "application/pdf";
    const fileName = `${childName.replace(/\s+/g, "-")}-Assessment-Report-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    const buffer = pdfBuffer;

    logger.info(
      `PDF generated successfully for report: ${reportId}, size: ${buffer.length} bytes`
    );

    // Set response headers based on content type
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    logger.error("Download report error:", error);
    next(new ApiError(500, "Could not generate report PDF"));
  }
};

/**
 * Delete a report
 * @route DELETE /api/dashboard/reports/:reportId
 * @access Private
 */
const deleteReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { reportId } = req.params;

    logger.info(`Deleting report: ${reportId} for user: ${req.user.email}`);

    // Build query to avoid ObjectId casting errors
    let query = { userId: userId };

    // Check if reportId looks like an ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(reportId);

    if (isObjectId) {
      // If it looks like an ObjectId, search both sessionId and _id
      query.$or = [{ sessionId: reportId }, { _id: reportId }];
    } else {
      // If it doesn't look like an ObjectId, only search sessionId
      query.sessionId = reportId;
    }

    // Find assessment
    const assessment = await Assessment.findOne(query);

    if (!assessment) {
      return next(new ApiError(404, "Report not found"));
    }

    // Soft delete the assessment
    assessment.isDeleted = true;
    assessment.deletedAt = new Date();
    await assessment.save();

    logger.info(`Report deleted: ${reportId} for user: ${req.user.email}`);

    res.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    logger.error("Delete report error:", error);
    next(new ApiError(500, "Could not delete report"));
  }
};

module.exports = {
  getDashboardOverview,
  getRecentAssessments,
  getInProgressAssessments,
  getDashboardStats,
  getAssessmentCounts,
  getChildProgress,
  getProgressOverview,
  getAllUserReports,
  getChildReports,
  getReportById,
  downloadReport,
  deleteReport,
};
