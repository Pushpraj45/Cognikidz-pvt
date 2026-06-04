// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("./config/passport");
const path = require("path");

const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { errorHandler } = require("./domains/shared").errorMiddleware;
const { verifyTransporter } = require("./config/mail");

// Import routes
const { routes: authRoutes } = require("./domains/auth");
const { routes: articleRoutes } = require("./domains/article");
const { routes: contactRoutes } = require("./domains/contact");
const { routes: childProfileRoutes } = require("./domains/childprofile");
const { routes: intakeRoutes } = require("./domains/intake");
const { routes: assessmentRoutes } = require("./domains/assessment");
const { routes: dashboardRoutes } = require("./domains/dashboard");
const { routes: chatbotRoutes } = require("./domains/chatbot");
const { routes: feedbackRoutes } = require("./domains/feedback");
const { router: bookmarkRoutes } = require("./domains/bookmark");
const { router: pricingRoutes } = require("./domains/pricing");
const notificationsRoutes = require('./domains/notifications/routes');
const webhookRoutes = require("./routes/webhook.routes");
const translationRoutes = require("./routes/translation.routes");
const pdfRoutes = require("./domains/shared/pdf-routes");

// Connect to MongoDB
connectDB();

// Verify Brevo email service configuration
verifyTransporter().catch((error) => {
  logger.warn("Brevo email service verification failed:", error.message);
  logger.warn("Email functionality may not work properly");
});

const app = express();

// Trust proxy for Vercel/production deployment
// This fixes the "X-Forwarded-For" header rate limiting issue
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  app.set("trust proxy", 1);
}

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for assessment endpoints
const assessmentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Increased from 30 to 100 requests per minute for assessments
  message: {
    error: "Too many assessment requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiting for assessment history and read-only endpoints
const assessmentHistoryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Allow more requests for history/read operations
  message: {
    error: "Too many assessment history requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dashboard API rate limiting
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Increased from 60 to 100 requests per minute for dashboard
  message: {
    error: "Too many dashboard requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Translation API rate limiting - COMPLETELY REMOVED for unlimited access

// Enhanced Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://checkout.razorpay.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "wss:", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Dynamic CORS origins configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  process.env.FRONTEND_URL, // Production frontend URL
  "https://cognikidz-test.vercel.app", // Add explicit frontend URL
  "https://cognikidz.vercel.app", // Backup frontend URL
];

// Add Vercel preview URLs if available
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

// Filter out undefined values
const validOrigins = allowedOrigins.filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list or is a Vercel preview URL
      if (
        validOrigins.includes(origin) ||
        origin.includes(".vercel.app") ||
        origin.includes("cognikidz") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }

      // For translation requests, allow all origins (less restrictive)
      if (
        origin &&
        (origin.includes("vercel.app") || origin.includes("netlify.app"))
      ) {
        logger.info(
          "CORS: Allowing Vercel/Netlify origin for translation:",
          origin
        );
        return callback(null, true);
      }

      // Log rejected origins for debugging
      console.warn("CORS: Rejected origin:", origin);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Access-Control-Allow-Origin",
      "Cache-Control",
      "Pragma",
    ],
    exposedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Access-Control-Allow-Origin",
    ],
    maxAge: 600,
    optionsSuccessStatus: 200, // For legacy browser support
  })
);

// Handle preflight requests explicitly
app.options("*", cors());

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Add URL normalization middleware to fix double slash issues
app.use((req, res, next) => {
  // Normalize URL by removing double slashes
  const normalizedUrl = req.url.replace(/\/+/g, "/");
  if (normalizedUrl !== req.url) {
    logger.info(`URL normalized: ${req.url} -> ${normalizedUrl}`);
    req.url = normalizedUrl;
    req.originalUrl = normalizedUrl;
  }
  next();
});

// Request size limits for security
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Preserve raw body for webhook signature verification
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
    } catch (e) {
      req.rawBody = buf.toString();
    }
    // Add request body verification
    if (buf && buf.length >= 10 * 1024 * 1024) {
      logger.warn(`Large request body detected: ${buf.length} bytes from IP: ${req.ip}`);
    }
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 100,
  verify: (req, res, buf, encoding) => {
    // Add request body verification
    if (buf && buf.length >= 10 * 1024 * 1024) {
      logger.warn(`Large URL-encoded body detected: ${buf.length} bytes from IP: ${req.ip}`);
    }
  }
}));
app.use(morgan("dev"));

// Session configuration for passport
// Note: In production, this should ideally use a persistent session store like Redis
// For now, we'll configure it appropriately for serverless deployment
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "cognikidz-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// In production/serverless, we'll use a minimal session setup since functions are stateless
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  // For serverless environments, sessions aren't persistent across function invocations anyway
  // This setup minimizes memory usage and avoids the MemoryStore warning
  sessionConfig.cookie.maxAge = 60 * 60 * 1000; // Reduce to 1 hour for serverless
  logger.warn(
    "Using memory session store in serverless environment - sessions are not persistent across function restarts"
  );
}

