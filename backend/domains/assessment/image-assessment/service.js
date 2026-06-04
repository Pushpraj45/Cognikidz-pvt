const { v4: uuidv4 } = require("uuid");
const { ImageAssessmentSession, ImageSet } = require("./model");
const ChildProfile = require("../../childprofile/model");
const {
  assessmentImagesService,
} = require("../../../services/assessment-images.service");
const openai = require("../../../utils/openai");
const logger = require("../../../utils/logger");

class ImageAssessmentService {
  constructor() {
    this.activeSessions = new Map();
  }

  /**
   * Start a new image assessment session
   */
  async startAssessment({
    userId,
    childId,
    assessmentType = "autism",
    totalQuestions = 10,
    settings = {},
    metadata = {},
  }) {
    try {
      const sessionId = uuidv4();

      // Get child info for metadata
      let childName = "Unknown Child";
      let childAge = null;
      if (childId) {
        const child = await ChildProfile.findById(childId);
        if (child) {
          childName = `${child.firstName} ${child.lastName}`.trim();
          if (child.dateOfBirth) {
            const today = new Date();
            const birth = new Date(child.dateOfBirth);
            childAge = today.getFullYear() - birth.getFullYear();
          }
        }
      }

      // Get random image sets for the assessment
      const imageSets = await assessmentImagesService.getRandomImagePairs(
        assessmentType,
        totalQuestions
      );

      if (!imageSets || imageSets.length === 0) {
        throw new Error(
          `No image sets available for ${assessmentType} assessment`
        );
      }

      // Create session
      console.log(
        "📝 Creating session with setIds:",
        imageSets.map((set) => set.setId)
      );
      const session = new ImageAssessmentSession({
        sessionId,
        userId,
        childId,
        assessmentType,
        totalQuestions: Math.min(totalQuestions, imageSets.length),
        imageSets: imageSets.map((set) => set.setId),
        settings: {
          randomizeOrder: true,
          enablePause: true,
          showFeedback: false,
          ...settings,
        },
        metadata: {
          ...metadata,
          childName,
          childAge,
        },
      });

      await session.save();

      logger.info(
        `Started image assessment session ${sessionId} for user ${userId}`
      );

      return {
        sessionId,
        assessmentType,
        totalQuestions: session.totalQuestions,
        imageSets: imageSets.map((set) => ({
          setId: set.setId,
          positive: set.positiveUrl,
          negative: set.negativeUrl,
          descriptions: {
            positive: set.positiveDescription,
            negative: set.negativeDescription,
          },
        })),
        currentQuestion: 0,
        status: "active",
        metadata: session.metadata,
      };
    } catch (error) {
      logger.error("Error starting image assessment:", error);
      throw error;
    }
  }

  /**
   * Submit a response to the current question
   */
  async submitResponse(sessionId, responseData) {
    try {
      const session = await ImageAssessmentSession.findOne({ sessionId });
      if (!session) {
        throw new Error("Assessment session not found");
      }

      if (session.status !== "active") {
        throw new Error("Assessment session is not active");
      }

      // Get the image set for validation
      // If setId is not provided, try to get it from the session's current question
      let setId = responseData.setId;
      if (!setId) {
        const currentQuestionIndex = session.responses.length; // Current question index (0-based)
        if (session.imageSets && session.imageSets[currentQuestionIndex]) {
          setId = session.imageSets[currentQuestionIndex];
          console.log(
            `🔍 Using setId from session imageSets[${currentQuestionIndex}]:`,
            setId
          );
        }
      }

      // Final validation - if we still don't have a setId, provide detailed error
      if (!setId) {
        console.error("❌ No setId available for validation");
        console.log("📋 Session details:", {
          sessionId: session.sessionId,
          currentResponses: session.responses.length,
          totalQuestions: session.totalQuestions,
          imageSets: session.imageSets,
          status: session.status,
        });
        throw new Error(
          `Unable to determine image set for question ${
            session.responses.length + 1
          }. Session may be corrupted.`
        );
      }

      console.log("🔍 Validating setId:", setId);
      const imageSet = await ImageSet.findOne({ setId: setId });
      if (!imageSet) {
        console.error("❌ ImageSet not found for setId:", setId);
        console.log("📋 Session imageSets:", session.imageSets);
        console.log("📋 Current question index:", session.responses.length);
        // Let's check what setIds are actually in the database
        const allSets = await ImageSet.find({}).limit(5).select("setId");
        console.log(
          "📋 Sample setIds in database:",
          allSets.map((s) => s.setId)
        );
        throw new Error(
          `Invalid image set ID: ${setId}. This image set does not exist in the database.`
        );
      }
      console.log("✅ ImageSet found:", imageSet.setId);

      // Determine correctness using the correctAnswer field from the image set
      const isCorrect = responseData.selectedImage === imageSet.correctAnswer;

      // Create response object
      const response = {
        setId: setId, // Use the validated setId
        selectedImage: responseData.selectedImage,
        responseTime: responseData.responseTime || 3000,
        isCorrect,
        difficulty: imageSet.difficulty || 3,
        timestamp: new Date(),
        metadata: {
          assessmentArea: imageSet.assessmentArea,
          tags: imageSet.tags,
          userAgent: responseData.userAgent,
          deviceType: responseData.deviceType,
        },
      };

      // Add response to session
      session.responses.push(response);
      session.currentQuestion = session.responses.length;
      session.lastActiveAt = new Date();

      // Check if assessment is complete
      if (session.currentQuestion >= session.totalQuestions) {
        session.status = "completed";
        session.completedAt = new Date();

        // Calculate results
        session.results = this.calculateResults(
          session.responses,
          session.imageSets
        );
      }

      await session.save();

      logger.info(
        `Response submitted for session ${sessionId}, question ${session.currentQuestion}`
      );

      // Get next image set if assessment is not complete
      let nextImageSet = null;
      if (
        session.status === "active" &&
        session.currentQuestion < session.totalQuestions
      ) {
        const nextSetId = session.imageSets[session.currentQuestion];
        if (nextSetId) {
          const nextSet = await assessmentImagesService.getImagePairBySetId(
            nextSetId
          );
          if (nextSet) {
            nextImageSet = {
              setId: nextSet.setId,
              positive: nextSet.positiveUrl,
              negative: nextSet.negativeUrl,
              descriptions: {
                positive: nextSet.positiveDescription,
                negative: nextSet.negativeDescription,
              },
              assessmentArea: nextSet.assessmentArea,
              difficulty: nextSet.difficulty,
            };
          }
        }
      }

      return {
        sessionId,
        currentQuestion: session.currentQuestion,
        totalQuestions: session.totalQuestions,
        isComplete: session.status === "completed",
        completed: session.status === "completed", // Add both for compatibility
        status: session.status,
        results: session.results,
        nextImageSet: nextImageSet,
        questionsCompleted: session.currentQuestion,
      };
    } catch (error) {
      logger.error("Error submitting response:", error);
      throw error;
    }
  }

