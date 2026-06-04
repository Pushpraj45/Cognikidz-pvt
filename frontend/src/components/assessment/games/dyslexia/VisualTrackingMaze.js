import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
  ChartBarIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon as XMarkIconSolid,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  AcademicCapIcon,
  TrophyIcon,
  StarIcon,
  MapIcon,
} from '@heroicons/react/24/solid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const VisualTrackingMaze = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90); // 1 minute 30 seconds
  const [isPaused, setIsPaused] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentMaze, setCurrentMaze] = useState(null);
  const [userPath, setUserPath] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [responseTimes, setResponseTimes] = useState([]);
  const [gameStats, setGameStats] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [completedMazes, setCompletedMazes] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);

  // Enhanced maze configurations with better difficulty progression
  const mazeConfigs = {
    1: {
      size: 5,
      targetLetter: 'A',
      distractors: ['X', 'O', 'T'],
      complexity: 'simple',
      timeLimit: 30,
      emoji: '🔍',
      description: 'Find the letter A in this simple maze',
    },
    2: {
      size: 6,
      targetLetter: 'B',
      distractors: ['X', 'O', 'T', 'L', 'P'],
      complexity: 'medium',
      timeLimit: 25,
      emoji: '🎯',
      description: 'Locate letter B among more distractors',
    },
    3: {
      size: 7,
      targetLetter: 'C',
      distractors: ['X', 'O', 'T', 'L', 'P', 'M', 'N'],
      complexity: 'hard',
      timeLimit: 20,
      emoji: '⚡',
      description: 'Find letter C in a larger maze',
    },
    4: {
      size: 8,
      targetLetter: 'D',
      distractors: ['X', 'O', 'T', 'L', 'P', 'M', 'N', 'K', 'R'],
      complexity: 'expert',
      timeLimit: 18,
      emoji: '🚀',
      description: 'Expert level - find letter D quickly',
    },
    5: {
      size: 9,
      targetLetter: 'E',
      distractors: ['X', 'O', 'T', 'L', 'P', 'M', 'N', 'K', 'R', 'S', 'V'],
      complexity: 'master',
      timeLimit: 15,
      emoji: '🏆',
      description: 'Master level - ultimate challenge',
    },
  };

  // Generate maze with path
  const generateMaze = useCallback(level => {
    const config = mazeConfigs[level];
    const size = config.size;
    const maze = Array(size)
      .fill(null)
      .map(() => Array(size).fill(''));

    // Generate a random path from start to end
    const path = generatePath(size);

    // Place target letter along the path
    const targetPosition = path[Math.floor(path.length / 2)];
    maze[targetPosition.row][targetPosition.col] = config.targetLetter;

    // Place distractors randomly
    const emptyPositions = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (maze[i][j] === '') {
          emptyPositions.push({ row: i, col: j });
        }
      }
    }

    // Shuffle and place distractors
    const shuffledPositions = emptyPositions.sort(() => Math.random() - 0.5);
    config.distractors.forEach((distractor, index) => {
      if (shuffledPositions[index]) {
        const pos = shuffledPositions[index];
        maze[pos.row][pos.col] = distractor;
      }
    });

    return {
      grid: maze,
      path: path,
      targetPosition: targetPosition,
      config: config,
    };
  }, []);

  // Generate a valid path from start to end
  const generatePath = size => {
    const path = [];
    let currentRow = 0;
    let currentCol = 0;

    // Start from top-left
    path.push({ row: currentRow, col: currentCol });

    // Generate path to bottom-right
    while (currentRow < size - 1 || currentCol < size - 1) {
      const canGoRight = currentCol < size - 1;
      const canGoDown = currentRow < size - 1;

      if (canGoRight && canGoDown) {
        // Randomly choose direction
        if (Math.random() > 0.5) {
          currentCol++;
        } else {
          currentRow++;
        }
      } else if (canGoRight) {
        currentCol++;
      } else if (canGoDown) {
        currentRow++;
      }

      path.push({ row: currentRow, col: currentCol });
    }

    return path;
  };

  // Start game
  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(90); // 1 minute 30 seconds
    setCurrentLevel(1);
    setCompletedMazes(0);
    setTotalAttempts(0);
    setResponseTimes([]);
    setGameStartTime(Date.now());
    setCorrectAnswers(0);
    setInteractionLog([]);
    loadNewMaze();
    setStartTime(Date.now());

    // Show game start toast
    toast.success('Game started! Find the target letters in each maze! 🔍', { duration: 2000 });
  };

  // Restart game
  const restartGame = () => {
    setShowInstructions(true);
    setGameStarted(false);
    setGameOver(false);
    setShowResults(false);
    setScore(0);
    setTimeLeft(90); // 1 minute 30 seconds
    setCurrentLevel(1);
    setCompletedMazes(0);
    setTotalAttempts(0);
    setResponseTimes([]);
    setUserPath([]);
    setIsCorrect(null);
    setFeedback(null);

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

  // Load new maze
  const loadNewMaze = () => {
    const newMaze = generateMaze(currentLevel);
    setCurrentMaze(newMaze);
    setUserPath([]);
    setIsCorrect(null);
    setFeedback(null);
    setStartTime(Date.now());

    // Show new maze toast
    toast.success(`New maze loaded! Find letter ${newMaze.config.targetLetter} 🔍`, {
      duration: 1500,
    });
  };

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (isPaused || gameOver) return;

    const cellValue = currentMaze.grid[row][col];
    const newPath = [...userPath, { row, col, value: cellValue }];
    setUserPath(newPath);

    // Track interaction
    const interactionEntry = {
      timestamp: Date.now(),
      type: 'cell_click',
      row: row,
      col: col,
      cellValue: cellValue,
      targetLetter: currentMaze.config.targetLetter,
      isCorrect: cellValue === currentMaze.config.targetLetter,
      currentLevel: currentLevel,
    };
    setInteractionLog(prev => [...prev, interactionEntry]);

    // Check if clicked on target letter
    if (cellValue === currentMaze.config.targetLetter) {
      const responseTime = Date.now() - startTime;
      setResponseTimes(prev => [...prev, responseTime]);
      setCorrectAnswers(prev => prev + 1);

      setIsCorrect(true);
      setScore(prev => prev + 10);
      const newCompletedMazes = completedMazes + 1;
      setCompletedMazes(newCompletedMazes);
      setFeedback('Correct! You found the target letter!');

      // Show success toast
      toast.success(`Correct! Found ${currentMaze.config.targetLetter} ✅`, { duration: 1500 });

      // Show milestone toasts
      if (newCompletedMazes === 1) {
        toast.success('🎉 First maze completed! Great start!', { duration: 2000 });
      } else if (newCompletedMazes === 3) {
        toast.success('🚀 Halfway there! 3 mazes completed!', { duration: 2000 });
      } else if (newCompletedMazes === 5) {
        toast.success('🏆 All 5 mazes completed! Perfect!', { duration: 2000 });
      }

      // Move to next level or end game
      setTimeout(() => {
        if (newCompletedMazes < 5) {
          // Allow completion of 5th maze (0-4 = 5 mazes)
          setCurrentLevel(prev => prev + 1);

          // Show level progression toast
          toast.success(`Level ${currentLevel + 1} unlocked! 🚀`, { duration: 2000 });

          loadNewMaze();
        } else {
          toast.success('🎉 All levels completed! Amazing job!', { duration: 2000 });
          handleGameOver();
        }
      }, 1500);
    } else {
      setIsCorrect(false);
      setFeedback('Wrong! Try again to find the target letter.');

      // Show error toast
      toast.error(`Incorrect! Keep looking for ${currentMaze.config.targetLetter} ❌`, {
        duration: 1500,
      });

      setTimeout(() => {
        setUserPath([]);
        setIsCorrect(null);
        setFeedback(null);
      }, 1000);
    }

    setTotalAttempts(prev => prev + 1);
  };

  // Handle game over
  const handleGameOver = () => {
    setGameOver(true);
    const stats = calculateStats();
    setGameStats(stats);
    setShowResults(true);
    endGame();
  };

  const endGame = async () => {
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'visual-tracking-maze',
      gameType: 'visual-tracking-maze',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: correctAnswers,
      totalAttempts: totalAttempts,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        completedMazes: completedMazes,
        currentLevel: currentLevel,
        responseTimes: responseTimes,
        interactionLog: interactionLog,
        totalInteractions: interactionLog.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 VisualTrackingMaze completed in suite mode, calling onGameComplete');
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
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          completedMazes: completedMazes,
          currentLevel: currentLevel,
          responseTimes: responseTimes,
          interactionLog: interactionLog,
          totalInteractions: interactionLog.length,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'visual-tracking-maze',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing visual-tracking-maze data or initialize
      const existingVisualTrackingMaze = existingData['visual-tracking-maze'] || {};

      // Update with new session data
      const updatedVisualTrackingMaze = {
        ...existingVisualTrackingMaze,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingVisualTrackingMaze.playCount || 0) + 1,
        bestScore: Math.max(existingVisualTrackingMaze.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingVisualTrackingMaze.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingVisualTrackingMaze.sessions || []),
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

      existingData['visual-tracking-maze'] = updatedVisualTrackingMaze;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'visual-tracking-maze',
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

  // Calculate game statistics
  const calculateStats = () => {
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const accuracy = totalAttempts > 0 ? (completedMazes / totalAttempts) * 100 : 0;

    return {
      score,
      completedMazes,
      totalAttempts,
      accuracy: Math.round(accuracy),
      avgResponseTime: Math.round(avgResponseTime),
      levelsCompleted: currentLevel - 1,
    };
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            toast.error("Time's up! ⏰ Game Over!", { duration: 2000 });
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused, timeLeft]);

  // Format time
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        {/* Enhanced Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-text dark:text-white leading-tight">
            Visual Tracking Maze
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Follow the visual path and find the target letter in each maze
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
                    <EyeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Find the target letter in each maze as quickly as possible
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <MapIcon className="w-5 h-5 mr-2 text-indigo-500" />
                      How to Play:
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Look for the target letter in each maze
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Click on the correct letter to proceed
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Avoid clicking on distractor letters
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        Complete all 5 levels to finish
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
                        +10 points for correct letter
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        Speed and accuracy matter
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        Complete levels to advance
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>7 minutes
                        time limit
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
                      {gameStats?.score || 0}
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
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Mazes Completed
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {gameStats?.completedMazes || 0}/5
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
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Accuracy</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {gameStats?.accuracy || 0}%
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
        {gameStarted && !gameOver && currentMaze && (
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
                  {completedMazes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
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

            {/* Level Info */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 backdrop-blur-sm rounded-full px-6 py-3 mb-4 border border-indigo-200 dark:border-indigo-800"
              >
                <span className="text-2xl">{currentMaze.config.emoji}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Level {currentLevel}
                </span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  Find: {currentMaze.config.targetLetter}
                </span>
              </motion.div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {currentMaze.config.description}
              </p>
            </div>

            {/* Enhanced Maze Grid */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex justify-center w-full">
                  <div
                    className="grid gap-2 sm:gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${currentMaze.config.size}, 1fr)`,
                      width: 'fit-content',
                      maxWidth: '100%',
                    }}
                  >
                    {currentMaze.grid.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const isInUserPath = userPath.some(
                          p => p.row === rowIndex && p.col === colIndex
                        );
                        const isTarget = cell === currentMaze.config.targetLetter;

                        return (
                          <motion.button
                            key={`${rowIndex}-${colIndex}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            disabled={isPaused || cell === ''}
                            className={`
                            w-20 h-20 rounded-xl text-2xl font-bold flex items-center justify-center transition-all duration-300 shadow-lg
                            ${
                              cell === ''
                                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
                                : isInUserPath
                                  ? isTarget
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl scale-105'
                                    : 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-xl scale-105'
                                  : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 cursor-pointer border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                            }
                            ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          >
                            {cell}
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center text-lg font-medium p-4 rounded-xl ${
                    isCorrect
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isCorrect ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <XMarkIcon className="w-6 h-6" />
                    )}
                    {feedback}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Indicator */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50 dark:border-gray-700/50">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Progress: {completedMazes}/5 levels
                </span>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedMazes / 5) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {Math.round((completedMazes / 5) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VisualTrackingMaze;
