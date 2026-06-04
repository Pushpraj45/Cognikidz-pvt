const logger = require("../utils/logger");
const mongoose = require("mongoose");
const {
  normalizeDomainName,
  validateAndNormalizeScore,
  isValidDevelopmentalDomain,
} = require("../utils/domainMapping");

/**
 * Assessment Data Transformer Service
 * Unifies different assessment types (regular, image, game) into consistent format
 */
class AssessmentDataTransformer {
  constructor() {
    // Remove the local DOMAIN_NAME_MAP - now using unified mapping
  }

  /**
   * Transform raw assessment data into display format
   * @param {Object} assessment - Raw assessment data from MongoDB
   * @returns {Object} Transformed assessment data
   */
  transformAssessment(assessment) {
    if (!assessment) return null;

    const transformed = {
      _id: assessment._id,
      assessmentType: assessment.assessmentType,
      assessmentCategory: assessment.assessmentCategory || "text",
      sourceType: this.getSourceType(assessment),
      date: assessment.createdAt || assessment.completedAt,
      childId: assessment.childId,
      results: this.transformResults(
        assessment.results,
        assessment.assessmentCategory
      ),
      status: assessment.status || "completed",
    };

    return transformed;
  }

  /**
   * Determine source type based on assessment data
   */
  getSourceType(assessment) {
    // Check for image assessment indicators
    if (
      assessment.assessmentCategory === "image" ||
      assessment.images ||
      assessment.assessmentType?.toLowerCase().includes("image") ||
      assessment.constructor.modelName === "ImageAssessmentSession"
    ) {
      return "image";
    }

    // Default to text for traditional assessments
    return "text";
  }

  /**
   * Transform assessment results with proper domain normalization
   */
  transformResults(results, assessmentCategory = "text") {
    if (!results) return {};

    const transformed = {
      disorderRisk: results.disorderRisk || null,
      domainScores: [],
      scores: {},
    };

    const sourceType = assessmentCategory === "image" ? "image" : "text";

    // Handle domainScores array
    if (results.domainScores && Array.isArray(results.domainScores)) {
      transformed.domainScores = results.domainScores
        .map((domainObj) => {
          if (!domainObj.domain) return null;

          // Handle different score field names
          let scoreValue = domainObj.score;
          if (scoreValue === undefined) {
            scoreValue = domainObj.accuracy;
          }
          if (scoreValue === undefined) {
            scoreValue =
              domainObj.correct && domainObj.total
                ? Math.round((domainObj.correct / domainObj.total) * 100)
                : null;
          }

          if (scoreValue === null || scoreValue === undefined) return null;

          const normalizedDomain = normalizeDomainName(domainObj.domain);
          const validatedScore = validateAndNormalizeScore(
            scoreValue,
            sourceType
          );

          return {
            domain: normalizedDomain,
            score: validatedScore,
            originalDomain: domainObj.domain,
            description:
              domainObj.description || `${normalizedDomain} performance`,
            sourceType: sourceType,
          };
        })
        .filter(Boolean);
    }

    // Handle scores object
    if (results.scores && typeof results.scores === "object") {
      Object.keys(results.scores).forEach((domain) => {
        const normalizedDomain = normalizeDomainName(domain);
        const validatedScore = validateAndNormalizeScore(
          results.scores[domain],
          sourceType
        );

        if (validatedScore !== null) {
          transformed.scores[normalizedDomain] = validatedScore;
        }
      });
    }

    // Handle raw scores from image assessments
    if (results.rawScores && typeof results.rawScores === "object") {
      Object.keys(results.rawScores).forEach((domain) => {
        const normalizedDomain = normalizeDomainName(domain);
        const validatedScore = validateAndNormalizeScore(
          results.rawScores[domain],
          sourceType
        );

        if (validatedScore !== null) {
          transformed.scores[normalizedDomain] = validatedScore;
        }
      });
    }

    // Preserve other result properties
    Object.keys(results).forEach((key) => {
      if (
        !["domainScores", "scores", "rawScores", "disorderRisk"].includes(key)
      ) {
        transformed[key] = results[key];
      }
    });

    return transformed;
  }

