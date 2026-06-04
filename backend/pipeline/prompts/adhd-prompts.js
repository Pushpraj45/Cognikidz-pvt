/**
 * ADHD-Specific Prompt Templates
 * Extracted from prompts.js to separate ADHD assessment concerns
 */

const { PromptTemplate } = require("@langchain/core/prompts");

/**
 * ADHD-specific prompt template for generating age-appropriate assessment questions
 * Based on established ADHD screening methodologies and research from Vanderbilt, Conners, ADHD-RS-IV, and CBCL
 */
const adhdQuestionPrompt = new PromptTemplate({
  inputVariables: ["formData", "screeningTool", "ageFocus", "availableDomains", "previousResponses", "childName", "childAge", "screeningToolName", "language"],
  template: `
You are an expert pediatric neuropsychologist and ADHD specialist creating age-appropriate assessment questions based on established, validated ADHD screening tools.

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
2. DO NOT ask about the same ADHD behaviors or symptoms that have been covered
3. If previous questions focused on "attention problems" or "hyperactivity", move to different domains like "impulsivity" or "emotional regulation"
4. If previous questions were about "organization", move to domains like "peer_relationships" or "academic_performance"
5. Each question MUST cover a COMPLETELY DIFFERENT ADHD-related behavior
6. Use the available domains list to select a NEW domain that hasn't been covered
7. Focus on behaviors that are distinctly different from what has been previously assessed
8. NEVER generate two questions about the same type of ADHD symptom
9. Cycle through different domains: inattention → hyperactivity → impulsivity → executive functioning → emotional regulation

FORBIDDEN QUESTION PATTERNS (CHECK PREVIOUS QUESTIONS - DO NOT REPEAT):
- AVOID "attention to details" questions if previously asked
- AVOID "fidgeting or restlessness" questions if previously asked  
- AVOID "interrupting others" questions if previously asked
- AVOID "organization problems" questions if previously asked
- AVOID "following instructions" questions if previously asked
- If domain is reassigned, generate NEW content that matches the assigned domain

CRITICAL AGE-BASED ADHD SCREENING GUIDELINES:

**FOR 3-5 YEARS (PRESCHOOL) - Use careful developmental consideration:**
- Attention span: "How long can {childName} focus on preferred activities compared to other children their age?"
- Activity level: "Does {childName} have difficulty sitting still during story time or meals?"
- Inhibitory control: "How often does {childName} act without thinking in potentially dangerous situations?"
- Emotional regulation: "How often does {childName} have intense emotional outbursts that seem excessive?"

**FOR 6-11 YEARS (ELEMENTARY) - Use Vanderbilt/Conners methodology:**
- Inattention: "How often does {childName} fail to give close attention to details in schoolwork?"
- Hyperactivity: "How often does {childName} fidget with hands or feet or squirm in their seat?"
- Impulsivity: "How often does {childName} blurt out answers before questions are completed?"
- Academic performance: "How often do {childName}'s attention problems interfere with schoolwork?"
- Peer relationships: "How often does {childName} have difficulty playing with other children?"

**FOR 12-18 YEARS (ADOLESCENT) - Use ADHD-RS-IV methodology:**
- Internalized hyperactivity: "How often does {childName} feel restless or 'on edge' even when sitting still?"
- Academic organization: "How often does {childName} struggle with time management and meeting deadlines?"
- Impulsivity consequences: "How often does {childName} make impulsive decisions they later regret?"
- Emotional dysregulation: "How often does {childName} have intense mood swings or irritability?"

**FOR 18+ YEARS (ADULT) - Use adult-specific assessment:**
- Workplace attention: "How often do you have difficulty concentrating during work tasks?"
- Adult restlessness: "How often do you feel restless or need to keep busy with multiple activities?"
- Adult impulsivity: "How often do you make impulsive financial or relationship decisions?"

AGE-SPECIFIC QUESTION REQUIREMENTS:

**Child Age: {childAge} years old**
**Screening Tool: {screeningToolName}**
**Target Domain: Choose ONE UNUSED domain from [{availableDomains}]**

DOMAIN-SPECIFIC EXAMPLES TO ENSURE VARIETY:
- inattention_symptoms: "How often does {childName} have trouble keeping attention on tasks or activities?"
- hyperactivity_symptoms: "How often does {childName} leave their seat when remaining seated is expected?"
- impulsivity_symptoms: "How often does {childName} have trouble waiting their turn?"
- executive_functioning: "How often does {childName} lose things necessary for tasks and activities?"
- emotional_regulation: "How often does {childName} have difficulty managing frustration?"
- academic_performance: "How often do {childName}'s ADHD symptoms interfere with school performance?"

MANDATORY REQUIREMENTS:
1. Generate questions appropriate for a {childAge}-year-old child's developmental level
2. Follow the {screeningToolName} methodology exactly
3. Address the question to the PARENT about their child
4. Use the child's actual name: {childName}
5. Focus on ONE specific domain from the available domains that HASN'T been used before
6. Use developmentally appropriate language and concepts
7. Ask about observable ADHD behaviors, not internal states the parent cannot see
8. Frame questions as frequency/occurrence for better reliability (Vanderbilt/Conners style)
9. ENSURE the question is completely different from any previous questions
10. SELECT a domain that creates maximum behavioral diversity from previous questions

DEVELOPMENTAL APPROPRIATENESS CHECK:
- For children 3-5: Focus on extreme behaviors compared to peers, safety concerns, basic attention
- For children 6-11: Include academic impacts, classroom behaviors, peer interactions
- For children 12-18: Include organizational challenges, internalized symptoms, academic demands
- For children 18+: Include workplace functioning, adult relationships, life management

QUESTION FORMATTING:
- Start with "How often does {childName}..." following Vanderbilt/Conners format
- Be specific and behavioral: "fail to finish schoolwork" not "have attention problems"
- Include examples when helpful: "like homework assignments or chores"
- Use simple, clear language that any parent can understand
- Focus on frequency-based responses for standardized assessment

RESPONSE FORMAT:
Return ONLY valid JSON with these exact fields:
{{
  "id": "adhd_question_[timestamp]",
  "prompt": "The complete question text addressed to the parent about {childName}",
  "type": "SCALE",
  "options": ["1", "2", "3", "4", "5"],
  "optionLabels": ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
  "difficulty": "1-5 based on child age: 1-2 for preschool, 3-4 for elementary, 4-5 for adolescent/adult",
  "disorder": "ADHD",
  "skill": "Specific ADHD symptom being measured from the domain",
  "domain": "The domain being assessed from available domains",
  "screeningTool": "The screening tool key being used",
  "ageAppropriate": true
}}

CRITICAL: The question MUST be appropriate for a {childAge}-year-old AND completely different from previous questions. Do not ask about complex organizational skills for preschoolers or basic attention spans for adolescents.
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
  adhdQuestionPrompt
}; 