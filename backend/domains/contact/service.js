const nodemailer = require("nodemailer");
const logger = require("../../utils/logger");

/**
 * Configure email transporter for Brevo SMTP
 * Production-ready email service configuration
 */
const getTransporter = () => {
  return nodemailer.createTransport({
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
    // Connection timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });
};

/**
 * Send notification to admin about new contact submission
 * @param {Object} contact - Contact object
 */
const sendContactNotification = async (contact) => {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"CogniKidz" <${process.env.EMAIL_FROM || "no-reply@cognikidz.care"}>`,
      to: process.env.ADMIN_EMAIL || "admin@cognikidz.care",
      subject: `New Contact Form Submission: ${contact.subject}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Subject:</strong> ${contact.subject}</p>
        <p><strong>Message:</strong></p>
        <div>${contact.message}</div>
        <p>
          <a href="${process.env.FRONTEND_URL}/admin/contacts/${contact._id}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            View in Admin Panel
          </a>
        </p>
      `,
    });

    logger.info(
      `Contact notification sent to admin for submission from ${contact.email}`
    );
  } catch (error) {
    logger.error("Error sending contact notification:", error);
    throw new Error("Failed to send contact notification");
  }
};

/**
 * Send confirmation email to user
 * @param {Object} contactInfo - Contact information
 */
const sendConfirmationEmail = async (contactInfo) => {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"CogniKidz" <${process.env.EMAIL_FROM || "no-reply@cognikidz.care"}>`,
      to: contactInfo.email,
      subject: `Thank you for contacting CogniKidz`,
      html: `
        <h1>Thank You for Contacting Us</h1>
        <p>Dear ${contactInfo.name},</p>
        <p>Thank you for reaching out to CogniKidz. We have received your message regarding "${contactInfo.subject}".</p>
        <p>Our team will review your inquiry and get back to you as soon as possible.</p>
        <p>Best regards,<br>The CogniKidz Team</p>
      `,
    });

    logger.info(`Confirmation email sent to ${contactInfo.email}`);
  } catch (error) {
    logger.error("Error sending confirmation email:", error);
    throw new Error("Failed to send confirmation email");
  }
};

/**
 * Send reply email to contact
 * @param {Object} replyInfo - Reply information
 */
const sendReplyEmail = async (replyInfo) => {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"CogniKidz Support" <${process.env.EMAIL_FROM || "support@cognikidz.care"}>`,
      to: replyInfo.email,
      subject: `Re: ${replyInfo.subject}`,
      html: `
        <h1>Response to Your Inquiry</h1>
        <p>Dear ${replyInfo.name},</p>
        <p>Thank you for contacting CogniKidz. Here is our response to your inquiry:</p>
        <div style="margin: 20px; padding: 15px; border-left: 4px solid #4CAF50; background-color: #f9f9f9;">
          ${replyInfo.message}
        </div>
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        <p>Best regards,<br>${replyInfo.responder}<br>CogniKidz Support Team</p>
      `,
    });

    logger.info(`Reply email sent to ${replyInfo.email}`);
  } catch (error) {
    logger.error("Error sending reply email:", error);
    throw new Error("Failed to send reply email");
  }
};

module.exports = {
  sendContactNotification,
  sendConfirmationEmail,
  sendReplyEmail,
};