  /**
   * Use unified domain normalization
   * @param {string} domainName - Original domain name
   * @returns {string} Normalized domain name
   */
  normalizeDomainName(domainName) {
    return normalizeDomainName(domainName);
  }

  /**
   * Enhanced transform for regular Assessment to unified format with better domain extraction
   * @param {Object} assessment - Regular Assessment document
   * @returns {Object} Unified assessment object
   */
  transformRegularAssessment(assessment) {
    try {
      logger.info("🔄 Transforming regular assessment:", assessment._id);

      const childName = this.getChildName(assessment);
      const domainScores = this.extractAndTransformDomainScores(
        assessment.results,
        "text"
      );

      return {
        id: assessment._id,
        sessionId: assessment.sessionId,
        childId: assessment.childId,
        childName: childName,
        assessmentType: assessment.assessmentType || "general",
        assessmentCategory: "text",
        sourceType: "text",
        status: assessment.status,
        startedAt: assessment.startedAt || assessment.createdAt,
        completedAt: assessment.completedAt,
        lastActiveAt: assessment.lastActiveAt || assessment.updatedAt,
        results: {
          summary: assessment.results?.summary || "Assessment completed",
          disorderRisk: assessment.results?.disorderRisk || {
            score: 5,
            interpretation: "Assessment completed",
            level: "moderate",
          },
          domainScores: domainScores,
          scores: this.convertDomainScoresToObject(domainScores),
          recommendations: assessment.results?.recommendations || [],
          accuracyRate: this.calculateCompletionPercentage(
            assessment.responses?.length || 0,
            assessment.questions?.length || 20
          ),
        },
        responses: assessment.responses || [],
        questionsAnswered: assessment.responses?.length || 0,
        totalQuestions: assessment.questions?.length || 20,
        completionPercentage: this.calculateCompletionPercentage(
          assessment.responses?.length || 0,
          assessment.questions?.length || 20
        ),
      };
    } catch (error) {
      console.error("Error transforming regular assessment:", error);
      return this.createFallbackAssessment(assessment, "text");
    }
  }

