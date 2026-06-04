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
  SpeakerWaveIcon,
  PrinterIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const MemoryMatch = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Enhanced word list with audio support
  const wordList = [
    { word: 'cat', audio: 'cat.mp3', emoji: '🐱' },
    { word: 'dog', audio: 'dog.mp3', emoji: '🐕' },
    { word: 'bird', audio: 'bird.mp3', emoji: '🐦' },
    { word: 'fish', audio: 'fish.mp3', emoji: '🐟' },
    { word: 'house', audio: 'house.mp3', emoji: '🏠' },
    { word: 'tree', audio: 'tree.mp3', emoji: '🌳' },
    { word: 'book', audio: 'book.mp3', emoji: '📚' },
    { word: 'ball', audio: 'ball.mp3', emoji: '⚽' },
    { word: 'star', audio: 'star.mp3', emoji: '⭐' },
    { word: 'moon', audio: 'moon.mp3', emoji: '🌙' },
    { word: 'sun', audio: 'sun.mp3', emoji: '☀️' },
    { word: 'car', audio: 'car.mp3', emoji: '🚗' },
  ];

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused, timeLeft]);

  // Handle game over
  const handleGameOver = async () => {
    setGameOver(true);
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'memory-match',
      gameType: 'memory-match',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: correctAnswers,
      totalAttempts: totalAttempts,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        matchedPairs: matchedPairs.length,
        totalPairs: wordList.length,
        responseTimes: responseTimes,
        interactionLog: interactionLog,
        totalInteractions: interactionLog.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 MemoryMatch completed in suite mode, calling onGameComplete');
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
          matchedPairs: matchedPairs.length,
          totalPairs: wordList.length,
          responseTimes: responseTimes,
          interactionLog: interactionLog,
          totalInteractions: interactionLog.length,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'memory-match',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing memory-match data or initialize
      const existingMemoryMatch = existingData['memory-match'] || {};

      // Update with new session data
      const updatedMemoryMatch = {
        ...existingMemoryMatch,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingMemoryMatch.playCount || 0) + 1,
        bestScore: Math.max(existingMemoryMatch.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingMemoryMatch.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingMemoryMatch.sessions || []),
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

      existingData['memory-match'] = updatedMemoryMatch;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'memory-match',
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
    setTimeLeft(300);
    setScore(0);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setMatchedPairs([]);
    setFlippedCards([]);
    setIsPaused(false);
    setGameStartTime(Date.now());
    setInteractionLog([]);
    setResponseTimes([]);
    initializeCards();
  };

  const initializeCards = () => {
    // Create pairs of cards (text and audio)
    const cardPairs = wordList.map((word, index) => [
      {
        id: `text-${index}`,
        type: 'text',
        content: word.word,
        pairId: index,
        emoji: word.emoji,
      },
      {
        id: `audio-${index}`,
        type: 'audio',
        content: word.audio,
        pairId: index,
        emoji: word.emoji,
      },
    ]);

    // Flatten and shuffle
    const allCards = cardPairs.flat().sort(() => Math.random() - 0.5);
    setCards(allCards);
  };

  const handleCardClick = cardId => {
    if (isPaused || flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || flippedCards.some(fc => fc.id === cardId)) return;

    const clickTime = Date.now();
    const responseTime = startTime ? clickTime - startTime : 0;
    setResponseTimes(prev => [...prev, responseTime]);
    setTotalAttempts(prev => prev + 1);

    // Track interaction
    const interaction = {
      timestamp: new Date().toISOString(),
      type: 'card_click',
      cardId: cardId,
      cardType: card.type,
      responseTime: responseTime,
    };
    setInteractionLog(prev => [...prev, interaction]);

    const newFlippedCards = [...flippedCards, card];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      // Check for match
      const [card1, card2] = newFlippedCards;
      const isMatch = card1.pairId === card2.pairId;

      if (isMatch) {
        const newMatchedPairs = [...matchedPairs, card1.pairId];
        setMatchedPairs(newMatchedPairs);
        setScore(prev => prev + 10);
        setCorrectAnswers(prev => prev + 1);
        toast.success('Match found! 🎉', { duration: 1000 });

        // Check if all pairs are matched
        if (newMatchedPairs.length === wordList.length) {
          toast.success('🎉 All pairs matched! Game completed!', { duration: 2000 });
          // Complete the game immediately
          setTimeout(() => {
            handleGameOver();
          }, 1500); // Give a moment for the success message
          return;
        }
      } else {
        toast.error('No match! Try again.', { duration: 1000 });
      }

      // Reset flipped cards after a delay
      setTimeout(() => {
        setFlippedCards([]);
      }, 1000);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const restartGame = () => {
    setShowInstructions(true);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCurrentRound(1);
    setTimeLeft(300);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setMatchedPairs([]);
    setFlippedCards([]);
    setIsPaused(false);
    setInteractionLog([]);
    setResponseTimes([]);
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
            Memory Match
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Match written words with their audio pronunciations to test your memory
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
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Match written words with their audio pronunciations
                  </p>
                </div>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <p>Click on cards to reveal their content</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <p>Find matching pairs of text and audio cards</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <p>Complete all pairs before time runs out</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      4
                    </div>
                    <p>Use audio to help with word recognition</p>
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
                      {totalAttempts - correctAnswers}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Incorrect Matches
                    </div>
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
                <div className="text-2xl font-bold">{matchedPairs.length}</div>
                <div className="text-sm opacity-90">Pairs Found</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-4 text-white text-center"
              >
                <div className="text-2xl font-bold">{wordList.length}</div>
                <div className="text-sm opacity-90">Total Pairs</div>
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

            {/* Game Board */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cards.map(card => {
                const isFlipped = flippedCards.some(fc => fc.id === card.id);
                const isMatched = matchedPairs.includes(card.pairId);
                const isClickable =
                  !isFlipped && !isMatched && flippedCards.length < 2 && !isPaused;

                return (
                  <motion.div
                    key={card.id}
                    whileHover={isClickable ? { scale: 1.05 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                    onClick={() => isClickable && handleCardClick(card.id)}
                    className={`aspect-square rounded-xl cursor-pointer transition-all duration-300 ${
                      isMatched
                        ? 'bg-green-500 text-white'
                        : isFlipped
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                    } ${!isClickable ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="h-full flex flex-col items-center justify-center p-2">
                      {isFlipped || isMatched ? (
                        <>
                          <div className="text-2xl mb-1">{card.emoji}</div>
                          <div className="text-sm font-medium text-center">
                            {card.type === 'text' ? card.content : '🎵 Audio'}
                          </div>
                        </>
                      ) : (
                        <div className="text-2xl">❓</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MemoryMatch;
