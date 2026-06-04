import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
  EyeIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AssessmentService from '../../../services/AssessmentService';
import SuiteHistorySection from './SuiteHistorySection';

const GameHistorySection = ({ childId, childData, assessmentType = 'all' }) => {
  const [gameHistory, setGameHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (childId) {
      fetchGameHistory();
    }
  }, [childId]);

  // Listen for game completion events to refresh data
  useEffect(() => {
    const handleGameCompleted = event => {
      console.log('🎮 Game completed event received:', event.detail);

      // Refresh game history if the completed game is for the current child
      if (event.detail.childId === childId) {
        const gameTitle = event.detail.gameId?.replace(/-/g, ' ').toUpperCase() || 'GAME';

        // Show success notification
        toast.success(`🎉 ${gameTitle} completed successfully!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: 'white',
            border: '2px solid #059669',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          },
        });

        console.log('🔄 Refreshing game history for current child...');

        // Add a small delay to ensure backend has processed the data
        setTimeout(() => {
          fetchGameHistory();
        }, 1000);
      }
    };

    window.addEventListener('gameCompleted', handleGameCompleted);

    return () => {
      window.removeEventListener('gameCompleted', handleGameCompleted);
    };
  }, [childId]);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);

      // Try to fetch from API first
      try {
        const [gameResponse, suiteResponse] = await Promise.all([
          AssessmentService.getChildGamePerformance(childId),
          fetch(
            `${process.env.REACT_APP_API_URL}/api/assessment/suite-results?childId=${childId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          )
            .then(res => res.json())
            .catch(() => ({ suiteResults: [] })),
        ]);

        if (gameResponse.success) {
          const combinedData = {
            ...gameResponse.data,
            suiteResults: suiteResponse.suiteResults || [],
          };

          console.log('✅ Raw API response:', gameResponse.data);
          console.log('✅ Combined game history data:', combinedData);
          console.log('✅ Game performances:', combinedData.gamePerformances);
          console.log(
            '✅ Sound-shift specific data:',
            combinedData.gamePerformances?.['sound-shift']
          );

          setGameHistory(combinedData);
          return;
        }
      } catch (apiError) {
        console.warn('API failed, falling back to local storage:', apiError);
      }

      // Fallback to local storage data
      console.log('📁 Loading game history from local storage...');
      console.log('📁 Assessment type:', assessmentType);

      let localData = {};

      if (assessmentType === 'all') {
        // Load both ADHD and dyslexia data for 'all' view
        const adhdKey = `adhd_games_performance_${childId}`;
        const dyslexiaKey = `dyslexia_games_performance_${childId}`;

        const adhdData = JSON.parse(localStorage.getItem(adhdKey) || '{}');
        const dyslexiaData = JSON.parse(localStorage.getItem(dyslexiaKey) || '{}');

        // Merge both datasets
        localData = { ...adhdData, ...dyslexiaData };

        console.log('📁 Loading all data - ADHD:', adhdData, 'Dyslexia:', dyslexiaData);
      } else if (assessmentType.toLowerCase() === 'adhd') {
        // Load only ADHD data
        const adhdKey = `adhd_games_performance_${childId}`;
        localData = JSON.parse(localStorage.getItem(adhdKey) || '{}');
        console.log('📁 Loading ADHD data only:', localData);
      } else if (assessmentType.toLowerCase() === 'dyslexia') {
        // Load only dyslexia data
        const dyslexiaKey = `dyslexia_games_performance_${childId}`;
        localData = JSON.parse(localStorage.getItem(dyslexiaKey) || '{}');
        console.log('📁 Loading dyslexia data only:', localData);
      }

      if (Object.keys(localData).length > 0) {
        // Transform local storage data to match API format
        const transformedData = {
          gamePerformances: localData,
          suiteResults: [],
        };

        console.log('✅ Local storage raw data:', localData);
        console.log('✅ Transformed local data:', transformedData);

        setGameHistory(transformedData);
      } else {
        console.log('ℹ️ No game history found in local storage');
        setGameHistory({ gamePerformances: {}, suiteResults: [] });
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
      setGameHistory({});
    } finally {
      setLoading(false);
    }
  };

  const getGameDisplayInfo = gameId => {
    const gameInfo = {
      // ADHD Games
      'focus-finder': {
        title: 'Focus Finder',
        category: 'ADHD',
        icon: '🔍',
        color: 'from-blue-500 to-indigo-600',
        description: 'Visual attention and focus training',
      },
      'impulse-freeze': {
        title: 'Impulse Freeze',
        category: 'ADHD',
        icon: '🛑',
        color: 'from-red-500 to-pink-600',
        description: 'Self-control and response inhibition',
      },
      'memory-trail': {
        title: 'Memory Trail',
        category: 'ADHD',
        icon: '🧠',
        color: 'from-purple-500 to-pink-600',
        description: 'Working memory enhancement',
      },
      'hyper-hop': {
        title: 'Hyper Hop',
        category: 'ADHD',
        icon: '🦘',
        color: 'from-green-500 to-emerald-600',
        description: 'Motor control and movement regulation',
      },
      'task-twister': {
        title: 'Task Twister',
        category: 'ADHD',
        icon: '🔄',
        color: 'from-yellow-500 to-orange-600',
        description: 'Multi-step instruction following',
      },
      'task-twister-enhanced': {
        title: 'Task Twister',
        category: 'ADHD',
        icon: '🎯',
        color: 'from-purple-500 to-pink-600',
        description: 'Multi-modal interaction training',
      },
      'sound-shift': {
        title: 'Sound Shift',
        category: 'ADHD',
        icon: '🎵',
        color: 'from-indigo-500 to-blue-600',
        description: 'Auditory attention and distraction filtering',
        difficulty: 'Medium',
      },
      'time-turtle': {
        title: 'Time Turtle',
        category: 'ADHD',
        icon: '⏰',
        color: 'from-orange-500 to-red-600',
        description: 'Time management skills',
      },

      // Dyslexia Games
      'letter-sound-matching': {
        title: 'Letter Sound Matching',
        category: 'Dyslexia',
        icon: '🔤',
        color: 'from-emerald-500 to-green-600',
        description: 'Letter-sound correspondence',
      },
      'memory-match': {
        title: 'Memory Match',
        category: 'Dyslexia',
        icon: '🧩',
        color: 'from-blue-500 to-cyan-600',
        description: 'Visual memory training',
      },
      'rhyming-pairs': {
        title: 'Rhyming Pairs',
        category: 'Dyslexia',
        icon: '🎵',
        color: 'from-pink-500 to-rose-600',
        description: 'Phonological awareness',
      },
      'word-completion': {
        title: 'Word Completion',
        category: 'Dyslexia',
        icon: '✏️',
        color: 'from-purple-500 to-violet-600',
        description: 'Vocabulary and spelling',
      },
      'syllable-clapper': {
        title: 'Syllable Clapper',
        category: 'Dyslexia',
        icon: '👏',
        color: 'from-yellow-500 to-amber-600',
        description: 'Syllable segmentation',
      },
      'visual-tracking-maze': {
        title: 'Visual Tracking Maze',
        category: 'Dyslexia',
        icon: '🧭',
        color: 'from-teal-500 to-cyan-600',
        description: 'Visual tracking skills',
      },
      'rapid-letter-naming': {
        title: 'Rapid Letter Naming',
        category: 'Dyslexia',
        icon: '⚡',
        color: 'from-red-500 to-orange-600',
        description: 'Letter naming fluency',
      },
      'mirror-letter-game': {
        title: 'Mirror Letter Game',
        category: 'Dyslexia',
        icon: '🪞',
        color: 'from-indigo-500 to-purple-600',
        description: 'Letter orientation training',
      },
      'spot-correct-word': {
        title: 'Spot Correct Word',
        category: 'Dyslexia',
        icon: '🎯',
        color: 'from-green-500 to-teal-600',
        description: 'Word recognition accuracy',
      },
      'word-sequence-builder': {
        title: 'Word Sequence Builder',
        category: 'Dyslexia',
        icon: '🔗',
        color: 'from-blue-500 to-indigo-600',
        description: 'Sequential processing',
      },
    };

    return (
      gameInfo[gameId] || {
        title: gameId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: 'Unknown',
        icon: '🎮',
        color: 'from-gray-500 to-gray-600',
        description: 'Game assessment',
      }
    );
  };

  const filterGamesByType = games => {
    console.log('🔍 Filtering games by type:', assessmentType);
    console.log('🔍 All games before filtering:', games);

    if (assessmentType === 'all') {
      console.log('🔍 No filtering needed, returning all games');
      return games;
    }

    const filteredGames = Object.keys(games)
      .filter(gameId => {
        const gameInfo = getGameDisplayInfo(gameId);
        const matches = gameInfo.category.toLowerCase() === assessmentType.toLowerCase();
        console.log(`🔍 Game ${gameId}: category=${gameInfo.category}, matches=${matches}`);
        return matches;
      })
      .reduce((filtered, gameId) => {
        filtered[gameId] = games[gameId];
        return filtered;
      }, {});

    console.log('🔍 Filtered games:', filteredGames);
    return filteredGames;
  };

  const calculateOverallStats = () => {
    const games = filterGamesByType(gameHistory.gamePerformances || {});
    const gameIds = Object.keys(games);

    console.log('📊 Calculating stats for assessment type:', assessmentType);
    console.log('📊 Calculating stats for games:', gameIds);
    console.log('📊 Games data:', games);

    if (gameIds.length === 0) {
      console.log('📊 No games found, returning default stats');
      return {
        totalGames: 0,
        totalSessions: 0,
        averageAccuracy: 0,
        averageScore: 0,
        strongestSkill: 'No data',
        improvementTrend: 'No data',
      };
    }

    const totalSessions = gameIds.reduce((sum, gameId) => {
      const playCount = games[gameId]?.playCount || 0;
      console.log(`📊 Game ${gameId} playCount:`, playCount);
      return sum + playCount;
    }, 0);

    // Calculate average accuracy with proper handling
    let validAccuracyGames = 0;
    const totalAccuracy = gameIds.reduce((sum, gameId) => {
      const gameData = games[gameId];
      if (!gameData) return sum;

      // Handle both accuracy formats (decimal and percentage)
      let accuracy = gameData.accuracy || gameData.averageAccuracy;

      // Skip if no valid accuracy data
      if (accuracy === null || accuracy === undefined) {
        console.log(`📊 Game ${gameId} has no accuracy data`);
        return sum;
      }

      validAccuracyGames++;

      // Normalize to percentage
      if (accuracy <= 1) {
        accuracy = accuracy * 100;
      }

      console.log(`📊 Game ${gameId} accuracy:`, accuracy);
      return sum + accuracy;
    }, 0);

    const avgAccuracy = validAccuracyGames > 0 ? totalAccuracy / validAccuracyGames : 0;

    // Calculate average score with proper handling
    let validScoreGames = 0;
    const totalScore = gameIds.reduce((sum, gameId) => {
      const gameData = games[gameId];
      if (!gameData) return sum;

      const score = gameData.bestScore || gameData.score;

      // Skip if no valid score data
      if (score === null || score === undefined || score === 0) {
        console.log(`📊 Game ${gameId} has no score data`);
        return sum;
      }

      validScoreGames++;
      console.log(`📊 Game ${gameId} score:`, score);
      return sum + score;
    }, 0);

    const avgScore = validScoreGames > 0 ? totalScore / validScoreGames : 0;

    // Find strongest skill based on accuracy
    let strongestGame = gameIds[0];
    let highestAccuracy = 0;

    gameIds.forEach(gameId => {
      const gameData = games[gameId];
      if (!gameData) return;

      let currentAccuracy = gameData.accuracy || gameData.averageAccuracy || 0;
      if (currentAccuracy <= 1) {
        currentAccuracy = currentAccuracy * 100;
      }

      if (currentAccuracy > highestAccuracy) {
        highestAccuracy = currentAccuracy;
        strongestGame = gameId;
      }
    });

    const stats = {
      totalGames: gameIds.length,
      totalSessions: Math.max(totalSessions, gameIds.length), // Ensure at least 1 session per game
      averageAccuracy: Math.round(avgAccuracy),
      averageScore: Math.round(avgScore),
      strongestSkill: strongestGame ? getGameDisplayInfo(strongestGame).title : 'No data',
      improvementTrend: 'Improving', // Simplified for now
    };

    console.log('📊 Calculated stats for', assessmentType, ':', stats);
    return stats;
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = dateString => {
    try {
      if (!dateString) return 'Never';

      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Invalid Date';
      }

      // Check if date is in the future (likely a timezone or format issue)
      const now = new Date();
      if (date > now) {
        console.warn('Future date detected:', dateString, 'Current date:', now);
        // Try to fix by using current date
        return format(now, 'MMM dd, yyyy');
      }

      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Unknown';
    }
  };

  const overallStats = calculateOverallStats();
  const filteredGames = filterGamesByType(gameHistory.gamePerformances || {});

  // Calculate correct patterns for Memory Trail game
  const calculateCorrectPatterns = game => {
    if (game.gameId === 'memory-trail') {
      // Try to get correct patterns from game-specific data
      if (game.gameSpecificData?.correctPatterns) {
        return game.gameSpecificData.correctPatterns;
      }

      // Fallback: calculate from sessions if available
      if (game.gameSpecificData?.sessions) {
        return game.gameSpecificData.sessions.reduce((total, session) => {
          return total + (session.gameSpecificData?.correctPatterns || 0);
        }, 0);
      }

      // Final fallback: use successful rounds if available
      if (game.gameSpecificData?.successfulRounds) {
        return game.gameSpecificData.successfulRounds;
      }

      return 0;
    }

    // For other games, return 0 or appropriate metric
    return 0;
  };

  // Get the appropriate label for the game
  const getGameLabel = game => {
    if (game.gameId === 'memory-trail') {
      return 'Correct Patterns';
    }
    if (game.gameId === 'hyper-hop') {
      return 'Correctly Hopped Rounds';
    }
    if (game.gameId === 'impulse-freeze') {
      return 'Correct Moves';
    }
    if (game.gameId === 'task-twister-enhanced') {
      return 'Correct Rounds';
    }
    if (game.gameId === 'word-sequence-builder') {
      return 'Correct Words';
    }
    if (game.gameId === 'rapid-letter-naming') {
      return 'Correct Letters';
    }
    return 'Distractions';
  };

  // Get the value for the game
  const getGameValue = game => {
    if (game.gameId === 'memory-trail') {
      return calculateCorrectPatterns(game);
    }
    if (game.gameId === 'hyper-hop') {
      return game.gameSpecificData?.correctlyHoppedRounds || 0;
    }
    if (game.gameId === 'impulse-freeze') {
      return game.gameSpecificData?.correctMoves || 0;
    }
    if (game.gameId === 'task-twister-enhanced') {
      return game.gameSpecificData?.correctRounds || 0;
    }
    if (game.gameId === 'word-sequence-builder') {
      return game.gameSpecificData?.correctWords || game.correctAnswers || 0;
    }
    if (game.gameId === 'rapid-letter-naming') {
      return game.gameSpecificData?.correctLetters || game.correctAnswers || 0;
    }
    return game.gameSpecificData?.distractionsClicked || 0;
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 glass-text-secondary">Loading game history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="glass-icon w-12 h-12 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold glass-text-primary">
              {childData?.firstName}'s Game History
            </h2>
            <p className="glass-text-secondary">
              {assessmentType === 'all'
                ? 'All Assessment Games'
                : `${assessmentType.toUpperCase()} Games`}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`glass-tab px-4 py-2 text-sm font-medium ${
              activeTab === 'overview' ? 'active' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`glass-tab px-4 py-2 text-sm font-medium ${
              activeTab === 'games' ? 'active' : ''
            }`}
          >
            Games
          </button>
          <button
            onClick={() => setActiveTab('suites')}
            className={`glass-tab px-4 py-2 text-sm font-medium ${
              activeTab === 'suites' ? 'active' : ''
            }`}
          >
            Suites
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Stats Cards */}
          <div className="glass-stats-large glass-gradient-blue">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-icon">
                <PlayIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold glass-text-primary">Games Played</h3>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">{overallStats.totalGames}</div>
            <div className="text-base text-blue-600/70 font-medium">
              {overallStats.totalSessions} total sessions
            </div>
          </div>

          <div className="glass-stats-large glass-gradient-green">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-icon">
                <TrophyIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold glass-text-primary">Accuracy</h3>
            </div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {overallStats.averageAccuracy}%
            </div>
            <div className="text-base text-green-600/70 font-medium">Average across all games</div>
          </div>

          <div className="glass-stats-large glass-gradient-purple">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-icon">
                <StarIcon className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold glass-text-primary">Score</h3>
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {overallStats.averageScore}
            </div>
            <div className="text-base text-purple-600/70 font-medium">Average performance</div>
          </div>

          <div className="glass-stats-large glass-gradient-orange">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-icon">
                <FireIcon className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold glass-text-primary">Strongest Skill</h3>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {overallStats.strongestSkill}
            </div>
            <div className="text-base text-orange-600/70 font-medium">Best performing game</div>
          </div>

          <div className="glass-stats-large glass-gradient-blue">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-icon">
                <ArrowTrendingUpIcon className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold glass-text-primary">Progress</h3>
            </div>
            <div className="text-2xl font-bold text-teal-600 mb-2">
              {overallStats.improvementTrend}
            </div>
            <div className="text-base text-teal-600/70 font-medium">Overall trend</div>
          </div>

          <div className="glass-stats-large glass-gradient-orange">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-icon">
                <CalendarDaysIcon className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold glass-text-primary">Last Activity</h3>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {gameHistory.lastPlayed ? formatDate(gameHistory.lastPlayed) : 'No games yet'}
            </div>
            <div className="text-base text-yellow-600/70 font-medium">Most recent session</div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <AcademicCapIcon className="w-8 h-8 text-primary" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Assessment Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Show separate summaries only when viewing 'all' */}
          {assessmentType === 'all' ? (
            <>
              {/* ADHD Games Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">ADHD Games</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Games Played:</span>
                    <span className="font-medium">
                      {
                        Object.keys(gameHistory.gamePerformances || {}).filter(
                          id => getGameDisplayInfo(id).category === 'ADHD'
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Accuracy:</span>
                    <span className="font-medium">
                      {(() => {
                        const adhdGames = Object.entries(gameHistory.gamePerformances || {}).filter(
                          ([id]) => getGameDisplayInfo(id).category === 'ADHD'
                        );
                        if (adhdGames.length === 0) return '0%';
                        const totalAccuracy = adhdGames.reduce((sum, [, game]) => {
                          let accuracy = game.accuracy || game.averageAccuracy || 0;
                          if (accuracy <= 1) accuracy = accuracy * 100;
                          return sum + accuracy;
                        }, 0);
                        return Math.round(totalAccuracy / adhdGames.length) + '%';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dyslexia Games Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/30 dark:border-green-700/30">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Dyslexia Games
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Games Played:</span>
                    <span className="font-medium">
                      {
                        Object.keys(gameHistory.gamePerformances || {}).filter(
                          id => getGameDisplayInfo(id).category === 'Dyslexia'
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Accuracy:</span>
                    <span className="font-medium">
                      {(() => {
                        const dyslexiaGames = Object.entries(
                          gameHistory.gamePerformances || {}
                        ).filter(([id]) => getGameDisplayInfo(id).category === 'Dyslexia');
                        if (dyslexiaGames.length === 0) return '0%';
                        const totalAccuracy = dyslexiaGames.reduce((sum, [, game]) => {
                          let accuracy = game.accuracy || game.averageAccuracy || 0;
                          if (accuracy <= 1) accuracy = accuracy * 100;
                          return sum + accuracy;
                        }, 0);
                        return Math.round(totalAccuracy / dyslexiaGames.length) + '%';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Show assessment-specific summary when viewing a specific type */
            <div
              className={`bg-gradient-to-r ${
                assessmentType.toLowerCase() === 'adhd'
                  ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/30 dark:border-blue-700/30'
                  : 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/30 dark:border-green-700/30'
              } rounded-xl p-4 border`}
            >
              <h4
                className={`font-semibold mb-2 ${
                  assessmentType.toLowerCase() === 'adhd'
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-green-900 dark:text-green-100'
                }`}
              >
                {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Assessment
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Games Available:</span>
                  <span className="font-medium">
                    {assessmentType.toLowerCase() === 'adhd' ? '8' : '11'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Games Played:</span>
                  <span className="font-medium">{overallStats.totalGames}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-medium">
                    {Math.round(
                      (overallStats.totalGames /
                        (assessmentType.toLowerCase() === 'adhd' ? 8 : 11)) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Overall Progress */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/30 dark:border-purple-700/30">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              {assessmentType === 'all'
                ? 'Overall Progress'
                : `${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Progress`}
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Games:</span>
                <span className="font-medium">{Object.keys(filteredGames).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sessions:</span>
                <span className="font-medium">{overallStats.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Accuracy:</span>
                <span className="font-medium">{overallStats.averageAccuracy}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="space-y-4">
          {Object.keys(filteredGames).length === 0 ? (
            <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl">
              <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No games played yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start playing games to see your progress here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(filteredGames).map(([gameId, gameData]) => {
                const gameInfo = getGameDisplayInfo(gameId);
                return (
                  <motion.div
                    key={gameId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 h-full max-h-[320px] flex flex-col"
                  >
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 bg-gradient-to-r ${gameInfo.color} rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0`}
                        >
                          {gameInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {gameInfo.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {gameInfo.category}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {gameId === 'rapid-letter-naming' ? 'Correct Letters' : 'Best Score'}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {(() => {
                              if (gameId === 'focus-finder') {
                                // For FocusFinder, show max possible score with bonuses
                                const maxObjects = 8; // Maximum objects in highest level
                                const baseScore = maxObjects * 20; // 20 points per object
                                const maxTimeBonus = maxObjects * 10; // Max time bonus per object
                                const maxCompletionBonus = 50; // Max completion bonus
                                const maxPossibleScore =
                                  baseScore + maxTimeBonus + maxCompletionBonus;
                                return maxPossibleScore;
                              }
                              if (gameId === 'rapid-letter-naming') {
                                // For Rapid Letter Naming, show correct letters
                                const correctLetters =
                                  gameData.gameSpecificData?.correctLetters ||
                                  gameData.gameSpecificData?.correctResponses ||
                                  gameData.bestScore ||
                                  gameData.score ||
                                  0;
                                return correctLetters;
                              }
                              const score = gameData.bestScore || gameData.score || 0;
                              console.log(`🎮 Game ${gameId} score display:`, {
                                bestScore: gameData.bestScore,
                                score: gameData.score,
                                finalScore: score,
                              });
                              return score;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Accuracy</span>
                          <span className="font-semibold text-green-600">
                            {(() => {
                              let accuracy = gameData.accuracy || gameData.averageAccuracy || 0;

                              // For Memory Trail, calculate accuracy from game-specific data if available
                              if (gameId === 'memory-trail' && gameData.gameSpecificData) {
                                const { successfulRounds, totalRounds } = gameData.gameSpecificData;
                                if (
                                  successfulRounds !== undefined &&
                                  totalRounds !== undefined &&
                                  totalRounds > 0
                                ) {
                                  accuracy = (successfulRounds / totalRounds) * 100;
                                }
                              }

                              if (accuracy <= 1) {
                                accuracy = accuracy * 100; // Convert from decimal to percentage
                              }

                              console.log(`🎮 Game ${gameId} accuracy display:`, {
                                rawAccuracy: gameData.accuracy,
                                averageAccuracy: gameData.averageAccuracy,
                                gameSpecificData: gameData.gameSpecificData,
                                finalAccuracy: Math.round(accuracy),
                              });
                              return Math.round(accuracy);
                            })()}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Sessions</span>
                          <span className="font-semibold text-blue-600">
                            {gameData.playCount || 0}
                          </span>
                        </div>
                        {gameId === 'memory-trail' && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Correct Patterns
                            </span>
                            <span className="font-semibold text-green-600">
                              {calculateCorrectPatterns({
                                gameId,
                                gameSpecificData: gameData.gameSpecificData,
                              })}
                            </span>
                          </div>
                        )}
                        {gameId === 'task-twister-enhanced' && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Correct Rounds
                            </span>
                            <span className="font-semibold text-green-600">
                              {(() => {
                                // Calculate total correct rounds from all sessions
                                if (gameData.sessions && gameData.sessions.length > 0) {
                                  const totalCorrectRounds = gameData.sessions.reduce(
                                    (total, session) => {
                                      const sessionCorrectRounds =
                                        session.gameSpecificData?.roundsCompleted ||
                                        session.gameSpecificData?.taskSwitchCount ||
                                        session.gameSpecificData?.correctInteractions ||
                                        0;
                                      return total + sessionCorrectRounds;
                                    },
                                    0
                                  );
                                  return totalCorrectRounds;
                                }
                                // Fallback to main game data
                                return (
                                  gameData.gameSpecificData?.roundsCompleted ||
                                  gameData.gameSpecificData?.taskSwitchCount ||
                                  gameData.gameSpecificData?.correctInteractions ||
                                  gameData.level ||
                                  0
                                );
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Last Played
                          </span>
                          <span className="font-semibold text-purple-600 text-xs">
                            {gameData.lastPlayed ? formatDate(gameData.lastPlayed) : 'Never'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <button
                          onClick={() => {
                            setSelectedGame({ gameId, gameData, gameInfo });
                            setShowDetails(true);
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Suites Tab */}
      {activeTab === 'suites' && (
        <SuiteHistorySection childId={childId} assessmentType={assessmentType} />
      )}

      {/* Game Details Modal */}
      {showDetails && selectedGame && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${selectedGame.gameInfo.color} rounded-2xl flex items-center justify-center text-white text-2xl`}
                >
                  {selectedGame.gameInfo.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedGame.gameInfo.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedGame.gameInfo.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Game Summary Section */}
            <div className="space-y-4">
              {/* General Game Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-indigo-200/50 dark:border-indigo-700/50">
                <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                  Game Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {selectedGame.gameData.bestScore || selectedGame.gameData.score || 0}
                    </div>
                    <div className="text-sm text-indigo-600/70">Best Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(() => {
                        let accuracy =
                          selectedGame.gameData.accuracy ||
                          selectedGame.gameData.averageAccuracy ||
                          0;
                        if (accuracy <= 1) accuracy = accuracy * 100;
                        return Math.round(accuracy);
                      })()}
                      %
                    </div>
                    <div className="text-sm text-green-600/70">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedGame.gameData.sessions?.length || 0}
                    </div>
                    <div className="text-sm text-purple-600/70">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedGame.gameData.lastPlayed
                        ? formatDate(selectedGame.gameData.lastPlayed)
                        : 'Never'}
                    </div>
                    <div className="text-sm text-orange-600/70">Last Played</div>
                  </div>
                </div>
              </div>

              {/* Game-Specific Summaries */}
              {/* Letter Sound Matching Summary */}
              {selectedGame.gameId === 'letter-sound-matching' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-4 border border-emerald-200/50 dark:border-emerald-700/50">
                    <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                      Letter Sound Matching Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          {(() => {
                            const totalCorrectWords = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectWords =
                                  session.gameSpecificData?.correctWords ||
                                  session.gameSpecificData?.correctAnswers ||
                                  0;
                                return total + sessionCorrectWords;
                              },
                              0
                            );
                            return totalCorrectWords;
                          })()}
                        </div>
                        <div className="text-sm text-emerald-600/70">Total Correct Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const totalTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => total + (session.totalTime || 0),
                              0
                            );
                            return formatTime(totalTime);
                          })()}
                        </div>
                        <div className="text-sm text-blue-600/70">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-purple-600/70">Sessions</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Memory Match Summary */}
              {selectedGame.gameId === 'memory-match' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Memory Match Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const totalCorrectMatches = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectMatches =
                                  session.gameSpecificData?.correctAnswers ||
                                  session.correctAnswers ||
                                  0;
                                return total + sessionCorrectMatches;
                              },
                              0
                            );
                            return totalCorrectMatches;
                          })()}
                        </div>
                        <div className="text-sm text-blue-600/70">Total Correct Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => total + (session.totalTime || 0),
                              0
                            );
                            return formatTime(totalTime);
                          })()}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-orange-600/70">Sessions</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Word Sequence Builder Summary */}
              {selectedGame.gameId === 'word-sequence-builder' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 mb-4 border border-teal-200/50 dark:border-teal-700/50">
                    <h4 className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-2">
                      Word Sequence Builder Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">
                          {(() => {
                            const totalCorrectWords = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectWords =
                                  session.gameSpecificData?.correctWords ||
                                  session.gameSpecificData?.correctAnswers ||
                                  0;
                                return total + sessionCorrectWords;
                              },
                              0
                            );
                            return totalCorrectWords;
                          })()}
                        </div>
                        <div className="text-sm text-teal-600/70">Total Correct Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => total + (session.totalTime || 0),
                              0
                            );
                            return formatTime(totalTime);
                          })()}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-orange-600/70">Sessions</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Session History */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Session History ({selectedGame.gameData.sessions?.length || 0} sessions)
              </h3>

              {/* Game Summary for Memory Trail */}
              {selectedGame.gameId === 'memory-trail' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const totalCorrectPatterns = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionPatterns =
                                  session.gameSpecificData?.correctPatterns || 0;
                                console.log(
                                  `Session ${session.level}: correctPatterns = ${sessionPatterns}`,
                                  session.gameSpecificData
                                );
                                return total + sessionPatterns;
                              },
                              0
                            );
                            console.log(
                              'Total correct patterns from all sessions:',
                              totalCorrectPatterns
                            );

                            // Fallback: if total is 0 but we have successful rounds, calculate from successfulRounds
                            if (
                              totalCorrectPatterns === 0 &&
                              selectedGame.gameData.gameSpecificData?.successfulRounds
                            ) {
                              const successfulRounds =
                                selectedGame.gameData.gameSpecificData.successfulRounds;
                              const avgSequenceLength =
                                selectedGame.gameData.gameSpecificData.sequenceLength || 5;
                              const estimatedPatterns = successfulRounds * avgSequenceLength;
                              console.log('Fallback calculation:', {
                                successfulRounds,
                                avgSequenceLength,
                                estimatedPatterns,
                              });
                              return estimatedPatterns;
                            }

                            return totalCorrectPatterns;
                          })()}
                        </div>
                        <div className="text-sm text-blue-600/70">Total Correct Patterns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for HyperHop */}
              {selectedGame.gameId === 'hyper-hop' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 border border-green-200/50 dark:border-green-700/50">
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalCorrectRounds = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectRounds =
                                  session.gameSpecificData?.correctRounds || 0;
                                console.log(
                                  `Session ${session.level}: correctRounds = ${sessionCorrectRounds}`,
                                  session.gameSpecificData
                                );
                                return total + sessionCorrectRounds;
                              },
                              0
                            );
                            console.log(
                              'Total correct rounds from all sessions:',
                              totalCorrectRounds
                            );
                            return totalCorrectRounds;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Total Correct Rounds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-blue-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Rapid Letter Naming */}
              {selectedGame.gameId === 'rapid-letter-naming' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 border border-red-200/50 dark:border-red-700/50">
                    <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                      Letter Naming Fluency Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {(() => {
                            const totalCorrectLetters = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionLetters =
                                  session.gameSpecificData?.correctLetters ||
                                  session.gameSpecificData?.correctResponses ||
                                  session.score ||
                                  0;
                                return total + sessionLetters;
                              },
                              0
                            );
                            return totalCorrectLetters;
                          })()}
                        </div>
                        <div className="text-sm text-red-600/70">Total Correct Letters</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => total + (session.totalTime || 0),
                              0
                            );
                            return formatTime(totalTime);
                          })()}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-orange-600/70">Sessions</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for FocusFinder */}
              {selectedGame.gameId === 'focus-finder' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4 border border-purple-200/50 dark:border-purple-700/50">
                    <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalFoundObjects = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionFoundObjects =
                                  session.gameSpecificData?.foundObjects || 0;
                                console.log(
                                  `Session ${session.level}: foundObjects = ${sessionFoundObjects}`,
                                  session.gameSpecificData
                                );
                                return total + sessionFoundObjects;
                              },
                              0
                            );
                            console.log(
                              'Total found objects from all sessions:',
                              totalFoundObjects
                            );
                            return totalFoundObjects;
                          })()}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Objects Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalDistractionsClicked = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionDistractions =
                                  session.gameSpecificData?.distractionsClicked || 0;
                                return total + sessionDistractions;
                              },
                              0
                            );
                            return totalDistractionsClicked;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Distractions Avoided</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-blue-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Task Twister */}
              {selectedGame.gameId === 'task-twister-enhanced' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 mb-4 border border-pink-200/50 dark:border-pink-700/50">
                    <h4 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">
                          {(() => {
                            const totalCorrectRounds = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectRounds =
                                  session.gameSpecificData?.roundsCompleted ||
                                  session.gameSpecificData?.taskSwitchCount ||
                                  0;
                                console.log(
                                  `Session ${session.level}: correctRounds = ${sessionCorrectRounds}`,
                                  session.gameSpecificData
                                );
                                return total + sessionCorrectRounds;
                              },
                              0
                            );
                            console.log(
                              'Total correct rounds from all sessions:',
                              totalCorrectRounds
                            );
                            return totalCorrectRounds;
                          })()}
                        </div>
                        <div className="text-sm text-pink-600/70">Total Correct Rounds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalCorrectInteractions = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectInteractions =
                                  session.gameSpecificData?.correctInteractions || 0;
                                return total + sessionCorrectInteractions;
                              },
                              0
                            );
                            return totalCorrectInteractions;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Correct Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedGame.gameData.sessions.length}
                        </div>
                        <div className="text-sm text-purple-600/70">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for ImpulseFreeze */}
              {selectedGame.gameId === 'impulse-freeze' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 border border-red-200/50 dark:border-red-700/50">
                    <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {(() => {
                            const totalCorrectMoves = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectMoves =
                                  session.gameSpecificData?.correctMoves || 0;
                                console.log(
                                  `Session ${session.level}: correctMoves = ${sessionCorrectMoves}`,
                                  session.gameSpecificData
                                );
                                return total + sessionCorrectMoves;
                              },
                              0
                            );
                            console.log(
                              'Total correct moves from all sessions:',
                              totalCorrectMoves
                            );
                            return totalCorrectMoves;
                          })()}
                        </div>
                        <div className="text-sm text-red-600/70">Total Correct Moves</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalRounds = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRounds = session.gameSpecificData?.totalRounds || 0;
                                return total + sessionRounds;
                              },
                              0
                            );
                            return totalRounds;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Total Rounds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-blue-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for TimeTurtle */}
              {selectedGame.gameId === 'time-turtle' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-4 border border-orange-200/50 dark:border-orange-700/50">
                    <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalTasksCompleted = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionTasksCompleted =
                                  session.gameSpecificData?.tasksCompleted || 0;
                                console.log(
                                  `Session ${session.level}: tasksCompleted = ${sessionTasksCompleted}`,
                                  session.gameSpecificData
                                );
                                return total + sessionTasksCompleted;
                              },
                              0
                            );
                            console.log(
                              'Total tasks completed from all sessions:',
                              totalTasksCompleted
                            );
                            return totalTasksCompleted;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Tasks Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalRounds = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRounds = session.gameSpecificData?.totalRounds || 0;
                                return total + sessionRounds;
                              },
                              0
                            );
                            return totalRounds;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Total Rounds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-blue-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.totalTime || 0);
                              },
                              0
                            );
                            return Math.round(totalTime);
                          })()}
                          s
                        </div>
                        <div className="text-sm text-purple-600/70">Total Time</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for SoundShift */}
              {selectedGame.gameId === 'sound-shift' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4 border border-indigo-200/50 dark:border-indigo-700/50">
                    <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {(() => {
                            const totalCorrectResponses = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectResponses =
                                  session.gameSpecificData?.correctResponses || 0;
                                console.log(
                                  `Session ${session.level}: correctResponses = ${sessionCorrectResponses}`,
                                  session.gameSpecificData
                                );
                                return total + sessionCorrectResponses;
                              },
                              0
                            );
                            console.log(
                              'Total correct responses from all sessions:',
                              totalCorrectResponses
                            );
                            return totalCorrectResponses;
                          })()}
                        </div>
                        <div className="text-sm text-indigo-600/70">Total Correct Responses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {(() => {
                            const totalFalseAlarms = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionFalseAlarms =
                                  session.gameSpecificData?.falseAlarms || 0;
                                return total + sessionFalseAlarms;
                              },
                              0
                            );
                            return totalFalseAlarms;
                          })()}
                        </div>
                        <div className="text-sm text-red-600/70">Total False Alarms</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalRounds = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRounds =
                                  session.gameSpecificData?.roundsCompleted || 0;
                                return total + sessionRounds;
                              },
                              0
                            );
                            return totalRounds;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Total Rounds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.totalTime || 0);
                              },
                              0
                            );
                            return Math.round(totalTime);
                          })()}
                          s
                        </div>
                        <div className="text-sm text-purple-600/70">Total Time</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Spot Correct Word */}
              {selectedGame.gameId === 'spot-correct-word' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 border border-green-200/50 dark:border-green-700/50">
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalCorrectWords = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectWords =
                                  session.gameSpecificData?.correctAnswers || 0;
                                console.log(
                                  `Session ${session.level}: correctWords = ${sessionCorrectWords}`,
                                  session.gameSpecificData
                                );
                                return total + sessionCorrectWords;
                              },
                              0
                            );
                            console.log(
                              'Total correct words from all sessions:',
                              totalCorrectWords
                            );
                            return totalCorrectWords;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Total Correct Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">
                          {(() => {
                            const totalRounds = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRounds =
                                  session.gameSpecificData?.roundsCompleted || 0;
                                return total + sessionRounds;
                              },
                              0
                            );
                            return totalRounds;
                          })()}
                        </div>
                        <div className="text-sm text-teal-600/70">Total Rounds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-blue-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Visual Tracking Maze */}
              {selectedGame.gameId === 'visual-tracking-maze' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4 border border-indigo-200/50 dark:border-indigo-700/50">
                    <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {(() => {
                            const totalMazesCompleted = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionMazesCompleted =
                                  session.gameSpecificData?.completedMazes || 0;
                                console.log(
                                  `Session ${session.level}: mazesCompleted = ${sessionMazesCompleted}`,
                                  session.gameSpecificData
                                );
                                return total + sessionMazesCompleted;
                              },
                              0
                            );
                            console.log(
                              'Total mazes completed from all sessions:',
                              totalMazesCompleted
                            );
                            return totalMazesCompleted;
                          })()}
                        </div>
                        <div className="text-sm text-indigo-600/70">Total Mazes Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const totalAttempts = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionAttempts =
                                  session.totalAttempts ||
                                  session.gameSpecificData?.totalAttempts ||
                                  0;
                                return total + sessionAttempts;
                              },
                              0
                            );
                            return totalAttempts;
                          })()}
                        </div>
                        <div className="text-sm text-blue-600/70">Total Attempts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Rhyming Pairs */}
              {selectedGame.gameId === 'rhyming-pairs' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 mb-4 border border-pink-200/50 dark:border-pink-700/50">
                    <h4 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">
                          {(() => {
                            const totalRoundsCompleted = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRoundsCompleted =
                                  session.gameSpecificData?.roundsCompleted || 0;
                                console.log(
                                  `Session ${session.level}: roundsCompleted = ${sessionRoundsCompleted}`,
                                  session.gameSpecificData
                                );
                                return total + sessionRoundsCompleted;
                              },
                              0
                            );
                            console.log(
                              'Total rounds completed from all sessions:',
                              totalRoundsCompleted
                            );
                            return totalRoundsCompleted;
                          })()}
                        </div>
                        <div className="text-sm text-pink-600/70">Total Rounds Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-rose-600">
                          {(() => {
                            const totalResponseTime = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionResponseTime =
                                  session.gameSpecificData?.averageResponseTime || 0;
                                return total + sessionResponseTime;
                              },
                              0
                            );
                            const avgResponseTime =
                              selectedGame.gameData.sessions.length > 0
                                ? Math.round(
                                    totalResponseTime / selectedGame.gameData.sessions.length
                                  )
                                : 0;
                            return avgResponseTime;
                          })()}
                          ms
                        </div>
                        <div className="text-sm text-rose-600/70">Avg Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Mirror Letter Game */}
              {selectedGame.gameId === 'mirror-letter-game' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4 border border-indigo-200/50 dark:border-indigo-700/50">
                    <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {(() => {
                            const totalRoundsCompleted = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRoundsCompleted =
                                  session.gameSpecificData?.roundsCompleted || 0;
                                console.log(
                                  `Session ${session.level}: roundsCompleted = ${sessionRoundsCompleted}`,
                                  session.gameSpecificData
                                );
                                return total + sessionRoundsCompleted;
                              },
                              0
                            );
                            console.log(
                              'Total rounds completed from all sessions:',
                              totalRoundsCompleted
                            );
                            return totalRoundsCompleted;
                          })()}
                        </div>
                        <div className="text-sm text-indigo-600/70">Total Rounds Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const totalCorrectChoices = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectChoices = session.correctAnswers || 0;
                                return total + sessionCorrectChoices;
                              },
                              0
                            );
                            return totalCorrectChoices;
                          })()}
                        </div>
                        <div className="text-sm text-purple-600/70">Correct Choices</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-green-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Game Summary for Syllable Clapper */}
              {selectedGame.gameId === 'syllable-clapper' &&
                selectedGame.gameData.sessions &&
                selectedGame.gameData.sessions.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-4 border border-yellow-200/50 dark:border-yellow-700/50">
                    <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Game Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(() => {
                            const totalRoundsCompleted = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionRoundsCompleted =
                                  session.gameSpecificData?.currentRound || 0;
                                console.log(
                                  `Session ${session.level}: roundsCompleted = ${sessionRoundsCompleted}`,
                                  session.gameSpecificData
                                );
                                return total + sessionRoundsCompleted;
                              },
                              0
                            );
                            console.log(
                              'Total rounds completed from all sessions:',
                              totalRoundsCompleted
                            );
                            return totalRoundsCompleted;
                          })()}
                        </div>
                        <div className="text-sm text-yellow-600/70">Total Rounds Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalCorrectSyllables = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                const sessionCorrectSyllables =
                                  session.correctAnswers ||
                                  session.gameSpecificData?.correctAnswers ||
                                  0;
                                return total + sessionCorrectSyllables;
                              },
                              0
                            );
                            return totalCorrectSyllables;
                          })()}
                        </div>
                        <div className="text-sm text-green-600/70">Correct Syllables</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const successfulSessions = selectedGame.gameData.sessions.filter(
                              s => s.accuracy > 0
                            ).length;
                            const totalSessions = selectedGame.gameData.sessions.length;
                            return totalSessions > 0
                              ? Math.round((successfulSessions / totalSessions) * 100)
                              : 0;
                          })()}
                          %
                        </div>
                        <div className="text-sm text-blue-600/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalScore = selectedGame.gameData.sessions.reduce(
                              (total, session) => {
                                return total + (session.score || 0);
                              },
                              0
                            );
                            return totalScore;
                          })()}
                        </div>
                        <div className="text-sm text-orange-600/70">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

              {selectedGame.gameData.sessions && selectedGame.gameData.sessions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(() => {
                    // Deduplicate sessions based on sessionId and completedAt
                    const uniqueSessions = selectedGame.gameData.sessions.reduce((acc, session) => {
                      const key = `${session.sessionId}_${session.completedAt}`;
                      const existingSession = acc.find(
                        s => `${s.sessionId}_${s.completedAt}` === key
                      );
                      if (!existingSession) {
                        acc.push(session);
                      }
                      return acc;
                    }, []);

                    console.log('🔍 Original sessions:', selectedGame.gameData.sessions.length);
                    console.log('🔍 Unique sessions:', uniqueSessions.length);
                    console.log('🔍 Sessions data:', uniqueSessions);

                    return uniqueSessions.map((session, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(session.completedAt)}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {(() => {
                              // Don't show level for games that don't have levels
                              const gamesWithoutLevels = [
                                'impulse-freeze',
                                'hyper-hop',
                                'memory-trail',
                                'task-twister',
                                'task-twister-enhanced',
                                'sound-shift',
                                'time-turtle',
                                // Dyslexia games don't have levels
                                'letter-sound-matching',
                                'memory-match',
                                'rapid-letter-naming',
                                'spot-correct-word',
                                'word-sequence-builder',
                                'mirror-letter-game',
                                'syllable-clapper',
                                'visual-tracking-maze',
                                'rhyming-pairs',
                              ];
                              if (gamesWithoutLevels.includes(selectedGame.gameId)) {
                                return '';
                              }
                              return `Level ${session.level || 1}`;
                            })()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{session.score}</div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {(() => {
                                // Use accuracyPercentage if available, otherwise calculate from accuracy
                                let accuracy = session.accuracyPercentage || 0;
                                if (!session.accuracyPercentage && session.accuracy !== undefined) {
                                  accuracy =
                                    session.accuracy <= 1
                                      ? Math.round(session.accuracy * 100)
                                      : Math.round(session.accuracy);
                                }
                                console.log(`🎮 Session accuracy for ${selectedGame.gameId}:`, {
                                  rawAccuracy: session.accuracy,
                                  accuracyPercentage: session.accuracyPercentage,
                                  calculatedAccuracy: accuracy,
                                  sessionData: session,
                                });
                                return Math.round(accuracy);
                              })()}
                              %
                            </div>
                            <div className="text-xs text-gray-500">Accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {(() => {
                                const timeValue = session.totalTime || session.duration || 0;
                                console.log(
                                  'Session time value:',
                                  timeValue,
                                  'for session:',
                                  session
                                );
                                // Ensure time is reasonable
                                if (timeValue > 0 && timeValue < 3600) {
                                  // Between 0 and 1 hour
                                  return formatTime(timeValue);
                                } else {
                                  return '0:00';
                                }
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">Time</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {(() => {
                                // For Memory Trail game, show session-specific correct patterns
                                if (selectedGame.gameId === 'memory-trail') {
                                  const sessionPatterns =
                                    session.gameSpecificData?.correctPatterns || 0;
                                  console.log(
                                    'Session correct patterns:',
                                    sessionPatterns,
                                    'for session:',
                                    session
                                  );
                                  return sessionPatterns;
                                }
                                // For HyperHop game, show correctly hopped rounds
                                else if (selectedGame.gameId === 'hyper-hop') {
                                  const correctRounds =
                                    session.gameSpecificData?.correctRounds ||
                                    session.gameSpecificData?.roundsCompleted ||
                                    0;
                                  console.log(
                                    'Session correct rounds:',
                                    correctRounds,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctRounds;
                                }
                                // For Impulse Freeze game, show correct moves instead of distractions
                                else if (selectedGame.gameId === 'impulse-freeze') {
                                  const correctMoves = session.gameSpecificData?.correctMoves || 0;
                                  console.log(
                                    'Session correct moves:',
                                    correctMoves,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctMoves;
                                }
                                // For Task Twister game, show correct interactions instead of distractions
                                else if (selectedGame.gameId === 'task-twister-enhanced') {
                                  const correctInteractions =
                                    session.gameSpecificData?.correctInteractions || 0;
                                  console.log(
                                    'Session correct interactions:',
                                    correctInteractions,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctInteractions;
                                }
                                // For Time Turtle game, show tasks completed instead of distractions
                                else if (selectedGame.gameId === 'time-turtle') {
                                  const tasksCompleted =
                                    session.gameSpecificData?.tasksCompleted || 0;
                                  console.log(
                                    'Session tasks completed:',
                                    tasksCompleted,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return tasksCompleted;
                                }
                                // For Sound Shift game, show false alarms instead of distractions
                                else if (selectedGame.gameId === 'sound-shift') {
                                  const falseAlarms = session.gameSpecificData?.falseAlarms || 0;
                                  console.log(
                                    'Session false alarms:',
                                    falseAlarms,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );

                                  // Additional debugging for sound-shift
                                  console.log('🎮 Sound-shift session data:', {
                                    sessionId: session.sessionId,
                                    score: session.score,
                                    accuracy: session.accuracy,
                                    accuracyPercentage: session.accuracyPercentage,
                                    gameSpecificData: session.gameSpecificData,
                                    correctResponses: session.gameSpecificData?.correctResponses,
                                    falseAlarms: session.gameSpecificData?.falseAlarms,
                                    missedTargets: session.gameSpecificData?.missedTargets,
                                  });

                                  return falseAlarms;
                                }
                                // For Letter Sound Matching game, show correct words
                                else if (selectedGame.gameId === 'letter-sound-matching') {
                                  const correctWords =
                                    session.gameSpecificData?.correctWords ||
                                    session.gameSpecificData?.correctAnswers ||
                                    0;
                                  console.log(
                                    'Session correct words:',
                                    correctWords,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctWords;
                                }
                                // For Memory Match game, show incorrect matches
                                else if (selectedGame.gameId === 'memory-match') {
                                  const incorrectMatches =
                                    session.gameSpecificData?.incorrectMatches ||
                                    session.gameSpecificData?.totalAttempts -
                                      session.gameSpecificData?.correctAnswers ||
                                    0;
                                  console.log(
                                    'Session incorrect matches:',
                                    incorrectMatches,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return incorrectMatches;
                                }
                                // For Rapid Letter Naming game, show correct letters
                                else if (selectedGame.gameId === 'rapid-letter-naming') {
                                  const correctLetters =
                                    session.gameSpecificData?.correctLetters ||
                                    session.gameSpecificData?.correctResponses ||
                                    session.score ||
                                    0;
                                  console.log(
                                    'Session correct letters:',
                                    correctLetters,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctLetters;
                                }
                                // For Spot Correct Word game, show correct words
                                else if (selectedGame.gameId === 'spot-correct-word') {
                                  const correctWords =
                                    session.gameSpecificData?.correctWords ||
                                    session.gameSpecificData?.correctAnswers ||
                                    0;
                                  console.log(
                                    'Session correct words:',
                                    correctWords,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctWords;
                                }
                                // For Word Sequence Builder game, show correct words
                                else if (selectedGame.gameId === 'word-sequence-builder') {
                                  const correctWords =
                                    session.gameSpecificData?.correctWords ||
                                    session.gameSpecificData?.correctAnswers ||
                                    0;
                                  console.log(
                                    'Session correct words:',
                                    correctWords,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctWords;
                                }
                                // For Visual Tracking Maze game, show completed mazes
                                else if (selectedGame.gameId === 'visual-tracking-maze') {
                                  const completedMazes =
                                    session.gameSpecificData?.completedMazes || 0;
                                  console.log(
                                    'Session completed mazes:',
                                    completedMazes,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return completedMazes;
                                }
                                // For Rhyming Pairs game, show average response time
                                else if (selectedGame.gameId === 'rhyming-pairs') {
                                  const avgResponseTime =
                                    session.gameSpecificData?.averageResponseTime || 0;
                                  console.log(
                                    'Session average response time:',
                                    avgResponseTime,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return avgResponseTime;
                                }
                                // For Mirror Letter Game, show correct choices
                                else if (selectedGame.gameId === 'mirror-letter-game') {
                                  const correctChoices =
                                    session.correctAnswers ||
                                    session.gameSpecificData?.correctAnswers ||
                                    0;
                                  console.log(
                                    'Session correct choices:',
                                    correctChoices,
                                    'session data:',
                                    session,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctChoices;
                                }
                                // For Syllable Clapper game, show correct syllables
                                else if (selectedGame.gameId === 'syllable-clapper') {
                                  const correctSyllables =
                                    session.correctAnswers ||
                                    session.gameSpecificData?.correctAnswers ||
                                    0;
                                  console.log(
                                    'Session correct syllables:',
                                    correctSyllables,
                                    'session data:',
                                    session,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return correctSyllables;
                                } else {
                                  const distractions =
                                    session.gameSpecificData?.distractionsClicked ||
                                    session.gameSpecificData?.distractionsClicked ||
                                    0;
                                  console.log(
                                    'Session distractions:',
                                    distractions,
                                    'gameSpecificData:',
                                    session.gameSpecificData
                                  );
                                  return distractions;
                                }
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedGame.gameId === 'memory-trail'
                                ? 'Correct Patterns'
                                : selectedGame.gameId === 'impulse-freeze'
                                  ? 'Correct Moves'
                                  : selectedGame.gameId === 'hyper-hop'
                                    ? 'Correctly Hopped Rounds'
                                    : selectedGame.gameId === 'task-twister-enhanced'
                                      ? 'Correct Interactions'
                                      : selectedGame.gameId === 'time-turtle'
                                        ? 'Tasks Completed'
                                        : selectedGame.gameId === 'sound-shift'
                                          ? 'False Alarms'
                                          : selectedGame.gameId === 'letter-sound-matching'
                                            ? 'Correct Words'
                                            : selectedGame.gameId === 'memory-match'
                                              ? 'Incorrect Matches'
                                              : selectedGame.gameId === 'rapid-letter-naming'
                                                ? 'Correct Letters'
                                                : selectedGame.gameId === 'spot-correct-word'
                                                  ? 'Correct Words'
                                                  : selectedGame.gameId === 'word-sequence-builder'
                                                    ? 'Correct Words'
                                                    : selectedGame.gameId === 'visual-tracking-maze'
                                                      ? 'Correct Mazes'
                                                      : selectedGame.gameId === 'rhyming-pairs'
                                                        ? 'Avg Response Time'
                                                        : selectedGame.gameId ===
                                                            'mirror-letter-game'
                                                          ? 'Correct Choices'
                                                          : selectedGame.gameId ===
                                                              'syllable-clapper'
                                                            ? 'Correct Syllables'
                                                            : 'Distractions'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No session data available
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GameHistorySection;
