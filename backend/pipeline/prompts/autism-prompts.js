/**
 * Autism-Specific Prompt Templates
 * Extracted from prompts.js to separate autism assessment concerns
 */

const { PromptTemplate } = require("@langchain/core/prompts");

/**
 * Enhanced autism-specific prompt template for generating age-appropriate assessment questions
 * Based on established screening tools and methodologies from autism-screening-tools.js
 */
const autismQuestionPrompt = new PromptTemplate({
  inputVariables: ["formData", "screeningTool", "ageFocus", "availableDomains", "previousResponses", "childName", "childAge", "screeningToolName", "language"],
  template: `
You are an expert pediatric neuropsychologist creating autism assessment questions based on established, validated screening tools.

IMPORTANT: Generate ALL questions in {language} language. If {language} is not English, ensure the questions are culturally appropriate and use proper grammar and vocabulary for that language.

CHILD INFORMATION:
\`\`\`json
{formData}
\`\`\`

SCREENING TOOL FOR THIS CHILD'S AGE:
\`\`\`json
{screeningTool}
\`\`\`

AGE-SPECIFIC DEVELOPMENTAL FOCUS:
\`\`\`json
{ageFocus}
\`\`\`

AVAILABLE ASSESSMENT DOMAINS (to avoid repetition):
{availableDomains}

PREVIOUS QUESTIONS & RESPONSES:
\`\`\`json
{previousResponses}
\`\`\`

CRITICAL INSTRUCTIONS FOR AVOIDING REPETITION:
1. CAREFULLY REVIEW the previous questions to understand what has already been asked
2. DO NOT ask about the same behaviors or skills that have been covered
3. If previous questions focused on "pointing" or "joint attention", move to different domains like "pretend play" or "social interest"
4. If previous questions were about "pretend play", move to domains like "social_communication" or "early_gestures"
5. Each question MUST cover a COMPLETELY DIFFERENT autism-related behavior
6. Use the available domains list to select a NEW domain that hasn't been covered
7. Focus on behaviors that are distinctly different from what has been previously assessed
8. NEVER generate two questions about the same type of behavior (e.g., two questions about pretend play)
9. Cycle through different domains: social_communication → symbolic_abilities → early_gestures → joint_attention → behavioral_regulation

FORBIDDEN QUESTION PATTERNS (CHECK PREVIOUS QUESTIONS - DO NOT REPEAT):
- AVOID "pointing to show" questions if previously asked
- AVOID "bringing objects to you" questions if previously asked  
- AVOID "getting your attention by looking" questions if previously asked
- AVOID "try to get attention" questions if previously asked
- AVOID "showing you objects" questions if previously asked
- AVOID "looking and vocalizing" questions if previously asked
- AVOID "pretend with objects" questions if previously asked
- If domain is reassigned, generate NEW content that matches the assigned domain

CRITICAL AGE-BASED SCREENING GUIDELINES:

**FOR 6-24 MONTHS - Use CSBS-DP methodology:**
- Focus on early social communication: "Does {childName} look at you when you call his/her name?"
- Symbolic abilities: "Does {childName} point to show you things he/she finds interesting?"
- Early gestures: "Does {childName} wave bye-bye or clap hands when you do?"
- Joint attention: "When you point at something, does {childName} look where you're pointing?"

**FOR 16-30 MONTHS - Use M-CHAT methodology (MOST IMPORTANT for toddlers):**
- Joint attention: "Does {childName} point with one finger to show you something interesting?"
- Pretend play: "Does {childName} pretend to drink from an empty cup or feed a doll?"
- Social interest: "Is {childName} interested in other children? Does he/she watch them or try to go to them?"
- Response to name: "Does {childName} respond when you call his/her name?"
- Eye contact: "Does {childName} look you in the eye when you are talking, playing, or dressing him/her?"
- Imitation: "Does {childName} try to copy what you do, like wave bye-bye or clap?"
- Social sharing: "Does {childName} show you things by bringing them to you or holding them up?"

**FOR 2-6 YEARS - Use TABC methodology:**
- Social interaction: "How often does {childName} make eye contact during conversations with family members?"
- Communication: "How often does {childName} use gestures like pointing or waving along with words?"
- Stereotyped behaviors: "How often does {childName} repeat the same movements or actions over and over?"
- Sensory responses: "How often does {childName} seem bothered by everyday sounds like vacuum cleaners or hand dryers?"

**FOR 4+ YEARS - Use SCQ methodology:**
- Reciprocal social interaction: "How often does {childName} have difficulty making friends with children of similar age?"
- Communication patterns: "How often does {childName} repeat words or phrases over and over in the same way?"
- Restricted interests: "How often does {childName} become very upset when his/her routine is changed?"

AGE-SPECIFIC QUESTION REQUIREMENTS:

**Child Age: {childAge} years old**
**Screening Tool: {screeningToolName}**
**Target Domain: Choose ONE UNUSED domain from [{availableDomains}]**

DOMAIN-SPECIFIC EXAMPLES TO ENSURE VARIETY:
- social_communication: "Does {childName} try to get your attention by looking at you and vocalizing?"
- symbolic_abilities: "Does {childName} pretend with objects, like using a banana as a phone?"
- early_gestures: "Does {childName} wave bye-bye when you wave first?"
- joint_attention: "When you look at something across the room, does {childName} follow your gaze?"
- behavioral_regulation: "Does {childName} show you objects by bringing them to you?"

MANDATORY REQUIREMENTS:
1. Generate questions appropriate for a {childAge}-year-old child's developmental level
2. Follow the {screeningToolName} methodology exactly
3. Address the question to the PARENT about their child
4. Use the child's actual name: {childName}
5. Focus on ONE specific domain from the available domains that HASN'T been used before
6. Use developmentally appropriate language and concepts
7. Ask about observable behaviors, not internal states the parent cannot see
8. Frame questions as frequency/occurrence for better reliability
9. ENSURE the question is completely different from any previous questions
10. SELECT a domain that creates maximum behavioral diversity from previous questions

DEVELOPMENTAL APPROPRIATENESS CHECK:
- For children under 2: Focus on basic social responses, eye contact, pointing, simple imitation
- For children 2-3: Include pretend play, social interest in other children, basic communication
- For children 3-5: Include more complex social interactions, conversation skills, behavioral patterns
- For children 5+: Include peer relationships, school behaviors, more nuanced social understanding

QUESTION FORMATTING:
- Start with "How often does {childName}..." or "Does {childName}..." 
- Be specific and behavioral: "point to show you something interesting" not "communicate well"
- Include examples when helpful: "like pointing to an airplane in the sky"
- Use simple, clear language that any parent can understand

RESPONSE FORMAT:
Return ONLY valid JSON with these exact fields:
{{
  "id": "autism_question_[timestamp]",
  "prompt": "The complete question text addressed to the parent about {childName}",
  "type": "SCALE",
  "options": ["1", "2", "3", "4", "5"],
  "optionLabels": ["Never", "Rarely", "Sometimes", "Often", "Always"],
  "difficulty": "1-5 based on child age: 1-2 for toddlers, 3-4 for preschool, 4-5 for school age",
  "disorder": "Autism",
  "skill": "Specific autism behavior being measured from the domain",
  "domain": "The domain being assessed from available domains",
  "screeningTool": "The screening tool key being used",
  "ageAppropriate": true
}}

CRITICAL: The question MUST be appropriate for a {childAge}-year-old AND completely different from previous questions. Do not ask about complex social concepts for toddlers or basic motor skills for older children.
`,
  inputVariables: [
    "formData",
    "screeningTool",
    "ageFocus",
    "availableDomains",
    "previousResponses",
    "childAge",
    "screeningToolName",
    "childName",
    "timestamp",
    "language",
  ],
});

module.exports = {
  autismQuestionPrompt
}; 