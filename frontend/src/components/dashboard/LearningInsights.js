import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LearningInsights = ({
  currentScores = {},
  previousScores = {},
  timelines = [],
  domains = [],
}) => {
  const [expandedInsight, setExpandedInsight] = useState(null);

  const insights = useMemo(() => {
    const insightsList = [];

    // Analyze trends for each domain
    Object.keys(currentScores).forEach(domain => {
      const currentScore = currentScores[domain];
      const previousScore = previousScores[domain];

      if (previousScore !== undefined) {
        const change = currentScore - previousScore;

        if (change > 10) {
          insightsList.push({
            type: 'improvement',
            domain,
            message: `Excellent progress in ${domain}! You've improved by ${change.toFixed(1)}% since the last assessment.`,
            detailedMessage: `Your ${domain} skills have shown remarkable improvement. This suggests that your learning strategies and practice methods are working effectively. Consider sharing these techniques with others or applying similar approaches to other areas.`,
            icon: '🚀',
            color: 'green',
            priority: 'high',
            change: change,
            currentScore,
            previousScore,
          });
        } else if (change < -5) {
          insightsList.push({
            type: 'decline',
            domain,
            message: `${domain} scores have decreased by ${Math.abs(change).toFixed(1)}%. Consider reviewing recent activities in this area.`,
            detailedMessage: `A decline in ${domain} performance might indicate a need for additional practice or a different learning approach. Consider revisiting fundamental concepts or seeking additional support in this area.`,
            icon: '⚠️',
            color: 'red',
            priority: 'high',
            change: change,
            currentScore,
            previousScore,
          });
        }
      }
    });

    // Find top performing domain
    const topDomain = Object.entries(currentScores).reduce((a, b) =>
      currentScores[a[0]] > currentScores[b[0]] ? a : b
    );

    if (topDomain) {
      insightsList.push({
        type: 'strength',
        domain: topDomain[0],
        message: `${topDomain[0]} is your strongest area with ${topDomain[1]}% score. Great work!`,
        detailedMessage: `Your exceptional performance in ${topDomain[0]} demonstrates strong foundational skills. This strength can be leveraged to support learning in other areas. Consider how you can apply similar strategies to domains that need improvement.`,
        icon: '⭐',
        color: 'blue',
        priority: 'medium',
        currentScore: topDomain[1],
      });
    }

    // Find areas needing improvement (only if score > 0)
    const lowScoreDomains = Object.entries(currentScores)
      .filter(([domain, score]) => score > 0 && score < 70)
      .sort((a, b) => a[1] - b[1]);

    lowScoreDomains.forEach(([domain, score]) => {
      insightsList.push({
        type: 'improvement_needed',
        domain,
        message: `${domain} could use more attention. Current score: ${score}%. Consider focusing on this area.`,
        detailedMessage: `While ${domain} shows room for improvement, this is a normal part of the learning journey. Focus on building foundational skills and practice regularly. Remember, every expert was once a beginner.`,
        icon: '📚',
        color: 'yellow',
        priority: 'medium',
        currentScore: score,
      });
    });

    // Add insight for domains with 0% scores
    const zeroScoreDomains = Object.entries(currentScores)
      .filter(([domain, score]) => score === 0)
      .slice(0, 2); // Limit to 2 to avoid overwhelming

    zeroScoreDomains.forEach(([domain, score]) => {
      insightsList.push({
        type: 'no_data',
        domain,
        message: `${domain} has no assessment data yet. Complete an assessment to see your progress.`,
        detailedMessage: `You haven't completed any assessments for ${domain} yet. Start with a basic assessment to establish your baseline and track your progress over time.`,
        icon: '🆕',
        color: 'gray',
        priority: 'low',
        currentScore: score,
      });
    });

    // Analyze consistency
    if (timelines.length > 2) {
      const recentScores = timelines
        .slice(-3)
        .map(
          t =>
            Object.values(t.scores || {}).reduce((sum, score) => sum + score, 0) /
            Object.keys(t.scores || {}).length
        );

      const variance =
        recentScores.reduce((sum, score, i) => {
          if (i === 0) return 0;
          return sum + Math.abs(score - recentScores[i - 1]);
        }, 0) /
        (recentScores.length - 1);

      if (variance < 5) {
        insightsList.push({
          type: 'consistency',
          domain: 'Overall',
          message:
            'Your performance has been very consistent across recent assessments. Great job maintaining steady progress!',
          detailedMessage: `Consistent performance indicates strong study habits and effective learning strategies. This stability provides a solid foundation for continued growth. Consider gradually increasing challenge levels to maintain engagement.`,
          icon: '📈',
          color: 'green',
          priority: 'medium',
          variance: variance,
        });
      } else if (variance > 15) {
        insightsList.push({
          type: 'volatility',
          domain: 'Overall',
          message:
            'Your scores have been quite variable recently. Consider establishing a more consistent study routine.',
          detailedMessage: `Variable performance can be normal during learning, but establishing consistent study habits can help stabilize progress. Consider creating a regular schedule and tracking daily progress to identify patterns.`,
          icon: '📊',
          color: 'orange',
          priority: 'medium',
          variance: variance,
        });
      }
    }

    // Check for rapid improvement
    if (timelines.length >= 3) {
      const recentImprovement = timelines
        .slice(-3)
        .map(
          t =>
            Object.values(t.scores || {}).reduce((sum, score) => sum + score, 0) /
            Object.keys(t.scores || {}).length
        );

      const improvement = recentImprovement[recentImprovement.length - 1] - recentImprovement[0];

      if (improvement > 15) {
        insightsList.push({
          type: 'rapid_improvement',
          domain: 'Overall',
          message: `Amazing progress! You've improved by ${improvement.toFixed(1)}% across all domains in recent assessments.`,
          detailedMessage: `This rapid improvement suggests excellent learning strategies and strong motivation. Your ability to apply knowledge across different domains shows advanced learning skills. Keep up this momentum!`,
          icon: '🎯',
          color: 'purple',
          priority: 'high',
          improvement: improvement,
        });
      }
    }

    // Analyze learning patterns
    if (timelines.length >= 4) {
      const assessmentTypes = timelines
        .map(t => t.assessmentType || t.assessmentCategory)
        .filter(Boolean);
      const typeCounts = assessmentTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const mostFrequentType = Object.entries(typeCounts).reduce((a, b) => (a[1] > b[1] ? a : b));

      if (mostFrequentType[1] >= timelines.length * 0.6) {
        insightsList.push({
          type: 'learning_preference',
          domain: 'Learning Style',
          message: `You seem to prefer ${mostFrequentType[0]} assessments. This shows a clear learning preference.`,
          detailedMessage: `Your preference for ${mostFrequentType[0]} assessments indicates a strong learning style. While this is great, consider occasionally trying different assessment types to develop well-rounded skills.`,
          icon: '🎨',
          color: 'indigo',
          priority: 'medium',
          preferredType: mostFrequentType[0],
          frequency: mostFrequentType[1],
        });
      }
    }

    return insightsList.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [currentScores, previousScores, timelines]);

  const getColorClasses = color => {
    const colorMap = {
      green:
        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
      yellow:
        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
      orange:
        'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-200',
      purple:
        'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200',
      indigo:
        'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200',
    };
    return colorMap[color] || colorMap.blue;
  };

  const getActionableAdvice = insight => {
    const adviceMap = {
      improvement: [
        'Continue with the current learning approach',
        'Try more challenging activities in this domain',
        'Share your success with teachers and parents',
        'Document your learning strategies for future reference',
      ],
      decline: [
        'Review recent learning materials',
        'Practice with easier exercises first',
        'Ask for help from teachers or parents',
        'Break down complex concepts into smaller parts',
      ],
      strength: [
        'Use this strength to help with other areas',
        'Take on leadership roles in group activities',
        'Mentor peers who struggle with this domain',
        'Apply similar strategies to challenging domains',
      ],
      improvement_needed: [
        'Focus on this area in daily practice',
        'Try different learning approaches',
        'Break down complex tasks into smaller steps',
        'Set specific, achievable goals for this domain',
      ],
      consistency: [
        'Maintain your current study routine',
        'Gradually increase difficulty levels',
        'Set new goals to continue growing',
        'Explore advanced topics in your strong areas',
      ],
      volatility: [
        'Establish a regular study schedule',
        'Review previous successful strategies',
        'Track daily progress to identify patterns',
        'Create a consistent learning environment',
      ],
      rapid_improvement: [
        'Keep up the excellent work!',
        'Set new challenging goals',
        'Share your learning strategies with others',
        'Consider mentoring other learners',
      ],
      learning_preference: [
        'Embrace your preferred learning style',
        'Occasionally try different assessment types',
        'Use your strength to build confidence',
        'Balance comfort with growth opportunities',
      ],
      no_data: [
        'Complete your first assessment for this domain',
        'Start with basic exercises to establish baseline',
        'Set realistic goals for initial progress',
        'Track your improvement over time',
      ],
    };
    return adviceMap[insight.type] || ['Continue your current approach'];
  };

  const getProgressChart = insight => {
    if (insight.change !== undefined) {
      const percentage = Math.abs(insight.change);
      const isPositive = insight.change > 0;

      return (
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>
              Change: {insight.change > 0 ? '+' : ''}
              {insight.change.toFixed(1)}%
            </span>
            <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? 'Improvement' : 'Decline'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isPositive ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  if (insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Learning Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personalized feedback based on your progress
            </p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          Complete more assessments to receive personalized insights and recommendations.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Learning Insights</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered analysis of your learning patterns
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.slice(0, 6).map((insight, index) => (
          <motion.div
            key={`${insight.type}-${insight.domain}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${getColorClasses(insight.color)}`}
            onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl">{insight.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{insight.domain}</h4>
                    {insight.priority === 'high' && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full">
                        Important
                      </span>
                    )}
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedInsight === index ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm mb-3 leading-relaxed">{insight.message}</p>

                {getProgressChart(insight)}

                <AnimatePresence>
                  {expandedInsight === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                        <div>
                          <h5 className="font-semibold text-sm mb-2">Detailed Analysis</h5>
                          <p className="text-sm leading-relaxed opacity-90">
                            {insight.detailedMessage}
                          </p>
                        </div>

                        <div>
                          <h5 className="font-semibold text-sm mb-2">Suggested Actions</h5>
                          <ul className="space-y-2">
                            {getActionableAdvice(insight).map((advice, adviceIndex) => (
                              <li key={adviceIndex} className="text-sm flex items-start gap-2">
                                <span className="text-xs mt-1.5">•</span>
                                <span>{advice}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {insight.currentScore !== undefined && (
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-center">
                              <div className="text-lg font-bold">{insight.currentScore}%</div>
                              <div className="text-xs opacity-75">Current Score</div>
                            </div>
                            {insight.previousScore !== undefined && (
                              <div className="text-center">
                                <div className="text-lg font-bold">{insight.previousScore}%</div>
                                <div className="text-xs opacity-75">Previous Score</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {insights.length > 6 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing top 6 insights. Complete more assessments to see additional personalized
            recommendations.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LearningInsights;
