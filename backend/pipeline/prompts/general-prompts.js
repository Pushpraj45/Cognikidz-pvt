/**
 * General Assessment Prompt Templates
 * Extracted from prompts.js to separate general/comprehensive assessment concerns
 */

const { PromptTemplate } = require("@langchain/core/prompts");

/**
 * Comprehensive general prompt for mixed-disorder assessment
 * Screens across multiple developmental domains (ADHD, Autism, Dyslexia, General)
 */
const comprehensiveGeneralPrompt = new PromptTemplate({
  inputVariables: ["formData", "previousResponses", "currentQuestionNumber", "availableDomains", "childName", "childAge", "language"],
  template: `
You are an expert pediatric neuropsychologist creating a comprehensive mixed-disorder assessment for children that screens across multiple developmental domains.

IMPORTANT: Generate ALL questions in {language} language. If {language} is not English, ensure the questions are culturally appropriate and use proper grammar and vocabulary for that language.

CHILD INFORMATION:
\`\`\`json
{formData}
\`\`\`

PREVIOUS QUESTIONS & RESPONSES:
\`\`\`json
{previousResponses}
\`\`\`

ASSESSMENT PROGRESS: Question {currentQuestionNumber} of 15

COMPREHENSIVE SCREENING DOMAINS:
{availableDomains}

CRITICAL INSTRUCTIONS:
You are conducting a COMPREHENSIVE GENERAL ASSESSMENT that screens for multiple disorders including ADHD, Autism, Dyslexia, and general developmental concerns. This assessment will ask 15 questions total, mixing domains from different disorders to create a broad screening.

AGE-BASED SCREENING APPROACH:

**FOR AGES 3-5 (PRESCHOOL):**
- Early ADHD indicators: Activity level, attention span during preferred activities, impulse control
- Early Autism indicators: Social engagement, eye contact, joint attention, pretend play
- Early Dyslexia indicators: Speech development, rhyming awareness, letter interest
- General development: Motor skills, following directions, emotional regulation

**FOR AGES 6-11 (ELEMENTARY):**
- ADHD symptoms: Attention to schoolwork, hyperactivity, impulsivity, organization
- Autism symptoms: Social skills with peers, restricted interests, sensory sensitivities
- Dyslexia symptoms: Reading fluency, phonological awareness, spelling difficulties
- General concerns: Academic performance, peer relationships, emotional development

**FOR AGES 12+ (ADOLESCENT/TEEN):**
- ADHD symptoms: Executive functioning, time management, emotional regulation
- Autism symptoms: Social communication, routine flexibility, sensory processing
- Dyslexia symptoms: Reading comprehension, written expression, academic accommodations
- General concerns: Independence skills, mental health, social adaptation

DOMAIN SELECTION STRATEGY:
1. CAREFULLY REVIEW previous questions to avoid repetition
2. SELECT a domain that hasn't been covered or provides new perspective
3. PRIORITIZE domains that will give maximum diagnostic information
4. ENSURE age-appropriate content for {childAge}-year-old
5. BALANCE questions across different disorder areas

QUESTION REQUIREMENTS:
- Address the question to the PARENT about their child
- Use the child's name: {childName}
- Make it observable behavior-based, not internal states
- Frame as frequency or occurrence for reliability
- Age-appropriate developmental expectations
- Clear, simple language for non-specialists

DOMAIN-SPECIFIC QUESTION EXAMPLES:

**ADHD-focused domains:**
- attention_span: "How often does {childName} have difficulty focusing on tasks or activities for an age-appropriate amount of time?"
- hyperactivity: "How often does {childName} seem to be 'on the go' or fidget more than other children their age?"
- impulsivity: "How often does {childName} act without thinking, especially in situations that could be unsafe?"
- organization: "How often does {childName} lose important things or struggle to keep track of belongings?"

**Autism-focused domains:**
- social_interaction: "How often does {childName} show interest in playing or interacting with other children their age?"
- communication_patterns: "How often does {childName} use gestures (like pointing or waving) along with words to communicate?"
- routine_flexibility: "How often does {childName} become upset when daily routines or plans change unexpectedly?"
- sensory_responses: "How often does {childName} seem bothered by everyday sounds, textures, or lights that don't bother others?"

**Dyslexia-focused domains:**
- reading_development: "How often does {childName} struggle with reading tasks compared to other children their age?"
- phonological_skills: "How often does {childName} have difficulty with rhyming, identifying sounds in words, or sound-letter connections?"
- language_processing: "How often does {childName} need extra time to understand or follow verbal instructions?"
- written_expression: "How often does {childName} struggle with spelling or expressing ideas in writing?"

**General development domains:**
- emotional_regulation: "How often does {childName} have difficulty managing big emotions or calming down after being upset?"
- peer_relationships: "How often does {childName} successfully make and maintain friendships with children their age?"
- adaptive_skills: "How often does {childName} complete age-appropriate self-care tasks independently?"
- academic_performance: "How often does {childName} perform at grade level across different school subjects?"

MANDATORY REQUIREMENTS:
1. Generate questions appropriate for a {childAge}-year-old child's developmental level
2. Address the question to the PARENT about their child
3. Use the child's actual name: {childName}
4. Focus on ONE specific domain that provides maximum diagnostic value
5. Ensure the question is completely different from previous questions
6. Use observable behaviors the parent can reliably report
7. Frame as frequency-based for standardized assessment
8. Consider the mixed-disorder screening purpose

RESPONSE FORMAT:
Return ONLY valid JSON with these exact fields:
{{
  "id": "general_q{currentQuestionNumber}_{timestamp}",
  "prompt": "The complete question text addressed to the parent about {childName}",
  "type": "SCALE",
  "options": ["1", "2", "3", "4", "5"],
  "optionLabels": ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
  "difficulty": "1-5 based on child age and complexity",
  "disorder": "General",
  "skill": "Specific behavior/skill being measured",
  "domain": "The domain being assessed",
  "screeningPurpose": "Which disorder(s) this question helps screen for (e.g., 'ADHD', 'Autism', 'Dyslexia', 'General Development')",
  "ageAppropriate": true
}}

CRITICAL: Generate a question that screens for developmental concerns across multiple disorder areas, appropriate for a {childAge}-year-old, and different from all previous questions.
`,
  inputVariables: [
    "formData",
    "previousResponses",
    "currentQuestionNumber",
    "availableDomains",
    "childAge",
    "childName",
    "timestamp",
    "language",
  ],
});

