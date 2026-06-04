// routes/contact.routes.js
const express = require("express");
const { protect, admin } = require("../auth/middleware");
const contactController = require("./controller");
const contactValidator = require("./validator");

const router = express.Router();

// Public routes
router.post(
  "/",
  contactValidator.validateContactForm,
  contactController.submitContactForm
);

// Admin routes
router.get("/", protect, admin, contactController.getContactSubmissions);
router.get("/:id", protect, admin, contactController.getContactById);
router.put(
  "/:id/status",
  protect,
  admin,
  contactValidator.validateStatusUpdate,
  contactController.updateContactStatus
);
router.put("/:id/assign", protect, admin, contactController.assignContact);
router.post(
  "/:id/reply",
  protect,
  admin,
  contactValidator.validateReply,
  contactController.replyToContact
);
router.delete("/:id", protect, admin, contactController.deleteContact);

module.exports = router;
