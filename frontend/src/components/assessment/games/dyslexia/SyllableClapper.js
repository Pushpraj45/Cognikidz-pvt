import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ClockIcon,
  HandRaisedIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

// Enhanced word sets with categories and emojis
const WORDS = [
  // 1 Syllable Words
  { word: 'cat', syllables: 1, category: 'Animals', emoji: '🐱', hint: 'A furry pet that purrs' },
  { word: 'dog', syllables: 1, category: 'Animals', emoji: '🐕', hint: "Man's best friend" },
  { word: 'fish', syllables: 1, category: 'Animals', emoji: '🐟', hint: 'Swims in water' },
  { word: 'book', syllables: 1, category: 'Objects', emoji: '📚', hint: 'Contains stories' },
  { word: 'sun', syllables: 1, category: 'Space', emoji: '☀️', hint: 'Shines in the sky' },
  { word: 'tree', syllables: 1, category: 'Nature', emoji: '🌳', hint: 'Tall plant with leaves' },
  {
    word: 'ball',
    syllables: 1,
    category: 'Sports',
    emoji: '⚽',
    hint: 'Round object to play with',
  },
  { word: 'house', syllables: 1, category: 'Buildings', emoji: '🏠', hint: 'Where people live' },
  { word: 'star', syllables: 1, category: 'Space', emoji: '⭐', hint: 'Shines at night' },
  { word: 'moon', syllables: 1, category: 'Space', emoji: '🌙', hint: 'Bright in the night' },

  // 2 Syllable Words
  {
    word: 'apple',
    syllables: 2,
    category: 'Food',
    emoji: '🍎',
    hint: 'Red fruit that grows on trees',
  },
  { word: 'table', syllables: 2, category: 'Furniture', emoji: '🪑', hint: 'You eat on this' },
  { word: 'happy', syllables: 2, category: 'Emotions', emoji: '😊', hint: 'Feeling good' },
  { word: 'music', syllables: 2, category: 'Arts', emoji: '🎵', hint: 'Sounds that make melodies' },
  { word: 'paper', syllables: 2, category: 'Objects', emoji: '📄', hint: 'You write on this' },
  { word: 'water', syllables: 2, category: 'Nature', emoji: '💧', hint: 'Clear liquid we drink' },
  {
    word: 'flower',
    syllables: 2,
    category: 'Nature',
    emoji: '🌺',
    hint: 'Beautiful plant with petals',
  },
  {
    word: 'rainbow',
    syllables: 2,
    category: 'Weather',
    emoji: '🌈',
    hint: 'Colorful arc in the sky',
  },
  { word: 'mountain', syllables: 2, category: 'Nature', emoji: '⛰️', hint: 'Tall land formation' },
  { word: 'pencil', syllables: 2, category: 'School', emoji: '✏️', hint: 'You write with this' },

  // 3 Syllable Words
  {
    word: 'butterfly',
    syllables: 3,
    category: 'Animals',
    emoji: '🦋',
    hint: 'Colorful flying insect',
  },
  {
    word: 'elephant',
    syllables: 3,
    category: 'Animals',
    emoji: '🐘',
    hint: 'Large gray animal with trunk',
  },
  {
    word: 'beautiful',
    syllables: 3,
    category: 'Descriptions',
    emoji: '✨',
    hint: 'Very pretty or nice',
  },
  {
    word: 'computer',
    syllables: 3,
    category: 'Technology',
    emoji: '💻',
    hint: 'Electronic device for work',
  },
  {
    word: 'dinosaur',
    syllables: 3,
    category: 'Animals',
    emoji: '🦕',
    hint: 'Extinct giant reptile',
  },
  {
    word: 'birthday',
    syllables: 3,
    category: 'Celebrations',
    emoji: '🎂',
    hint: 'Day you were born',
  },
  {
    word: 'umbrella',
    syllables: 3,
    category: 'Objects',
    emoji: '☂️',
    hint: 'Keeps you dry in rain',
  },
  {
    word: 'bicycle',
    syllables: 3,
    category: 'Transport',
    emoji: '🚲',
    hint: 'Two-wheeled vehicle',
  },
  {
    word: 'chocolate',
    syllables: 3,
    category: 'Food',
    emoji: '🍫',
    hint: 'Sweet brown treat',
  },
  {
    word: 'hospital',
    syllables: 3,
    category: 'Buildings',
    emoji: '🏥',
    hint: 'Where sick people go',
  },
  {
    word: 'magazine',
    syllables: 3,
    category: 'Reading',
    emoji: '📰',
    hint: 'Paper with stories and pictures',
  },
  {
    word: 'mountain',
    syllables: 3,
    category: 'Nature',
    emoji: '⛰️',
    hint: 'Very tall hill',
  },
  {
    word: 'rainbow',
    syllables: 3,
    category: 'Weather',
    emoji: '🌈',
    hint: 'Colorful arc in the sky',
  },
  {
    word: 'sunshine',
    syllables: 3,
    category: 'Weather',
    emoji: '☀️',
    hint: 'Bright light from the sun',
  },
  {
    word: 'tomorrow',
    syllables: 3,
    category: 'Time',
    emoji: '📅',
    hint: 'The day after today',
  },
  {
    word: 'wonderful',
    syllables: 3,
    category: 'Descriptions',
    emoji: '🌟',
    hint: 'Very good or amazing',
  },
  {
    word: 'dangerous',
    syllables: 3,
    category: 'Descriptions',
    emoji: '⚠️',
    hint: 'Not safe',
  },
  {
    word: 'different',
    syllables: 3,
    category: 'Descriptions',
    emoji: '🔄',
    hint: 'Not the same',
  },
  {
    word: 'important',
    syllables: 3,
    category: 'Descriptions',
    emoji: '⭐',
    hint: 'Very special or needed',
  },

  // 4 Syllable Words
  {
    word: 'helicopter',
    syllables: 4,
    category: 'Transport',
    emoji: '🚁',
    hint: 'Flying machine with rotors',
  },
  {
    word: 'alligator',
    syllables: 4,
    category: 'Animals',
    emoji: '🐊',
    hint: 'Large reptile with big teeth',
  },
  {
    word: 'television',
    syllables: 4,
    category: 'Technology',
    emoji: '📺',
    hint: 'Shows moving pictures',
  },
  {
    word: 'refrigerator',
    syllables: 4,
    category: 'Appliances',
    emoji: '❄️',
    hint: 'Keeps food cold',
  },
  {
    word: 'photographer',
    syllables: 4,
    category: 'Professions',
    emoji: '📸',
    hint: 'Takes pictures',
  },
  {
    word: 'adventure',
    syllables: 4,
    category: 'Activities',
    emoji: '🗺️',
    hint: 'Exciting journey',
  },
  {
    word: 'automobile',
    syllables: 4,
    category: 'Transport',
    emoji: '🚗',
    hint: 'Four-wheeled vehicle',
  },
  {
    word: 'basketball',
    syllables: 4,
    category: 'Sports',
    emoji: '🏀',
    hint: 'Orange ball game',
  },
  {
    word: 'caterpillar',
    syllables: 4,
    category: 'Animals',
    emoji: '🐛',
    hint: 'Worm that becomes a butterfly',
  },
  {
    word: 'dictionary',
    syllables: 4,
    category: 'Books',
    emoji: '📖',
    hint: 'Book with word meanings',
  },
  {
    word: 'electricity',
    syllables: 4,
    category: 'Science',
    emoji: '⚡',
    hint: 'Power that lights things',
  },
  {
    word: 'firefighter',
    syllables: 4,
    category: 'Professions',
    emoji: '🚒',
    hint: 'Person who puts out fires',
  },
  {
    word: 'grandmother',
    syllables: 4,
    category: 'Family',
    emoji: '👵',
    hint: 'Mother of your parent',
  },
  {
    word: 'hamburger',
    syllables: 4,
    category: 'Food',
    emoji: '🍔',
    hint: 'Meat sandwich',
  },
  {
    word: 'information',
    syllables: 4,
    category: 'Knowledge',
    emoji: '📋',
    hint: 'Facts and details',
  },
  {
    word: 'jellyfish',
    syllables: 4,
    category: 'Animals',
    emoji: '🪼',
    hint: 'Sea creature with tentacles',
  },
  {
    word: 'kangaroo',
    syllables: 4,
    category: 'Animals',
    emoji: '🦘',
    hint: 'Australian jumping animal',
  },
  {
    word: 'lighthouse',
    syllables: 4,
    category: 'Buildings',
    emoji: '🗼',
    hint: 'Tower that guides ships',
  },
  {
    word: 'microphone',
    syllables: 4,
    category: 'Technology',
    emoji: '🎤',
    hint: 'Device to make voice louder',
  },
  {
    word: 'newspaper',
    syllables: 4,
    category: 'Reading',
    emoji: '📰',
    hint: 'Paper with daily news',
  },
];