  /**
   * Enhanced transform for Image Assessment to unified format
   * @param {Object} imageAssessment - ImageAssessmentSession document
   * @returns {Object} Unified assessment object
   */
  transformImageAssessment(imageAssessment) {
    try {
      logger.info(
        "🔄 Transforming image assessment:",
        imageAssessment.sessionId
      );

      // Get child name with fallback
      const childName = this.getChildName(imageAssessment) || "Unknown Child";

      // Extract domain scores with fallback
      const domainScores =
        this.extractAndTransformDomainScores(
          imageAssessment.results,
          "image"
        ) || [];

      // ENHANCEMENT: Prioritize AI-enhanced results if available
      const isAIEnhanced = imageAssessment.results?.aiEnhanced || false;
      const hasAIReport = !!(
        imageAssessment.aiReport && imageAssessment.aiReport.analysis
      );

      // Extract proper risk data with AI priority and fallbacks
      let riskScore = 5;
      let riskLevel = "moderate";
      let interpretation = "Assessment completed successfully";
      let summary = "Assessment completed. Results available for review.";

      if (isAIEnhanced && imageAssessment.results) {
        // Use AI-enhanced results from main results field
        riskLevel = imageAssessment.results.riskLevel || "moderate";
        riskScore =
          imageAssessment.results.riskScore ||
          this.convertLevelToScore(riskLevel);
        interpretation =
          imageAssessment.results.interpretation || "Assessment completed";
        summary = imageAssessment.results.summary || interpretation;
      } else if (hasAIReport) {
        // Fall back to aiReport field if main results not enhanced
        const aiAnalysis = imageAssessment.aiReport.analysis;
        riskLevel = aiAnalysis.riskLevel || "moderate";
        riskScore = aiAnalysis.riskScore || this.convertLevelToScore(riskLevel);
        interpretation = aiAnalysis.summary || "Assessment completed";
        summary = aiAnalysis.summary || interpretation;
      } else {
        // Use basic calculated results - ALWAYS convert level to score
        riskLevel = imageAssessment.results?.riskLevel || "moderate";
        riskScore =
          imageAssessment.results?.riskScore ||
          this.convertLevelToScore(riskLevel);
        interpretation =
          imageAssessment.results?.interpretation ||
          "Assessment completed successfully";
        summary =
          imageAssessment.results?.summary ||
          "Assessment completed. Results available for review.";
      }

      logger.info("🔍 Image Assessment Data Extraction:", {
        sessionId: imageAssessment.sessionId,
        isAIEnhanced,
        hasAIReport,
        riskScore,
        riskLevel,
        hasComprehensiveSummary: !!summary && summary.length > 50,
        summaryLength: summary.length,
        interpretationLength: interpretation.length,
      });

      // Create transformed object with ALL fields having proper fallbacks
      return {
        _id: imageAssessment._id,
        assessmentId: imageAssessment._id,
        id: imageAssessment._id,
        sessionId: imageAssessment.sessionId || "",
        childId: imageAssessment.childId,
        childName: childName,
        assessmentType: imageAssessment.assessmentType || "autism",
        assessmentCategory: "image",
        sourceType: "image",
        status: imageAssessment.status || "completed",
        date:
          imageAssessment.completedAt ||
          imageAssessment.createdAt ||
          new Date(),
        dateTaken:
          imageAssessment.completedAt ||
          imageAssessment.createdAt ||
          new Date(),
        startedAt:
          imageAssessment.startedAt || imageAssessment.createdAt || new Date(),
        completedAt: imageAssessment.completedAt || new Date(),
        lastActiveAt:
          imageAssessment.lastActiveAt ||
          imageAssessment.updatedAt ||
          new Date(),
        // FIX: Add top-level fields for dashboard display
        score: imageAssessment.results?.accuracyRate || 0,
        riskLevel: riskLevel,
        riskScore: riskScore,
        results: {
          summary: summary,
          disorderRisk: {
            score: riskScore,
            interpretation: interpretation,
            level: riskLevel,
          },
          domainScores: domainScores,
          scores: this.convertDomainScoresToObject(domainScores),
          recommendations: imageAssessment.results?.recommendations || [],
          accuracyRate: imageAssessment.results?.accuracyRate || 0,
          score: imageAssessment.results?.accuracyRate || 0,
          // Add additional fields for proper display
          riskScore: riskScore,
          riskLevel: riskLevel,
          interpretation: interpretation,
          // Add AI enhancement detection fields for debugging
          isAIEnhanced: isAIEnhanced,
          hasAIReport: hasAIReport,
        },
        responses: imageAssessment.responses || [],
        questionsAnswered: imageAssessment.responses?.length || 0,
        totalQuestions: imageAssessment.totalQuestions || 20,
        completionPercentage: imageAssessment.results?.accuracyRate || 0,
      };
    } catch (error) {
      console.error("Error transforming image assessment:", error);
      return this.createFallbackAssessment(imageAssessment, "image");
    }
  }

