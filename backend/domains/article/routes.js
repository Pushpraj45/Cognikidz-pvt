// routes/article.routes.js
const express = require("express");
const multer = require("multer");
const { protect, admin, optionalAuth } = require("../auth/middleware");
const articleController = require("./controller");
const articleValidator = require("./validator");

const router = express.Router();

// Configure multer for file uploads with enhanced security
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for article images
    fieldNameSize: 100, // Limit field name size to prevent CVE-2025-48997
    fieldSize: 1 * 1024 * 1024, // 1MB limit for field values
    fields: 20, // Maximum number of fields (higher for article metadata)
    files: 1, // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Enhanced security checks
    if (!file.fieldname || file.fieldname.trim() === '') {
      return cb(new Error('Invalid field name detected'), false);
    }
    
    // Check for path traversal in filename
    if (file.originalname && (file.originalname.includes('../') || file.originalname.includes('..\\') || /[<>:"|?*]/.test(file.originalname))) {
      return cb(new Error('Invalid filename detected'), false);
    }
    
    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed!'), false);
    }
    
    cb(null, true);
  },
});

// Public routes with optional authentication (to provide different behavior for authenticated users)
router.get("/", optionalAuth, articleController.getArticles);

// Protected user routes - MUST come before /:id route
router.get("/my-articles", protect, articleController.getUserArticles);

// Article-specific routes
// This must come after specific routes like /my-articles
router.get("/:id", optionalAuth, articleController.getArticleById);

// Protected routes
router.post(
  "/",
  protect,
  upload.single("image"),
  articleValidator.validateCreateArticle,
  articleController.createArticle
);
router.post(
  "/:id/like",
  protect,
  articleValidator.validateLike,
  articleController.toggleLikeArticle
);
router.post(
  "/:id/ratings",
  protect,
  articleValidator.validateRating,
  articleController.rateArticle
);
router.post(
  "/:id/comments",
  protect,
  articleValidator.validateComment,
  articleController.addComment
);
router.put("/comments/:id", protect, articleController.updateComment);
router.delete("/comments/:id", protect, articleController.deleteComment);
router.delete("/:id", protect, articleController.deleteArticle);

// Other admin routes
// router.put("/:id/status", protect, admin, articleValidator.validateStatusUpdate, articleController.updateArticleStatus); // Removed - no status updates needed

module.exports = router;
