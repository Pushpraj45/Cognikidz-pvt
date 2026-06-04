const nodemailer = require("nodemailer");
const Report = require("./report-model");
const ChildProfile = require("../childprofile/model");
const User = require("../auth/model");
const logger = require("../../utils/logger");

class EmailNotificationService {
  constructor() {
    this.transporter = this.createTransporter();
    this.emailQueue = [];
    this.isProcessingQueue = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Email Queue System for reliable delivery
   */
  async addToEmailQueue(emailData) {
    const queueItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      data: emailData,
      retries: 0,
      createdAt: new Date(),
      status: "pending",
    };

    this.emailQueue.push(queueItem);
    logger.info(`📧 Email added to queue: ${queueItem.id}`);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processEmailQueue();
    }

    return queueItem.id;
  }

  async processEmailQueue() {
    if (this.isProcessingQueue || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    logger.info(
      `📧 Processing email queue with ${this.emailQueue.length} items`
    );

    while (this.emailQueue.length > 0) {
      const queueItem = this.emailQueue.shift();

      try {
        const result = await this.sendEmailWithRetry(
          queueItem.data,
          queueItem.retries
        );

        if (result.success) {
          queueItem.status = "sent";
          logger.info(`✅ Email sent successfully: ${queueItem.id}`);
        } else {
          queueItem.status = "failed";
          logger.error(`❌ Email failed: ${queueItem.id}`, result.error);
        }
      } catch (error) {
        queueItem.status = "failed";
        logger.error(`❌ Email processing error: ${queueItem.id}`, error);
      }

      // Add delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.isProcessingQueue = false;
    logger.info("📧 Email queue processing completed");
  }

  async sendEmailWithRetry(mailOptions, retries = 0) {
    try {
      if (!this.transporter) {
        return { success: false, error: "Email service not configured" };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      if (retries < this.maxRetries) {
        logger.warn(
          `📧 Email retry ${retries + 1}/${this.maxRetries} for ${mailOptions.to
          }`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * (retries + 1))
        );
        return this.sendEmailWithRetry(mailOptions, retries + 1);
      } else {
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Get email queue status
   */
  getEmailQueueStatus() {
    return {
      queueLength: this.emailQueue.length,
      isProcessing: this.isProcessingQueue,
      pending: this.emailQueue.filter((item) => item.status === "pending")
        .length,
      failed: this.emailQueue.filter((item) => item.status === "failed").length,
    };
  }

  /**
   * Create email transporter based on environment configuration
   * Uses the centralized mail configuration
   */
  createTransporter() {
    // Check if Brevo (SendinBlue) is configured
    if (process.env.BREVO_API_KEY && process.env.BREVO_SMTP_USER) {
      return nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
        port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_API_KEY,
        },
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });
    }

    // Check if Gmail is configured
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });
    }

    // Check if custom SMTP is configured
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Development mode - use Ethereal for testing
    logger.warn("⚠️ No email service configured. Using development mode.");
    return null;
  }

  /**
   * Send assessment completion notification with PDF attachment
   * NEW: Enhanced method for all assessment types with queue system
   */
  async sendAssessmentCompletionEmail(
    assessmentData,
    childProfile,
    parent,
    assessmentType = "text"
  ) {
    try {
      if (!this.transporter) {
        logger.info(
          "📧 Email service not configured - skipping assessment completion notification"
        );
        return { success: false, reason: "Email service not configured" };
      }

      if (!childProfile || !parent) {
        logger.error(
          "❌ Child profile or parent not found for assessment completion notification"
        );
        return { success: false, reason: "Child profile or parent not found" };
      }

      // Generate PDF report if available
      let pdfAttachment = null;
      try {
        const UniversalPDFService = require("../../services/universal-pdf.service");
        const pdfService = new UniversalPDFService();

        // Generate PDF based on assessment type
        const pdfBuffer = await pdfService.generatePDF("assessment-report", {
          assessmentData,
          childProfile,
          assessmentType,
        });

        pdfAttachment = {
          filename: `${assessmentType}-assessment-${childProfile.firstName}-${new Date().toISOString().split("T")[0]
            }.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        };
      } catch (pdfError) {
        logger.warn(
          "⚠️ PDF generation failed, sending email without attachment:",
          pdfError.message
        );
      }

      const emailContent = this.buildAssessmentCompletionEmailContent(
        assessmentData,
        childProfile,
        parent,
        assessmentType
      );

      const mailOptions = {
        from:
          process.env.BREVO_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          "no-reply@cognikidz.care",
        to: parent.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments: pdfAttachment ? [pdfAttachment] : undefined,
      };

      // Add to email queue for reliable delivery
      const queueId = await this.addToEmailQueue(mailOptions);

      logger.info(
        `✅ Assessment completion email queued (ID: ${queueId}) for ${parent.email} - ${assessmentType} assessment`
      );

      return {
        success: true,
        queueId,
        recipient: parent.email,
        assessmentType,
        pdfAttached: !!pdfAttachment,
      };
    } catch (error) {
      logger.error("❌ Error queuing assessment completion email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build enhanced email content for assessment completion
   * NEW: Professional template with logo and accurate data
   */
  buildAssessmentCompletionEmailContent(
    assessmentData,
    childProfile,
    parent,
    assessmentType
  ) {
    const assessmentTypeDisplay = {
      text: "Text Assessment",
      image: "Image Assessment",
      game: "Game Suite Assessment",
      comprehensive: "Comprehensive Assessment",
    };

    const assessmentEmoji = {
      text: "📝",
      image: "🖼️",
      game: "🎮",
      comprehensive: "📊",
    };

    // Fix undefined last name issue - only show first name if last name is empty/undefined
    const childFullName =
      childProfile.lastName && childProfile.lastName.trim()
        ? `${childProfile.firstName} ${childProfile.lastName}`
        : childProfile.firstName;

    const subject = `${assessmentEmoji[assessmentType]} ${assessmentTypeDisplay[assessmentType]} Complete - ${childFullName}`;

    // Build detailed assessment summary for email
    const buildAssessmentSummary = () => {
      let summary = "";

      // Add accuracy information
      if (assessmentData.accuracyRate !== undefined) {
        summary += `<div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #2e7d32;">📊 Assessment Results</h3>
          <p style="margin: 5px 0;"><strong>Overall Accuracy:</strong> ${assessmentData.accuracyRate
          }%</p>
          <p style="margin: 5px 0;"><strong>Questions Completed:</strong> ${assessmentData.totalQuestions ||
          assessmentData.questionsCompleted ||
          "N/A"
          }</p>
          <p style="margin: 5px 0;"><strong>Average Response Time:</strong> ${assessmentData.averageResponseTime
            ? Math.round(assessmentData.averageResponseTime / 1000) + "s"
            : "N/A"
          }</p>
        </div>`;
      }

      // Add domain scores if available
      if (
        assessmentData.domainScores &&
        assessmentData.domainScores.length > 0
      ) {
        summary += `<div style="margin: 15px 0; padding: 15px; background: #e3f2fd; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #1565c0;">🎯 Domain Performance</h3>
          ${assessmentData.domainScores
            .map(
              (domain) =>
                `<p style="margin: 5px 0;"><strong>${domain.domain}:</strong> ${domain.accuracy || domain.score
                }%</p>`
            )
            .join("")}
        </div>`;
      }

      // Add recommendations if available
      if (
        assessmentData.recommendations &&
        assessmentData.recommendations.length > 0
      ) {
        summary += `<div style="margin: 15px 0; padding: 15px; background: #fff3e0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #ef6c00;">💡 Key Recommendations</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${assessmentData.recommendations
            .map((rec) => `<li style="margin-bottom: 5px;">${rec}</li>`)
            .join("")}
          </ul>
        </div>`;
      }

      // Add AI analysis if available
      if (assessmentData.fullAIAnalysis) {
        const ai = assessmentData.fullAIAnalysis;
        summary += `<div style="margin: 15px 0; padding: 15px; background: #f3e5f5; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #7b1fa2;">🤖 AI Analysis</h3>
          ${ai.summary
            ? `<p style="margin: 5px 0;"><strong>Summary:</strong> ${ai.summary}</p>`
            : ""
          }
          ${ai.interpretation
            ? `<p style="margin: 5px 0;"><strong>Interpretation:</strong> ${ai.interpretation}</p>`
            : ""
          }
          ${ai.keyFindings && ai.keyFindings.length > 0
            ? `<div style="margin: 10px 0;">
              <strong>Key Findings:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${ai.keyFindings
              .map(
                (finding) =>
                  `<li style="margin-bottom: 3px;">${finding}</li>`
              )
              .join("")}
              </ul>
            </div>`
            : ""
          }
        </div>`;
      }

      return summary;
    };

    const assessmentSummary = buildAssessmentSummary();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1E293B; 
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F5F3FF 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px -3px rgba(99, 102, 241, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .header {
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1), transparent 50%);
      pointer-events: none;
    }
    .logo {
      width: 140px;
      height: auto;
      margin-bottom: 20px;
      filter: brightness(0) invert(1);
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header p {
      font-size: 18px;
      opacity: 0.95;
      margin: 0;
    }
    .content {
      padding: 50px 40px;
    }
    .completion-badge {
      display: inline-block;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 12px 28px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 30px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 10px -2px rgba(16, 185, 129, 0.3);
    }
    .child-info {
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
      padding: 25px;
      border-radius: 16px;
      margin: 25px 0;
      border-left: 4px solid #6366F1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .assessment-summary {
      background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
      padding: 30px;
      border-radius: 16px;
      margin: 30px 0;
      border-left: 4px solid #10B981;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .key-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .metric {
      background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
      padding: 20px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.1);
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #6366F1;
      display: block;
    }
    .metric-label {
      font-size: 14px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
    }
    .recommendations {
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
      padding: 30px;
      border-radius: 16px;
      margin: 30px 0;
      border-left: 4px solid #F59E0B;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      color: #ffffff !important;
      padding: 18px 35px;
      text-decoration: none !important;
      border-radius: 25px;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
    }
    .cta-button * {
      color: #ffffff !important;
      text-decoration: none !important;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px -5px rgba(99, 102, 241, 0.4);
    }
    .footer {
      background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
      padding: 35px;
      text-align: center;
      border-top: 1px solid rgba(226, 232, 240, 0.8);
    }
    .footer-text {
      color: #64748B;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .company-info {
      color: #94A3B8;
      font-size: 14px;
    }
    .pdf-notice {
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      padding: 20px;
      border-radius: 16px;
      margin: 25px 0;
      border-left: 4px solid #3B82F6;
      font-size: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    @media (max-width: 768px) {
      .email-container { margin: 0 10px; border-radius: 20px; }
      .content { padding: 30px 20px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 28px; }
      .key-metrics { grid-template-columns: 1fr; }
      .logo { width: 120px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${process.env.FRONTEND_URL || "https://cognikidz.care"}/LOGO.png" alt="CogniKidz Logo" class="logo" />
      <h1>Assessment Complete! 🎉</h1>
      <p>${childFullName} has successfully completed their ${assessmentTypeDisplay[assessmentType]
      }</p>
    </div>
    
    <div class="content">
      <div class="completion-badge">
        ✅ Assessment Successfully Completed
      </div>
      
      <div class="child-info">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Child Information</h3>
        <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.8;">
          <strong>Name:</strong> ${childFullName}<br>
          <strong>Age:</strong> ${childProfile.age} years old<br>
          <strong>Assessment Type:</strong> ${assessmentTypeDisplay[assessmentType]
      }<br>
          <strong>Completed:</strong> ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
        </p>
      </div>

      <div class="assessment-summary">
        <h3 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 18px;">📊 Assessment Summary</h3>
        <p style="margin: 0; color: #2e7d32; line-height: 1.8; font-size: 16px;">
          ${assessmentData.summary ||
      "A comprehensive evaluation has been completed covering multiple cognitive domains and behavioral patterns."
      }
        </p>
      </div>

      ${assessmentSummary}

      ${assessmentData.domainScores
        ? `
      <div class="key-metrics">
        ${assessmentData.domainScores
          .map(
            (domain) => `
          <div class="metric">
            <span class="metric-value">${domain.score}/10</span>
            <span class="metric-label">${domain.domain}</span>
          </div>
        `
          )
          .join("")}
      </div>
      `
        : ""
      }

      ${assessmentData.recommendations &&
        assessmentData.recommendations.length > 0
        ? `
      <div class="recommendations">
        <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 18px;">💡 Key Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 16px; line-height: 1.8;">
          ${assessmentData.recommendations
          .map((rec) => `<li style="margin-bottom: 10px;">${rec}</li>`)
          .join("")}
        </ul>
      </div>
      `
        : ""
      }

      <div class="pdf-notice">
        📎 A detailed PDF report is attached to this email for your records.
        <br><small style="color: #666; font-size: 12px;">If no PDF is attached, the detailed assessment information is included in this email above.</small>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || "https://cognikidz.care"
      }/dashboard?childId=${childProfile._id}" 
           class="cta-button" style="color: #ffffff !important; text-decoration: none;">
          📊 View Full Report & Dashboard
        </a>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        Thank you for using CogniKidz for your child's development journey.
      </div>
      <div class="company-info">
        © 2025 CogniKidz. All rights reserved.<br>
        Empowering young minds through innovative learning solutions.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
🎉 Assessment Complete - CogniKidz

${childFullName} has successfully completed their ${assessmentTypeDisplay[assessmentType]
      }.

Child Information:
- Name: ${childFullName}
- Age: ${childProfile.age} years old
- Assessment Type: ${assessmentTypeDisplay[assessmentType]}
- Completed: ${new Date().toLocaleDateString()}

Assessment Summary:
${assessmentData.summary ||
      "A comprehensive evaluation has been completed covering multiple cognitive domains and behavioral patterns."
      }

${(() => {
        let textSummary = "";

        // Add accuracy information
        if (assessmentData.accuracyRate !== undefined) {
          textSummary += `
📊 Assessment Results:
- Overall Accuracy: ${assessmentData.accuracyRate}%
- Questions Completed: ${assessmentData.totalQuestions ||
            assessmentData.questionsCompleted ||
            "N/A"
            }
- Average Response Time: ${assessmentData.averageResponseTime
              ? Math.round(assessmentData.averageResponseTime / 1000) + "s"
              : "N/A"
            }
`;
        }

        // Add domain scores if available
        if (assessmentData.domainScores && assessmentData.domainScores.length > 0) {
          textSummary += `
🎯 Domain Performance:
${assessmentData.domainScores
              .map((domain) => `- ${domain.domain}: ${domain.accuracy || domain.score}%`)
              .join("\n")}
`;
        }

        // Add recommendations if available
        if (
          assessmentData.recommendations &&
          assessmentData.recommendations.length > 0
        ) {
          textSummary += `
💡 Key Recommendations:
${assessmentData.recommendations.map((rec) => `• ${rec}`).join("\n")}
`;
        }

        // Add AI analysis if available
        if (assessmentData.fullAIAnalysis) {
          const ai = assessmentData.fullAIAnalysis;
          textSummary += `
🤖 AI Analysis:
${ai.summary ? `Summary: ${ai.summary}` : ""}
${ai.interpretation ? `Interpretation: ${ai.interpretation}` : ""}
${ai.keyFindings && ai.keyFindings.length > 0
              ? `Key Findings:\n${ai.keyFindings
                .map((finding) => `• ${finding}`)
                .join("\n")}`
              : ""
            }
`;
        }

        return textSummary;
      })()}

A detailed PDF report is attached to this email for your records.

View the full report and dashboard at: ${process.env.FRONTEND_URL || "https://cognikidz.care"
      }/dashboard?childId=${childProfile._id}

Thank you for using CogniKidz!
© 2025 CogniKidz. All rights reserved.
    `;

    return { subject, html, text };
  }

  /**
   * Send notification for high-priority reports
   * ENHANCED: Uses email queue system
   */
  async sendHighPriorityNotification(report) {
    try {
      if (!this.transporter) {
        logger.info("📧 Email service not configured - skipping notification");
        return { success: false, reason: "Email service not configured" };
      }

      const child = await ChildProfile.findById(report.childId);
      const parent = await User.findById(report.parentId);

      if (!child || !parent) {
        logger.error("❌ Child or parent not found for report notification");
        return { success: false, reason: "Child or parent not found" };
      }

      const emailContent = this.buildEmailContent(report, child, parent);

      const mailOptions = {
        from:
          process.env.BREVO_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          "no-reply@cognikidz.care",
        to: parent.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      // Add to email queue for reliable delivery
      const queueId = await this.addToEmailQueue(mailOptions);

      // Mark report as email sent
      await report.markEmailSent();

      logger.info(
        `✅ High-priority report email queued (ID: ${queueId}) for ${parent.email}`
      );

      return {
        success: true,
        queueId,
        recipient: parent.email,
      };
    } catch (error) {
      logger.error("❌ Error queuing high-priority notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send weekly digest of reports
   */
  async sendWeeklyDigest(parentId, reports) {
    try {
      if (!this.transporter) {
        logger.info("📧 Email service not configured - skipping weekly digest");
        return { success: false, reason: "Email service not configured" };
      }

      const parent = await User.findById(parentId);
      if (!parent) {
        logger.error("❌ Parent not found for weekly digest");
        return { success: false, reason: "Parent not found" };
      }

      const children = await ChildProfile.find({ parent: parentId });
      const emailContent = this.buildWeeklyDigestContent(
        reports,
        children,
        parent
      );

      const mailOptions = {
        from:
          process.env.BREVO_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          "no-reply@cognikidz.care",
        to: parent.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info(`✅ Weekly digest sent to ${parent.email}`);

      return {
        success: true,
        messageId: result.messageId,
        recipient: parent.email,
        reportCount: reports.length,
      };
    } catch (error) {
      logger.error("❌ Error sending weekly digest:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build email content for individual report notifications
   * ENHANCED: Professional template with logo and accurate data
   */
  buildEmailContent(report, child, parent) {
    const priorityEmoji = {
      low: "📝",
      medium: "📊",
      high: "⚠️",
      critical: "🚨",
    };

    const reportTypeDisplay = {
      "mini-report": "Progress Update",
      "suite-progress-report": "Assessment Suite Report",
      "comprehensive-assessment-report": "Comprehensive Assessment Report",
      "progress-alert-report": "Progress Alert",
      "concern-alert-report": "Attention Needed",
    };

    const subject = `${priorityEmoji[report.priority]} ${reportTypeDisplay[report.reportType]
      } - ${child.firstName} ${child.lastName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1E293B; 
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F5F3FF 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px -3px rgba(99, 102, 241, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .header {
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1), transparent 50%);
      pointer-events: none;
    }
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 20px;
      filter: brightness(0) invert(1);
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .priority-badge {
      display: inline-block;
      padding: 10px 24px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 25px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.2);
    }
    .priority-high { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; }
    .priority-critical { background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; }
    .priority-medium { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; }
    .priority-low { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; }
    .child-info {
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
      padding: 25px;
      border-radius: 16px;
      margin: 25px 0;
      border-left: 4px solid #6366F1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .insights {
      background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
      padding: 25px;
      border-radius: 16px;
      margin: 25px 0;
      border-left: 4px solid #10B981;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .recommendations {
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
      padding: 25px;
      border-radius: 16px;
      margin: 25px 0;
      border-left: 4px solid #F59E0B;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      margin: 25px 0;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px -5px rgba(99, 102, 241, 0.4);
    }
    .footer {
      background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
      padding: 30px;
      text-align: center;
      border-top: 1px solid rgba(226, 232, 240, 0.8);
    }
    .footer-text {
      color: #64748B;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .company-info {
      color: #94A3B8;
      font-size: 12px;
    }
    @media (max-width: 600px) {
      .email-container { margin: 0 10px; border-radius: 20px; }
      .content { padding: 30px 20px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${process.env.FRONTEND_URL || "https://cognikidz.care"}/LOGO.png" alt="CogniKidz Logo" class="logo" />
      <h1>CogniKidz Assessment Report</h1>
      <p>New report available for ${child.firstName}</p>
    </div>
    
    <div class="content">
      <div class="priority-badge priority-${report.priority}">
        ${priorityEmoji[report.priority]
      } ${report.priority.toUpperCase()} PRIORITY
      </div>
      
      <div class="child-info">
        <h3 style="margin: 0 0 10px 0; color: #333;">Child Information</h3>
        <p style="margin: 0; color: #666;">
          <strong>Name:</strong> ${child.firstName} ${child.lastName}<br>
          <strong>Age:</strong> ${child.age} years old<br>
          <strong>Report Type:</strong> ${reportTypeDisplay[report.reportType]
      }<br>
          <strong>Generated:</strong> ${new Date(
        report.generatedAt
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
        </p>
      </div>
      
      <h2 style="margin: 25px 0 15px 0; color: #333;">${report.content.title
      }</h2>
      
      <div class="insights">
        <h3 style="margin: 0 0 15px 0; color: #2e7d32;">📋 Summary</h3>
        <p style="margin: 0; color: #2e7d32; line-height: 1.6;">${report.content.summary
      }</p>
      </div>
      
      ${report.content.insights && report.content.insights.length > 0
        ? `
      <div class="insights">
        <h3 style="margin: 0 0 15px 0; color: #2e7d32;">🔍 Key Insights</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
          ${report.content.insights
          .map((insight) => `<li style="margin-bottom: 8px;">${insight}</li>`)
          .join("")}
        </ul>
      </div>
      `
        : ""
      }
      
      ${report.content.recommendations &&
        report.content.recommendations.length > 0
        ? `
      <div class="recommendations">
        <h3 style="margin: 0 0 15px 0; color: #856404;">💡 Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px; color: #856404;">
          ${report.content.recommendations
          .map((rec) => `<li style="margin-bottom: 8px;">${rec}</li>`)
          .join("")}
        </ul>
      </div>
      `
        : ""
      }
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || "https://cognikidz.care"
      }/dashboard/reports/${report._id}" 
           class="cta-button">
          📊 View Full Report
        </a>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        This report was generated automatically based on ${child.firstName
      }'s assessment activity.
      </div>
      <div class="company-info">
        © 2025 CogniKidz. All rights reserved.<br>
        Empowering young minds through innovative learning solutions.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
CogniKidz Assessment Report - ${child.firstName} ${child.lastName}

Report Type: ${reportTypeDisplay[report.reportType]}
Priority: ${report.priority.toUpperCase()}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}

Child Information:
- Name: ${child.firstName} ${child.lastName}
- Age: ${child.age} years old

Summary:
${report.content.summary}

${report.content.insights && report.content.insights.length > 0
        ? `
Key Insights:
${report.content.insights.map((insight) => `• ${insight}`).join("\n")}
`
        : ""
      }

${report.content.recommendations && report.content.recommendations.length > 0
        ? `
Recommendations:
${report.content.recommendations.map((rec) => `• ${rec}`).join("\n")}
`
        : ""
      }

View the full report at: ${process.env.FRONTEND_URL || "https://cognikidz.care"
      }/dashboard/reports/${report._id}

This report was generated automatically based on ${child.firstName
      }'s assessment activity.
© 2025 CogniKidz. All rights reserved.
    `;

    return { subject, html, text };
  }

  /**
   * Build weekly digest email content
   */
  buildWeeklyDigestContent(reports, children, parent) {
    const subject = `📊 Weekly Assessment Summary - ${children.length} ${children.length === 1 ? "Child" : "Children"
      }`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1E293B; 
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F5F3FF 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px -3px rgba(99, 102, 241, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1), transparent 50%);
      pointer-events: none;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      margin: 0;
    }
    .content { 
      background: transparent; 
      padding: 40px 30px; 
    }
    .child-section { 
      margin: 25px 0; 
      padding: 25px; 
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%); 
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border-left: 4px solid #6366F1;
    }
    .child-section h3 {
      color: #1E293B;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .report-item { 
      margin: 15px 0; 
      padding: 20px; 
      background: rgba(255, 255, 255, 0.8); 
      border-radius: 12px; 
      border-left: 4px solid #6366F1;
      box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
    }
    .report-item strong {
      color: #1E293B;
      font-weight: 600;
    }
    .report-item p {
      color: #64748B;
      margin: 8px 0;
    }
    .report-item small {
      color: #94A3B8;
      font-size: 12px;
    }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); 
      color: white; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 25px; 
      margin: 25px 0;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px -5px rgba(99, 102, 241, 0.4);
    }
    .footer { 
      text-align: center; 
      color: #64748B; 
      font-size: 14px; 
      padding: 30px; 
      background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
      border-top: 1px solid rgba(226, 232, 240, 0.8);
      margin-top: 0;
    }
    .footer p {
      margin-bottom: 10px;
    }
    @media (max-width: 600px) {
      .email-container { margin: 0 10px; border-radius: 20px; }
      .content { padding: 30px 20px; }
      .header { padding: 30px 20px; }
      .child-section { padding: 20px; }
      .report-item { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
<body>
  <div class="header">
    <h1>📊 Weekly Assessment Summary</h1>
    <p>Your children's progress this week</p>
  </div>
  
  <div class="content">
    <p>Hello ${parent.name || "Parent"},</p>
    <p>Here's a summary of assessment activity for your ${children.length} ${children.length === 1 ? "child" : "children"
      } this week:</p>
    
    ${children
        .map((child) => {
          const childReports = reports.filter(
            (r) => r.childId.toString() === child._id.toString()
          );
          return `
        <div class="child-section">
          <h3>${child.firstName} ${child.lastName} (${child.age} years old)</h3>
          <p><strong>${childReports.length} report${childReports.length === 1 ? "" : "s"
            } generated this week</strong></p>
          
          ${childReports
              .map(
                (report) => `
            <div class="report-item">
              <strong>${report.content.title}</strong>
              <p>${report.content.summary}</p>
              <small>Generated: ${new Date(
                  report.generatedAt
                ).toLocaleDateString()}</small>
            </div>
          `
              )
              .join("")}
          
          ${childReports.length === 0 ? "<p>No new reports this week.</p>" : ""}
        </div>
      `;
        })
        .join("")}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || "https://cognikidz.com"
      }/dashboard/reports" 
         class="cta-button">
        View All Reports
      </a>
    </div>
  </div>
  
  <div class="footer">
    <p>This weekly summary is sent automatically to keep you informed of your children's progress.</p>
    <p>To manage your email preferences, visit your account settings.</p>
    <p>© 2025 CogniKidz. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    const text = `
Weekly Assessment Summary - CogniKidz

Hello ${parent.name || "Parent"},

Here's a summary of assessment activity for your ${children.length} ${children.length === 1 ? "child" : "children"
      } this week:

${children
        .map((child) => {
          const childReports = reports.filter(
            (r) => r.childId.toString() === child._id.toString()
          );
          return `
${child.firstName} ${child.lastName} (${child.age} years old)
${childReports.length} report${childReports.length === 1 ? "" : "s"
            } generated this week

${childReports
              .map(
                (report) => `
- ${report.content.title}
  ${report.content.summary}
  Generated: ${new Date(report.generatedAt).toLocaleDateString()}
`
              )
              .join("")}

${childReports.length === 0 ? "No new reports this week." : ""}
`;
        })
        .join("")}

View all reports at: ${process.env.FRONTEND_URL || "https://cognikidz.com"
      }/dashboard/reports

This weekly summary is sent automatically to keep you informed of your children's progress.
To manage your email preferences, visit your account settings.
    `;

    return { subject, html, text };
  }

  /**
   * Send notification for critical concerns
   */
  async sendCriticalConcernNotification(report) {
    try {
      if (!this.transporter) {
        console.log(
          "📧 Email service not configured - skipping critical concern notification"
        );
        return { success: false, reason: "Email service not configured" };
      }

      const child = await ChildProfile.findById(report.childId);
      const parent = await User.findById(report.parentId);

      if (!child || !parent) {
        console.error(
          "❌ Child or parent not found for critical concern notification"
        );
        return { success: false, reason: "Child or parent not found" };
      }

      const emailContent = this.buildCriticalConcernContent(
        report,
        child,
        parent
      );

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@cognikidz.com",
        to: parent.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: "high",
      };

      const result = await this.transporter.sendMail(mailOptions);

      // Mark report as email sent
      await report.markEmailSent();

      console.log(`🚨 Critical concern notification sent to ${parent.email}`);

      return {
        success: true,
        messageId: result.messageId,
        recipient: parent.email,
      };
    } catch (error) {
      console.error("❌ Error sending critical concern notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build critical concern email content
   */
  buildCriticalConcernContent(report, child, parent) {
    const subject = `🚨 Important: Assessment Update for ${child.firstName} - Action Recommended`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1E293B; 
      background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 50%, #FCA5A5 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px -3px rgba(239, 68, 68, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1), transparent 50%);
      pointer-events: none;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      margin: 0;
    }
    .content { 
      background: transparent; 
      padding: 40px 30px; 
    }
    .alert-box { 
      background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%); 
      border: 1px solid #EF4444; 
      border-radius: 16px; 
      padding: 25px; 
      margin: 25px 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .recommendations { 
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); 
      padding: 25px; 
      border-radius: 16px; 
      margin: 25px 0; 
      border-left: 4px solid #F59E0B;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
      color: white; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 25px; 
      margin: 25px 0;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px -5px rgba(239, 68, 68, 0.4);
    }
    .footer { 
      text-align: center; 
      color: #64748B; 
      font-size: 14px; 
      padding: 30px; 
      background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
      border-top: 1px solid rgba(226, 232, 240, 0.8);
      margin-top: 0;
    }
    .footer p {
      margin-bottom: 10px;
    }
    @media (max-width: 600px) {
      .email-container { margin: 0 10px; border-radius: 20px; }
      .content { padding: 30px 20px; }
      .header { padding: 30px 20px; }
      .alert-box { padding: 20px; }
      .recommendations { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
<body>
  <div class="header">
    <h1>🚨 Important Assessment Update</h1>
    <p>Action recommended for ${child.firstName}</p>
  </div>
  
  <div class="content">
    <div class="alert-box">
      <h2>⚠️ Attention Required</h2>
      <p>Our assessment system has detected patterns that may require your attention for ${child.firstName
      }.</p>
    </div>
    
    <h3>${report.content.title}</h3>
    <p>${report.content.summary}</p>
    
    <div class="recommendations">
      <h3>📋 Immediate Recommendations</h3>
      <ul>
        ${report.content.recommendations
        .map((rec) => `<li>${rec}</li>`)
        .join("")}
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || "https://cognikidz.com"
      }/dashboard/reports/${report._id}" 
         class="cta-button">
        View Full Report & Next Steps
      </a>
    </div>
    
    <p><strong>Please note:</strong> This is an automated analysis. While our system is designed to identify important patterns, professional consultation is recommended for comprehensive evaluation.</p>
  </div>
  
  <div class="footer">
    <p>If you have immediate concerns, please contact your healthcare provider or call our support team.</p>
    <p>© 2025 CogniKidz. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    const text = `
🚨 IMPORTANT: Assessment Update for ${child.firstName}

Attention Required: Our assessment system has detected patterns that may require your attention for ${child.firstName
      }.

${report.content.title}
${report.content.summary}

Immediate Recommendations:
${report.content.recommendations.map((rec) => `- ${rec}`).join("\n")}

View the full report and next steps at: ${process.env.FRONTEND_URL || "https://cognikidz.com"
      }/dashboard/reports/${report._id}

PLEASE NOTE: This is an automated analysis. While our system is designed to identify important patterns, professional consultation is recommended for comprehensive evaluation.

If you have immediate concerns, please contact your healthcare provider or call our support team.
    `;

    return { subject, html, text };
  }

  /**
   * Check and send pending notifications
   */
  async processPendingNotifications() {
    try {
      console.log("📧 Processing pending report notifications...");

      const pendingReports = await Report.findPendingNotifications();

      for (const report of pendingReports) {
        if (report.priority === "critical") {
          await this.sendCriticalConcernNotification(report);
        } else if (report.priority === "high") {
          await this.sendHighPriorityNotification(report);
        }

        // Add delay between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(
        `✅ Processed ${pendingReports.length} pending notifications`
      );
    } catch (error) {
      console.error("❌ Error processing pending notifications:", error);
    }
  }

  /**
   * Test email functionality
   * NEW: Method to test email configuration and delivery
   */
  async testEmailSystem(testEmail = null) {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: "Email service not configured",
          config: this.getEmailConfiguration(),
        };
      }

      const testMailOptions = {
        from:
          process.env.BREVO_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          "no-reply@cognikidz.care",
        to: testEmail || process.env.TEST_EMAIL || "test@example.com",
        subject: "🧪 CogniKidz Email System Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">✅ Email System Test Successful</h2>
            <p>This is a test email to verify the CogniKidz email notification system is working correctly.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Timestamp: ${new Date().toISOString()}</li>
              <li>Service: ${this.getEmailConfiguration().service}</li>
              <li>Queue Status: ${JSON.stringify(
          this.getEmailQueueStatus()
        )}</li>
            </ul>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              © 2025 CogniKidz. All rights reserved.
            </p>
          </div>
        `,
        text: `
CogniKidz Email System Test

✅ Email System Test Successful

This is a test email to verify the CogniKidz email notification system is working correctly.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Service: ${this.getEmailConfiguration().service}
- Queue Status: ${JSON.stringify(this.getEmailQueueStatus())}

© 2025 CogniKidz. All rights reserved.
        `,
      };

      // Add to email queue for testing
      const queueId = await this.addToEmailQueue(testMailOptions);

      return {
        success: true,
        queueId,
        message: "Test email queued successfully",
        config: this.getEmailConfiguration(),
        queueStatus: this.getEmailQueueStatus(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        config: this.getEmailConfiguration(),
        queueStatus: this.getEmailQueueStatus(),
      };
    }
  }

  /**
   * Get email configuration status
   * ENHANCED: Includes queue status
   */
  async getEmailConfiguration() {
    try {
      if (!this.transporter) {
        return {
          configured: false,
          service: "none",
          message: "No email service configured",
          queueStatus: this.getEmailQueueStatus(),
        };
      }

      // Test the connection
      await this.transporter.verify();

      const service = process.env.BREVO_API_KEY
        ? "brevo"
        : process.env.GMAIL_USER
          ? "gmail"
          : process.env.SMTP_HOST
            ? "smtp"
            : "unknown";

      return {
        configured: true,
        service: service,
        message: "Email service configured and working",
        queueStatus: this.getEmailQueueStatus(),
      };
    } catch (error) {
      return {
        configured: false,
        service: "error",
        message: error.message,
        queueStatus: this.getEmailQueueStatus(),
      };
    }
  }

  /**
   * Send progressive suite report notification
   * ENHANCED: Uses email queue system
   */
  async sendProgressiveSuiteReport(report, childProfile) {
    try {
      if (!this.transporter) {
        logger.info(
          "📧 Email service not configured - skipping progressive suite notification"
        );
        return { success: false, reason: "Email service not configured" };
      }

      const parent = await User.findById(childProfile.parent);
      if (!parent) {
        logger.error("❌ Parent not found for progressive suite notification");
        return { success: false, reason: "Parent not found" };
      }

      const emailContent = this.buildProgressiveSuiteEmailContent(
        report,
        childProfile,
        parent
      );

      const mailOptions = {
        from:
          process.env.BREVO_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          "no-reply@cognikidz.care",
        to: parent.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      // Add to email queue for reliable delivery
      const queueId = await this.addToEmailQueue(mailOptions);

      logger.info(
        `✅ Progressive suite report email queued (ID: ${queueId}) for ${parent.email}`
      );

      return {
        success: true,
        queueId,
        recipient: parent.email,
      };
    } catch (error) {
      logger.error("❌ Error sending progressive suite notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build email content for progressive suite reports
   */
  buildProgressiveSuiteEmailContent(report, childProfile, parent) {
    const subject = `🎮 ${childProfile.firstName}'s Progressive Assessment Report - Complete Analysis`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
    .celebration { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .insights { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
    .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #eee; margin-top: 30px; }
    .game-analysis { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .metric { display: inline-block; margin: 5px 15px 5px 0; }
    .metric-value { font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">🎮 Progressive Assessment Complete!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
      ${childProfile.firstName
      } has completed their comprehensive assessment suite
    </p>
  </div>
  
  <div class="content">
    <div class="celebration">
      <h2 style="margin: 0 0 10px 0; color: #856404;">🎉 Congratulations!</h2>
      <p style="margin: 0; color: #856404;">
        ${childProfile.firstName
      } has successfully completed all games in the progressive assessment suite. 
        This comprehensive evaluation provides valuable insights into their cognitive and behavioral development.
      </p>
    </div>

    <div class="summary">
      <h3 style="margin: 0 0 15px 0; color: #333;">📊 Assessment Summary</h3>
      <p style="margin: 0 0 10px 0; color: #666;">
        ${report.content.summary ||
      "A comprehensive behavioral analysis has been completed covering multiple cognitive domains and learning patterns."
      }
      </p>
      
      <div style="margin: 15px 0;">
        <span class="metric">📈 Total Games: <span class="metric-value">${report.trigger?.metadata?.totalGames || "5"
      }</span></span>
        <span class="metric">🎯 Total Score: <span class="metric-value">${report.trigger?.metadata?.totalScore || "N/A"
      }</span></span>
        <span class="metric">⏱️ Duration: <span class="metric-value">${report.trigger?.metadata?.totalDuration
        ? Math.round(report.trigger.metadata.totalDuration / 60) + " min"
        : "N/A"
      }</span></span>
      </div>
    </div>

    ${report.content.sections
        ? report.content.sections
          .map(
            (section) => `
      <div class="game-analysis">
        <h4 style="margin: 0 0 10px 0; color: #333;">${section.heading}</h4>
        <p style="margin: 0; color: #666; line-height: 1.5;">
          ${section.content}
        </p>
      </div>
    `
          )
          .join("")
        : ""
      }

    ${report.content.insights && report.content.insights.length > 0
        ? `
      <div class="insights">
        <h3 style="margin: 0 0 15px 0; color: #2e7d32;">🔍 Key Insights</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
          ${report.content.insights
          .map((insight) => `<li style="margin-bottom: 8px;">${insight}</li>`)
          .join("")}
        </ul>
      </div>
    `
        : ""
      }

    ${report.content.recommendations &&
        report.content.recommendations.length > 0
        ? `
      <div class="recommendations">
        <h3 style="margin: 0 0 15px 0; color: #856404;">💡 Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px; color: #856404;">
          ${report.content.recommendations
          .map((rec) => `<li style="margin-bottom: 8px;">${rec}</li>`)
          .join("")}
        </ul>
      </div>
    `
        : ""
      }

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || "https://cognikidz.care"
      }/dashboard?childId=${childProfile._id}" class="cta-button">
        📊 View Full Report & Dashboard
      </a>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        📎 A detailed PDF report is available in your dashboard.
        <br>This comprehensive analysis includes behavioral patterns, learning preferences, and personalized recommendations.
      </p>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for using CogniKidz for your child's development journey.</p>
    <p>© 2025 CogniKidz. All rights reserved.</p>
  </div>
</body>
</html>`;

    const text = `
🎮 Progressive Assessment Complete!

${childProfile.firstName
      } has successfully completed their comprehensive assessment suite.

Assessment Summary:
${report.content.summary ||
      "A comprehensive behavioral analysis has been completed."
      }

Key Insights:
${report.content.insights
        ? report.content.insights.map((insight) => `• ${insight}`).join("\n")
        : "No specific insights available"
      }

Recommendations:
${report.content.recommendations
        ? report.content.recommendations.map((rec) => `• ${rec}`).join("\n")
        : "No specific recommendations available"
      }

View the full report and dashboard at: ${process.env.FRONTEND_URL || "https://cognikidz.care"
      }/dashboard?childId=${childProfile._id}

Thank you for using CogniKidz!
`;

    return { subject, html, text };
  }
}

module.exports = new EmailNotificationService();
