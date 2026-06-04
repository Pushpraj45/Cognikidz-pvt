/**
 * AI-powered assessment summary generation service
 * Handles interaction with OpenAI for generating comprehensive assessment reports
 */

/**
 * Generate AI-powered assessment summary with detailed narrative
 * @param {Object} state - Assessment state
 * @param {Object} overallRisk - Overall risk assessment
 * @param {number} abilityEstimate - Ability estimate score
 * @param {string} language - Language preference for the summary
 * @returns {Promise<Object>} - AI-generated summary content
 */
async function generateAIAssessmentSummary(
  state,
  overallRisk,
  abilityEstimate,
  language = 'en'
) {
  try {
    const { generateChatCompletion } = require("../../../utils/openai");

    // Extract child information (preserve the exact name passed in)
    const childName = state.formData.childName || "the child";
    const childAge =
      state.formData.age || state.formData.childAge || "unknown age";
    const assessmentType = state.assessmentType;

    console.log(`AI Summary Generation - Using child name: "${childName}"`);
    console.log(
      `AI Summary Generation - Child age: ${childAge}, Assessment type: ${assessmentType}`
    );

    // Clean the formData to remove any undefined values
    const cleanedFormData = {
      ...state.formData,
      childName: childName,
    };

    // Remove any undefined values from formData
    Object.keys(cleanedFormData).forEach((key) => {
      if (
        cleanedFormData[key] === undefined ||
        cleanedFormData[key] === "undefined"
      ) {
        delete cleanedFormData[key];
      }
    });

    // Prepare assessment data
    const assessmentData = {
      questions: state.questions,
      responses: state.responses,
    };

    // Create prompt based on assessment type
    let prompt;

    if (assessmentType.toLowerCase() === "general") {
      prompt = createGeneralAssessmentPrompt(
        cleanedFormData,
        assessmentData,
        childName,
        childAge,
        state
      );
    } else {
      prompt = createSpecificAssessmentPrompt(
        cleanedFormData,
        assessmentData,
        childName,
        childAge,
        assessmentType,
        abilityEstimate
      );
    }

    const messages = [
      {
        role: "system",
        content:
          `You are an expert child development specialist with extensive experience in ADHD, autism, and dyslexia assessments. Your reports are known for being comprehensive, empathetic, and actionable. IMPORTANT: Generate the entire report in ${language} language. If ${language} is not English, ensure the report is culturally appropriate and uses proper grammar and vocabulary for that language.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    console.log("🤖 Generating AI-powered assessment summary...");

    // Add configurable timeout for AI generation
    const summaryTimeoutMs = parseInt(process.env.AI_SUMMARY_TIMEOUT_MS || '1200000', 10); // default 20 minutes
    let timeoutId;
    const aiTimeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`AI summary generation timeout after ${summaryTimeoutMs}ms`));
      }, summaryTimeoutMs);
    });

    const aiGenerationPromise = generateChatCompletion(messages, {
      temperature: 0.6,
      max_tokens: 6000, // Increased for comprehensive assessments with 15 questions
    });

    let response;
    try {
      response = await Promise.race([aiGenerationPromise, aiTimeoutPromise]);
    } finally {
      clearTimeout(timeoutId); // Always clear timeout
    }

    const summaryText = response.choices[0].message.content;

    console.log("✅ AI summary generated successfully");
    console.log("Raw summary text length:", summaryText.length);

    return {
      summaryText,
    };
  } catch (error) {
    console.error("❌ AI summary generation failed:", error.message);

    // Fallback to comprehensive basic summary if AI fails
    return createFallbackSummary(state);
  }
}

/**
 * Create prompt for general assessment
 * @param {Object} cleanedFormData - Cleaned form data
 * @param {Object} assessmentData - Assessment questions and responses
 * @param {string} childName - Child's name
 * @param {string|number} childAge - Child's age
 * @param {Object} state - Assessment state
 * @returns {string} - Generated prompt
 */
function createGeneralAssessmentPrompt(
  cleanedFormData,
  assessmentData,
  childName,
  childAge,
  state
) {
  return `
You are a licensed child psychologist creating a comprehensive assessment summary for a GENERAL DEVELOPMENTAL SCREENING that covered multiple disorder areas.

CHILD INFORMATION:
\`\`\`json
${JSON.stringify(cleanedFormData)}
\`\`\`

QUESTIONS AND RESPONSES:
\`\`\`json
${JSON.stringify(assessmentData)}
\`\`\`

CRITICAL INSTRUCTIONS:
1. You MUST analyze actual response patterns from the assessment data provided
2. Generate REAL, SPECIFIC content based on the child's responses - NO PLACEHOLDERS OR "stay tuned" messages
3. Include the child's name, age, and specific observations throughout the report
4. Provide actionable recommendations based on the actual assessment responses
5. Calculate specific risk percentages based on response patterns
6. Include specific follow-up dates and recommendations

ASSESSMENT ANALYSIS:
You conducted a comprehensive screening that assessed for ADHD, Autism, Dyslexia, and general developmental concerns. 

CROSS-DISORDER ANALYSIS TASK:
1. Analyze responses for patterns indicative of each disorder
2. Calculate risk probabilities for each disorder area based on actual responses
3. Identify the PRIMARY area of concern (highest risk)
4. Note any comorbid patterns or overlapping symptoms
5. Provide specific recommendations for further assessment with timelines

IMPORTANT FORMATTING REQUIREMENTS:
1. Return your response as a MARKDOWN FORMATTED report with CONSISTENT section headers
2. ALWAYS include the following EXACT section headers:
   - # Comprehensive Developmental Screening Report for ${childName}
   - ## Assessment Overview
   - ## Cross-Disorder Risk Analysis
   - ## Primary Area of Concern
   - ## Strengths and Positive Indicators
   - ## Areas Requiring Attention
   - ## Specific Recommendations
   - ## Follow-Up Schedule
   - ## Professional Consultation Timeline

3. In the Assessment Overview section, include:
   - Child's name: ${childName}
   - Age at assessment: ${childAge}
   - Assessment date: ${new Date().toISOString().split("T")[0]}
   - Assessment duration and completion rate

4. In the Cross-Disorder Risk Analysis section, provide specific risk percentages based on actual responses:
   - **ADHD Risk:** [Low/Moderate/High] - [calculated percentage]% likelihood based on attention, hyperactivity, and impulsivity indicators
   - **Autism Risk:** [Low/Moderate/High] - [calculated percentage]% likelihood based on social communication and restricted interests
   - **Dyslexia Risk:** [Low/Moderate/High] - [calculated percentage]% likelihood based on language and reading-related responses
   - **General Developmental Concerns:** [Low/Moderate/High] - [calculated percentage]% likelihood based on overall developmental indicators

5. In Follow-Up Schedule section, provide:
   - **Immediate actions (next 2 weeks):** Specific steps for parents
   - **Short-term follow-up (1-3 months):** Professional consultations needed
   - **Long-term monitoring (6-12 months):** Ongoing assessment schedule
   - **Next comprehensive screening:** Recommended date (based on risk level)

6. Use bullet points with dash (-) character for lists
7. Keep tone positive, supportive, and informative for parents
8. Include ONE CONSISTENT overall risk score (1-10) for the primary concern area - use this SAME score throughout the report
9. Provide specific next steps with actual dates and professional types
10. CRITICAL: Ensure all references to risk scores throughout your response use the SAME score value

RISK ASSESSMENT GUIDELINES:
- **Low Risk (1-3):** Minimal indicators, typical development likely
- **Moderate Risk (4-7):** Some indicators present, further monitoring/assessment recommended  
- **High Risk (8-10):** Multiple indicators present, professional evaluation strongly recommended

The assessment is considered a COMPREHENSIVE SCREENING after ${
    state.responses.length
  } questions covering multiple domains.
Always refer to the child by name throughout the report and focus on actionable recommendations for parents.

IMPORTANT: This is a GENERAL SCREENING, not a diagnostic assessment. Emphasize that this identifies areas for further professional evaluation.

DO NOT USE PLACEHOLDER TEXT OR "STAY TUNED" MESSAGES. Generate actual, specific content based on the provided assessment data.
`;
}

/**
 * Create prompt for specific assessment type
 * @param {Object} cleanedFormData - Cleaned form data
 * @param {Object} assessmentData - Assessment questions and responses
 * @param {string} childName - Child's name
 * @param {string|number} childAge - Child's age
 * @param {string} assessmentType - Type of assessment
 * @param {number} abilityEstimate - Ability estimate
 * @returns {string} - Generated prompt
 */
function createSpecificAssessmentPrompt(
  cleanedFormData,
  assessmentData,
  childName,
  childAge,
  assessmentType,
  abilityEstimate
) {
  return `
You are a child psychologist creating an assessment summary report.

CHILD INFORMATION:
\`\`\`json
${JSON.stringify(cleanedFormData)}
\`\`\`

ASSESSMENT HISTORY:
Previous assessment responses and patterns

QUESTIONS AND RESPONSES:
\`\`\`json
${JSON.stringify(assessmentData)}
\`\`\`

ABILITY ESTIMATE:
${abilityEstimate}

TASK:
Generate a comprehensive assessment summary based on the intake information and assessment results.
Focus particularly on providing useful, actionable information for parents and educators.

CRITICAL FORMATTING REQUIREMENTS - FOLLOW EXACTLY:
1. MUST return your response as MARKDOWN with proper section headers
2. ALWAYS include these EXACT section headers with proper ## markdown formatting:

# Assessment Summary Report for ${childName}

## Overview of Strengths and Challenges
[Provide an overview paragraph here]

## Strengths
- [First strength with specific details]
- [Second strength with specific details] 
- [Third strength with specific details]

## Challenges
- [First challenge with specific details]
- [Second challenge with specific details]
- [Third challenge with specific details]

## Recommendations
- [First recommendation with specific action steps]
- [Second recommendation with specific action steps]
- [Third recommendation with specific action steps]

## Next Steps
- [First next step with timeline]
- [Second next step with timeline]
- [Third next step with timeline]

3. Each bullet point MUST start with a dash (-) character
4. Include a risk score (1-10) in the overview section
5. Keep the report positive and supportive in tone
6. Write in a professional but warm style for non-specialists
7. Each section must have at least 2-3 specific, actionable bullet points

IMPORTANT: The markdown headers (##) are REQUIRED for proper parsing. Do not use plain text headers.
`;
}

/**
 * Create fallback summary when AI generation fails
 * @param {Object} state - Assessment state
 * @returns {Object} - Fallback summary
 */
function createFallbackSummary(state) {
  const childName = state.formData.childName || "Child";
  const assessmentType = state.assessmentType.toUpperCase();
  const childAge =
    state.formData.age || state.formData.childAge || "unknown age";

  return {
    summaryText: `# Assessment Summary Report for ${childName}

## Assessment Overview
${childName}, age ${childAge}, has completed a ${assessmentType} assessment with ${state.responses.length} questions. The assessment covered key developmental areas and provides insights into their current functioning. While detailed AI analysis is temporarily unavailable, the core assessment data shows meaningful patterns that can guide next steps.

## Strengths and Positive Indicators
- **Assessment Completion**: Successfully completed all required assessment components
- **Engagement**: Demonstrated ability to participate in the evaluation process
- **Response Patterns**: Provided consistent responses across assessment domains

## Areas Requiring Attention
- **Areas for Monitoring**: Some responses indicate areas that may benefit from continued observation
- **Professional Follow-up**: Assessment results suggest value in professional consultation

## Specific Recommendations
- **Professional Consultation**: Consider scheduling a follow-up with a qualified healthcare provider
- **Continued Monitoring**: Track development and behaviors in identified areas of concern
- **Support Systems**: Engage appropriate educational and family support resources

## Follow-Up Schedule
- **Schedule Follow-up**: Arrange professional consultation within 1-2 months
- **Review Results**: Discuss findings with child's support team
- **Monitor Progress**: Continue observing and documenting behavioral patterns`,
  };
}

module.exports = {
  generateAIAssessmentSummary,
  createGeneralAssessmentPrompt,
  createSpecificAssessmentPrompt,
  createFallbackSummary,
};
