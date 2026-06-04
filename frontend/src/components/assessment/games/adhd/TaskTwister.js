import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  StarIcon,
  HandRaisedIcon,
  FingerPrintIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

// Simplified tasks with only tap, hold, and double-tap
const TASKS = [
  {
    id: 1,
    color: 'yellow',
    shape: 'square',
    action: 'tap',
    emoji: '🟨',
    instruction: 'Tap me!',
    sound: 'tap',
    visualEffect: 'pulse',
  },
  {
    id: 2,
    color: 'red',
    shape: 'circle',
    action: 'hold',
    emoji: '🔴',
    instruction: 'Hold me!',
    sound: 'hold',
    visualEffect: 'glow',
    holdDuration: 1000,
  },
  {
    id: 3,
    color: 'blue',
    shape: 'triangle',
    action: 'double-tap',
    emoji: '🔵',
    instruction: 'Double tap!',
    sound: 'double-tap',
    visualEffect: 'bounce',
  },
  {
    id: 4,
    color: 'green',
    shape: 'diamond',
    action: 'tap',
    emoji: '🟢',
    instruction: 'Tap me!',
    sound: 'tap',
    visualEffect: 'spin',
  },
  {
    id: 5,
    color: 'purple',
    shape: 'star',
    action: 'hold',
    emoji: '🟣',
    instruction: 'Hold me!',
    sound: 'hold',
    visualEffect: 'glow',
    holdDuration: 1000,
  },
];

const TOTAL_ROUNDS = 12; // Increased from 5 to 12 for proper game duration (11 minutes)
const MAX_ATTEMPTS = 3;
const DOUBLE_TAP_THRESHOLD = 300; // milliseconds
const ENCOURAGEMENTS = [
  'Amazing multi-tasking! 🌟',
  "You're switching tasks like a pro! 🎉",
  'Fantastic focus! Keep going! 💪',
  'Wonderful coordination! ⭐',
  "You're a task master! 🌟",
  'Excellent switching! 🎯',
  'Super executive function! 🦸‍♂️',
];

function getRandomTaskSequence(length) {
  const shuffled = [...TASKS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, length);
}

