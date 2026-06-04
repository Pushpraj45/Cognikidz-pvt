/**
 * Assessment session starter
 * Handles the initialization and start of new assessment sessions
 */

const questionGenerator = require("../question-generator");
const { SessionManager } = require("../../memory/session-manager");
const { getAssessmentMetadata } = require("../../resources");
const { validateAssessmentData } = require("../utils/validators");
const { generateSessionId } = require("../utils/session-utils");
const AssessmentState = require("../../state");

/**
 * Start a new assessment session
 * @param {Object} data - Assessment initialization data
 * @returns {Promise<Object>} - Assessment start result
 */
async function startAssessment(data) {
  try {
    // Validate input data
    const validation = validateAssessmentData(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: "Failed to start assessment: " + validation.errors.join(", "),
        details: validation.errors,
      };
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Initialize assessment state
    const language = data.formData?.language || data.language || 'en';
    const formDataWithLanguage = {
      ...data.formData,
      language: language // Ensure language is in formData for consistency
    };
    
    const state = new AssessmentState({
      sessionId,
      assessmentType: data.assessmentType || "general",
      formData: formDataWithLanguage,
      intakeId: data.formData?.intake?._id || null, // Extract intakeId from formData
      childId: data.formData?.childId || null, // Extract childId from formData
      userId: data.userId || null, // Extract userId from data
      language: language, // Store language preference
      startedAt: new Date().toISOString(),
      status: "active",
      questions: [],
      responses: [],
      currentQuestionIndex: 0,
    });

    // Cache initial state
    SessionManager.setCachedState(sessionId, state);

    // Get assessment metadata
    const metadata = getAssessmentMetadata(data.assessmentType);

    // Generate first question with language support
    // 🔍 DEBUG: Log language parameter flow in session starter
    console.log('🔍 [LANGUAGE DEBUG] Session Starter Language Flow:', {
      sessionId,
      assessmentType: data.assessmentType,
      formDataLanguage: formDataWithLanguage.language,
      dataLanguage: data.language,
      finalLanguage: language,
      languageType: typeof language,
      languageUndefined: language === undefined,
      languageNull: language === null,
      formDataKeys: Object.keys(formDataWithLanguage || {}),
      dataKeys: Object.keys(data || {}),
      hasLanguageInFormData: 'language' in (formDataWithLanguage || {}),
      hasLanguageInData: 'language' in (data || {})
    });
    
    const firstQuestion = await questionGenerator.generateQuestion(
      sessionId,
      data.assessmentType,
      state,
      formDataWithLanguage,
      language
    );

    if (!firstQuestion.success) {
      return {
        success: false,
        error: "Failed to generate first question",
        details: firstQuestion.error,
      };
    }

    // Update state with first question
    state.questions.push(firstQuestion.question);
    state.currentQuestion = firstQuestion.question;
    SessionManager.setCachedState(sessionId, state);

    // Save initial state to MongoDB only if we have valid data
    try {
      // Only save if we have an intakeId (required by schema)
      if (state.intakeId) {
        await state.save();
        console.log(
          `Assessment state saved to MongoDB for session: ${sessionId}`
        );
      } else {
        console.log(
          `Assessment state kept in cache only (no intakeId) for session: ${sessionId}`
        );
      }
    } catch (error) {
      console.error("Error saving assessment state to MongoDB:", error);
      // Don't fail the assessment start - keep it in cache
      console.log(
        `Keeping assessment in cache only due to save error for session: ${sessionId}`
      );
    }

    return {
      success: true,
      sessionId,
      assessmentType: data.assessmentType,
      status: "active",
      metadata,
      question: firstQuestion.question,
      currentQuestion: firstQuestion.question,
      questionMetadata: firstQuestion.metadata,
      progress: {
        currentQuestion: 1,
        totalQuestions: metadata?.estimatedQuestions || 15, // Updated to 15 for comprehensive assessments
        percentComplete: 7, // Adjusted for 15 questions
      },
      startedAt: state.startedAt,
    };
  } catch (error) {
    console.error("Error starting assessment:", error);
    return {
      success: false,
      error: "Failed to start assessment",
      details: error.message,
    };
  }
}

module.exports = {
  startAssessment,
};
