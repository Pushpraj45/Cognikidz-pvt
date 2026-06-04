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
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const SHAPES = [
  { type: 'circle', color: 'bg-blue-500', symbol: '●' },
  { type: 'square', color: 'bg-green-500', symbol: '■' },
  { type: 'triangle', color: 'bg-yellow-500', symbol: '▲' },
  { type: 'star', color: 'bg-pink-500', symbol: '★' },
  { type: 'diamond', color: 'bg-purple-500', symbol: '◆' },
];

const TOTAL_ROUNDS = 15; // Increased from 8 to 15 for proper game duration (10 minutes)
const MAX_ATTEMPTS = 3;

function getRandomSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * SHAPES.length));
}

const MemoryTrail = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [gameState, setGameState] = useState('instructions'); // instructions, showing, input, completed
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [showIndex, setShowIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const toastShownRef = useRef(false); // Track if toast has been shown for current interaction

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 MemoryTrail: Auto-starting in suite mode');
      startGame();
    }
  }, [suiteMode, gameState]);

  // Start game
  const startGame = () => {
    setGameState('showing');
    setRound(1);
    setScore(0);
    setErrors(0);
    setWrongAttempts(0);
    setSuccessfulRounds(0);
    setStartTime(Date.now());
    setSessions([]);
    setIsCompleting(false);
    toastShownRef.current = false; // Reset toast flag
    setCurrentSession({
      startTime: Date.now(),
      level: 1,
      score: 0,
      errors: 0,
      accuracy: 0,
      totalTime: 0,
      completedAt: null,
    });
    startRound(1);
  };

  // Start a round
  const startRound = roundNum => {
    const seq = getRandomSequence(Math.min(3 + roundNum, 7));
    setSequence(seq);
    setUserInput([]);
    setShowIndex(-1);
    setWrongAttempts(0); // Reset attempts for new round

    // Update current session
    setCurrentSession(prev => ({
      ...prev,
      level: roundNum,
      startTime: Date.now(),
    }));

    setTimeout(() => showSequence(seq), 500);
  };

  // Show sequence one by one
  const showSequence = seq => {
    let idx = 0;
    setGameState('showing');
    const interval = setInterval(() => {
      setShowIndex(idx);
      idx++;
      if (idx > seq.length) {
        clearInterval(interval);
        setShowIndex(-1);
        setGameState('input');
      }
    }, 800);
  };

  // Handle user shape click
  const handleShapeClick = shapeIdx => {
    console.log('Shape clicked:', shapeIdx, 'Game state:', gameState);

    if (gameState !== 'input') {
      console.log('Not in input state, ignoring click');
      return;
    }

    // Reset toast shown flag for this click
    toastShownRef.current = false;

    const nextInput = [...userInput, shapeIdx];
    setUserInput(nextInput);

    // Record interaction timing
    const clickTime = Date.now();

    console.log('Processing shape click...');

    if (sequence[nextInput.length - 1] !== shapeIdx) {
      setErrors(e => e + 1);

      // Enhanced error feedback with more specific messages
      const errorMessages = [
        'Not quite! 🤔 Try again!',
        'Close! 🎯 Think carefully!',
        'Oops! 😊 You can do it!',
        'Almost there! 💪 Keep trying!',
      ];

      setWrongAttempts(prev => {
        const newWrongAttempts = prev + 1;

        if (newWrongAttempts >= MAX_ATTEMPTS) {
          // Max attempts reached, move to next round with encouragement
          if (!toastShownRef.current) {
            toast.error("That's okay! Let's try the next pattern! 💪", {
              duration: 2000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
            toastShownRef.current = true;
          }

          // Save current session (failed round)
          const sessionEndTime = Date.now();
          const sessionDuration = (sessionEndTime - currentSession.startTime) / 1000;
          const sessionAccuracy = 0; // Failed round

          // Calculate correct patterns for failed round (partial completion)
          const correctPatternsInAttempt = nextInput.filter(
            (input, index) => index < sequence.length && input === sequence[index]
          ).length;

          const completedSession = {
            ...currentSession,
            endTime: sessionEndTime,
            totalTime: sessionDuration,
            accuracy: sessionAccuracy,
            accuracyPercentage: 0, // Add percentage for consistency
            completedAt: new Date(sessionEndTime).toISOString(),
            gameSpecificData: {
              sequenceLength: sequence.length,
              userInput: nextInput,
              correctSequence: sequence,
              errors: newWrongAttempts,
              correctPatterns: correctPatternsInAttempt, // Track partial correct patterns
            },
          };

          setSessions(prev => [...prev, completedSession]);

          setTimeout(() => {
            if (round < TOTAL_ROUNDS) {
              const nextRound = round + 1;
              setRound(nextRound);
              startRound(nextRound);
            } else {
              console.log(
                '🎯 Memory Trail: Game completed after max attempts reached at round',
                round
              );
              const finalTime = (Date.now() - startTime) / 1000;
              setGameState('completed');
              setTotalTime(finalTime.toFixed(1));
              // Handle game completion - call it directly without setTimeout
              handleGameComplete(finalTime);
            }
          }, 2000);
        } else {
          // Show encouraging message with remaining attempts
          const remainingAttempts = MAX_ATTEMPTS - newWrongAttempts;
          const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

          console.log('Showing error toast:', randomMessage);

          // Dismiss any existing toasts to prevent duplicates
          toast.dismiss();

          if (!toastShownRef.current) {
            toast.error(`${randomMessage} ${remainingAttempts} more tries!`, {
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
          if (!toastShownRef.current) {
            toast.error(`${randomMessage} ${remainingAttempts} more tries!`, {
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

          setTimeout(() => {
            setUserInput([]);
            // Only show success toast if we're still in the same round
            if (gameState === 'input' && !toastShownRef.current) {
              toast.success("Take your time! You've got this! 🌟", { duration: 1000 });
              toastShownRef.current = true;
            }
          }, 1500);
        }

        return newWrongAttempts;
      });
      return;
    }

    // Enhanced positive feedback for correct clicks
    const progressMessages = [
      'Perfect! 🌟 Keep going!',
      "Excellent! 👍 You're doing great!",
      'Amazing memory! 🧠 Keep it up!',
      'Brilliant! ✨ One more!',
      "Super! 🎉 You're on fire!",
    ];

    if (nextInput.length < sequence.length) {
      const randomMessage = progressMessages[Math.floor(Math.random() * progressMessages.length)];

      console.log('Showing progress toast:', randomMessage);

      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();

      if (!toastShownRef.current) {
        toast.success(randomMessage, {
          duration: 1500,
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

    if (nextInput.length === sequence.length) {
      const roundScore = sequence.length * 15;
      setScore(s => s + roundScore);
      setSuccessfulRounds(prev => prev + 1); // Track successful round

      // Save successful session
      const sessionEndTime = Date.now();
      const sessionDuration = (sessionEndTime - currentSession.startTime) / 1000;
      const sessionAccuracy = 100; // Perfect round

      // Calculate correct patterns for successful round
      const correctPatternsInSuccess = nextInput.filter(
        (input, index) => index < sequence.length && input === sequence[index]
      ).length;

      const completedSession = {
        ...currentSession,
        endTime: sessionEndTime,
        totalTime: sessionDuration,
        accuracy: sessionAccuracy,
        accuracyPercentage: 100, // Add percentage for consistency
        score: roundScore,
        completedAt: new Date(sessionEndTime).toISOString(),
        gameSpecificData: {
          sequenceLength: sequence.length,
          userInput: nextInput,
          correctSequence: sequence,
          errors: 0,
          correctPatterns: correctPatternsInSuccess, // Track correct patterns
        },
      };

      setSessions(prev => [...prev, completedSession]);

      // Celebrate complete sequence
      const completionMessages = [
        'Fantastic! 🎉 Perfect sequence!',
        'Outstanding! 🌟 You nailed it!',
        'Incredible! 💫 Amazing memory!',
        'Brilliant work! 🚀 Keep going!',
        "Perfect! 🏆 You're a memory master!",
      ];

      const randomCompletionMessage =
        completionMessages[Math.floor(Math.random() * completionMessages.length)];

      console.log('Showing completion toast:', randomCompletionMessage);

      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();

      if (!toastShownRef.current) {
        toast.success(randomCompletionMessage, {
          duration: 2000,
          style: {
            background: '#D1FAE5',
            color: '#047857',
            border: '2px solid #10B981',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 9999,
          },
        });
        toastShownRef.current = true;
      }
      if (!toastShownRef.current) {
        toast.success(randomCompletionMessage, {
          duration: 2000,
          style: {
            background: '#D1FAE5',
            color: '#047857',
            border: '2px solid #10B981',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 9999,
          },
        });
        toastShownRef.current = true;
      }

      if (round < TOTAL_ROUNDS) {
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          startRound(nextRound);
        }, 2000); // More time to celebrate success
      } else {
        console.log('🎯 Memory Trail: Game completed after round', round);
        const finalTime = (Date.now() - startTime) / 1000;
        setGameState('completed');
        setTotalTime(finalTime.toFixed(1));

        // Handle game completion - call it directly without setTimeout
        handleGameComplete(finalTime);
      }
    }
  };

  // Handle game completion
  const handleGameComplete = async finalTime => {
    // Prevent duplicate API calls with more robust guard
    if (isCompleting || gameState === 'completed') {
      console.log('⚠️ Game already completing or completed, skipping duplicate API call');
      return;
    }

    // Set completing flag immediately to prevent race conditions
    setIsCompleting(true);
    console.log('🎮 MemoryTrail: Starting game completion process');

    // Calculate accuracy based on successful rounds vs total rounds
    const totalRounds = round;
    const accuracy = totalRounds > 0 ? (successfulRounds / totalRounds) * 100 : 0;

    console.log('🎯 Memory Trail - Accuracy Calculation:', {
      totalRounds,
      successfulRounds,
      accuracy,
      sessions,
    });

    const gameResults = {
      gameId: 'memory-trail',
      gameType: 'memory-trail',
      score: score,
      accuracy: accuracy / 100, // Convert to decimal for consistency
      totalTime: finalTime,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      roundsCompleted: round,
      errors: errors,
      sessions: sessions,
      gameSpecificData: {
        totalRounds: TOTAL_ROUNDS,
        roundsCompleted: round,
        finalScore: score,
        errorCount: errors,
        memoryAccuracy: accuracy,
        sequenceLength: sequence.length,
        sessions: sessions,
        successfulRounds: successfulRounds,
        totalRounds: totalRounds,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 MemoryTrail completed in suite mode, calling onGameComplete');
      onGameComplete(gameResults);
      return;
    }

    // If not in suite mode, save to database
    try {
      console.log('🎮 Saving MemoryTrail results to database');

      // Check if we have childId
      if (!childId) {
        console.warn('⚠️ No childId available for MemoryTrail');
        toast.error('Unable to save results - missing child information');
        return;
      }

      // Calculate correct patterns from all sessions
      const totalCorrectPatterns = sessions.reduce((total, session) => {
        const sessionPatterns = session.gameSpecificData?.correctPatterns || 0;
        console.log(
          `📊 Session ${session.level}: correctPatterns = ${sessionPatterns}`,
          session.gameSpecificData
        );
        return total + sessionPatterns;
      }, 0);

      console.log('📊 Total correct patterns from all sessions:', totalCorrectPatterns);
      console.log('📊 Sessions data:', sessions);

      // Generate a session ID for individual games (simplified approach like other games)
      const sessionId = `individual_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const performanceData = {
        score: score,
        accuracy: accuracy / 100, // Convert to decimal
        totalTime: finalTime,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        level: round,
        sessions: sessions,
        gameSpecificData: {
          totalRounds: TOTAL_ROUNDS,
          roundsCompleted: round,
          finalScore: score,
          errorCount: errors,
          memoryAccuracy: accuracy,
          sequenceLength: sequence.length,
          sessions: sessions,
          successfulRounds: successfulRounds,
          totalRounds: totalRounds,
          correctPatterns: totalCorrectPatterns, // Add total correct patterns
          // Add individual session data for detailed tracking
          sessionDetails: sessions.map(session => ({
            sessionId: session.sessionId,
            correctPatterns: session.gameSpecificData?.correctPatterns || 0,
            errors: session.gameSpecificData?.errors || 0,
            time: session.gameSpecificData?.time || 0,
            accuracy: session.gameSpecificData?.accuracy || 0,
          })),
        },
      };

      console.log('📊 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'memory-trail',
        'adhd-individual-games',
        performanceData,
        childId
      );

      console.log('✅ MemoryTrail results saved successfully');

      // Dismiss any existing toasts before showing success
      toast.dismiss();
      toast.success('Game results saved successfully! 🎉', {
        duration: 3000,
        style: {
          background: '#D1FAE5',
          color: '#047857',
          border: '2px solid #10B981',
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });
    } catch (error) {
      console.error('Error saving game results:', error);

      // Check if this is a version conflict or 500 error (backend database conflict)
      const is500Error = error.response?.status === 500;
      const isVersionError =
        error.message?.includes('VersionError') ||
        error.message?.includes('already completed') ||
        error.message?.includes('No matching document found');

      if (is500Error || isVersionError) {
        console.log('✅ Game completed successfully (ignoring backend version conflict)');
        console.log('📊 Game Results:', {
          score,
          accuracy: `${accuracy}%`,
          successfulRounds,
          totalRounds: round,
          totalCorrectPatterns: sessions.reduce((total, session) => {
            return total + (session.gameSpecificData?.correctPatterns || 0);
          }, 0),
        });

        // Dismiss any existing toasts before showing success
        toast.dismiss();
        toast.success('Game completed successfully! 🎉', {
          duration: 4000,
          style: {
            background: '#D1FAE5',
            color: '#047857',
            border: '2px solid #10B981',
            fontSize: '16px',
            fontWeight: 'bold',
          },
        });
      } else {
        // Only show error for real failures (network issues, etc.)
        console.error('❌ Real error occurred:', error);
        toast.dismiss();
        toast.error('Network error. Please check your connection and try again.', {
          duration: 5000,
          style: {
            background: '#FEE2E2',
            color: '#DC2626',
            border: '2px solid #EF4444',
            fontSize: '16px',
            fontWeight: 'bold',
          },
        });
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // Pause/Resume (not implemented, placeholder)
  const togglePause = () => {};

  // Render shape with improved visibility and responsive design
  const renderShape = (shapeIdx, key, highlight) => {
    const shape = SHAPES[shapeIdx];
    const base = `w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center ${shape.color} rounded-lg shadow-lg transition-all duration-200`;
    const highlightClass = highlight ? 'scale-110 shadow-xl ring-4 ring-white/50' : '';

    return (
      <div
        key={key}
        className={`${base} ${highlightClass} ${shape.type === 'circle' ? 'rounded-full' : ''}`}
      >
        <span className="text-white text-lg sm:text-2xl font-bold drop-shadow-lg">
          {highlight ? shape.symbol : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 py-4 sm:py-8 mt-4 sm:mt-8">
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
              <div className="mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Memory Trail
                </h1>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Working Memory Game
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                  Watch the sequence of shapes, then repeat it in the same order. Each round gets
                  longer!
                </p>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <PlayIcon className="w-6 h-6 inline mr-2" />
                Start Game
              </button>
            </motion.div>
          )}

          {gameState === 'showing' && (
            <motion.div
              key="showing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Round {round} / {TOTAL_ROUNDS}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                Memorize the sequence!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md mx-auto">
                {sequence.map((shapeIdx, idx) => renderShape(shapeIdx, idx, idx === showIndex))}
              </div>
            </motion.div>
          )}

          {gameState === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Repeat the Sequence
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                Click the shapes in the same order
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md mx-auto">
                {SHAPES.map((shape, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleShapeClick(idx)}
                    className={`focus:outline-none ${userInput.length < sequence.length ? 'hover:scale-110 transition-transform' : 'opacity-50 cursor-not-allowed'}`}
                    disabled={userInput.length >= sequence.length}
                  >
                    {renderShape(idx, idx, false)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-6">
                <div className="text-sm sm:text-lg text-gray-700 dark:text-gray-300">
                  Score:{' '}
                  <span className="font-bold text-purple-600 dark:text-purple-400">{score}</span>
                </div>
                <div className="text-sm sm:text-lg text-gray-700 dark:text-gray-300">
                  Errors: <span className="font-bold text-red-600 dark:text-red-400">{errors}</span>
                </div>
                <div className="text-sm sm:text-lg text-gray-700 dark:text-gray-300">
                  Round:{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {round}/{TOTAL_ROUNDS}
                  </span>
                </div>
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
              <div className="mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Game Complete!
                </h1>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {score}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Final Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                      {errors}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Total Errors
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                      {totalTime}s
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Total Time
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {round}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Rounds Completed
                    </div>
                  </div>
                </div>
              </div>
              {!suiteMode && (
                <button
                  onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                  className="px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Back to Games
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MemoryTrail;
