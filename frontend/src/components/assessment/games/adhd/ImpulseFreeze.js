import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const LIGHTS = [
  { color: 'green', label: 'GO', duration: [1200, 2500], correct: true },
  { color: 'yellow', label: 'GO', duration: [1200, 2500], correct: true },
  { color: 'blue', label: 'FREEZE', duration: [1000, 2000], correct: false },
  { color: 'red', label: 'FREEZE', duration: [1000, 2000], correct: false },
];

const TOTAL_ROUNDS = 50;
const MAX_CONSECUTIVE_ERRORS = 3;

const ImpulseFreeze = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [gameState, setGameState] = useState('instructions'); // instructions, playing, paused, completed
  const [currentRound, setCurrentRound] = useState(0);
  const [light, setLight] = useState(null); // {color, label}
  const [canMove, setCanMove] = useState(false);
  const [errors, setErrors] = useState(0);
  const [moves, setMoves] = useState(0);
  const [roundResults, setRoundResults] = useState([]); // {light, moved}
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isProcessingMove, setIsProcessingMove] = useState(false); // Prevent double calls
  const lastMoveTimeRef = useRef(0); // Track last move time to prevent double calls
  const [finalScore, setFinalScore] = useState(0); // Track final score
  const [isCompleting, setIsCompleting] = useState(false);

  const toastShownRef = useRef(false); // Track if toast has been shown for current move

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 ImpulseFreeze: Auto-starting in suite mode');
      startGame();
    }
  }, [suiteMode, gameState]);

  // Helper to get random duration in ms
  const getRandomDuration = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Start game
  const startGame = () => {
    console.log('🎮 ImpulseFreeze startGame called');
    setGameState('playing');
    setCurrentRound(0);
    setErrors(0);
    setMoves(0);
    setRoundResults([]);
    setConsecutiveErrors(0);
    setFinalScore(0); // Reset final score
    setStartTime(Date.now());
    console.log('🎮 ImpulseFreeze initialized, starting first round');

    // Show game start toast
    toast.success('Game started! Press GO on green/yellow, freeze on blue/red! 🚦', {
      duration: 2000,
    });

    nextRound(0);
  };

  // Restart game
  const restartGame = () => {
    console.log('🎮 ImpulseFreeze restartGame called');
    setGameState('instructions');
    setCurrentRound(0);
    setErrors(0);
    setMoves(0);
    setRoundResults([]);
    setConsecutiveErrors(0);
    setFinalScore(0);
    setLight(null);
    setCanMove(false);
    setIsProcessingMove(false);
    clearTimeout(intervalRef.current);

    // Show restart toast
    toast.info('Game restarted! 🔄', { duration: 1500 });
  };

  // Next round logic
  const nextRound = round => {
    console.log('Next round called with round:', round, 'TOTAL_ROUNDS:', TOTAL_ROUNDS);

    if (round >= TOTAL_ROUNDS) {
      console.log('Game completed - calling endGame');
      endGame();
      return;
    }

    // Randomize light selection from all available lights
    const lightIndex = Math.floor(Math.random() * LIGHTS.length);
    const lightObj = LIGHTS[lightIndex];
    console.log('Setting light for round', round + 1, ':', lightObj);

    setLight(lightObj);
    setCanMove(lightObj.correct); // Use correct property instead of specific color
    setTimer(0);

    // Set timer for this light - if user doesn't interact, record as no move
    const duration = getRandomDuration(...lightObj.duration);
    console.log('Setting timer for round', round + 1, 'duration:', duration, 'ms');

    intervalRef.current = setTimeout(() => {
      console.log('Timer expired for round', round + 1, '- recording no move');

      // Record that no move was made for this round
      setRoundResults(prev => {
        const updated = [...prev];
        const roundResult = {
          light: lightObj.color,
          moved: false,
          correct: lightObj.correct,
          roundNumber: round + 1,
        };

        // Check if this round already has a result (user might have moved)
        const existingIndex = updated.findIndex(r => r.roundNumber === round + 1);
        if (existingIndex === -1) {
          updated.push(roundResult);
        }

        console.log('Updated round results after timer:', updated);
        return updated;
      });

      setCurrentRound(r => r + 1);
      nextRound(round + 1);
    }, duration);
  };

  // Handle move (button press)
  const handleMove = () => {
    console.log(
      '🎮 Move button pressed - Game state:',
      gameState,
      'Light:',
      light,
      'Can move:',
      canMove
    );

    if (gameState !== 'playing' || !light || isProcessingMove) {
      console.log('🎮 Ignoring move - not playing, no light, or already processing');
      return;
    }

    // Check if this is a duplicate call within 500ms
    const now = Date.now();
    if (now - lastMoveTimeRef.current < 500) {
      console.log('🎮 Ignoring duplicate move call');
      return;
    }
    lastMoveTimeRef.current = now;

    // Set processing flag to prevent double calls
    setIsProcessingMove(true);
    toastShownRef.current = false; // Reset toast shown flag for this move

    // Always increment moves when button is pressed (this tracks attempts)
    setMoves(m => {
      const newMoves = m + 1;
      console.log('🎮 Moves updated:', newMoves);
      return newMoves;
    });

    // Record move timing
    const moveTime = Date.now();

    console.log('🎮 Processing move for light:', light.color, 'Correct:', light.correct);

    // Update round results to record this move
    setRoundResults(prev => {
      const updated = [...prev];
      const currentRoundIndex = currentRound;

      // Find the current round result or create one
      let roundResult = updated.find(r => r.roundNumber === currentRoundIndex + 1);

      if (!roundResult) {
        // Create new round result
        roundResult = {
          light: light.color,
          moved: true,
          correct: light.correct,
          roundNumber: currentRoundIndex + 1,
          moveTime: moveTime,
        };
        updated.push(roundResult);
      } else {
        // Update existing round result
        roundResult.moved = true;
        roundResult.moveTime = moveTime;
      }

      console.log('🎮 Updated round results:', updated);
      return updated;
    });

    // Process the move result and show appropriate toast
    if (!light.correct) {
      // Moved on a FREEZE light - this is an error
      setErrors(e => {
        const newErrors = e + 1;
        console.log('🎮 Errors updated:', newErrors);
        return newErrors;
      });

      // Handle consecutive errors and show toast
      setConsecutiveErrors(prev => {
        const newConsecutiveErrors = prev + 1;

        if (newConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          // Show encouraging message and reset consecutive errors
          if (!toastShownRef.current) {
            toast.error("That's okay! Take a breath and keep going! 💪", {
              duration: 2000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
            toastShownRef.current = true;
          }
          return 0; // Reset consecutive errors
        } else {
          // Show gentle reminder with color-specific message
          if (!toastShownRef.current) {
            const freezeMessage =
              light.color === 'blue'
                ? 'Remember to freeze on blue! 🛑'
                : 'Remember to freeze on red! 🛑';

            console.log('🎮 Showing freeze reminder:', freezeMessage);

            toast.error(`Oops! ${freezeMessage}`, {
              duration: 1500,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                border: '2px solid #F59E0B',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: 9999,
              },
            });
            toastShownRef.current = true;
          }
          return newConsecutiveErrors;
        }
      });
    } else {
      // Correct move - reset consecutive errors and give positive feedback
      setConsecutiveErrors(0);

      if (!toastShownRef.current) {
        const encouragingMessages = [
          'Great job! Perfect timing! 🎉',
          "Excellent! You're on it! ⚡",
          'Perfect reaction! 🌟',
          'Amazing reflexes! 🚀',
          'Fantastic! Keep it up! 💪',
        ];

        const randomMessage =
          encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

        console.log('🎮 Showing success toast:', randomMessage);

        toast.success(randomMessage, {
          duration: 1000,
          style: {
            background: '#D1FAE5',
            color: '#047857',
            border: '2px solid #10B981',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 9999,
          },
        });
        toastShownRef.current = true;
      }
    }

    // Clear the current round timer since user made a move
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    // Move to next round immediately after user interaction
    setCurrentRound(r => r + 1);
    nextRound(currentRound + 1);

    // Reset processing flag after a short delay
    setTimeout(() => {
      setIsProcessingMove(false);
    }, 500); // Increased delay to prevent double calls
  };

  // End game
  const endGame = async () => {
    console.log('🎮 ImpulseFreeze endGame called');
    console.log('🎮 Final game state:', {
      moves,
      errors,
      currentRound,
      roundResults: roundResults.length,
      gameState,
      roundResults: roundResults,
    });

    setGameState('completed');
    setLight(null);
    setCanMove(false);
    const finalTime = (Date.now() - startTime) / 1000;
    setTotalTime(finalTime.toFixed(1));
    clearTimeout(intervalRef.current);

    // Calculate game results with better logic
    const totalMoves = moves;
    const totalErrors = errors;
    const correctMoves = totalMoves - totalErrors;

    // Calculate accuracy: (correct moves / total moves) * 100
    const accuracy = totalMoves > 0 ? (correctMoves / totalMoves) * 100 : 0;

    // Calculate score based on accuracy and errors (range 1-100)
    // Formula: (accuracy * 0.8) + (20 - errors * 2) + bonus for consecutive correct moves
    let score = 1; // Default minimum score
    if (totalMoves > 0) {
      // Base score from accuracy (0-80 points)
      const accuracyScore = Math.round(accuracy * 0.8);

      // Error penalty (0-20 points, max 20 points for no errors)
      const errorPenalty = Math.max(0, 20 - totalErrors * 2);

      // Bonus for consecutive correct moves (0-20 points)
      const consecutiveBonus = Math.min(20, Math.round((correctMoves / totalMoves) * 20));

      score = Math.max(1, Math.min(100, accuracyScore + errorPenalty + consecutiveBonus));
    }

    // Set the final score for display
    setFinalScore(score);

    console.log('🎮 ImpulseFreeze final calculations:', {
      totalMoves,
      totalErrors,
      correctMoves,
      accuracy,
      score,
      finalTime,
    });

    console.log('🎮 Sending performance data to backend:', {
      score,
      accuracy: accuracy / 100,
      totalTime: finalTime,
      gameSpecificData: {
        totalMoves,
        errorCount: totalErrors,
        correctMoves,
        impulseControlAccuracy: accuracy,
      },
    });

    const gameResults = {
      gameId: 'impulse-freeze',
      gameType: 'impulse-freeze',
      score: score,
      accuracy: accuracy,
      totalTime: finalTime,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      moves: totalMoves,
      errors: totalErrors,
      rounds: TOTAL_ROUNDS,
      gameSpecificData: {
        totalMoves: totalMoves,
        errorCount: totalErrors,
        correctMoves: correctMoves,
        totalRounds: TOTAL_ROUNDS,
        roundResults: roundResults,
        impulseControlAccuracy: accuracy,
        consecutiveErrors: consecutiveErrors,
        gameType: 'impulse-control',
        assessmentDomain: 'adhd',
        distractionsClicked: 0,
        falseClicks: 0,
        foundObjects: 0,
        missedObjects: 0,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 ImpulseFreeze completed in suite mode, calling onGameComplete');
      onGameComplete(gameResults);
      return;
    }

    // If not in suite mode, save to database
    try {
      console.log('🎮 Saving ImpulseFreeze results to database');

      // First, try to get or create a session for this child
      const sessionKey = `adhd_assessment_session_${childId}`;
      let sessionId = localStorage.getItem(sessionKey);

      if (!sessionId) {
        // Create a new assessment session for this child
        toast.loading('Starting assessment session...');

        try {
          const batteryConfig = await AssessmentService.configureBattery(
            childId,
            'adhd',
            96, // 8 years old in months
            ['attention', 'focus', 'impulse-control']
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
        accuracy: accuracy / 100, // Convert to decimal (0-1) for backend
        totalTime: finalTime,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        level: 1,
        gameSpecificData: {
          totalMoves: totalMoves,
          errorCount: totalErrors,
          correctMoves: correctMoves,
          totalRounds: TOTAL_ROUNDS,
          roundResults: roundResults,
          impulseControlAccuracy: accuracy, // Keep as percentage for display
          consecutiveErrors: consecutiveErrors,
          gameType: 'impulse-control',
          assessmentDomain: 'adhd',
          distractionsClicked: 0,
          falseClicks: 0,
          foundObjects: 0,
          missedObjects: 0,
        },
      };

      await AssessmentService.completeGame(
        sessionId,
        'impulse-freeze',
        'adhd-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `adhd_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');
      existingData['impulse-freeze'] = {
        ...existingData['impulse-freeze'],
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingData['impulse-freeze']?.playCount || 0) + 1,
        bestScore: Math.max(existingData['impulse-freeze']?.bestScore || 0, score),
      };
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'impulse-freeze',
            sessionId,
            performanceData,
          },
        })
      );

      console.log('✅ ImpulseFreeze results saved successfully');
    } catch (error) {
      console.error('Error saving game results:', error);
      toast.dismiss();
      toast.error('Failed to save game results');
    }
  };

  // Clean up timer on unmount or pause
  useEffect(() => {
    return () => clearTimeout(intervalRef.current);
  }, []);

  // Pause/Resume
  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      clearTimeout(intervalRef.current);
      toast.info('Game Paused ⏸️', { duration: 1500 });
    } else if (gameState === 'paused') {
      setGameState('playing');
      nextRound(currentRound);
      toast.success('Game Resumed ▶️', { duration: 1500 });
    }
  };

  // Show light change animation
  const lightColorClass = light => {
    if (light === 'green') return 'bg-green-500 shadow-green-500/50';
    if (light === 'yellow') return 'bg-yellow-500 shadow-yellow-500/50';
    if (light === 'blue') return 'bg-blue-500 shadow-blue-500/50';
    if (light === 'red') return 'bg-red-500 shadow-red-500/50';
    return 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 py-8 mt-8">
        <div className="flex items-center justify-between mb-8">
          {!suiteMode && (
            <button
              onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Games
            </button>
          )}
          {gameState === 'playing' && (
            <div className="flex gap-2">
              <button
                onClick={restartGame}
                className="p-2 bg-red-100 dark:bg-red-900/30 backdrop-blur-sm rounded-lg text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
                title="Restart Game"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              <button
                onClick={togglePause}
                className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300"
              >
                {gameState === 'playing' ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'instructions' && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <PauseIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Impulse Freeze
                </h1>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Red Light, Blue Light
                </h2>
                <div className="text-gray-600 dark:text-gray-400 mb-6 space-y-3">
                  <p>
                    <span className="font-bold text-lg">How to play:</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="font-bold text-green-700 dark:text-green-400">
                        ✅ PRESS "GO" when you see:
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 dark:text-green-400">Green light</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-700 dark:text-yellow-400">Yellow light</span>
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <p className="font-bold text-red-700 dark:text-red-400">
                        🛑 FREEZE when you see:
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-700 dark:text-blue-400">Blue light</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 dark:text-red-400">Red light</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <span className="font-bold">💡 Tip:</span> You'll play 50 rounds. Each light
                    appears for a few seconds. Be quick but careful! Your score (1-100) is based on
                    accuracy and avoiding errors.
                  </p>
                </div>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <PlayIcon className="w-6 h-6 inline mr-2" />
                Start Game
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Round {currentRound + 1} / {TOTAL_ROUNDS}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Moves: <span className="text-blue-600 dark:text-blue-400 font-bold">{moves}</span>{' '}
                  | Errors:{' '}
                  <span className="text-red-600 dark:text-red-400 font-bold">{errors}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {light?.correct
                    ? '✅ Press GO when you see this light!'
                    : '🛑 DO NOT press GO - freeze!'}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center mb-8">
                <motion.div
                  key={light?.color}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    boxShadow: light?.color
                      ? `0 0 30px ${light?.color === 'green' ? '#10B981' : light?.color === 'yellow' ? '#F59E0B' : light?.color === 'blue' ? '#3B82F6' : '#EF4444'}`
                      : 'none',
                  }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`w-40 h-40 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl mb-6 ${lightColorClass(light?.color)} border-4 border-white`}
                >
                  <span className="text-white drop-shadow-lg">{light?.label || '--'}</span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMove}
                  disabled={gameState !== 'playing' || isProcessingMove}
                  className={`px-12 py-6 rounded-xl text-white font-bold text-2xl shadow-lg transition-all duration-300 ${canMove && !isProcessingMove ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'}`}
                >
                  {isProcessingMove ? 'Processing...' : 'GO'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === 'paused' && (
            <motion.div
              key="paused"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center max-w-2xl w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Game Paused
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Take a break if you need to!
                </p>
                <button
                  onClick={togglePause}
                  className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Resume Game
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Game Complete!
                </h1>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {moves}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Moves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {errors}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Errors (Moved on Freeze)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {totalTime}s
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {(((moves - errors) / moves) * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Accuracy</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                    {finalScore}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Final Score (1-100)</div>
                </div>
              </div>
              {!suiteMode && (
                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 text-lg shadow-lg"
                  >
                    Back to Games
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImpulseFreeze;
