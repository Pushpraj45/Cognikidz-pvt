/**
 * Assessment Images Service
 *
 * Handles image metadata management and serves image pairs for assessments
 */

const mongoose = require("mongoose");
const { awsS3Service } = require("./aws-s3.service");
const logger = require("../utils/logger");
const { ImageSet } = require("../domains/assessment/image-assessment/model");

class AssessmentImagesService {
  constructor() {
    this.ImageSet = ImageSet;
  }

  /**
   * Get random image pairs for assessment
   * @param {String} assessmentType - autism, adhd, dyslexia
   * @param {Number} count - Number of pairs to return (default: 10)
   * @param {Array} excludeSetIds - Set IDs to exclude from selection
   * @returns {Array} - Array of image pairs with signed URLs
   */
  async getRandomImagePairs(assessmentType, count = 10, excludeSetIds = []) {
    try {
      logger.info(
        `Getting ${count} random image pairs for ${assessmentType} assessment`
      );

      // Build query
      const query = {
        assessmentType: assessmentType.toLowerCase(),
        status: "active",
      };

      if (excludeSetIds.length > 0) {
        query.setId = { $nin: excludeSetIds };
      }

      // Get all available sets
      const allSets = await this.ImageSet.find(query);

      if (allSets.length < count) {
        logger.warn(
          `Only ${allSets.length} sets available, requested ${count}`
        );
      }

      // Shuffle and select random sets
      const shuffledSets = this.shuffleArray([...allSets]);
      const selectedSets = shuffledSets.slice(
        0,
        Math.min(count, shuffledSets.length)
      );

      // Generate signed URLs for selected sets
      const imagePairs = [];
      for (const set of selectedSets) {
        const signedUrls = await awsS3Service.getAssessmentImageUrls([
          {
            setId: set.setId,
            positiveS3Key: set.s3Keys.positive,
            negativeS3Key: set.s3Keys.negative,
          },
        ]);

        imagePairs.push({
          setId: set.setId,
          setNumber: set.setNumber,
          assessmentArea: set.assessmentArea,
          difficulty: set.difficulty,
          positiveUrl: signedUrls[0].positiveUrl,
          negativeUrl: signedUrls[0].negativeUrl,
          positiveDescription: set.descriptions.positive,
          negativeDescription: set.descriptions.negative,
          expiresAt: signedUrls[0].expiresAt,
        });

        // Update usage tracking
        await this.updateUsageStats(set.setId);
      }

      logger.info(`Successfully prepared ${imagePairs.length} image pairs`);
      return imagePairs;
    } catch (error) {
      logger.error("Error getting random image pairs:", error);
      throw new Error(`Failed to get image pairs: ${error.message}`);
    }
  }

  /**
   * Get a single image pair by set ID
   * @param {String} setId - Set ID to retrieve
   * @returns {Object} - Image pair with signed URLs
   */
  async getImagePairBySetId(setId) {
    try {
      const imageSet = await this.ImageSet.findOne({ setId, status: "active" });

      if (!imageSet) {
        throw new Error(`Image set ${setId} not found or inactive`);
      }

      // Generate signed URLs for the set
      const signedUrls = await awsS3Service.getAssessmentImageUrls([
        {
          setId: imageSet.setId,
          positiveS3Key: imageSet.s3Keys.positive,
          negativeS3Key: imageSet.s3Keys.negative,
        },
      ]);

      return {
        setId: imageSet.setId,
        setNumber: imageSet.setNumber,
        assessmentArea: imageSet.assessmentArea,
        difficulty: imageSet.difficulty,
        positiveUrl: signedUrls[0].positiveUrl,
        negativeUrl: signedUrls[0].negativeUrl,
        positiveDescription: imageSet.descriptions.positive,
        negativeDescription: imageSet.descriptions.negative,
        expiresAt: signedUrls[0].expiresAt,
      };
    } catch (error) {
      logger.error(`Error getting image pair for set ${setId}:`, error);
      throw new Error(`Failed to get image pair: ${error.message}`);
    }
  }

  /**
   * Get image descriptions for selected images
   * @param {Array} imageSelections - Array of user selections
   * @returns {Array} - Array of descriptions for LLM processing
   */
  async getImageDescriptions(imageSelections) {
    try {
      const descriptions = [];

      for (const selection of imageSelections) {
        const imageSet = await this.ImageSet.findOne({
          setId: selection.setId,
        });

        if (imageSet) {
          const selectedDescription =
            selection.selectedImage === "positive"
              ? imageSet.descriptions.positive
              : imageSet.descriptions.negative;

          descriptions.push({
            setId: selection.setId,
            setNumber: imageSet.setNumber,
            assessmentArea: imageSet.assessmentArea,
            selectedImage: selection.selectedImage,
            description: selectedDescription,
            difficulty: imageSet.difficulty,
            tags: imageSet.tags,
          });
        }
      }

      return descriptions;
    } catch (error) {
      logger.error("Error getting image descriptions:", error);
      throw new Error(`Failed to get image descriptions: ${error.message}`);
    }
  }

