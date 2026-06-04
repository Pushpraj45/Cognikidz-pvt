const express = require("express");
const router = express.Router();
const bookmarkController = require("./controller");
const { protect } = require("../auth/middleware");

// Apply authentication middleware to all bookmark routes
router.use(protect);

// Bookmark routes
router.post("/", bookmarkController.createBookmark);
router.get("/", bookmarkController.getBookmarks);
router.get("/stats", bookmarkController.getBookmarkStats);
router.get("/search", bookmarkController.searchBookmarks);
router.get("/:id", bookmarkController.getBookmark);
router.put("/:id", bookmarkController.updateBookmark);
router.delete("/:id", bookmarkController.deleteBookmark);

// Quick bookmark toggle
router.post("/toggle/:resourceId", bookmarkController.toggleBookmark);

module.exports = router; 