app.use(session(sessionConfig));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  if (req.method === "POST" || req.method === "PUT") {
    logger.info("Request body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Log all headers for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    next();
  });
}

// Serve static files from the public directory
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Base routes - these should come first before specific route handlers
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to CogniKidz API" });
});

// API health check routes
app.get("/api/ping", (req, res) => {
  res.json({ status: "pong", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "cognikidz-backend",
    timestamp: new Date().toISOString(),
  });
});

// Routes with specific rate limiting - Order matters!
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/childprofile", childProfileRoutes);
app.use("/api/intake", intakeRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/webhooks", webhookRoutes);
// Translation routes - NO rate limiting for unlimited access
app.use("/api/translate", translationRoutes);

// PDF routes - with general rate limiting for authenticated users
app.use("/api/pdf", pdfRoutes);

// Dashboard routes - must come before the catch-all assessment routes
app.use("/api/dashboard", dashboardLimiter, dashboardRoutes);

// Apply assessment routes with appropriate rate limiting
// The childAssessments route is defined within the assessment routes, so we don't need separate middleware for it
app.use("/api/assessment", assessmentRoutes);

// Add before the error handler
// Catch incorrect assessment completion URLs (without /api prefix)
app.post("/assessment/:sessionId/complete", (req, res) => {
  logger.warn(`⚠️  Caught incorrect URL pattern: ${req.originalUrl}`);
  logger.info(`Redirecting to: /api${req.originalUrl}`);

  // Return a proper error with the correct URL
  res.status(400).json({
    success: false,
    message: "Incorrect endpoint URL",
    correctUrl: `/api${req.originalUrl}`,
    note: "Please use the correct API endpoint with /api prefix",
  });
});

// Base route (non-API)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to CogniKidz API" });
});

// Simple test route to check if API is alive (non-API)
app.get("/ping", (req, res) => {
  res.json({ status: "pong", timestamp: new Date().toISOString() });
});

// Health check (non-API)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Add catch-all route for debugging 404s
app.use((req, res, next) => {
  if (req.path.includes('/assessment/games/') || req.path.includes('/childprofile/')) {
    logger.warn('🔍 Potential routing issue detected:', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      query: req.query,
      userAgent: req.headers['user-agent']
    });
  }
  next();
});

// Error handler
app.use(errorHandler);

// Validate critical environment variables
const validateEnvironment = () => {
  const requiredVars = {
    JWT_SECRET: process.env.JWT_SECRET,
    MONGO_URI: process.env.MONGO_URI,
  };

  const googleVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };

  // Check required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      logger.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  // Check Google OAuth variables (warn if missing but don't exit)
  let missingGoogleVars = [];
  for (const [key, value] of Object.entries(googleVars)) {
    if (!value) {
      missingGoogleVars.push(key);
    }
  }

  if (missingGoogleVars.length > 0) {
    logger.warn(
      `Missing Google OAuth environment variables: ${missingGoogleVars.join(
        ", "
      )}`
    );
    logger.warn("Google OAuth login will not work until these are configured");
  } else {
    logger.info("Google OAuth environment variables are configured");
  }

  logger.info("Environment validation completed");
};

// Validate critical dependencies
const validateDependencies = () => {
  const criticalDependencies = [
    "google-auth-library",
    "nodemailer",
    "jsonwebtoken",
    "mongoose",
  ];

  logger.info("Validating critical dependencies...");

  for (const dep of criticalDependencies) {
    try {
      require.resolve(dep);
      logger.info(`✓ ${dep} dependency available`);
    } catch (error) {
      logger.error(
        `✗ ${dep} dependency missing or not resolvable:`,
        error.message
      );

      if (dep === "google-auth-library") {
        logger.error(
          "Google OAuth login will not work. Please ensure google-auth-library is installed."
        );
      }
    }
  }

  // Special check for google-auth-library functionality
  try {
    const googleAuth = require("google-auth-library");
    if (googleAuth && googleAuth.OAuth2Client) {
      logger.info("✓ google-auth-library OAuth2Client available");
    } else {
      logger.warn("⚠ google-auth-library imported but OAuth2Client not found");
    }
  } catch (error) {
    logger.error("✗ google-auth-library import failed:", error.message);
  }

  logger.info("Dependency validation completed");
};

// Initialize Report Scheduler
const initializeReportScheduler = () => {
  try {
    const ReportScheduler = require('./domains/assessment/report-scheduler');
    ReportScheduler.start();
    logger.info('✅ Report Scheduler initialized and started');
  } catch (error) {
    logger.warn('⚠️ Report Scheduler initialization failed:', error.message);
    logger.warn('Scheduled reports will not be generated');
  }
};

// Validate environment on startup
validateEnvironment();
validateDependencies();

// Start server only if this file is run directly (not when required as a module)
if (require.main === module) {
  const PORT = process.env.PORT || 8004;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);

    // Initialize report scheduler after server starts
    setTimeout(() => {
      initializeReportScheduler();
    }, 2000); // Wait 2 seconds for database connection to stabilize
  });
}

module.exports = app;
