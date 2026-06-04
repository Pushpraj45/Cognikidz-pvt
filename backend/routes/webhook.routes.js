const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const RazorpayService = require('../domains/pricing/razorpay.service');

// Use built-in fetch for Node.js 18+ or alternative for older versions
const fetch =
  global.fetch ||
  (() => {
    try {
      return require("node-fetch");
    } catch (error) {
      logger.warn("node-fetch not available, using native fetch");
      return global.fetch;
    }
  })();

/**
 * Vercel deployment webhook handler
 * @route POST /api/webhooks/vercel/deployment
 * @access Public (but secured with webhook secret)
 */
router.post("/vercel/deployment", async (req, res) => {
  try {
    const { payload, type } = req.body;

    logger.info("Received Vercel webhook:", {
      type,
      payload: payload || req.body,
    });

    // Validate webhook payload
    if (!payload && !req.body.deployment) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload",
      });
    }

    // Handle different Vercel webhook types
    const deploymentData = payload || req.body;
    const webhookType = type || req.body.type || "deployment";

    // Send notification to Google Chat
    await sendVercelNotificationToChat(deploymentData, webhookType);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    logger.error("Vercel webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
});

/**
 * Send Vercel deployment notification to Google Chat
 */
async function sendVercelNotificationToChat(deploymentData, webhookType) {
  try {
    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.warn("Google Chat webhook URL not configured");
      return;
    }

    // Extract deployment information
    const deployment = deploymentData.deployment || deploymentData;
    const project = deploymentData.project || {};
    const user = deploymentData.user || deployment.creator || {};

    // Determine deployment status and color
    let statusText, statusIcon, color;

    switch (deployment.state || deployment.status) {
      case "READY":
      case "ready":
        statusText = "DEPLOYED";
        statusIcon = "🚀";
        color = "#2CBE4E";
        break;
      case "ERROR":
      case "error":
        statusText = "FAILED";
        statusIcon = "❌";
        color = "#EA4335";
        break;
      case "BUILDING":
      case "building":
        statusText = "BUILDING";
        statusIcon = "🔧";
        color = "#F0B400";
        break;
      case "CANCELED":
      case "canceled":
        statusText = "CANCELED";
        statusIcon = "⚠️";
        color = "#EA4335";
        break;
      default:
        statusText = (
          deployment.state ||
          deployment.status ||
          "UNKNOWN"
        ).toUpperCase();
        statusIcon = "📦";
        color = "#4285F4";
    }

    // Create status badge
    const statusBadge = `<font color="#FFFFFF"><b><span style="background-color:${color};padding:4px 8px;border-radius:12px">${statusIcon} ${statusText}</span></b></font>`;

    // Format timestamp
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return "N/A";
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    // Calculate duration if possible
    const formatDuration = (start, end) => {
      if (!start || !end) return "N/A";
      const duration = new Date(end) - new Date(start);
      const seconds = Math.floor(duration / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    };

    // Prepare deployment details
    const details = [
      ["Project", project.name || deployment.name || "Unknown"],
      ["Environment", deployment.target || "production"],
      ["Created", formatTimestamp(deployment.createdAt || deployment.created)],
      ["Status", statusText],
    ];

    // Add completion time and duration for finished deployments
    if (deployment.state === "READY" || deployment.state === "ERROR") {
      if (deployment.ready || deployment.completedAt) {
        details.push([
          "Completed",
          formatTimestamp(deployment.ready || deployment.completedAt),
        ]);
        const duration = formatDuration(
          deployment.createdAt || deployment.created,
          deployment.ready || deployment.completedAt
        );
        if (duration !== "N/A") {
          details.push(["Duration", duration]);
        }
      }
    }

    // Add branch/commit info if available
    if (deployment.meta && deployment.meta.githubCommitRef) {
      details.push(["Branch", deployment.meta.githubCommitRef]);
    }
    if (deployment.meta && deployment.meta.githubCommitMessage) {
      details.push(["Commit", deployment.meta.githubCommitMessage]);
    }
    if (deployment.meta && deployment.meta.githubCommitAuthorName) {
      details.push(["Author", deployment.meta.githubCommitAuthorName]);
    }

    // Prepare buttons
    const buttons = [];

    if (deployment.url) {
      buttons.push({
        textButton: {
          text: "🌐 VIEW DEPLOYMENT",
          onClick: { openLink: { url: `https://${deployment.url}` } },
        },
      });
    }

    if (deployment.inspectorUrl) {
      buttons.push({
        textButton: {
          text: "🔍 DEPLOYMENT LOGS",
          onClick: { openLink: { url: deployment.inspectorUrl } },
        },
      });
    }

    // Create the message
    const message = {
      cards: [
        {
          header: {
            title: `${statusBadge} Vercel Deployment`,
            subtitle: `Project: ${project.name || deployment.name || "Unknown"}`,
            imageUrl:
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || "Vercel")}&background=${color.replace("#", "")}&color=fff&size=128`,
            imageStyle: "AVATAR",
          },
          sections: [
            {
              header: "<b>📋 DEPLOYMENT DETAILS</b>",
              widgets: details.map(([label, value]) => ({
                keyValue: {
                  topLabel: `<font color="#666666">${label}</font>`,
                  content: `<b>${value || "N/A"}</b>`,
                  contentMultiline: true,
                },
              })),
            },
            ...(buttons.length > 0
              ? [
                  {
                    widgets: [{ buttons: buttons }],
                  },
                ]
              : []),
          ],
        },
      ],
    };

    // Send the notification
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chat notification failed: ${response.status} - ${errorText}`
      );
    }

    logger.info(
      "Vercel deployment notification sent to Google Chat successfully"
    );
  } catch (error) {
    logger.error("Error sending Vercel notification to chat:", error);
    throw error;
  }
}

module.exports = router;

/**
 * Razorpay Webhook Handler
 * @route POST /api/webhooks/razorpay
 */
router.post('/razorpay', (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payloadRaw = req.rawBody || JSON.stringify(req.body);
    const verified = RazorpayService.verifyWebhookSignature({ payload: payloadRaw, signature });

    if (!verified) {
      logger.warn('Razorpay webhook signature verification failed');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;
    logger.info('Razorpay webhook received', { eventType: event.event, payload: event });

    // We could handle specific events here (payment.authorized, payment.captured, order.paid, etc.)
    // For now, acknowledge receipt. Purchase status is updated on verify endpoint.
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Razorpay webhook error:', error);
    return res.status(500).json({ success: false });
  }
});
