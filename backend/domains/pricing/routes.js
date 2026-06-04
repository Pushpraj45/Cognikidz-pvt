const express = require('express');
const router = express.Router();
const { protect } = require('../auth/middleware');
const pricingController = require('./controller');

// Public routes (no authentication required)
router.get('/assessment-pricing', pricingController.getAssessmentPricing);
router.get('/combo-packages', pricingController.getComboPackages);
router.get('/assessment-price/:assessmentType', pricingController.getAssessmentPrice);
router.get('/config', pricingController.getPricingConfig);

// Protected routes (authentication required)
router.get('/user-access/:assessmentType', protect, pricingController.checkUserAccess);
router.get('/user-purchases', protect, pricingController.getUserPurchases);
router.get('/user-entitlements', protect, pricingController.getUserEntitlements);
router.post('/create-purchase', protect, pricingController.createPurchase);

// Razorpay payment routes
router.post('/razorpay/create-order', protect, pricingController.createRazorpayOrder);
router.post('/razorpay/verify-payment', protect, pricingController.verifyRazorpayPayment);
router.get('/coupons/active', protect, pricingController.getActiveCoupons);

// Usage control routes
router.post('/usage/check', protect, async (req, res) => {
  try {
    const { checkUsage } = require('./usage');
    return checkUsage(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Usage module not available' });
  }
});
router.post('/usage/increment', protect, async (req, res) => {
  try {
    const { incrementUsage } = require('./usage');
    return incrementUsage(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Usage module not available' });
  }
});

// Admin routes (admin access required)
router.post('/grant-free-access', protect, pricingController.grantFreeAccess);
router.put('/config', protect, pricingController.updatePricingConfig);

module.exports = router; 