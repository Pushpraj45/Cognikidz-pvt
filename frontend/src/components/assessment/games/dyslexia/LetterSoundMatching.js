import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  SpeakerWaveIcon,
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
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const LetterSoundMatching = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [interactionLog, setInteractionLog] = useState([]);

  // Sample letter sounds and their corresponding letters
  const letterSounds = [
    {
      letter: 'a',
      options: ['a', 'e', 'i', 'o'],
      description: 'Short A sound (as in "apple")',
      word: 'apple',
    },
    {
      letter: 'b',
      options: ['b', 'd', 'p', 'q'],
      description: 'B sound (as in "ball")',
      word: 'ball',
    },
    {
      letter: 'c',
      options: ['c', 'k', 's', 'z'],
      description: 'Hard C sound (as in "cat")',
      word: 'cat',
    },
    {
      letter: 'd',
      options: ['b', 'd', 'p', 'q'],
      description: 'D sound (as in "dog")',
      word: 'dog',
    },
    {
      letter: 'e',
      options: ['a', 'e', 'i', 'o'],
      description: 'Short E sound (as in "egg")',
      word: 'egg',
    },
    {
      letter: 'f',
      options: ['f', 'v', 'ph'],
      description: 'F sound (as in "fish")',
      word: 'fish',
    },
    {
      letter: 'g',
      options: ['g', 'j', 'dg'],
      description: 'Hard G sound (as in "goat")',
      word: 'goat',
    },
    {
      letter: 'h',
      options: ['h', 'wh'],
      description: 'H sound (as in "hat")',
      word: 'hat',
    },
  ];

  const [currentSound, setCurrentSound] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (gameStarted && timeLeft === 0) {
      endGame();
    }
  }, [gameStarted, timeLeft, isPaused]);

  const endGame = async () => {
    setGameOver(true);
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'letter-sound-matching',
      gameType: 'letter-sound-matching',
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
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
        keystrokeData: keystrokeData,
        interactionLog: interactionLog,
        averageReactionTime:
          keystrokeData.length > 0
            ? keystrokeData.reduce((sum, data) => sum + data.timeSinceStart, 0) /
              keystrokeData.length
            : 0,
        totalInteractions: keystrokeData.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 LetterSoundMatching completed in suite mode, calling onGameComplete');
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
        roundsCompleted: currentRound - 1,
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          correctAnswers: correctAnswers,
          totalAttempts: totalAttempts,
          correctWords: correctAnswers,
          incorrectWords: totalAttempts - correctAnswers,
          keystrokeData: keystrokeData,
          interactionLog: interactionLog,
          averageReactionTime:
            keystrokeData.length > 0
              ? keystrokeData.reduce((sum, data) => sum + data.timeSinceStart, 0) /
                keystrokeData.length
              : 0,
          totalInteractions: keystrokeData.length,
        },
      };

      // Save to backend using the same pattern as ADHD games
      await AssessmentService.completeGame(
        sessionId,
        'letter-sound-matching',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Update local storage for game performance tracking
      const existingPerformance = JSON.parse(
        localStorage.getItem(`dyslexia_games_performance_${childId}`) || '{}'
      );

      const updatedPerformance = {
        ...existingPerformance,
        'letter-sound-matching': {
          score: score,
          accuracy: accuracyScore,
          bestScore: Math.max(existingPerformance['letter-sound-matching']?.bestScore || 0, score),
          playCount: (existingPerformance['letter-sound-matching']?.playCount || 0) + 1,
          lastPlayed: new Date().toISOString(),
          totalTime: totalTimeTaken,
          correctAnswers: correctAnswers,
          totalAttempts: totalAttempts,
        },
      };

      localStorage.setItem(
        `dyslexia_games_performance_${childId}`,
        JSON.stringify(updatedPerformance)
      );

      // Dispatch game completion event for real-time updates
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            gameId: 'letter-sound-matching',
            childId: childId,
            performanceData: performanceData,
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
    setGameStartTime(Date.now());
    setTimeLeft(60);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setCurrentRound(1);
    setGameOver(false);
    setKeystrokeData([]);
    setInteractionLog([]);
    loadNewRound();
  };

  const loadNewRound = () => {
    const randomSound = letterSounds[Math.floor(Math.random() * letterSounds.length)];
    setCurrentSound(randomSound);
    setShuffledOptions(shuffleArray([...randomSound.options]));
  };

  const shuffleArray = array => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const playSound = () => {
    if (isPlaying) return;

    setIsPlaying(true);
    setSoundError(false);

    // Simulate sound playing
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000);

    // Log interaction
    const interaction = {
      type: 'sound_played',
      timestamp: Date.now(),
      timeSinceStart: gameStartTime ? Date.now() - gameStartTime : 0,
    };
    setInteractionLog(prev => [...prev, interaction]);
  };

  const handleOptionClick = option => {
    if (!currentSound) return;

    const isCorrect = option === currentSound.letter;
    const clickTime = Date.now();
    const timeSinceStart = gameStartTime ? clickTime - gameStartTime : 0;

    // Log keystroke data
    const keystroke = {
      key: option,
      timestamp: clickTime,
      timeSinceStart: timeSinceStart,
      isCorrect: isCorrect,
      expectedKey: currentSound.letter,
    };
    setKeystrokeData(prev => [...prev, keystroke]);

    // Log interaction
    const interaction = {
      type: 'option_selected',
      selectedOption: option,
      correctOption: currentSound.letter,
      isCorrect: isCorrect,
      timestamp: clickTime,
      timeSinceStart: timeSinceStart,
    };
    setInteractionLog(prev => [...prev, interaction]);

    setTotalAttempts(prev => prev + 1);

    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => prev + 1);
      toast.success('Correct! 🎉', { duration: 1000 });
    } else {
      toast.error(`Incorrect. The correct answer was "${currentSound.letter.toUpperCase()}"`, {
        duration: 2000,
      });
    }

    setCurrentRound(prev => prev + 1);
    loadNewRound();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setShowInstructions(true);
  };

  const playAgain = () => {
    setGameOver(false);
    setShowInstructions(true);
  };

  const returnToGames = () => {
    const targetUrl = `/assessment/games/dyslexia?childId=${childId}`;
    navigate(targetUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-accent/8 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Animated decorative elements */}
        <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-primary rounded-full animate-float"></div>
        <div
          className="absolute top-[30%] right-[15%] w-3 h-3 bg-secondary rounded-full animate-float"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-accent rounded-full animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-[60%] right-[25%] w-3 h-3 bg-primary rounded-full animate-float"
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
            Letter-Sound Matching
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Listen carefully and match the sound you hear to the correct letter
          </p>
        </motion.div>

        {/* Simple Game Instructions */}
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-8"
          >
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <SpeakerWaveIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">🎯 Letter-Sound Matching</h1>
                <p className="text-blue-200 mb-6 text-lg">
                  Listen carefully and match the sound you hear to the correct letter
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">🎯 Game Instructions:</h3>
                <ul className="text-left space-y-4 text-blue-100">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="text-lg">
                      Click the speaker icon to hear a letter sound 🔊
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="text-lg">
                      Select the letter that matches the sound you heard 📝
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-lg">
                      You have 60 seconds to match as many sounds as possible ⏰
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <span className="text-lg">Try to get the highest score! 🏆</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={startGame}
                className="px-10 py-5 bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold text-xl rounded-2xl hover:from-blue-300 hover:to-indigo-400 transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-blue-300"
              >
                <PlayIcon className="w-7 h-7 inline mr-3" />
                Start Game
              </button>
            </div>
          </motion.div>
        )}

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
                      {score}
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
                      {totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center">
                      <StarIcon className="w-6 h-6 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Correct Words
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {correctAnswers}
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
                    onClick={playAgain}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary/20"
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
        {gameStarted && !gameOver && (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentRound}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Round</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800"
              >
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 text-center border border-orange-200 dark:border-orange-800"
              >
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {timeLeft}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Left</div>
              </motion.div>
            </div>

            {/* Enhanced Sound Player */}
            <div className="flex flex-col items-center mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playSound}
                disabled={isPlaying}
                className={`p-6 rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-2xl ${
                  isPlaying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <SpeakerWaveIcon className="w-10 h-10" />
              </motion.button>

              {soundError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-3 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg"
                >
                  Error playing sound. Please try again.
                </motion.p>
              )}

              <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
                Click the speaker to hear the letter sound
              </p>
            </div>

            {/* Enhanced Letter Options */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {shuffledOptions.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOptionClick(option)}
                  className="p-6 text-3xl font-bold bg-white dark:bg-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 border border-gray-200 dark:border-gray-600 hover:border-primary/30 dark:hover:border-primary/30"
                >
                  {option.toUpperCase()}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LetterSoundMatching;