const TOTAL_ROUNDS = 20;
const TIME_LIMIT = 180; // 3 minutes

const SyllableClapper = ({ onGameComplete, suiteMode = false, gameConfig }) => {
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
  const [currentWord, setCurrentWord] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);

  // Shuffle words for each game
  const [words, setWords] = useState([]);
  useEffect(() => {
    if (gameStarted) {
      const shuffled = [...WORDS].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
      setWords(shuffled);
    }
  }, [gameStarted]);

  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            toast.error("Time's up! ⏰ Game Over!", { duration: 2000 });
            setGameOver(true);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setGameOver(true);
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused, timeLeft]);

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
    setUserAnswer(null);
    setStartTime(null);
    setCurrentWord(null);
    setStreak(0);
    setShowHint(false);
    setGameStartTime(Date.now());
    setCorrectAnswers(0);
    setInteractionLog([]);

    // Show game start toast
    toast.success('Game started! Clap the syllables! 👏', { duration: 2000 });
  };

  useEffect(() => {
    if (gameStarted && words.length > 0 && currentRound < TOTAL_ROUNDS) {
      setCurrentWord(words[currentRound]);
      setStartTime(Date.now());
      setUserAnswer(null);
      setFeedback(null);
      setShowHint(false);
    }
  }, [gameStarted, words, currentRound]);

  const handleAnswer = syllableCount => {
    if (!currentWord) return;

    const correct = currentWord.syllables === syllableCount;
    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => [...prev, responseTime]);
    setTotalAttempts(prev => prev + 1);
    setUserAnswer(syllableCount);

    // Track interaction
    const interactionEntry = {
      timestamp: Date.now(),
      type: 'syllable_answer',
      word: currentWord.word,
      userAnswer: syllableCount,
      correctAnswer: currentWord.syllables,
      isCorrect: correct,
      responseTime: responseTime,
      currentRound: currentRound,
    };
    setInteractionLog(prev => [...prev, interactionEntry]);

    if (correct) {
      setScore(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      setStreak(prev => prev + 1);
      setFeedback({
        type: 'correct',
        message: `Correct! ${currentWord.emoji} "${currentWord.word}" has ${currentWord.syllables} syllable${currentWord.syllables > 1 ? 's' : ''}.`,
      });

      // Show success toast
      toast.success(
        `Correct! ${currentWord.emoji} "${currentWord.word}" has ${currentWord.syllables} syllable${currentWord.syllables > 1 ? 's' : ''}! ✅`,
        { duration: 1500 }
      );

      // Show milestone toasts
      const newScore = score + 1;
      if (newScore === 3) {
        toast.success('🎉 3 correct! Great syllable counting!', { duration: 2000 });
      } else if (newScore === 6) {
        toast.success('🚀 6 correct! Excellent syllable skills!', { duration: 2000 });
      } else if (newScore === 9) {
        toast.success('🏆 9 correct! Amazing syllable counting!', { duration: 2000 });
      }
    } else {
      setStreak(0);
      setFeedback({
        type: 'wrong',
        message: `Incorrect. ${currentWord.emoji} "${currentWord.word}" has ${currentWord.syllables} syllable${currentWord.syllables > 1 ? 's' : ''}.`,
      });

      // Show error toast
      toast.error(
        `Incorrect. ${currentWord.emoji} "${currentWord.word}" has ${currentWord.syllables} syllable${currentWord.syllables > 1 ? 's' : ''} ❌`,
        { duration: 1500 }
      );
    }

    setTimeout(() => {
      setFeedback(null);
      setUserAnswer(null);
      if (currentRound + 1 < TOTAL_ROUNDS) {
        setCurrentRound(prev => prev + 1);
      } else {
        setGameOver(true);
        endGame();
      }
    }, 2000);
  };

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
    setUserAnswer(null);
    setCurrentWord(null);
    setStreak(0);
    setShowHint(false);

    // Show restart toast
    toast.success('Game restarted! 🔄', { duration: 1500 });
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
      gameId: 'syllable-clapper',
      gameType: 'syllable-clapper',
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
        responseTimes: responseTimes,
        interactionLog: interactionLog,
        totalInteractions: interactionLog.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 SyllableClapper completed in suite mode, calling onGameComplete');
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
        'syllable-clapper',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing syllable-clapper data or initialize
      const existingSyllableClapper = existingData['syllable-clapper'] || {};

      // Update with new session data
      const updatedSyllableClapper = {
        ...existingSyllableClapper,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingSyllableClapper.playCount || 0) + 1,
        bestScore: Math.max(existingSyllableClapper.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingSyllableClapper.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingSyllableClapper.sessions || []),
          {
            sessionId: sessionId,
            score: score,
            accuracy: accuracyScore,
            completedAt: new Date().toISOString(),
            totalTime: totalTimeTaken,
            correctAnswers: correctAnswers,
            totalAttempts: totalAttempts,
            gameSpecificData: performanceData.gameSpecificData,
          },
        ],
      };

      existingData['syllable-clapper'] = updatedSyllableClapper;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'syllable-clapper',
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

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (newPausedState) {
      toast.success('Game Paused ⏸️', { duration: 1500 });
    } else {
      toast.success('Game Resumed ▶️', { duration: 1500 });
    }
  };

  // Return to games function
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
  const accuracyScore = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-green-500/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-teal-500/10 to-transparent rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-500/8 to-transparent rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 mt-16">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={returnToGames}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Games
          </button>
          {gameStarted && !gameOver && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <ChartBarIcon className="w-5 h-5 text-green-500" />
                <span className="font-bold text-gray-900 dark:text-white">{score}</span>
              </div>
              <button
                onClick={togglePause}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={restartGame}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <HandRaisedIcon className="w-12 h-12 text-green-500 mr-4" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Syllable Clapper</h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Read the word and count how many syllables it has. Clap along if it helps!
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How to Play:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• Read the word carefully</li>
                  <li>• Count the syllables (clap along if needed)</li>
                  <li>• Click the correct number of syllables</li>
                  <li>• Try to answer as many as you can</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Scoring:</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• +1 point for each correct answer</li>
                  <li>• Speed and accuracy matter</li>
                  <li>• 12 words per game</li>
                  <li>• 2 minutes time limit</li>
                </ul>
              </div>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg"
            >
              Start Game
            </button>
          </motion.div>
        )}
        {gameStarted && !gameOver && currentWord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Word {currentRound + 1} / {TOTAL_ROUNDS}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Read the word and count the syllables
              </p>
            </div>

            {/* Streak Display */}
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center mb-4"
              >
                <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-4 py-2">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold">🔥</span>
                  <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                    Streak: {streak}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Word Display */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentWord.word}
                </div>
                <div className="text-xl text-gray-600 dark:text-gray-300">
                  {currentWord.emoji} {currentWord.category}
                </div>

                {/* Hint Button */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
                  >
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-gray-600 dark:text-gray-300 text-sm"
                    >
                      {currentWord.hint}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Syllable Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[1, 2, 3, 4].map(syllables => (
                <button
                  key={syllables}
                  onClick={() => handleAnswer(syllables)}
                  disabled={!!feedback || userAnswer !== null}
                  className={`py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
                    userAnswer === syllables
                      ? syllables === currentWord.syllables
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-600'
                  } ${!!feedback || userAnswer !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {syllables} {syllables === 1 ? 'Syllable' : 'Syllables'}
                </button>
              ))}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center text-lg font-medium ${
                    feedback.type === 'correct'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Score: {score}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Attempts: {totalAttempts}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Assessment Complete!
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Final Score
                </h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{score}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Accuracy</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {accuracyScore}%
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Avg Response Time
                </h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {avgResponseTime}ms
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Max Streak
                </h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{streak}</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={restartGame}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300"
              >
                Play Again
              </button>
              <button
                onClick={returnToGames}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300"
              >
                Back to Games
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SyllableClapper;
