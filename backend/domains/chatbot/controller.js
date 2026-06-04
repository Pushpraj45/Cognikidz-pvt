const { ApiError } = require("../shared/error-middleware");
const chatbotService = require("./service");
const logger = require("../../utils/logger");
const crypto = require("crypto");

/**
 * Handle chat query from user
 * @route POST /api/chatbot/query
 * @access Public
 */
const handleChatQuery = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim().length === 0) {
      return next(new ApiError(400, "Message is required"));
    }

    if (message.length > 1000) {
      return next(
        new ApiError(
          400,
          "Message is too long. Please keep it under 1000 characters."
        )
      );
    }

    logger.info(`Chat query received: ${message.substring(0, 100)}...`);

    // Generate response using Azure OpenAI
    const response = await chatbotService.generateResponse(message, sessionId);

    logger.info(`Chat response generated successfully`);

    res.json({
      success: true,
      data: {
        response: response.content,
        sessionId: response.sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Chat query error:", error.message);

    // Provide fallback response if AI service fails
    const fallbackResponse = chatbotService.getFallbackResponse(
      req.body.message
    );

    // Determine fallback reason for better debugging
    let fallbackReason = "ai_service_error";
    if (error.message.includes("configuration missing")) {
      fallbackReason = "ai_not_configured";
    } else if (error.message.includes("timeout")) {
      fallbackReason = "ai_timeout";
    } else if (error.message.includes("401")) {
      fallbackReason = "ai_authentication_error";
    }

    logger.info(`Providing fallback response due to: ${fallbackReason}`);

    res.json({
      success: true,
      data: {
        response: fallbackResponse,
        sessionId: req.body.sessionId || crypto.randomBytes(8).toString("hex"),
        timestamp: new Date().toISOString(),
        fallback: true,
        fallbackReason: fallbackReason,
        source: "fallback_system",
      },
    });
  }
};

/**
 * Get chatbot health status
 * @route GET /api/chatbot/health
 * @access Public
 */
const getChatbotHealth = async (req, res, next) => {
  try {
    const health = await chatbotService.checkHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error("Chatbot health check error:", error);
    next(new ApiError(500, "Could not check chatbot health"));
  }
};

module.exports = {
  handleChatQuery,
  getChatbotHealth,
};
