import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ClockIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  SparklesIcon,
  AcademicCapIcon,
  TrophyIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

// Enhanced rhyming pairs with categories and difficulty levels
const PAIRS = [
  // Easy rhymes
  { word1: 'cat', word2: 'hat', rhyme: true, category: 'Animals', difficulty: 'Easy', emoji: '🐱' },
  { word1: 'dog', word2: 'log', rhyme: true, category: 'Animals', difficulty: 'Easy', emoji: '🐕' },
  {
    word1: 'fish',
    word2: 'dish',
    rhyme: true,
    category: 'Animals',
    difficulty: 'Easy',
    emoji: '🐟',
  },
  { word1: 'sun', word2: 'run', rhyme: true, category: 'Nature', difficulty: 'Easy', emoji: '☀️' },
  { word1: 'tree', word2: 'bee', rhyme: true, category: 'Nature', difficulty: 'Easy', emoji: '🌳' },
  {
    word1: 'ball',
    word2: 'wall',
    rhyme: true,
    category: 'Objects',
    difficulty: 'Easy',
    emoji: '⚽',
  },
  {
    word1: 'book',
    word2: 'look',
    rhyme: true,
    category: 'Objects',
    difficulty: 'Easy',
    emoji: '📚',
  },
  {
    word1: 'car',
    word2: 'star',
    rhyme: true,
    category: 'Objects',
    difficulty: 'Easy',
    emoji: '🚗',
  },

  // Medium rhymes
  {
    word1: 'light',
    word2: 'bright',
    rhyme: true,
    category: 'Colors',
    difficulty: 'Medium',
    emoji: '💡',
  },
  {
    word1: 'night',
    word2: 'right',
    rhyme: true,
    category: 'Time',
    difficulty: 'Medium',
    emoji: '🌙',
  },
  {
    word1: 'play',
    word2: 'day',
    rhyme: true,
    category: 'Activities',
    difficulty: 'Medium',
    emoji: '🎮',
  },
  {
    word1: 'sing',
    word2: 'ring',
    rhyme: true,
    category: 'Music',
    difficulty: 'Medium',
    emoji: '🎵',
  },

  // Non-rhymes
  {
    word1: 'cat',
    word2: 'dog',
    rhyme: false,
    category: 'Animals',
    difficulty: 'Easy',
    emoji: '🐱',
  },
  {
    word1: 'fish',
    word2: 'cat',
    rhyme: false,
    category: 'Animals',
    difficulty: 'Easy',
    emoji: '🐟',
  },
  {
    word1: 'car',
    word2: 'pen',
    rhyme: false,
    category: 'Objects',
    difficulty: 'Easy',
    emoji: '🚗',
  },
  {
    word1: 'book',
    word2: 'pen',
    rhyme: false,
    category: 'Objects',
    difficulty: 'Easy',
    emoji: '📚',
  },
  {
    word1: 'sun',
    word2: 'tree',
    rhyme: false,
    category: 'Nature',
    difficulty: 'Easy',
    emoji: '☀️',
  },
  { word1: 'bee', word2: 'car', rhyme: false, category: 'Nature', difficulty: 'Easy', emoji: '🐝' },
  {
    word1: 'ball',
    word2: 'fish',
    rhyme: false,
    category: 'Objects',
    difficulty: 'Easy',
    emoji: '⚽',
  },
  {
    word1: 'look',
    word2: 'run',
    rhyme: false,
    category: 'Actions',
    difficulty: 'Easy',
    emoji: '👀',
  },
  {
    word1: 'light',
    word2: 'dark',
    rhyme: false,
    category: 'Colors',
    difficulty: 'Medium',
    emoji: '💡',
  },
  {
    word1: 'night',
    word2: 'day',
    rhyme: false,
    category: 'Time',
    difficulty: 'Medium',
    emoji: '🌙',
  },
  {
    word1: 'play',
    word2: 'work',
    rhyme: false,
    category: 'Activities',
    difficulty: 'Medium',
    emoji: '🎮',
  },
  {
    word1: 'sing',
    word2: 'dance',
    rhyme: false,
    category: 'Music',
    difficulty: 'Medium',
    emoji: '🎵',
  },
];

