import React, { useState, useMemo } from 'react';
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
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '../ui/LogoLoader';
import { format } from 'date-fns';
import {
  normalizeDomainName,
  getDomainColor,
  processDomainData,
  DOMAIN_COLORS,
  DARK_DOMAIN_COLORS,
} from '../../utils/domainConstants';
import GoalTracking from './GoalTracking';
import InteractiveFilters from './InteractiveFilters';
import LearningInsights from './LearningInsights';

// Enhanced filtering indicators with better icons
const ASSESSMENT_TYPE_INDICATORS = {
  all: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    label: 'All Assessments',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
  },
  text: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    label: 'Text-based Assessments',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
  },
  image: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    label: 'Image-based Assessments',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
  },
  game: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: 'Game-based Assessments',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
  },
};

const ProgressVisualization = ({
  data = {
    timelines: [],
    domains: {},
    currentScores: {},
    assessmentBreakdown: { text: 0, image: 0, total: 0 },
    activeFilter: 'all',
  },
  height = 500,
  isDarkMode = false,
  loading = false,
  activeFilter = 'all',
}) => {
  const [activeTab, setActiveTab] = useState('bar');

  console.log('🎯 ProgressVisualization received data:', {
    timelines: data.timelines?.length || 0,
    domains: Object.keys(data.domains || {}).length,
    domainsData: data.domains,
    currentScores: Object.keys(data.currentScores || {}).length,
    assessmentBreakdown: data.assessmentBreakdown,
    activeFilter: data.activeFilter || activeFilter,
  });

  // Get filter information
  const filterInfo =
    ASSESSMENT_TYPE_INDICATORS[data.activeFilter || activeFilter] || ASSESSMENT_TYPE_INDICATORS.all;

  // Enhanced assessment breakdown display with better styling
  const renderAssessmentBreakdown = () => {
    if (!data.assessmentBreakdown || data.assessmentBreakdown.total === 0) return null;

    const { text, image, total } = data.assessmentBreakdown;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-r from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl bg-gradient-to-r ${filterInfo.gradient} text-white shadow-lg`}
            >
              {filterInfo.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {filterInfo.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progress tracking and analysis
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              assessment{total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {data.activeFilter === 'all' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <span className="text-lg">📝</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{text}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Text Assessments</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200/50 dark:border-green-700/30">
              <div className="p-2 bg-green-500 rounded-lg text-white">
                <span className="text-lg">🖼️</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {image}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Image Assessments</div>
              </div>
            </div>
          </div>
        )}

        {data.activeFilter !== 'all' && (
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {data.activeFilter === 'text' ? text : image} {data.activeFilter} assessment
                {(data.activeFilter === 'text' ? text : image) !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Showing detailed progress for {data.activeFilter} assessments
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Generate timeline data for the line chart - show by assessment number
  const timelineData = useMemo(() => {
    if (!data.timelines || data.timelines.length === 0) return [];

    // Sort timelines chronologically
    const sortedTimelines = [...data.timelines].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return sortedTimelines.map((timeline, index) => {
      // Normalize domain names in timeline scores
      const normalizedScores = {};
      Object.entries(timeline.scores || {}).forEach(([domain, value]) => {
        const normalizedName = normalizeDomainName(domain);
        normalizedScores[normalizedName] = value;
      });

      return {
        assessment: `Assessment ${index + 1}`,
        date: format(new Date(timeline.date), 'MMM dd'),
        assessmentType: timeline.assessmentType,
        assessmentCategory: timeline.assessmentCategory,
        sourceType: timeline.sourceType,
        ...normalizedScores,
      };
    });
  }, [data.timelines]);

  // Generate area chart data - cumulative progress over time
  const areaData = useMemo(() => {
    if (!data.timelines || data.timelines.length === 0) return [];

    const sortedTimelines = [...data.timelines].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    let cumulativeScore = 0;
    return sortedTimelines.map((timeline, index) => {
      const scores = timeline.scores || {};
      const averageScore =
        Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length ||
        0;
      cumulativeScore += averageScore;

      return {
        assessment: `Assessment ${index + 1}`,
        date: format(new Date(timeline.date), 'MMM dd'),
        cumulativeScore: cumulativeScore / (index + 1), // Running average
        currentScore: averageScore,
        assessmentType: timeline.assessmentType,
      };
    });
  }, [data.timelines]);

  // Enhanced progress data with assessment type awareness
  const progressData = useMemo(() => {
    const domainsToProcess = data.domains || data.currentScores || {};

    console.log('🔧 Processing domains for progress visualization:', domainsToProcess);

    // Use the shared utility function for consistent processing
    const processedData = processDomainData(domainsToProcess);

    // Add colors and assessment type indicators
    return processedData.map(item => ({
      ...item,
      fill: getDomainColor(item.domain, isDarkMode),
      assessmentType: data.activeFilter,
    }));
  }, [data.domains, data.currentScores, isDarkMode, data.activeFilter]);

  // Enhanced radial data for radar chart
  const radialData = useMemo(() => {
    const domains = data.currentScores || data.domains || {};
    return Object.entries(domains).map(([name, score], index) => {
      const normalizedName = normalizeDomainName(name);
      const colorKey = normalizedName.toLowerCase().replace(/\s+/g, '_');
      return {
        name: normalizedName,
        value: score,
        fill: isDarkMode
          ? DARK_DOMAIN_COLORS[colorKey] || '#818CF8'
          : DOMAIN_COLORS[colorKey] || '#6366F1',
        fullMark: 100,
      };
    });
  }, [data.currentScores, data.domains, isDarkMode]);

  // Enhanced scatter data
  const scatterData = useMemo(() => {
    if (!data.timelines || data.timelines.length === 0) return [];

    return data.timelines.map((timeline, index) => {
      const scores = timeline.scores || {};
      const averageScore =
        Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length ||
        0;

      return {
        x: index + 1,
        y: averageScore,
        date: format(new Date(timeline.date), 'MMM dd'),
        assessmentType: timeline.assessmentType || 'unknown',
      };
    });
  }, [data.timelines]);

  // Enhanced pie chart data
  const pieData = useMemo(() => {
    const domains = data.currentScores || data.domains || {};
    return Object.entries(domains)
      .filter(([name, score]) => score > 0) // Filter out 0% scores
      .map(([name, score], index) => {
        const normalizedName = normalizeDomainName(name);
        return {
          name:
            normalizedName.length > 12 ? normalizedName.substring(0, 12) + '...' : normalizedName,
          value: score,
          fill: getDomainColor(normalizedName, isDarkMode),
        };
      });
  }, [data.currentScores, data.domains, isDarkMode]);

  // Enhanced tooltip for timeline chart with assessment type info
  const CustomTimelineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{label}</span>
            {data.assessmentCategory && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  data.assessmentCategory === 'image'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                }`}
              >
                {data.assessmentCategory === 'image' ? '🖼️ Image' : '📝 Text'}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {entry.dataKey}
                </span>
                <span className="text-sm font-bold" style={{ color: entry.color }}>
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced bar chart tooltip
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
            <span className="font-bold text-gray-800 dark:text-gray-200">{data.domain}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                data.assessmentType === 'image'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : data.assessmentType === 'text'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
              }`}
            >
              {data.assessmentType === 'image'
                ? '🖼️ Image'
                : data.assessmentType === 'text'
                  ? '📝 Text'
                  : '📊 All'}
            </span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: data.fill }}>
              {data.value}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Score</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for radial chart
  const CustomRadialTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
            <span className="font-bold text-gray-800 dark:text-gray-200">{data.name}</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: data.fill }}>
              {data.value}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for scatter chart
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="text-center">
            <div className="font-bold text-gray-800 dark:text-gray-200 mb-2">
              Assessment #{data.x}
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {data.y.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {data.date} • {data.assessmentType}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (!data.timelines || data.timelines.length === 0) {
    return (
      <div className="text-center py-16">
        {renderAssessmentBreakdown()}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          <div className="text-6xl mb-6">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-300">
            No Progress Data Available
          </h3>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {data.activeFilter === 'text'
              ? 'Complete text-based assessments to see detailed progress visualization here.'
              : data.activeFilter === 'image'
                ? 'Complete image-based assessments to see detailed progress visualization here.'
                : 'Complete assessments to see detailed progress visualization here.'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Assessment Type Breakdown */}
      {renderAssessmentBreakdown()}

      {/* Enhanced Tab Navigation */}
      <div className="flex gap-3 mb-8">
        {[
          {
            id: 'bar',
            label: 'Current Scores',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            ),
          },
          {
            id: 'line',
            label: 'Progress Over Time',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            ),
          },
          {
            id: 'area',
            label: 'Cumulative Progress',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
            ),
          },
          {
            id: 'pie',
            label: 'Pie Chart',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
            ),
          },
          {
            id: 'radar',
            label: 'Radar Analysis',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
          {
            id: 'scatter',
            label: 'Scatter Progress',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            ),
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl transform scale-105'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 p-8 rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60"
        >
          {activeTab === 'bar' && (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={progressData} margin={{ top: 30, right: 40, left: 30, bottom: 80 }}>
                <CartesianGrid strokeDasharray="4 4" opacity={0.2} />
                <XAxis
                  dataKey="domain"
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#barGradient)" />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'line' && (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={timelineData} margin={{ top: 30, right: 40, left: 30, bottom: 30 }}>
                <CartesianGrid strokeDasharray="4 4" opacity={0.2} />
                <XAxis
                  dataKey="assessment"
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Legend />
                {Object.keys(data.domains || {}).map((domain, index) => {
                  const normalizedDomain = normalizeDomainName(domain);
                  return (
                    <Line
                      key={normalizedDomain}
                      type="monotone"
                      dataKey={normalizedDomain}
                      stroke={getDomainColor(normalizedDomain, isDarkMode)}
                      strokeWidth={3}
                      dot={{
                        fill: getDomainColor(normalizedDomain, isDarkMode),
                        strokeWidth: 3,
                        r: 6,
                      }}
                      activeDot={{
                        r: 8,
                        stroke: getDomainColor(normalizedDomain, isDarkMode),
                        strokeWidth: 3,
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'area' && (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={areaData} margin={{ top: 30, right: 40, left: 30, bottom: 30 }}>
                <CartesianGrid strokeDasharray="4 4" opacity={0.2} />
                <XAxis
                  dataKey="assessment"
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulativeScore"
                  stroke={isDarkMode ? '#3B82F6' : '#2563EB'}
                  fill={isDarkMode ? '#3B82F6' : '#2563EB'}
                  fillOpacity={0.4}
                  strokeWidth={3}
                  name="Cumulative Progress"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'pie' && (
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60">
                          <div className="text-center">
                            <div className="font-bold text-gray-800 dark:text-gray-200">
                              {data.name}
                            </div>
                            <div className="text-lg font-bold" style={{ color: data.fill }}>
                              {data.value}%
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'radar' && (
            <ResponsiveContainer width="100%" height={height}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radialData}>
                <PolarGrid
                  stroke={isDarkMode ? '#4B5563' : '#E5E7EB'}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <PolarAngleAxis
                  dataKey="name"
                  stroke={isDarkMode ? '#E5E7EB' : '#374151'}
                  tick={{
                    fontSize: 12,
                    fontWeight: 600,
                    fill: isDarkMode ? '#E5E7EB' : '#374151',
                  }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke={isDarkMode ? '#4B5563' : '#E5E7EB'}
                  tick={{
                    fontSize: 12,
                    fontWeight: 500,
                    fill: isDarkMode ? '#9CA3AF' : '#6B7280',
                  }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke={getDomainColor('cognitive_development', isDarkMode)}
                  fill={getDomainColor('cognitive_development', isDarkMode)}
                  fillOpacity={0.4}
                  strokeWidth={3}
                />
                <Tooltip content={<CustomRadialTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'scatter' && (
            <ResponsiveContainer width="100%" height={height}>
              <ScatterChart margin={{ top: 30, right: 40, left: 30, bottom: 30 }}>
                <CartesianGrid strokeDasharray="4 4" opacity={0.2} />
                <XAxis
                  dataKey="x"
                  name="Assessment"
                  type="number"
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="y"
                  name="Score"
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={value => `${value}%`}
                  tick={{ fontSize: 14, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter
                  name="Progress"
                  data={scatterData}
                  fill="#3B82F6"
                  stroke="#1D4ED8"
                  strokeWidth={2}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Progress Insights */}
      {progressData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-8"
        >
          {/* Interactive Filters */}
          <InteractiveFilters
            domains={Object.keys(data.domains || {})}
            assessmentTypes={['text', 'image', 'game']}
            onFilterChange={filters => {
              // Handle filter changes here
              console.log('Filters changed:', filters);
              // TODO: Implement actual filtering logic
              // This would typically update the parent component's state
              // to filter the data based on the selected filters
            }}
            activeFilters={{}}
            timelines={data.timelines || []}
          />

          {/* Goal Tracking */}
          <GoalTracking
            currentScores={data.currentScores || {}}
            goals={{
              'Cognitive Development': 80,
              'Social Skills': 75,
              'Language Development': 85,
              'Motor Skills': 70,
              'Emotional Development': 80,
              'Attention & Focus': 75,
            }}
            timelines={data.timelines || []}
          />

          {/* Learning Insights */}
          <LearningInsights
            currentScores={data.currentScores || {}}
            previousScores={data.previousScores || {}}
            timelines={data.timelines || []}
            domains={Object.keys(data.domains || {})}
          />

          {/* Progress Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Progress Summary
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Top Performing Domain
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {progressData.sort((a, b) => b.value - a.value)[0]?.domain || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {progressData.sort((a, b) => b.value - a.value)[0]?.value || 0}% Score
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Average Score
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(
                    progressData.reduce((sum, item) => sum + item.value, 0) / progressData.length
                  )}
                  %
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">Across all domains</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressVisualization;
