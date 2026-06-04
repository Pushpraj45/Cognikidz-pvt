import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../services/AssessmentService';

// Import existing game components
import ADHDGames from './games/adhd/ADHDGames';
import DyslexiaGames from './games/dyslexia/DyslexiaGames';
import FocusFinder from './games/adhd/FocusFinder';
import SoundShift from './games/adhd/SoundShift';
import TimeTurtle from './games/adhd/TimeTurtle';
import ImpulseFreeze from './games/adhd/ImpulseFreeze';
import TaskTwister from './games/adhd/TaskTwister';
import MemoryTrail from './games/adhd/MemoryTrail';
import HyperHop from './games/adhd/HyperHop';
import LetterSoundMatching from './games/dyslexia/LetterSoundMatching';
import RhymingPairs from './games/dyslexia/RhymingPairs';
import SyllableClapper from './games/dyslexia/SyllableClapper';
import SpotCorrectWord from './games/dyslexia/SpotCorrectWord';
import VisualTrackingMaze from './games/dyslexia/VisualTrackingMaze';
import MirrorLetterGame from './games/dyslexia/MirrorLetterGame';
import RapidLetterNaming from './games/dyslexia/RapidLetterNaming';
import WordCompletion from './games/dyslexia/WordCompletion';
import MemoryMatch from './games/dyslexia/MemoryMatch';
import WordSequenceBuilder from './games/dyslexia/WordSequenceBuilder';

const BatteryAssessmentManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const assessmentType = searchParams.get('type');

  // Session state
  const [sessionState, setSessionState] = useState({
    sessionId: null,
    batteryStructure: null,
    currentBattery: null,
    currentGame: null,
    gameIndex: 0,
    batteryIndex: 0,
    isInitialized: false,
    isLoading: true,
    error: null,
  });

  // Progress state
  const [progressState, setProgressState] = useState({
    overallProgress: 0,
    batteryProgress: {},
    gameProgress: {},
    qualityMetrics: {},
    estimatedTimeRemaining: 0,
  });

  // Break and flow state
  const [flowState, setFlowState] = useState({
    isOnBreak: false,
    breakType: null,
    breakDuration: 0,
    showingResults: false,
    motivationalMessage: null,
  });

  // Child data
  const [childData, setChildData] = useState(null);

  // Game component mapping
  const gameComponents = {
    'focus-finder': FocusFinder,
    'sound-shift': SoundShift,
    'time-turtle': TimeTurtle,
    'impulse-freeze': ImpulseFreeze,
    'task-twister-enhanced': TaskTwister,
    'memory-trail': MemoryTrail,
    'hyper-hop': HyperHop,
    'letter-sound-matching': LetterSoundMatching,
    'rhyming-pairs': RhymingPairs,
    'syllable-clapper': SyllableClapper,
    'spot-correct-word': SpotCorrectWord,
    'visual-tracking-maze': VisualTrackingMaze,
    'mirror-letter-game': MirrorLetterGame,
    'rapid-letter-naming': RapidLetterNaming,
    'word-completion': WordCompletion,
    'memory-match': MemoryMatch,
    'word-sequence-builder': WordSequenceBuilder,
  };

  // Initialize assessment session
  const initializeSession = useCallback(async () => {
    try {
      if (!childId || !assessmentType) {
        throw new Error('Child ID and assessment type are required');
      }

      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get child data (from localStorage or API)
      const storedChildData = localStorage.getItem(`child_${childId}`);
      let child = null;

      if (storedChildData) {
        child = JSON.parse(storedChildData);
      } else {
        // Fallback child data
        child = {
          _id: childId,
          firstName: 'Child',
          lastName: 'User',
          age: 96, // 8 years in months
          avatar: null,
        };
      }

      setChildData(child);

      // Configure battery structure
      console.log('Configuring battery for:', { childId, assessmentType, age: child.age });

      const batteryConfig = await AssessmentService.configureBattery(
        childId,
        assessmentType,
        child.age,
        [] // concerns - could be derived from intake
      );

      if (!batteryConfig.success) {
        throw new Error(batteryConfig.message || 'Failed to configure assessment battery');
      }

      // Start battery assessment
      const sessionResponse = await AssessmentService.startBatteryAssessment(
        childId,
        batteryConfig.batteryStructure
      );

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Failed to start assessment session');
      }

      // Update session state
      setSessionState({
        sessionId: sessionResponse.sessionId,
        batteryStructure: batteryConfig.batteryStructure,
        currentBattery: sessionResponse.currentBattery,
        currentGame: sessionResponse.firstGame,
        gameIndex: 0,
        batteryIndex: 0,
        isInitialized: true,
        isLoading: false,
        error: null,
      });

      // Initialize progress
      setProgressState({
        overallProgress: 0,
        batteryProgress: {},
        gameProgress: {},
        qualityMetrics: { engagementScore: 1 },
        estimatedTimeRemaining: batteryConfig.batteryStructure.estimatedDuration || 30,
      });

      console.log('Session initialized successfully:', sessionResponse.sessionId);
      toast.success(`Welcome ${child.firstName}! Let's start your ${assessmentType} assessment.`);
    } catch (error) {
      console.error('Error initializing session:', error);
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      toast.error(error.message);
    }
  }, [childId, assessmentType]);

  // Handle game completion
  const handleGameComplete = useCallback(
    async gamePerformanceData => {
      try {
        console.log('Game completed:', sessionState.currentGame?.gameId, gamePerformanceData);

        const completionResponse = await AssessmentService.completeGame(
          sessionState.sessionId,
          sessionState.currentGame.gameId,
          sessionState.currentGame.batteryId,
          {
            ...gamePerformanceData,
            startTime: Date.now() - gamePerformanceData.duration * 1000,
            behavioralMetrics: {
              responseTimes: gamePerformanceData.responseTimes || [],
              timeToFirstResponse: gamePerformanceData.timeToFirstResponse || 0,
              performanceOverTime: gamePerformanceData.performanceOverTime || [],
              breakRequests: gamePerformanceData.breakRequests || 0,
              errorAnalysis: gamePerformanceData.errorAnalysis || {},
              engagementData: gamePerformanceData.engagementData || {},
            },
          }
        );

        if (!completionResponse.success) {
          throw new Error(completionResponse.message || 'Failed to process game completion');
        }

        // Update progress
        setProgressState(prev => ({
          ...prev,
          overallProgress: completionResponse.progress?.overallProgress || prev.overallProgress,
          batteryProgress: completionResponse.progress?.batteryProgress || prev.batteryProgress,
          gameProgress: {
            ...prev.gameProgress,
            [sessionState.currentGame.gameId]: {
              completed: true,
              score: gamePerformanceData.score,
              accuracy: gamePerformanceData.accuracy,
            },
          },
        }));

        // Handle next action
        await handleNextAction(completionResponse);
      } catch (error) {
        console.error('Error completing game:', error);
        toast.error('Error saving your progress. Please try again.');
      }
    },
    [sessionState.sessionId, sessionState.currentGame]
  );

  // Handle next action after game completion
  const handleNextAction = useCallback(
    async completionResponse => {
      const { nextAction } = completionResponse;

      switch (nextAction) {
        case 'nextGame':
          setSessionState(prev => ({
            ...prev,
            currentGame: completionResponse.nextGame,
            gameIndex: prev.gameIndex + 1,
          }));
          toast.success('Great job! Moving to the next activity.');
          break;

        case 'break':
          setFlowState({
            isOnBreak: true,
            breakType: completionResponse.break?.type || 'regular',
            breakDuration: completionResponse.break?.duration || 30,
            showingResults: false,
            motivationalMessage: completionResponse.break?.message || 'Take a quick break!',
          });
          break;

        case 'nextBattery':
          setSessionState(prev => ({
            ...prev,
            currentBattery: completionResponse.nextBattery,
            currentGame: completionResponse.nextGame,
            batteryIndex: prev.batteryIndex + 1,
            gameIndex: 0,
          }));

          setFlowState({
            isOnBreak: true,
            breakType: 'celebration',
            breakDuration: 60,
            showingResults: false,
            motivationalMessage: `Excellent work! You've completed the ${sessionState.currentBattery?.name} section. Ready for the next challenge?`,
          });
          break;

        case 'complete':
          setFlowState({
            isOnBreak: false,
            breakType: null,
            breakDuration: 0,
            showingResults: true,
            motivationalMessage: "Congratulations! You've completed the entire assessment!",
          });

          // Navigate to results after a delay
          setTimeout(() => {
            navigate(`/assessment/results/${sessionState.sessionId}`);
          }, 3000);
          break;

        default:
          console.warn('Unknown next action:', nextAction);
      }
    },
    [sessionState, navigate]
  );

  // Handle break completion
  const handleBreakComplete = useCallback(() => {
    setFlowState({
      isOnBreak: false,
      breakType: null,
      breakDuration: 0,
      showingResults: false,
      motivationalMessage: null,
    });
  }, []);

  // Real-time progress updates
  useEffect(() => {
    if (!sessionState.sessionId) return;

    const progressInterval = setInterval(async () => {
      try {
        const progressData = await AssessmentService.getAssessmentProgress(sessionState.sessionId);
        if (progressData.success) {
          setProgressState(prev => ({
            ...prev,
            ...progressData.progress,
          }));
        }
      } catch (error) {
        console.warn('Error fetching progress:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(progressInterval);
  }, [sessionState.sessionId]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Render current game component
  const renderCurrentGame = () => {
    if (!sessionState.currentGame) return null;

    const GameComponent = gameComponents[sessionState.currentGame.gameId];

    if (!GameComponent) {
      console.warn('Game component not found:', sessionState.currentGame.gameId);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Game Not Available</h2>
            <p>The game "{sessionState.currentGame.gameId}" is not currently available.</p>
          </div>
        </div>
      );
    }

    return (
      <GameComponent
        sessionId={sessionState.sessionId}
        batteryId={sessionState.currentGame.batteryId}
        onGameComplete={handleGameComplete}
        childData={childData}
        assessmentMode="battery" // Indicates this is part of a battery assessment
      />
    );
  };

  // Loading state
  if (sessionState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Setting up your assessment...</h2>
          <p className="text-gray-600">This will just take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionState.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Assessment Setup Error</h2>
          <p className="text-red-600 mb-4">{sessionState.error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Progress Header */}
      <AssessmentProgressHeader
        batteryStructure={sessionState.batteryStructure}
        currentBattery={sessionState.currentBattery}
        overallProgress={progressState.overallProgress}
        timeRemaining={progressState.estimatedTimeRemaining}
        childName={childData?.firstName}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {flowState.isOnBreak ? (
          <BreakActivity
            key="break"
            breakType={flowState.breakType}
            duration={flowState.breakDuration}
            message={flowState.motivationalMessage}
            onBreakComplete={handleBreakComplete}
          />
        ) : flowState.showingResults ? (
          <AssessmentComplete
            key="complete"
            message={flowState.motivationalMessage}
            sessionId={sessionState.sessionId}
          />
        ) : (
          <motion.div
            key={sessionState.currentGame?.gameId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentGame()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Footer */}
      <AssessmentProgressFooter
        gameProgress={progressState.gameProgress}
        batteryProgress={progressState.batteryProgress}
        qualityMetrics={progressState.qualityMetrics}
      />
    </div>
  );
};

// Progress Header Component
const AssessmentProgressHeader = ({
  batteryStructure,
  currentBattery,
  overallProgress,
  timeRemaining,
  childName,
}) => (
  <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{childName?.charAt(0) || 'C'}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{childName}'s Assessment</h1>
              <p className="text-sm text-gray-500">
                {currentBattery?.name || 'Assessment in Progress'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{Math.round(overallProgress)}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>

          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{timeRemaining}min</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Break Activity Component
const BreakActivity = ({ breakType, duration, message, onBreakComplete }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onBreakComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onBreakComplete]);

  const getBreakContent = () => {
    switch (breakType) {
      case 'micro':
        return {
          title: 'Quick Break',
          icon: '☕',
          activity: 'Take a deep breath and stretch your arms!',
        };
      case 'celebration':
        return {
          title: 'Celebration Time!',
          icon: '🎉',
          activity: 'You did amazing! Give yourself a pat on the back!',
        };
      default:
        return {
          title: 'Break Time',
          icon: '🌟',
          activity: 'Rest for a moment and get ready for the next activity!',
        };
    }
  };

  const content = getBreakContent();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
        <div className="text-6xl mb-4">{content.icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
        <p className="text-gray-600 mb-6">{message || content.activity}</p>

        <div className="text-4xl font-bold text-blue-600 mb-4">{timeLeft}</div>
        <p className="text-sm text-gray-500">seconds remaining</p>

        <button
          onClick={onBreakComplete}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Now
        </button>
      </div>
    </motion.div>
  );
};

// Assessment Complete Component
const AssessmentComplete = ({ message, sessionId }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="flex items-center justify-center min-h-screen"
  >
    <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
      <div className="text-6xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-sm text-gray-500">Preparing your results...</p>
    </div>
  </motion.div>
);

// Progress Footer Component
const AssessmentProgressFooter = ({ gameProgress, batteryProgress, qualityMetrics }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="text-xs text-gray-500">
          Quality Score: {Math.round((qualityMetrics.engagementScore || 1) * 100)}%
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {Object.values(gameProgress).map((game, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${game.completed ? 'bg-green-500' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  </div>
);

export default BatteryAssessmentManager;