  /**
   * Enhanced domain score extraction that works for both assessment types
   * @param {Object} results - Assessment results object
   * @param {string} sourceType - "text" or "image"
   * @returns {Array} Normalized domain scores array
   */
  extractAndTransformDomainScores(results, sourceType) {
    if (!results) return [];

    let domainScores = [];

    // Handle domainScores array (most common format)
    if (results.domainScores && Array.isArray(results.domainScores)) {
      domainScores = results.domainScores
        .map((domainObj) => {
          if (!domainObj.domain) return null;

          // Handle different score field names
          let scoreValue = domainObj.score;
          if (scoreValue === undefined) {
            scoreValue = domainObj.accuracy;
          }
          if (scoreValue === undefined) {
            scoreValue =
              domainObj.correct && domainObj.total
                ? Math.round((domainObj.correct / domainObj.total) * 100)
                : null;
          }

          if (scoreValue === null || scoreValue === undefined) return null;

          const normalizedDomain = normalizeDomainName(domainObj.domain);
          const validatedScore = validateAndNormalizeScore(
            scoreValue,
            sourceType
          );

          return {
            domain: normalizedDomain,
            score: validatedScore,
            originalDomain: domainObj.domain,
            description:
              domainObj.description || `${normalizedDomain} performance`,
            sourceType: sourceType,
          };
        })
        .filter(Boolean);
    }

    // Handle scores object
    if (results.scores && typeof results.scores === "object") {
      Object.keys(results.scores).forEach((domain) => {
        const normalizedDomain = normalizeDomainName(domain);
        const validatedScore = validateAndNormalizeScore(
          results.scores[domain],
          sourceType
        );

        if (validatedScore !== null) {
          domainScores.push({
            domain: normalizedDomain,
            score: validatedScore,
            originalDomain: domain,
            description: `${normalizedDomain} performance`,
            sourceType: sourceType,
          });
        }
      });
    }

    // Handle rawScores from image assessments
    if (results.rawScores && typeof results.rawScores === "object") {
      Object.keys(results.rawScores).forEach((domain) => {
        const normalizedDomain = normalizeDomainName(domain);
        const validatedScore = validateAndNormalizeScore(
          results.rawScores[domain],
          sourceType
        );

        if (validatedScore !== null) {
          domainScores.push({
            domain: normalizedDomain,
            score: validatedScore,
            originalDomain: domain,
            description: `${normalizedDomain} performance`,
            sourceType: sourceType,
          });
        }
      });
    }

    // Remove duplicates (prefer domainScores array over scores object)
    const uniqueDomains = new Map();
    domainScores.forEach((score) => {
      if (!uniqueDomains.has(score.domain)) {
        uniqueDomains.set(score.domain, score);
      }
    });

    return Array.from(uniqueDomains.values());
  }

  /**
   * Convert domain scores array to simple object for easier access
   * @param {Array} domainScores - Array of domain score objects
   * @returns {Object} Simple domain name to score mapping
   */
  convertDomainScoresToObject(domainScores) {
    const scores = {};
    if (Array.isArray(domainScores)) {
      domainScores.forEach((domain) => {
        if (domain.domain && domain.score !== undefined) {
          scores[domain.domain] = domain.score;
        }
      });
    }
    return scores;
  }

  /**
   * Transform Image Assessment domain scores to unified format
   * @param {Array} domainScores - Array of image assessment domain scores
   * @returns {Array} Unified domain scores
   */
  transformImageDomainScores(domainScores) {
    if (!Array.isArray(domainScores)) return [];

    return domainScores.map((domain) => {
      const normalizedDomain = normalizeDomainName(
        domain.domain || domain.name
      );
      // Image assessments use accuracy percentage (0-100)
      const score = domain.accuracy || domain.score || 0;

      return {
        domain: normalizedDomain,
        score: Math.round(score), // Already in 0-100 range
        originalDomain: domain.domain || domain.name,
        description: domain.description || `${normalizedDomain} performance`,
      };
    });
  }

  /**
   * Transform regular Assessment domain scores to unified format
   * @param {Array} domainScores - Array of regular assessment domain scores
   * @returns {Array} Unified domain scores
   */
  transformRegularDomainScores(domainScores) {
    if (!Array.isArray(domainScores)) return [];

    return domainScores.map((domain) => {
      const normalizedDomain = normalizeDomainName(domain.domain);
      // Regular assessments use 1-10 scale, convert to 0-100
      const score = Math.round((domain.score || 0) * 10);

      return {
        domain: normalizedDomain,
        score: Math.max(0, Math.min(100, score)),
        originalDomain: domain.domain,
        description: domain.description || `${normalizedDomain} performance`,
      };
    });
  }

  /**
   * Convert risk level (low/moderate/high) to numeric score (1-10)
   * @param {string} level - Risk level
   * @returns {number} Numeric score
   */
  convertLevelToScore(level) {
    const levelMap = {
      low: 2,
      moderate: 5,
      high: 8,
    };
    return levelMap[level?.toLowerCase()] || 5;
  }

  /**
   * Convert numeric score (1-10) to risk level
   * @param {number} score - Numeric score
   * @returns {string} Risk level
   */
  convertScoreToLevel(score) {
    if (!score || score <= 3) return "low";
    if (score <= 7) return "moderate";
    return "high";
  }

