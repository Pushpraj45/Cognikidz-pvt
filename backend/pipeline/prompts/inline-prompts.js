/**
 * Inline Prompt Templates
 * Extracted from graph.js to separate inline prompt definitions
 */

const { PromptTemplate } = require("@langchain/core/prompts");

/**
 * Fallback prompt template for non-specific assessments
 * Extracted from graph.js lines 458-506
 */
const fallbackQuestionPrompt = new PromptTemplate({
  inputVariables: [
    "formData",
    "disorder",
    "difficulty",
    "history",
    "previousResponses",
    "language",
  ],
  template: `
You are an expert pediatric neuropsychologist creating a digital assessment for children with developmental concerns.

IMPORTANT: Generate ALL questions in {language} language. If {language} is not English, ensure the questions are culturally appropriate and use proper grammar and vocabulary for that language.

CHILD INFORMATION:
\`\`\`json
{formData}
\`\`\`

PREVIOUS INTERACTIONS:
{history}

PREVIOUS RESPONSES:
{previousResponses}

TASK:
Generate 1 question to assess for {disorder} at difficulty level {difficulty} (1-5).
Based on previous responses, create a question that builds upon existing information and explores new aspects.

CRITICAL REQUIREMENTS:
- ALWAYS address the question to the PARENT about their child, never directly to the child
- ALWAYS include the child's name in the question (e.g., "When your child [name]" or "How often does [name]")
- Format ALL questions to start with "When your child [name]" or "How often does [name]"
- Make the question age-appropriate considering the child's age in the intake form
- Ensure questions are HIGHLY SPECIFIC to the {disorder} being assessed
- For ADHD: Focus on attention, hyperactivity, impulsivity, and executive function
- For Autism/ASD: Focus on social communication, restrictive interests, and sensory sensitivities
- For Dyslexia: Focus on reading, phonological awareness, and language processing
- For General: Focus on developmental milestones appropriate for the child's age
- Match the difficulty to the child's current functioning level
- Avoid repeating similar questions that have already been asked
- Target areas that haven't been well-covered by previous questions
- Questions should be phrased in a neutral, non-leading way
- Use clear and simple language understandable by non-specialists
- Consider the specific concerns mentioned in the intake form

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object with exactly these fields:
{{
  "id": "Generate a unique identifier string",
  "prompt": "Write the actual question text here addressed to the parent about their child by name",
  "type": "Choose from MCQ, MSQ, SCALE, or VISUAL (prefer SCALE for most questions)",
  "options": ["Array of answer options - for MCQ/MSQ provide 4-5 options; for SCALE use '1', '2', '3', '4', '5'"],
  "optionLabels": ["For SCALE questions, provide labels: 'Never', 'Rarely', 'Sometimes', 'Often', 'Always'"],
  "difficulty": "Numeric difficulty from 1-5",
  "disorder": "The disorder being assessed",
  "skill": "The specific skill or symptom being measured"
}}

IMPORTANT: Return ONLY the JSON object, no additional text, explanations, or markdown formatting.
    `,
  inputVariables: [
    "formData",
    "disorder",
    "difficulty",
    "history",
    "previousResponses",
    "language",
  ],
});

/**
 * Response evaluation prompt template using Item Response Theory (IRT)
 * Extracted from graph.js lines 533-597
 */
const responseEvaluationPrompt = new PromptTemplate({
  template: `
You are an expert psychometrician implementing Item Response Theory (IRT) for a pediatric assessment.

ASSESSMENT HISTORY:
{history}

PREVIOUS RESPONSES:
\`\`\`json
{previousResponses}
\`\`\`

CURRENT QUESTION:
\`\`\`json
{question}
\`\`\`

CHILD'S RESPONSE:
{response}

TASK:
Evaluate this response using Item Response Theory (IRT) principles. Consider the child's pattern of responses and how this response fits with previous ones.

CRITICAL EVALUATION GUIDELINES:
- Focus on evaluating symptoms SPECIFIC to the disorder being assessed ({disorder})
- DO NOT switch to evaluating a different disorder - stay focused on {disorder}
- The assessed disorder for this entire assessment must remain {disorder}
- When recommending the next disorder to assess, you MUST return exactly the same disorder: {disorder}
- For ADHD assessments: Stay focused on attention problems, hyperactivity, impulsivity
- For Autism assessments: Stay focused on social difficulties, repetitive behaviors, sensory issues
- For Dyslexia assessments: Stay focused on reading, phonological, and language processing issues
- For General assessments: Focus on appropriate developmental milestones

IRT EVALUATION CRITERIA:
- Higher scores indicate more symptoms/difficulties
- Use response patterns to estimate ability level
- Adjust next difficulty based on current performance
- Maintain focus on the original assessment disorder

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object with exactly these fields:
{{
  "score": "Number between 0-1 representing symptom severity",
  "newAbilityEstimate": "Calculate updated ability estimate as a number between -3 and 3",
  "confidence": "Confidence level between 0-1",
  "nextDisorder": "Must be exactly '{disorder}' to maintain assessment focus",
  "nextDifficulty": "Suggest next difficulty level from 1-5",
  "reasoning": "Brief explanation of this evaluation in 1-2 sentences"
}}

IMPORTANT: Return ONLY the JSON object, no additional text, explanations, or markdown formatting.
    `,
  inputVariables: [
    "history",
    "previousResponses",
    "question",
    "response",
    "disorder",
  ],
});

module.exports = {
  fallbackQuestionPrompt,
  responseEvaluationPrompt
}; 