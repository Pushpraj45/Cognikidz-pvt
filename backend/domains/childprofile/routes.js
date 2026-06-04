// routes/childprofile.routes.js
const express = require("express");
const multer = require("multer");
const { protect } = require("../auth/middleware");
const childprofileController = require("./controller");
const childprofileValidator = require("./validator");

const router = express.Router();

// Configure multer for file uploads with enhanced security
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    fieldNameSize: 100, // Limit field name size to prevent CVE-2025-48997
    fieldSize: 1 * 1024 * 1024, // 1MB limit for field values
    fields: 10, // Maximum number of fields
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

// Add multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 2MB." });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// All routes are protected - require authentication
router.post(
  "/",
  protect,
  upload.single("avatar"),
  handleMulterError,
  childprofileValidator.validateCreateProfile,
  childprofileController.createChildProfile
);
router.get("/", protect, childprofileController.getChildProfiles);
router.get("/:id", protect, childprofileController.getChildProfileById);
router.put(
  "/:id",
  protect,
  upload.single("avatar"),
  handleMulterError,
  childprofileValidator.validateUpdateProfile,
  childprofileController.updateChildProfile
);
router.delete("/:id", protect, childprofileController.deleteChildProfile);

module.exports = router;
