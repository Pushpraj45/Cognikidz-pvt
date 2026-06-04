import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const TILE_COLORS = [
  { class: 'bg-blue-500', name: 'Blue', emoji: '🔵' },
  { class: 'bg-green-500', name: 'Green', emoji: '🟢' },
  { class: 'bg-yellow-500', name: 'Yellow', emoji: '🟡' },
  { class: 'bg-pink-500', name: 'Pink', emoji: '🩷' },
  { class: 'bg-purple-500', name: 'Purple', emoji: '🟣' },
];

const TOTAL_ROUNDS = 15; // Increased from 5 to 15 for proper game duration (9 minutes)
const ENCOURAGEMENTS = [
  'Super hop! 🦘',
  'Perfect jump! ⭐',
  'Amazing! 🌟',
  "You're doing great! 💪",
  'Fantastic hopping! 🎉',
  'Keep it up! 👍',
];

function getRandomTileSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * TILE_COLORS.length));
}

const HyperHop = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [gameState, setGameState] = useState('instructions'); // instructions, playing, completed
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showingSequence, setShowingSequence] = useState(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(-1);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const toastShownRef = useRef(false); // Track if toast has been shown for current action

  const MAX_ATTEMPTS = 3;

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 HyperHop: Auto-starting in suite mode');
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
    setCorrectRounds(0);
    setStartTime(Date.now());
    toastShownRef.current = false; // Reset toast flag
    startRound(1);
  };

  // Start a round - much easier progression for ADHD children
  const startRound = roundNum => {
    // Start with 2 tiles, very slowly increase
    const tileCount = Math.min(2 + Math.floor((roundNum - 1) / 2), 4);
    const seq = getRandomTileSequence(tileCount);
    setSequence(seq);
    setUserInput([]);
    setShowingSequence(true);
    setCurrentSequenceIndex(-1);
    setWrongAttempts(0); // Reset attempts for new round
  };

  // Handle tile click
  const handleTileClick = tileIdx => {
    if (gameState !== 'playing' || showingSequence) return;

    // Reset toast flag for this click
    toastShownRef.current = false;

    const nextInput = [...userInput, tileIdx];
    setUserInput(nextInput);

    if (sequence[nextInput.length - 1] !== tileIdx) {
      setErrors(e => e + 1);
      setWrongAttempts(prev => {
        const newWrongAttempts = prev + 1;

        if (newWrongAttempts >= MAX_ATTEMPTS) {
          // Max attempts reached, move to next round with encouragement
          if (!toastShownRef.current) {
            toast.error("That's okay! Let's hop to the next pattern! 🦘", {
              duration: 2000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
            toastShownRef.current = true;
          }

          setTimeout(() => {
            if (round < TOTAL_ROUNDS) {
              const nextRound = round + 1;
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
          // Show encouraging message with remaining attempts
          const remainingAttempts = MAX_ATTEMPTS - newWrongAttempts;
          if (!toastShownRef.current) {
            toast.error(`Oops! ${remainingAttempts} more hops to try! 🦘`, {
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
              toast.success("Try again! You've got this! 💪", { duration: 1000 });
              toastShownRef.current = true;
            }
          }, 1500);
        }

        return newWrongAttempts;
      });
      return;
    }

    // Positive feedback for correct hops
    if (!toastShownRef.current) {
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      toast.success(encouragement, { duration: 1000 });
      toastShownRef.current = true;
    }

    if (nextInput.length === sequence.length) {
      setScore(s => s + sequence.length * 20); // More generous scoring
      setCorrectRounds(c => c + 1); // Increment correct rounds
      if (!toastShownRef.current) {
        toast.success('Perfect round! All hops correct! 🎉', { duration: 2000 });
        toastShownRef.current = true;
      }

      if (round < TOTAL_ROUNDS) {
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          startRound(nextRound);
        }, 2500); // More time to enjoy success
      } else {
        const finalTime = (Date.now() - startTime) / 1000;
        setGameState('completed');
        setTotalTime(finalTime.toFixed(1));
        handleGameComplete(finalTime);
      }
    }
  };

  // Handle game completion
  const handleGameComplete = async finalTime => {
    // Prevent multiple calls
    if (gameState === 'completed') {
      console.log('Game already completed, skipping duplicate call');
      return;
    }

    const accuracy = Math.max(
      round > 0 ? ((round * sequence.length - errors) / (round * sequence.length)) * 100 : 0,
      0
    );
    const gameResults = {
      gameId: 'hyper-hop',
      gameType: 'hyper-hop',
      score: score,
      accuracy: accuracy,
      totalTime: finalTime,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      roundsCompleted: Math.min(round, TOTAL_ROUNDS), // Ensure we don't exceed total rounds
      errors: errors,
      gameSpecificData: {
        totalRounds: TOTAL_ROUNDS,
        roundsCompleted: Math.min(round, TOTAL_ROUNDS),
        correctRounds: correctRounds, // Add correct rounds count
        finalScore: score,
        errorCount: errors,
        motorControlAccuracy: accuracy,
        sequenceReproduction: accuracy,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 HyperHop completed in suite mode, calling onGameComplete');
      onGameComplete(gameResults);
      return;
    }

    // If not in suite mode, save to database
    try {
      console.log('🎮 Saving HyperHop results to database');

      // Check if we have childId
      if (!childId) {
        console.warn('⚠️ No childId available for HyperHop');
        toast.error('Unable to save results - missing child information');
        return;
      }

      // Generate a session ID for individual games
      const sessionId = `individual_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const performanceData = {
        score: score,
        accuracy: accuracy / 100, // Convert to decimal
        totalTime: finalTime,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        level: Math.min(round, TOTAL_ROUNDS),
        gameSpecificData: {
          totalRounds: TOTAL_ROUNDS,
          roundsCompleted: Math.min(round, TOTAL_ROUNDS),
          correctRounds: correctRounds, // Add correct rounds count
          finalScore: score,
          errorCount: errors,
          motorControlAccuracy: accuracy,
          sequenceReproduction: accuracy,
        },
      };

      await AssessmentService.completeGame(
        sessionId,
        'hyper-hop',
        'adhd-individual-games',
        performanceData,
        childId // Add childId for individual game sessions
      );

      console.log('✅ HyperHop results saved successfully');
      toast.success('Game results saved successfully!');
    } catch (error) {
      console.error('Error saving game results:', error);
      toast.error('Failed to save game results');
    }
  };

  // Render tile with child-friendly design
  const renderTile = (colorIdx, key, highlight, isSequenceShow = false) => {
    const tileInfo = TILE_COLORS[colorIdx];
    const base = `w-20 h-20 md:w-24 md:h-24 m-3 flex flex-col items-center justify-center rounded-2xl shadow-xl text-white text-lg font-bold cursor-pointer transition-all duration-300 transform`;

    return (
      <motion.button
        key={key}
        onClick={() => !isSequenceShow && handleTileClick(colorIdx)}
        className={
          base +
          ' ' +
          tileInfo.class +
          (highlight ? ' ring-4 ring-yellow-300 scale-125 shadow-2xl' : ' hover:scale-110')
        }
        whileHover={!isSequenceShow ? { scale: 1.1 } : {}}
        whileTap={!isSequenceShow ? { scale: 0.95 } : {}}
        disabled={showingSequence}
        initial={{ scale: 0 }}
        animate={{ scale: highlight ? 1.25 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="text-2xl mb-1">{tileInfo.emoji}</div>
        <div className="text-xs uppercase tracking-wide">{tileInfo.name}</div>
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
          toast.success("Now it's your turn to hop! 🦘");
        }
      }, 1200); // Slower sequence showing for better processing

      return () => clearInterval(interval);
    }
  }, [showingSequence, sequence]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 py-8 mt-8">
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
              <div className="mb-8">
                <motion.div
                  className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-6xl">🦘</span>
                </motion.div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Hyper Hop</h1>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Fun Hopping Game! 🌟
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                  Watch the colorful tiles light up, then hop (click) on them in the same order!
                  <br />
                  Take your time and have fun hopping! 🎉
                </p>
              </div>
              <motion.button
                onClick={startGame}
                className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayIcon className="w-8 h-8 inline mr-3" />
                Start Hopping! 🦘
              </motion.button>
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Round {round} of {TOTAL_ROUNDS} 🦘
                </h2>
                <div className="flex justify-center items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-6 h-6 text-yellow-500" />
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {score}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartIcon className="w-6 h-6 text-red-500" />
                    <span className="text-lg text-gray-600 dark:text-gray-400">
                      {showingSequence ? 'Watch carefully! 👀' : 'Your turn to hop! 🦘'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 mb-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  {showingSequence ? 'Watch the pattern! 👀' : 'Hop on the tiles in order! 🦘'}
                </p>
                <div className="flex flex-wrap justify-center mb-8">
                  {TILE_COLORS.map((_, idx) =>
                    renderTile(
                      idx,
                      idx,
                      showingSequence &&
                        currentSequenceIndex >= 0 &&
                        sequence[currentSequenceIndex] === idx,
                      showingSequence
                    )
                  )}
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2">
                  {sequence.map((tileIdx, idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
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
              <div className="mb-8">
                <motion.div
                  className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: 2 }}
                >
                  <span className="text-6xl">🏆</span>
                </motion.div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Fantastic Hopping! 🎉
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                  You hopped through all the patterns! You're amazing! ⭐
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {score}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 font-medium">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {round}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 font-medium">
                      Rounds Hopped
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {totalTime}s
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 font-medium">Hopping Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🦘</div>
                    <div className="text-gray-600 dark:text-gray-400 font-medium">
                      Super Hopper!
                    </div>
                  </div>
                </div>
              </div>

              {!suiteMode && (
                <motion.button
                  onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  More Fun Games! 🎮
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HyperHop;
