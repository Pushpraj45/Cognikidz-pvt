import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from '@heroicons/react/24/solid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const WordSequenceBuilder = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState('Easy');
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);
  const [usedWords, setUsedWords] = useState(new Set()); // Track used words

  // Enhanced word list with automatic difficulty progression
  const wordList = {
    Easy: [
      { word: 'cat', category: 'Animals' },
      { word: 'dog', category: 'Animals' },
      { word: 'fish', category: 'Animals' },
      { word: 'bird', category: 'Animals' },
      { word: 'tree', category: 'Nature' },
      { word: 'book', category: 'Objects' },
      { word: 'sun', category: 'Nature' },
      { word: 'moon', category: 'Nature' },
      { word: 'star', category: 'Nature' },
      { word: 'rain', category: 'Nature' },
    ],
    Medium: [
      { word: 'house', category: 'Places' },
      { word: 'school', category: 'Places' },
      { word: 'friend', category: 'People' },
      { word: 'family', category: 'People' },
      { word: 'garden', category: 'Places' },
      { word: 'window', category: 'Objects' },
      { word: 'pencil', category: 'Objects' },
      { word: 'basket', category: 'Objects' },
      { word: 'kitchen', category: 'Places' },
      { word: 'teacher', category: 'People' },
    ],
    Hard: [
      { word: 'elephant', category: 'Animals' },
      { word: 'butterfly', category: 'Animals' },
      { word: 'computer', category: 'Technology' },
      { word: 'beautiful', category: 'Descriptions' },
      { word: 'adventure', category: 'Activities' },
      { word: 'knowledge', category: 'Concepts' },
      { word: 'happiness', category: 'Emotions' },
      { word: 'mountain', category: 'Nature' },
      { word: 'birthday', category: 'Events' },
      { word: 'rainbow', category: 'Nature' },
    ],
  };

  // Calculate total available words
  const getTotalAvailableWords = () => {
    return wordList.Easy.length + wordList.Medium.length + wordList.Hard.length;
  };

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (gameStarted && timeLeft === 0) {
      setGameOver(true);
      endGame();
    }
  }, [gameStarted, timeLeft, isPaused]);

  const endGame = async () => {
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'word-sequence-builder',
      gameType: 'word-sequence-builder',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: correctAnswers,
      totalAttempts: totalAttempts,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        currentRound: currentRound,
        currentDifficulty: currentDifficulty,
        interactionLog: interactionLog,
        totalInteractions: interactionLog.length,
        correctWords: correctAnswers, // Add correct words count
        totalWords: usedWords.size, // Total words attempted
        roundsCompleted: usedWords.size, // Fix round counting
        totalAvailableWords: getTotalAvailableWords(),
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 WordSequenceBuilder completed in suite mode, calling onGameComplete');
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
          currentRound: currentRound,
          currentDifficulty: currentDifficulty,
          interactionLog: interactionLog,
          totalInteractions: interactionLog.length,
          correctWords: correctAnswers, // Add correct words count
          totalWords: usedWords.size, // Total words attempted
          roundsCompleted: usedWords.size, // Fix round counting
          totalAvailableWords: getTotalAvailableWords(),
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'word-sequence-builder',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing word-sequence-builder data or initialize
      const existingWordSequenceBuilder = existingData['word-sequence-builder'] || {};

      // Update with new session data
      const updatedWordSequenceBuilder = {
        ...existingWordSequenceBuilder,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingWordSequenceBuilder.playCount || 0) + 1,
        bestScore: Math.max(existingWordSequenceBuilder.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingWordSequenceBuilder.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingWordSequenceBuilder.sessions || []),
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

      existingData['word-sequence-builder'] = updatedWordSequenceBuilder;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'word-sequence-builder',
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
    setTimeLeft(600);
    setScore(0);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setSelectedLetters([]);
    setIsCorrect(null);
    setIsPaused(false);
    setCurrentDifficulty('Easy');
    setUsedWords(new Set()); // Reset used words
    setGameStartTime(Date.now());
    setInteractionLog([]);
    loadNewWord();
  };

  const loadNewWord = () => {
    // Get all available words for current difficulty and below
    let availableWords = [];
    if (currentDifficulty === 'Easy') {
      availableWords = [...wordList.Easy];
    } else if (currentDifficulty === 'Medium') {
      availableWords = [...wordList.Easy, ...wordList.Medium];
    } else {
      availableWords = [...wordList.Easy, ...wordList.Medium, ...wordList.Hard];
    }

    // Filter out already used words
    const unusedWords = availableWords.filter(word => !usedWords.has(word.word));

    // If no unused words available, end the game
    if (unusedWords.length === 0) {
      console.log('🎮 All words completed, ending game early');
      endGame();
      return;
    }

    // Select a random unused word
    const randomWord = unusedWords[Math.floor(Math.random() * unusedWords.length)];
    setCurrentWord(randomWord);
    setUsedWords(prev => new Set([...prev, randomWord.word]));

    // Create shuffled letters array
    const letters = randomWord.word.split('').map((letter, index) => ({
      letter: letter,
      originalIndex: index,
    }));

    // Shuffle the letters
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setShuffledLetters(shuffled);
    setSelectedLetters([]);
  };

  const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleLetterClick = (letter, index) => {
    if (selectedLetters.length < currentWord.word.length) {
      setSelectedLetters([...selectedLetters, { letter: letter.letter, originalIndex: index }]);

      // Track interaction
      const interactionEntry = {
        timestamp: Date.now(),
        type: 'letter_click',
        letter: letter.letter,
        index: index,
        currentWord: currentWord?.word || '',
        selectedLettersCount: selectedLetters.length + 1,
      };
      setInteractionLog(prev => [...prev, interactionEntry]);
    }
  };

  const handleSelectedLetterClick = index => {
    const newSelectedLetters = [...selectedLetters];
    newSelectedLetters.splice(index, 1);
    setSelectedLetters(newSelectedLetters);

    // Track interaction
    const interactionEntry = {
      timestamp: Date.now(),
      type: 'letter_remove',
      index: index,
      currentWord: currentWord?.word || '',
      selectedLettersCount: newSelectedLetters.length,
    };
    setInteractionLog(prev => [...prev, interactionEntry]);
  };

  const checkWord = () => {
    if (!currentWord || selectedLetters.length === 0) return;

    const attemptedWord = selectedLetters.map(letterObj => letterObj.letter).join('');
    const isWordCorrect = attemptedWord.toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(isWordCorrect);
    setTotalAttempts(prev => prev + 1);

    if (isWordCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
      toast.success('Correct! Well done!', { duration: 1000 });

      // Log interaction
      const interaction = {
        type: 'word_completed',
        word: currentWord.word,
        attemptedWord: attemptedWord,
        isCorrect: true,
        timestamp: Date.now(),
        timeSinceStart: gameStartTime ? Date.now() - gameStartTime : 0,
        round: currentRound,
        difficulty: currentDifficulty,
      };
      setInteractionLog(prev => [...prev, interaction]);

      // Move to next round after a short delay
      setTimeout(() => {
        nextRound();
      }, 1000);
    } else {
      toast.error(`Incorrect. The correct word was "${currentWord.word}"`, { duration: 2000 });

      // Log interaction
      const interaction = {
        type: 'word_attempted',
        word: currentWord.word,
        attemptedWord: attemptedWord,
        isCorrect: false,
        timestamp: Date.now(),
        timeSinceStart: gameStartTime ? Date.now() - gameStartTime : 0,
        round: currentRound,
        difficulty: currentDifficulty,
      };
      setInteractionLog(prev => [...prev, interaction]);
    }
  };

  const nextRound = () => {
    setCurrentRound(prev => prev + 1);
    loadNewWord();
    setIsCorrect(null);
  };

  const resetCurrentWord = () => {
    setSelectedLetters([]);
    setIsCorrect(null);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setTimeLeft(600);
    setScore(0);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setSelectedLetters([]);
    setIsCorrect(null);
    setIsPaused(false);
    setCurrentDifficulty('Easy');
    setUsedWords(new Set()); // Reset used words
    setShowInstructions(true);
  };

  const playAgain = () => {
    startGame();
  };

  const returnToGames = () => {
    // Get childId from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const childId = urlParams.get('childId');
    const targetUrl = childId
      ? `/assessment/games/dyslexia?childId=${childId}`
      : '/assessment/games/dyslexia';
    navigate(targetUrl);
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            Word Sequence Builder
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Drag and drop letters to form words from shuffled letters
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
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Build words by arranging letters in the correct order
                  </p>
                </div>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <p>Click letters to add them to your word</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <p>Click selected letters to remove them if needed</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <p>Click "Check Word" when you think it's correct</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      4
                    </div>
                    <p>Difficulty increases automatically as you progress!</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary/20 shadow-lg"
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
                      <ClockIcon className="w-6 h-6 text-green-500 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Rounds Completed
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {usedWords.size}
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600">
                  {usedWords.size}/{getTotalAvailableWords()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Words Completed</div>
              </div>

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
                  {currentDifficulty}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
              </motion.div>
            </div>

            {/* Word Category */}
            {currentWord && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6"
              >
                <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                  Category: {currentWord.category}
                </span>
              </motion.div>
            )}

            {/* Selected Letters Area */}
            <div className="min-h-[120px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center gap-3 mb-8">
              {selectedLetters.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-center">
                  Click letters below to build your word
                </p>
              ) : (
                selectedLetters.map((letter, index) => (
                  <motion.button
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleSelectedLetterClick(index)}
                    className="w-14 h-14 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-2xl font-bold flex items-center justify-center cursor-pointer hover:opacity-80 transition-all duration-300 shadow-lg"
                  >
                    {letter.letter}
                  </motion.button>
                ))
              )}
            </div>

            {/* Available Letters */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {shuffledLetters.map((letter, index) => (
                <motion.button
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleLetterClick(letter, index)}
                  disabled={selectedLetters.some(l => l.originalIndex === index) || isPaused}
                  className={`w-14 h-14 rounded-xl text-2xl font-bold flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                    selectedLetters.some(l => l.originalIndex === index) || isPaused
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {letter.letter}
                </motion.button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={checkWord}
                disabled={selectedLetters.length !== currentWord?.word.length || isPaused}
                className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 ${
                  selectedLetters.length === currentWord?.word.length && !isPaused
                    ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <TrophyIcon className="w-5 h-5" />
                Check Word
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetCurrentWord}
                disabled={isPaused}
                className="px-8 py-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Reset
              </motion.button>
            </div>

            {/* Feedback Message */}
            <AnimatePresence>
              {isCorrect !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center text-lg font-medium mt-6 ${
                    isCorrect
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isCorrect ? 'Correct! Well done!' : 'Try again!'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Round Button */}
            <AnimatePresence>
              {isCorrect === true && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <button
                    onClick={nextRound}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-all duration-300 shadow-lg"
                  >
                    Next Word ({usedWords.size + 1}/{getTotalAvailableWords()})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WordSequenceBuilder;
