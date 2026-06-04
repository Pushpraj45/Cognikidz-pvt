import api from './api';

const PricingService = {
  /**
   * Get all assessment pricing
   */
  async getAssessmentPricing() {
    try {
      const response = await api.get('/api/pricing/assessment-pricing');
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment pricing:', error);
      throw error;
    }
  },

  /**
   * Get all combo packages
   */
  async getComboPackages() {
    try {
      const response = await api.get('/api/pricing/combo-packages');
      return response.data;
    } catch (error) {
      console.error('Error fetching combo packages:', error);
      throw error;
    }
  },

  /**
   * Get pricing for a specific assessment type
   */
  async getAssessmentPrice(assessmentType) {
    try {
      const response = await api.get(`/api/pricing/assessment-price/${assessmentType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment price:', error);
      throw error;
    }
  },

  /**
   * Check if user has access to an assessment
   */
  async checkUserAccess(assessmentType) {
    try {
      const response = await api.get(`/api/pricing/user-access/${assessmentType}`);
      return response.data;
    } catch (error) {
      console.error('Error checking user access:', error);
      throw error;
    }
  },

  /**
   * Get user's purchase history
   */
  async getUserPurchases() {
    try {
      const response = await api.get('/api/pricing/user-purchases');
      return response.data;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      throw error;
    }
  },

  /**
   * Get aggregated user entitlements (purchased, used, remaining) per base type
   */
  async getUserEntitlements() {
    try {
      const response = await api.get('/api/pricing/user-entitlements');
      return response.data;
    } catch (error) {
      console.error('Error fetching user entitlements:', error);
      throw error;
    }
  },

  /**
   * Create a purchase record
   */
  async createPurchase(purchaseData) {
    try {
      const response = await api.post('/api/pricing/create-purchase', purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  },

  /**
   * Initiate a Razorpay order
   */
  async initiateRazorpayOrder(data) {
    try {
      const response = await api.post('/api/pricing/razorpay/create-order', data);
      return response.data;
    } catch (error) {
      console.error('Error initiating Razorpay order:', error);
      throw error;
    }
  },

  async getActiveCoupons() {
    try {
      const response = await api.get('/api/pricing/coupons/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active coupons:', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(data) {
    try {
      const response = await api.post('/api/pricing/razorpay/verify-payment', data);
      return response.data;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  },

  /**
   * Usage checks and increments
   */
  async checkUsage(payload) {
    try {
      const response = await api.post('/api/pricing/usage/check', payload);
      return response.data;
    } catch (error) {
      console.error('Error checking usage:', error);
      throw error;
    }
  },

  async incrementUsage(payload) {
    try {
      const response = await api.post('/api/pricing/usage/increment', payload);
      return response.data;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  },

  /**
   * Get pricing configuration
   */
  async getPricingConfig() {
    try {
      const response = await api.get('/api/pricing/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      throw error;
    }
  },

  /**
   * Grant free access (admin only)
   */
  async grantFreeAccess(accessData) {
    try {
      const response = await api.post('/api/pricing/grant-free-access', accessData);
      return response.data;
    } catch (error) {
      console.error('Error granting free access:', error);
      throw error;
    }
  },

  /**
   * Update pricing configuration (admin only)
   */
  async updatePricingConfig(configData) {
    try {
      const response = await api.put('/api/pricing/config', configData);
      return response.data;
    } catch (error) {
      console.error('Error updating pricing config:', error);
      throw error;
    }
  },
};

export default PricingService;
