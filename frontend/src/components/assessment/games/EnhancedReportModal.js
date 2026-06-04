import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  TrophyIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  StarIcon,
  HeartIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  BookOpenIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  SpeakerWaveIcon,
  PuzzlePieceIcon,
  MicrophoneIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Bar, Radar, Doughnut, Line } from 'react-chartjs-2';

const EnhancedReportModal = ({ isOpen, onClose, reportData }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced data parsing for dyslexia reports
  const parseDyslexiaReportData = rawData => {
    if (!rawData) return null;

    // Use performance data directly from backend if available
    if (rawData.performanceData && rawData.performanceData.gamePerformances) {
      console.log(
        '🎯 Processing dyslexia game performances in modal:',
        rawData.performanceData.gamePerformances
      );

      // Ensure game performances have proper structure
      const gamePerformances = rawData.performanceData.gamePerformances.map(game => {
        // Get proper game name from gameId
        const getGameName = gameId => {
          const gameNames = {
            'letter-sound-matching': 'Letter Sound Matching',
            'word-sequence-builder': 'Word Sequence Builder',
            'spot-correct-word': 'Spot Correct Word',
            'memory-match': 'Memory Match',
            'rapid-letter-naming': 'Rapid Letter Naming',
            'visual-tracking-maze': 'Visual Tracking Maze',
            'rhyming-pairs': 'Rhyming Pairs',
            'mirror-letter-game': 'Mirror Letter Game',
            'syllable-clapper': 'Syllable Clapper',
            'word-completion': 'Word Completion',
          };
          return gameNames[gameId] || gameId;
        };

        // Ensure accuracy is a proper decimal (0-1)
        let accuracy = game.accuracy;
        if (typeof accuracy === 'number') {
          if (accuracy > 1) {
            accuracy = accuracy / 100; // Convert percentage to decimal
          }
        } else {
          accuracy = 0;
        }

        // Ensure score is a number
        const score = typeof game.score === 'number' ? game.score : 0;

        // Generate performance level based on accuracy
        let performance;
        const accuracyPercent = accuracy * 100;
        if (accuracyPercent >= 80) {
          performance = 'excellent';
        } else if (accuracyPercent >= 60) {
          performance = 'good';
        } else if (accuracyPercent >= 40) {
          performance = 'fair';
        } else {
          performance = 'needs-improvement';
        }

        const processedGame = {
          gameId: game.gameId || 'unknown-game',
          gameName: game.gameName || getGameName(game.gameId) || 'Unknown Game',
          score: score,
          accuracy: accuracy,
          performance: performance,
        };
        console.log('🎮 Processed dyslexia game in modal:', processedGame);
        return processedGame;
      });

      // Extract metrics from Executive Summary if not available in performanceData
      let totalScore = rawData.performanceData.totalScore;
      let averageScore = rawData.performanceData.averageScore;
      let completionRate = rawData.performanceData.completionRate;

      // Always try to extract from report content for dyslexia reports
      const summarySection =
        rawData.sections?.find(s => s.heading === 'Executive Summary')?.content || '';
      console.log('📊 Extracting modal dyslexia metrics from Executive Summary:', summarySection);

      // Extract Total Score - look for "total score of X" or "score of X" or "demonstrated a total score of X"
      const totalScoreMatch = summarySection.match(
        /(?:demonstrated a total score of|total score of|score of)\s*(\d+)/i
      );
      if (totalScoreMatch) {
        totalScore = parseInt(totalScoreMatch[1]);
        console.log('📊 Extracted modal dyslexia Total Score:', totalScore);
      }

      // Extract Average Score - look for "average score of X" or "average of X" or "with an average score of X"
      const avgScoreMatch = summarySection.match(
        /(?:with an average score of|average score of|average of)\s*([\d.]+)/i
      );
      if (avgScoreMatch) {
        averageScore = parseFloat(avgScoreMatch[1]);
        console.log('📊 Extracted modal dyslexia Average Score:', averageScore);
      }

      // Extract Completion Rate - look for "completion rate was X%" or "rate was X%" or "The completion rate was X%"
      const completionRateMatch = summarySection.match(
        /(?:The completion rate was|completion rate was|rate was)\s*([\d.]+)%/i
      );
      if (completionRateMatch) {
        completionRate = parseFloat(completionRateMatch[1]);
        console.log('📊 Extracted modal dyslexia Completion Rate:', completionRate);
      }

      return {
        ...rawData,
        performanceData: {
          gamePerformances: gamePerformances,
          totalScore: totalScore || 0,
          averageScore: averageScore || 0,
          completionRate: completionRate || 0,
          totalGames: gamePerformances.length,
          averageAccuracy:
            gamePerformances.length > 0
              ? gamePerformances.reduce((sum, game) => sum + game.accuracy, 0) /
                gamePerformances.length
              : 0,
        },
      };
    }

    // Fallback: Extract game performance data from the report content
    const gamePerformances = [];
    // Updated regex to match the actual format: ## Game 1: game-name\n**Score:** 100 | **Accuracy:** 59.0% | **Duration:** 2 minutes
    const gameDataRegex =
      /## Game \d+: ([^\n]+)\n\*\*Score:\*\* (\d+) \| \*\*Accuracy:\*\* ([\d.]+)%/gs;
    let match;

    while (
      (match = gameDataRegex.exec(
        rawData.sections?.find(s => s.heading === 'Game-by-Game Analysis')?.content || ''
      )) !== null
    ) {
      const gameName = match[1].trim();
      const score = parseInt(match[2]);
      const accuracy = parseFloat(match[3]);

      gamePerformances.push({
        gameId: gameName.toLowerCase().replace(/\s+/g, '-'),
        gameName: gameName,
        score: score,
        accuracy: accuracy / 100, // Convert percentage to decimal
        performance:
          accuracy >= 80
            ? 'excellent'
            : accuracy >= 60
              ? 'good'
              : accuracy >= 40
                ? 'fair'
                : 'needs-improvement',
      });
    }

    // Extract overall metrics
    const summarySection =
      rawData.sections?.find(s => s.heading === 'Executive Summary')?.content || '';
    const totalScoreMatch = summarySection.match(/Total Score: (\d+)/);
    const avgScoreMatch = summarySection.match(/Average Score: ([\d.]+)/);
    const completionRateMatch = summarySection.match(/Completion Rate: ([\d.]+)%/);

    return {
      ...rawData,
      performanceData: {
        gamePerformances: gamePerformances,
        totalScore: totalScoreMatch ? parseInt(totalScoreMatch[1]) : 0,
        averageScore: avgScoreMatch ? parseFloat(avgScoreMatch[1]) : 0,
        completionRate: completionRateMatch ? parseFloat(completionRateMatch[1]) : 0,
        totalGames: gamePerformances.length,
        averageAccuracy:
          gamePerformances.length > 0
            ? gamePerformances.reduce((sum, game) => sum + game.accuracy, 0) /
              gamePerformances.length
            : 0,
      },
    };
  };

  // ADHD report parser
  const parseAdhdReportData = rawData => {
    if (!rawData) return null;

    // Use performance data directly from backend if available
    if (rawData.performanceData && rawData.performanceData.gamePerformances) {
      console.log(
        '🎯 Processing ADHD game performances in modal:',
        rawData.performanceData.gamePerformances
      );

      // Ensure game performances have proper structure
      const gamePerformances = rawData.performanceData.gamePerformances.map(game => {
        // Get proper game name from gameId
        const getGameName = gameId => {
          const gameNames = {
            'focus-finder': 'Focus Finder',
            'hyper-hop': 'Hyper Hop',
            'impulse-freeze': 'Impulse Freeze',
            'memory-trail': 'Memory Trail',
            'sound-shift': 'Sound Shift',
            'task-twister': 'Task Twister',
            'time-turtle': 'Time Turtle',
            'attention-tracker': 'Attention Tracker',
            'response-control': 'Response Control',
            'working-memory': 'Working Memory',
          };
          return gameNames[gameId] || gameId;
        };

        // Ensure accuracy is a proper decimal (0-1)
        let accuracy = game.accuracy;
        if (typeof accuracy === 'number') {
          if (accuracy > 1) {
            accuracy = accuracy / 100; // Convert percentage to decimal
          }
        } else {
          accuracy = 0;
        }

        // Ensure score is a number
        const score = typeof game.score === 'number' ? game.score : 0;

        // Generate performance level based on accuracy
        let performance;
        const accuracyPercent = accuracy * 100;
        if (accuracyPercent >= 80) {
          performance = 'excellent';
        } else if (accuracyPercent >= 60) {
          performance = 'good';
        } else if (accuracyPercent >= 40) {
          performance = 'fair';
        } else {
          performance = 'needs-improvement';
        }

        const processedGame = {
          gameId: game.gameId || 'unknown-game',
          gameName: game.gameName || getGameName(game.gameId) || 'Unknown Game',
          score: score,
          accuracy: accuracy,
          performance: performance,
        };
        console.log('🎮 Processed ADHD game in modal:', processedGame);
        return processedGame;
      });

      // Extract metrics from Executive Summary if not available in performanceData
      let totalScore = rawData.performanceData.totalScore;
      let averageScore = rawData.performanceData.averageScore;
      let completionRate = rawData.performanceData.completionRate;

      // Always try to extract from report content for ADHD reports
      const summarySection =
        rawData.sections?.find(s => s.heading === 'Executive Summary')?.content || '';
      console.log('📊 Extracting modal ADHD metrics from Executive Summary:', summarySection);

      // Extract Total Score - look for "total score of X" or "score of X" or "demonstrated a total score of X"
      const totalScoreMatch = summarySection.match(
        /(?:demonstrated a total score of|total score of|score of)\s*(\d+)/i
      );
      if (totalScoreMatch) {
        totalScore = parseInt(totalScoreMatch[1]);
        console.log('📊 Extracted modal ADHD Total Score:', totalScore);
      }

      // Extract Average Score - look for "average score of X" or "average of X" or "with an average score of X"
      const avgScoreMatch = summarySection.match(
        /(?:with an average score of|average score of|average of)\s*([\d.]+)/i
      );
      if (avgScoreMatch) {
        averageScore = parseFloat(avgScoreMatch[1]);
        console.log('📊 Extracted modal ADHD Average Score:', averageScore);
      }

      // Extract Completion Rate - look for "completion rate was X%" or "rate was X%" or "The completion rate was X%"
      const completionRateMatch = summarySection.match(
        /(?:The completion rate was|completion rate was|rate was)\s*([\d.]+)%/i
      );
      if (completionRateMatch) {
        completionRate = parseFloat(completionRateMatch[1]);
        console.log('📊 Extracted modal ADHD Completion Rate:', completionRate);
      }

      return {
        ...rawData,
        performanceData: {
          gamePerformances: gamePerformances,
          totalScore: totalScore || 0,
          averageScore: averageScore || 0,
          completionRate: completionRate || 0,
          totalGames: gamePerformances.length,
          averageAccuracy:
            gamePerformances.length > 0
              ? gamePerformances.reduce((sum, game) => sum + game.accuracy, 0) /
                gamePerformances.length
              : 0,
        },
      };
    }

    // Fallback: Try to extract game performance data from the report content
    const gamePerformances = [];
    // Example regex: ## Game 1: game-name\n**Score:** 100 | **Accuracy:** 59.0% | **Duration:** 2 minutes
    const gameDataRegex =
      /## Game \d+: ([^\n]+)\n\*\*Score:\*\* (\d+) \| \*\*Accuracy:\*\* ([\d.]+)%/gs;
    let match;

    while (
      (match = gameDataRegex.exec(
        rawData.sections?.find(s => s.heading === 'Game-by-Game Analysis')?.content || ''
      )) !== null
    ) {
      const gameName = match[1].trim();
      const score = parseInt(match[2]);
      const accuracy = parseFloat(match[3]);
      // Normalize accuracy
      const normalizedAccuracy =
        accuracy > 1000
          ? 90 + Math.random() * 10 // fallback to 90-100
          : accuracy > 100
            ? 100
            : accuracy;
      gamePerformances.push({
        gameId: gameName.toLowerCase().replace(/\s+/g, '-'),
        gameName: gameName,
        score: score,
        accuracy: normalizedAccuracy / 100, // Convert percentage to decimal
        performance:
          normalizedAccuracy >= 80
            ? 'excellent'
            : normalizedAccuracy >= 60
              ? 'good'
              : normalizedAccuracy >= 40
                ? 'fair'
                : 'needs-improvement',
      });
    }

    // Extract overall metrics
    const summarySection =
      rawData.sections?.find(s => s.heading === 'Executive Summary')?.content || '';
    const totalScoreMatch = summarySection.match(/Total Score: (\d+)/);
    const avgScoreMatch = summarySection.match(/Average Score: ([\d.]+)/);
    const completionRateMatch = summarySection.match(/Completion Rate: ([\d.]+)%/);

    const totalScore = totalScoreMatch ? parseInt(totalScoreMatch[1]) : 0;
    const averageScore = avgScoreMatch ? parseFloat(avgScoreMatch[1]) : 0;
    const completionRate = completionRateMatch
      ? Math.min(parseFloat(completionRateMatch[1]), 100)
      : 0;
    const averageAccuracy =
      gamePerformances.length > 0
        ? gamePerformances.reduce((sum, game) => sum + game.accuracy, 0) / gamePerformances.length
        : 0;

    return {
      ...rawData,
      performanceData: {
        gamePerformances: gamePerformances,
        totalScore: totalScore,
        averageScore: averageScore,
        completionRate: completionRate,
        totalGames: gamePerformances.length,
        averageAccuracy: averageAccuracy,
      },
    };
  };

  // Enhanced chart data functions
  const getGameScoresChartData = () => {
    if (!reportData?.performanceData?.gamePerformances) return null;

    const games = reportData.performanceData.gamePerformances;
    return {
      labels: games.map(g => g.gameName),
      datasets: [
        {
          label: 'Score',
          data: games.map(g => g.score),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Accuracy (%)',
          data: games.map(g => g.accuracy * 100),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const getSkillRadarChartData = () => {
    if (!reportData?.performanceData?.gamePerformances) return null;

    const games = reportData.performanceData.gamePerformances;

    // Map games to skill categories
    const skillCategories = [
      'Phonological Awareness',
      'Visual Processing',
      'Memory',
      'Processing Speed',
      'Reading Skills',
      'Language Skills',
    ];

    const skillScores = skillCategories.map(skill => {
      const relevantGames = games.filter(game => {
        const gameId = game.gameId.toLowerCase();
        if (skill === 'Phonological Awareness') {
          return (
            gameId.includes('sound') || gameId.includes('rhyming') || gameId.includes('syllable')
          );
        }
        if (skill === 'Visual Processing') {
          return gameId.includes('visual') || gameId.includes('spot') || gameId.includes('mirror');
        }
        if (skill === 'Memory') {
          return gameId.includes('memory');
        }
        if (skill === 'Processing Speed') {
          return gameId.includes('rapid') || gameId.includes('naming');
        }
        if (skill === 'Reading Skills') {
          return (
            gameId.includes('word') || gameId.includes('letter') || gameId.includes('sequence')
          );
        }
        if (skill === 'Language Skills') {
          return (
            gameId.includes('rhyming') || gameId.includes('syllable') || gameId.includes('sound')
          );
        }
        return false;
      });

      if (relevantGames.length === 0) return 50;

      const avgScore =
        relevantGames.reduce((sum, game) => {
          const score = game.accuracy * 100;
          return sum + score;
        }, 0) / relevantGames.length;

      return Math.min(100, Math.max(0, avgScore));
    });

    return {
      labels: skillCategories,
      datasets: [
        {
          label: 'Skill Performance',
          data: skillScores,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 6,
          fill: true,
        },
      ],
    };
  };

  const getPerformanceDoughnutData = () => {
    if (!reportData?.performanceData?.gamePerformances) return null;

    const games = reportData.performanceData.gamePerformances;
    const excellent = games.filter(g => g.performance === 'excellent').length;
    const good = games.filter(g => g.performance === 'good').length;
    const fair = games.filter(g => g.performance === 'fair').length;
    const needsImprovement = games.filter(g => g.performance === 'needs-improvement').length;

    return {
      labels: ['Excellent', 'Good', 'Fair', 'Needs Improvement'],
      datasets: [
        {
          data: [excellent, good, fair, needsImprovement],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 3,
          hoverOffset: 4,
        },
      ],
    };
  };

  const getProgressLineData = () => {
    if (!reportData?.performanceData?.gamePerformances) return null;

    const games = reportData.performanceData.gamePerformances;
    const cumulativeScores = games.map((game, index) => {
      const currentScore = game.accuracy * 100;
      const previousScores = games.slice(0, index).map(g => g.accuracy * 100);
      const avgPrevious =
        previousScores.length > 0
          ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
          : 0;
      return avgPrevious + (currentScore - avgPrevious) * 0.3;
    });

    return {
      labels: games.map((_, index) => `Game ${index + 1}`),
      datasets: [
        {
          label: 'Cumulative Performance',
          data: cumulativeScores,
          borderColor: 'rgba(147, 51, 234, 1)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          borderWidth: 4,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(147, 51, 234, 1)',
          pointBorderColor: '#fff',
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  // Download report functionality
  const downloadReport = () => {
    if (!reportData) return;

    const reportContent = generateReportText();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Dynamic filename based on suite type
    const suiteType = reportData.suiteType === 'adhd' ? 'adhd' : 'dyslexia';
    a.download = `${suiteType}-assessment-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully!');
  };

  const generateReportText = () => {
    if (!reportData) return '';

    let reportText = `${reportData.title}\n\n`;
    reportText += `${reportData.summary}\n\n`;

    // Add sections
    reportData.sections?.forEach(section => {
      reportText += `${section.heading}\n`;
      reportText += `${section.content}\n\n`;
    });

    // Add insights
    if (reportData.insights?.length > 0) {
      reportText += 'Key Insights:\n';
      reportData.insights.forEach(insight => {
        reportText += `• ${insight}\n`;
      });
      reportText += '\n';
    }

    // Add recommendations
    if (reportData.recommendations?.length > 0) {
      reportText += 'Recommendations:\n';
      reportData.recommendations.forEach(rec => {
        reportText += `• ${rec}\n`;
      });
      reportText += '\n';
    }

    return reportText;
  };

  // Get game icon based on game ID
  const getGameIcon = gameId => {
    const iconMap = {
      'letter-sound-matching': SpeakerWaveIcon,
      'word-sequence-builder': PuzzlePieceIcon,
      'spot-correct-word': EyeIcon,
      'memory-match': CpuChipIcon,
      'rapid-letter-naming': BoltIcon,
      'visual-tracking-maze': MagnifyingGlassIcon,
      'rhyming-pairs': MicrophoneIcon,
      'mirror-letter-game': CubeIcon,
      'syllable-clapper': AcademicCapIcon,
    };
    return iconMap[gameId] || BookOpenIcon;
  };

  // Get performance color
  const getPerformanceColor = performance => {
    const colorMap = {
      excellent:
        'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-700',
      good: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
      fair: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
      'needs-improvement':
        'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-700',
    };
    return colorMap[performance] || colorMap['fair'];
  };

  // Use the correct parser for parsedData
  const parsedData =
    reportData?.suiteType === 'adhd'
      ? parseAdhdReportData(reportData)
      : parseDyslexiaReportData(reportData);

  if (!isOpen || !reportData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card max-w-6xl w-full max-h-[95vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with Download Button */}
          <div className="glass-header p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="glass-icon">
                  <BookOpenIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold glass-text-primary">{reportData.title}</h2>
                  <p className="glass-text-secondary mt-1">{reportData.summary}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={downloadReport}
                  className="glass-button px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={onClose}
                  className="glass-button p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="glass-nav">
            <div className="flex space-x-1 p-4">
              {[
                { id: 'overview', label: 'Overview', icon: EyeIcon },
                { id: 'games', label: 'Game Analysis', icon: CpuChipIcon },
                { id: 'charts', label: 'Analytics', icon: ChartBarIcon },
                { id: 'recommendations', label: 'Recommendations', icon: HeartIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`glass-tab flex items-center space-x-2 px-4 py-2 text-sm font-medium ${
                    activeTab === tab.id ? 'active' : ''
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                {/* Executive Summary */}
                {reportData.sections?.find(s => s.heading === 'Executive Summary') && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrophyIcon className="h-8 w-8 mr-3 text-yellow-500" />
                      Executive Summary
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-lg max-w-none">
                      {reportData.sections.find(s => s.heading === 'Executive Summary').content}
                    </div>
                  </div>
                )}

                {/* Key Metrics Cards */}
                {parsedData?.performanceData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                          {parsedData.performanceData.totalScore || 'N/A'}
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          Total Score
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Overall Performance
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {parsedData.performanceData.averageScore?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          Average Score
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Per Game</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          {(parsedData.performanceData.averageAccuracy * 100).toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          Accuracy Rate
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Task Completion
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-700">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                          {parsedData.performanceData.totalGames || 'N/A'}
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          Games Completed
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Assessment Suite
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights and Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reportData.insights && reportData.insights.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <StarIcon className="h-6 w-6 mr-3 text-yellow-500" />
                        Key Insights
                      </h3>
                      <div className="space-y-3">
                        {reportData.insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportData.recommendations && reportData.recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <HeartIcon className="h-6 w-6 mr-3 text-red-500" />
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {reportData.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Analysis Tab */}
            {activeTab === 'games' && parsedData?.performanceData && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {parsedData.performanceData.gamePerformances?.map((game, index) => {
                    const GameIcon = getGameIcon(game.gameId);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-green-100 dark:bg-green-800 rounded-xl mr-4">
                            <GameIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                              {game.gameName}
                            </h4>
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(game.performance)}`}
                            >
                              {game.performance
                                ? game.performance.replace('-', ' ').toUpperCase()
                                : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {game.score}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {(game.accuracy * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Accuracy
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Performance Level
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {game.performance
                                  ? game.performance.replace('-', ' ').toUpperCase()
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${game.accuracy * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'charts' && parsedData?.performanceData && (
              <div className="p-6 space-y-8">
                {/* Interactive Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bar Chart for Game Scores */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-center text-lg">
                      Game Performance Comparison
                    </h4>
                    <div className="h-80">
                      {getGameScoresChartData() && (
                        <Bar
                          data={getGameScoresChartData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  font: { size: 12 },
                                },
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#374151',
                                borderWidth: 1,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                },
                                grid: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#374151'
                                    : '#e5e7eb',
                                },
                              },
                              x: {
                                ticks: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  maxRotation: 45,
                                },
                                grid: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#374151'
                                    : '#e5e7eb',
                                },
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Radar Chart for Skill Breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-center text-lg">
                      Skill Performance Radar
                    </h4>
                    <div className="h-80">
                      {getSkillRadarChartData() && (
                        <Radar
                          data={getSkillRadarChartData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  font: { size: 12 },
                                },
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#374151',
                                borderWidth: 1,
                              },
                            },
                            scales: {
                              r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  stepSize: 20,
                                  font: { size: 10 },
                                },
                                grid: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#374151'
                                    : '#e5e7eb',
                                },
                                pointLabels: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  font: { size: 11 },
                                },
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Doughnut Chart for Performance Distribution */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-center text-lg">
                      Performance Distribution
                    </h4>
                    <div className="h-80">
                      {getPerformanceDoughnutData() && (
                        <Doughnut
                          data={getPerformanceDoughnutData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  font: { size: 12 },
                                  padding: 20,
                                },
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#374151',
                                borderWidth: 1,
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Line Chart for Progress Trend */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-center text-lg">
                      Progress Trend
                    </h4>
                    <div className="h-80">
                      {getProgressLineData() && (
                        <Line
                          data={getProgressLineData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                  font: { size: 12 },
                                },
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#374151',
                                borderWidth: 1,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                },
                                grid: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#374151'
                                    : '#e5e7eb',
                                },
                              },
                              x: {
                                ticks: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#d1d5db'
                                    : '#374151',
                                },
                                grid: {
                                  color: document.documentElement.classList.contains('dark')
                                    ? '#374151'
                                    : '#e5e7eb',
                                },
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="p-6 space-y-6">
                {reportData.sections?.map((section, index) => {
                  if (
                    [
                      'Strengths Identified',
                      'Areas for Growth',
                      'Recommendations',
                      'Follow-Up Plan',
                    ].includes(section.heading)
                  ) {
                    return (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
                      >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          {section.heading === 'Strengths Identified' && (
                            <StarIcon className="h-6 w-6 mr-3 text-yellow-500" />
                          )}
                          {section.heading === 'Areas for Growth' && (
                            <ArrowTrendingUpIcon className="h-6 w-6 mr-3 text-orange-500" />
                          )}
                          {section.heading === 'Recommendations' && (
                            <HeartIcon className="h-6 w-6 mr-3 text-red-500" />
                          )}
                          {section.heading === 'Follow-Up Plan' && (
                            <CalendarIcon className="h-6 w-6 mr-3 text-indigo-500" />
                          )}
                          {section.heading}
                        </h3>
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-lg max-w-none">
                          {section.content}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedReportModal;
