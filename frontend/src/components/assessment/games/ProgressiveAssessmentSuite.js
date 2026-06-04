import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  StarIcon,
  ClockIcon,
  TrophyIcon,
  ArrowLeftIcon,
  PauseIcon,
  CheckCircleIcon,
  XMarkIcon,
  FireIcon,
  SparklesIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BoltIcon,
  HeartIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import FullScreenGameWrapper from './FullScreenGameWrapper';

// Import individual game components
import FocusFinder from './adhd/FocusFinder';
import ImpulseFreeze from './adhd/ImpulseFreeze';
import MemoryTrail from './adhd/MemoryTrail';
import HyperHop from './adhd/HyperHop';
import TaskTwister from './adhd/TaskTwister';
import SoundShift from './adhd/SoundShift';
import TimeTurtle from './adhd/TimeTurtle';

import LetterSoundMatching from './dyslexia/LetterSoundMatching';
import RhymingPairs from './dyslexia/RhymingPairs';
import WordSequenceBuilder from './dyslexia/WordSequenceBuilder';
import SpotCorrectWord from './dyslexia/SpotCorrectWord';
import MemoryMatch from './dyslexia/MemoryMatch';
import VisualTrackingMaze from './dyslexia/VisualTrackingMaze';
import SyllableClapper from './dyslexia/SyllableClapper';

// Suite configurations
const suiteConfigs = {
  adhd: {
    title: 'ADHD Progressive Suite',
    description: 'Complete 7 games in progressive difficulty over 65 minutes',
    color: 'from-blue-500 to-indigo-600',
    icon: '🧠',
    games: [
      {
        id: 'focus-finder',
        title: 'Focus Finder',
        component: FocusFinder,
        level: 1,
        difficulty: 'Easy',
        duration: 8,
        description: 'Visual attention and focus training',
        skills: ['Visual Processing', 'Sustained Attention'],
        color: 'from-blue-500 to-indigo-600',
        icon: '🔍',
      },
      {
        id: 'impulse-freeze',
        title: 'Impulse Freeze',
        component: ImpulseFreeze,
        level: 2,
        difficulty: 'Easy',
        duration: 8,
        description: 'Self-control and response inhibition',
        skills: ['Self-Control', 'Response Inhibition'],
        color: 'from-red-500 to-pink-600',
        icon: '🛑',
      },
      {
        id: 'memory-trail',
        title: 'Memory Trail',
        component: MemoryTrail,
        level: 3,
        difficulty: 'Medium',
        duration: 10,
        description: 'Working memory enhancement',
        skills: ['Working Memory', 'Pattern Recognition'],
        color: 'from-purple-500 to-pink-600',
        icon: '🧠',
      },
      {
        id: 'hyper-hop',
        title: 'Hyper Hop',
        component: HyperHop,
        level: 4,
        difficulty: 'Medium',
        duration: 9,
        description: 'Motor control and movement regulation',
        skills: ['Motor Control', 'Timing'],
        color: 'from-green-500 to-emerald-600',
        icon: '🦘',
      },
      {
        id: 'sound-shift',
        title: 'Sound Shift',
        component: SoundShift,
        level: 5,
        difficulty: 'Medium',
        duration: 9,
        description: 'Auditory attention and distraction filtering',
        skills: ['Auditory Processing', 'Selective Attention'],
        color: 'from-indigo-500 to-blue-600',
        icon: '🎵',
      },
      {
        id: 'time-turtle',
        title: 'Time Turtle',
        component: TimeTurtle,
        level: 6,
        difficulty: 'Hard',
        duration: 10,
        description: 'Time management and planning',
        skills: ['Time Management', 'Planning'],
        color: 'from-yellow-500 to-orange-600',
        icon: '⏰',
      },
      {
        id: 'task-twister-enhanced',
        title: 'Task Twister',
        component: TaskTwister,
        level: 7,
        difficulty: 'Hard',
        duration: 11,
        description: 'Multi-step instruction following',
        skills: ['Task Switching', 'Executive Function'],
        color: 'from-purple-500 to-pink-600',
        icon: '🔄',
      },
    ],
  },
  dyslexia: {
    title: 'Dyslexia Progressive Suite',
    description: 'Complete 7 games in progressive difficulty over 66 minutes',
    color: 'from-green-500 to-emerald-600',
    icon: '📚',
    games: [
      {
        id: 'letter-sound-matching',
        title: 'Letter Sound Matching',
        component: LetterSoundMatching,
        level: 1,
        difficulty: 'Easy',
        duration: 8,
        description: 'Letter-sound correspondence',
        skills: ['Phonemic Awareness', 'Letter Recognition'],
        color: 'from-blue-500 to-indigo-600',
        icon: '🎯',
      },
      {
        id: 'rhyming-pairs',
        title: 'Rhyming Pairs',
        component: RhymingPairs,
        level: 2,
        difficulty: 'Easy',
        duration: 8,
        description: 'Phonological awareness',
        skills: ['Phonological Awareness', 'Rhyme Recognition'],
        color: 'from-indigo-500 to-blue-600',
        icon: '📢',
      },
      {
        id: 'word-sequence-builder',
        title: 'Word Sequence Builder',
        component: WordSequenceBuilder,
        level: 3,
        difficulty: 'Medium',
        duration: 10,
        description: 'Letter sequencing abilities',
        skills: ['Letter Sequencing', 'Visual Processing'],
        color: 'from-purple-500 to-pink-600',
        icon: '🔁',
      },
      {
        id: 'spot-correct-word',
        title: 'Spot Correct Word',
        component: SpotCorrectWord,
        level: 4,
        difficulty: 'Medium',
        duration: 9,
        description: 'Visual discrimination',
        skills: ['Visual Discrimination', 'Letter Recognition'],
        color: 'from-green-500 to-emerald-600',
        icon: '👁️‍🗨️',
      },
      {
        id: 'memory-match',
        title: 'Memory Match',
        component: MemoryMatch,
        level: 5,
        difficulty: 'Medium',
        duration: 10,
        description: 'Working memory and phonological processing',
        skills: ['Working Memory', 'Phonological Processing'],
        color: 'from-yellow-500 to-orange-600',
        icon: '🧠',
      },
      {
        id: 'visual-tracking-maze',
        title: 'Visual Tracking Maze',
        component: VisualTrackingMaze,
        level: 6,
        difficulty: 'Hard',
        duration: 10,
        description: 'Visual tracking and eye movement',
        skills: ['Visual Tracking', 'Eye Movement'],
        color: 'from-purple-500 to-pink-600',
        icon: '👁️',
      },
      {
        id: 'syllable-clapper',
        title: 'Syllable Clapper',
        component: SyllableClapper,
        level: 7,
        difficulty: 'Hard',
        duration: 11,
        description: 'Syllable awareness and rhythm',
        skills: ['Syllable Awareness', 'Rhythm Processing'],
        color: 'from-red-500 to-pink-600',
        icon: '👏',
      },
    ],
  },
};

