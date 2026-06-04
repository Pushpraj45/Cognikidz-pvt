import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '../ui/LogoLoader';
import { format } from 'date-fns';
import { getDomainColor } from '../../utils/domainMapping';

const EnhancedProgressVisualization = ({
  data = {
    overallProgress: {
      totalGoals: 25,
      goalsAchieved: 8,
      averageProgress: 67,
      nearCompletion: 5,
      overallScore: 75,
    },
    domains: {},
    learningInsights: {},
    timeline: [],
    goals: {},
    chartData: {
      pieChart: [],
      barChart: [],
      radarChart: [],
      timelineData: [],
    },
  },
  height = 600,
  isDarkMode = false,
  loading = false,
  activeFilter = 'all',
  onGoalUpdate = null,
}) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [goalsState, setGoalsState] = useState(data.goals || {});

  // Update goals state when data changes
  useEffect(() => {
    if (data.goals && Object.keys(data.goals).length > 0) {
      setGoalsState(data.goals);
    }
  }, [data.goals]);

  const COLORS = isDarkMode
    ? [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#06B6D4',
        '#F97316',
        '#84CC16',
        '#EC4899',
      ]
    : [
        '#2563EB',
        '#059669',
        '#D97706',
        '#DC2626',
        '#7C3AED',
        '#0891B2',
        '#EA580C',
        '#65A30D',
        '#DB2777',
      ];

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'near_completion':
        return 'text-blue-600 dark:text-blue-400';
      case 'in_progress':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'not_started':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-300';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'near_completion':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'not_started':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderOverallProgress = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Score</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.overallProgress?.overallScore || 0}%
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Goals Achieved</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.overallProgress?.goalsAchieved || 0}/{data.overallProgress?.totalGoals || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Progress</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.overallProgress?.averageProgress || 0}%
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Near Completion</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.overallProgress?.nearCompletion || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDomainProgress = () => {
    const domains = data.domains || {};
    const domainEntries = Object.entries(domains);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {domainEntries.map(([domainName, domainData], index) => (
            <motion.div
              key={domainName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedDomain(domainName)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {domainName}
                </h3>
                <div className={`flex items-center ${getStatusColor(domainData.status)}`}>
                  {getStatusIcon(domainData.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {domainData.currentScore || 0}% / {domainData.goal || 100}%
                  </span>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${domainData.progress || 0}%`,
                        backgroundColor: getDomainColor(domainName),
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{domainData.progress || 0}% Complete</span>
                    <span>{domainData.remaining || 0}% to go</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">{domainData.insights || 'No insights available'}</p>
                  {domainData.recommendations && domainData.recommendations.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {domainData.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="text-xs">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderLearningInsights = () => {
    const insights = data.learningInsights || {};

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Learning Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Top Performing Domain
              </h4>
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {insights.topPerformingDomain || 'Social Communication'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your strongest area</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Needs Attention</h4>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {insights.needsAttention || 'Sensory Processing'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Focus area for improvement
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Strengths</h4>
            <div className="flex flex-wrap gap-2">
              {(insights.keyStrengths || ['Strong social skills', 'Good communication']).map(
                (strength, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
                  >
                    {strength}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Areas for Improvement
            </h4>
            <div className="flex flex-wrap gap-2">
              {(insights.areasForImprovement || ['Sensory processing', 'Focus and attention']).map(
                (area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm"
                  >
                    {area}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTimelineChart = () => {
    const timelineData = data.chartData?.timelineData || data.timeline || [];

    if (timelineData.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Progress Timeline
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No timeline data available
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Progress Timeline
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis
              dataKey="date"
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tickFormatter={value => format(new Date(value), 'MMM dd')}
            />
            <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="overallScore"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    );
  };

  const renderPieChart = () => {
    const pieData = data.chartData?.pieChart || [];

    if (pieData.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Progress Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    );
  };

  const renderBarChart = () => {
    const barData = data.chartData?.barChart || [];

    if (barData.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Domain Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis
              dataKey="domain"
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="goal" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  };

  const renderRadarChart = () => {
    const radarData = data.chartData?.radarChart || [];

    if (radarData.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Domain Overview
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <PolarAngleAxis dataKey="domain" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
            />
            <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  };

  const handleGoalToggle = (goalKey, subgoalId) => {
    const updatedGoals = { ...goalsState };
    const goal = updatedGoals[goalKey];

    if (goal && goal.subgoals) {
      const subgoalIndex = goal.subgoals.findIndex(sub => sub.id === subgoalId);
      if (subgoalIndex !== -1) {
        goal.subgoals[subgoalIndex].completed = !goal.subgoals[subgoalIndex].completed;
        setGoalsState(updatedGoals);

        // Calculate new progress
        const totalSubgoals = Object.values(updatedGoals).reduce(
          (total, goal) => total + (goal.subgoals?.length || 0),
          0
        );
        const completedSubgoals = Object.values(updatedGoals).reduce(
          (total, goal) => total + (goal.subgoals?.filter(sub => sub.completed).length || 0),
          0
        );

        // Update parent component if callback provided
        if (onGoalUpdate) {
          onGoalUpdate({
            goals: updatedGoals,
            totalGoals: totalSubgoals,
            goalsAchieved: completedSubgoals,
            progress: Math.round((completedSubgoals / totalSubgoals) * 100),
          });
        }
      }
    }
  };

  const renderGoals = () => {
    const goalEntries = Object.entries(goalsState);

    if (goalEntries.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Development Goals
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No goals available yet. Goals will be generated based on assessment results.
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Development Goals
          </h3>

          <div className="space-y-6">
            {goalEntries.map(([goalKey, goalData], index) => (
              <motion.div
                key={goalKey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {goalData.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {goalData.subgoals?.filter(sub => sub.completed).length || 0}/
                      {goalData.subgoals?.length || 0} completed
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">{goalData.description}</p>

                <div className="space-y-3">
                  {goalData.subgoals?.map((subgoal, subIndex) => (
                    <div
                      key={subgoal.id}
                      onClick={() => handleGoalToggle(goalKey, subgoal.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                        subgoal.completed
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          subgoal.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                        }`}
                      >
                        {subgoal.completed && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5
                            className={`font-medium ${
                              subgoal.completed
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {subgoal.title}
                          </h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              subgoal.priority === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : subgoal.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                          >
                            {subgoal.priority}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${
                            subgoal.completed
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {subgoal.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LogoLoader size="large" message="Analyzing progress data..." showMessage={true} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        {['overview', 'domains', 'insights', 'timeline', 'charts', 'goals'].map(view => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedView === view
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {renderOverallProgress()}
            {renderPieChart()}
            {renderBarChart()}
            {renderLearningInsights()}
          </motion.div>
        )}

        {selectedView === 'domains' && (
          <motion.div
            key="domains"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderDomainProgress()}
          </motion.div>
        )}

        {selectedView === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderLearningInsights()}
          </motion.div>
        )}

        {selectedView === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderTimelineChart()}
          </motion.div>
        )}

        {selectedView === 'charts' && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {renderPieChart()}
            {renderBarChart()}
            {renderRadarChart()}
            {renderTimelineChart()}
          </motion.div>
        )}

        {selectedView === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderGoals()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedProgressVisualization;