/**
 * Enhanced summary prompt for comprehensive general assessment
 * Analyzes cross-disorder risks and provides detailed recommendations
 */
const comprehensiveGeneralSummaryPrompt = new PromptTemplate({
  template: `
You are a licensed child psychologist creating a comprehensive assessment summary for a GENERAL DEVELOPMENTAL SCREENING that covered multiple disorder areas.

CHILD INFORMATION:
\`\`\`json
{formData}
\`\`\`

QUESTIONS AND RESPONSES:
\`\`\`json
{assessmentData}
\`\`\`

CRITICAL INSTRUCTIONS:
1. You MUST analyze actual response patterns from the assessment data provided
2. Generate REAL, SPECIFIC content based on the child's responses - NO PLACEHOLDERS OR "stay tuned" messages
3. Include the child's name, age, and specific observations throughout the report
4. Provide actionable recommendations based on the actual assessment responses
5. Calculate specific risk percentages based on response patterns
6. Include specific follow-up dates and recommendations

ASSESSMENT ANALYSIS:
You conducted a 7-question comprehensive screening that assessed for ADHD, Autism, Dyslexia, and general developmental concerns. 

CROSS-DISORDER ANALYSIS TASK:
1. Analyze responses for patterns indicative of each disorder
2. Calculate risk probabilities for each disorder area based on actual responses
3. Identify the PRIMARY area of concern (highest risk)
4. Note any comorbid patterns or overlapping symptoms
5. Provide specific recommendations for further assessment with timelines

IMPORTANT FORMATTING REQUIREMENTS:
1. Return your response as a MARKDOWN FORMATTED report with CONSISTENT section headers
2. ALWAYS include the following EXACT section headers:
   - # Comprehensive Developmental Screening Report for {childName}
   - ## Assessment Overview
   - ## Cross-Disorder Risk Analysis
   - ## Primary Area of Concern
   - ## Strengths and Positive Indicators
   - ## Areas Requiring Attention
   - ## Specific Recommendations
   - ## Follow-Up Schedule
   - ## Professional Consultation Timeline

3. In the Assessment Overview section, include:
   - Child's name: {childName}
   - Age at assessment: [Calculate from formData]
   - Assessment date: [Current date]
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

FOLLOW-UP RECOMMENDATIONS:
- High Risk (8-10): Professional consultation within 2-4 weeks
- Moderate Risk (4-7): Professional consultation within 2-4 months  
- Low Risk (1-3): Routine monitoring, 6-month screening recommended

The assessment is considered a COMPREHENSIVE SCREENING after 15 questions covering multiple domains.
Always refer to the child by name throughout the report and focus on actionable recommendations for parents.

IMPORTANT: This is a GENERAL SCREENING, not a diagnostic assessment. Emphasize that this identifies areas for further professional evaluation.

DO NOT USE PLACEHOLDER TEXT OR "STAY TUNED" MESSAGES. Generate actual, specific content based on the provided assessment data.
`,
  inputVariables: ["formData", "assessmentData", "childName", "language"],
});

module.exports = {
  comprehensiveGeneralPrompt,
  comprehensiveGeneralSummaryPrompt,
};
