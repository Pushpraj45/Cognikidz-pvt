const express = require("express");
const rateLimit = require("express-rate-limit");
const { handleChatQuery, getChatbotHealth } = require("./controller");

const router = express.Router();

// Rate limiting for chatbot - more restrictive to prevent abuse
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: {
    error: "Too many chat requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all chatbot routes
router.use(chatbotLimiter);

// Routes
router.post("/query", handleChatQuery);
router.get("/health", getChatbotHealth);

module.exports = router;
