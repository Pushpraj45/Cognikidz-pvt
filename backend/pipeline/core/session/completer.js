/**
 * Assessment session completer
 * Handles completion of assessment sessions and final data persistence
 */

const { SessionManager } = require("../../memory/session-manager");
const { generateAssessmentSummary } = require("../summary/generator");
const { scheduleSessionCleanup } = require("../utils/session-utils");
const { calculateDuration } = require("../utils/formatters");

/**
 * Complete an assessment and generate summary
 * @param {string} sessionId - Session identifier
 * @param {string} reason - Reason for completion
 * @returns {Promise<Object>} - Assessment completion result
 */
async function completeAssessment(sessionId, reason = "natural_completion") {
  try {
    // Get final state
    const state = SessionManager.getCachedState(sessionId);
    if (!state) {
      return {
        success: false,
        error: "Session not found",
      };
    }

    // Mark assessment as completed or incomplete based on responses
    // Allow tests to force completion with 'test_completion' reason (even with 0 responses)
    const minResponses = reason === "test_completion" ? 0 : 3;
    const isComplete =
      state.responses && state.responses.length >= minResponses;
    state.status = isComplete ? "completed" : "incomplete";
    state.completedAt = new Date().toISOString();
    state.completionReason = reason;

    // Generate assessment summary
    const summary = await generateAssessmentSummary(sessionId, state);

    // Update final state
    SessionManager.setCachedState(sessionId, state);

    // Save summary to database (following pipeline-old pattern)
    try {
      console.log("Attempting to save assessment results to database");
      const Assessment = require("../../../domains/assessment/model");
      const assessment = await Assessment.findOne({ sessionId });

      if (assessment) {
        console.log("Found assessment in database, saving results");
        console.log("🔍 Summary object debug before saving:");
        console.log("summary.childName:", summary.childName);
        console.log("summary.childAge:", summary.childAge);
        console.log("summary.childGender:", summary.childGender);
        console.log("summary.assessmentType:", summary.assessmentType);
        console.log("summary.assessmentDate:", summary.assessmentDate);

        // Save the structured report data (matching pipeline-old format)
        console.log("🔍 About to save assessment.results with:");
        console.log("summary.childName:", summary.childName);
        console.log("summary.childAge:", summary.childAge);
        console.log("summary.childGender:", summary.childGender);
        console.log("summary.assessmentType:", summary.assessmentType);
        console.log("summary.assessmentDate:", summary.assessmentDate);

        assessment.results = {
          summary: summary.summary, // Keep markdown formatting for frontend parsing
          childAge: summary.childAge,
          childName: summary.childName,
          childGender: summary.childGender,
          assessmentDate: summary.assessmentDate,
          assessmentType: summary.assessmentType,
          disorderRisk: summary.disorderRisk,
          strengthsAndChallenges: summary.strengthsAndChallenges,
          domainScores: summary.domainScores,
          recommendations: summary.recommendations,
          followUpSchedule: {
            recommendedDate: summary.followUpSchedule?.recommendedDate
              ? new Date(summary.followUpSchedule.recommendedDate)
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months default
            focus:
              summary.followUpSchedule?.focus ||
              "Follow up with specialist for detailed assessment",
            urgency: summary.followUpSchedule?.urgency || "moderate",
            timeframe: summary.followUpSchedule?.timeframe || "2-4 months",
          },
          chartsData: summary.chartsData,
          keyFindings: summary.keyFindings,
          disclaimer: summary.disclaimer,
          assessmentMetadata: summary.assessmentMetadata,
        };

        // Ensure childId is saved in the assessment record
        if (state.childId) {
          assessment.childId = state.childId;
          console.log(`Setting assessment.childId to: ${state.childId}`);
        }

        // Ensure all domain scores are within valid range
        if (assessment.results.domainScores) {
          assessment.results.domainScores = assessment.results.domainScores.map(
            (domain) => ({
              ...domain,
              score: Math.min(10, Math.max(1, domain.score || 5)),
            })
          );
        }

        // Ensure disorder risk score is within valid range
        if (
          assessment.results.disorderRisk &&
          assessment.results.disorderRisk.score
        ) {
          assessment.results.disorderRisk.score = Math.min(
            10,
            Math.max(1, assessment.results.disorderRisk.score)
          );
        }

        assessment.completedAt = new Date();
        assessment.status = "completed";

        console.log("🔍 assessment.results before save:");
        console.log("Keys:", Object.keys(assessment.results));
        console.log("childName:", assessment.results.childName);
        console.log("childAge:", assessment.results.childAge);

        await assessment.save();
        console.log("Successfully saved assessment results to database");

        // Increment usage once per session for paid form assessments
        try {
          const typeForAccess = (assessment.results?.assessmentType || state.assessmentType || '').toLowerCase();
          const mapped = typeForAccess ? `${typeForAccess}-form` : null;
          if (mapped && mapped !== 'general-form' && assessment.usageCounted !== true) {
            const { incrementUsage } = require('../../../domains/pricing/usage');
            const incrementReq = { user: { _id: assessment.userId }, body: { resourceType: 'assessment', resourceKey: mapped, assessmentType: mapped } };
            let incResult = null;
            await incrementUsage(incrementReq, {
              json: (d) => { incResult = d; },
              status: (c) => ({ json: (o) => { incResult = { code: c, ...o }; } }),
            });
            console.log('🧮 Usage increment (form) result:', incResult);
            assessment.usageCounted = true;
            await assessment.save();
          }
        } catch (usageErr) {
          console.warn('Form assessment usage increment failed:', usageErr.message);
        }

        // Verify what was actually saved
        const savedAssessment = await Assessment.findOne({ sessionId });
        console.log("🔍 Verification - what was actually saved:");
        console.log("Saved keys:", Object.keys(savedAssessment.results));
        console.log("Saved childName:", savedAssessment.results.childName);
        console.log("Saved childAge:", savedAssessment.results.childAge);

        // Send assessment completion email for text assessments
        if (isComplete && state.childId) {
          try {
            const EmailNotificationService = require("../../../domains/assessment/email-notification-service");
            const ChildProfile = require("../../../domains/childprofile/model");
            const User = require("../../../domains/auth/model");

            const childProfile = await ChildProfile.findById(state.childId);
            const parent = await User.findById(assessment.userId);

            if (childProfile && parent) {
              const emailResult =
                await EmailNotificationService.sendAssessmentCompletionEmail(
                  assessment.results,
                  childProfile,
                  parent,
                  "text"
                );

              console.log(
                `📧 Text assessment completion email result:`,
                emailResult
              );
            }
          } catch (emailError) {
            console.error(
              "❌ Error sending text assessment completion email:",
              emailError
            );
            // Don't fail the assessment completion if email fails
          }
        }
      } else {
        console.log("No assessment found in database");
      }
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
    }

    // Schedule cleanup
    scheduleSessionCleanup(sessionId);

    return {
      success: true,
      sessionId,
      status: state.status,
      isComplete: isComplete,
      completionReason: reason,
      summary,
      riskScore: summary?.disorderRisk?.score || 5,
      recommendations: {
        ...(summary?.recommendations || []),
        timeframe: summary?.followUpSchedule?.timeframe || "3-6 months",
      },
      strengths: summary?.strengthsAndChallenges?.strengths || [],
      message: !isComplete
        ? "Assessment incomplete - more responses needed for comprehensive evaluation"
        : "Assessment completed successfully",
      assessmentData: {
        type: state.assessmentType,
        questionsAnswered: state.responses.length,
        duration: calculateDuration(state.startedAt, state.completedAt),
        completedAt: state.completedAt,
      },
    };
  } catch (error) {
    console.error("Error completing assessment:", error);
    return {
      success: false,
      error: "Failed to complete assessment",
      details: error.message,
    };
  }
}

module.exports = {
  completeAssessment,
};
