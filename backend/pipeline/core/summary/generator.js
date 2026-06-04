/**
 * Assessment summary generation orchestrator
 * Coordinates the generation of comprehensive assessment summaries
 */

const { generateAIAssessmentSummary } = require("./ai-service");
const { parseAISummaryText } = require("./parser");
const { calculateOverallRiskScore } = require("../scoring/risk-calculator");
const { generateDomainScores } = require("../scoring/domain-scorer");
const { compileKeyFindings } = require("../scoring/findings");
const { generateFollowUpSchedule } = require("../recommendations/scheduler");
const { generateChartsData } = require("../data/charts");
const { calculateAverageConfidence } = require("../scoring/risk-calculator");
const { calculateDuration } = require("../utils/formatters");

/**
 * Generate comprehensive assessment summary
 * @param {string} sessionId - Session identifier
 * @param {Object} state - Assessment state
 * @returns {Promise<Object>} - Assessment summary
 */
async function generateAssessmentSummary(sessionId, state) {
  try {
    console.log(`Generating comprehensive summary for session: ${sessionId}`);

    // Validate required parameters
    if (!sessionId) {
      throw new Error("SessionId is required for summary generation");
    }

    if (!state) {
      throw new Error("Assessment state is required for summary generation");
    }

    // Ensure state has required properties with defaults
    ensureStateDefaults(state);

    // Resolve child data from database
    const childData = await resolveChildData(state);

    // Update state with proper child data
    state.formData.childName = childData.finalChildName;
    state.formData.age = childData.childAge;
    state.formData.gender = childData.childGender;

    console.log(
      `🎯 Final child data - Name: "${childData.finalChildName}", Age: ${childData.childAge}, Gender: ${childData.childGender}`
    );

    // Ensure age is available for the report
    if (state.formData && !state.formData.age && state.formData.dateOfBirth) {
      try {
        const birthDate = new Date(state.formData.dateOfBirth);
        const age = Math.floor(
          (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        state.formData.age = age;
      } catch (ageError) {
        console.warn("Error calculating age from dateOfBirth:", ageError);
      }
    }

    // Calculate overall risk score first
    const overallRisk = calculateOverallRiskScore(state.responses);
    // Make score available to parser as a hint if LLM text doesn't include explicit score
    global.__PIPELINE_OVERALL_RISK_SCORE__ = overallRisk.score;

    // Generate ability estimate for risk calculation (legacy compatibility)
    const abilityEstimate = Math.max(1, Math.min(10, overallRisk.score * 10));

    // Generate AI-powered comprehensive summary with language support
    const language = state.language || state.formData?.language || 'en';
    const aiSummary = await generateAIAssessmentSummary(
      state,
      overallRisk,
      abilityEstimate,
      language
    );

    // Parse the AI summary for structured data
    const structuredSummary = parseAISummaryText(
      aiSummary.summaryText,
      state.formData.childName
    );

    // Generate domain scores based on assessment type and risk score
    const domainScores = generateDomainScores(
      state,
      structuredSummary.finalRiskScore || overallRisk.score
    );

    // Generate follow-up schedule
    const followUpSchedule = generateFollowUpSchedule(
      structuredSummary.finalRiskScore || overallRisk.score,
      state.assessmentType
    );

    // Generate charts data
    const chartsData = generateChartsData(state);

    // Compile key findings
    const keyFindings = compileKeyFindings(state.responses);

    // Add debugging to see what child name is being returned
    console.log("🔍 Backend Summary Debug:");
    console.log("state.formData.childName:", state.formData.childName);
    console.log(
      "Final summary childName being returned:",
      state.formData.childName
    );
    console.log("state.formData:", state.formData);

    const summaryResult = {
      summary: structuredSummary.cleanedSummaryText, // AI-generated narrative text
      childName: state.formData.childName,
      childAge: state.formData.age,
      childGender: state.formData.gender || state.formData.childGender,
      assessmentDate: new Date().toISOString().split("T")[0],
      assessmentType: state.assessmentType,
      disorderRisk: {
        score: structuredSummary.finalRiskScore || overallRisk.score,
        interpretation:
          structuredSummary.finalRiskScore <= 3
            ? "Low Risk"
            : structuredSummary.finalRiskScore <= 7
            ? "Moderate Risk"
            : "High Risk",
      },
      strengthsAndChallenges: {
        strengths: structuredSummary.strengths,
        challenges: structuredSummary.challenges,
      },
      domainScores,
      recommendations: structuredSummary.recommendations,
      followUpSchedule,
      chartsData,
      keyFindings,
      disclaimer:
        "This is an AI-generated assessment based on a limited set of responses. It should not replace professional medical advice, diagnosis, or treatment.",
      assessmentMetadata: {
        type: state.assessmentType,
        questionsAnswered: state.responses.length,
        averageConfidence: calculateAverageConfidence(state.responses),
        completionDate: state.completedAt,
        sessionDuration: calculateDuration(state.startedAt, state.completedAt),
      },
    };

    console.log("📋 Final summary result childName:", summaryResult.childName);
    console.log("📋 Final summary result childAge:", summaryResult.childAge);
    console.log(
      "📋 Final summary result childGender:",
      summaryResult.childGender
    );
    console.log(
      "📋 Final summary result assessmentType:",
      summaryResult.assessmentType
    );
    console.log("📋 Final summary result keys:", Object.keys(summaryResult));
    return summaryResult;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error(`Summary generation failed: ${error.message}`);
  }
}

/**
 * Ensure state has required properties with defaults
 * @param {Object} state - Assessment state to validate
 */
function ensureStateDefaults(state) {
  // Ensure state has required properties with defaults
  if (!state.formData) {
    console.warn("No formData found in state, creating default formData");
    state.formData = {};
  }

  if (!state.responses) {
    console.warn("No responses found in state, creating empty responses array");
    state.responses = [];
  }

  if (!state.assessmentType) {
    console.warn('No assessmentType found in state, using default "general"');
    state.assessmentType = "general";
  }

  if (!state.startedAt) {
    console.warn("No startedAt found in state, using current time");
    state.startedAt = new Date().toISOString();
  }

  if (!state.completedAt) {
    console.warn("No completedAt found in state, using current time");
    state.completedAt = new Date().toISOString();
  }

  // Ensure formData has default values for commonly accessed properties
  if (!state.formData.age && !state.formData.childAge) {
    state.formData.age = 5; // Default age
  }
}

/**
 * Resolve child data from database
 * @param {Object} state - Assessment state
 * @returns {Promise<Object>} - Resolved child data
 */
async function resolveChildData(state) {
  let finalChildName = "the child"; // Default fallback
  let childAge = state.formData.age;
  let childGender = state.formData.gender;

  console.log("🔍 Backend Child Name Resolution Debug:");
  console.log("state.childId:", state.childId);
  console.log("state.intakeId:", state.intakeId);
  console.log("state.formData.childId:", state.formData?.childId);

  // Try to get actual child profile from database
  try {
    const ChildProfile = require("../../../domains/childprofile/model");

    let childId = null;

    // Try to get childId from various sources (prioritize state.childId)
    if (state.childId) {
      childId = state.childId;
    } else if (state.formData?.childId) {
      childId = state.formData.childId;
    } else if (state.formData?.intake?.childId) {
      childId = state.formData.intake.childId;
    } else if (state.intakeId) {
      // If we have intakeId, fetch the intake to get childId
      const Intake = require("../../../domains/intake/model");
      const intake = await Intake.findById(state.intakeId);
      if (intake && intake.childId) {
        childId = intake.childId;
      }
    }

    console.log("🔍 Using childId for lookup:", childId);

    if (childId) {
      const childProfile = await ChildProfile.findById(childId);
      if (childProfile) {
        // Build full name from child profile
        const firstName = childProfile.firstName?.trim() || "";
        const lastName = childProfile.lastName?.trim() || "";

        if (firstName) {
          // Only include lastName if it's not null, undefined, or empty
          finalChildName =
            lastName && lastName !== "null" && lastName !== "undefined"
              ? `${firstName} ${lastName}`
              : firstName;
          childAge = childProfile.age || childAge; // Use virtual age from child profile
          childGender = childProfile.gender || childGender;

          console.log(
            `✅ Found child profile: "${finalChildName}", age: ${childAge}, gender: ${childGender}`
          );
        }
      } else {
        console.log("❌ Child profile not found for childId:", childId);
      }
    } else {
      console.log("❌ No childId available for profile lookup");
    }
  } catch (dbError) {
    console.error("❌ Error fetching child profile:", dbError.message);
  }

  // Fallback to formData if database lookup failed
  if (finalChildName === "the child") {
    const nameSources = [
      state.formData?.childName,
      state.formData?.intake?.childName,
      state.formData?.name,
    ];

    for (const nameSource of nameSources) {
      if (nameSource) {
        const cleanedName = nameSource.toString().trim();
        if (
          cleanedName &&
          !cleanedName.match(
            /^(undefined|null|test\s*child|N\/A|NA|the child)$/i
          ) &&
          cleanedName.length > 0
        ) {
          finalChildName = cleanedName;
          console.log(`✅ Using fallback name: "${finalChildName}"`);
          break;
        }
      }
    }
  }

  return {
    finalChildName,
    childAge,
    childGender,
  };
}

module.exports = {
  generateAssessmentSummary,
  ensureStateDefaults,
  resolveChildData,
};
