/**
 * Follow-up scheduling utilities
 * Generates follow-up schedules based on risk levels and assessment types
 */

/**
 * Generate follow-up schedule based on risk level
 * @param {number} riskScore - Risk score (1-10)
 * @param {string} assessmentType - Assessment type
 * @returns {Object} - Follow-up schedule
 */
function generateFollowUpSchedule(riskScore, assessmentType) {
  const currentDate = new Date();
  let followUpDate, focus, urgency, timeframe;

  if (riskScore >= 8) {
    // High risk - 1-2 months
    followUpDate = new Date(currentDate.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days (approx 1.5 months)
    focus = `Professional evaluation for ${assessmentType} recommended due to elevated risk indicators`;
    urgency = "high";
    timeframe = "1-2 months";
  } else if (riskScore >= 4) {
    // Moderate risk - 2-4 months
    followUpDate = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days (3 months)
    focus = `Professional consultation for ${assessmentType} monitoring and support`;
    urgency = "moderate";
    timeframe = "2-4 months";
  } else {
    // Low risk - 6 months screening
    followUpDate = new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days (6 months)
    focus = "Routine developmental screening and monitoring";
    urgency = "low";
    timeframe = "6 months";
  }

  return {
    recommendedDate: followUpDate.toISOString().split("T")[0],
    focus,
    urgency,
    timeframe,
    riskLevel:
      riskScore <= 3
        ? "Low Risk"
        : riskScore <= 7
          ? "Moderate Risk"
          : "High Risk",
  };
}

module.exports = {
  generateFollowUpSchedule,
}; 