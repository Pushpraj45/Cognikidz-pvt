const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

/**
 * Create reusable transporter object using Brevo SMTP transport
 * Production-ready email service configuration
 */
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_API_KEY,
  },
  // Additional security and reliability options
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false, // Allow self-signed certificates in development
  },
  // Connection timeout
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

/**
 * Verify transporter configuration on startup
 */
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    logger.info("✓ Brevo SMTP server configuration verified successfully");
    return true;
  } catch (error) {
    logger.error("✗ Brevo SMTP server configuration failed:", error.message);
    return false;
  }
};

/**
 * Enhanced email sending function with error handling
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender email (optional)
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async (options) => {
  try {
    // Validate required options
    if (!options.email) {
      throw new Error("Recipient email is required");
    }
    if (!options.subject) {
      throw new Error("Email subject is required");
    }
    if (!options.text && !options.html) {
      throw new Error("Email content (text or html) is required");
    }

    const mailOptions = {
      from:
        options.from ||
        `"CogniKidz" <${process.env.BREVO_FROM_EMAIL || "no-reply@cognikidz.care"}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
      // Add headers for better deliverability
      headers: {
        "X-Priority": "3",
        "X-Mailer": "CogniKidz-App",
      },
    };

    logger.info(
      `Attempting to send email to ${options.email} with subject: ${options.subject}`
    );

    const result = await transporter.sendMail(mailOptions);

    logger.info(`✓ Email sent successfully to ${options.email}`, {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return result;
  } catch (error) {
    logger.error(`✗ Failed to send email to ${options.email}:`, {
      error: error.message,
      code: error.code,
      command: error.command,
    });

    // Re-throw with more context
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

/**
 * Test email connectivity
 * @returns {Promise<boolean>} - Connection test result
 */
const testConnection = async () => {
  try {
    await transporter.verify();
    logger.info("✓ Brevo SMTP connection test successful");
    return true;
  } catch (error) {
    logger.error("✗ Brevo SMTP connection test failed:", error.message);
    return false;
  }
};

module.exports = {
  transporter,
  sendEmail,
  verifyTransporter,
  testConnection,
};
