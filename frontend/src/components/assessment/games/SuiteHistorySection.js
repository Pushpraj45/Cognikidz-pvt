import React, { useState, useEffect, useCallback } from 'react';
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
import api from '../../../services/api';
import { Bar, Radar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const SuiteHistorySection = ({ childId, assessmentType }) => {
  const [suiteHistory, setSuiteHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filterType, setFilterType] = useState(
    assessmentType && (assessmentType === 'adhd' || assessmentType === 'dyslexia')
      ? assessmentType
      : 'all'
  );
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'games', 'charts', 'recommendations'

  // If assessmentType changes, update filterType accordingly (but only if it's a valid type)
  useEffect(() => {
    if (assessmentType && (assessmentType === 'adhd' || assessmentType === 'dyslexia')) {
      setFilterType(assessmentType);
    } else {
      setFilterType('all');
    }
  }, [assessmentType]);

  const fetchSuiteHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/assessment/suite/history/${childId}`);

      if (response.data.success) {
        setSuiteHistory(response.data.suites);
      } else {
        toast.error('Failed to fetch suite history');
      }
    } catch (error) {
      console.error('Error fetching suite history:', error);
      toast.error('Failed to load suite history');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchSuiteHistory();
  }, [fetchSuiteHistory]);

  // Filter suites based on selected type
  const filteredSuites = suiteHistory.filter(suite => {
    if (filterType === 'all') return true;
    return suite.suiteType === filterType;
  });

  // Get statistics for each suite type
  const getSuiteTypeStats = type => {
    const typeSuites = suiteHistory.filter(suite => suite.suiteType === type);
    if (typeSuites.length === 0) return null;

    const avgScore = Math.round(
      typeSuites.reduce((sum, suite) => sum + (suite.totalScore || 0), 0) / typeSuites.length
    );
    const avgDuration = Math.round(
      typeSuites.reduce((sum, suite) => sum + (suite.totalDuration || 0), 0) / typeSuites.length
    );
    const avgAccuracy = Math.round(
      typeSuites.reduce((sum, suite) => sum + (suite.summaryMetrics?.averageAccuracy || 0), 0) /
        typeSuites.length
    );

    return {
      count: typeSuites.length,
      avgScore,
      avgDuration,
      avgAccuracy,
      latestDate: typeSuites[0]?.completedAt
        ? new Date(typeSuites[0].completedAt).toLocaleDateString()
        : 'N/A',
    };
  };

  const adhdStats = getSuiteTypeStats('adhd');
  const dyslexiaStats = getSuiteTypeStats('dyslexia');

  // Enhanced data parsing for dyslexia reports
  const parseDyslexiaReportData = rawData => {
    if (!rawData) return null;

    // Use performance data directly from backend if available
    if (rawData.performanceData && rawData.performanceData.gamePerformances) {
      console.log(
        '🎯 Processing dyslexia game performances:',
        rawData.performanceData.gamePerformances
      );

      // Ensure game performances have proper structure and remove duplicates
      const processedGames = rawData.performanceData.gamePerformances.map(game => {
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
            'syllable-clapper-enhanced': 'Syllable Clapper',
            'syllable-clapper-enhanced-game': 'Syllable Clapper',
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
        console.log('🎮 Processed dyslexia game:', processedGame);
        return processedGame;
      });

      // Remove duplicates based on gameId and gameName
      const uniqueGames = processedGames.filter((game, index, self) => {
        const firstIndex = self.findIndex(
          g => g.gameId === game.gameId || g.gameName === game.gameName
        );
        return firstIndex === index;
      });

      console.log('🎮 Unique dyslexia games after deduplication:', uniqueGames.length);
      const gamePerformances = uniqueGames;

      // Extract metrics from Executive Summary if not available in performanceData
      let totalScore = rawData.performanceData.totalScore;
      let averageScore = rawData.performanceData.averageScore;
      let completionRate = rawData.performanceData.completionRate;

      // Always try to extract from report content for dyslexia reports
      const summarySection =
        rawData.sections?.find(s => s.heading === 'Executive Summary')?.content || '';
      console.log('📊 Extracting dyslexia metrics from Executive Summary:', summarySection);
      console.log('📊 Executive Summary length:', summarySection.length);
      console.log('📊 Executive Summary first 200 chars:', summarySection.substring(0, 200));

      // Extract Total Score - look for "total score of X" or "score of X" or "demonstrated a total score of X"
      const totalScoreMatch = summarySection.match(
        /(?:demonstrated a total score of|total score of|score of)\s*(\d+)/i
      );
      if (totalScoreMatch) {
        totalScore = parseInt(totalScoreMatch[1]);
        console.log('📊 Extracted dyslexia Total Score:', totalScore);
      }

      // Extract Average Score - look for "average score of X" or "average of X" or "with an average score of X"
      const avgScoreMatch = summarySection.match(
        /(?:with an average score of|average score of|average of)\s*([\d.]+)/i
      );
      if (avgScoreMatch) {
        averageScore = parseFloat(avgScoreMatch[1]);
        console.log('📊 Extracted dyslexia Average Score:', averageScore);
      }

      // Extract Completion Rate - look for "completion rate was X%" or "rate was X%" or "The completion rate was X%"
      const completionRateMatch = summarySection.match(
        /(?:The completion rate was|completion rate was|rate was)\s*([\d.]+)%/i
      );
      if (completionRateMatch) {
        completionRate = parseFloat(completionRateMatch[1]);
        console.log('📊 Extracted dyslexia Completion Rate:', completionRate);
      }

      // If metrics are still not found, try more flexible patterns
      if (!totalScore) {
        const totalScoreMatch2 = summarySection.match(/(\d+)\s*(?:total score|score)/i);
        if (totalScoreMatch2) {
          totalScore = parseInt(totalScoreMatch2[1]);
          console.log('📊 Extracted dyslexia Total Score (flexible):', totalScore);
        }
      }

      if (!averageScore) {
        const avgScoreMatch2 = summarySection.match(/(\d+\.?\d*)\s*(?:average score|average)/i);
        if (avgScoreMatch2) {
          averageScore = parseFloat(avgScoreMatch2[1]);
          console.log('📊 Extracted dyslexia Average Score (flexible):', averageScore);
        }
      }

      if (!completionRate) {
        const completionRateMatch2 = summarySection.match(
          /(\d+\.?\d*)%\s*(?:completion rate|rate)/i
        );
        if (completionRateMatch2) {
          completionRate = parseFloat(completionRateMatch2[1]);
          console.log('📊 Extracted dyslexia Completion Rate (flexible):', completionRate);
        }
      }

      // Calculate metrics from game performances as fallback if regex extraction failed
      if (!totalScore && gamePerformances.length > 0) {
        totalScore = gamePerformances.reduce((sum, game) => sum + (game.score || 0), 0);
        console.log('📊 Calculated dyslexia Total Score from game performances:', totalScore);
      }

      if (!averageScore && gamePerformances.length > 0) {
        averageScore = totalScore / gamePerformances.length;
        console.log('📊 Calculated dyslexia Average Score from game performances:', averageScore);
      }

      if (!completionRate && gamePerformances.length > 0) {
        completionRate = 100; // Assume 100% if all games have data
        console.log('📊 Set dyslexia Completion Rate to 100% (all games completed)');
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

      // Ensure accuracy is within reasonable bounds
      const normalizedAccuracy = Math.min(Math.max(accuracy, 0), 100);

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
      labels: games.map(g => g.gameName.split(' ').slice(0, 2).join(' ')),
      datasets: [
        {
          label: 'Score',
          data: games.map(g => g.score),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 3,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Accuracy (%)',
          data: games.map(g => Math.min(g.accuracy * 100, 100)),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 3,
          borderRadius: 6,
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

      if (relevantGames.length === 0) return 60;

      const avgScore =
        relevantGames.reduce((sum, game) => {
          const score = Math.min(game.accuracy * 100, 100);
          return sum + score;
        }, 0) / relevantGames.length;

      return Math.min(100, Math.max(20, avgScore));
    });

    return {
      labels: skillCategories,
      datasets: [
        {
          label: 'Skill Performance',
          data: skillScores,
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 8,
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

    // Use suiteType from reportData if available, fallback to 'dyslexia'
    const suiteType = reportData.suiteType || 'dyslexia';
    const reportContent = generateReportText();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suiteType}-assessment-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully!');
  };

  const generateReportText = () => {
    let reportText = '';

    // Use suiteType from reportData if available, fallback to assessmentType or 'dyslexia'
    const suiteType = reportData?.suiteType || assessmentType || 'dyslexia';

    // Use the actual report title from the backend instead of hardcoding
    if (reportData?.content?.title) {
      reportText += `${reportData.content.title.toUpperCase()}\n`;
    } else {
      // Fallback to assessment type-based title
      if (suiteType === 'adhd') {
        reportText += `ADHD ASSESSMENT REPORT\n`;
      } else if (suiteType === 'dyslexia') {
        reportText += `DYSLEXIA ASSESSMENT REPORT\n`;
      } else {
        reportText += `${suiteType.toUpperCase()} ASSESSMENT REPORT\n`;
      }
    }
    reportText += `Generated on: ${new Date().toLocaleDateString()}\n`;
    reportText += `==========================================\n\n`;

    // Add executive summary with clean formatting
    const summarySection = reportData.sections?.find(s => s.heading === 'Executive Summary');
    if (summarySection) {
      reportText += `EXECUTIVE SUMMARY\n`;
      reportText += `=================\n`;
      // Remove HTML/markdown formatting
      const cleanContent = summarySection.content
        .replace(/<[^>]+>/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/- /g, '• ');
      reportText += `${cleanContent}\n\n`;
    }

    // Add performance metrics
    if (reportData.performanceData) {
      reportText += `PERFORMANCE METRICS\n`;
      reportText += `==================\n`;
      const totalScore = reportData.performanceData.totalScore || 0;
      const averageScore = reportData.performanceData.averageScore || 0;
      const completionRate = reportData.performanceData.completionRate || 0;
      const totalGames = reportData.performanceData.totalGames || 0;

      reportText += `Total Score: ${totalScore}\n`;
      reportText += `Average Score: ${averageScore.toFixed(1)}\n`;
      reportText += `Completion Rate: ${completionRate.toFixed(1)}%\n`;
      reportText += `Games Completed: ${totalGames}\n\n`;
    }

    // Add game-by-game analysis
    if (reportData.performanceData?.gamePerformances) {
      reportText += `GAME-BY-GAME ANALYSIS\n`;
      reportText += `=====================\n`;
      reportData.performanceData.gamePerformances.forEach((game, index) => {
        const gameName = game.gameName || game.gameId || `Game ${index + 1}`;
        const score = game.score || 0;
        const accuracy = game.accuracy || 0;
        const performance = game.performance || 'fair';

        reportText += `${index + 1}. ${gameName}\n`;
        reportText += `   Score: ${score}\n`;
        reportText += `   Accuracy: ${(accuracy * 100).toFixed(1)}%\n`;
        reportText += `   Performance: ${performance.toUpperCase()}\n\n`;
      });
    }

    // Add insights
    if (reportData.insights?.length > 0) {
      reportText += `KEY INSIGHTS\n`;
      reportText += `=============`;
      reportData.insights.forEach(insight => {
        reportText += `\n• ${insight}`;
      });
      reportText += '\n\n';
    }

    // Add recommendations
    if (reportData.recommendations?.length > 0) {
      reportText += `RECOMMENDATIONS\n`;
      reportText += `===============`;
      reportData.recommendations.forEach(rec => {
        reportText += `\n• ${rec}`;
      });
      reportText += '\n\n';
    }

    // Add other sections with clean formatting
    reportData.sections?.forEach(section => {
      if (!['Executive Summary', 'Game-by-Game Analysis'].includes(section.heading)) {
        reportText += `${section.heading.toUpperCase()}\n`;
        reportText += `${'='.repeat(section.heading.length)}\n`;
        const cleanContent = section.content
          .replace(/<[^>]+>/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/- /g, '• ')
          .replace(/\d+\. /g, '• ');
        reportText += `${cleanContent}\n\n`;
      }
    });

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

  // ADHD report parser
  const parseAdhdReportData = rawData => {
    if (!rawData) return null;

    // Use performance data directly from backend if available
    if (rawData.performanceData && rawData.performanceData.gamePerformances) {
      console.log(
        '🎯 Processing ADHD game performances:',
        rawData.performanceData.gamePerformances
      );

      // Ensure game performances have proper structure and remove duplicates
      const processedGames = rawData.performanceData.gamePerformances.map(game => {
        // Get proper game name from gameId
        const getGameName = gameId => {
          const gameNames = {
            'focus-finder': 'Focus Finder',
            'hyper-hop': 'Hyper Hop',
            'impulse-freeze': 'Impulse Freeze',
            'memory-trail': 'Memory Trail',
            'sound-shift': 'Sound Shift',
            'task-twister': 'Task Twister',
            'task-twister-enhanced': 'Task Twister Enhanced',
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
        console.log('🎮 Processed ADHD game:', processedGame);
        return processedGame;
      });

      // Remove duplicates based on gameId and gameName
      const uniqueGames = processedGames.filter((game, index, self) => {
        const firstIndex = self.findIndex(
          g => g.gameId === game.gameId || g.gameName === game.gameName
        );
        return firstIndex === index;
      });

      console.log('🎮 Unique ADHD games after deduplication:', uniqueGames.length);
      const gamePerformances = uniqueGames;

      // Extract metrics from Executive Summary if not available in performanceData
      let totalScore = rawData.performanceData.totalScore;
      let averageScore = rawData.performanceData.averageScore;
      let completionRate = rawData.performanceData.completionRate;

      // Always try to extract from report content for ADHD reports
      const summarySection =
        rawData.sections?.find(s => s.heading === 'Executive Summary')?.content || '';
      console.log('📊 Extracting ADHD metrics from Executive Summary:', summarySection);
      console.log('📊 Executive Summary length:', summarySection.length);
      console.log('📊 Executive Summary first 200 chars:', summarySection.substring(0, 200));

      // Extract Total Score - look for "total score of X" or "score of X" or "demonstrated a total score of X"
      const totalScoreMatch = summarySection.match(
        /(?:demonstrated a total score of|total score of|score of)\s*(\d+)/i
      );
      if (totalScoreMatch) {
        totalScore = parseInt(totalScoreMatch[1]);
        console.log('📊 Extracted ADHD Total Score:', totalScore);
      }

      // Extract Average Score - look for "average score of X" or "average of X" or "with an average score of X"
      const avgScoreMatch = summarySection.match(
        /(?:with an average score of|average score of|average of)\s*([\d.]+)/i
      );
      if (avgScoreMatch) {
        averageScore = parseFloat(avgScoreMatch[1]);
        console.log('📊 Extracted ADHD Average Score:', averageScore);
      }

      // Extract Completion Rate - look for "completion rate was X%" or "rate was X%" or "The completion rate was X%"
      const completionRateMatch = summarySection.match(
        /(?:The completion rate was|completion rate was|rate was)\s*([\d.]+)%/i
      );
      if (completionRateMatch) {
        completionRate = parseFloat(completionRateMatch[1]);
        console.log('📊 Extracted ADHD Completion Rate:', completionRate);
      }

      // If metrics are still not found, try more flexible patterns
      if (!totalScore) {
        const totalScoreMatch2 = summarySection.match(/(\d+)\s*(?:total score|score)/i);
        if (totalScoreMatch2) {
          totalScore = parseInt(totalScoreMatch2[1]);
          console.log('📊 Extracted ADHD Total Score (flexible):', totalScore);
        }
      }

      if (!averageScore) {
        const avgScoreMatch2 = summarySection.match(/(\d+\.?\d*)\s*(?:average score|average)/i);
        if (avgScoreMatch2) {
          averageScore = parseFloat(avgScoreMatch2[1]);
          console.log('📊 Extracted ADHD Average Score (flexible):', averageScore);
        }
      }

      if (!completionRate) {
        const completionRateMatch2 = summarySection.match(
          /(\d+\.?\d*)%\s*(?:completion rate|rate)/i
        );
        if (completionRateMatch2) {
          completionRate = parseFloat(completionRateMatch2[1]);
          console.log('📊 Extracted ADHD Completion Rate (flexible):', completionRate);
        }
      }

      // Calculate metrics from game performances as fallback if regex extraction failed
      if (!totalScore && gamePerformances.length > 0) {
        totalScore = gamePerformances.reduce((sum, game) => sum + (game.score || 0), 0);
        console.log('📊 Calculated ADHD Total Score from game performances:', totalScore);
      }

      if (!averageScore && gamePerformances.length > 0) {
        averageScore = totalScore / gamePerformances.length;
        console.log('📊 Calculated ADHD Average Score from game performances:', averageScore);
      }

      if (!completionRate && gamePerformances.length > 0) {
        completionRate = 100; // Assume 100% if all games have data
        console.log('📊 Set ADHD Completion Rate to 100% (all games completed)');
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

      // Ensure accuracy is within reasonable bounds
      const normalizedAccuracy = Math.min(Math.max(accuracy, 0), 100);

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

  // Update handleViewReport to use the correct parser
  const handleViewReport = async suite => {
    try {
      if (suite.reportStatus?.reportId) {
        console.log('🔍 Loading report for suite:', suite.sessionId);
        const response = await api.get(`/api/assessment/reports/${suite.reportStatus.reportId}`);
        console.log('📄 Report response:', response.data);

        if (response.data.success) {
          console.log('✅ Setting report data:', response.data.data.report);
          console.log('📊 Performance data:', response.data.data.report.performanceData);
          console.log(
            '🎮 Game performances:',
            response.data.data.report.performanceData?.gamePerformances
          );

          const suiteType = suite.suiteType || response.data.data.report.suiteType || 'dyslexia';
          let parsedData;
          if (suiteType === 'adhd') {
            parsedData = parseAdhdReportData(response.data.data.report);
          } else {
            parsedData = parseDyslexiaReportData(response.data.data.report);
          }

          // Ensure the suite type is included in the parsed data
          parsedData.suiteType = suiteType;

          setReportData(parsedData);
          setShowReportModal(true);
          setActiveTab('overview');
          console.log('✅ Modal should now be visible');
          console.log('🔍 Final parsed data for title:', {
            contentTitle: parsedData?.content?.title,
            suiteType: parsedData?.suiteType,
            triggerAssessmentType: parsedData?.trigger?.assessmentType,
          });
        } else {
          toast.error('Failed to load report');
        }
      } else {
        toast.error('No report available for this suite');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    }
  };

  const getSuiteTypeIcon = suiteType => {
    switch (suiteType) {
      case 'adhd':
        return <CpuChipIcon className="h-6 w-6 text-blue-600" />;
      case 'dyslexia':
        return <BookOpenIcon className="h-6 w-6 text-green-600" />;
      default:
        return <TrophyIcon className="h-6 w-6 text-purple-600" />;
    }
  };

  const getSuiteTypeColor = suiteType => {
    switch (suiteType) {
      case 'adhd':
        return 'from-blue-500 to-indigo-600';
      case 'dyslexia':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-purple-500 to-pink-600';
    }
  };

  const formatDuration = (minutes, suiteType = 'adhd') => {
    if (!minutes || minutes === 0) return 'N/A';

    // Ensure duration is in minutes and reasonable
    let durationInMinutes = minutes;

    // If duration is extremely large, it might be in milliseconds
    if (minutes > 1000000) {
      durationInMinutes = Math.round(minutes / (1000 * 60));
    }
    // If duration is very large, it might be in seconds
    else if (minutes > 1440) {
      durationInMinutes = Math.round(minutes / 60);
    }

    // Cap at reasonable maximum
    const maxDuration = suiteType === 'dyslexia' ? 85 : 65;
    if (durationInMinutes > maxDuration) {
      durationInMinutes = maxDuration;
    }

    const hours = Math.floor(durationInMinutes / 60);
    const mins = Math.round(durationInMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const getPerformanceLevel = (score, suiteType = 'adhd') => {
    // Different thresholds for different suite types
    if (suiteType === 'dyslexia') {
      // Dyslexia suite typically has 9 games, so scores range from 0-270 (9 * 30)
      if (score >= 240)
        return {
          level: 'Excellent',
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
        };
      if (score >= 210)
        return {
          level: 'Good',
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
        };
      if (score >= 180)
        return {
          level: 'Fair',
          color: 'text-yellow-600',
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-700',
        };
      return {
        level: 'Needs Support',
        color: 'text-red-600',
        bg: 'bg-red-100 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
      };
    } else {
      // ADHD suite has 7 games, so scores range from 0-210 (7 * 30)
      if (score >= 190)
        return {
          level: 'Excellent',
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
        };
      if (score >= 180)
        return {
          level: 'Good',
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
        };
      if (score >= 160)
        return {
          level: 'Fair',
          color: 'text-yellow-600',
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-700',
        };
      return {
        level: 'Needs Support',
        color: 'text-red-600',
        bg: 'bg-red-100 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
      };
    }
  };

  const getTrendIcon = (currentScore, previousScore) => {
    if (currentScore > previousScore) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else if (currentScore < previousScore) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    } else {
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper function to generate proper assessment title
  const getAssessmentTitle = reportData => {
    console.log('🔍 Debugging title generation:', {
      contentTitle: reportData?.content?.title,
      suiteType: reportData?.suiteType,
      fullReportData: reportData,
    });

    // First try to use the title from the backend
    if (reportData?.content?.title) {
      console.log('✅ Using content title:', reportData.content.title);
      return reportData.content.title;
    }

    // Fallback to suite type
    if (reportData?.suiteType) {
      const suiteType = reportData.suiteType;
      const capitalizedType = suiteType.charAt(0).toUpperCase() + suiteType.slice(1);
      const generatedTitle = `${capitalizedType} Assessment Report`;
      console.log('✅ Using suite type title:', generatedTitle);
      return generatedTitle;
    }

    // Try to get suite type from the original suite data
    if (reportData?.trigger?.assessmentType) {
      const assessmentType = reportData.trigger.assessmentType;
      const capitalizedType = assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1);
      const generatedTitle = `${capitalizedType} Assessment Report`;
      console.log('✅ Using trigger assessment type title:', generatedTitle);
      return generatedTitle;
    }

    // Final fallback
    console.log('⚠️ Using fallback title: Assessment Report');
    return 'Assessment Report';
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 glass-text-secondary text-lg">Loading suite history...</span>
        </div>
      </div>
    );
  }

  if (filteredSuites.length === 0) {
    const getEmptyStateMessage = () => {
      if (filterType === 'adhd') {
        return {
          title: 'No ADHD Progressive Suites Completed Yet',
          description:
            'Complete an ADHD progressive assessment suite to see your detailed attention and focus results here!',
          icon: '🧠',
          color: 'from-blue-500 to-indigo-600',
          benefits: [
            '• Attention span analysis',
            '• Focus and concentration insights',
            '• Executive function assessment',
            '• Behavioral recommendations',
          ],
        };
      } else if (filterType === 'dyslexia') {
        return {
          title: 'No Dyslexia Progressive Suites Completed Yet',
          description:
            'Complete a dyslexia progressive assessment suite to see your detailed reading and language results here!',
          icon: '📚',
          color: 'from-green-500 to-emerald-600',
          benefits: [
            '• Reading skill analysis',
            '• Phonological processing insights',
            '• Language development assessment',
            '• Literacy recommendations',
          ],
        };
      } else {
        return {
          title: 'No Progressive Suites Completed Yet',
          description: 'Complete a progressive assessment suite to see your detailed results here!',
          icon: '🎮',
          color: 'from-blue-500 to-indigo-600',
          benefits: [
            '• Comprehensive behavioral analysis',
            '• Game-by-game performance insights',
            '• Personalized recommendations',
            '• Progress tracking over time',
          ],
        };
      }
    };

    const emptyState = getEmptyStateMessage();

    return (
      <div className="glass-card">
        <div className="text-center py-12">
          <div className="text-8xl mb-6 glass-float">{emptyState.icon}</div>
          <h3 className="text-2xl font-bold glass-text-primary mb-4">{emptyState.title}</h3>
          <p className="glass-text-secondary mb-8 text-lg max-w-2xl mx-auto">
            {emptyState.description}
          </p>
          <div className={`glass-card glass-gradient-blue p-6 mb-8 text-white`}>
            <h4 className="font-semibold mb-4 text-xl">What you'll get:</h4>
            <ul className="space-y-2 text-left max-w-md mx-auto">
              {emptyState.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-6">
            <h4 className="font-semibold glass-text-primary mb-4 text-lg">
              Assessment Types Available:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="glass-stats text-center">
                <div className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                  ADHD Suite
                </div>
                <div className="text-sm glass-text-secondary">Attention & Focus (7 games)</div>
              </div>
              <div className="glass-stats text-center">
                <div className="text-green-600 dark:text-green-400 font-semibold text-lg">
                  Dyslexia Suite
                </div>
                <div className="text-sm glass-text-secondary">Reading & Language (9 games)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-header">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold glass-text-primary mb-2">
              Progressive Suite History
            </h2>
            <p className="glass-text-secondary">
              Track your child's cognitive development through comprehensive game-based assessments
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold glass-text-primary">{filteredSuites.length}</div>
            <div className="text-sm glass-text-secondary">
              suite{filteredSuites.length !== 1 ? 's' : ''} completed
            </div>
            <div className="text-xs glass-text-secondary mt-1">
              Latest:{' '}
              {filteredSuites[0]?.completedAt
                ? new Date(filteredSuites[0].completedAt).toLocaleDateString()
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {/* Only show filter controls if assessmentType is not set or is 'all' */}
      {(!assessmentType || assessmentType === 'all') && (
        <div className="glass-nav">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold glass-text-primary">Filter by type:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`glass-filter px-4 py-2 text-sm font-medium ${
                    filterType === 'all' ? 'active' : ''
                  }`}
                >
                  All ({suiteHistory.length})
                </button>
                <button
                  onClick={() => setFilterType('adhd')}
                  className={`glass-filter px-4 py-2 text-sm font-medium ${
                    filterType === 'adhd' ? 'active' : ''
                  }`}
                >
                  ADHD ({adhdStats?.count || 0})
                </button>
                <button
                  onClick={() => setFilterType('dyslexia')}
                  className={`glass-filter px-4 py-2 text-sm font-medium ${
                    filterType === 'dyslexia' ? 'active' : ''
                  }`}
                >
                  Dyslexia ({dyslexiaStats?.count || 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suite Type Statistics */}
      {(adhdStats || dyslexiaStats) && (
        <div className="space-y-8">
          {/* Only show ADHD stats if assessmentType is not set, is 'all', or is 'adhd' */}
          {adhdStats &&
            (!assessmentType || assessmentType === 'all' || assessmentType === 'adhd') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-stats-large glass-gradient-blue"
              >
                <div className="flex items-center mb-6">
                  <div className="glass-icon mr-4">
                    <CpuChipIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold glass-text-primary text-2xl">ADHD Suite Statistics</h3>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {adhdStats.avgScore}
                    </div>
                    <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                      Avg Score
                    </div>
                  </div>
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {adhdStats.avgDuration}m
                    </div>
                    <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                      Avg Duration
                    </div>
                  </div>
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {adhdStats.avgAccuracy}%
                    </div>
                    <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                      Avg Accuracy
                    </div>
                  </div>
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {adhdStats.count}
                    </div>
                    <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                      Sessions
                    </div>
                  </div>
                </div>
                <div className="text-base text-blue-600 dark:text-blue-400 mt-6 text-center font-medium">
                  Latest: {adhdStats.latestDate}
                </div>
              </motion.div>
            )}

          {/* Only show Dyslexia stats if assessmentType is not set, is 'all', or is 'dyslexia' */}
          {dyslexiaStats &&
            (!assessmentType || assessmentType === 'all' || assessmentType === 'dyslexia') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-stats-large glass-gradient-green"
              >
                <div className="flex items-center mb-6">
                  <div className="glass-icon mr-4">
                    <BookOpenIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-bold glass-text-primary text-2xl">
                    Dyslexia Suite Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {dyslexiaStats.avgScore}
                    </div>
                    <div className="text-lg text-green-700 dark:text-green-300 font-medium">
                      Avg Score
                    </div>
                  </div>
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {dyslexiaStats.avgDuration}m
                    </div>
                    <div className="text-lg text-green-700 dark:text-green-300 font-medium">
                      Avg Duration
                    </div>
                  </div>
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {dyslexiaStats.avgAccuracy}%
                    </div>
                    <div className="text-lg text-green-700 dark:text-green-300 font-medium">
                      Avg Accuracy
                    </div>
                  </div>
                  <div className="glass-stats text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {dyslexiaStats.count}
                    </div>
                    <div className="text-lg text-green-700 dark:text-green-300 font-medium">
                      Sessions
                    </div>
                  </div>
                </div>
                <div className="text-base text-green-600 dark:text-green-400 mt-6 text-center font-medium">
                  Latest: {dyslexiaStats.latestDate}
                </div>
              </motion.div>
            )}
        </div>
      )}

      {/* Summary Statistics */}
      {filteredSuites.length > 0 && (
        <div className="glass-stats-large">
          <h3 className="text-2xl font-bold glass-text-primary mb-6">Overall Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="glass-stats text-center glass-gradient-blue">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                {Math.round(
                  filteredSuites.reduce((sum, suite) => sum + (suite.totalScore || 0), 0) /
                    filteredSuites.length
                )}
              </div>
              <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                Avg Total Score
              </div>
            </div>
            <div className="glass-stats text-center glass-gradient-green">
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-3">
                {Math.round(
                  filteredSuites.reduce((sum, suite) => sum + (suite.totalDuration || 0), 0) /
                    filteredSuites.length
                )}
                m
              </div>
              <div className="text-lg text-green-700 dark:text-green-300 font-medium">
                Avg Duration
              </div>
            </div>
            <div className="glass-stats text-center glass-gradient-purple">
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                {Math.round(
                  filteredSuites.reduce(
                    (sum, suite) => sum + (suite.summaryMetrics?.averageAccuracy || 0),
                    0
                  ) / filteredSuites.length
                )}
                %
              </div>
              <div className="text-lg text-purple-700 dark:text-purple-300 font-medium">
                Avg Accuracy
              </div>
            </div>
            <div className="glass-stats text-center glass-gradient-orange">
              <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-3">
                {filteredSuites.filter(suite => suite.reportStatus?.generated).length}
              </div>
              <div className="text-lg text-orange-700 dark:text-orange-300 font-medium">
                Reports Ready
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suite History Cards */}
      <div className="space-y-6">
        {filteredSuites.map((suite, index) => (
          <motion.div
            key={suite.sessionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Suite Header */}
            <div
              className={`bg-gradient-to-r ${getSuiteTypeColor(suite.suiteType)} p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {getSuiteTypeIcon(suite.suiteType)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {suite.suiteType?.toUpperCase() || 'ADHD'} Progressive Suite
                    </h3>
                    <p className="text-white/80">
                      {suite.suiteType === 'dyslexia'
                        ? 'Reading, language, and phonological processing assessment'
                        : 'Attention, focus, and executive function assessment'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {suite.totalScore || suite.summaryMetrics?.totalScore || 'N/A'}
                  </div>
                  <div className="text-white/80">Total Score</div>
                  <div
                    className={`text-sm px-3 py-1 rounded-full mt-2 font-medium bg-white/20 ${getPerformanceLevel(suite.totalScore || suite.summaryMetrics?.totalScore || 0, suite.suiteType).color}`}
                  >
                    {
                      getPerformanceLevel(
                        suite.totalScore || suite.summaryMetrics?.totalScore || 0,
                        suite.suiteType
                      ).level
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Suite Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-stats text-center">
                  <div className="text-2xl font-bold glass-text-primary">
                    {suite.averageScore
                      ? suite.averageScore.toFixed(1)
                      : suite.summaryMetrics?.averageScore?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm glass-text-secondary">Average Score</div>
                  <div className="text-xs glass-text-secondary mt-1">Per Game</div>
                </div>
                <div className="glass-stats text-center">
                  <div className="text-2xl font-bold glass-text-primary">
                    {suite.summaryMetrics?.averageAccuracy
                      ? suite.summaryMetrics.averageAccuracy > 1
                        ? suite.summaryMetrics.averageAccuracy.toFixed(1) + '%'
                        : (suite.summaryMetrics.averageAccuracy * 100).toFixed(1) + '%'
                      : 'N/A'}
                  </div>
                  <div className="text-sm glass-text-secondary">Accuracy Rate</div>
                  <div className="text-xs glass-text-secondary mt-1">Task Completion</div>
                </div>
                <div className="glass-stats text-center">
                  <div className="text-2xl font-bold glass-text-primary">
                    {suite.summaryMetrics?.completionRate
                      ? suite.summaryMetrics.completionRate.toFixed(1) + '%'
                      : 'N/A'}
                  </div>
                  <div className="text-sm glass-text-secondary">Suite Completion</div>
                  <div className="text-xs glass-text-secondary mt-1">All Games Done</div>
                </div>
                <div className="glass-stats text-center">
                  <div className="text-2xl font-bold glass-text-primary">
                    {suite.completedGames || suite.summaryMetrics?.gamesCompleted || 'N/A'}
                  </div>
                  <div className="text-sm glass-text-secondary">Games Completed</div>
                  <div className="text-xs glass-text-secondary mt-1">
                    Out of {suite.totalGames || (suite.suiteType === 'dyslexia' ? 9 : 7)}
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="glass-card glass-gradient-blue p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="glass-icon">
                      <TrophyIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="glass-text-primary font-semibold">Performance Insights</span>
                  </div>
                  <div className="text-sm glass-text-secondary">
                    {suite.suiteType === 'adhd'
                      ? 'ADHD Assessment'
                      : suite.suiteType === 'dyslexia'
                        ? 'Dyslexia Assessment'
                        : 'Cognitive Assessment'}
                  </div>
                </div>
                <div className="text-sm glass-text-secondary mb-3">
                  {suite.suiteType === 'dyslexia' ? (
                    // Dyslexia-specific insights
                    suite.totalScore >= 240 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        🎯 Excellent reading and language processing skills across all domains
                      </span>
                    ) : suite.totalScore >= 210 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        ✅ Good reading skills with some areas for improvement
                      </span>
                    ) : suite.totalScore >= 180 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        ⚠️ Fair reading performance, consider targeted literacy support
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        🔍 Reading difficulties detected, recommend professional assessment
                      </span>
                    )
                  ) : // ADHD-specific insights
                  suite.totalScore >= 190 ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      🎯 Excellent performance across all cognitive domains
                    </span>
                  ) : suite.totalScore >= 180 ? (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      ✅ Good performance with room for improvement
                    </span>
                  ) : suite.totalScore >= 160 ? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      ⚠️ Fair performance, consider targeted interventions
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      🔍 Needs support, recommend professional consultation
                    </span>
                  )}
                </div>
                {/* Progress Trend */}
                {filteredSuites.length > 1 && (
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="glass-text-secondary">Progress Trend:</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(suite.totalScore, filteredSuites[1]?.totalScore || 0)}
                      <span
                        className={`font-medium ${
                          suite.totalScore > (filteredSuites[1]?.totalScore || 0)
                            ? 'text-green-600 dark:text-green-400'
                            : suite.totalScore < (filteredSuites[1]?.totalScore || 0)
                              ? 'text-red-600 dark:text-red-400'
                              : 'glass-text-secondary'
                        }`}
                      >
                        {suite.totalScore > (filteredSuites[1]?.totalScore || 0)
                          ? 'Improving'
                          : suite.totalScore < (filteredSuites[1]?.totalScore || 0)
                            ? 'Declining'
                            : 'Stable'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suite Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center text-sm glass-text-secondary">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(suite.completedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm glass-text-secondary">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDuration(suite.totalDuration, suite.suiteType)} of games
                  </div>
                  <div className="flex items-center text-sm glass-text-secondary">
                    <TrophyIcon className="h-4 w-4 mr-1" />
                    {suite.completedGames} of{' '}
                    {suite.totalGames || (suite.suiteType === 'dyslexia' ? 9 : 7)} games
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {suite.reportStatus?.generated ? (
                    <div className="glass-badge flex items-center text-green-600 dark:text-green-400 text-sm">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Report Ready
                    </div>
                  ) : (
                    <div className="glass-badge flex items-center text-gray-500 dark:text-gray-400 text-sm">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Report Pending
                    </div>
                  )}
                  {suite.reportStatus?.emailSent && (
                    <div className="glass-badge flex items-center text-blue-600 dark:text-blue-400 text-sm">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Email Sent
                    </div>
                  )}
                  <button
                    onClick={() => handleViewReport(suite)}
                    disabled={!suite.reportStatus?.generated}
                    className={`px-6 py-2 text-sm font-medium flex items-center space-x-2 rounded-xl transition-all duration-300 ${
                      suite.reportStatus?.generated
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 shadow-lg border border-green-500 hover:shadow-xl transform hover:-translate-y-1'
                        : 'text-gray-700 dark:text-gray-400 cursor-not-allowed bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Report Modal - Full Page */}
      <AnimatePresence>
        {showReportModal && reportData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Header with Download Button */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-xl">
                      <BookOpenIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getAssessmentTitle(reportData)}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Comprehensive behavioral analysis and performance insights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={downloadReport}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
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
                          {reportData.sections
                            .find(s => s.heading === 'Executive Summary')
                            .content.replace(/\*\*(.*?)\*\*/g, '$1')
                            .replace(/\*(.*?)\*/g, '$1')
                            .replace(/- /g, '• ')
                            .split('\n')
                            .map((line, index) => (
                              <p key={index} className="mb-3">
                                {line}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Key Metrics Cards */}
                    {reportData.performanceData && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                              {reportData.performanceData.totalScore || 'N/A'}
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
                              {reportData.performanceData.averageScore?.toFixed(1) || 'N/A'}
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
                              {reportData.performanceData.completionRate?.toFixed(1) || 'N/A'}%
                            </div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              Completion Rate
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Assessment Progress
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-700">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                              {reportData.performanceData.totalGames || 'N/A'}
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
                {activeTab === 'games' && reportData.performanceData && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reportData.performanceData.gamePerformances?.map((game, index) => {
                        const GameIcon = getGameIcon(game.gameId);
                        const progressWidth = Math.min(game.accuracy * 100, 100); // Cap at 100%
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
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Score
                                  </div>
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
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${progressWidth}%` }}
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
                {activeTab === 'charts' && reportData.performanceData && (
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
                              {section.content
                                .replace(/\*\*(.*?)\*\*/g, '$1')
                                .replace(/\*(.*?)\*/g, '$1')
                                .replace(/- /g, '• ')
                                .replace(/\d+\. /g, '• ')
                                .split('\n')
                                .map((line, index) => (
                                  <p key={index} className="mb-3">
                                    {line}
                                  </p>
                                ))}
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuiteHistorySection;
