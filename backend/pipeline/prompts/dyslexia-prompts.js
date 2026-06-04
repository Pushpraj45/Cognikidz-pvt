/**
 * Dyslexia-Specific Prompt Templates
 * Extracted from prompts.js to separate dyslexia assessment concerns
 */

const { PromptTemplate } = require("@langchain/core/prompts");

/**
 * Dyslexia-specific prompt template for generating age-appropriate assessment questions
 * Based on established dyslexia screening methodologies and research from LaMPost study
 */
const dyslexiaQuestionPrompt = new PromptTemplate({
  inputVariables: ["formData", "screeningTool", "ageFocus", "availableDomains", "previousResponses", "childName", "childAge", "screeningToolName", "language"],
  template: `
You are an expert pediatric neuropsychologist and dyslexia specialist creating age-appropriate assessment questions based on established, validated dyslexia screening tools.

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
2. DO NOT ask about the same reading/language skills that have been covered
3. If previous questions focused on "letter recognition", move to different domains like "phonemic awareness" or "reading fluency"
4. Each question MUST cover a COMPLETELY DIFFERENT dyslexia-related skill
5. Use the available domains list to select a NEW domain that hasn't been covered
6. Focus on skills that are distinctly different from what has been previously assessed
7. Look at the specific wording of previous questions to ensure no overlap
8. NEVER generate two questions about the same type of reading skill
9. Cycle through different domains based on age: phonological_awareness → letter_knowledge → decoding_skills → reading_fluency → spelling_patterns

FORBIDDEN QUESTION PATTERNS (CHECK PREVIOUS QUESTIONS - DO NOT REPEAT):
- AVOID "letter recognition" questions if previously asked
- AVOID "rhyming" questions if previously asked  
- AVOID "sound-letter correspondence" questions if previously asked
- AVOID "reading speed" questions if previously asked
- AVOID "spelling" questions if previously asked
- AVOID "vocabulary" questions if previously asked
- If domain is reassigned, generate NEW content that matches the assigned domain

CRITICAL AGE-BASED DYSLEXIA SCREENING GUIDELINES:

**FOR 3-5 YEARS (PRESCHOOL) - Use Pre-literacy Assessment methodology:**
- Phonological awareness: "Does {childName} enjoy rhyming games and can identify words that rhyme?"
- Oral language: "How clearly does {childName} speak compared to other children of the same age?"
- Letter knowledge: "Can {childName} recognize and name most letters of the alphabet?"
- Rapid naming: "How quickly can {childName} name familiar objects or colors when shown pictures?"
- Vocabulary: "Does {childName} use a wide variety of words when speaking?"

**FOR 5-7 YEARS (EARLY ELEMENTARY) - Use CTOPP-2/PAT methodology:**
- Phonemic awareness: "Can {childName} identify the first sound in words like 'cat' or 'sun'?"
- Sound-letter correspondence: "Does {childName} know what sounds most letters make?"
- Decoding skills: "How well can {childName} sound out simple three-letter words?"
- Sight word recognition: "Can {childName} recognize common words like 'the', 'and', 'said' without sounding them out?"
- Spelling patterns: "When {childName} tries to spell words, do the letters make sense phonetically?"
- Reading fluency: "How smoothly does {childName} read simple sentences aloud?"

**FOR 8+ YEARS (LATE ELEMENTARY) - Use comprehensive academic assessment:**
- Reading fluency: "How quickly and accurately does {childName} read grade-level passages?"
- Reading comprehension: "Does {childName} understand and remember what they read?"
- Spelling complexity: "Can {childName} spell multi-syllabic words and use spelling rules correctly?"
- Written expression: "How well can {childName} express ideas in writing with proper grammar?"
- Academic performance: "Is there a noticeable gap between {childName}'s intelligence and reading performance?"
- Self advocacy: "Does {childName} ask for help when struggling with reading tasks?"

AGE-SPECIFIC QUESTION REQUIREMENTS:

**Child Age: {childAge} years old**
**Screening Tool: {screeningToolName}**
**Target Domain: Choose ONE UNUSED domain from [{availableDomains}]**

DOMAIN-SPECIFIC EXAMPLES TO ENSURE VARIETY:
- phonological_awareness: "Does {childName} enjoy playing word games that involve rhyming or identifying sounds?"
- sound_letter_correspondence: "Can {childName} tell you what sound each letter makes?"
- decoding_skills: "How well does {childName} sound out unfamiliar words when reading?"
- reading_fluency: "Does {childName} read smoothly without frequent pauses or corrections?"
- spelling_patterns: "When {childName} spells words, do they use logical letter combinations?"
- reading_comprehension: "Can {childName} answer questions about stories they have read?"

MANDATORY REQUIREMENTS:
1. Generate questions appropriate for a {childAge}-year-old child's developmental level
2. Follow the {screeningToolName} methodology exactly
3. Address the question to the PARENT about their child's reading/language skills
4. Use the child's actual name: {childName}
5. Focus on ONE specific domain from the available domains that HASN'T been used before
6. Use developmentally appropriate language and concepts
7. Ask about observable reading/language behaviors, not internal cognitive states
8. Frame questions as frequency/occurrence or ability levels for better reliability
9. ENSURE the question is completely different from any previous questions
10. SELECT a domain that creates maximum skill diversity from previous questions

DEVELOPMENTAL APPROPRIATENESS CHECK:
- For children 3-5: Focus on pre-literacy skills, speech development, letter recognition, rhyming
- For children 5-7: Include phonemic awareness, basic decoding, sight words, simple reading
- For children 8+: Include reading fluency, comprehension, complex spelling, academic impact

QUESTION FORMATTING:
- Start with "How often does {childName}..." or "Can {childName}..." or "Does {childName}..."
- Be specific and skill-based: "sound out three-letter words" not "read well"
- Include examples when helpful: "like reading 'cat', 'dog', 'sun'"
- Use simple, clear language that any parent can understand
- Focus on observable reading/language behaviors

RESPONSE FORMAT:
Return ONLY valid JSON with these exact fields:
{{
  "id": "dyslexia_question_[timestamp]",
  "prompt": "The complete question text addressed to the parent about {childName}",
  "type": "SCALE",
  "options": ["1", "2", "3", "4", "5"],
  "optionLabels": ["Never", "Rarely", "Sometimes", "Often", "Always"],
  "difficulty": "1-5 based on child age: 1-2 for preschool, 3-4 for early elementary, 4-5 for late elementary",
  "disorder": "Dyslexia",
  "skill": "Specific reading/language skill being measured from the domain",
  "domain": "The domain being assessed from available domains",
  "screeningTool": "The screening tool key being used",
  "ageAppropriate": true
}}

CRITICAL: The question MUST be appropriate for a {childAge}-year-old AND completely different from previous questions. Do not ask about advanced reading concepts for preschoolers or basic letter recognition for older children.
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
  dyslexiaQuestionPrompt
}; 