const TaskTwister = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');

  const [gameState, setGameState] = useState('instructions');
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementText, setEncouragementText] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [showingSequence, setShowingSequence] = useState(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(-1);
  const [holdTimer, setHoldTimer] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [taskSwitchCount, setTaskSwitchCount] = useState(0);
  const [correctInteractions, setCorrectInteractions] = useState(0);
  const [distractionsClicked, setDistractionsClicked] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const toastShownRef = useRef(false); // Track if toast has been shown for current action

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 TaskTwister: Auto-starting in suite mode');
      startGame();
    }
  }, [suiteMode, gameState]);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setRound(1);
    setScore(0);
    setErrors(0);
    setWrongAttempts(0);
    setTaskSwitchCount(0);
    setCorrectInteractions(0);
    setDistractionsClicked(0);
    setStartTime(Date.now());
    toastShownRef.current = false; // Reset toast flag
    startRound(1);
  };

  // Start a round with progressive difficulty
  const startRound = roundNum => {
    const taskCount = Math.min(2 + Math.floor(roundNum / 2), 4);
    const seq = getRandomTaskSequence(taskCount);
    setSequence(seq);
    setUserInput([]);
    setWrongAttempts(0);
    setShowingSequence(true);
    setCurrentSequenceIndex(-1);
  };

  // Show encouragement
  const showRandomEncouragement = () => {
    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setEncouragementText(encouragement);
    setShowEncouragement(true);
    if (!toastShownRef.current) {
      toast.success(encouragement);
      toastShownRef.current = true;
    }
    setTimeout(() => setShowEncouragement(false), 2000);
  };

  // Handle different interaction types
  const handleTaskInteraction = (task, interactionType, event = null) => {
    if (gameState !== 'playing' || showingSequence) return;

    // Reset toast flag for this interaction
    toastShownRef.current = false;

    console.log('🎯 Task interaction:', { task, interactionType });

    // Check if interaction type matches task requirement
    if (task.action !== interactionType) {
      setErrors(e => e + 1);
      if (!toastShownRef.current) {
        toast.error(`Wrong interaction! Try ${task.instruction}`, {
          duration: 1500,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
          },
        });
        toastShownRef.current = true;
      }
      return;
    }

    // Check if it's the correct task in sequence
    if (sequence[userInput.length]?.id !== task.id) {
      setErrors(e => e + 1);
      setWrongAttempts(prev => {
        const newWrongAttempts = prev + 1;
        if (newWrongAttempts >= MAX_ATTEMPTS) {
          if (!toastShownRef.current) {
            toast.error("That's okay! Let's try the next pattern! 🎯", {
              duration: 2000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
            toastShownRef.current = true;
          }
          setTimeout(() => {
            const nextRound = round + 1;
            if (nextRound <= TOTAL_ROUNDS) {
              setRound(nextRound);
              startRound(nextRound);
            } else {
              const finalTime = (Date.now() - startTime) / 1000;
              setGameState('completed');
              setTotalTime(finalTime.toFixed(1));
              handleGameComplete(finalTime);
            }
          }, 2000);
        } else {
          const remainingAttempts = MAX_ATTEMPTS - newWrongAttempts;
          if (!toastShownRef.current) {
            toast.error(`Oops! ${remainingAttempts} more tries! You can do it! 💪`, {
              duration: 1500,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
            toastShownRef.current = true;
          }
          if (!toastShownRef.current) {
            toast.error(`Oops! ${remainingAttempts} more tries! You can do it! 💪`, {
              duration: 1500,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
            toastShownRef.current = true;
          }
          setTimeout(() => {
            setUserInput([]);
            if (!toastShownRef.current) {
              toast.success("Let's try again! 🌟", { duration: 1000 });
              toastShownRef.current = true;
            }
            if (!toastShownRef.current) {
              toast.success("Let's try again! 🌟", { duration: 1000 });
              toastShownRef.current = true;
            }
          }, 1000);
        }
        return newWrongAttempts;
      });
      return;
    }

    // Correct interaction
    const nextInput = [...userInput, task.id];
    setUserInput(nextInput);
    setCorrectInteractions(c => c + 1);
    setTaskSwitchCount(c => c + 1);

    // Calculate points based on interaction type
    let points = 10; // Base points
    if (task.action === 'hold') points = 15; // Bonus for hold
    if (task.action === 'double-tap') points = 20; // Bonus for double-tap

    setScore(s => s + points);

    // Visual and audio feedback
    if (!toastShownRef.current) {
      toast.success(`Perfect ${task.action}! +${points} points ${task.emoji}`, { duration: 1000 });
      toastShownRef.current = true;
    }
    if (!toastShownRef.current) {
      toast.success(`Perfect ${task.action}! +${points} points ${task.emoji}`, { duration: 1000 });
      toastShownRef.current = true;
    }

    if (nextInput.length === sequence.length) {
      const roundBonus = sequence.length * 5; // Bonus for completing round
      setScore(s => s + roundBonus);
      showRandomEncouragement();

      if (round < TOTAL_ROUNDS) {
        setTimeout(() => {
          setRound(r => r + 1);
          startRound(round + 1);
        }, 1500);
      } else {
        const finalTime = (Date.now() - startTime) / 1000;
        setGameState('completed');
        setTotalTime(finalTime.toFixed(1));
        handleGameComplete(finalTime);
      }
    } else {
      toast.success('Great! Keep going! 👍', { duration: 1000 });
    }
  };

  // Handle tap interactions
  const handleTap = task => {
    console.log('🎯 Tap detected for task:', task);

    // Don't handle tap if hold is active for this task
    if (task.action === 'hold' && holdTimer) {
      console.log('⏸️ Hold in progress, ignoring tap');
      return;
    }

    const now = Date.now();
    if (task.action === 'double-tap') {
      if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
        console.log('✅ Double tap completed!');
        handleTaskInteraction(task, 'double-tap');
        setLastTapTime(0);
      } else {
        console.log('⏳ First tap, waiting for second...');
        setLastTapTime(now);
        toast('Tap again quickly!', {
          duration: 1000,
          icon: '⏳',
          style: {
            background: '#FEF3C7',
            color: '#92400E',
          },
        });
      }
    } else if (task.action === 'tap') {
      console.log('✅ Single tap completed!');
      handleTaskInteraction(task, 'tap');
    } else {
      console.log('❌ Wrong interaction type for this task');
    }
  };

  // Handle hold interactions
  const handleHoldStart = task => {
    console.log('🎯 Hold start for task:', task);
    if (task.action === 'hold') {
      console.log('⏳ Starting hold timer...');
      setHoldTimer(
        setTimeout(() => {
          console.log('✅ Hold completed!');
          handleTaskInteraction(task, 'hold');
        }, task.holdDuration)
      );
    } else {
      console.log('❌ Not a hold task, ignoring hold start');
    }
  };

  const handleHoldEnd = () => {
    if (holdTimer) {
      console.log('❌ Hold cancelled');
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  // Handle game completion
  const handleGameComplete = async finalTime => {
    // Calculate accuracy based on correct interactions vs total attempts
    const totalInteractions = correctInteractions + errors;
    const accuracy = totalInteractions > 0 ? (correctInteractions / totalInteractions) * 100 : 0;

    const gameResults = {
      gameId: 'task-twister-enhanced',
      gameType: 'task-twister-enhanced',
      score: score,
      accuracy: accuracy,
      totalTime: finalTime,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      roundsCompleted: round,
      errors: errors,
      gameSpecificData: {
        totalRounds: TOTAL_ROUNDS,
        roundsCompleted: round,
        finalScore: score,
        errorCount: errors,
        taskSwitchCount: taskSwitchCount,
        correctInteractions: correctInteractions,
        distractionsClicked: distractionsClicked,
        executiveFunctionAccuracy: accuracy,
        taskSwitchingPerformance: accuracy,
        multiModalInteractionScore: (correctInteractions / (correctInteractions + errors)) * 100,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 TaskTwister Enhanced completed in suite mode, calling onGameComplete');
      onGameComplete(gameResults);
      return;
    }

    // If not in suite mode, save to database
    try {
      console.log('🎮 Saving TaskTwister Enhanced results to database');

      // Generate a session ID for individual games
      const sessionId = `individual_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const performanceData = {
        score: score,
        accuracy: accuracy / 100, // Convert to decimal
        totalTime: finalTime,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        level: TOTAL_ROUNDS, // Use total rounds as level
        gameSpecificData: {
          totalRounds: TOTAL_ROUNDS,
          roundsCompleted: TOTAL_ROUNDS, // All rounds completed when game finishes
          finalScore: score,
          errorCount: errors,
          taskSwitchCount: taskSwitchCount,
          correctInteractions: correctInteractions,
          distractionsClicked: distractionsClicked,
          executiveFunctionAccuracy: accuracy,
          taskSwitchingPerformance: accuracy,
          multiModalInteractionScore: (correctInteractions / (correctInteractions + errors)) * 100,
        },
      };

      // Save to localStorage as fallback
      const localKey = `adhd_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Create proper game data structure for localStorage
      const gameData = {
        ...performanceData,
        timestamp: new Date().toISOString(),
        gameId: 'task-twister-enhanced',
        gameType: 'task-twister-enhanced',
        bestScore: performanceData.score,
        accuracy: performanceData.accuracy,
        playCount: (existingData['task-twister-enhanced']?.playCount || 0) + 1,
        lastPlayed: new Date().toISOString(),
        gameSpecificData: {
          ...performanceData.gameSpecificData,
          roundsCompleted: performanceData.level,
          taskSwitchCount: performanceData.gameSpecificData.taskSwitchCount,
          correctInteractions: performanceData.gameSpecificData.correctInteractions,
        },
      };

      existingData['task-twister-enhanced'] = gameData;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      console.log('✅ TaskTwister Enhanced results saved to localStorage');

      // Try backend if available
      try {
        await AssessmentService.completeGame(
          sessionId,
          'task-twister-enhanced',
          'adhd-individual-games',
          performanceData,
          childId
        );
        console.log('✅ TaskTwister Enhanced results saved to backend successfully');
        toast.success('Game results saved successfully!');
      } catch (backendError) {
        console.warn('⚠️ Backend not available, but localStorage works:', backendError.message);
        toast.success('Game results saved to local storage!');
      }
    } catch (error) {
      console.error('Error saving game results:', error);
      toast.error('Failed to save game results');
    }
  };

  // Render task with enhanced visual effects
  const renderTask = (task, key, highlight, isSequenceShow = false) => {
    const base = `w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 m-2 sm:m-3 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl shadow-xl text-white text-sm sm:text-base font-bold cursor-pointer transition-all duration-300 transform`;
    const colorClass = `bg-${task.color}-500`;

    return (
      <motion.button
        key={key}
        onClick={() => !isSequenceShow && handleTap(task)}
        onMouseDown={() => !isSequenceShow && handleHoldStart(task)}
        onMouseUp={() => !isSequenceShow && handleHoldEnd()}
        onMouseLeave={() => !isSequenceShow && handleHoldEnd()}
        className={
          base +
          ' ' +
          colorClass +
          (highlight ? ' ring-4 ring-yellow-300 scale-110 shadow-2xl' : ' hover:scale-105') +
          (task.action === 'hold' && holdTimer ? ' animate-pulse' : '') +
          (task.action === 'double-tap' && lastTapTime > 0 ? ' animate-bounce' : '')
        }
        whileHover={!isSequenceShow ? { scale: 1.1 } : {}}
        whileTap={!isSequenceShow ? { scale: 0.95 } : {}}
        disabled={showingSequence}
        initial={{ scale: 0 }}
        animate={{
          scale: highlight ? 1.25 : 1,
          rotate: task.visualEffect === 'spin' && highlight ? 360 : 0,
          y: task.visualEffect === 'bounce' && highlight ? [-10, 0] : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          rotate: { duration: 0.5 },
          y: { duration: 0.3 },
        }}
      >
        <div className="text-xl sm:text-2xl md:text-3xl mb-1">{task.emoji}</div>
        <div className="text-xs uppercase tracking-wide text-center">{task.shape}</div>
        {!isSequenceShow && <div className="text-xs mt-1 opacity-75">{task.instruction}</div>}
      </motion.button>
    );
  };

  // Show the sequence to the user at the start of each round
  useEffect(() => {
    if (showingSequence && sequence.length > 0) {
      let idx = 0;
      setCurrentSequenceIndex(0);

      const interval = setInterval(() => {
        setCurrentSequenceIndex(idx);
        idx++;
        if (idx > sequence.length) {
          clearInterval(interval);
          setCurrentSequenceIndex(-1);
          setShowingSequence(false);
          toast.success("Now it's your turn! Try the interactions! 🎯");
        }
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [showingSequence, sequence]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Encouragement overlay */}
      <AnimatePresence>
        {showEncouragement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white text-4xl font-bold px-8 py-4 rounded-2xl shadow-2xl">
              {encouragementText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 mt-4 sm:mt-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          {!suiteMode && (
            <button
              onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
                <motion.div
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-4xl sm:text-5xl md:text-6xl">🎯</span>
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Task Twister
                </h1>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                  Multi-Modal Pattern Game! 🌟
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
                  Watch the pattern, then use different interactions: tap, hold, or double-tap!
                  <br />
                  Each interaction type gives different points! 🎉
                </p>

                {/* Interaction guide */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 mx-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Interaction Guide:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">🟨</span>
                      <span>Tap (+10 points)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">🔴</span>
                      <span>Hold (+15 points)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">🔵</span>
                      <span>Double Tap (+20 points)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <motion.button
                  onClick={startGame}
                  className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg sm:text-xl rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 inline mr-2 sm:mr-3" />
                  Let's Play! 🚀
                </motion.button>
              </div>
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
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Round {round} of {TOTAL_ROUNDS} 🎮
                </h2>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                    <span className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                      {score}
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      points
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      {showingSequence ? 'Watch carefully! 👀' : 'Your turn! 🎯'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
                  {showingSequence ? 'Watch the pattern! 👀' : 'Now try the interactions! 🎯'}
                </p>

                {/* Current task indicator */}
                {!showingSequence &&
                  userInput.length < sequence.length &&
                  sequence[userInput.length] && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                        🎯 <strong>Current Task:</strong> {sequence[userInput.length].instruction} (
                        {sequence[userInput.length].emoji})
                      </p>
                    </div>
                  )}

                <div className="flex flex-wrap justify-center mb-6 sm:mb-8 gap-1 sm:gap-2">
                  {TASKS.map((task, idx) =>
                    renderTask(
                      task,
                      idx,
                      showingSequence &&
                        currentSequenceIndex >= 0 &&
                        sequence[currentSequenceIndex]?.id === task.id,
                      showingSequence
                    )
                  )}
                </div>

                {/* Interaction guide during gameplay */}
                {!showingSequence && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>Interaction Guide:</strong>
                      Tap for squares/diamonds • Hold for circles/stars • Double-tap for triangles
                    </p>
                  </div>
                )}

                {/* Progress indicator */}
                <div className="flex justify-center gap-1 sm:gap-2 mt-3 sm:mt-4">
                  {sequence.map((task, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                        idx < userInput.length ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
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
                <motion.div
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: 3 }}
                >
                  <span className="text-4xl sm:text-5xl md:text-6xl">🏆</span>
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Amazing Multi-Tasking! 🎉
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
                  You mastered all the different interactions! You're fantastic! ⭐
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">
                      {score}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Total Points
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                      {TOTAL_ROUNDS}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Total Rounds
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">
                      {correctInteractions}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Correct Interactions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400 mb-1 sm:mb-2">
                      {taskSwitchCount}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Task Switches
                    </div>
                  </div>
                </div>
              </div>

              {!suiteMode && (
                <motion.button
                  onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play More Games! 🎮
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskTwister;
