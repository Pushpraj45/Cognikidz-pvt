import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  XMarkIcon,
  PauseIcon,
  PlayIcon,
  TrophyIcon,
  SparklesIcon,
  AcademicCapIcon,
  HeartIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const RapidLetterNaming = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute
  const [currentLetter, setCurrentLetter] = useState('');
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [gameStats, setGameStats] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [interactionLog, setInteractionLog] = useState([]);
  const gameEndedRef = useRef(false);
  const [gameEnded, setGameEnded] = useState(false);

  // Enhanced letter sets with categories and difficulty levels
  const letterSets = {
    standard: [
      { letter: 'A', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'a', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'E', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'e', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'I', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'i', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'O', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'o', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'U', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'u', category: 'Vowels', difficulty: 'Easy' },
      { letter: 'B', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'b', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'C', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'c', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'D', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'd', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'F', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'f', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'G', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'g', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'H', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'h', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'J', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'j', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'K', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'k', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'L', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'l', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'M', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'm', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'N', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'n', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'P', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'p', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'Q', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'q', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'R', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'r', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'S', category: 'Consonants', difficulty: 'Medium' },
      { letter: 's', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'T', category: 'Consonants', difficulty: 'Medium' },
      { letter: 't', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'V', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'v', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'W', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'w', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'X', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'x', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'Y', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'y', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'Z', category: 'Consonants', difficulty: 'Medium' },
      { letter: 'z', category: 'Consonants', difficulty: 'Medium' },
    ],
    dyslexic: [
      { letter: 'b', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'd', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'p', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'q', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'n', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'u', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'm', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'w', category: 'Reversals', difficulty: 'Hard' },
      { letter: '6', category: 'Numbers', difficulty: 'Hard' },
      { letter: '9', category: 'Numbers', difficulty: 'Hard' },
      { letter: '5', category: 'Numbers', difficulty: 'Hard' },
      { letter: 'S', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'Z', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'N', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'M', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'W', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'V', category: 'Reversals', difficulty: 'Hard' },
      { letter: 'U', category: 'Reversals', difficulty: 'Hard' },
    ],
  };

  // Initialize game
  const startGame = () => {
    console.log('🎮 Rapid Letter Naming - Starting game');
    setShowInstructions(false);
    setGameStarted(true);
    setGameOver(false);
    setShowResults(false);
    setScore(0);
    setErrors([]);
    setResponseTimes([]);
    setTimeLeft(60);
    setIsPaused(false);
    setStartTime(Date.now());
    setGameStartTime(Date.now());
    setKeystrokeData([]);
    setInteractionLog([]);
    gameEndedRef.current = false; // Reset the game ended flag
    setGameEnded(false); // Reset the game ended state
    generateNewLetter();

    // Show game start toast
    toast.success('Game started! Name the letters as fast as you can! 🚀', { duration: 2000 });

    console.log('🎮 Rapid Letter Naming - Game started successfully');
  };

  // Restart game
  const restartGame = () => {
    console.log('🎮 Rapid Letter Naming - Restarting game');
    setGameStarted(false);
    setGameOver(false);
    setShowResults(false);
    setScore(0);
    setErrors([]);
    setResponseTimes([]);
    setTimeLeft(60);
    setIsPaused(false);
    setShowInstructions(true);
    gameEndedRef.current = false; // Reset the game ended flag
    setGameEnded(false); // Reset the game ended state

    // Show restart toast
    toast.info('Game restarted! 🔄', { duration: 1500 });
  };

  // Return to games
  const returnToGames = () => {
    console.log('🎮 Rapid Letter Naming - Returning to games');
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
      toast.info('Game Paused ⏸️', { duration: 1500 });
    } else {
      toast.success('Game Resumed ▶️', { duration: 1500 });
    }
  };

  // Generate new random letter
  const generateNewLetter = useCallback(() => {
    const allLetters = [...letterSets.standard, ...letterSets.dyslexic];
    const randomIndex = Math.floor(Math.random() * allLetters.length);
    const newLetter = allLetters[randomIndex].letter;
    setCurrentLetter(newLetter);
    setStartTime(Date.now());
    console.log('🎮 Rapid Letter Naming - Generated new letter:', newLetter);
  }, []);

  // Handle key press
  const handleKeyPress = useCallback(
    event => {
      if (!gameStarted || gameOver || isPaused || gameEndedRef.current || gameEnded) return;

      const pressedKey = event.key.toUpperCase();
      const currentLetterUpper = currentLetter.toUpperCase();

      const responseTime = (Date.now() - startTime) / 1000;
      setResponseTimes(prev => [...prev, responseTime]);

      // Track keystroke data
      const keystrokeEntry = {
        timestamp: Date.now(),
        key: pressedKey,
        targetLetter: currentLetterUpper,
        isCorrect: pressedKey === currentLetterUpper,
        responseTime: responseTime,
        gameTime: gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0,
      };

      setKeystrokeData(prev => [...prev, keystrokeEntry]);

      // Track interaction
      const interactionEntry = {
        timestamp: Date.now(),
        type: 'keypress',
        key: pressedKey,
        targetLetter: currentLetterUpper,
        isCorrect: pressedKey === currentLetterUpper,
        responseTime: responseTime,
      };

      setInteractionLog(prev => [...prev, interactionEntry]);

      console.log('🎮 Rapid Letter Naming - Key pressed:', {
        pressedKey,
        currentLetterUpper,
        isCorrect: pressedKey === currentLetterUpper,
        currentScore: score,
        responseTime,
      });

      if (pressedKey === currentLetterUpper) {
        setScore(prev => {
          const newScore = prev + 1;
          console.log('🎮 Rapid Letter Naming - Score updated:', { prev, newScore });

          // Show milestone toasts
          if (newScore === 10) {
            toast.success('🎉 10 letters correct! Great progress!', { duration: 2000 });
          } else if (newScore === 25) {
            toast.success('🚀 25 letters correct! Excellent speed!', { duration: 2000 });
          } else if (newScore === 50) {
            toast.success('🏆 50 letters correct! Amazing performance!', { duration: 2000 });
          }

          return newScore;
        });

        // Show success toast for correct answer
        toast.success(`Correct! ${currentLetter} ✅`, { duration: 1000 });

        generateNewLetter();
      } else {
        setErrors(prev => [
          ...prev,
          {
            letter: currentLetter,
            pressed: pressedKey,
            time: responseTime,
          },
        ]);

        // Show error toast with the correct answer
        toast.error(`Incorrect. The letter was "${currentLetter}" ❌`, { duration: 1500 });

        generateNewLetter();
      }
    },
    [
      gameStarted,
      gameOver,
      isPaused,
      currentLetter,
      startTime,
      gameStartTime,
      generateNewLetter,
      score,
    ]
  );

  // Handle game over
  const handleGameOver = () => {
    // Prevent multiple calls
    if (gameOver || gameEndedRef.current) {
      console.log('🎮 Rapid Letter Naming - Game already over, ignoring duplicate call');
      return;
    }

    console.log('🎮 Rapid Letter Naming - Game over triggered');
    // Set the ref immediately to prevent further key presses
    gameEndedRef.current = true;

    // Set all states immediately to ensure UI updates
    console.log(
      '🎮 Rapid Letter Naming - Setting states: gameEnded=true, gameOver=true, showResults=true, gameStarted=false'
    );

    // Force immediate state updates
    setGameEnded(true);
    setGameOver(true);
    setShowResults(true);
    setGameStarted(false); // Stop the game interface from showing

    // Force a re-render by updating a state that's not used for logic
    setTimeLeft(0);

    // Add a small delay to ensure state updates are processed
    setTimeout(() => {
      console.log('🎮 Rapid Letter Naming - State update delay completed');
      calculateStats();
      endGame();
    }, 100);
  };

  const endGame = async () => {
    // Prevent multiple saves
    if (gameEndedRef.current) {
      console.log('🎮 Rapid Letter Naming - Game already ended, ignoring duplicate save');
      return;
    }

    // Don't set gameEndedRef again since it's already set in handleGameOver
    console.log('🎮 Rapid Letter Naming - Starting game end process');
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const totalResponses = responseTimes.length;
    const correctResponses = score;
    const accuracyScore =
      totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;
    setAccuracy(accuracyScore);
    setCorrectAnswers(correctResponses);
    setTotalAttempts(totalResponses);

    console.log('🎮 Rapid Letter Naming - Game ended with data:', {
      score,
      totalResponses,
      correctResponses,
      accuracyScore,
      totalTimeTaken,
      errors: errors.length,
      keystrokeData: keystrokeData.length,
    });

    // Prepare game results
    const gameResults = {
      gameId: 'rapid-letter-naming',
      gameType: 'rapid-letter-naming',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: correctResponses,
      totalAttempts: totalResponses,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        totalResponses: totalResponses,
        correctResponses: correctResponses,
        correctLetters: correctResponses, // Add correct letters count
        errorCount: errors.length,
        incorrectLetters: totalResponses - correctResponses,
        averageResponseTime:
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
            : 0,
        errors: errors,
        keystrokeData: keystrokeData,
        interactionLog: interactionLog,
        totalInteractions: keystrokeData.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 RapidLetterNaming completed in suite mode, calling onGameComplete');
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
        correctAnswers: correctResponses,
        totalAttempts: totalResponses,
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          totalResponses: totalResponses,
          correctResponses: correctResponses,
          correctLetters: correctResponses, // Add correct letters count
          errorCount: errors.length,
          incorrectLetters: totalResponses - correctResponses,
          averageResponseTime:
            responseTimes.length > 0
              ? Math.round(
                  responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
                )
              : 0,
          errors: errors,
          keystrokeData: keystrokeData,
          interactionLog: interactionLog,
          totalInteractions: keystrokeData.length,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'rapid-letter-naming',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing rapid-letter-naming data or initialize
      const existingRapidLetterNaming = existingData['rapid-letter-naming'] || {};

      // Update with new session data
      const updatedRapidLetterNaming = {
        ...existingRapidLetterNaming,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingRapidLetterNaming.playCount || 0) + 1,
        bestScore: Math.max(existingRapidLetterNaming.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingRapidLetterNaming.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingRapidLetterNaming.sessions || []),
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

      existingData['rapid-letter-naming'] = updatedRapidLetterNaming;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'rapid-letter-naming',
            score,
            accuracy: accuracyScore,
            totalTime: totalTimeTaken,
            timestamp: Date.now(), // Add timestamp to help identify duplicates
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
    const totalResponses = responseTimes.length;
    const correctResponses = score;
    const errorCount = errors.length;
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / totalResponses;

    // Count specific error types
    const reversalErrors = errors.filter(e =>
      ['b/d', 'd/b', 'p/q', 'q/p', 'n/u', 'u/n'].includes(`${e.letter}/${e.pressed}`)
    ).length;

    const hesitationErrors = errors.filter(e => e.time > 2).length;

    return {
      totalResponses,
      correctResponses,
      errorCount,
      averageResponseTime,
      reversalErrors,
      hesitationErrors,
    };
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && !isPaused && !showResults) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Only call handleGameOver if game is not already over
            if (!gameOver && !gameEndedRef.current && !showResults) {
              toast.error("Time's up! ⏰ Game Over!", { duration: 2000 });
              handleGameOver();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused, showResults, handleGameOver]);

  // Keyboard event listener
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused && !showResults) {
      window.addEventListener('keypress', handleKeyPress);
      return () => window.removeEventListener('keypress', handleKeyPress);
    }
  }, [gameStarted, gameOver, isPaused, showResults, handleKeyPress]);

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
            Rapid Letter Naming
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Name each letter aloud as fast as you can to test your letter recognition speed
          </p>
        </motion.div>

        {/* Instructions Modal */}
        <AnimatePresence>
          {showInstructions && !gameOver && (
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
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Name each letter aloud as fast as you can
                  </p>
                </div>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <p>Letters will appear one by one in random order</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <p>Speak the letter name or press the matching key</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <p>Test duration: 1 minute</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      4
                    </div>
                    <p>Focus on speed and accuracy</p>
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
          {(gameOver || gameEnded) && (
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
                      {(() => {
                        const totalResponses = responseTimes.length;
                        const correctResponses = score;
                        if (totalResponses > 0) {
                          return ((correctResponses / totalResponses) * 100).toFixed(1);
                        }
                        return '0.0';
                      })()}
                      %
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
                      {(() => {
                        if (responseTimes.length > 0) {
                          const avgTime =
                            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                          return avgTime.toFixed(2);
                        }
                        return '0.00';
                      })()}
                      s
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
        {gameStarted && !gameOver && !showResults && !gameEnded && (
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
                  {responseTimes.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Responses</div>
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
                  {errors.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
              </motion.div>
            </div>

            {/* Game Screen */}
            <div className="text-center">
              <motion.div
                key={currentLetter}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-9xl font-bold text-gray-900 dark:text-white mb-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 shadow-2xl border border-gray-200 dark:border-gray-600"
              >
                {currentLetter}
              </motion.div>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                Press the matching key or speak the letter name
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                <SparklesIcon className="w-4 h-4" />
                Keep going! You're doing great!
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RapidLetterNaming;