  /**
   * Get child name from assessment data with enhanced logic for image assessments
   * @param {Object} assessment - Assessment data
   * @returns {string} Child name
   */
  getChildName(assessment) {
    // Check populated childId first - this is the most reliable source
    if (assessment.childId?.firstName || assessment.childId?.lastName) {
      const name = this.formatChildName(
        assessment.childId.firstName,
        assessment.childId.lastName
      );
      if (name && name !== "Child") {
        return name;
      }
    }

    // Check metadata for image assessments - this should be the primary source for image assessments
    if (
      assessment.metadata?.childName &&
      assessment.metadata.childName !== "Child" &&
      assessment.metadata.childName.trim() !== "" &&
      assessment.metadata.childName !== "undefined undefined" &&
      assessment.metadata.childName !== "Child Assessment" &&
      !assessment.metadata.childName.includes("undefined") &&
      assessment.metadata.childName !== "null null"
    ) {
      logger.info(
        `Using metadata childName: ${assessment.metadata.childName} for session ${assessment.sessionId}`
      );
      return assessment.metadata.childName;
    }

    // Check intakeId for regular assessments
    if (
      assessment.intakeId?.childName &&
      assessment.intakeId.childName !== "Child" &&
      assessment.intakeId.childName.trim() !== "" &&
      !assessment.intakeId.childName.includes("undefined")
    ) {
      return assessment.intakeId.childName;
    }

    // If we have a childId but no name data, provide a more specific fallback
    if (assessment.childId) {
      console.warn(
        `Assessment ${assessment._id || assessment.sessionId} has childId ${
          assessment.childId
        } but no child name found in populated data or metadata`
      );

      // Return a more specific fallback that indicates we have child data but no name
      const childIdStr = assessment.childId.toString();
      return `Child ${childIdStr.slice(-4)}`;
    }

    // Only return generic fallback if there's truly no child data
    return "Child Assessment";
  }

  /**
   * Format child name properly
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} Formatted name
   */
  formatChildName(firstName, lastName) {
    const cleanFirst =
      firstName &&
      firstName.trim() !== "" &&
      firstName.trim().toLowerCase() !== "n/a"
        ? firstName.trim()
        : "";
    const cleanLast =
      lastName &&
      lastName.trim() !== "" &&
      lastName.trim().toLowerCase() !== "n/a"
        ? lastName.trim()
        : "";

    if (cleanFirst && cleanLast) {
      return `${cleanFirst} ${cleanLast}`;
    } else if (cleanFirst) {
      return cleanFirst;
    } else if (cleanLast) {
      return cleanLast;
    }
    return "Child";
  }