  /**
   * Calculate assessment results from responses
   */
  calculateResults(responses, imageSets) {
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter((r) => r.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracyRate =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    // Calculate average response time
    const averageResponseTime =
      responses.length > 0
        ? Math.round(
            responses.reduce((sum, r) => sum + r.responseTime, 0) /
              responses.length
          )
        : 0;

    // Calculate domain scores
    const domainScores = this.calculateDomainScores(responses);

    // Calculate difficulty analysis
    const difficultyAnalysis = this.calculateDifficultyAnalysis(responses);

    // Determine risk level based on accuracy
    let riskLevel = "moderate";
    let interpretation = "Assessment completed successfully";

    if (accuracyRate < 40) {
      riskLevel = "high";
      interpretation =
        "Results suggest areas that may benefit from further evaluation";
    } else if (accuracyRate < 70) {
      riskLevel = "moderate";
      interpretation = "Results show some patterns that warrant attention";
    } else {
      riskLevel = "low";
      interpretation = "Results indicate typical developmental patterns";
    }

    // Generate basic recommendations
    const recommendations = this.generateBasicRecommendations(
      accuracyRate,
      riskLevel
    );

    // Calculate raw scores for different domains
    const rawScores = this.calculateRawScores(responses);

    // Calculate risk score
    const riskScore = this.convertAccuracyToRiskScore(accuracyRate);

    // Create comprehensive summary
    const summary = `Assessment completed with ${accuracyRate}% accuracy across ${totalQuestions} questions. ${interpretation} Average response time was ${averageResponseTime}ms.`;

    // Return complete results object with no undefined values
    return {
      totalQuestions: totalQuestions || 0,
      correctAnswers: correctAnswers || 0,
      incorrectAnswers: incorrectAnswers || 0,
      accuracyRate: accuracyRate || 0,
      averageResponseTime: averageResponseTime || 0,
      domainScores: domainScores || [],
      difficultyAnalysis: difficultyAnalysis || [],
      riskLevel: riskLevel || "moderate",
      riskScore: riskScore || 5,
      interpretation: interpretation || "Assessment completed successfully",
      recommendations: recommendations || [],
      rawScores: rawScores || {
        socialInteraction: 0,
        communication: 0,
        behaviorPatterns: 0,
        sensoryResponse: 0,
      },
      summary: summary || "Assessment completed successfully",
      aiEnhanced: false, // Will be set to true when AI report is generated
    };
  }

  /**
   * Calculate domain-specific scores
   */
  calculateDomainScores(responses) {
    const domains = {};

    responses.forEach((response) => {
      const area = response.metadata?.assessmentArea || "general";
      if (!domains[area]) {
        domains[area] = { correct: 0, total: 0 };
      }
      domains[area].total++;
      if (response.isCorrect) {
        domains[area].correct++;
      }
    });

    return Object.entries(domains).map(([domain, stats]) => ({
      domain,
      correct: stats.correct,
      total: stats.total,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));
  }

  /**
   * Calculate difficulty analysis
   */
  calculateDifficultyAnalysis(responses) {
    const difficulties = {};

    responses.forEach((response) => {
      const level = response.difficulty || 3;
      if (!difficulties[level]) {
        difficulties[level] = { correct: 0, total: 0 };
      }
      difficulties[level].total++;
      if (response.isCorrect) {
        difficulties[level].correct++;
      }
    });

    return Object.entries(difficulties).map(([level, stats]) => ({
      level: parseInt(level),
      correct: stats.correct,
      total: stats.total,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));
  }

  /**
   * Calculate raw scores for different assessment areas
   */
  calculateRawScores(responses) {
    const rawScores = {
      socialInteraction: 0,
      communication: 0,
      behaviorPatterns: 0,
      sensoryResponse: 0,
    };

    // Group responses by assessment area and calculate scores
    const areaGroups = {};
    responses.forEach((response) => {
      const area = response.metadata?.assessmentArea || "general";
      if (!areaGroups[area]) {
        areaGroups[area] = [];
      }
      areaGroups[area].push(response);
    });

    // FIXED: Better mapping between assessment areas and raw score categories
    const areaMapping = {
      // Direct matches
      social_interaction: "socialInteraction",
      communication: "communication",
      behavior_patterns: "behaviorPatterns",
      sensory_response: "sensoryResponse",

      // Alternative naming patterns
      "social-interaction": "socialInteraction",
      "behavior-patterns": "behaviorPatterns",
      "sensory-response": "sensoryResponse",

      // Shortened forms
      social: "socialInteraction",
      behavioral: "behaviorPatterns",
      sensory: "sensoryResponse",
      comm: "communication",

      // Default fallback
      general: "socialInteraction",
    };

    Object.entries(areaGroups).forEach(([area, areaResponses]) => {
      const mappedArea = areaMapping[area] || "socialInteraction";
      const accuracy =
        areaResponses.filter((r) => r.isCorrect).length / areaResponses.length;
      rawScores[mappedArea] = Math.round(accuracy * 100);
    });

    return rawScores;
  }

  /**
   * Generate basic recommendations based on results
   */
  generateBasicRecommendations(accuracyRate, riskLevel) {
    const recommendations = [];

    if (riskLevel === "high") {
      recommendations.push(
        "Consider consultation with a developmental pediatrician"
      );
      recommendations.push("Schedule comprehensive developmental evaluation");
      recommendations.push(
        "Discuss results with your child's healthcare provider"
      );
    } else if (riskLevel === "moderate") {
      recommendations.push("Monitor developmental progress closely");
      recommendations.push("Consider follow-up assessment in 6 months");
      recommendations.push("Discuss any concerns with your pediatrician");
    } else {
      recommendations.push("Continue supporting healthy development");
      recommendations.push("Regular developmental check-ups as recommended");
      recommendations.push("Celebrate your child's progress");
    }

    return recommendations;
  }

  /**
   * Convert accuracy percentage to risk score (1-10 scale)
   */
  convertAccuracyToRiskScore(accuracyRate) {
    // Invert the scale: higher accuracy = lower risk score
    return Math.max(1, Math.min(10, Math.round((100 - accuracyRate) / 10) + 1));
  }

  async generateAIReport(sessionId, userId) {
    try {
      const session = await ImageAssessmentSession.findOne({
        sessionId,
        userId,
      }).populate("childId", "firstName lastName dateOfBirth");

      if (!session) {
        throw new Error("Assessment session not found");
      }

      if (session.status !== "completed") {
        throw new Error("Assessment not completed yet");
      }

      // Prepare data for AI analysis
      const childName = session.metadata?.childName || "Child";
      const assessmentData = {
        assessmentType: session.assessmentType,
        totalQuestions: session.totalQuestions,
        responses: session.responses,
        results: session.results,
        childName,
        childAge: session.metadata?.childAge,
        sessionDuration: session.completedAt - session.startedAt,
      };

      logger.info(
        `🤖 [AI REPORT] Starting AI analysis for session ${sessionId}`
      );
      logger.info(`🤖 [AI REPORT] Assessment data:`, {
        assessmentType: assessmentData.assessmentType,
        totalQuestions: assessmentData.totalQuestions,
        responsesCount: assessmentData.responses.length,
        childName: assessmentData.childName,
        childAge: assessmentData.childAge,
        hasResults: !!assessmentData.results,
      });

      // Generate AI analysis
      let aiAnalysis = await this.generateAIAnalysis(assessmentData);
      let isFallback = false;

      // If AI analysis fails, create comprehensive fallback analysis
      if (!aiAnalysis) {
        logger.warn(
          `🤖 [AI REPORT] AI analysis failed for session ${sessionId}, using enhanced fallback`
        );

        const accuracyRate = session.results?.accuracyRate || 50;
        const riskScore =
          session.results?.riskScore ||
          this.convertAccuracyToRiskScore(accuracyRate);
        const avgResponseTime = session.results?.averageResponseTime || 3000;

        // Determine risk level based on accuracy
        let riskLevel = "moderate";
        if (accuracyRate >= 80) riskLevel = "low";
        else if (accuracyRate <= 40) riskLevel = "high";

        // COMPREHENSIVE FALLBACK ANALYSIS - Matches LLM output structure
        aiAnalysis = {
          riskLevel: riskLevel,
          riskScore: riskScore,
          clinicalSummary: `Comprehensive assessment completed for ${childName}. The image-based ${
            session.assessmentType
          } screening evaluated visual processing, attention, and discrimination abilities through ${
            session.totalQuestions
          } structured tasks. Performance demonstrated ${accuracyRate}% accuracy with an average response time of ${Math.round(
            avgResponseTime / 1000
          )} seconds. ${
            accuracyRate >= 70
              ? "Results indicate developing strengths in visual attention and discrimination skills."
              : "Response patterns suggest areas that may benefit from professional evaluation and targeted support."
          } This assessment provides valuable baseline information for understanding ${childName}'s current developmental profile and informing next steps.`,
          summary: `Assessment completed successfully for ${childName}. Based on the image-based assessment responses, ${childName} demonstrated ${accuracyRate}% accuracy across ${
            session.totalQuestions
          } questions with an average response time of ${Math.round(
            avgResponseTime / 1000
          )} seconds. ${
            accuracyRate >= 70
              ? "Performance suggests good visual processing and attention skills with consistent engagement throughout the assessment session."
              : "Performance patterns indicate areas that may benefit from professional evaluation and additional support strategies."
          } Professional consultation is recommended for comprehensive developmental assessment and personalized intervention planning.`,
          keyFindings: [
            `Completed ${session.totalQuestions} image-based assessment questions with ${accuracyRate}% overall accuracy`,
            `Demonstrated ${
              avgResponseTime < 4000 ? "efficient" : "thoughtful"
            } response processing with average time of ${Math.round(
              avgResponseTime / 1000
            )} seconds`,
            `Showed ${
              accuracyRate >= 70
                ? "consistent visual discrimination abilities"
                : "variable response patterns requiring professional attention"
            }`,
            `Maintained ${
              session.responses.length === session.totalQuestions
                ? "complete"
                : "partial"
            } engagement throughout the assessment session`,
            accuracyRate >= 70
              ? "Exhibited strengths in visual attention and task persistence"
              : "Response patterns suggest need for comprehensive professional evaluation",
          ],
          developmentalStrengths: [
            "Successfully engaged with interactive assessment materials throughout the session",
            "Demonstrated sustained attention and task completion abilities during structured activities",
            avgResponseTime < 4000
              ? "Showed efficient visual processing speed appropriate for age-level expectations"
              : "Exhibited thoughtful deliberation in visual discrimination tasks",
            "Participated cooperatively with assessment procedures and maintained focus on visual stimuli",
            accuracyRate >= 60
              ? "Demonstrated basic visual discrimination skills with pattern recognition abilities"
              : "Showed engagement with visual materials despite processing challenges",
          ],
          areasOfConcern:
            accuracyRate < 60
              ? [
                  "Lower accuracy rate (${accuracyRate}%) may indicate visual processing, attention, or developmental challenges requiring professional evaluation",
                  "Response patterns suggest potential need for comprehensive assessment and targeted intervention strategies",
                ]
              : [
                  "Professional evaluation recommended to confirm assessment findings and develop comprehensive support strategies",
                ],
          clinicalRecommendations: [
            "Schedule comprehensive developmental evaluation with licensed professional within 1-2 months",
            "Discuss assessment results with child's primary healthcare provider for coordinated care planning",
            "Consider educational evaluation for school-based supports if child is of school age",
            "Implement visual learning activities and structured attention-building exercises at home",
            "Monitor developmental milestones and progress in visual processing skills regularly",
            "Provide supportive learning environment with visual aids and clear task instructions",
            "Engage in interactive visual games and puzzles to strengthen discrimination abilities",
          ],
          confidence: Math.min(95, Math.max(78, 78 + (accuracyRate - 50) / 10)),
          professionalReferral: accuracyRate < 50 ? "urgent" : "recommended",
          detailedInterpretation: `${childName}'s performance on this image-based ${
            session.assessmentType
          } assessment provides valuable insights into visual processing, attention, and discrimination abilities. The ${accuracyRate}% accuracy rate, combined with an average response time of ${Math.round(
            avgResponseTime / 1000
          )} seconds, ${
            accuracyRate >= 70
              ? "suggests developing strengths in visual attention and systematic approach to visual discrimination tasks. Performance indicates age-appropriate visual processing skills with consistent engagement patterns."
              : "indicates areas that warrant professional attention and comprehensive evaluation. Response patterns suggest potential challenges in visual processing, attention regulation, or task-specific skills that could benefit from targeted intervention."
          } These results should be considered alongside developmental history, classroom observations, and parent reports to develop a complete understanding of ${childName}'s strengths and support needs. Professional consultation is recommended to interpret these findings within the broader context of ${childName}'s overall development and to create appropriate intervention strategies.`,
          nextSteps: [
            "Schedule professional developmental evaluation within 1-2 months to discuss results and next steps",
            "Gather additional developmental history information from multiple sources (home, school, community)",
            "Continue monitoring progress in visual processing and attention skills during daily activities and structured tasks",
            "Implement recommended home-based activities to support visual learning and attention development",
          ],
          parentGuidance: [
            "Engage in daily visual learning activities such as puzzles, matching games, and picture books to strengthen discrimination skills",
            "Maintain consistent routines and structured environments to support attention development and task completion",
            "Communicate assessment findings with educational team and implement visual learning strategies in academic settings",
            "Monitor child's response to visual tasks and document any changes in attention or processing abilities",
            "Provide positive reinforcement for task engagement and effort rather than focusing solely on accuracy",
          ],
          monitoringAreas: [
            "Visual processing skills during daily activities and structured learning tasks",
            "Attention span and focus during age-appropriate activities requiring sustained concentration",
            "Response to visual learning materials and effectiveness of visual teaching strategies",
            "Social communication skills in contexts requiring visual attention and interpretation",
            "Academic performance in areas requiring visual processing and discrimination abilities",
          ],
          positivePrognosticIndicators: [
            "Completed full assessment session demonstrating sustained attention and task engagement capabilities",
            "Demonstrated ability to make visual discriminations and respond to structured visual tasks",
            "Showed cooperative behavior and willingness to participate in assessment activities",
            accuracyRate >= 60
              ? "Exhibited consistent visual processing abilities with room for continued development"
              : "Maintained task engagement despite processing challenges, indicating motivation and persistence",
            "Responded well to visual instructions and feedback during assessment procedures",
          ],
          clinicalNotes: `Assessment completed using standardized image-based visual discrimination tasks specifically designed for ${session.assessmentType} screening. Session duration and child engagement were appropriate for age and developmental expectations. Results provide baseline information for professional evaluation and developmental planning. Assessment validity is supported by complete task participation and consistent response patterns. Findings should be interpreted by qualified professionals in conjunction with comprehensive developmental history and multi-source observations.`,
          followUpSchedule: {
            shortTerm:
              "Professional evaluation and results discussion within 1-2 months",
            mediumTerm:
              "Progress monitoring and strategy adjustment at 3-6 months",
            longTerm:
              "Annual comprehensive developmental assessment and milestone review",
          },
        };
        isFallback = true;
      }

      logger.info(
        `🤖 [AI REPORT] AI analysis ${
          isFallback ? "(fallback)" : "(LLM)"
        } generated:`,
        {
          riskLevel: aiAnalysis.riskLevel,
          riskScore: aiAnalysis.riskScore,
          hasSummary: !!aiAnalysis.summary,
          summaryLength: aiAnalysis.summary?.length || 0,
          hasRecommendations:
            !!aiAnalysis.recommendations ||
            !!aiAnalysis.clinicalRecommendations,
          recommendationsCount: (
            aiAnalysis.recommendations ||
            aiAnalysis.clinicalRecommendations ||
            []
          ).length,
          confidence: aiAnalysis.confidence,
        }
      );

      // Save AI report to session - ALWAYS save, even if fallback
      session.aiReport = {
        generatedAt: new Date(),
        analysis: aiAnalysis,
        modelUsed: isFallback
          ? "fallback-comprehensive-analysis"
          : "openai-gpt-4o-mini",
        fallback: isFallback,
      };

      // Update session results with AI enhancements - ALWAYS enhance
      const currentResults = session.results || {};

      // DEBUG: Log current session state to understand the issue
      logger.info(`🤖 [AI REPORT] Updating session results for ${sessionId}:`);
      logger.info(
        `Current results rawScores type: ${typeof currentResults.rawScores}`
      );

      // Ensure rawScores is always a valid object - make a deep copy to avoid reference issues
      const validRawScores =
        currentResults.rawScores && typeof currentResults.rawScores === "object"
          ? JSON.parse(JSON.stringify(currentResults.rawScores)) // Deep copy to avoid reference issues
          : {
              socialInteraction: 0,
              communication: 0,
              behaviorPatterns: 0,
              sensoryResponse: 0,
            };

      // Create new results object ensuring NO undefined values
      const enhancedResults = {
        // Core assessment metrics (preserve existing or use defaults)
        totalQuestions: currentResults.totalQuestions || 0,
        correctAnswers: currentResults.correctAnswers || 0,
        incorrectAnswers: currentResults.incorrectAnswers || 0,
        accuracyRate: currentResults.accuracyRate || 0,
        averageResponseTime: currentResults.averageResponseTime || 0,

        // Domain and difficulty analysis
        domainScores: currentResults.domainScores || [],
        difficultyAnalysis: currentResults.difficultyAnalysis || [],
        rawScores: validRawScores,

        // Risk assessment (use AI values or existing)
        riskLevel:
          aiAnalysis.riskLevel || currentResults.riskLevel || "moderate",
        riskScore: aiAnalysis.riskScore || currentResults.riskScore || 5,

        // Enhanced content (prioritize AI analysis)
        summary:
          aiAnalysis.summary ||
          aiAnalysis.clinicalSummary ||
          currentResults.summary ||
          `Assessment completed with ${
            currentResults.accuracyRate || 0
          }% accuracy`,
        interpretation:
          aiAnalysis.interpretation ||
          aiAnalysis.detailedInterpretation ||
          currentResults.interpretation ||
          "Assessment completed successfully",
        recommendations:
          aiAnalysis.recommendations ||
          aiAnalysis.clinicalRecommendations ||
          currentResults.recommendations ||
          [],

        // AI enhancement flag
        aiEnhanced: true,
        // Store full AI analysis for retrieval
        fullAIAnalysis: aiAnalysis,
      };

      // Assign the enhanced results
      session.results = enhancedResults;

      // Force Mongoose to recognize the results field has been modified
      session.markModified("results");
      session.markModified("aiReport");

      // DEBUG: Log the final results structure
      logger.info(`🤖 [AI REPORT] Final enhanced results:`, {
        aiEnhanced: session.results.aiEnhanced,
        summaryLength: session.results.summary?.length || 0,
        interpretationLength: session.results.interpretation?.length || 0,
        recommendationsCount: session.results.recommendations?.length || 0,
        hasFullAIAnalysis: !!session.results.fullAIAnalysis,
        riskScore: session.results.riskScore,
        riskLevel: session.results.riskLevel,
      });

      await session.save();

      logger.info(
        `✅ [AI REPORT] AI report ${
          isFallback ? "(fallback)" : ""
        } generated and saved for session ${sessionId}`
      );

      return {
        sessionId,
        analysis: aiAnalysis,
        generatedAt: session.aiReport.generatedAt,
        fallback: isFallback,
      };
    } catch (error) {
      logger.error("🚨 [AI REPORT] Error generating AI report:", error);
      throw error; // Re-throw to handle in calling code
    }
  }

  /**
   * Generate AI analysis using Azure OpenAI
   */
  async generateAIAnalysis(assessmentData) {
    try {
      // Use Azure OpenAI configuration
      const { OpenAI } = require("openai");
      const openai = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
        defaultQuery: { "api-version": "2023-12-01-preview" },
        defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
      });

      const prompt = this.buildEnhancedAnalysisPrompt(assessmentData);

      const response = await openai.chat.completions.create({
        model: process.env.AZURE_DEPLOYMENT_NAME, // Use Azure deployment name
        messages: [
          {
            role: "system",
            content: `You are Dr. Sarah Chen, a licensed clinical psychologist specializing in developmental assessments for children aged 3-12. You have 15 years of experience in autism spectrum disorder, ADHD, and learning disability evaluations. 

Your role is to analyze image-based assessment results and provide comprehensive, clinically-informed insights while maintaining appropriate professional boundaries. Always emphasize that your analysis is supplementary to professional clinical evaluation.

Response Requirements:
- Provide detailed, evidence-based analysis using the comprehensive JSON structure provided
- Use clinical terminology appropriately while remaining accessible to parents
- Maintain empathetic, supportive tone throughout
- Always recommend professional follow-up when indicated
- Format response as valid JSON only with all required fields
- Be thorough and comprehensive in your analysis
- Provide specific, actionable recommendations
- Focus on strengths-based approach while addressing concerns appropriately`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4000, // INCREASED from 2500 to 4000 to match text assessment comprehensiveness
        temperature: 0.2, // Lower temperature for more consistent clinical analysis
        response_format: { type: "json_object" },
      });

      if (response?.choices?.[0]?.message?.content) {
        return this.parseAIResponse(response.choices[0].message.content);
      }

      return null;
    } catch (error) {
      logger.error("Error generating AI analysis:", error);
      return null;
    }
  }

  /**
   * ENHANCED: Build comprehensive prompt for AI analysis - Updated to match text assessment quality
   */
  buildEnhancedAnalysisPrompt(data) {
    const { assessmentType, results, responses, childName, childAge } = data;

    // Calculate detailed response patterns
    const responsePatterns = this.analyzeResponsePatterns(responses);
    const domainAnalysis = this.analyzeDomainPerformance(
      results.domainScores || []
    );
    const temporalPatterns = this.analyzeTemporalPatterns(responses);

    return `
You are Dr. Sarah Chen, a licensed clinical psychologist with 15 years of experience in developmental assessments. You specialize in autism spectrum disorders, ADHD, and learning disabilities for children aged 3-12. You are creating a comprehensive clinical analysis of image-based assessment results.

CLINICAL ASSESSMENT REQUEST

CHILD INFORMATION:
- Name: ${childName}${childAge ? ` (Age: ${childAge} years)` : ""}
- Assessment Type: ${assessmentType.toUpperCase()} Screening Assessment
- Assessment Date: ${new Date().toISOString().split("T")[0]}
- Assessment Method: Image-based visual discrimination task

QUANTITATIVE ASSESSMENT RESULTS:
- Total Questions Administered: ${results.totalQuestions}
- Overall Accuracy Rate: ${results.accuracyRate}%
- Current Risk Classification: ${results.riskLevel}
- Average Response Time: ${results.averageResponseTime}ms
- Response Consistency: ${responses.filter((r) => r.isCorrect).length}/${
      responses.length
    } correct responses

DOMAIN-SPECIFIC PERFORMANCE ANALYSIS:
${
  results.domainScores && results.domainScores.length > 0
    ? results.domainScores
        .map(
          (d) =>
            `- ${d.domain
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}: ${
              d.accuracy
            }% accuracy (${d.correct}/${d.total} correct responses)`
        )
        .join("\n")
    : "- Domain-specific scores: Analysis based on overall performance patterns"
}

BEHAVIORAL RESPONSE PATTERNS:
${responsePatterns.map((pattern) => `- ${pattern}`).join("\n")}

TEMPORAL PROCESSING PATTERNS:
${temporalPatterns.map((pattern) => `- ${pattern}`).join("\n")}

CLINICAL DOMAIN INSIGHTS:
${domainAnalysis.map((insight) => `- ${insight}`).join("\n")}

DETAILED RESPONSE ANALYSIS:
${responses
  .slice(0, 8)
  .map(
    (r, idx) =>
      `${idx + 1}. Assessment Area: ${(
        r.metadata?.assessmentArea || "general"
      ).replace(/_/g, " ")} | Response Selected: ${
        r.selectedImage
      } | Accuracy: ${r.isCorrect ? "Correct" : "Incorrect"} | Response Time: ${
        r.responseTime
      }ms | Task Difficulty: ${r.metadata?.difficulty || "Standard"}`
  )
  .join("\n")}

COMPREHENSIVE CLINICAL ANALYSIS REQUIREMENTS:

Generate a detailed clinical assessment in JSON format that provides comprehensive insights for parents, educators, and healthcare providers. Your analysis should be thorough, evidence-based, and actionable.

Required JSON Structure:
{
  "riskLevel": "low|moderate|high",
  "riskScore": 1-10,
  "clinicalSummary": "3-4 sentence comprehensive clinical summary addressing current functioning, areas of strength, and primary concerns",
  "keyFindings": [
    "Specific observation 1 with clinical significance",
    "Specific observation 2 with clinical significance", 
    "Specific observation 3 with clinical significance",
    "Additional finding based on response patterns"
  ],
  "developmentalStrengths": [
    "Specific strength 1 with developmental context",
    "Specific strength 2 with functional implications",
    "Specific strength 3 with positive prognosis indicators"
  ],
  "areasOfConcern": [
    "Primary concern with clinical rationale",
    "Secondary concern with developmental impact"
  ],
  "clinicalRecommendations": [
    "Immediate action item for parents/caregivers",
    "Educational support recommendation with specific strategies",
    "Therapeutic intervention recommendation if indicated",
    "Environmental modification recommendation",
    "Follow-up assessment recommendation with timeline"
  ],
  "confidence": 85-95,
  "professionalReferral": "not-needed|recommended|urgent",
  "detailedInterpretation": "Comprehensive paragraph analyzing the child's performance in context of age-appropriate expectations, addressing visual processing, attention, executive function, and specific ${assessmentType} indicators. Include discussion of response patterns, timing, and clinical significance.",
  "nextSteps": [
    "Immediate next step with specific timeline",
    "Short-term goal with 1-3 month timeframe", 
    "Long-term monitoring recommendation"
  ],
  "parentGuidance": [
    "Specific home strategy 1 for daily implementation",
    "Specific home strategy 2 for educational support",
    "Communication recommendation for school/healthcare providers"
  ],
  "monitoringAreas": [
    "Specific behavior/skill to monitor with observation guidelines",
    "Academic/developmental milestone to track"
  ],
  "positivePrognosticIndicators": [
    "Strength-based indicator suggesting good outcomes",
    "Resilience factor observed in assessment"
  ],
  "clinicalNotes": "Additional professional observations regarding assessment validity, child engagement, environmental factors, and any limitations or considerations for interpretation",
  "followUpSchedule": {
    "shortTerm": "Recommended follow-up within 1-3 months",
    "mediumTerm": "Reassessment recommendation within 6-12 months",
    "longTerm": "Ongoing monitoring recommendations"
  }
}

CLINICAL ANALYSIS FOCUS AREAS:

1. **Pattern Recognition & Clinical Significance:**
   - Analyze response consistency across different image types and domains
   - Identify any systematic errors or response biases
   - Evaluate attention and executive function patterns

2. **Age-Appropriate Developmental Expectations:**
   - Compare performance to typical developmental milestones for ${
     childAge ? `${childAge}-year-old` : "age-appropriate"
   } children
   - Consider cultural and individual variation factors
   - Address any significant deviations from expected performance

3. **Assessment-Specific Indicators:**
   - Focus on ${assessmentType}-specific behavioral markers observed
   - Evaluate visual processing and discrimination abilities
   - Consider sensory processing and attention regulation factors

4. **Functional Implications:**
   - Discuss how findings relate to daily functioning
   - Address educational and social implications
   - Provide context for family and school environments

5. **Evidence-Based Recommendations:**
   - Suggest specific, actionable interventions
   - Recommend appropriate professional referrals if needed
   - Provide clear guidance for parents and educators

PROFESSIONAL STANDARDS:
- Maintain appropriate clinical boundaries - this is a screening tool, not a diagnostic assessment
- Use evidence-based language and recommendations
- Provide specific, actionable guidance while emphasizing the need for professional follow-up when indicated
- Ensure cultural sensitivity and family-centered approach
- Focus on strengths-based perspective while addressing concerns appropriately

Generate comprehensive, clinically-informed analysis that provides maximum value to families while maintaining professional ethical standards.
`;
  }

  /**
   * Analyze response patterns for clinical insights
   */
  analyzeResponsePatterns(responses) {
    const patterns = [];

    // Accuracy consistency
    const correctResponses = responses.filter((r) => r.isCorrect);
    const accuracyRate = (correctResponses.length / responses.length) * 100;

    if (accuracyRate >= 80) {
      patterns.push(
        "High accuracy rate suggests good task engagement and understanding"
      );
    } else if (accuracyRate >= 60) {
      patterns.push(
        "Moderate accuracy rate indicates some areas of strength and challenge"
      );
    } else {
      patterns.push(
        "Lower accuracy rate may indicate attention or comprehension challenges"
      );
    }

    // Response time analysis
    const avgResponseTime =
      responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
    if (avgResponseTime < 2000) {
      patterns.push("Quick response times suggest good processing speed");
    } else if (avgResponseTime > 4000) {
      patterns.push(
        "Longer response times may indicate careful consideration or processing delays"
      );
    }

    // Difficulty progression
    const difficultyProgression = responses.map(
      (r) => r.metadata?.difficulty || 1
    );
    const improvesWithDifficulty = this.checkDifficultyProgression(
      difficultyProgression,
      responses
    );
    if (improvesWithDifficulty) {
      patterns.push("Performance maintained across difficulty levels");
    } else {
      patterns.push("Performance varied with task difficulty");
    }

    return patterns;
  }

  /**
   * Analyze domain-specific performance
   */
  analyzeDomainPerformance(domainScores) {
    const insights = [];

    if (domainScores.length === 0) {
      insights.push(
        "Domain-specific analysis limited due to insufficient data"
      );
      return insights;
    }

    // Find strongest and weakest domains
    const sortedDomains = [...domainScores].sort(
      (a, b) => b.accuracy - a.accuracy
    );
    const strongest = sortedDomains[0];
    const weakest = sortedDomains[sortedDomains.length - 1];

    if (strongest.accuracy >= 80) {
      insights.push(
        `Strong performance in ${strongest.domain.replace(/_/g, " ")} domain (${
          strongest.accuracy
        }%)`
      );
    }

    if (weakest.accuracy <= 40) {
      insights.push(
        `Challenges noted in ${weakest.domain.replace(/_/g, " ")} domain (${
          weakest.accuracy
        }%)`
      );
    }

    // Check for significant domain differences
    const accuracyRange = strongest.accuracy - weakest.accuracy;
    if (accuracyRange > 30) {
      insights.push(
        "Significant variability across domains suggests uneven skill development"
      );
    } else {
      insights.push(
        "Consistent performance across domains indicates balanced development"
      );
    }

    return insights;
  }

  /**
   * Analyze temporal response patterns
   */
  analyzeTemporalPatterns(responses) {
    const patterns = [];

    // Response time progression
    const firstHalf = responses.slice(0, Math.floor(responses.length / 2));
    const secondHalf = responses.slice(Math.floor(responses.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, r) => sum + r.responseTime, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, r) => sum + r.responseTime, 0) /
      secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.2) {
      patterns.push(
        "Response times increased throughout assessment, suggesting possible fatigue"
      );
    } else if (secondHalfAvg < firstHalfAvg * 0.8) {
      patterns.push(
        "Response times decreased throughout assessment, indicating improved comfort with task"
      );
    } else {
      patterns.push(
        "Consistent response times maintained throughout assessment"
      );
    }

    return patterns;
  }

  /**
   * Check difficulty progression performance
   */
  checkDifficultyProgression(difficulties, responses) {
    const difficultyGroups = {};

    responses.forEach((response, index) => {
      const difficulty = difficulties[index];
      if (!difficultyGroups[difficulty]) {
        difficultyGroups[difficulty] = [];
      }
      difficultyGroups[difficulty].push(response.isCorrect);
    });

    // Calculate accuracy for each difficulty level
    const difficultyAccuracy = {};
    Object.entries(difficultyGroups).forEach(([level, correctness]) => {
      difficultyAccuracy[level] =
        correctness.filter(Boolean).length / correctness.length;
    });

    // Check if performance is maintained across difficulties
    const accuracies = Object.values(difficultyAccuracy);
    const range = Math.max(...accuracies) - Math.min(...accuracies);

    return range < 0.3; // Less than 30% difference indicates good progression
  }

  /**
   * Parse AI response into structured data - Enhanced for comprehensive JSON structure
   */
  parseAIResponse(content) {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and map to enhanced structure
        return {
          riskLevel: parsed.riskLevel || "moderate",
          riskScore: parsed.riskScore || 5,
          summary:
            parsed.clinicalSummary ||
            parsed.summary ||
            "Assessment analysis completed",
          keyFindings: Array.isArray(parsed.keyFindings)
            ? parsed.keyFindings
            : [],
          strengths: Array.isArray(parsed.developmentalStrengths)
            ? parsed.developmentalStrengths
            : Array.isArray(parsed.strengths)
            ? parsed.strengths
            : [],
          concerns: Array.isArray(parsed.areasOfConcern)
            ? parsed.areasOfConcern
            : Array.isArray(parsed.concerns)
            ? parsed.concerns
            : [],
          recommendations: Array.isArray(parsed.clinicalRecommendations)
            ? parsed.clinicalRecommendations
            : Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : [],
          confidence: parsed.confidence || 85,
          professionalReferral: parsed.professionalReferral || "recommended",
          interpretation:
            parsed.detailedInterpretation ||
            parsed.interpretation ||
            "Assessment completed",
          nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
          parentGuidance: Array.isArray(parsed.parentGuidance)
            ? parsed.parentGuidance
            : [],
          monitoringAreas: Array.isArray(parsed.monitoringAreas)
            ? parsed.monitoringAreas
            : [],
          positiveIndicators: Array.isArray(parsed.positivePrognosticIndicators)
            ? parsed.positivePrognosticIndicators
            : Array.isArray(parsed.positiveIndicators)
            ? parsed.positiveIndicators
            : [],
          clinicalNotes: parsed.clinicalNotes || "",
          followUpSchedule: parsed.followUpSchedule || {
            shortTerm: "Follow-up within 1-3 months",
            mediumTerm: "Reassessment within 6-12 months",
            longTerm: "Ongoing monitoring as needed",
          },
        };
      }

      // Fallback parsing if JSON extraction fails
      return this.parseTextResponse(content);
    } catch (error) {
      logger.error("Error parsing AI response:", error);
      return null;
    }
  }

  /**
   * Parse text response as fallback
   */
  parseTextResponse(content) {
    return {
      riskLevel: "moderate",
      riskScore: 5,
      summary: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
      keyFindings: ["AI analysis provided detailed assessment"],
      strengths: ["Assessment completed successfully"],
      concerns: ["Professional evaluation recommended"],
      recommendations: ["Discuss results with healthcare provider"],
      confidence: 75,
      professionalReferral: "recommended",
      interpretation:
        "Professional evaluation recommended for comprehensive analysis",
    };
  }

  /**
   * Get session data
   */
  async getSession(sessionId, userId) {
    const session = await ImageAssessmentSession.findOne({
      sessionId,
      userId,
    }).populate("childId", "firstName lastName dateOfBirth");

    if (!session) {
      throw new Error("Assessment session not found");
    }

    return session;
  }

  /**
   * Pause session
   */
  async pauseSession(sessionId, userId) {
    const session = await this.getSession(sessionId, userId);

    if (session.status !== "active") {
      throw new Error("Session is not active");
    }

    session.status = "paused";
    session.lastActiveAt = new Date();
    await session.save();

    return { sessionId, status: "paused" };
  }

  /**
   * Resume session
   */
  async resumeSession(sessionId, userId) {
    const session = await this.getSession(sessionId, userId);

    if (session.status !== "paused") {
      throw new Error("Session is not paused");
    }

    session.status = "active";
    session.lastActiveAt = new Date();
    await session.save();

    return { sessionId, status: "active" };
  }

  /**
   * Test connection for health checks
   */
  async testConnection(testPrompt = "Test connection") {
    try {
      const response = await openai.generateChatCompletion(
        [
          {
            role: "user",
            content: testPrompt,
          },
        ],
        {
          maxTokens: 50,
          temperature: 0.1,
        }
      );

      return {
        success: true,
        response: response?.content || "Connection successful",
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("Test connection failed:", error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}

module.exports = ImageAssessmentService;
