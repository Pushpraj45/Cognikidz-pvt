const express = require("express");
const router = express.Router();
const { protect } = require("../domains/auth/middleware");
const translationService = require("../services/translation.service");
const logger = require("../utils/logger");
const cors = require("cors");

// Enable CORS for all translation routes with most permissive settings
router.use(
  cors({
    origin: true, // Allow all origins for translation
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    exposedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    maxAge: 600,
    optionsSuccessStatus: 200,
  })
);

/**
 * @route   POST /api/translate
 * @desc    Translate text from source to target language
 * @access  Public (changed from Private)
 */
router.post("/", async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = "en" } = req.body;

    // Validation
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: "Text and target language are required",
      });
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Text must be a non-empty string",
      });
    }

    const result = await translationService.translateText(
      text,
      targetLanguage,
      sourceLanguage
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Translation API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Translation failed",
    });
  }
});

/**
 * @route   POST /api/translate/bulk
 * @desc    Translate multiple texts in bulk
 * @access  Public (changed from Private)
 */
router.post("/bulk", async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage = "en" } = req.body;

    // Validation
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Texts must be a non-empty array",
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: "Target language is required",
      });
    }

    if (texts.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 1000 texts allowed per bulk request",
      });
    }

    // Validate each text
    for (let i = 0; i < texts.length; i++) {
      if (typeof texts[i] !== "string") {
        return res.status(400).json({
          success: false,
          message: `Text at index ${i} must be a string`,
        });
      }
    }

    const results = await translationService.translateBulk(
      texts,
      targetLanguage,
      sourceLanguage
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("Bulk translation API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Bulk translation failed",
    });
  }
});

/**
 * @route   GET /api/translate/languages
 * @desc    Get list of supported languages
 * @access  Public
 */
router.get("/languages", async (req, res) => {
  try {
    const languages = await translationService.getSupportedLanguages();

    res.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    logger.error("Get languages API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch supported languages",
    });
  }
});

/**
 * @route   POST /api/translate/detect
 * @desc    Detect language of given text
 * @access  Public (changed from Private)
 */
router.post("/detect", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Text is required and must be a non-empty string",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message:
          "Text too long for language detection. Maximum 1000 characters allowed.",
      });
    }

    const detectedLanguage = await translationService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        detectedLanguage,
        confidence: "high", // Google Translate doesn't provide confidence scores
        text: text.substring(0, 100), // Return first 100 chars for reference
      },
    });
  } catch (error) {
    logger.error("Language detection API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Language detection failed",
    });
  }
});

/**
 * @route   POST /api/translate/assessment
 * @desc    Translate assessment content (questions, options, etc.)
 * @access  Private (keeping auth for sensitive content)
 */
router.post("/assessment", protect, async (req, res) => {
  try {
    const { assessmentData, targetLanguage } = req.body;

    // Validation
    if (!assessmentData || typeof assessmentData !== "object") {
      return res.status(400).json({
        success: false,
        message: "Assessment data is required and must be an object",
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: "Target language is required",
      });
    }

    const translatedAssessment =
      await translationService.translateAssessmentContent(
        assessmentData,
        targetLanguage
      );

    res.json({
      success: true,
      data: translatedAssessment,
    });
  } catch (error) {
    logger.error("Assessment translation API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Assessment translation failed",
    });
  }
});

/**
 * @route   GET /api/translate/stats
 * @desc    Get translation service statistics
 * @access  Private (Admin only)
 */
router.get("/stats", protect, async (req, res) => {
  try {
    // Check if user is admin (you may need to adjust this based on your auth system)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const stats = translationService.getCacheStats();
    const isAvailable = translationService.isAvailable();

    res.json({
      success: true,
      data: {
        serviceAvailable: isAvailable,
        cache: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Translation stats API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch translation statistics",
    });
  }
});

/**
 * @route   DELETE /api/translate/cache
 * @desc    Clear translation cache
 * @access  Private (Admin only)
 */
router.delete("/cache", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    translationService.clearCache();

    res.json({
      success: true,
      message: "Translation cache cleared successfully",
    });
  } catch (error) {
    logger.error("Clear cache API error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to clear translation cache",
    });
  }
});

/**
 * @route   GET /api/translate/health
 * @desc    Check translation service health
 * @access  Public
 */
router.get("/health", async (req, res) => {
  try {
    const isAvailable = translationService.isAvailable();
    const stats = translationService.getCacheStats();

    res.json({
      success: true,
      data: {
        status: isAvailable ? "healthy" : "limited",
        serviceAvailable: isAvailable,
        cache: {
          size: stats.size,
          maxSize: stats.maxSize,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Translation health check error:", error);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      data: {
        status: "unhealthy",
        serviceAvailable: false,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

module.exports = router;