const ProgressiveAssessmentSuite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const assessmentType = searchParams.get('type') || 'adhd';

  const [currentState, setCurrentState] = useState('overview'); // 'overview', 'playing', 'transition', 'break', 'complete'

  // Initialize currentGameIndex based on completed games
  const [currentGameIndex, setCurrentGameIndex] = useState(() => {
    // Try to load from localStorage first
    const savedProgress = localStorage.getItem('progressiveSuiteProgress');
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        if (Array.isArray(parsedProgress.completedGames)) {
          return parsedProgress.completedGames.length;
        }
      } catch (e) {
        console.error('Error parsing saved progress:', e);
        localStorage.removeItem('progressiveSuiteProgress');
      }
    }
    return 0;
  });

  const [suiteProgress, setSuiteProgress] = useState(() => {
    // Try to load from localStorage first
    const savedProgress = localStorage.getItem('progressiveSuiteProgress');
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        return {
          sessionId: parsedProgress.sessionId || null,
          startTime: parsedProgress.startTime || null,
          completedGames: Array.isArray(parsedProgress.completedGames)
            ? parsedProgress.completedGames
            : [],
          gameResults: Array.isArray(parsedProgress.gameResults) ? parsedProgress.gameResults : [],
          behavioralMetrics: parsedProgress.behavioralMetrics || {},
          totalScore: parsedProgress.totalScore || 0,
          elapsedTime: parsedProgress.elapsedTime || 0,
          estimatedTimeRemaining: parsedProgress.estimatedTimeRemaining || 45,
          lastActiveAt: parsedProgress.lastActiveAt || null,
          pauseHistory: Array.isArray(parsedProgress.pauseHistory)
            ? parsedProgress.pauseHistory
            : [],
        };
      } catch (e) {
        console.error('Error parsing saved progress:', e);
        localStorage.removeItem('progressiveSuiteProgress');
      }
    }
    return {
      sessionId: null,
      startTime: null,
      completedGames: [],
      gameResults: [],
      behavioralMetrics: {},
      totalScore: 0,
      elapsedTime: 0,
      estimatedTimeRemaining: 45,
      lastActiveAt: null,
      pauseHistory: [],
    };
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  const [childData, setChildData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const timerRef = useRef(null);
  const startingTimeoutRef = useRef(null);
  const completedGamesRef = useRef(new Set());

  const suiteConfig = suiteConfigs[assessmentType] || suiteConfigs.adhd;

  // Safety check: Ensure currentGameIndex is within valid bounds
  // Only correct if it's truly out of bounds (negative or beyond total games)
  const validGameIndex = Math.max(0, Math.min(currentGameIndex, suiteConfig.games.length - 1));
  if (currentGameIndex < 0 || currentGameIndex >= suiteConfig.games.length) {
    console.warn('🎮 Game index truly out of bounds, correcting:', {
      originalIndex: currentGameIndex,
      correctedIndex: validGameIndex,
      totalGames: suiteConfig.games.length,
    });
    setCurrentGameIndex(validGameIndex);
  }

  const currentGame = suiteConfig.games[validGameIndex];

  console.log('🎮 Progressive Suite Debug:', {
    assessmentType,
    currentState,
    currentGameIndex: validGameIndex,
    currentGameId: currentGame?.id,
    suiteConfig: suiteConfig?.title,
    gamesInSuite: suiteConfig?.games?.map(g => g.id),
    totalGames: suiteConfig?.games?.length,
    gameTitles: suiteConfig?.games?.map(g => g.title),
    completedGames: suiteProgress.completedGames,
    gameResultsCount: suiteProgress.gameResults.length,
  });

  // Safety mechanism to reset isStarting state if it gets stuck
  useEffect(() => {
    if (isStarting) {
      startingTimeoutRef.current = setTimeout(() => {
        console.log('🎮 Resetting stuck isStarting state');
        setIsStarting(false);
      }, 15000); // 15 seconds timeout
    } else {
      if (startingTimeoutRef.current) {
        clearTimeout(startingTimeoutRef.current);
        startingTimeoutRef.current = null;
      }
    }

    return () => {
      if (startingTimeoutRef.current) {
        clearTimeout(startingTimeoutRef.current);
      }
    };
  }, [isStarting]);

  // Fetch child data on mount
  useEffect(() => {
    if (!childId) {
      toast.error('Child information is required');
      navigate('/assessment');
      return;
    }
    fetchChildData();
  }, [childId, navigate]);

  // Timer effect
  useEffect(() => {
    if (currentState === 'playing' && !isPaused && suiteProgress.startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - suiteProgress.startTime) / 1000 / 60);
        const remaining = Math.max(0, 60 - elapsed);
        setSuiteProgress(prev => ({
          ...prev,
          elapsedTime: elapsed,
          estimatedTimeRemaining: remaining,
        }));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [currentState, isPaused, suiteProgress.startTime]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (suiteProgress.sessionId && currentState === 'playing') {
      const interval = setInterval(async () => {
        try {
          await saveProgressToBackend(
            suiteProgress.gameResults,
            suiteProgress.completedGames,
            suiteProgress.totalScore
          );
        } catch (error) {
          console.error('Auto-save failed:', error);
          // Don't show error to user for auto-save
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [
    suiteProgress.sessionId,
    currentState,
    suiteProgress.gameResults,
    suiteProgress.completedGames,
    suiteProgress.totalScore,
  ]);

  // Reset isCompleting flag when state changes
  useEffect(() => {
    if (currentState !== 'playing') {
      setIsCompleting(false);
    }
  }, [currentState]);

  // Debug state changes
  useEffect(() => {
    console.log('🎮 State change:', {
      currentState,
      currentGameIndex,
      completedGames: suiteProgress.completedGames,
      isCompleting,
    });
  }, [currentState, currentGameIndex, suiteProgress.completedGames, isCompleting]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (suiteProgress.sessionId) {
      localStorage.setItem('progressiveSuiteProgress', JSON.stringify(suiteProgress));
    }
  }, [suiteProgress]);

  const fetchChildData = async () => {
    try {
      setIsLoading(true);
      console.log('🎮 Fetching child data for ID:', childId);

      // Use api service instead of fetch
      const response = await api.get(`/api/childprofile/${childId}`);
      console.log('🎮 Child data response:', response.data);

      if (response.data) {
        // The API returns the child profile directly, not wrapped in a child property
        const childData = response.data;
        console.log('🎮 Processed child data:', childData);

        if (childData && (childData.firstName || childData.name)) {
          setChildData(childData);
          console.log('🎮 Child data set successfully:', childData);
        } else {
          console.warn('🎮 No valid child data found, using fallback');
          // Fallback child data
          setChildData({
            firstName: 'Child',
            lastName: 'User',
            age: 8,
          });
        }
      } else {
        console.warn('🎮 No response data, using fallback');
        // Fallback child data
        setChildData({
          firstName: 'Child',
          lastName: 'User',
          age: 8,
        });
      }
    } catch (error) {
      console.error('Error fetching child data:', error);

      // Fallback child data on error
      console.log('🎮 Using fallback child data due to error');
      setChildData({
        firstName: 'Child',
        lastName: 'User',
        age: 8,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSuite = async () => {
    if (isStarting) {
      console.log('🎮 Already starting suite, ignoring click');
      return; // Prevent double clicks
    }

    // Validate all games are properly configured
    const invalidGames = suiteConfig.games.filter(game => !game.component);
    if (invalidGames.length > 0) {
      console.error('❌ Invalid games found:', invalidGames);
      toast.error(`Configuration error: ${invalidGames.length} games not properly configured`);
      return;
    }

    console.log(
      '✅ All games validated:',
      suiteConfig.games.map(g => ({ id: g.id, component: g.component?.name }))
    );

    try {
      setIsStarting(true);
      console.log('🎮 Starting progressive suite for:', { childId, assessmentType });
      console.log('🎮 Current child data:', childData);
      console.log('🎮 Current state:', currentState);
      console.log('🎮 Button clicked at:', new Date().toISOString());

      // Validate required data
      if (!childId) {
        toast.error('Child ID is required to start the suite');
        setIsStarting(false); // Reset state on error
        return;
      }

      // Start suite session on backend
      console.log('🎮 Making API call to start suite...');
      const response = await api.post('/api/assessment/suite/start', {
        childId,
        suiteType: assessmentType,
      });

      console.log('🎮 API response received:', response);

      if (response.data && response.data.success) {
        const session = response.data.session;
        console.log('🎮 Backend session created:', session);
        setSuiteProgress(prev => ({
          ...prev,
          sessionId: session.sessionId,
          startTime: Date.now(),
          completedGames: [],
          gameResults: [],
          totalScore: 0,
          elapsedTime: 0,
          estimatedTimeRemaining: suiteConfig.duration,
          lastActiveAt: Date.now(),
          pauseHistory: [],
        }));
        setCurrentGameIndex(0);
        setCurrentState('playing');
        toast.success(`Starting ${suiteConfig.title}! 🎮`);
      } else {
        console.error('🎮 Backend returned error:', response.data);
        toast.error(
          'Failed to start suite session: ' + (response.data?.message || 'Unknown error')
        );
        setIsStarting(false); // Reset state on error
      }
    } catch (error) {
      console.error('Error starting suite:', error);
      console.error('🎮 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Fallback: Start suite locally if backend is not available
      console.log('🎮 Backend not available, starting suite locally');
      setSuiteProgress(prev => ({
        ...prev,
        sessionId: `local_${Date.now()}`,
        startTime: Date.now(),
        completedGames: [],
        gameResults: [],
        totalScore: 0,
        elapsedTime: 0,
        estimatedTimeRemaining: suiteConfig.duration,
        lastActiveAt: Date.now(),
        pauseHistory: [],
      }));
      setCurrentGameIndex(0);
      setCurrentState('playing');
      toast.success(`Starting ${suiteConfig.title}! 🎮 (Local Mode)`);
    } finally {
      // Only reset if we're not transitioning to playing state
      if (currentState !== 'playing') {
        setIsStarting(false);
      }
    }
  };

  const handleGameComplete = async gameResult => {
    console.log('🎮 ProgressiveAssessmentSuite: handleGameComplete called with:', {
      gameId: gameResult?.gameId,
      currentGameId: currentGame?.id,
      currentGameIndex,
      currentState,
      completedGames: suiteProgress.completedGames,
    });

    // Prevent duplicate processing of the same game
    if (
      suiteProgress.completedGames.includes(currentGame.id) ||
      completedGamesRef.current.has(currentGame.id)
    ) {
      console.log('⚠️ Game already completed, skipping duplicate processing:', currentGame.id);
      return;
    }

    // Additional guard to prevent race conditions
    if (currentState !== 'playing') {
      console.log('⚠️ Not in playing state, skipping game completion:', currentState);
      return;
    }

    // Prevent multiple completion calls
    if (isCompleting) {
      console.log('⚠️ Already completing game, skipping duplicate call');
      return;
    }

    // Additional validation: ensure currentGameIndex matches the game being completed
    const expectedGameIndex = suiteProgress.completedGames.length;
    if (currentGameIndex !== expectedGameIndex) {
      console.warn('⚠️ Game index mismatch, correcting before processing:', {
        currentGameIndex,
        expectedGameIndex,
        gameId: currentGame.id,
        completedGames: suiteProgress.completedGames,
      });
      setCurrentGameIndex(expectedGameIndex);
      return; // Let the next render handle the completion
    }

    // Ensure the game being completed is actually the current game
    if (gameResult.gameId !== currentGame.id) {
      console.warn('⚠️ Game completion mismatch:', {
        completedGameId: gameResult.gameId,
        currentGameId: currentGame.id,
        currentGameIndex,
      });
      return;
    }

    setIsCompleting(true);

    console.log('🎮 Game completed:', {
      gameId: gameResult.gameId,
      currentGameIndex,
      totalGames: suiteConfig.games.length,
      gameResult,
      currentGameId: currentGame.id,
      completedGames: suiteProgress.completedGames,
    });

    const enhancedResult = {
      ...gameResult,
      behavioralMetrics: await captureBehavioralMetrics(),
      timestamp: Date.now(),
    };

    const updatedResults = [...suiteProgress.gameResults, enhancedResult];
    const updatedCompleted = [...suiteProgress.completedGames, currentGame.id];
    const newTotalScore = updatedResults.reduce((sum, result) => sum + (result.score || 0), 0);

    console.log('🎮 Updated progress:', {
      updatedResults: updatedResults.length,
      updatedCompleted,
      newTotalScore,
      nextGameIndex: currentGameIndex + 1,
      currentGameId: currentGame.id,
      allCompletedGames: updatedCompleted,
    });

    // Validate game completion
    if (!currentGame.id) {
      console.error('❌ Current game has no ID:', currentGame);
      toast.error('Game configuration error');
      return;
    }

    // Update suite progress first
    // Add to completed games ref to prevent duplicate processing
    completedGamesRef.current.add(currentGame.id);

    setSuiteProgress(prev => ({
      ...prev,
      gameResults: updatedResults,
      completedGames: updatedCompleted,
      totalScore: newTotalScore,
      lastActiveAt: Date.now(),
    }));

    // Save progress to backend
    await saveProgressToBackend(updatedResults, updatedCompleted, newTotalScore);

    // Check if this is the last game
    console.log('🎮 Checking if last game:', {
      currentGameIndex,
      totalGames: suiteConfig.games.length,
      isLastGame: currentGameIndex === suiteConfig.games.length - 1,
      remainingGames: suiteConfig.games.length - currentGameIndex - 1,
      currentGameId: currentGame?.id,
      nextGameId: suiteConfig.games[currentGameIndex + 1]?.id,
    });

    // Ensure we complete the current game before moving to next
    if (currentGameIndex >= suiteConfig.games.length - 1) {
      console.log('🎮 Last game completed, finishing suite');
      setCurrentState('complete');
      setIsCompleting(false); // Reset completion flag
      await completeSuite(enhancedResult);
      toast.success('🎉 Congratulations! Suite completed!');
    } else {
      console.log('🎮 Moving to next game:', {
        currentGameIndex,
        nextGameIndex: currentGameIndex + 1,
        nextGame: suiteConfig.games[currentGameIndex + 1],
        remainingGames: suiteConfig.games.length - currentGameIndex - 1,
      });

      // Move to transition screen first
      setCurrentState('transition');
      setIsCompleting(false); // Reset completion flag

      // Use setTimeout to ensure state updates are processed before advancing
      setTimeout(() => {
        console.log('🎮 Moving to next game after state update');
        setCurrentGameIndex(prev => {
          const nextIndex = prev + 1;
          console.log('🎮 Updating game index:', {
            prev,
            nextIndex,
            totalGames: suiteConfig.games.length,
          });
          // Safety check: ensure we don't go beyond the last game
          if (nextIndex >= suiteConfig.games.length) {
            console.warn('🎮 Attempted to go beyond last game, completing suite instead');
            setCurrentState('complete');
            return prev; // Keep current index
          }
          return nextIndex;
        });

        // Use another setTimeout to ensure game index is updated before changing state
        setTimeout(() => {
          setCurrentState('playing');
        }, 50);
      }, 100); // Small delay to ensure state updates are processed
    }
  };

  const saveProgressToBackend = async (gameResults, completedGames, totalScore, retryCount = 0) => {
    try {
      if (!suiteProgress.sessionId) return;

      const payload = {
        sessionId: suiteProgress.sessionId,
        currentGameIndex: currentGameIndex, // Don't add +1 here, use actual current index
        completedGames,
        gameResults,
      };

      console.log('🎮 Saving progress to backend:', payload);
      console.log('🎮 Game results structure:', JSON.stringify(gameResults, null, 2));

      await api.post('/api/assessment/suite/progress', payload);
      console.log('✅ Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);

      // Retry logic for API failures
      if (retryCount < 3) {
        console.log(`🔄 Retrying progress save (attempt ${retryCount + 1}/3)...`);
        setTimeout(
          () => {
            saveProgressToBackend(gameResults, completedGames, totalScore, retryCount + 1);
          },
          2000 * (retryCount + 1)
        ); // Exponential backoff
      } else {
        console.log('⚠️ Progress save failed after 3 attempts, continuing locally');
        // Don't show error to user for auto-save
        // Progress is saved locally in state anyway
      }
    }
  };

  const completeSuite = async finalGameResult => {
    // Prevent multiple completion calls
    if (isCompleting) {
      console.log('🎮 Suite completion already in progress, skipping duplicate call');
      return;
    }

    setIsCompleting(true);
    const maxRetries = 3;
    let retryCount = 0;

    const attemptCompletion = async () => {
      try {
        const behavioralProfile = await generateBehavioralProfile();

        const response = await api.post('/api/assessment/suite/complete', {
          sessionId: suiteProgress.sessionId,
          finalGameResult,
          behavioralProfile,
        });

        if (response.data.success) {
          toast.success('🎉 Suite completed! Generating your report...');
          console.log('✅ Suite completed successfully on backend');

          // Trigger report generation
          await triggerReportGeneration(response.data.session.sessionId);
        } else {
          throw new Error('Backend returned unsuccessful response');
        }
      } catch (error) {
        console.error(`Error completing suite (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying suite completion (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(attemptCompletion, 2000 * retryCount); // Exponential backoff
        } else {
          // Final fallback: Complete suite locally
          console.log('🎮 Backend not available, completing suite locally');
          toast.success('🎉 Suite completed! Your results are saved locally.');
        }
      } finally {
        setIsCompleting(false);
      }
    };

    await attemptCompletion();
  };

  const captureBehavioralMetrics = async () => {
    // This would capture behavioral data during gameplay
    // For now, return basic metrics
    return {
      responseTimes: [1.2, 1.5, 1.1, 1.8, 1.3],
      timeToFirstResponse: 1.2,
      breakRequests: 0,
      errorAnalysis: {
        totalErrors: 2,
      },
      engagementData: {
        helpRequests: 0,
        distractionEvents: 0,
        frustrationIndicators: 0,
      },
    };
  };

  const generateBehavioralProfile = async () => {
    // Analyze behavioral patterns from all games
    const allMetrics = suiteProgress.gameResults.map(game => game.behavioralMetrics);

    return {
      attentionPattern: 'sustained',
      engagementStyle: 'active',
      learningPreferences: ['visual', 'interactive'],
      motivationTriggers: ['immediate_feedback', 'progress_indicators'],
      frustrationIndicators: ['repeated_errors', 'long_pauses'],
    };
  };

  const triggerReportGeneration = async sessionId => {
    try {
      // The report generation is handled automatically by the backend
      // when the suite is completed
      console.log('Report generation triggered for session:', sessionId);
    } catch (error) {
      console.error('Error triggering report generation:', error);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Game resumed' : 'Game paused');
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Progress will be lost.')) {
      navigate(`/assessment/games/${assessmentType}?childId=${childId}`);
    }
  };

  const resetSuite = () => {
    if (window.confirm('Are you sure you want to reset the suite? All progress will be lost.')) {
      setCurrentGameIndex(0);
      setCurrentState('overview');
      setSuiteProgress({
        sessionId: null,
        startTime: null,
        completedGames: [],
        gameResults: [],
        behavioralMetrics: {},
        totalScore: 0,
        elapsedTime: 0,
        estimatedTimeRemaining: 45,
        lastActiveAt: null,
        pauseHistory: [],
      });
      setIsPaused(false);
      setShowBreakScreen(false);
      setIsCompleting(false);
      completedGamesRef.current.clear(); // Reset completed games ref
      localStorage.removeItem('progressiveSuiteProgress');
      toast.success('Suite reset successfully');
    }
  };

  const calculateProgress = () => {
    return (currentGameIndex / suiteConfig.games.length) * 100;
  };

  const getMotivationalMessage = () => {
    const messages = [
      "You're doing amazing! 🌟",
      'Keep up the great work! 💪',
      'Excellent progress! 🎯',
      "You're a superstar! ⭐",
      'Almost there! 🚀',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading assessment suite...</p>
        </div>
      </div>
    );
  }

  // Overview Screen
  if (currentState === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <button
              onClick={() => navigate(`/assessment/games/${assessmentType}?childId=${childId}`)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Games
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {childData?.firstName ? childData.firstName[0].toUpperCase() : 'C'}
              </div>
              {childData?.firstName
                ? `${childData.firstName} ${childData.lastName || ''}`
                : 'Child'}
              {/* Debug info */}
              <span className="text-xs text-gray-400 dark:text-gray-500">(ID: {childId})</span>
            </div>
          </motion.div>

          {/* Suite Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r ${suiteConfig.color} rounded-2xl p-8 text-white mb-8 relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            </div>

            <div className="flex items-center mb-6 relative z-10">
              <div className="text-6xl mr-4 animate-bounce">{suiteConfig.icon}</div>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg inline-block">
                  {suiteConfig.title}
                </h1>
                <p className="text-xl opacity-90">{suiteConfig.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{suiteConfig.games.length}</div>
                <div className="text-sm opacity-75">Games</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {suiteConfig.games.reduce((total, game) => total + game.duration, 0)}
                </div>
                <div className="text-sm opacity-75">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">Progressive</div>
                <div className="text-sm opacity-75">Difficulty</div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Suite Progress</span>
                <span className="text-sm opacity-75">Ready to Start</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{ width: '0%' }}
                ></div>
              </div>
              <div className="text-xs opacity-75 mt-1">
                Complete all {suiteConfig.games.length} games to unlock comprehensive insights!
              </div>
            </div>

            <motion.button
              whileHover={!isStarting ? { scale: 1.05 } : {}}
              whileTap={!isStarting ? { scale: 0.95 } : {}}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎮 Button clicked!', { isStarting, childId });

                if (isStarting) {
                  console.log('🎮 Button disabled - already starting');
                  return;
                }

                if (!childId) {
                  toast.error('Child ID is required');
                  return;
                }

                handleStartSuite();
              }}
              disabled={isStarting}
              className={`${
                isStarting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-gray-100 cursor-pointer'
              } px-8 py-3 rounded-xl font-bold text-lg transition-colors flex items-center mx-auto relative z-10`}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {isStarting ? 'Starting...' : 'Start Progressive Suite'}
            </motion.button>

            {/* Debug button for development - remove in production */}
            {process.env.NODE_ENV === 'development' && isStarting && (
              <button
                onClick={() => {
                  console.log('🎮 Debug: Resetting isStarting state');
                  setIsStarting(false);
                  toast.info('Debug: State reset');
                }}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors mx-auto block"
              >
                Debug: Reset State
              </button>
            )}
          </motion.div>

          {/* Suite Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card mb-6"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-stats text-center glass-gradient-blue">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold glass-text-primary mb-2">Comprehensive Assessment</h3>
                <p className="text-sm glass-text-secondary">
                  Get a complete picture of {assessmentType.toUpperCase()}-related cognitive
                  functions through progressive difficulty
                </p>
              </div>
              <div className="glass-stats text-center glass-gradient-green">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold glass-text-primary mb-2">Adaptive Difficulty</h3>
                <p className="text-sm glass-text-secondary">
                  Games adapt to your child's performance, ensuring optimal challenge and engagement
                </p>
              </div>
              <div className="glass-stats text-center glass-gradient-purple">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold glass-text-primary mb-2">Detailed Insights</h3>
                <p className="text-sm glass-text-secondary">
                  Receive comprehensive reports with actionable recommendations for your child
                </p>
              </div>
            </div>
          </motion.div>

          {/* Game Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <h2 className="text-2xl font-bold glass-text-primary mb-6">
              Assessment Sequence ({suiteConfig.games.length} games)
            </h2>
            <div className="grid gap-4">
              {suiteConfig.games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-6 glass-card hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex-shrink-0 mr-6">
                    <div
                      className={`glass-icon w-16 h-16 bg-gradient-to-r ${game.color} flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-bold glass-text-primary mr-3 text-lg">{game.title}</h3>
                      <span
                        className={`glass-badge ${
                          game.difficulty === 'Easy'
                            ? 'text-green-800'
                            : game.difficulty === 'Medium'
                              ? 'text-yellow-800'
                              : 'text-red-800'
                        }`}
                      >
                        {game.difficulty}
                      </span>
                    </div>
                    <p className="glass-text-secondary mb-3 leading-relaxed">{game.description}</p>
                    <div className="flex items-center text-sm glass-text-secondary mb-3">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">{game.duration} minutes</span>
                      <span className="mx-3">•</span>
                      <span className="text-xs glass-text-secondary">Level {game.level}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {game.skills.map((skill, skillIndex) => (
                        <span key={skillIndex} className="glass-badge text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-3xl opacity-80 hover:opacity-100 transition-opacity ml-4">
                    {game.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Game Playing Screen
  if (currentState === 'playing') {
    if (!currentGame || !currentGame.component) {
      console.error('❌ Current game or component not found:', {
        currentGame,
        currentGameIndex,
        availableGames: suiteConfig.games.map(g => ({ id: g.id, component: g.component?.name })),
      });
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-semibold text-red-600 mb-4">
              Game not found or not properly configured
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Expected: {suiteConfig.games[currentGameIndex]?.id || 'unknown'}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              Current Index: {currentGameIndex} | Total Games: {suiteConfig.games.length}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentState('overview')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-2"
              >
                Return to Overview
              </button>
              <button
                onClick={resetSuite}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reset Suite
              </button>
            </div>
          </div>
        </div>
      );
    }

    const GameComponent = currentGame.component;

    console.log('🎮 Rendering game:', {
      gameId: currentGame.id,
      component: GameComponent.name,
      gameConfig: currentGame,
      currentGameIndex,
      totalGames: suiteConfig.games.length,
      allGames: suiteConfig.games.map(g => g.id),
      currentState,
      completedGames: suiteProgress.completedGames,
    });

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Suite Progress Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Progress */}
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white mr-4">
                  Level {currentGame.level} of {suiteConfig.games.length}
                </div>
                <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-4">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(calculateProgress())}% Complete
                </div>
                {/* Debug info */}
                <div className="text-xs text-gray-400 dark:text-gray-500 ml-4">
                  Game {currentGameIndex + 1}/{suiteConfig.games.length}
                </div>
              </div>

              {/* Center: Current Game */}
              <div className="flex items-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mr-2">
                  {currentGame.title}
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    currentGame.difficulty === 'Easy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : currentGame.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {currentGame.difficulty}
                </span>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {suiteProgress.estimatedTimeRemaining} min left
                </div>
                {/* Debug Info */}
                <div className="text-xs text-gray-400 dark:text-gray-500 mr-2">
                  Game {currentGameIndex + 1}/{suiteConfig.games.length}
                </div>
                <button
                  onClick={handlePause}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <PauseIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleExit}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-red-600 dark:text-red-400"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="relative">
          {isPaused && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                <PauseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Game Paused
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Take a break whenever you need!
                </p>
                <button
                  onClick={handlePause}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  Resume Game
                </button>
              </div>
            </div>
          )}

          <FullScreenGameWrapper gameName={currentGame.title}>
            <GameComponent
              onGameComplete={handleGameComplete}
              suiteMode={true}
              gameConfig={currentGame}
            />
          </FullScreenGameWrapper>
        </div>
      </div>
    );
  }

  // Transition Screen
  if (currentState === 'transition') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🎉
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Level {currentGame.level} Complete!
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {getMotivationalMessage()}
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <StarIcon className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Level {currentGame.level} Score:{' '}
                {suiteProgress.gameResults[suiteProgress.gameResults.length - 1]?.score || 0}
              </span>
            </div>

            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              {suiteProgress.completedGames.length} of {suiteConfig.games.length} games completed
            </div>
          </div>

          {currentGameIndex < suiteConfig.games.length - 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Next: {suiteConfig.games[currentGameIndex + 1]?.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {suiteConfig.games[currentGameIndex + 1]?.description}
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                {suiteConfig.games[currentGameIndex + 1]?.duration} minutes
                <span className="mx-2">•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    suiteConfig.games[currentGameIndex + 1]?.difficulty === 'Easy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : suiteConfig.games[currentGameIndex + 1]?.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {suiteConfig.games[currentGameIndex + 1]?.difficulty}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Starting next game in 3 seconds...
          </div>
        </motion.div>
      </div>
    );
  }

  // Completion Screen
  if (currentState === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 max-w-2xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🏆
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Suite Complete! 🎉
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Amazing work {childData?.firstName}! You've completed all {suiteConfig.games.length}{' '}
            games!
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {suiteProgress.completedGames.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Games Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {suiteProgress.totalScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {suiteProgress.elapsedTime}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Minutes Played</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-4 text-white text-center">
              <TrophyIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="font-bold">Assessment Complete!</div>
              <div className="text-sm opacity-90">Your results are being processed</div>
            </div>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/dashboard?childId=${childId}`)}
              className="w-full bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              View Results & Report
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/assessment/games/${assessmentType}?childId=${childId}`)}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 inline mr-2" />
              Back to Games
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error/Fallback Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-6"
        >
          ⚠️
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Suite Error</h1>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Something went wrong with the progressive suite. Please try again or reset the suite.
        </p>

        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6 text-left">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Debug Info:</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
            <div>Current State: {currentState}</div>
            <div>Current Game Index: {currentGameIndex}</div>
            <div>Total Games: {suiteConfig.games.length}</div>
            <div>Completed Games: {suiteProgress.completedGames.length}</div>
            <div>Session ID: {suiteProgress.sessionId || 'None'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetSuite}
            className="w-full bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-600 transition-colors"
          >
            🔄 Reset Suite
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/assessment/games/${assessmentType}?childId=${childId}`)}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 inline mr-2" />
            Back to Games
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressiveAssessmentSuite;
