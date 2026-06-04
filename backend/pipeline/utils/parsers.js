/**
 * Parsing Utilities
 * Functions for parsing JSON, markdown, and extracting data from text
 */

/**
 * Extract JSON from markdown-formatted text
 * @param {string} text - The text containing JSON (possibly in markdown format)
 * @returns {Object} - Parsed JSON object
 * @throws {Error} - If parsing fails
 */
function extractJsonFromMarkdown(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: text must be a non-empty string");
  }

  console.log(
    "Attempting to extract JSON from:",
    text.substring(0, 200) + "..."
  );

  let jsonText = text.trim();

  // Check if the content is pure Markdown (starts with # and doesn't contain JSON)
  if (
    jsonText.startsWith("#") &&
    !jsonText.includes("{") &&
    !jsonText.includes('"id"')
  ) {
    console.log("Content appears to be pure Markdown, not JSON");
    throw new Error(
      "Content is pure Markdown format, not JSON. Use markdown parsing instead."
    );
  }

  // Remove markdown code block formatting if present
  if (jsonText.includes("```json")) {
    const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonText = match[1].trim();
    }
  } else if (jsonText.includes("```")) {
    const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonText = match[1].trim();
    }
  }

  // Try to find JSON object within the text
  const jsonStartIndex = jsonText.indexOf("{");
  const jsonEndIndex = jsonText.lastIndexOf("}");

  if (
    jsonStartIndex !== -1 &&
    jsonEndIndex !== -1 &&
    jsonEndIndex > jsonStartIndex
  ) {
    jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex + 1);
  } else {
    // If no JSON brackets found, check if this might be pure Markdown
    if (jsonText.includes("#") && !jsonText.includes("{")) {
      console.log("No JSON structure found in content, appears to be Markdown");
      throw new Error(
        "No JSON structure found. Content appears to be Markdown format."
      );
    }
  }

  // Clean up common LLM response issues
  jsonText = jsonText
    .replace(/^\s*["']|["']\s*$/g, "") // Remove surrounding quotes
    .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
    .replace(/,\s*]/g, "]") // Remove trailing commas before closing brackets
    .trim();

  try {
    const parsed = JSON.parse(jsonText);
    console.log("Successfully parsed JSON:", Object.keys(parsed));
    return parsed;
  } catch (parseError) {
    console.error("JSON parse error:", parseError.message);
    console.error("Failed to parse text:", jsonText);

    // Try to extract key-value pairs manually as a last resort
    try {
      const fallbackParsing = extractKeyValuePairs(jsonText);
      if (fallbackParsing && Object.keys(fallbackParsing).length > 0) {
        console.log(
          "Fallback parsing successful:",
          Object.keys(fallbackParsing)
        );
        return fallbackParsing;
      }
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError.message);
    }

    throw new Error(
      `Failed to parse JSON: ${parseError.message}. Original text: ${text.substring(0, 500)}`
    );
  }
}

/**
 * Fallback function to extract key-value pairs from malformed JSON
 * @param {string} text - The malformed JSON text
 * @returns {Object} - Extracted key-value pairs
 */
function extractKeyValuePairs(text) {
  const result = {};

  // Common patterns to extract
  const patterns = [
    /"id":\s*"([^"]+)"/,
    /"prompt":\s*"([^"]+)"/,
    /"type":\s*"([^"]+)"/,
    /"difficulty":\s*(\d+)/,
    /"disorder":\s*"([^"]+)"/,
    /"skill":\s*"([^"]+)"/,
    /"score":\s*([\d.]+)/,
    /"newAbilityEstimate":\s*([-\d.]+)/,
    /"confidence":\s*([\d.]+)/,
    /"nextDisorder":\s*"([^"]+)"/,
    /"nextDifficulty":\s*(\d+)/,
    /"reasoning":\s*"([^"]+)"/,
  ];

  patterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (match) {
      const key = pattern.source.match(/"(\w+)":/)[1];
      result[key] = isNaN(match[1]) ? match[1] : Number(match[1]);
    }
  });

  // Extract options array if present
  const optionsMatch = text.match(/"options":\s*\[(.*?)\]/s);
  if (optionsMatch) {
    try {
      const optionsText = optionsMatch[1];
      const options = optionsText
        .split(",")
        .map((opt) => opt.trim().replace(/^["']|["']$/g, ""))
        .filter((opt) => opt.length > 0);
      result.options = options;
    } catch (e) {
      console.warn("Failed to parse options array:", e.message);
    }
  }

  return result;
}

/**
 * Extract sections from markdown text based on keywords
 * @param {string} text - The markdown text
 * @param {Array<string>} sectionKeywords - Keywords to match section headers
 * @returns {Array<string>} - Extracted section content
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
  extractJsonFromMarkdown,
  extractKeyValuePairs,
  extractMarkdownSection
}; 