import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, PlayIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const TASK_TYPES = {
  'sort-colors': {
    id: 'sort-colors',
    name: 'Sort Colors',
    description: 'Match colored circles to their containers',
    timeLimit: 50,
    icon: '🎨',
    generateTask: () => {
      const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
      const selectedColors = colors.slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4 colors
      const items = [];

      // Generate 2-3 items per color
      selectedColors.forEach((color, index) => {
        const itemCount = 2 + Math.floor(Math.random() * 2); // 2-3 items per color
        for (let i = 0; i < itemCount; i++) {
          items.push({
            id: `${color}-${i}`,
            color,
            placed: false,
            position: Math.floor(Math.random() * 100), // Random position for visual variety
          });
        }
      });

      // Shuffle items
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      return { items, containers: selectedColors };
    },
  },
  'count-shapes': {
    id: 'count-shapes',
    name: 'Count Shapes',
    description: 'Count how many of each shape you see',
    timeLimit: 50,
    icon: '🔢',
    generateTask: () => {
      const shapes = ['🔴', '🔵', '🟢', '🟡', '🔶', '🔷', '🟪', '🟫'];
      const selectedShapes = shapes.slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4 shapes
      const displayShapes = [];
      const targets = {};

      // Generate random shapes to count
      const totalShapes = 15 + Math.floor(Math.random() * 10); // 15-25 shapes
      for (let i = 0; i < totalShapes; i++) {
        const shape = selectedShapes[Math.floor(Math.random() * selectedShapes.length)];
        displayShapes.push(shape);
        targets[shape] = (targets[shape] || 0) + 1;
      }

      return { displayShapes, targets };
    },
  },
  'find-pattern': {
    id: 'find-pattern',
    name: 'Find Pattern',
    description: 'Complete the pattern by choosing the next item',
    timeLimit: 50,
    icon: '🧩',
    generateTask: () => {
      const patterns = [
        { sequence: ['🔴', '🔵', '🔴', '🔵'], answer: '🔴', options: ['🔴', '🔵', '🟢', '🟡'] },
        { sequence: ['⭐', '🔶', '⭐', '🔶'], answer: '⭐', options: ['⭐', '🔶', '🔴', '🔵'] },
        { sequence: ['🟩', '🟩', '🟦', '🟩'], answer: '🟩', options: ['🟩', '🟦', '🟥', '🟨'] },
        { sequence: ['🟡', '🟢', '🟡', '🟢'], answer: '🟡', options: ['🟡', '🟢', '🔴', '🔵'] },
        { sequence: ['🔶', '🔷', '🔶', '🔷'], answer: '🔶', options: ['🔶', '🔷', '🟢', '🟡'] },
        { sequence: ['🟪', '🟫', '🟪', '🟫'], answer: '🟪', options: ['🟪', '🟫', '🔴', '🔵'] },
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    },
  },
};

const TOTAL_ROUNDS = 10; // Increased from 6 to 10

const TimeTurtle = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');

  // Game state
  const [gameState, setGameState] = useState('instructions');
  const [round, setRound] = useState(1);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [tasksFailed, setTasksFailed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [roundResults, setRoundResults] = useState([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const toastShownRef = useRef(false); // Track if toast has been shown for current interaction

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 TimeTurtle: Auto-starting in suite mode');
      startGame();
    }
  }, [suiteMode, gameState]);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setRound(1);
    setScore(0);
    setTasksCompleted(0);
    setTasksFailed(0);
    setUserAnswers({});
    setRoundResults([]);
    setStartTime(Date.now());
    toastShownRef.current = false; // Reset toast flag
    startRound();
  };

  // Start a round
  const startRound = () => {
    const taskTypes = Object.keys(TASK_TYPES);
    const randomTask = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const task = TASK_TYPES[randomTask];

    setCurrentTask(task);
    setTaskData(task.generateTask());
    setTimeLeft(task.timeLimit);
    setUserAnswers({});

    console.log('🐢 Starting round', round, 'with task:', task.name);

    // Reset toast flag for new round
    toastShownRef.current = false;

    if (!toastShownRef.current) {
      toast.success(`🐢 ${task.name} - ${task.timeLimit} seconds!`, {
        duration: 2000,
        style: { background: '#F97316', color: 'white' },
      });
      toastShownRef.current = true;
    }
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [gameState, timeLeft]);

  // Handle time up
  const handleTimeUp = () => {
    setTasksFailed(f => f + 1);
    setScore(s => Math.max(0, s - 5));

    // Record round result
    setRoundResults(prev => [
      ...prev,
      {
        round,
        taskType: currentTask?.id,
        taskName: currentTask?.name,
        completed: false,
        timeUsed: currentTask?.timeLimit || 0,
        score: -5,
        accuracy: 0,
      },
    ]);

    if (!toastShownRef.current) {
      toast.error("⏰ Time's up! Don't worry, try the next one! 🐢", {
        duration: 2000,
        style: { background: '#EF4444', color: 'white' },
      });
      toastShownRef.current = true;
    }

    proceedToNextRound();
  };

  // Handle task completion
  const handleTaskComplete = isCorrect => {
    const roundScore = isCorrect ? Math.max(5, timeLeft) : -2;
    const accuracy = isCorrect ? 100 : 0;

    if (isCorrect) {
      setTasksCompleted(c => c + 1);
      setScore(s => s + roundScore);

      const encouragements = [
        '🐢⭐ Excellent work!',
        '⏰✨ Perfect timing!',
        '🎯👍 Great job!',
        '🌟🐢 Amazing!',
      ];

      if (!toastShownRef.current) {
        toast.success(encouragements[Math.floor(Math.random() * encouragements.length)], {
          duration: 1500,
          style: { background: '#10B981', color: 'white' },
        });
        toastShownRef.current = true;
      }
    } else {
      setTasksFailed(f => f + 1);
      setScore(s => Math.max(0, s + roundScore));

      if (!toastShownRef.current) {
        toast.error('🐢💪 Not quite right, but keep trying!', {
          duration: 1500,
          style: { background: '#F59E0B', color: 'white' },
        });
        toastShownRef.current = true;
      }
      if (!toastShownRef.current) {
        toast.error('🐢💪 Not quite right, but keep trying!', {
          duration: 1500,
          style: { background: '#F59E0B', color: 'white' },
        });
        toastShownRef.current = true;
      }
    }

    // Record round result
    setRoundResults(prev => [
      ...prev,
      {
        round,
        taskType: currentTask?.id,
        taskName: currentTask?.name,
        completed: isCorrect,
        timeUsed: (currentTask?.timeLimit || 0) - timeLeft,
        score: roundScore,
        accuracy: accuracy,
      },
    ]);

    proceedToNextRound();
  };

  // Proceed to next round
  const proceedToNextRound = () => {
    if (round < TOTAL_ROUNDS) {
      setTimeout(() => {
        setRound(r => r + 1);
        startRound();
      }, 2000);
    } else {
      setTimeout(() => {
        const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        setGameState('completed');
        setTotalTime(finalTime);
        handleGameComplete(finalTime);
      }, 2000);
    }
  };

  // Handle user input for different task types
  const handleUserInput = (inputType, value) => {
    setUserAnswers(prev => ({ ...prev, [inputType]: value }));
  };

  // Check task completion
  const checkTask = () => {
    if (!currentTask || !taskData) return;

    console.log('🐢 Checking task completion for:', currentTask.name, userAnswers);

    let isCorrect = false;

    switch (currentTask.id) {
      case 'sort-colors':
        // Check if all items are correctly placed
        const allCorrect = taskData.items.every(item => userAnswers[item.id] === item.color);
        const allPlaced = taskData.items.every(
          item => userAnswers[item.id] && userAnswers[item.id] !== ''
        );
        isCorrect = allCorrect && allPlaced;
        console.log('🎨 Sort Colors result:', { allCorrect, allPlaced, isCorrect });
        break;

      case 'count-shapes':
        // Check if all shapes are correctly counted
        const allShapesCorrect = Object.keys(taskData.targets).every(
          shape => userAnswers[shape] === taskData.targets[shape]
        );
        isCorrect = allShapesCorrect;
        console.log('🔢 Count Shapes result:', {
          expected: taskData.targets,
          actual: userAnswers,
          isCorrect,
        });
        break;

      case 'find-pattern':
        // Check if pattern is correctly completed
        isCorrect = userAnswers.pattern === taskData.answer;
        console.log('🧩 Find Pattern result:', {
          expected: taskData.answer,
          actual: userAnswers.pattern,
          isCorrect,
        });
        break;
    }

    handleTaskComplete(isCorrect);
  };

  // Format time display
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle game completion
  const handleGameComplete = async finalTime => {
    const accuracy =
      tasksCompleted + tasksFailed > 0
        ? (tasksCompleted / (tasksCompleted + tasksFailed)) * 100
        : 0;

    console.log('🎮 TimeTurtle Game Complete:', {
      tasksCompleted,
      tasksFailed,
      accuracy,
      score,
      totalTime: finalTime,
      roundResults,
    });

    const gameResults = {
      gameId: 'time-turtle',
      gameType: 'time-turtle',
      score: score,
      accuracy: accuracy,
      totalTime: parseFloat(finalTime),
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      roundsCompleted: round,
      gameSpecificData: {
        totalRounds: TOTAL_ROUNDS,
        roundsCompleted: round,
        finalScore: score,
        tasksCompleted: tasksCompleted,
        tasksFailed: tasksFailed,
        timeManagementAccuracy: accuracy,
        averageTimePerTask: parseFloat(finalTime) / TOTAL_ROUNDS,
        roundResults: roundResults,
        totalTasksAttempted: tasksCompleted + tasksFailed,
        successRate: accuracy / 100,
        timeEfficiency: tasksCompleted / parseFloat(finalTime),
        distractions: 0, // Replaced with tasksCompleted
        taskCompletionRate: (tasksCompleted / TOTAL_ROUNDS) * 100,
      },
    };

    if (suiteMode && onGameComplete) {
      console.log('🎮 TimeTurtle completed in suite mode');
      onGameComplete(gameResults);
      return;
    }

    try {
      console.log('🎮 Saving TimeTurtle results');

      if (!childId) {
        toast.error('Unable to save results - missing child information');
        return;
      }

      const sessionId = `individual_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const performanceData = {
        score: score,
        accuracy: accuracy / 100,
        accuracyPercentage: accuracy, // Add this for better compatibility
        totalTime: parseFloat(finalTime),
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        level: round,
        gameSpecificData: gameResults.gameSpecificData,
      };

      await AssessmentService.completeGame(
        sessionId,
        'time-turtle',
        'adhd-individual-games',
        performanceData,
        childId
      );

      // Dispatch game completion event for real-time updates
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            gameId: 'time-turtle',
            childId: childId,
            score: score,
            accuracy: accuracy,
            accuracyPercentage: accuracy,
            totalTime: parseFloat(finalTime),
            tasksCompleted: tasksCompleted,
          },
        })
      );

      toast.success('Game results saved successfully! 🎉');
    } catch (error) {
      console.error('Error saving TimeTurtle results:', error);
      toast.error('Failed to save game results');
    }
  };

  // Render task content based on type
  const renderTaskContent = () => {
    if (!currentTask || !taskData) return null;

    switch (currentTask.id) {
      case 'sort-colors':
        return (
          <div className="space-y-2 sm:space-y-3">
            {/* Containers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
              {taskData.containers.map(color => (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.05 }}
                  className={`h-12 sm:h-16 border-2 sm:border-3 border-dashed border-gray-400 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:border-${color}-400 relative group bg-gradient-to-br`}
                  style={{
                    background:
                      color === 'red'
                        ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
                        : color === 'blue'
                          ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                          : color === 'green'
                            ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
                            : color === 'yellow'
                              ? 'linear-gradient(135deg, #FEFCE8 0%, #FEF3C7 100%)'
                              : color === 'purple'
                                ? 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)'
                                : color === 'orange'
                                  ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
                                  : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                  }}
                >
                  <div className="text-center">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1 shadow-lg border-2 border-white dark:border-gray-600 transform transition-all duration-300 group-hover:scale-110 relative overflow-hidden`}
                      style={{
                        backgroundColor: color,
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      {/* Add a subtle gradient overlay for better visibility in dark mode */}
                      <div
                        className="absolute inset-0 rounded-full opacity-20"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
                      {color}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Items to sort */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2">
              {taskData.items.map(item => (
                <div key={item.id} className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-1 sm:mb-2 shadow-lg cursor-pointer transition-all duration-300 border-2 border-white dark:border-gray-700 relative overflow-hidden`}
                    style={{
                      backgroundColor: item.color,
                      boxShadow:
                        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {/* Add a subtle gradient overlay for better visibility in dark mode */}
                    <div
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)',
                      }}
                    />
                  </motion.div>
                  <select
                    className="text-xs px-1 sm:px-2 py-1 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-400 font-medium"
                    value={userAnswers[item.id] || ''}
                    onChange={e => handleUserInput(item.id, e.target.value)}
                  >
                    <option value="" className="dark:bg-gray-800 dark:text-gray-100">
                      Choose color
                    </option>
                    {taskData.containers.map(color => (
                      <option
                        key={color}
                        value={color}
                        className="capitalize dark:bg-gray-800 dark:text-gray-100"
                      >
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Progress indicator */}
            <div className="text-center mt-1 sm:mt-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Progress: {Object.keys(userAnswers).length} / {taskData.items.length} items placed
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 sm:h-2 rounded-full transition-all duration-300 shadow-sm"
                  style={{
                    width: `${(Object.keys(userAnswers).length / taskData.items.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'count-shapes':
        return (
          <div className="space-y-2 sm:space-y-3">
            {/* Display shapes */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 sm:p-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 sm:gap-2">
                {taskData.displayShapes.map((shape, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center text-sm sm:text-base md:text-lg shadow-sm border border-gray-200 dark:border-gray-500"
                  >
                    {shape}
                  </div>
                ))}
              </div>
            </div>

            {/* Count inputs */}
            <div className="space-y-1 sm:space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-center">
                Count each shape:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {Object.entries(taskData.targets).map(([shape, count]) => (
                  <div key={shape} className="flex items-center gap-1 sm:gap-2">
                    <div className="text-sm sm:text-base md:text-lg">{shape}</div>
                    <input
                      type="number"
                      min="0"
                      className="w-12 sm:w-16 text-center text-xs sm:text-sm px-1 py-1 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-400"
                      value={userAnswers[shape] || ''}
                      onChange={e => handleUserInput(shape, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'find-pattern':
        return (
          <div className="space-y-2 sm:space-y-3">
            {/* Pattern sequence */}
            <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
              {taskData.sequence.map((item, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-sm sm:text-base md:text-lg border-2 border-gray-300 dark:border-gray-500 shadow-sm"
                >
                  {item}
                </div>
              ))}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-200 dark:bg-yellow-600 rounded-lg flex items-center justify-center text-sm sm:text-base md:text-lg border-4 border-dashed border-yellow-500 dark:border-yellow-400 shadow-lg">
                ?
              </div>
            </div>

            {/* Options */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {taskData.options.map(option => (
                <button
                  key={option}
                  onClick={() => handleUserInput('pattern', option)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-110 shadow-lg ${
                    userAnswers.pattern === option
                      ? 'bg-blue-500 text-white shadow-xl scale-105 border-2 border-blue-600'
                      : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-900 dark:text-gray-100 hover:shadow-xl'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const intervalRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 dark:bg-orange-800 rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-red-200 dark:bg-red-800 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-200 dark:bg-yellow-800 rounded-full opacity-50 animate-bounce"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
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
              <div className="mb-4 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
                  Time Turtle
                </h1>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Time Management Game
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-8 max-w-2xl mx-auto">
                  Complete {TOTAL_ROUNDS} tasks within the time limit. Take your time to be
                  accurate, but don't run out of time!
                </p>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Task Types:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {Object.values(TASK_TYPES).map(task => (
                    <motion.div
                      key={task.id}
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center"
                    >
                      <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">
                        {task.icon}
                      </div>
                      <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        {task.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                        {task.description}
                      </p>
                      <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-500 text-white rounded-full text-xs sm:text-sm font-semibold">
                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {task.timeLimit}s
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="px-6 sm:px-8 md:px-12 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-base sm:text-lg md:text-xl rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-2xl"
              >
                <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 inline mr-2 sm:mr-3" />
                Start Adventure
              </motion.button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2 sm:space-y-3"
            >
              {/* Game header */}
              <div className="text-center mb-2 sm:mb-3">
                {/* Progress Bar with Round and Timer */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 mb-1 sm:mb-2">
                  {/* Round text on left */}
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Round {round}/{TOTAL_ROUNDS}
                  </div>

                  {/* Progress Bar in center */}
                  <div className="flex-1 max-w-xs sm:max-w-sm">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${((round - 1) / TOTAL_ROUNDS) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Timer on right */}
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-lg">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    <span className="font-mono text-sm sm:text-base md:text-lg font-bold">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-1 sm:mb-2">
                  <div className="text-center">
                    <div className="text-sm sm:text-base md:text-lg font-bold text-orange-600 dark:text-orange-400">
                      {score}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base md:text-lg font-bold text-green-600 dark:text-green-400">
                      {tasksCompleted}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base md:text-lg font-bold text-red-600 dark:text-red-400">
                      {tasksFailed}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
                  </div>
                </div>
              </div>

              {/* Task content */}
              {currentTask && (
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-center mb-2 sm:mb-3">
                    <div className="text-lg sm:text-xl md:text-2xl mb-1">{currentTask.icon}</div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {currentTask.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                      {currentTask.description}
                    </p>
                  </div>

                  {renderTaskContent()}

                  <div className="text-center mt-3 sm:mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={checkTask}
                      className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    >
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 inline mr-1 sm:mr-2" />
                      Submit Answer
                    </motion.button>
                  </div>
                </div>
              )}
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl md:text-6xl animate-bounce">
                  🏆
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Adventure Complete!
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400">
                  Great job managing your time! 🐢
                </p>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {score}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Final Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                      {tasksCompleted}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Tasks Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {((tasksCompleted / (tasksCompleted + tasksFailed)) * 100 || 0).toFixed(0)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Accuracy
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {totalTime}s
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Total Time
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center">
                    Performance Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                        Time Management
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        You completed {tasksCompleted} out of {TOTAL_ROUNDS} tasks in {totalTime}{' '}
                        seconds.
                        {tasksCompleted > TOTAL_ROUNDS * 0.7
                          ? ' Excellent time management!'
                          : ' Keep practicing to improve your timing!'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                        Task Completion
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {tasksCompleted > tasksFailed
                          ? 'Great job staying focused!'
                          : 'Try to complete more tasks next time!'}
                        Your success rate was{' '}
                        {((tasksCompleted / (tasksCompleted + tasksFailed)) * 100 || 0).toFixed(0)}
                        %.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!suiteMode && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg"
                >
                  Back to Games
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TimeTurtle;
