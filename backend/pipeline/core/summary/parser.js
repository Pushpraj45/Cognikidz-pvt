/**
 * AI summary text parsing utilities
 * Handles parsing and structuring of AI-generated markdown summaries
 */

/**
 * Parse AI-generated summary text and extract structured data
 * @param {string} rawSummaryText - Raw AI-generated summary text
 * @param {string} childName - Child's name
 * @returns {Object} - Parsed summary data
 */
function parseAISummaryText(rawSummaryText, childName) {
  try {
    console.log("Processing markdown summary format");
    console.log("Summary text preview:", rawSummaryText.substring(0, 200) + "...");

    // Extract risk score from markdown if present (ensure it's within valid range)
    let finalRiskScore = 5; // Default fallback

    // Try multiple patterns to extract the risk score
    const scorePatterns = [
      /(?:risk score|score)[:\s]*\*?\*?(\d+)(?:\s*\/10|out of 10)/i,
      /(?:risk score|score)[:\s]*of[:\s]*(\d+)(?:\s*\/10|out of 10)/i,
      /(?:risk score|score)[:\s]*(\d+)(?:\s*\/10|out of 10)/i,
      /(?:a|the)\s+risk\s+score\s+of\s+(\d+)/i,
      /risk\s+score.*?(?:is\s+assessed\s+at|assessed\s+at|is)\s+(\d+)(?:\s*out\s+of\s+10)?/i,
      /(?:assessed\s+at|assessed\s+to\s+be|evaluated\s+at)\s+(\d+)\s*(?:out\s+of\s+10|\/10)/i,
      /(?:overall|total).*?(?:risk|score).*?(\d+)\s*(?:out\s+of\s+10|\/10)/i,
      /risk\s+score[:\s]*(\d+)/i,
    ];

    let extractedScore = null;
    for (const pattern of scorePatterns) {
      const match = rawSummaryText.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        if (!isNaN(score) && score >= 1 && score <= 10) {
          extractedScore = score;
          console.log(`Extracted risk score using pattern: ${pattern.source} -> ${score}`);
          break;
        }
      }
    }

    if (extractedScore) {
      finalRiskScore = extractedScore;
      console.log(`Using LLM-generated risk score: ${finalRiskScore}`);
    } else {
      // As a stronger fallback, use calculated overall risk from responses if available via hint
      const hintedScore = typeof global.__PIPELINE_OVERALL_RISK_SCORE__ === 'number' ? global.__PIPELINE_OVERALL_RISK_SCORE__ : null;
      if (hintedScore && hintedScore >= 1 && hintedScore <= 10) {
        finalRiskScore = hintedScore;
        console.log(`No valid LLM score found, using computed overall risk score: ${finalRiskScore}`);
      } else {
        console.log(`No valid LLM score found, using fallback score: ${finalRiskScore}`);
      }
    }

    // Ensure consistency by cleaning the summary text to match the final score
    let cleanedSummaryText = rawSummaryText;

    // Replace any inconsistent score references with the final determined score
    const scoreReplacementPatterns = [
      /(?:risk score|score)[:\s]*\*?\*?(\d+)(?:\s*\/10|out of 10)/gi,
      /(?:risk score|score)[:\s]*of[:\s]*(\d+)(?:\s*\/10|out of 10)/gi,
      /(?:a|the)\s+risk\s+score\s+of\s+(\d+)/gi,
      /risk\s+score.*?(?:is\s+assessed\s+at|assessed\s+at|is)\s+(\d+)(?:\s*out\s+of\s+10)?/gi,
      /(?:assessed\s+at|assessed\s+to\s+be|evaluated\s+at)\s+(\d+)\s*(?:out\s+of\s+10|\/10)/gi,
      /(?:overall|total).*?(?:risk|score).*?(\d+)\s*(?:out\s+of\s+10|\/10)/gi,
      /risk\s+score[:\s]*(\d+)/gi,
    ];

    for (const pattern of scoreReplacementPatterns) {
      cleanedSummaryText = cleanedSummaryText.replace(
        pattern,
        `risk score of ${finalRiskScore}/10`
      );
    }

    // Extract structured data from markdown sections
    const strengths = extractMarkdownSection(cleanedSummaryText, [
      "Strengths",
      "Positive Indicators",
      "Positive",
    ]);
    
    const challenges = extractMarkdownSection(cleanedSummaryText, [
      "Challenges",
      "Areas Requiring Attention",
      "Concerns",
    ]);
    
    const recommendations = extractMarkdownSection(cleanedSummaryText, [
      "Recommendations",
      "Next Steps",
      "Specific Recommendations",
    ]);

    console.log(`Successfully processed markdown summary with final risk score: ${finalRiskScore}`);
    console.log(`Extracted: ${strengths.length} strengths, ${challenges.length} challenges, ${recommendations.length} recommendations`);

    return {
      cleanedSummaryText,
      finalRiskScore,
      strengths,
      challenges,
      recommendations,
    };

  } catch (parseError) {
    console.error("Error processing markdown summary:", parseError);

    // Create minimal fallback summary
    return {
      cleanedSummaryText: rawSummaryText,
      finalRiskScore: 5,
      strengths: ['Assessment completed successfully'],
      challenges: ['Areas for continued monitoring'],
      recommendations: ['Consider professional consultation for detailed evaluation'],
    };
  }
}

/**
 * Extract sections from markdown text
 * @param {string} text - Markdown text
 * @param {Array} sectionKeywords - Keywords to match section headers
 * @returns {Array} - Extracted section content
 */
function extractMarkdownSection(text, sectionKeywords) {
  const sections = [];
  const lines = text.split("\n");
  let currentSection = null;

  for (const line of lines) {
    // Check if this line is a header that matches our keywords
    if (
      line.startsWith("##") &&
      sectionKeywords.some((keyword) =>
        line.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      currentSection = [];
    } else if (currentSection !== null) {
      // If we're in a section and hit another header, stop collecting
      if (line.startsWith("##")) {
        break;
      }
      // Collect bullet points and regular content
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        sections.push(line.trim().substring(1).trim());
      } else if (line.trim() && !line.startsWith("#")) {
        sections.push(line.trim());
      }
    }
  }

  return sections;
}

module.exports = {
  parseAISummaryText,
  extractMarkdownSection,
}; 