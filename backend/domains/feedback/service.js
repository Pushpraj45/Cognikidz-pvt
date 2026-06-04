const { Feedback, FeedbackStatus, FeedbackPriority } = require("./model");
const logger = require("../../utils/logger");

class FeedbackService {
  async createFeedback(feedbackData) {
    try {
      const feedback = new Feedback(feedbackData);
      const savedFeedback = await feedback.save();

      logger.info(`New feedback created with ID: ${savedFeedback._id}`);
      return savedFeedback;
    } catch (error) {
      logger.error("Error creating feedback:", error);
      throw error;
    }
  }

  async getAllFeedback(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      const query = { isDeleted: false };

      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = priority;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      const skip = (page - 1) * limit;

      const [feedback, total] = await Promise.all([
        Feedback.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate("assignedTo", "name email")
          .lean(),
        Feedback.countDocuments(query),
      ]);

      return {
        feedback,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      logger.error("Error retrieving feedback:", error);
      throw error;
    }
  }

  async getFeedbackById(id) {
    try {
      const feedback = await Feedback.findOne({ _id: id, isDeleted: false })
        .populate("assignedTo", "name email")
        .lean();

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      return feedback;
    } catch (error) {
      logger.error("Error retrieving feedback by ID:", error);
      throw error;
    }
  }

  async updateFeedbackStatus(id, status, adminNotes = "") {
    try {
      const feedback = await Feedback.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          status,
          adminNotes,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      logger.info(`Feedback ${id} status updated to: ${status}`);
      return feedback;
    } catch (error) {
      logger.error("Error updating feedback status:", error);
      throw error;
    }
  }

  async updateFeedbackPriority(id, priority) {
    try {
      const feedback = await Feedback.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          priority,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      logger.info(`Feedback ${id} priority updated to: ${priority}`);
      return feedback;
    } catch (error) {
      logger.error("Error updating feedback priority:", error);
      throw error;
    }
  }

  async assignFeedback(id, assignedTo) {
    try {
      const feedback = await Feedback.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          assignedTo,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate("assignedTo", "name email");

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      logger.info(`Feedback ${id} assigned to: ${assignedTo}`);
      return feedback;
    } catch (error) {
      logger.error("Error assigning feedback:", error);
      throw error;
    }
  }

  async deleteFeedback(id) {
    try {
      const feedback = await Feedback.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
        { new: true }
      );

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      logger.info(`Feedback ${id} marked as deleted`);
      return feedback;
    } catch (error) {
      logger.error("Error deleting feedback:", error);
      throw error;
    }
  }

  async getFeedbackStats() {
    try {
      const stats = await Feedback.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: {
                status: "$status",
                count: 1,
              },
            },
            byPriority: {
              $push: {
                priority: "$priority",
                count: 1,
              },
            },
            averageOverallRating: { $avg: "$overallRating" },
            averageRecommendationScore: { $avg: "$recommendationScore" },
          },
        },
      ]);

      // Process status and priority counts
      const statusCounts = {};
      const priorityCounts = {};

      if (stats.length > 0) {
        stats[0].byStatus.forEach((item) => {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        });

        stats[0].byPriority.forEach((item) => {
          priorityCounts[item.priority] =
            (priorityCounts[item.priority] || 0) + 1;
        });
      }

      return {
        total: stats[0]?.total || 0,
        statusBreakdown: statusCounts,
        priorityBreakdown: priorityCounts,
        averageOverallRating:
          Math.round((stats[0]?.averageOverallRating || 0) * 10) / 10,
        averageRecommendationScore:
          Math.round((stats[0]?.averageRecommendationScore || 0) * 10) / 10,
      };
    } catch (error) {
      logger.error("Error getting feedback stats:", error);
      throw error;
    }
  }

  async searchFeedback(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 20, status, priority } = options;

      const query = {
        isDeleted: false,
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { whatWorkedWell: { $regex: searchTerm, $options: "i" } },
          { needsImprovement: { $regex: searchTerm, $options: "i" } },
          { additionalFeedback: { $regex: searchTerm, $options: "i" } },
        ],
      };

      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = priority;
      }

      const skip = (page - 1) * limit;

      const [feedback, total] = await Promise.all([
        Feedback.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("assignedTo", "name email")
          .lean(),
        Feedback.countDocuments(query),
      ]);

      return {
        feedback,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      logger.error("Error searching feedback:", error);
      throw error;
    }
  }
}

module.exports = new FeedbackService();
