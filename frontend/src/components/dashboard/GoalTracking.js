import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const GoalTracking = ({ currentScores = {}, goals = {}, timelines = [] }) => {
  // Calculate dynamic goals based on current performance and historical data
  const calculatedGoals = useMemo(() => {
    const dynamicGoals = {};

    Object.keys(currentScores).forEach(domain => {
      const currentScore = currentScores[domain];

      // Calculate goal based on current performance
      if (currentScore >= 90) {
        // Already performing excellently, set maintenance goal
        dynamicGoals[domain] = Math.min(95, currentScore + 2);
      } else if (currentScore >= 80) {
        // Good performance, aim for excellence
        dynamicGoals[domain] = Math.min(90, currentScore + 8);
      } else if (currentScore >= 70) {
        // Average performance, aim for good
        dynamicGoals[domain] = Math.min(85, currentScore + 12);
      } else if (currentScore >= 60) {
        // Below average, aim for average
        dynamicGoals[domain] = Math.min(75, currentScore + 15);
      } else {
        // Needs improvement, aim for basic competency
        dynamicGoals[domain] = Math.min(70, currentScore + 20);
      }
    });

    // Merge with provided goals, giving priority to provided goals
    return { ...dynamicGoals, ...goals };
  }, [currentScores, goals]);

  // Calculate trend data from timelines
  const trendData = useMemo(() => {
    if (!timelines || timelines.length < 2) return {};

    const trends = {};
    Object.keys(currentScores).forEach(domain => {
      const domainTimelines = timelines
        .filter(t => t.scores && t.scores[domain] !== undefined)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (domainTimelines.length >= 2) {
        const recent = domainTimelines[domainTimelines.length - 1].scores[domain];
        const previous = domainTimelines[domainTimelines.length - 2].scores[domain];
        trends[domain] = recent - previous;
      }
    });

    return trends;
  }, [timelines, currentScores]);

  const calculateProgress = (currentScore, goalScore) => {
    return Math.min((currentScore / goalScore) * 100, 100);
  };

  const getProgressColor = progress => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIndicator = (currentScore, previousScore) => {
    if (!previousScore) return null;

    const difference = currentScore - previousScore;
    if (difference > 5) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <span className="text-xs font-semibold">+{difference.toFixed(1)}</span>
        </div>
      );
    } else if (difference < -5) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <span className="text-xs font-semibold">{difference.toFixed(1)}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
        </svg>
        <span className="text-xs font-semibold">Stable</span>
      </div>
    );
  };

  const getMotivationalMessage = (domain, currentScore, goalScore, progress) => {
    if (progress >= 100) {
      return "🎉 Goal achieved! You're doing amazing!";
    } else if (progress >= 80) {
      return '🚀 Almost there! Keep up the great work!';
    } else if (progress >= 60) {
      return "💪 Good progress! You're on the right track!";
    } else if (progress >= 40) {
      return '📚 Keep practicing! Every effort counts!';
    } else {
      return '🌟 Start small, dream big! You can do it!';
    }
  };

  if (Object.keys(currentScores).length === 0) {
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Learning Goals & Milestones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete assessments to see your personalized goals
            </p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          Start with assessments to receive personalized learning goals based on your performance.
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Learning Goals & Milestones
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalized goals based on your current performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(calculatedGoals).map(([domain, goalScore]) => {
          const currentScore = currentScores[domain] || 0;
          const progress = calculateProgress(currentScore, goalScore);
          const isCompleted = currentScore >= goalScore;
          const trend = trendData[domain];

          return (
            <motion.div
              key={domain}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
                  : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{domain}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Goal: {goalScore}%</p>
                  </div>
                </div>
                {trend !== undefined && getTrendIndicator(currentScore, currentScore - trend)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {currentScore}% / {goalScore}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isCompleted ? 'Goal Achieved! 🎉' : `${goalScore - currentScore}% to go`}
                    </span>
                    <span
                      className={`font-semibold ${
                        isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {progress.toFixed(1)}% Complete
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                    {getMotivationalMessage(domain, currentScore, goalScore, progress)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall Progress Summary */}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Overall Progress
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Summary of all learning goals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {
                Object.entries(calculatedGoals).filter(
                  ([domain]) => (currentScores[domain] || 0) >= calculatedGoals[domain]
                ).length
              }
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Goals Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Object.entries(calculatedGoals).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Goals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(
                Object.entries(calculatedGoals).reduce(
                  (sum, [domain]) =>
                    sum + calculateProgress(currentScores[domain] || 0, calculatedGoals[domain]),
                  0
                ) / Object.entries(calculatedGoals).length
              )}
              %
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {
                Object.entries(calculatedGoals).filter(([domain]) => {
                  const progress = calculateProgress(
                    currentScores[domain] || 0,
                    calculatedGoals[domain]
                  );
                  return progress >= 75 && progress < 100;
                }).length
              }
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Near Completion</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GoalTracking;