  /**
   * Calculate completion percentage
   * @param {number} answered - Number of answered questions
   * @param {number} total - Total questions
   * @returns {number} Completion percentage
   */
  calculateCompletionPercentage(answered, total) {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((answered / total) * 100));
  }

  /**
   * Create fallback assessment when transformation fails
   * @param {Object} assessment - Original assessment data
   * @param {string} sourceType - "text" or "image"
   * @returns {Object} Fallback assessment object with no undefined values
   */
  createFallbackAssessment(assessment, sourceType) {
    const currentDate = new Date();
    const childName = this.getChildName(assessment) || "Unknown Child";

    return {
      _id: assessment._id || null,
      assessmentId: assessment._id || null,
      id: assessment._id || null,
      sessionId: assessment.sessionId || assessment._id || "",
      childId: assessment.childId || null,
      childName: childName,
      assessmentType: assessment.assessmentType || "general",
      assessmentCategory: sourceType || "text",
      sourceType: sourceType || "text",
      status: assessment.status || "completed",
      date: assessment.completedAt || assessment.createdAt || currentDate,
      dateTaken: assessment.completedAt || assessment.createdAt || currentDate,
      startedAt: assessment.startedAt || assessment.createdAt || currentDate,
      completedAt: assessment.completedAt || currentDate,
      lastActiveAt:
        assessment.lastActiveAt || assessment.updatedAt || currentDate,
      // Top-level fields with defaults
      score: assessment.results?.accuracyRate || 0,
      riskLevel: assessment.results?.riskLevel || "moderate",
      riskScore: assessment.results?.riskScore || 5,
      results: {
        summary:
          assessment.results?.summary || "Assessment completed successfully",
        disorderRisk: {
          score: assessment.results?.riskScore || 5,
          interpretation:
            assessment.results?.interpretation || "Assessment completed",
          level: assessment.results?.riskLevel || "moderate",
        },
        domainScores: [],
        scores: {},
        recommendations: assessment.results?.recommendations || [],
        accuracyRate: assessment.results?.accuracyRate || 0,
        score: assessment.results?.accuracyRate || 0,
        riskScore: assessment.results?.riskScore || 5,
        riskLevel: assessment.results?.riskLevel || "moderate",
        interpretation:
          assessment.results?.interpretation || "Assessment completed",
        isAIEnhanced: assessment.results?.aiEnhanced || false,
        hasAIReport: !!(assessment.aiReport && assessment.aiReport.analysis),
      },
      responses: assessment.responses || [],
      questionsAnswered: assessment.responses?.length || 0,
      totalQuestions: assessment.totalQuestions || 0,
      completionPercentage: assessment.results?.accuracyRate || 0,
    };
  }

  /**
   * Create unified response combining different assessment types
   * @param {Array} regularAssessments - Regular assessments
   * @param {Array} imageAssessments - Image assessments
   * @param {string} filterType - Filter type ('all', 'text', 'image')
   * @returns {Object} Unified response object
   */
  createUnifiedResponse(
    regularAssessments = [],
    imageAssessments = [],
    filterType = "all"
  ) {
    try {
      let unifiedAssessments = [];

      // Transform regular assessments
      if (filterType === "all" || filterType === "text") {
        const transformedRegular = regularAssessments.map((assessment) =>
          this.transformRegularAssessment(assessment)
        );
        unifiedAssessments = unifiedAssessments.concat(transformedRegular);
      }

      // Transform image assessments
      if (filterType === "all" || filterType === "image") {
        const transformedImage = imageAssessments.map((assessment) =>
          this.transformImageAssessment(assessment)
        );
        unifiedAssessments = unifiedAssessments.concat(transformedImage);
      }

      // Sort by completion date (most recent first)
      unifiedAssessments.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.startedAt);
        const dateB = new Date(b.completedAt || b.startedAt);
        return dateB - dateA;
      });

      return {
        assessments: unifiedAssessments,
        totalCount: unifiedAssessments.length,
        typeBreakdown: {
          regular: regularAssessments.length,
          image: imageAssessments.length,
          total: regularAssessments.length + imageAssessments.length,
        },
      };
    } catch (error) {
      logger.error("Error creating unified response:", error);
      return {
        assessments: [],
        totalCount: 0,
        typeBreakdown: {
          regular: 0,
          image: 0,
          total: 0,
        },
      };
    }
  }

  /**
   * Create unified timeline data for progress visualization
   * @param {Array} regularAssessments - Regular assessments
   * @param {Array} imageAssessments - Image assessments
   * @returns {Array} Timeline data points
   */
  createUnifiedTimeline(regularAssessments = [], imageAssessments = []) {
    try {
      let timelinePoints = [];

      // Add regular assessment points
      regularAssessments.forEach((assessment) => {
        const unified = this.transformRegularAssessment(assessment);
        if (unified.completedAt) {
          timelinePoints.push({
            date: unified.completedAt,
            type: "regular",
            assessmentType: unified.assessmentType,
            childName: unified.childName,
            riskScore: unified.results.disorderRisk.score,
            riskLevel: unified.results.disorderRisk.level,
            domainScores: unified.results.domainScores,
          });
        }
      });

      // Add image assessment points
      imageAssessments.forEach((assessment) => {
        const unified = this.transformImageAssessment(assessment);
        if (unified.completedAt) {
          timelinePoints.push({
            date: unified.completedAt,
            type: "image",
            assessmentType: unified.assessmentType,
            childName: unified.childName,
            riskScore: unified.results.disorderRisk.score,
            riskLevel: unified.results.disorderRisk.level,
            domainScores: unified.results.domainScores,
            accuracyRate: unified.results.accuracyRate,
          });
        }
      });

      // Sort by date
      timelinePoints.sort((a, b) => new Date(a.date) - new Date(b.date));

      return timelinePoints;
    } catch (error) {
      logger.error("Error creating unified timeline:", error);
      return [];
    }
  }
}

module.exports = new AssessmentDataTransformer();
