const express = require('express');
const router = express.Router();
const { protect } = require('../auth/middleware');
const Notification = require('./model');

// Get current user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
});

// Mark as read
router.post('/:id/read', protect, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

module.exports = router;