const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 90; // seconds

const RhymingPairs = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPair, setCurrentPair] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [interactionLog, setInteractionLog] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Shuffle pairs for each game
  const [pairs, setPairs] = useState([]);
  useEffect(() => {
    if (gameStarted) {
      const shuffled = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
      setPairs(shuffled);
    }
  }, [gameStarted]);

  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            toast.error("Time's up! ⏰ Game Over!", { duration: 2000 });
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused, timeLeft]);

  const endGame = async () => {
    setGameOver(true);
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);
    setCorrectAnswers(score);

    // Prepare game results
    const gameResults = {
      gameId: 'rhyming-pairs',
      gameType: 'rhyming-pairs',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: score,
      totalAttempts: totalAttempts,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        roundsCompleted: currentRound,
        correctAnswers: score,
        totalAttempts: totalAttempts,
        averageResponseTime: avgResponseTime,
        keystrokeData: keystrokeData,
        interactionLog: interactionLog,
        totalInteractions: keystrokeData.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 RhymingPairs completed in suite mode, calling onGameComplete');
      onGameComplete(gameResults);
      return;
    }

    // If not in suite mode, save to backend as usual
    try {
      // First, try to get or create a session for this child
      const sessionKey = `dyslexia_assessment_session_${childId}`;
      let sessionId = localStorage.getItem(sessionKey);

      if (!sessionId) {
        // Create a new assessment session for this child
        toast.loading('Starting assessment session...');

        try {
          const batteryConfig = await AssessmentService.configureBattery(
            childId,
            'dyslexia',
            96, // 8 years old in months
            ['phonemic_awareness', 'letter_recognition', 'auditory_processing']
          );

          const sessionResponse = await AssessmentService.startBatteryAssessment(
            childId,
            batteryConfig.batteryStructure
          );

          sessionId = sessionResponse.sessionId;
          localStorage.setItem(sessionKey, sessionId);
          toast.dismiss();
        } catch (error) {
          console.error('Error creating session:', error);
          toast.dismiss();
          toast.error('Failed to create assessment session');
          return;
        }
      }

      // Save game performance data
      toast.loading('Saving game results...');

      const performanceData = {
        score: score,
        accuracy: accuracyScore,
        duration: totalTimeTaken,
        totalTime: totalTimeTaken,
        startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
        correctAnswers: score,
        totalAttempts: totalAttempts,
        roundsCompleted: currentRound,
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          roundsCompleted: currentRound,
          correctAnswers: score,
          totalAttempts: totalAttempts,
          averageResponseTime: avgResponseTime,
          keystrokeData: keystrokeData,
          interactionLog: interactionLog,
          totalInteractions: keystrokeData.length,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'rhyming-pairs',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing rhyming-pairs data or initialize
      const existingRhymingPairs = existingData['rhyming-pairs'] || {};

      // Update with new session data
      const updatedRhymingPairs = {
        ...existingRhymingPairs,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingRhymingPairs.playCount || 0) + 1,
        bestScore: Math.max(existingRhymingPairs.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingRhymingPairs.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingRhymingPairs.sessions || []),
          {
            sessionId: sessionId,
            score: score,
            accuracy: accuracyScore,
            completedAt: new Date().toISOString(),
            totalTime: totalTimeTaken,
            gameSpecificData: performanceData.gameSpecificData,
          },
        ],
      };

      existingData['rhyming-pairs'] = updatedRhymingPairs;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'rhyming-pairs',
            score,
            accuracy: accuracyScore,
            totalTime: totalTimeTaken,
          },
        })
      );
    } catch (error) {
      console.error('Error saving game results:', error);
      toast.dismiss();
      toast.error('Failed to save game results');
    }
  };

  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCurrentRound(0);
    setTimeLeft(TIME_LIMIT);
    setResponseTimes([]);
    setTotalAttempts(0);
    setFeedback(null);
    setStartTime(Date.now());
    setCurrentPair(null);
    setGameStartTime(Date.now());
    setKeystrokeData([]);
    setInteractionLog([]);

    // Show game start toast
    toast.success('Game started! Find the rhyming pairs! 🎵', { duration: 2000 });
  };

  // Restart game
  const restartGame = () => {
    setShowInstructions(true);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCurrentRound(0);
    setTimeLeft(TIME_LIMIT);
    setResponseTimes([]);
    setTotalAttempts(0);
    setFeedback(null);
    setCurrentPair(null);

    // Show restart toast
    toast.success('Game restarted! 🔄', { duration: 1500 });
  };

  // Return to games
  const returnToGames = () => {
    // Get childId from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const childId = urlParams.get('childId');
    const targetUrl = childId
      ? `/assessment/games/dyslexia?childId=${childId}`
      : '/assessment/games/dyslexia';
    navigate(targetUrl);
  };

  // Toggle pause/resume
  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (newPausedState) {
      toast.success('Game Paused ⏸️', { duration: 1500 });
    } else {
      toast.success('Game Resumed ▶️', { duration: 1500 });
    }
  };

  useEffect(() => {
    if (gameStarted && pairs.length > 0 && currentRound < TOTAL_ROUNDS) {
      setCurrentPair(pairs[currentRound]);
      setStartTime(Date.now());
    }
  }, [gameStarted, pairs, currentRound]);

  const handleAnswer = doesRhyme => {
    if (!currentPair) return;
    const clickTime = Date.now();
    const timeSinceStart = gameStartTime ? (clickTime - gameStartTime) / 1000 : 0;

    const correct = currentPair.rhyme === doesRhyme;
    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => [...prev, responseTime]);
    setTotalAttempts(prev => prev + 1);

    // Track interaction
    const interaction = {
      type: 'rhyme_answer',
      answer: doesRhyme,
      correct: correct,
      timeSinceStart: timeSinceStart,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
    };

    setInteractionLog(prev => [...prev, interaction]);
    setKeystrokeData(prev => [...prev, { timeSinceStart, timestamp: new Date().toISOString() }]);

    if (correct) {
      setScore(prev => prev + 1);
      setFeedback({ type: 'correct', message: 'Correct! Great rhyming!' });

      // Show success toast
      toast.success('Correct! Great rhyming! 🎵', { duration: 1500 });

      // Show milestone toasts
      const newScore = score + 1;
      if (newScore === 3) {
        toast.success('🎉 3 correct! Great rhyming skills!', { duration: 2000 });
      } else if (newScore === 6) {
        toast.success('🚀 6 correct! Excellent rhyming!', { duration: 2000 });
      } else if (newScore === 9) {
        toast.success('🏆 9 correct! Amazing rhyming!', { duration: 2000 });
      }
    } else {
      setFeedback({ type: 'wrong', message: 'Oops! Try the next one.' });

      // Show error toast
      toast.error('Incorrect! Keep trying! ❌', { duration: 1500 });
    }
    setTimeout(() => {
      setFeedback(null);
      if (currentRound + 1 < TOTAL_ROUNDS) {
        setCurrentRound(prev => prev + 1);
      } else {
        endGame();
      }
    }, 900);
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-accent/8 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Animated decorative elements */}
        <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-indigo-500 rounded-full animate-float"></div>
        <div
          className="absolute top-[30%] right-[15%] w-3 h-3 bg-blue-500 rounded-full animate-float"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-purple-500 rounded-full animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-[60%] right-[25%] w-3 h-3 bg-indigo-500 rounded-full animate-float"
          style={{ animationDelay: '0.5s' }}
        ></div>

        {/* Sparkle effects */}
        <div className="absolute top-[15%] left-[30%] w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <div
          className="absolute top-[70%] right-[10%] w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        {/* Enhanced Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-text dark:text-white leading-tight">
            Rhyming Pairs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Decide if the two words rhyme. Click "Rhyme" or "Don't Rhyme" for each pair
          </p>
        </motion.div>

        {/* Instructions Modal */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/20 dark:border-gray-700/20"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MusicalNoteIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Decide if the two words rhyme. Click "Rhyme" or "Don't Rhyme" for each pair
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <AcademicCapIcon className="w-5 h-5 mr-2 text-indigo-500" />
                      How to Play:
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Read both words in the pair
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Click "Rhyme" if they rhyme, or "Don't Rhyme" if not
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Try to answer as many as you can before time runs out
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Listen carefully to the word sounds
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
                      Scoring:
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        +1 point for each correct answer
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        Speed and accuracy matter
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        10 pairs per game
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        90 seconds time limit
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500/20 shadow-lg"
                  >
                    <PlayIcon className="w-5 h-5 inline mr-2" />
                    Start Game
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/20 dark:border-gray-700/20"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrophyIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Game Over!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Great job! Here's how you performed:
                  </p>
                </div>

                {/* Enhanced Results Stats */}
                <div className="space-y-4 mb-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-center">
                      <TrophyIcon className="w-6 h-6 text-yellow-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Score</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {score}/{TOTAL_ROUNDS}
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center">
                      <ChartBarIcon className="w-6 h-6 text-blue-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Accuracy</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {accuracy}%
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="w-6 h-6 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Avg Response Time
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {avgResponseTime}ms
                    </span>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={returnToGames}
                    className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary/20"
                  >
                    <ArrowLeftIcon className="w-5 h-5 inline mr-2" />
                    Return to Games
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartGame}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500/20"
                  >
                    <PlayIcon className="w-5 h-5 inline mr-2" />
                    Play Again
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Game Interface */}
        {gameStarted && !gameOver && currentPair && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20 relative overflow-hidden"
          >
            {/* Enhanced Game Controls Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={returnToGames}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/90 dark:hover:bg-gray-700/90 shadow-lg"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Games
              </motion.button>

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePause}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 shadow-lg"
                >
                  {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-lg"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Restart
                </motion.button>
              </div>
            </div>

            {/* Pause Overlay */}
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10"
              >
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-2xl">
                  <PauseIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Game Paused
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePause}
                    className="px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
                  >
                    Resume Game
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Enhanced Game Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 text-center border border-indigo-200 dark:border-indigo-800"
              >
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800"
              >
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentRound + 1}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Round</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 text-center border border-orange-200 dark:border-orange-800"
              >
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Left</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800"
              >
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalAttempts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attempts</div>
              </motion.div>
            </div>

            {/* Round Info */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 backdrop-blur-sm rounded-full px-6 py-3 mb-4 border border-indigo-200 dark:border-indigo-800"
              >
                <span className="text-2xl">{currentPair.emoji}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Pair {currentRound + 1} / {TOTAL_ROUNDS}
                </span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {currentPair.category}
                </span>
              </motion.div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Do these words rhyme?</p>
            </div>

            {/* Enhanced Word Display */}
            <div className="flex justify-center gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-2xl px-8 py-6 text-3xl font-bold text-indigo-700 dark:text-indigo-300 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
              >
                {currentPair.word1}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-2xl px-8 py-6 text-3xl font-bold text-indigo-700 dark:text-indigo-300 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
              >
                {currentPair.word2}
              </motion.div>
            </div>

            {/* Enhanced Answer Buttons */}
            <div className="flex justify-center gap-8 mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(true)}
                disabled={!!feedback}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="w-6 h-6 inline mr-2" />
                Rhyme
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(false)}
                disabled={!!feedback}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="w-6 h-6 inline mr-2" />
                Don't Rhyme
              </motion.button>
            </div>

            {/* Enhanced Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center text-lg font-medium p-4 rounded-xl ${
                    feedback.type === 'correct'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {feedback.type === 'correct' ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <XMarkIcon className="w-6 h-6" />
                    )}
                    {feedback.message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Indicator */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50 dark:border-gray-700/50">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Progress: {currentRound + 1}/{TOTAL_ROUNDS} pairs
                </span>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentRound + 1) / TOTAL_ROUNDS) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {Math.round(((currentRound + 1) / TOTAL_ROUNDS) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RhymingPairs;
