const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * RazorpayService encapsulates interactions with Razorpay SDK
 */
class RazorpayService {
  /**
   * Initialize Razorpay instance
   */
  static getClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys are not configured');
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  /**
   * Create Razorpay order
   */
  static async createOrder({ amountInMinor, currency, receipt, notes }) {
    const client = this.getClient();
    const orderOptions = {
      amount: amountInMinor, // amount in currency subunits (e.g., paise)
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: notes || {},
    };

    return await client.orders.create(orderOptions);
  }

  /**
   * Verify payment signature returned by Razorpay Checkout
   */
  static verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === razorpaySignature;
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature({ payload, signature }) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    return expectedSignature === signature;
  }
}

module.exports = RazorpayService;


