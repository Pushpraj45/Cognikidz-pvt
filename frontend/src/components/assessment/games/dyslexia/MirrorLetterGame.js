import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  ArrowPathIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  PauseIcon,
  SparklesIcon,
  AcademicCapIcon,
  HeartIcon,
  StarIcon,
  EyeIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const MirrorLetterGame = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100); // 1 minute 40 seconds
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentLetter, setCurrentLetter] = useState('');
  const [isMirrored, setIsMirrored] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Letter sets for different difficulty levels
  const letterSets = {
    standard: [
      { letter: 'b', mirrored: 'd' },
      { letter: 'd', mirrored: 'b' },
      { letter: 'p', mirrored: 'q' },
      { letter: 'q', mirrored: 'p' },
      { letter: 'w', mirrored: 'm' },
      { letter: 'm', mirrored: 'w' },
      { letter: 'u', mirrored: 'n' },
      { letter: 'n', mirrored: 'u' },
      { letter: 's', mirrored: 'z' },
      { letter: 'z', mirrored: 's' },
      { letter: 'c', mirrored: 'ɔ' },
      { letter: 'ɔ', mirrored: 'c' },
      { letter: 'e', mirrored: 'ə' },
      { letter: 'ə', mirrored: 'e' },
      { letter: 'a', mirrored: 'ɐ' },
      { letter: 'ɐ', mirrored: 'a' },
      { letter: 'g', mirrored: '6' },
      { letter: '6', mirrored: 'g' },
      { letter: 'l', mirrored: '7' },
      { letter: '7', mirrored: 'l' },
      { letter: 't', mirrored: 'f' },
      { letter: 'f', mirrored: 't' },
      { letter: 'h', mirrored: 'H' },
      { letter: 'H', mirrored: 'h' },
      { letter: 'i', mirrored: 'ı' },
      { letter: 'ı', mirrored: 'i' },
      { letter: 'j', mirrored: 'J' },
      { letter: 'J', mirrored: 'j' },
      { letter: 'k', mirrored: 'K' },
      { letter: 'K', mirrored: 'k' },
      { letter: 'o', mirrored: 'O' },
      { letter: 'O', mirrored: 'o' },
      { letter: 'r', mirrored: 'R' },
      { letter: 'R', mirrored: 'r' },
      { letter: 'v', mirrored: 'V' },
      { letter: 'V', mirrored: 'v' },
      { letter: 'x', mirrored: 'X' },
      { letter: 'X', mirrored: 'x' },
      { letter: 'y', mirrored: 'Y' },
      { letter: 'Y', mirrored: 'y' },
    ],
    dyslexic: [
      { letter: 'b', mirrored: 'd' },
      { letter: 'd', mirrored: 'b' },
      { letter: 'p', mirrored: 'q' },
      { letter: 'q', mirrored: 'p' },
      { letter: 'w', mirrored: 'm' },
      { letter: 'm', mirrored: 'w' },
      { letter: 'u', mirrored: 'n' },
      { letter: 'n', mirrored: 'u' },
      { letter: '6', mirrored: '9' },
      { letter: '9', mirrored: '6' },
      { letter: '2', mirrored: 'Z' },
      { letter: 'Z', mirrored: '2' },
      { letter: '5', mirrored: 'S' },
      { letter: 'S', mirrored: '5' },
      { letter: '0', mirrored: 'O' },
      { letter: 'O', mirrored: '0' },
      { letter: '1', mirrored: 'l' },
      { letter: 'l', mirrored: '1' },
      { letter: '8', mirrored: '∞' },
      { letter: '∞', mirrored: '8' },
      { letter: '3', mirrored: 'Ɛ' },
      { letter: 'Ɛ', mirrored: '3' },
      { letter: '4', mirrored: 'h' },
      { letter: 'h', mirrored: '4' },
    ],
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

  // Handle game over
  const handleGameOver = async () => {
    // Prevent multiple calls
    if (gameOver) {
      console.warn('handleGameOver called more than once, skipping duplicate save.');
      return;
    }
    setGameOver(true);
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'mirror-letter-game',
      gameType: 'mirror-letter-game',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: correctAnswers,
      totalAttempts: totalAttempts,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        roundsCompleted: currentRound - 1,
        responseTimes: responseTimes,
        interactionLog: interactionLog,
        totalInteractions: interactionLog.length,
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 MirrorLetterGame completed in suite mode, calling onGameComplete');
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
          roundsCompleted: currentRound - 1,
          responseTimes: responseTimes,
          interactionLog: interactionLog,
          totalInteractions: interactionLog.length,
          correctAnswers: correctAnswers,
          totalAttempts: totalAttempts,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'mirror-letter-game',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing mirror-letter-game data or initialize
      const existingMirrorLetterGame = existingData['mirror-letter-game'] || {};
      // Deduplicate sessions: only add if not already present (by sessionId + completedAt)
      const prevSessions = existingMirrorLetterGame.sessions || [];
      const newSession = {
        sessionId: sessionId,
        id: `${sessionId}_${performanceData.completedAt}`,
        score: score,
        accuracy: accuracyScore,
        completedAt: performanceData.completedAt,
        totalTime: totalTimeTaken,
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
        gameSpecificData: performanceData.gameSpecificData,
      };
      const isDuplicate = prevSessions.some(
        s => s.sessionId === newSession.sessionId && s.completedAt === newSession.completedAt
      );
      const updatedSessions = isDuplicate ? prevSessions : [...prevSessions, newSession];

      // Update with new session data
      const updatedMirrorLetterGame = {
        ...existingMirrorLetterGame,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingMirrorLetterGame.playCount || 0) + (isDuplicate ? 0 : 1),
        bestScore: Math.max(existingMirrorLetterGame.bestScore || 0, score),
        averageAccuracy: (() => {
          const allAccuracies = [...updatedSessions.map(s => s.accuracy)];
          return allAccuracies.length > 0
            ? Math.round(allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length)
            : 0;
        })(),
        sessions: updatedSessions,
      };

      existingData['mirror-letter-game'] = updatedMirrorLetterGame;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'mirror-letter-game',
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
    setTimeLeft(100); // 1 minute 40 seconds
    setScore(0);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setIsPaused(false);
    setGameStartTime(Date.now());
    setInteractionLog([]);
    setResponseTimes([]);
    generateNewLetter();

    // Show game start toast
    toast.success('Game started! Identify mirror letters! 🔄', { duration: 2000 });
  };

  // Generate new letter
  const generateNewLetter = useCallback(() => {
    const allLetters = [...letterSets.standard, ...letterSets.dyslexic];
    const randomLetterObj = allLetters[Math.floor(Math.random() * allLetters.length)];
    const shouldMirror = Math.random() > 0.5;
    setCurrentLetter(randomLetterObj.letter);
    setIsMirrored(shouldMirror);
    setStartTime(Date.now());
    setFeedback(null);
  }, []);

  // Handle letter response
  const handleResponse = isCorrect => {
    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => [...prev, responseTime]);
    setTotalAttempts(prev => prev + 1);

    // Track interaction
    const interaction = {
      timestamp: new Date().toISOString(),
      type: isCorrect ? 'correct_response' : 'incorrect_response',
      letter: currentLetter,
      isMirrored,
      responseTime,
      score: isCorrect ? 1 : 0,
    };
    setInteractionLog(prev => [...prev, interaction]);

    if (isCorrect) {
      setScore(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      setFeedback({ type: 'correct', message: 'Correct! Well done!' });
      toast.success('Correct! 🎉', { duration: 1000 });

      // Show milestone toasts
      const newScore = score + 1;
      if (newScore === 5) {
        toast.success('🎉 5 correct! Great progress!', { duration: 2000 });
      } else if (newScore === 10) {
        toast.success('🚀 10 correct! Excellent work!', { duration: 2000 });
      } else if (newScore === 15) {
        toast.success('🏆 15 correct! Amazing performance!', { duration: 2000 });
      }
    } else {
      setFeedback({ type: 'wrong', message: 'Oops! Try the next one.' });
      toast.error('Incorrect! Try again.', { duration: 1000 });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentRound(prev => prev + 1);
      generateNewLetter();
    }, 800);
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (newPausedState) {
      toast.success('Game Paused ⏸️', { duration: 1500 });
    } else {
      toast.success('Game Resumed ▶️', { duration: 1500 });
    }
  };

  const restartGame = () => {
    setShowInstructions(true);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCurrentRound(1);
    setTimeLeft(100); // 1 minute 40 seconds
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setIsPaused(false);
    setInteractionLog([]);
    setResponseTimes([]);

    // Show restart toast
    toast.success('Game restarted! 🔄', { duration: 1500 });
  };

  const returnToGames = () => {
    const targetUrl = `/assessment/games/dyslexia?childId=${childId}`;
    navigate(targetUrl);
  };

  const playAgain = () => {
    setGameOver(false);
    setShowInstructions(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-accent/8 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Animated decorative elements */}
        <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-purple-500 rounded-full animate-float"></div>
        <div
          className="absolute top-[30%] right-[15%] w-3 h-3 bg-pink-500 rounded-full animate-float"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-indigo-500 rounded-full animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-[60%] right-[25%] w-3 h-3 bg-purple-500 rounded-full animate-float"
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
            Mirror Letter Game
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Identify if letters are mirrored or normal to test visual processing
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
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/20 dark:border-gray-700/20"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EyeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Identify if letters are mirrored or normal
                  </p>
                </div>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <p>Look at the letter displayed on screen</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <p>Determine if it's normal or mirrored</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <p>Click "Normal" or "Mirrored" button</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      4
                    </div>
                    <p>Complete as many as you can before time runs out</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-purple-500/20 shadow-lg"
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
                    Great job! Here's your performance summary.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {accuracy}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {currentRound - 1}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rounds</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {Math.floor(totalTime)}s
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time Taken</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={playAgain}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:opacity-90 transition-all duration-300"
                  >
                    <ArrowPathIcon className="w-5 h-5 inline mr-2" />
                    Play Again
                  </motion.button>
                  {!suiteMode && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={returnToGames}
                      className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                    >
                      <ArrowLeftIcon className="w-5 h-5 inline mr-2" />
                      More Games
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Interface */}
        {gameStarted && !gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Game Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white text-center"
              >
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-sm opacity-90">Score</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white text-center"
              >
                <div className="text-2xl font-bold">{timeLeft}</div>
                <div className="text-sm opacity-90">Time Left</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white text-center"
              >
                <div className="text-2xl font-bold">{currentRound}</div>
                <div className="text-sm opacity-90">Round</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-4 text-white text-center"
              >
                <div className="text-2xl font-bold">{correctAnswers}</div>
                <div className="text-sm opacity-90">Correct</div>
              </motion.div>
            </div>

            {/* Game Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePause}
                className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              >
                {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={restartGame}
                className="px-6 py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Restart
              </motion.button>
            </div>

            {/* Letter Display */}
            <div className="text-center mb-8">
              <motion.div
                key={currentLetter + isMirrored}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl border-4 border-purple-200 dark:border-purple-800 max-w-md mx-auto"
              >
                <div className="text-8xl font-bold text-gray-900 dark:text-white mb-4">
                  {isMirrored ? currentLetter.split('').reverse().join('') : currentLetter}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  Is this letter normal or mirrored?
                </div>
              </motion.div>
            </div>

            {/* Response Buttons */}
            <div className="flex justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleResponse(!isMirrored)}
                disabled={isPaused}
                className="px-8 py-4 rounded-xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Normal
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleResponse(isMirrored)}
                disabled={isPaused}
                className="px-8 py-4 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mirrored
              </motion.button>
            </div>

            {/* Feedback Message */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center text-lg font-medium mt-6 ${
                    feedback.type === 'correct'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MirrorLetterGame;
