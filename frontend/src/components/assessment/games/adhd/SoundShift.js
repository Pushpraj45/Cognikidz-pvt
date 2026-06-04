import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckIcon,
  ClockIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const SOUNDS = [
  { id: 'bell', name: 'Bell', emoji: '🔔', target: true, audio: '🔔' },
  { id: 'whistle', name: 'Whistle', emoji: '📢', target: true, audio: '📢' },
  { id: 'chime', name: 'Chime', emoji: '🎵', target: true, audio: '🎵' },
  { id: 'laugh', name: 'Laugh', emoji: '😄', target: false, audio: '😄' },
  { id: 'music', name: 'Music', emoji: '🎶', target: false, audio: '🎶' },
  { id: 'voice', name: 'Voice', emoji: '🗣️', target: false, audio: '🗣️' },
];

const TOTAL_ROUNDS = 20; // Increased from 10 to 20 for proper game duration (9 minutes)
const SOUNDS_PER_ROUND = 15;
const SOUND_INTERVAL = 800; // 0.8 seconds (0.3 seconds slower as requested)

function getRandomSoundSequence(length, targetSounds) {
  const sequence = [];
  let targetCount = 0;
  let nonTargetCount = 0;

  for (let i = 0; i < length; i++) {
    const shouldBeTarget = Math.random() < 0.3; // 30% chance of target sound
    const availableSounds = shouldBeTarget
      ? SOUNDS.filter(s => s.target)
      : SOUNDS.filter(s => !s.target);
    const randomSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];

    if (shouldBeTarget) targetCount++;
    else nonTargetCount++;

    sequence.push({
      ...randomSound,
      timestamp: Date.now() + i * SOUND_INTERVAL,
      uniqueId: `${randomSound.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
    });
  }

  console.log(
    `🎮 Generated sequence: ${targetCount} targets, ${nonTargetCount} non-targets, total: ${sequence.length}`
  );
  return sequence;
}

const SoundShift = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [gameState, setGameState] = useState('instructions'); // instructions, playing, completed
  const [currentRound, setCurrentRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctResponses, setCorrectResponses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [roundCorrectResponses, setRoundCorrectResponses] = useState(0);
  const [roundFalseAlarms, setRoundFalseAlarms] = useState(0);
  const [totalSequence, setTotalSequence] = useState([]); // Track all sounds across rounds

  // Use refs to track real-time values to avoid closure issues
  const correctResponsesRef = useRef(0);
  const falseAlarmsRef = useRef(0);
  const missedTargetsRef = useRef(0);
  const scoreRef = useRef(0);
  const reactionTimesRef = useRef([]);

  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioContextInitialized = useRef(false);
  const gameStartTimeRef = useRef(null);
  const sequenceRef = useRef(null); // Store sequence reference to avoid closure issues
  const toastShownRef = useRef(false); // Track if toast has been shown for current action

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 SoundShift: Auto-starting in suite mode');
      startGame();
    }
  }, [suiteMode, gameState]);

  // Initialize audio context
  useEffect(() => {
    if (gameState === 'playing' && !audioContextInitialized.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioContextInitialized.current = true;
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('Error closing AudioContext:', error);
        }
      }
    };
  }, [gameState]);

  // Play sound effect
  const playSound = sound => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Different frequencies for different sounds
      if (sound.target) {
        oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime); // Higher pitch for targets
      } else {
        oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime); // Lower pitch for distractions
      }

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  };

  // Start game
  const startGame = () => {
    const now = Date.now();
    gameStartTimeRef.current = now;
    setGameState('playing');
    setCurrentRound(1);
    setScore(0);
    setCorrectResponses(0);
    setFalseAlarms(0);
    setMissedTargets(0);
    setReactionTimes([]);
    setRoundCorrectResponses(0);
    setRoundFalseAlarms(0);
    setStartTime(now);
    setRoundStartTime(now);
    setTotalSequence([]); // Reset total sequence

    // Reset refs
    correctResponsesRef.current = 0;
    falseAlarmsRef.current = 0;
    missedTargetsRef.current = 0;
    scoreRef.current = 0;
    reactionTimesRef.current = [];

    startRound(1);
  };

  // Start a round
  const startRound = roundNum => {
    console.log(`🎮 Starting round ${roundNum} of ${TOTAL_ROUNDS}`);
    const seq = getRandomSoundSequence(
      SOUNDS_PER_ROUND,
      SOUNDS.filter(s => s.target)
    );
    setSequence(seq);
    sequenceRef.current = seq; // Store reference
    setCurrentSoundIndex(0);
    setRoundStartTime(Date.now());
    setRoundCorrectResponses(0);
    setRoundFalseAlarms(0);

    // Add this round's sequence to total sequence
    setTotalSequence(prev => {
      const newTotal = [...prev, ...seq];
      console.log(`🎮 Round ${roundNum} - Total sequence length:`, newTotal.length);
      return newTotal;
    });

    playSoundSequence(seq, roundNum);
  };

  // Play sound sequence - FIXED VERSION
  const playSoundSequence = (seq, roundNum) => {
    let idx = 0;
    setCurrentSoundIndex(0);

    // Reset toast flag for new round
    toastShownRef.current = false;

    // Show starting message
    if (!toastShownRef.current) {
      toast.loading(`Round ${roundNum}: Listen carefully... `, { duration: 1000 });
      toastShownRef.current = true;
    }

    intervalRef.current = setInterval(() => {
      if (idx < seq.length) {
        const currentSound = seq[idx]; // Store reference to avoid undefined access
        setCurrentSoundIndex(idx);
        playSound(currentSound);

        // Give user time to respond to the current sound
        setTimeout(() => {
          // Check if user missed this target sound - use stored reference and check responded flag
          if (currentSound && currentSound.target && !currentSound.responded) {
            console.log('⏰ Missed target sound:', currentSound);
            setMissedTargets(m => m + 1);
            missedTargetsRef.current += 1;
          }
        }, 1000); // Give 1000ms to respond

        idx++;
      } else {
        clearInterval(intervalRef.current);

        // Check if this was the last round
        if (roundNum >= TOTAL_ROUNDS) {
          const finalTime = gameStartTimeRef.current
            ? ((Date.now() - gameStartTimeRef.current) / 1000).toFixed(1)
            : 0;
          console.log('🎮 Game completed, final time:', finalTime, 'seconds');
          setGameState('completed');
          setTotalTime(finalTime);

          // Add a small delay to ensure all state updates are processed
          setTimeout(() => {
            console.log('🎮 Final ref values before completion:', {
              correctResponses: correctResponsesRef.current,
              falseAlarms: falseAlarmsRef.current,
              missedTargets: missedTargetsRef.current,
              score: scoreRef.current,
              reactionTimes: reactionTimesRef.current.length,
            });
            handleGameComplete(finalTime);
          }, 100);
        } else {
          // Start next round after a short delay
          setTimeout(() => {
            setCurrentRound(roundNum + 1);
            startRound(roundNum + 1);
          }, 2000);
        }
      }
    }, SOUND_INTERVAL);
  };

  // Handle tap (response)
  const handleTap = () => {
    if (gameState !== 'playing' || currentSoundIndex >= sequence.length) return;

    // Reset toast flag for this tap
    toastShownRef.current = false;

    const currentSound = sequence[currentSoundIndex];
    if (!currentSound) return; // Safety check

    const reactionTime = Date.now() - currentSound.timestamp;

    console.log(' Tap detected:', {
      currentSoundIndex,
      sound: currentSound,
      isTarget: currentSound.target,
      reactionTime,
    });

    // Check if this sound was already responded to
    if (currentSound.responded) {
      console.log('⚠️ Sound already responded to, ignoring tap');
      return;
    }

    // Mark this sound as responded to
    currentSound.responded = true;

    if (currentSound.target) {
      // Correct response to target sound
      setCorrectResponses(c => c + 1);
      setRoundCorrectResponses(c => c + 1);
      setScore(s => s + 10);
      setReactionTimes(prev => [...prev, reactionTime]);

      // Update refs for real-time tracking
      correctResponsesRef.current += 1;
      scoreRef.current += 10;
      reactionTimesRef.current.push(reactionTime);

      console.log('✅ Correct response to target sound');
      console.log('🎮 Updated refs:', {
        correctResponses: correctResponsesRef.current,
        score: scoreRef.current,
        reactionTimes: reactionTimesRef.current.length,
      });

      // Positive feedback
      const encouragements = [
        'Great catch! ',
        'Perfect timing! 📢',
        'Excellent! 🎵',
        'Well done! ⭐',
      ];
      const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

      if (!toastShownRef.current) {
        toast.success(randomEncouragement, {
          duration: 800,
          style: {
            background: '#10B981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
        toastShownRef.current = true;
      }
      if (!toastShownRef.current) {
        toast.success(randomEncouragement, {
          duration: 800,
          style: {
            background: '#10B981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
        toastShownRef.current = true;
      }
    } else {
      // False alarm (tapped on non-target sound)
      setFalseAlarms(f => f + 1);
      setRoundFalseAlarms(f => f + 1);
      setScore(s => Math.max(0, s - 5));

      // Update refs for real-time tracking
      falseAlarmsRef.current += 1;
      scoreRef.current = Math.max(0, scoreRef.current - 5);

      console.log('❌ False alarm - tapped on non-target sound');
      console.log('🎮 Updated refs:', {
        falseAlarms: falseAlarmsRef.current,
        score: scoreRef.current,
      });

      // Gentle correction feedback
      if (!toastShownRef.current) {
        toast.error("Oops! That wasn't a target sound 🤔", {
          duration: 1000,
          style: {
            background: '#F59E0B',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
        toastShownRef.current = true;
      }
      if (!toastShownRef.current) {
        toast.error("Oops! That wasn't a target sound 🤔", {
          duration: 1000,
          style: {
            background: '#F59E0B',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
        toastShownRef.current = true;
      }
    }
  };

  // Check for missed targets at the end of each round
  useEffect(() => {
    if (gameState === 'playing' && currentSoundIndex >= sequence.length && sequence.length > 0) {
      const targetsInRound = sequence.filter(s => s.target).length;
      const respondedTargets = sequence.filter(s => s.target && s.responded).length;
      const missed = targetsInRound - respondedTargets;

      console.log('🎮 Round complete - missed targets calculation:', {
        targetsInRound,
        respondedTargets,
        missed,
        roundCorrectResponses,
      });

      if (missed > 0) {
        setMissedTargets(m => m + missed);
        missedTargetsRef.current += missed;
      }
    }
  }, [currentSoundIndex, sequence, roundCorrectResponses, gameState]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Render sound indicator with improved visibility
  const renderSoundIndicator = (sound, isCurrent) => {
    const base = `w-14 h-14 md:w-16 md:h-16 m-2 flex items-center justify-center rounded-xl shadow-lg text-xl transition-all duration-300 border-2`;
    const colorClass = sound.target
      ? 'bg-green-500 text-white border-green-600'
      : 'bg-gray-500 text-white border-gray-600';
    const currentClass = isCurrent ? 'ring-4 ring-yellow-300 scale-110 shadow-xl' : '';
    const respondedClass = sound.responded ? 'opacity-50' : '';

    return (
      <motion.div
        key={sound.uniqueId}
        className={base + ' ' + colorClass + ' ' + currentClass + ' ' + respondedClass}
        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
      >
        {sound.emoji}
        {sound.responded && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
            ✓
          </div>
        )}
      </motion.div>
    );
  };

  // Handle game completion - FIXED DATA STRUCTURE
  const handleGameComplete = async finalTime => {
    // Use ref values for accurate data capture
    const finalCorrectResponses = correctResponsesRef.current;
    const finalFalseAlarms = falseAlarmsRef.current;
    const finalMissedTargets = missedTargetsRef.current;
    const finalScore = scoreRef.current;
    const finalReactionTimes = reactionTimesRef.current;

    console.log('🎮 handleGameComplete - Ref values:', {
      correctResponses: finalCorrectResponses,
      falseAlarms: finalFalseAlarms,
      missedTargets: finalMissedTargets,
      score: finalScore,
      reactionTimesCount: finalReactionTimes.length,
    });

    console.log('🎮 handleGameComplete - State values:', {
      correctResponses,
      falseAlarms,
      missedTargets,
      score,
      totalSequenceLength: totalSequence.length,
    });

    // Calculate accuracy properly - ensure it's never 0 if user participated
    const totalResponses = finalCorrectResponses + finalFalseAlarms;
    const accuracy = totalResponses > 0 ? (finalCorrectResponses / totalResponses) * 100 : 0;

    // Ensure minimum accuracy if user participated but got no correct responses
    const finalAccuracy = totalResponses > 0 ? Math.max(accuracy, 1) : 0;

    // Calculate total target sounds presented across all rounds
    const totalTargetSounds = totalSequence.filter(s => s.target).length;
    const totalNonTargetSounds = totalSequence.filter(s => !s.target).length;

    console.log('🎮 handleGameComplete - Sequence analysis:', {
      totalSequenceLength: totalSequence.length,
      totalTargetSounds,
      totalNonTargetSounds,
      totalSequence: totalSequence.map(s => ({
        id: s.id,
        target: s.target,
        responded: s.responded,
      })),
    });

    console.log('🎮 SoundShift game completed with:', {
      score: finalScore,
      correctResponses: finalCorrectResponses,
      falseAlarms: finalFalseAlarms,
      missedTargets: finalMissedTargets,
      totalResponses,
      accuracy: finalAccuracy,
      finalTime,
      totalTargetSounds,
      totalNonTargetSounds,
      totalSequenceLength: totalSequence.length,
    });

    const gameResults = {
      gameId: 'sound-shift',
      gameType: 'sound-shift',
      score: finalScore,
      accuracy: finalAccuracy / 100, // Convert to decimal for backend
      totalTime: parseFloat(finalTime),
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      roundsCompleted: currentRound,
      gameSpecificData: {
        totalRounds: TOTAL_ROUNDS,
        roundsCompleted: currentRound,
        finalScore: finalScore,
        correctResponses: finalCorrectResponses,
        falseAlarms: finalFalseAlarms,
        missedTargets: finalMissedTargets,
        auditoryAttentionAccuracy: finalAccuracy,
        averageReactionTime:
          finalReactionTimes.length > 0
            ? finalReactionTimes.reduce((a, b) => a + b, 0) / finalReactionTimes.length
            : 0,
        // Add additional fields for better tracking
        distractionsClicked: finalFalseAlarms,
        falseClicks: finalFalseAlarms,
        totalClicks: finalCorrectResponses + finalFalseAlarms,
        targetSoundsPresented: totalTargetSounds,
        nonTargetSoundsPresented: totalNonTargetSounds,
        totalInteractions: finalCorrectResponses + finalFalseAlarms + finalMissedTargets,
        participationRate: totalResponses > 0 ? 100 : 0, // Always 100% if user participated
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 SoundShift completed in suite mode, calling onGameComplete');
      onGameComplete(gameResults);
      return;
    }

    // If not in suite mode, save to database
    try {
      console.log('🎮 Saving SoundShift results to database');

      // Check if we have childId
      if (!childId) {
        console.warn('⚠️ No childId available for SoundShift');
        toast.error('Unable to save results - missing child information');
        return;
      }

      // Generate a session ID for individual games
      const sessionId = `individual_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const performanceData = {
        score: finalScore,
        accuracy: finalAccuracy / 100, // Convert to decimal for backend consistency
        totalTime: parseFloat(finalTime),
        duration: parseFloat(finalTime),
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        level: currentRound,
        gameSpecificData: {
          totalRounds: TOTAL_ROUNDS,
          roundsCompleted: currentRound,
          finalScore: finalScore,
          correctResponses: finalCorrectResponses,
          falseAlarms: finalFalseAlarms,
          missedTargets: finalMissedTargets,
          auditoryAttentionAccuracy: finalAccuracy,
          averageReactionTime:
            finalReactionTimes.length > 0
              ? finalReactionTimes.reduce((a, b) => a + b, 0) / finalReactionTimes.length
              : 0,
          // Add additional fields for better tracking
          distractionsClicked: finalFalseAlarms,
          falseClicks: finalFalseAlarms,
          totalClicks: finalCorrectResponses + finalFalseAlarms,
          targetSoundsPresented: totalTargetSounds,
          nonTargetSoundsPresented: totalNonTargetSounds,
          totalInteractions: finalCorrectResponses + finalFalseAlarms + finalMissedTargets,
          participationRate: totalResponses > 0 ? 100 : 0,
        },
      };

      console.log('🎮 Saving SoundShift performance data:', performanceData);
      console.log('🎮 API call parameters:', {
        sessionId,
        gameId: 'sound-shift',
        batteryId: 'adhd-individual-games',
        childId,
        performanceData,
      });

      // Check authentication token
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('🎮 Authentication token available:', !!token);

      const result = await AssessmentService.completeGame(
        sessionId,
        'sound-shift',
        'adhd-individual-games',
        performanceData,
        childId
      );

      console.log('🎮 SoundShift save result:', result);

      if (result && result.success) {
        console.log('✅ SoundShift results saved successfully');
        toast.success('Game results saved successfully! 🎉', {
          duration: 3000,
          style: {
            background: '#10B981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          },
        });

        // Dispatch game completed event for history updates
        const gameCompletedEvent = new CustomEvent('gameCompleted', {
          detail: {
            gameId: 'sound-shift',
            childId: childId,
            score: finalScore,
            accuracy: finalAccuracy,
          },
        });
        console.log('🎮 Dispatching game completed event:', gameCompletedEvent.detail);
        window.dispatchEvent(gameCompletedEvent);
      } else {
        console.error('❌ SoundShift save failed - no success response:', result);
        toast.error('Failed to save game results - server error', {
          duration: 3000,
          style: {
            background: '#EF4444',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
      }
    } catch (error) {
      console.error('❌ Error saving SoundShift results:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // Show more specific error messages
      if (error.response?.status === 401) {
        toast.error('Authentication failed - please log in again');
      } else if (error.response?.status === 404) {
        toast.error('Server endpoint not found - please contact support');
      } else if (error.response?.status === 500) {
        toast.error('Server error - please try again later');
      } else if (!error.response) {
        toast.error('Network error - please check your connection');
      } else {
        toast.error(`Failed to save game results: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 mt-4 sm:mt-8">
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                  <SpeakerWaveIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Sound Shift
                </h1>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Auditory Attention Game
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                  Tap the button ONLY when you hear target sounds (🔔, 📢, 🎵). Ignore distractions!
                </p>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Target Sounds:
                </h3>
                <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {SOUNDS.filter(s => s.target).map(sound => (
                    <div key={sound.id} className="text-center">
                      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{sound.emoji}</div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {sound.name}
                      </div>
                    </div>
                  ))}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Distractions (Don't tap):
                </h3>
                <div className="flex justify-center gap-3 sm:gap-4">
                  {SOUNDS.filter(s => !s.target).map(sound => (
                    <div key={sound.id} className="text-center">
                      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{sound.emoji}</div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {sound.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={startGame}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-base sm:text-lg rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 inline mr-2" />
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
              className="text-center flex flex-col h-full"
            >
              {/* Header Stats */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Round {currentRound} / {TOTAL_ROUNDS}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {score}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                      {correctResponses}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                      {falseAlarms}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">False Alarms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                      {gameStartTimeRef.current
                        ? Math.round((Date.now() - gameStartTimeRef.current) / 1000)
                        : 0}
                      s
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Time</div>
                  </div>
                </div>
              </div>

              {/* Game Layout - Responsive Design */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
                {/* Left Side - Sound Indicators */}
                <div className="flex-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 min-h-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Round {currentRound} Sound Sequence
                  </h3>
                  <div className="mb-3 sm:mb-4 text-center">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Progress: {currentSoundIndex + 1} / {sequence.length}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentSoundIndex + 1) / sequence.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="h-48 sm:h-64 lg:h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-wrap justify-center items-start gap-1 sm:gap-2">
                      {sequence.map((sound, idx) =>
                        renderSoundIndicator(sound, idx === currentSoundIndex)
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Tap Button */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="text-center w-full">
                    <div className="mb-4 sm:mb-6">
                      <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                        Tap when you hear target sounds!
                      </p>
                      <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        {SOUNDS.filter(s => s.target).map(sound => (
                          <div key={sound.id} className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">
                              {sound.emoji}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {sound.name}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                          💡 <strong>Tip:</strong> Only tap when you hear , , or sounds. Ignore all
                          others!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTap}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold rounded-full shadow-lg hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 border-4 border-white/20"
                    >
                      TAP
                    </button>
                  </div>
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Game Complete!
                </h1>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {score}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Final Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                      {correctResponses}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Correct Responses
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                      {falseAlarms}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      False Alarms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {totalTime}s
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Total Time
                    </div>
                  </div>
                </div>
              </div>
              {!suiteMode && (
                <button
                  onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-500 text-white font-bold text-sm sm:text-base rounded-lg hover:bg-indigo-600 transition-colors"
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

export default SoundShift;
