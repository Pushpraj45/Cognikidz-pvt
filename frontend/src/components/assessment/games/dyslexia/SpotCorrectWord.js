import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  ArrowPathIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  PrinterIcon,
  PauseIcon,
  SparklesIcon,
  AcademicCapIcon,
  HeartIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const SpotCorrectWord = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentPair, setCurrentPair] = useState(null);
  const [wordPositions, setWordPositions] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [interactionLog, setInteractionLog] = useState([]);

  // Comprehensive error tracking
  const [errorTypes, setErrorTypes] = useState({
    letterReversals: 0,
    wordOmissions: 0,
    wordAdditions: 0,
    wordSubstitutions: 0,
    wordTranspositions: 0,
    shortWordErrors: 0,
    rapidRecognitionErrors: 0,
  });

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    accuracyByWordType: {},
    responseTimeByWordType: {},
    consistencyScore: 0,
    rapidRecognitionScore: 0,
  });

  // Enhanced word list with emoji hints
  const level1Words = [
    { word: 'dog', error: 'dg', type: 'omission', emoji: '🐕' },
    { word: 'cat', error: 'ct', type: 'omission', emoji: '🐱' },
    { word: 'book', error: 'bok', type: 'omission', emoji: '📚' },
    { word: 'tree', error: 'tre', type: 'omission', emoji: '🌳' },
    { word: 'house', error: 'huse', type: 'omission', emoji: '🏠' },
    { word: 'bird', error: 'brd', type: 'omission', emoji: '🐦' },
    { word: 'fish', error: 'fsh', type: 'omission', emoji: '🐟' },
    { word: 'star', error: 'str', type: 'omission', emoji: '⭐' },
    { word: 'moon', error: 'mon', type: 'omission', emoji: '🌙' },
    { word: 'sun', error: 'sn', type: 'omission', emoji: '☀️' },
    { word: 'car', error: 'cr', type: 'omission', emoji: '🚗' },
    { word: 'ball', error: 'bl', type: 'omission', emoji: '⚽' },
    { word: 'cake', error: 'cak', type: 'omission', emoji: '🍰' },
    { word: 'rain', error: 'ran', type: 'omission', emoji: '🌧️' },
    { word: 'snow', error: 'sno', type: 'omission', emoji: '❄️' },
  ];

  const level2Words = [
    { word: 'ball', error: 'dall', type: 'reversal', emoji: '⚽' },
    { word: 'pen', error: 'qen', type: 'reversal', emoji: '✏️' },
    { word: 'bed', error: 'deb', type: 'reversal', emoji: '🛏️' },
    { word: 'pig', error: 'qig', type: 'reversal', emoji: '🐷' },
    { word: 'dog', error: 'bog', type: 'reversal', emoji: '🐕' },
    { word: 'cat', error: 'dat', type: 'reversal', emoji: '🐱' },
    { word: 'book', error: 'dooq', type: 'reversal', emoji: '📚' },
    { word: 'tree', error: 'dree', type: 'reversal', emoji: '🌳' },
    { word: 'house', error: 'bouse', type: 'reversal', emoji: '🏠' },
    { word: 'bird', error: 'dird', type: 'reversal', emoji: '🐦' },
    { word: 'fish', error: 'dish', type: 'reversal', emoji: '🐟' },
    { word: 'star', error: 'dtar', type: 'reversal', emoji: '⭐' },
    { word: 'moon', error: 'boon', type: 'reversal', emoji: '🌙' },
    { word: 'sun', error: 'dun', type: 'reversal', emoji: '☀️' },
    { word: 'car', error: 'dar', type: 'reversal', emoji: '🚗' },
  ];

  const level3Words = [
    { word: 'apple', error: 'a_ple', type: 'completion', emoji: '🍎' },
    { word: 'banana', error: 'b_nana', type: 'completion', emoji: '🍌' },
    { word: 'orange', error: 'or_nge', type: 'completion', emoji: '🍊' },
    { word: 'grape', error: 'gr_pe', type: 'completion', emoji: '🍇' },
    { word: 'pear', error: 'p_ar', type: 'completion', emoji: '🍐' },
    { word: 'mango', error: 'm_ngo', type: 'completion', emoji: '🥭' },
    { word: 'kiwi', error: 'k_wi', type: 'completion', emoji: '🥝' },
    { word: 'lemon', error: 'l_mon', type: 'completion', emoji: '🍋' },
    { word: 'peach', error: 'p_ach', type: 'completion', emoji: '🍑' },
    { word: 'plum', error: 'p_um', type: 'completion', emoji: '🫐' },
    { word: 'strawberry', error: 'st_awberry', type: 'completion', emoji: '🍓' },
    { word: 'watermelon', error: 'wa_ermelon', type: 'completion', emoji: '🍉' },
    { word: 'pineapple', error: 'pin_apple', type: 'completion', emoji: '🍍' },
    { word: 'cherry', error: 'che_ry', type: 'completion', emoji: '🍒' },
    { word: 'blueberry', error: 'blue_erry', type: 'completion', emoji: '🫐' },
  ];

  const level4Sentences = [
    {
      sentence: 'The cat sat no the mat.',
      correction: 'The cat sat on the mat.',
      type: 'sentence',
      emoji: '🐱',
    },
    {
      sentence: 'I like to reed books.',
      correction: 'I like to read books.',
      type: 'sentence',
      emoji: '📚',
    },
    {
      sentence: 'She goed to the store.',
      correction: 'She went to the store.',
      type: 'sentence',
      emoji: '🏪',
    },
    {
      sentence: 'The bird flied away.',
      correction: 'The bird flew away.',
      type: 'sentence',
      emoji: '🐦',
    },
    {
      sentence: 'He runned fast.',
      correction: 'He ran fast.',
      type: 'sentence',
      emoji: '🏃',
    },
    {
      sentence: 'The dog barked loud.',
      correction: 'The dog barked loudly.',
      type: 'sentence',
      emoji: '🐕',
    },
    {
      sentence: 'I eated breakfast.',
      correction: 'I ate breakfast.',
      type: 'sentence',
      emoji: '🍳',
    },
    {
      sentence: 'She sleeped well.',
      correction: 'She slept well.',
      type: 'sentence',
      emoji: '😴',
    },
  ];

  const level5Words = [
    { word: 'fly', pseudo: 'flig', type: 'rapid', emoji: '🦋' },
    { word: 'jump', pseudo: 'jumpo', type: 'rapid', emoji: '🦘' },
    { word: 'walk', pseudo: 'wolk', type: 'rapid', emoji: '🚶' },
    { word: 'run', pseudo: 'runn', type: 'rapid', emoji: '🏃' },
    { word: 'swim', pseudo: 'swimm', type: 'rapid', emoji: '🏊' },
    { word: 'dance', pseudo: 'dancce', type: 'rapid', emoji: '💃' },
    { word: 'sing', pseudo: 'singg', type: 'rapid', emoji: '🎤' },
    { word: 'play', pseudo: 'playy', type: 'rapid', emoji: '🎮' },
    { word: 'read', pseudo: 'reed', type: 'rapid', emoji: '📖' },
    { word: 'write', pseudo: 'writte', type: 'rapid', emoji: '✍️' },
  ];

  const getCurrentLevelWords = () => {
    switch (currentLevel) {
      case 1:
        return level1Words;
      case 2:
        return level2Words;
      case 3:
        return level3Words;
      case 4:
        return level4Sentences;
      case 5:
        return level5Words;
      default:
        return level1Words;
    }
  };

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (gameStarted && timeLeft === 0) {
      endGame();
    }
  }, [gameStarted, timeLeft, isPaused]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      loadNewRound();
    }
    // eslint-disable-next-line
  }, [currentLevel, gameStarted]);

  const endGame = async () => {
    setGameOver(true);
    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'spot-correct-word',
      gameType: 'spot-correct-word',
      score: score,
      accuracy: accuracyScore,
      totalTime: totalTimeTaken,
      startTime: gameStartTime ? new Date(gameStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      correctAnswers: correctAnswers,
      totalAttempts: totalAttempts,
      completedAt: new Date().toISOString(),
      gameSpecificData: {
        currentLevel: currentLevel,
        roundsCompleted: currentRound,
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
        errorTypes: errorTypes,
        averageResponseTime:
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
            : 0,
        keystrokeData: keystrokeData,
        interactionLog: interactionLog,
        totalInteractions: keystrokeData.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
      console.log('🎮 SpotCorrectWord completed in suite mode, calling onGameComplete');
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
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
        currentLevel: currentLevel,
        roundsCompleted: currentRound,
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          currentLevel: currentLevel,
          roundsCompleted: currentRound,
          correctAnswers: correctAnswers,
          totalAttempts: totalAttempts,
          errorTypes: errorTypes,
          averageResponseTime:
            responseTimes.length > 0
              ? Math.round(
                  responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
                )
              : 0,
          keystrokeData: keystrokeData,
          interactionLog: interactionLog,
          totalInteractions: keystrokeData.length,
        },
      };

      console.log('🎮 Performance data being sent:', performanceData);

      await AssessmentService.completeGame(
        sessionId,
        'spot-correct-word',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing spot-correct-word data or initialize
      const existingSpotCorrectWord = existingData['spot-correct-word'] || {};

      // Update with new session data
      const updatedSpotCorrectWord = {
        ...existingSpotCorrectWord,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingSpotCorrectWord.playCount || 0) + 1,
        bestScore: Math.max(existingSpotCorrectWord.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingSpotCorrectWord.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingSpotCorrectWord.sessions || []),
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

      existingData['spot-correct-word'] = updatedSpotCorrectWord;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'spot-correct-word',
            score,
            accuracy: accuracyScore,
            totalTime: totalTimeTaken,
          },
        })
      );
    } catch (error) {
      console.error('Error saving game results:', error);
      toast.dismiss();
      toast.error('Failed to save game results');
    }
  };

  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setCurrentLevel(1);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setErrorTypes({
      letterReversals: 0,
      wordOmissions: 0,
      wordAdditions: 0,
      wordSubstitutions: 0,
      wordTranspositions: 0,
      shortWordErrors: 0,
      rapidRecognitionErrors: 0,
    });
    setResponseTimes([]);
    setGameStartTime(Date.now());
    setKeystrokeData([]);
    setInteractionLog([]);
    loadNewRound();
  };

  const loadNewRound = () => {
    const currentWords = getCurrentLevelWords();
    const randomItem = currentWords[Math.floor(Math.random() * currentWords.length)];
    setCurrentPair(randomItem);

    // Get the correct and incorrect options based on level
    let correctOption, incorrectOption;

    if (currentLevel === 1) {
      correctOption = randomItem.word;
      incorrectOption = randomItem.error;
    } else if (currentLevel === 2) {
      correctOption = randomItem.word;
      incorrectOption = randomItem.error;
    } else if (currentLevel === 3) {
      correctOption = randomItem.word;
      incorrectOption = randomItem.error;
    } else if (currentLevel === 4) {
      correctOption = randomItem.correction;
      incorrectOption = randomItem.sentence;
    } else if (currentLevel === 5) {
      correctOption = randomItem.word;
      incorrectOption = randomItem.pseudo;
    } else {
      // Fallback for any other level
      correctOption = randomItem.word;
      incorrectOption =
        randomItem.error || randomItem.pseudo || randomItem.missing || randomItem.sentence;
    }

    // Randomize positions but store them
    const positions = [correctOption, incorrectOption].sort(() => Math.random() - 0.5);
    setWordPositions(positions);

    setFeedback(null);
    setShowHint(false);
    setStartTime(Date.now());
  };

  const handleWordSelect = word => {
    const clickTime = Date.now();
    const timeSinceStart = gameStartTime ? (clickTime - gameStartTime) / 1000 : 0;
    const responseTime = clickTime - startTime;

    setResponseTimes([...responseTimes, responseTime]);
    setTotalAttempts(prev => prev + 1);

    // Track interaction
    const interaction = {
      type: 'word_selection',
      selectedWord: word,
      timeSinceStart: timeSinceStart,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
    };

    setInteractionLog(prev => [...prev, interaction]);
    setKeystrokeData(prev => [...prev, { timeSinceStart, timestamp: new Date().toISOString() }]);

    // Determine the correct answer based on level
    let correctAnswer;
    if (currentLevel === 1 || currentLevel === 2 || currentLevel === 3 || currentLevel === 5) {
      correctAnswer = currentPair.word;
    } else if (currentLevel === 4) {
      correctAnswer = currentPair.correction;
    } else {
      correctAnswer = currentPair.word; // fallback
    }

    // Debug log
    console.log(
      'Selected word:',
      word,
      '| Correct answer:',
      correctAnswer,
      '| Current pair:',
      currentPair
    );

    // Normalize comparison
    const isCorrect = word.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
    if (isCorrect) {
      setScore(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      setFeedback({ type: 'correct', message: 'Correct! Well done!' });

      // Progress to next level after certain score thresholds
      if (score >= 5 && currentLevel === 1) {
        setCurrentLevel(2);
        // do not call loadNewRound here
      } else if (score >= 10 && currentLevel === 2) {
        setCurrentLevel(3);
      } else if (score >= 15 && currentLevel === 3) {
        setCurrentLevel(4);
      } else if (score >= 20 && currentLevel === 4) {
        setCurrentLevel(5);
      } else {
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          loadNewRound();
        }, 1500);
      }
    } else {
      setFeedback({ type: 'incorrect', message: 'Try again!' });

      // Track error types
      if (currentLevel === 2) {
        setErrorTypes(prev => ({ ...prev, letterReversals: prev.letterReversals + 1 }));
      } else if (currentLevel === 1) {
        setErrorTypes(prev => ({ ...prev, wordOmissions: prev.wordOmissions + 1 }));
      } else if (currentLevel === 5) {
        setErrorTypes(prev => ({
          ...prev,
          rapidRecognitionErrors: prev.rapidRecognitionErrors + 1,
        }));
      }
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const adjustFontSize = newSize => {
    setFontSize(newSize);
  };

  const calculateConsistencyScore = () => {
    if (responseTimes.length < 2) return 100;
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const variance =
      responseTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) /
      responseTimes.length;
    return Math.max(0, 100 - Math.sqrt(variance) / 10);
  };

  const generateReport = () => {
    const report = {
      score,
      correctAnswers,
      totalAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0,
      errorTypes,
      consistencyScore: calculateConsistencyScore(),
      averageResponseTime:
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0,
    };
    return report;
  };

  const printReport = () => {
    const report = generateReport();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Spot Correct Word Assessment Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');
            body { 
              font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 20px; 
              color: #1E293B;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding: 20px;
              background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
              border-radius: 16px;
              border-left: 4px solid #6366F1;
            }
            .header h1 {
              color: #6366F1;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .header p {
              color: #64748B;
              margin: 0;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 20px;
              background: rgba(255, 255, 255, 0.8);
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .section h2 {
              color: #1E293B;
              font-weight: 600;
              margin-bottom: 15px;
              border-bottom: 2px solid #6366F1;
              padding-bottom: 8px;
            }
            .metric { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
              padding: 8px 0;
              border-bottom: 1px solid #E2E8F0;
            }
            .metric:last-child {
              border-bottom: none;
            }
            .metric span:first-child {
              color: #64748B;
              font-weight: 500;
            }
            .metric span:last-child {
              color: #1E293B;
              font-weight: 600;
            }
            .error-type { 
              background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%); 
              padding: 15px; 
              margin: 8px 0; 
              border-radius: 12px; 
              border-left: 4px solid #EF4444;
              box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Spot Correct Word Assessment Report</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h2>Overall Performance</h2>
            <div class="metric">
              <span>Final Score:</span>
              <span>${report.score}</span>
            </div>
            <div class="metric">
              <span>Accuracy:</span>
              <span>${report.accuracy}%</span>
            </div>
            <div class="metric">
              <span>Average Response Time:</span>
              <span>${report.averageResponseTime}ms</span>
            </div>
            <div class="metric">
              <span>Consistency Score:</span>
              <span>${Math.round(report.consistencyScore)}%</span>
            </div>
          </div>
          
          <div class="section">
            <h2>Error Analysis</h2>
            <div class="error-type">
              <strong>Letter Reversals:</strong> ${report.errorTypes.letterReversals}
            </div>
            <div class="error-type">
              <strong>Word Omissions:</strong> ${report.errorTypes.wordOmissions}
            </div>
            <div class="error-type">
              <strong>Rapid Recognition Errors:</strong> ${report.errorTypes.rapidRecognitionErrors}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const playAgain = () => {
    startGame();
  };

  const returnToGames = () => {
    // Get childId from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const childId = urlParams.get('childId');
    const targetUrl = childId
      ? `/assessment/games/dyslexia?childId=${childId}`
      : '/assessment/games/dyslexia';
    navigate(targetUrl);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setCurrentLevel(1);
    setCurrentRound(1);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setFeedback(null);
    setIsPaused(false);
    setErrorTypes({
      letterReversals: 0,
      wordOmissions: 0,
      wordAdditions: 0,
      wordSubstitutions: 0,
      wordTranspositions: 0,
      shortWordErrors: 0,
      rapidRecognitionErrors: 0,
    });
    setResponseTimes([]);
    setShowInstructions(true);
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-accent/8 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Animated decorative elements */}
        <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-green-500 rounded-full animate-float"></div>
        <div
          className="absolute top-[30%] right-[15%] w-3 h-3 bg-emerald-500 rounded-full animate-float"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-teal-500 rounded-full animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-[60%] right-[25%] w-3 h-3 bg-green-500 rounded-full animate-float"
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
            Spot the Correct Word
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Identify the correctly spelled word from the options provided
          </p>
        </motion.div>

        {/* Instructions Modal */}
        <AnimatePresence>
          {showInstructions && (
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
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EyeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How to Play
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Identify the correctly spelled word from two options
                  </p>
                </div>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <p>Look at both word options carefully</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <p>Click on the correctly spelled word</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <p>Use the hint button if you need help</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      4
                    </div>
                    <p>Difficulty increases automatically as you progress!</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-green-500/20 shadow-lg"
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
          {gameOver && (
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
                    Assessment Complete!
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
                      {totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%
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
                        Rounds Completed
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {currentRound - 1}
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
                    onClick={playAgain}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-green-500/20"
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
        {gameStarted && !gameOver && (
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
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentLevel}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800"
              >
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
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
                  {currentRound}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Round</div>
              </motion.div>
            </div>

            {/* Level Description */}
            <div className="text-center mb-6">
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                {currentLevel === 1 && 'Find the correct word'}
                {currentLevel === 2 && 'Identify letter reversals'}
                {currentLevel === 3 && 'Complete the missing letters'}
                {currentLevel === 4 && 'Correct the sentence'}
                {currentLevel === 5 && 'Quick word recognition'}
              </span>
            </div>

            {/* Word Display */}
            {currentPair && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {wordPositions.map((word, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleWordSelect(word)}
                    disabled={isPaused}
                    className={`p-8 rounded-2xl text-2xl font-bold text-center transition-all duration-500 shadow-lg ${
                      isPaused
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="text-4xl mb-2">{word}</div>
                    <div className="text-sm font-normal text-gray-500">Option {index + 1}</div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Enhanced Hint System with Emoji */}
            <div className="flex justify-center mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleHint}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300 shadow-lg"
              >
                <EyeIcon className="w-5 h-5" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </motion.button>
            </div>

            {/* Enhanced Hint Display with Emoji */}
            {showHint && currentPair && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-6"
              >
                <div className="text-4xl mb-2">{currentPair.emoji}</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  Hint: Look for the word that matches this emoji!
                </div>
              </motion.div>
            )}

            {/* Feedback Message */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center text-lg font-medium mt-6 ${
                    feedback.type === 'correct'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpotCorrectWord;
