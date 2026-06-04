const feedbackService = require("./service");
const logger = require("../../utils/logger");

class FeedbackController {
  async createFeedback(req, res) {
    try {
      logger.info("POST /api/feedback/submit");
      logger.info("Request body:", JSON.stringify(req.body, null, 2));

      const feedbackData = req.body;

      // Validate required fields
      if (!feedbackData.email) {
        logger.warn("Feedback submission failed: Missing email");
        return res.status(400).json({
          success: false,
          message: "Email is required",
          error: "MISSING_EMAIL",
        });
      }

      // Add client IP and user agent for tracking
      feedbackData.metadata = {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        submittedAt: new Date(),
      };

      // Log the cleaned data being saved
      logger.info(
        "Saving feedback data:",
        JSON.stringify(feedbackData, null, 2)
      );

      const feedback = await feedbackService.createFeedback(feedbackData);

      logger.info(`Feedback created successfully with ID: ${feedback._id}`);

      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        data: {
          id: feedback._id,
          submittedAt: feedback.createdAt,
        },
      });
    } catch (error) {
      logger.error("Error creating feedback:", error);

      // Handle validation errors specifically
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
          value: err.value,
        }));

        logger.error("Validation errors:", validationErrors);

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: "VALIDATION_ERROR",
          validationErrors,
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        logger.error("Duplicate key error:", error.keyValue);
        return res.status(400).json({
          success: false,
          message: "Duplicate submission detected",
          error: "DUPLICATE_SUBMISSION",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to submit feedback",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async getAllFeedback(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        priority: req.query.priority,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await feedbackService.getAllFeedback(options);

      res.json({
        success: true,
        data: result.feedback,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error("Error retrieving feedback:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      const feedback = await feedbackService.getFeedbackById(id);

      res.json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      logger.error("Error retrieving feedback by ID:", error);

      if (error.message === "Feedback not found") {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const feedback = await feedbackService.updateFeedbackStatus(
        id,
        status,
        adminNotes
      );

      res.json({
        success: true,
        message: "Feedback status updated successfully",
        data: feedback,
      });
    } catch (error) {
      logger.error("Error updating feedback status:", error);

      if (error.message === "Feedback not found") {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update feedback status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async updateFeedbackPriority(req, res) {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      const feedback = await feedbackService.updateFeedbackPriority(
        id,
        priority
      );

      res.json({
        success: true,
        message: "Feedback priority updated successfully",
        data: feedback,
      });
    } catch (error) {
      logger.error("Error updating feedback priority:", error);

      if (error.message === "Feedback not found") {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update feedback priority",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async assignFeedback(req, res) {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;

      const feedback = await feedbackService.assignFeedback(id, assignedTo);

      res.json({
        success: true,
        message: "Feedback assigned successfully",
        data: feedback,
      });
    } catch (error) {
      logger.error("Error assigning feedback:", error);

      if (error.message === "Feedback not found") {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to assign feedback",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async deleteFeedback(req, res) {
    try {
      const { id } = req.params;
      const feedback = await feedbackService.deleteFeedback(id);

      res.json({
        success: true,
        message: "Feedback deleted successfully",
        data: feedback,
      });
    } catch (error) {
      logger.error("Error deleting feedback:", error);

      if (error.message === "Feedback not found") {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete feedback",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async getFeedbackStats(req, res) {
    try {
      const stats = await feedbackService.getFeedbackStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error retrieving feedback stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback statistics",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async searchFeedback(req, res) {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm || searchTerm.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search term is required",
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        priority: req.query.priority,
      };

      const result = await feedbackService.searchFeedback(
        searchTerm.trim(),
        options
      );

      res.json({
        success: true,
        data: result.feedback,
        pagination: result.pagination,
        searchTerm: searchTerm.trim(),
      });
    } catch (error) {
      logger.error("Error searching feedback:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search feedback",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Public endpoint for checking if feedback submission is available
  async getSubmissionStatus(req, res) {
    try {
      res.json({
        success: true,
        data: {
          accepting: true,
          message: "Feedback submissions are currently being accepted",
          version: "1.0.0",
        },
      });
    } catch (error) {
      logger.error("Error checking submission status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check submission status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
}

module.exports = new FeedbackController();