  /**
   * Get assessment statistics
   * @param {String} assessmentType - Optional assessment type filter
   * @returns {Object} - Statistics object
   */
  async getAssessmentStats(assessmentType = null) {
    try {
      const query = assessmentType
        ? { assessmentType: assessmentType.toLowerCase() }
        : {};

      const stats = await this.ImageSet.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$assessmentType",
            totalSets: { $sum: 1 },
            activeSets: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
            totalUsage: { $sum: "$usageCount" },
            averageDifficulty: { $avg: "$difficulty" },
            areas: { $addToSet: "$assessmentArea" },
          },
        },
      ]);

      return assessmentType ? stats[0] || null : stats;
    } catch (error) {
      logger.error("Error getting assessment stats:", error);
      throw new Error(`Failed to get assessment stats: ${error.message}`);
    }
  }

  /**
   * Update image set metadata
   * @param {String} setId - Set ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Updated set
   */
  async updateImageSet(setId, updates) {
    try {
      const allowedUpdates = [
        "difficulty",
        "ageRange",
        "weight",
        "tags",
        "status",
        "assessmentArea",
      ];
      const sanitizedUpdates = {};

      for (const key of Object.keys(updates)) {
        if (allowedUpdates.includes(key)) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      const updatedSet = await this.ImageSet.findOneAndUpdate(
        { setId },
        { $set: sanitizedUpdates },
        { new: true }
      );

      if (!updatedSet) {
        throw new Error(`Image set ${setId} not found`);
      }

      logger.info(`Updated image set ${setId}`);
      return updatedSet;
    } catch (error) {
      logger.error("Error updating image set:", error);
      throw new Error(`Failed to update image set: ${error.message}`);
    }
  }

  /**
   * Get image sets by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Array} - Array of matching image sets
   */
  async getImageSets(criteria = {}, options = {}) {
    try {
      const {
        assessmentType,
        assessmentArea,
        difficulty,
        status = "active",
        tags,
      } = criteria;

      const { limit = 50, skip = 0, sort = { setNumber: 1 } } = options;

      // Build query
      const query = { status };

      if (assessmentType) query.assessmentType = assessmentType.toLowerCase();
      if (assessmentArea) query.assessmentArea = assessmentArea;
      if (difficulty) query.difficulty = difficulty;
      if (tags && tags.length > 0) query.tags = { $in: tags };

      const imageSets = await this.ImageSet.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-s3Keys -publicUrls"); // Exclude sensitive data

      return imageSets;
    } catch (error) {
      logger.error("Error getting image sets:", error);
      throw new Error(`Failed to get image sets: ${error.message}`);
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Update usage statistics for an image set
   * @param {String} setId - Set ID to update
   */
  async updateUsageStats(setId) {
    try {
      await this.ImageSet.findOneAndUpdate(
        { setId },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date() },
        }
      );
    } catch (error) {
      logger.error(`Error updating usage stats for ${setId}:`, error);
      // Don't throw error as this is non-critical
    }
  }

  /**
   * Validate image set completeness
   * @param {String} assessmentType - Assessment type to validate
   * @returns {Object} - Validation report
   */
  async validateImageSets(assessmentType) {
    try {
      const sets = await this.ImageSet.find({
        assessmentType: assessmentType.toLowerCase(),
      });

      const report = {
        totalSets: sets.length,
        validSets: 0,
        issues: [],
      };

      for (const set of sets) {
        let isValid = true;

        // Check required fields
        if (!set.s3Keys.positive || !set.s3Keys.negative) {
          report.issues.push(`${set.setId}: Missing S3 keys`);
          isValid = false;
        }

        if (!set.descriptions.positive || !set.descriptions.negative) {
          report.issues.push(`${set.setId}: Missing descriptions`);
          isValid = false;
        }

        if (isValid) {
          report.validSets++;
        }
      }

      return report;
    } catch (error) {
      logger.error("Error validating image sets:", error);
      throw new Error(`Failed to validate image sets: ${error.message}`);
    }
  }
}

// Create singleton instance
const assessmentImagesService = new AssessmentImagesService();

module.exports = {
  assessmentImagesService,
};
