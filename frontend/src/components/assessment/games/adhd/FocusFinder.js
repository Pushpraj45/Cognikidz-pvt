import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  PauseIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const FocusFinder = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [gameState, setGameState] = useState('instructions'); // instructions, playing, paused, completed
  const [currentLevel, setCurrentLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [foundObjects, setFoundObjects] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [missedObjects, setMissedObjects] = useState(0);
  const [falseClicks, setFalseClicks] = useState(0);
  const [distractionsClicked, setDistractionsClicked] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [interactionLog, setInteractionLog] = useState([]);
  const [clickEffects, setClickEffects] = useState([]);
  const [levelResults, setLevelResults] = useState([]); // Track results from each level
  const [overallScore, setOverallScore] = useState(0); // Track total score across all levels
  const [overallAccuracy, setOverallAccuracy] = useState(0); // Track average accuracy across all levels
  const gameAreaRef = useRef(null);

  // Auto-start game when in suite mode
  useEffect(() => {
    if (suiteMode && gameState === 'instructions') {
      console.log('🎮 FocusFinder: Auto-starting in suite mode');
      startGame();
    }
  }, [suiteMode, gameState]);

  const MAX_ATTEMPTS = 3;

  // Game levels with space explorer theme
  const levels = [
    {
      id: 1,
      title: 'Planet Discovery',
      description: 'Find 5 red planets while avoiding floating asteroids',
      timeLimit: 60,
      targetObjects: 5,
      scene: 'space-planets',
      targetType: 'planet',
      targetColor: 'red',
      objects: [
        { id: 1, x: 15, y: 25, found: false, type: 'planet', color: 'red', size: 'medium' },
        { id: 2, x: 75, y: 15, found: false, type: 'planet', color: 'red', size: 'large' },
        { id: 3, x: 45, y: 65, found: false, type: 'planet', color: 'red', size: 'small' },
        { id: 4, x: 85, y: 75, found: false, type: 'planet', color: 'red', size: 'medium' },
        { id: 5, x: 25, y: 85, found: false, type: 'planet', color: 'red', size: 'large' },
      ],
      distractions: [
        { id: 'd1', x: 30, y: 40, type: 'asteroid', color: 'gray', speed: 2, direction: 'right' },
        { id: 'd2', x: 60, y: 20, type: 'asteroid', color: 'brown', speed: 1.5, direction: 'left' },
        { id: 'd3', x: 80, y: 50, type: 'asteroid', color: 'gray', speed: 2.5, direction: 'up' },
      ],
    },
    {
      id: 2,
      title: 'Star Collection',
      description: 'Find 7 yellow stars while avoiding shooting comets',
      timeLimit: 75,
      targetObjects: 7,
      scene: 'space-stars',
      targetType: 'star',
      targetColor: 'yellow',
      objects: [
        { id: 1, x: 10, y: 20, found: false, type: 'star', color: 'yellow', size: 'medium' },
        { id: 2, x: 80, y: 30, found: false, type: 'star', color: 'yellow', size: 'large' },
        { id: 3, x: 35, y: 55, found: false, type: 'star', color: 'yellow', size: 'small' },
        { id: 4, x: 70, y: 60, found: false, type: 'star', color: 'yellow', size: 'medium' },
        { id: 5, x: 20, y: 80, found: false, type: 'star', color: 'yellow', size: 'large' },
        { id: 6, x: 60, y: 85, found: false, type: 'star', color: 'yellow', size: 'small' },
        { id: 7, x: 90, y: 70, found: false, type: 'star', color: 'yellow', size: 'medium' },
      ],
      distractions: [
        { id: 'd1', x: 25, y: 35, type: 'comet', color: 'blue', speed: 3, direction: 'diagonal' },
        {
          id: 'd2',
          x: 65,
          y: 15,
          type: 'comet',
          color: 'green',
          speed: 2.5,
          direction: 'diagonal',
        },
        { id: 'd3', x: 45, y: 75, type: 'comet', color: 'purple', speed: 2, direction: 'diagonal' },
        { id: 'd4', x: 85, y: 45, type: 'comet', color: 'blue', speed: 3.5, direction: 'diagonal' },
      ],
    },
    {
      id: 3,
      title: 'Alien Friends',
      description: 'Find 8 green aliens while avoiding space debris',
      timeLimit: 90,
      targetObjects: 8,
      scene: 'space-aliens',
      targetType: 'alien',
      targetColor: 'green',
      objects: [
        { id: 1, x: 12, y: 18, found: false, type: 'alien', color: 'green', size: 'medium' },
        { id: 2, x: 78, y: 22, found: false, type: 'alien', color: 'green', size: 'large' },
        { id: 3, x: 42, y: 48, found: false, type: 'alien', color: 'green', size: 'small' },
        { id: 4, x: 68, y: 52, found: false, type: 'alien', color: 'green', size: 'medium' },
        { id: 5, x: 28, y: 72, found: false, type: 'alien', color: 'green', size: 'large' },
        { id: 6, x: 58, y: 78, found: false, type: 'alien', color: 'green', size: 'small' },
        { id: 7, x: 88, y: 68, found: false, type: 'alien', color: 'green', size: 'medium' },
        { id: 8, x: 18, y: 88, found: false, type: 'alien', color: 'green', size: 'large' },
      ],
      distractions: [
        {
          id: 'd1',
          x: 35,
          y: 25,
          type: 'debris',
          color: 'orange',
          speed: 1.8,
          direction: 'random',
        },
        { id: 'd2', x: 55, y: 65, type: 'debris', color: 'red', speed: 2.2, direction: 'random' },
        {
          id: 'd3',
          x: 75,
          y: 35,
          type: 'debris',
          color: 'orange',
          speed: 1.5,
          direction: 'random',
        },
        { id: 'd4', x: 25, y: 55, type: 'debris', color: 'red', speed: 2.8, direction: 'random' },
        { id: 'd5', x: 85, y: 85, type: 'debris', color: 'orange', speed: 2, direction: 'random' },
      ],
    },
  ];

  const currentLevelData = levels[currentLevel - 1];
  const [distractionPositions, setDistractionPositions] = useState({});

  // Initialize distraction positions
  useEffect(() => {
    if (currentLevelData?.distractions) {
      const positions = {};
      currentLevelData.distractions.forEach(distraction => {
        positions[distraction.id] = { x: distraction.x, y: distraction.y };
      });
      setDistractionPositions(positions);
    }
  }, [currentLevelData]);

  // Move distractions
  useEffect(() => {
    if (gameState !== 'playing' || !currentLevelData?.distractions) return;

    const interval = setInterval(() => {
      setDistractionPositions(prev => {
        const newPositions = { ...prev };
        currentLevelData.distractions.forEach(distraction => {
          const currentPos = newPositions[distraction.id] || { x: distraction.x, y: distraction.y };

          let newX = currentPos.x;
          let newY = currentPos.y;

          switch (distraction.direction) {
            case 'right':
              newX += distraction.speed;
              break;
            case 'left':
              newX -= distraction.speed;
              break;
            case 'up':
              newY -= distraction.speed;
              break;
            case 'down':
              newY += distraction.speed;
              break;
            case 'diagonal':
              newX += distraction.speed * 0.7;
              newY += distraction.speed * 0.7;
              break;
            case 'random':
              newX += (Math.random() - 0.5) * distraction.speed * 2;
              newY += (Math.random() - 0.5) * distraction.speed * 2;
              break;
          }

          // Bounce off edges
          if (newX < 0 || newX > 100) newX = currentPos.x - (newX - currentPos.x);
          if (newY < 0 || newY > 100) newY = currentPos.y - (newY - currentPos.y);

          newPositions[distraction.id] = { x: newX, y: newY };
        });
        return newPositions;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, currentLevelData]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  // Validate child ID on component mount
  useEffect(() => {
    if (!childId) {
      toast.error('Child information is required to start the assessment');
      navigate('/assessment');
      return;
    }
  }, [childId, navigate]);

  // Track keyboard interactions
  useEffect(() => {
    const handleKeyPress = event => {
      if (gameState !== 'playing') return;

      const keyTime = Date.now();
      const timeSinceStart = keyTime - gameStartTime;

      const keystrokeEvent = {
        timestamp: keyTime,
        timeSinceStart: timeSinceStart,
        key: event.key,
        level: currentLevel,
        timeLeft: timeLeft,
        type: 'keyboard_press',
      };

      setKeystrokeData(prev => [...prev, keystrokeEvent]);
      setInteractionLog(prev => [...prev, keystrokeEvent]);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, gameStartTime, currentLevel, timeLeft]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setGameStartTime(Date.now());
    setTimeLeft(currentLevelData.timeLimit);
    setScore(0);
    setFoundObjects([]);
    setMissedObjects(0);
    setFalseClicks(0);
    setDistractionsClicked(0);
    setWrongAttempts(0);
    setKeystrokeData([]);
    setInteractionLog([]);
    setShowGuide(false);
  }, [currentLevelData.timeLimit]);

  // Pause/Resume game
  const togglePause = () => {
    setGameState(prev => (prev === 'playing' ? 'paused' : 'playing'));
  };

  // Handle object click
  const handleObjectClick = (objectId, x, y) => {
    if (gameState !== 'playing') return;

    const clickTime = Date.now();
    const timeSinceStart = clickTime - gameStartTime;

    // Record keystroke/interaction data
    const interactionData = {
      timestamp: clickTime,
      timeSinceStart: timeSinceStart,
      objectId: objectId,
      position: { x, y },
      level: currentLevel,
      timeLeft: timeLeft,
      type: 'object_click',
    };

    setKeystrokeData(prev => [...prev, interactionData]);
    setInteractionLog(prev => [...prev, interactionData]);

    const object = currentLevelData.objects.find(obj => obj.id === objectId);
    if (object && !object.found) {
      // Correct click
      setFoundObjects(prev => [...prev, objectId]);

      // Calculate score with time bonus
      const timeBonus = Math.max(0, Math.floor((timeLeft / currentLevelData.timeLimit) * 10));
      const baseScore = 20;
      const totalScoreForObject = baseScore + timeBonus;

      setScore(prev => prev + totalScoreForObject);

      // Enhanced success feedback
      const successMessages = [
        'Great find! 🌟',
        'Excellent! 🎯',
        'Perfect! ⭐',
        'Amazing! 🚀',
        'Brilliant! 💫',
      ];

      const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      toast.success(randomMessage, {
        duration: 1000,
        style: {
          background: '#D1FAE5',
          color: '#047857',
        },
      });

      // Mark object as found
      const updatedObjects = currentLevelData.objects.map(obj =>
        obj.id === objectId ? { ...obj, found: true } : obj
      );
      currentLevelData.objects = updatedObjects;

      // Check if all objects found
      if (foundObjects.length + 1 >= currentLevelData.targetObjects) {
        endGame();
      }
    } else {
      // False click - increment wrong attempts
      setFalseClicks(prev => prev + 1);
      setWrongAttempts(prev => {
        const newWrongAttempts = prev + 1;

        if (newWrongAttempts >= MAX_ATTEMPTS) {
          // Max attempts reached, move to next level with encouragement
          toast.error("That's okay! Let's try the next level! 💪", {
            duration: 2000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
            },
          });

          setTimeout(() => {
            if (currentLevel < levels.length) {
              nextLevel();
            } else {
              endGame();
            }
          }, 2000);
        } else {
          // Show encouraging message
          const remainingAttempts = MAX_ATTEMPTS - newWrongAttempts;
          const errorMessages = [
            'Oops! Keep looking! 🔍',
            'Almost there! 🎯',
            'Try again! 💪',
            'You can do it! 🌟',
          ];

          const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
          toast.error(`${randomMessage} ${remainingAttempts} more tries!`, {
            duration: 1500,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
            },
          });
        }

        return newWrongAttempts;
      });
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  // Handle distraction click
  const handleDistractionClick = distractionId => {
    console.log('Distraction click handler called:', distractionId, 'Game state:', gameState);

    if (gameState !== 'playing') {
      console.log('Game not playing, ignoring distraction click');
      return;
    }

    const clickTime = Date.now();
    const timeSinceStart = clickTime - gameStartTime;

    console.log('Processing distraction click...');

    // Record distraction interaction
    const distractionData = {
      timestamp: clickTime,
      timeSinceStart: timeSinceStart,
      distractionId: distractionId,
      level: currentLevel,
      timeLeft: timeLeft,
      type: 'distraction_click',
    };

    setKeystrokeData(prev => [...prev, distractionData]);
    setInteractionLog(prev => [...prev, distractionData]);

    setDistractionsClicked(prev => {
      const newCount = prev + 1;
      console.log('Distractions clicked count:', newCount);
      return newCount;
    });

    setScore(prev => {
      const newScore = Math.max(0, prev - 10);
      console.log('Score after distraction click:', newScore);
      return newScore;
    });

    // Add visual click effect
    const effectId = Date.now();
    setClickEffects(prev => [
      ...prev,
      {
        id: effectId,
        x: Math.random() * 100,
        y: Math.random() * 100,
        type: 'distraction',
      },
    ]);

    // Remove effect after animation
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 1000);

    // Give feedback for distraction clicks
    const distractionMessages = [
      'Oops! That was a distraction! 🚫',
      'Stay focused! 🎯',
      'Keep your eyes on the targets! 👀',
      "Don't get distracted! 💪",
    ];

    const randomMessage =
      distractionMessages[Math.floor(Math.random() * distractionMessages.length)];
    console.log('Showing toast:', randomMessage);

    toast.error(randomMessage, {
      duration: 1200,
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '2px solid #F59E0B',
        fontSize: '16px',
        fontWeight: 'bold',
      },
    });
  };

  // End game
  const endGame = async () => {
    setGameState('completed');
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    console.log('🎮 Game time calculation:', {
      gameStartTime,
      endTime,
      totalTimeTaken,
      gameStartTimeFormatted: gameStartTime ? new Date(gameStartTime).toISOString() : 'null',
      endTimeFormatted: new Date(endTime).toISOString(),
    });
    setTotalTime(totalTimeTaken);

    const missed = currentLevelData.targetObjects - foundObjects.length;
    setMissedObjects(missed);

    const accuracyScore = Math.round((foundObjects.length / currentLevelData.targetObjects) * 100);
    setAccuracy(accuracyScore);

    // Add completion bonus
    let finalScore = score;
    if (foundObjects.length >= currentLevelData.targetObjects) {
      const completionBonus = Math.floor((timeLeft / currentLevelData.timeLimit) * 50);
      finalScore += completionBonus;
      setScore(finalScore);
    }

    // Store this level's results
    const levelResult = {
      level: currentLevel,
      score: finalScore,
      accuracy: accuracyScore,
      timeTaken: totalTimeTaken,
      foundObjects: foundObjects.length,
      missedObjects: missed,
      falseClicks: falseClicks,
      distractionsClicked: distractionsClicked,
      levelTitle: currentLevelData.title,
      levelDescription: currentLevelData.description,
    };

    setLevelResults(prev => [...prev, levelResult]);

    // Update overall scores
    const newOverallScore = overallScore + finalScore;
    const newOverallAccuracy = Math.round(
      (overallAccuracy * (currentLevel - 1) + accuracyScore) / currentLevel
    );

    setOverallScore(newOverallScore);
    setOverallAccuracy(newOverallAccuracy);

    // Prepare game results
    const gameResults = {
      gameId: 'focus-finder',
      gameType: 'focus-finder',
      level: currentLevel,
      score: finalScore,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      foundObjects: foundObjects.length,
      missedObjects: missed,
      falseClicks: falseClicks,
      distractionsClicked: distractionsClicked,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        targetObjects: currentLevelData.targetObjects,
        targetType: currentLevelData.targetType,
        targetColor: currentLevelData.targetColor,
        timeLimit: currentLevelData.timeLimit,
        levelTitle: currentLevelData.title,
        levelDescription: currentLevelData.description,
        distractionsClicked: distractionsClicked,
        falseClicks: falseClicks,
        foundObjects: foundObjects.length,
        missedObjects: missed,
      },
    };

    // If in suite mode and this is the final level, call the callback with aggregated results
    if (suiteMode && onGameComplete && currentLevel === levels.length) {
      console.log('🎮 FocusFinder completed all levels in suite mode, calling onGameComplete');

      // Create aggregated results
      const aggregatedResults = {
        ...gameResults,
        score: newOverallScore, // Total score across all levels
        accuracy: newOverallAccuracy, // Average accuracy across all levels
        totalTime: levelResults.reduce((sum, result) => sum + result.timeTaken, 0) + totalTimeTaken,
        levelResults: [...levelResults, levelResult], // All level results
        totalLevels: levels.length,
        completedLevels: levelResults.length + 1,
      };

      onGameComplete(aggregatedResults);
      return;
    }

    // If not in suite mode, save to backend as usual
    try {
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
            ['attention', 'focus', 'hyperactivity']
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
        accuracy: accuracyScore, // Store as percentage (0-100)
        duration: totalTimeTaken, // Backend expects 'duration' not 'totalTime'
        totalTime: totalTimeTaken, // Keep for frontend compatibility
        startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
        foundObjects: foundObjects.length,
        missedObjects: missed,
        falseClicks: falseClicks,
        distractionsClicked: distractionsClicked,
        level: currentLevel,
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          targetObjects: currentLevelData.targetObjects,
          targetType: currentLevelData.targetType,
          targetColor: currentLevelData.targetColor,
          timeLimit: currentLevelData.timeLimit,
          levelTitle: currentLevelData.title,
          levelDescription: currentLevelData.description,
          distractionsClicked: distractionsClicked,
          falseClicks: falseClicks,
          foundObjects: foundObjects.length,
          missedObjects: missed,
          keystrokeData: keystrokeData,
          interactionLog: interactionLog,
          averageReactionTime:
            keystrokeData.length > 0
              ? keystrokeData.reduce((sum, data) => sum + data.timeSinceStart, 0) /
                keystrokeData.length
              : 0,
          totalInteractions: keystrokeData.length,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'focus-finder',
        'adhd-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `adhd_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing focus-finder data or initialize
      const existingFocusFinder = existingData['focus-finder'] || {};

      // Update with new session data
      const updatedFocusFinder = {
        ...existingFocusFinder,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingFocusFinder.playCount || 0) + 1,
        // Update best score - for FocusFinder, calculate max possible score with bonuses
        bestScore: (() => {
          const baseScore = currentLevelData.targetObjects * 20; // 20 points per object
          const maxTimeBonus = currentLevelData.targetObjects * 10; // Max time bonus per object
          const maxCompletionBonus = 50; // Max completion bonus
          const maxPossibleScore = baseScore + maxTimeBonus + maxCompletionBonus;
          return Math.max(existingFocusFinder.bestScore || 0, maxPossibleScore);
        })(),
        // Calculate average accuracy across all sessions
        averageAccuracy: (() => {
          const existingSessions = existingFocusFinder.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        // Store sessions array
        sessions: [
          ...(existingFocusFinder.sessions || []),
          {
            sessionId: sessionId,
            score: score,
            accuracy: accuracyScore,
            completedAt: new Date().toISOString(),
            level: currentLevel,
            totalTime: totalTimeTaken,
            gameSpecificData: performanceData.gameSpecificData,
          },
        ],
      };

      existingData['focus-finder'] = updatedFocusFinder;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'focus-finder',
            sessionId,
            performanceData,
          },
        })
      );
    } catch (error) {
      console.error('Error saving game data:', error);
      toast.dismiss();
      toast.error('Failed to save game results');
    }
  };

  // Next level
  const nextLevel = () => {
    if (currentLevel < levels.length) {
      setCurrentLevel(prev => prev + 1);
      setGameState('instructions');
      setShowGuide(true);
      // Reset wrong attempts for new level
      setWrongAttempts(0);
      setFoundObjects([]);
      setFalseClicks(0);
      setDistractionsClicked(0);
      toast.success('Moving to next level! 🚀', { duration: 1500 });
    } else {
      // Game completed - all levels done
      if (suiteMode) {
        // In suite mode, complete the game after all levels
        endGame();
      } else {
        // In standalone mode, navigate back to games
        navigate(`/assessment/games/adhd?childId=${childId}`);
      }
    }
  };

  // Retry level
  const retryLevel = () => {
    setGameState('instructions');
    setTimeLeft(currentLevelData.timeLimit);
    setScore(0);
    setFoundObjects([]);
    setMissedObjects(0);
    setFalseClicks(0);
    setDistractionsClicked(0);
    setWrongAttempts(0);
    setShowGuide(true);
    toast.success("Let's try again! You've got this! 💪", { duration: 1500 });
  };

  // Format time
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get scene background
  const getSceneBackground = scene => {
    switch (scene) {
      case 'space-planets':
        return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
      case 'space-stars':
        return 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
      case 'space-aliens':
        return 'https://images.unsplash.com/photo-1506318137071-a8e063a4d0ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
      default:
        return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    }
  };

  // Get object emoji
  const getObjectEmoji = (type, color) => {
    switch (type) {
      case 'planet':
        return '🪐';
      case 'star':
        return '⭐';
      case 'alien':
        return '👽';
      default:
        return '⭐';
    }
  };

  // Get distraction emoji
  const getDistractionEmoji = type => {
    switch (type) {
      case 'asteroid':
        return '☄️';
      case 'comet':
        return '💫';
      case 'debris':
        return '🚀';
      default:
        return '💫';
    }
  };

  // Get size class
  const getSizeClass = size => {
    switch (size) {
      case 'small':
        return 'w-6 h-6 text-sm';
      case 'medium':
        return 'w-8 h-8 text-lg';
      case 'large':
        return 'w-10 h-10 text-xl';
      default:
        return 'w-8 h-8 text-lg';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Enhanced background distractions during gameplay */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating sparkles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-3 h-3 bg-yellow-300 rounded-full opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 30, -30, 0],
                y: [0, -30, 30, 0],
                scale: [1, 2, 0.5, 1],
                opacity: [0.2, 0.6, 0.1, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 4,
              }}
            />
          ))}

          {/* Drifting clouds */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`cloud-${i}`}
              className="absolute w-16 h-8 bg-white/20 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 100, -100, 0],
                scale: [1, 1.3, 0.8, 1],
                opacity: [0.1, 0.3, 0.1, 0.2],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}

          {/* Pulsing orbs */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute w-6 h-6 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 2.5, 1],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-4 mt-4">
        {/* Header */}
        <div className="flex items-center justify-start mb-6">
          <button
            onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all duration-300 border border-white/20"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Games
          </button>

          {gameState === 'playing' && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/20">
                <ClockIcon className="w-5 h-5 text-yellow-400" />
                <span className="font-mono text-lg font-bold text-yellow-300">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/20">
                <StarIcon className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-yellow-300">{score}</span>
              </div>
              <button
                onClick={togglePause}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all duration-300 border border-white/20"
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

        {/* Game Content */}
        <AnimatePresence mode="wait">
          {gameState === 'instructions' && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center h-screen flex flex-col justify-start pt-2"
            >
              <div className="max-w-6xl mx-auto px-4">
                {/* Top Row: Game Info */}
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <EyeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    🚀 Focus Finder - Level {currentLevel}
                  </h1>
                  <h2 className="text-xl font-semibold text-yellow-300 mb-2">
                    {currentLevelData.title}
                  </h2>
                  <p className="text-blue-200 text-base">{currentLevelData.description}</p>
                </div>

                {/* Second Row: Stats (Time and Target) */}
                <div className="flex justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 px-4 py-3 bg-yellow-400/20 backdrop-blur-sm rounded-lg border border-yellow-400/30">
                    <ClockIcon className="w-5 h-5 text-yellow-300" />
                    <span className="text-yellow-200 font-medium text-sm">
                      {formatTime(currentLevelData.timeLimit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-400/20 backdrop-blur-sm rounded-lg border border-green-400/30">
                    <span className="text-xl">
                      {getObjectEmoji(currentLevelData.targetType, currentLevelData.targetColor)}
                    </span>
                    <span className="text-green-200 font-medium text-sm">
                      {currentLevelData.targetObjects} to find
                    </span>
                  </div>
                </div>

                {/* Third Row: Captain Cosmo and Mission Instructions */}
                <div className="flex gap-4 mb-4">
                  {/* Space Explorer Guide */}
                  {showGuide && (
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="flex-1"
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <RocketLaunchIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold">Captain Cosmo</h3>
                            <p className="text-purple-100 text-sm">Your Space Explorer Guide</p>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-sm">
                            "Welcome, young explorer! Ready for an amazing space adventure? Let's
                            find some {currentLevelData.targetType}s together! 🚀"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Mission Instructions */}
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <h3 className="text-base font-semibold text-white mb-3">
                      🎯 Mission Instructions:
                    </h3>
                    <ul className="text-left space-y-2 text-blue-100 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-900 text-xs font-bold">1</span>
                        </div>
                        <span>
                          Find and click all the{' '}
                          <span className="font-bold text-yellow-300">
                            {currentLevelData.targetColor} {currentLevelData.targetType}s
                          </span>{' '}
                          {getObjectEmoji(
                            currentLevelData.targetType,
                            currentLevelData.targetColor
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-900 text-xs font-bold">2</span>
                        </div>
                        <span>
                          <span className="font-bold text-red-300">
                            Avoid the moving distractions!
                          </span>
                          They'll cost you points! 💫
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-900 text-xs font-bold">3</span>
                        </div>
                        <span>Complete your mission before time runs out! ⏰</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Row: Launch Button */}
                <div className="text-center">
                  <button
                    onClick={startGame}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-bold text-lg rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-yellow-300"
                  >
                    <RocketLaunchIcon className="w-6 h-6 inline mr-2" />
                    Launch Mission!
                  </button>
                </div>
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
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">🚀 {currentLevelData.title}</h2>
                <p className="text-blue-200 text-lg">
                  Found {foundObjects.length} of {currentLevelData.targetObjects}{' '}
                  {currentLevelData.targetType}s
                </p>
              </div>

              <div className="relative w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                <div
                  className="relative w-full h-96 md:h-[500px] pointer-events-auto"
                  ref={gameAreaRef}
                >
                  {/* Scene Background */}
                  <img
                    src={getSceneBackground(currentLevelData.scene)}
                    alt={currentLevelData.title}
                    className="w-full h-full object-cover opacity-60"
                  />

                  {/* Target Objects */}
                  {currentLevelData.objects.map(
                    object =>
                      !object.found && (
                        <motion.button
                          key={object.id}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{
                            scale: 1,
                            rotate: 0,
                            y: [0, -5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleObjectClick(object.id, object.x, object.y)}
                          className={`absolute ${getSizeClass(object.size)} flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/30`}
                          style={{
                            left: `${object.x}%`,
                            top: `${object.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <span className="text-2xl md:text-3xl">
                            {getObjectEmoji(object.type, object.color)}
                          </span>
                        </motion.button>
                      )
                  )}

                  {/* Moving Distractions */}
                  {currentLevelData.distractions.map(distraction => {
                    const position = distractionPositions[distraction.id];
                    if (!position) return null;

                    return (
                      <motion.button
                        key={distraction.id}
                        animate={{
                          x: `${position.x}%`,
                          y: `${position.y}%`,
                        }}
                        transition={{
                          duration: 0.1,
                          ease: 'linear',
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Distraction clicked:', distraction.id);
                          handleDistractionClick(distraction.id);
                        }}
                        className="absolute w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl cursor-pointer transition-all duration-200 bg-red-500/40 backdrop-blur-sm rounded-full border-2 border-red-400/70 hover:bg-red-500/60 z-20 pointer-events-auto"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="text-2xl md:text-3xl drop-shadow-lg">
                          {getDistractionEmoji(distraction.type)}
                        </span>
                      </motion.button>
                    );
                  })}

                  {/* Found Objects Overlay */}
                  {foundObjects.map(objectId => {
                    const object = currentLevelData.objects.find(obj => obj.id === objectId);
                    return (
                      <motion.div
                        key={`found-${objectId}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-xl"
                        style={{
                          left: `${object.x}%`,
                          top: `${object.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <motion.div
                          className="bg-green-500 rounded-full p-1"
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 360],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                        >
                          <CheckIcon className="w-full h-full text-white" />
                        </motion.div>
                      </motion.div>
                    );
                  })}

                  {/* Click Effects */}
                  {clickEffects.map(effect => (
                    <motion.div
                      key={effect.id}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute w-4 h-4 pointer-events-none"
                      style={{
                        left: `${effect.x}%`,
                        top: `${effect.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-full h-full bg-red-500 rounded-full animate-ping" />
                      <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'paused' && (
            <motion.div
              key="paused"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white border border-white/20">
                <h2 className="text-3xl font-bold mb-4">🚀 Mission Paused</h2>
                <p className="text-xl mb-6 text-purple-100">
                  Take a break, explorer! Your progress is safe.
                </p>
                <button
                  onClick={togglePause}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-300"
                >
                  Resume Mission
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
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <motion.div
                    className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <SparklesIcon className="w-16 h-16 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold text-white mb-4">🎉 Mission Complete!</h1>
                  <p className="text-2xl text-yellow-300 mb-2">
                    Level {currentLevel} Successfully Completed!
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-6">Mission Report</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-400 mb-2">{score}</div>
                      <div className="text-blue-200 text-lg">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">
                        {accuracy.toFixed(1)}%
                      </div>
                      <div className="text-blue-200 text-lg">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-400 mb-2">
                        {formatTime(Math.floor(totalTime))}
                      </div>
                      <div className="text-blue-200 text-lg">Time Taken</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-400 mb-2">
                        {distractionsClicked}
                      </div>
                      <div className="text-blue-200 text-lg">Distractions Clicked</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mt-8">
                  {currentLevel < levels.length ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={retryLevel}
                        className="px-8 py-4 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors text-lg shadow-lg"
                      >
                        Retry Mission
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextLevel}
                        className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold rounded-xl hover:from-green-300 hover:to-emerald-500 transition-all duration-300 text-lg shadow-lg"
                      >
                        Next Mission 🚀
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/assessment/games/adhd?childId=${childId}`)}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 text-lg shadow-lg"
                    >
                      🏆 All Missions Complete!
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FocusFinder;
