const jwt = require("jsonwebtoken");
const { ApiError } = require("../shared/error-middleware");
const User = require("./model");
const logger = require("../../utils/logger");

/**
 * Middleware to protect routes - verifies JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      logger.warn(
        `Unauthorized access attempt to ${req.originalUrl} from IP: ${req.ip}`
      );
      return next(new ApiError(401, "Not authorized, no token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id and check if still exists and is verified
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      logger.warn(`Token for non-existent user: ${decoded.id}`);
      return next(new ApiError(401, "Not authorized, user not found"));
    }

    // Check if user account is verified
    if (!user.isVerified) {
      logger.warn(
        `Unverified user ${user.email} attempted to access ${req.originalUrl}`
      );
      return next(
        new ApiError(
          401,
          "Please verify your email before accessing this resource"
        )
      );
    }

    // Check token expiration more strictly
    if (decoded.exp * 1000 < Date.now()) {
      logger.warn(`Expired token used by user: ${user.email}`);
      return next(new ApiError(401, "Token expired, please login again"));
    }

    req.user = user;
    logger.info(
      `Authenticated request from user: ${user.email} to ${req.originalUrl}`
    );
    next();
  } catch (error) {
    logger.error(
      `Authentication error: ${error.message} for ${req.originalUrl}`
    );

    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired, please login again"));
    }
    next(new ApiError(401, "Not authorized"));
  }
};

/**
 * Middleware to verify admin role
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user && req.user.isAdmin) {
    logger.info(
      `Admin access granted to ${req.user.email} for ${req.originalUrl}`
    );
    next();
  } else {
    logger.warn(
      `Admin access denied to ${req.user.email} for ${req.originalUrl}`
    );
    next(new ApiError(403, "Not authorized as admin"));
  }
};

/**
 * Optional authentication middleware - sets req.user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by id
        const user = await User.findById(decoded.id).select("-password");

        if (user && user.isVerified) {
          req.user = user;
          logger.info(
            `Optional auth: User ${user.email} authenticated for ${req.originalUrl}`
          );
        }
      } catch (error) {
        // Don't fail the request, just continue without user
        logger.info(
          `Optional auth: Invalid token for ${req.originalUrl}, continuing without auth`
        );
      }
    }

    next();
  } catch (error) {
    // Don't fail the request for optional auth
    next();
  }
};

/**
 * Middleware to verify user owns the resource
 * Checks if req.user._id matches the userId field in req.body or req.params
 */
const verifyOwnership = (userIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const resourceUserId =
      req.body[userIdField] ||
      req.params[userIdField] ||
      req.resource?.[userIdField];

    if (
      resourceUserId &&
      resourceUserId.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      logger.warn(
        `Ownership verification failed: ${req.user.email} attempted to access resource owned by ${resourceUserId}`
      );
      return next(new ApiError(403, "Not authorized to access this resource"));
    }

    next();
  };
};

/**
 * Middleware to verify user owns the assessment
 * Used for assessment-specific routes
 */
const verifyAssessmentOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const sessionId = req.params.sessionId || req.body.sessionId;

    if (!sessionId) {
      return next(new ApiError(400, "Session ID required"));
    }

    // Import Assessment model here to avoid circular dependencies
    const Assessment = require("../assessment/model");

    const assessment = await Assessment.findOne({ sessionId }).populate(
      "intakeId"
    );

    if (!assessment) {
      return next(new ApiError(404, "Assessment not found"));
    }

    // Check if assessment belongs to the user
    if (
      assessment.userId &&
      assessment.userId.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      logger.warn(
        `Assessment access denied: ${req.user.email} attempted to access assessment ${sessionId}`
      );
      return next(
        new ApiError(403, "Not authorized to access this assessment")
      );
    }

    // If assessment doesn't have userId but has intake with userId, check that
    if (
      !assessment.userId &&
      assessment.intakeId &&
      assessment.intakeId.userId
    ) {
      if (
        assessment.intakeId.userId.toString() !== req.user._id.toString() &&
        !req.user.isAdmin
      ) {
        logger.warn(
          `Assessment access denied via intake: ${req.user.email} attempted to access assessment ${sessionId}`
        );
        return next(
          new ApiError(403, "Not authorized to access this assessment")
        );
      }

      // Fix missing userId if we can determine it from intake
      assessment.userId = assessment.intakeId.userId;
      await assessment.save();
      logger.info(`Fixed missing userId for assessment ${sessionId}`);
    }

    // Store assessment in req for use in controller
    req.assessment = assessment;
    next();
  } catch (error) {
    logger.error(`Error validating assessment ownership: ${error.message}`);
    next(new ApiError(500, "Error validating assessment access"));
  }
};

module.exports = {
  protect,
  admin,
  optionalAuth,
  verifyOwnership,
  verifyAssessmentOwnership,
};
