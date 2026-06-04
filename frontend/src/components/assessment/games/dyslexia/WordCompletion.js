import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../../../services/AssessmentService';

const WordCompletion = ({ onGameComplete, suiteMode = false, gameConfig }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');

  // Game states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [responseTimes, setResponseTimes] = useState([]);
  const [gameStats, setGameStats] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isPaused, setIsPaused] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('simple'); // 'simple', 'syllables', 'homophones'
  const [startTime, setStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [interactionLog, setInteractionLog] = useState([]);
  const [usedWords, setUsedWords] = useState(new Set()); // Track used words to prevent repetition
  const [gameEnded, setGameEnded] = useState(false); // Prevent double saving
  const gameEndedRef = useRef(false); // Ref to prevent multiple endGame calls
  const lastWordGenerationRef = useRef(0); // Ref to prevent multiple word generations

  // Enhanced word sets with categories and emojis - Expanded with more variety
  const wordSets = {
    simple: [
      {
        word: 'cat',
        pattern: '_at',
        category: 'Animals',
        emoji: '🐱',
        hint: 'A furry pet that purrs',
      },
      { word: 'dog', pattern: 'd_g', category: 'Animals', emoji: '🐕', hint: "Man's best friend" },
      { word: 'fish', pattern: 'f_sh', category: 'Animals', emoji: '🐟', hint: 'Swims in water' },
      { word: 'bird', pattern: 'b_rd', category: 'Animals', emoji: '🐦', hint: 'Flies in the sky' },
      { word: 'bear', pattern: 'b_ar', category: 'Animals', emoji: '🐻', hint: 'Big furry animal' },
      {
        word: 'lion',
        pattern: 'l_on',
        category: 'Animals',
        emoji: '🦁',
        hint: 'King of the jungle',
      },
      {
        word: 'tiger',
        pattern: 't_ger',
        category: 'Animals',
        emoji: '🐯',
        hint: 'Striped big cat',
      },
      {
        word: 'elephant',
        pattern: 'el_phant',
        category: 'Animals',
        emoji: '🐘',
        hint: 'Big gray animal with trunk',
      },
      {
        word: 'tree',
        pattern: 'tr__',
        category: 'Nature',
        emoji: '🌳',
        hint: 'Tall plant with leaves',
      },
      {
        word: 'flower',
        pattern: 'fl_wer',
        category: 'Nature',
        emoji: '🌸',
        hint: 'Beautiful plant with petals',
      },
      {
        word: 'grass',
        pattern: 'gr_ss',
        category: 'Nature',
        emoji: '🌱',
        hint: 'Green ground covering',
      },
      {
        word: 'mountain',
        pattern: 'm_unt_in',
        category: 'Nature',
        emoji: '⛰️',
        hint: 'Very tall hill',
      },
      {
        word: 'river',
        pattern: 'r_ver',
        category: 'Nature',
        emoji: '🌊',
        hint: 'Flowing water',
      },
      {
        word: 'book',
        pattern: 'b__k',
        category: 'Objects',
        emoji: '📚',
        hint: 'Contains stories and knowledge',
      },
      {
        word: 'chair',
        pattern: 'ch_ir',
        category: 'Objects',
        emoji: '🪑',
        hint: 'You sit on this',
      },
      {
        word: 'table',
        pattern: 't_ble',
        category: 'Objects',
        emoji: '🪑',
        hint: 'You eat on this',
      },
      {
        word: 'phone',
        pattern: 'ph_ne',
        category: 'Objects',
        emoji: '📱',
        hint: 'You call people with this',
      },
      {
        word: 'computer',
        pattern: 'comp_ter',
        category: 'Objects',
        emoji: '💻',
        hint: 'Electronic device for work',
      },
      {
        word: 'star',
        pattern: 'st_r',
        category: 'Space',
        emoji: '⭐',
        hint: 'Shines in the night sky',
      },
      {
        word: 'moon',
        pattern: 'm__n',
        category: 'Space',
        emoji: '🌙',
        hint: 'Bright in the night',
      },
      {
        word: 'sun',
        pattern: 's_n',
        category: 'Space',
        emoji: '☀️',
        hint: 'Bright in the day',
      },
      {
        word: 'planet',
        pattern: 'pl_net',
        category: 'Space',
        emoji: '🪐',
        hint: 'Round object in space',
      },
      {
        word: 'rain',
        pattern: 'r__n',
        category: 'Weather',
        emoji: '🌧️',
        hint: 'Water falling from clouds',
      },
      {
        word: 'snow',
        pattern: 'sn_w',
        category: 'Weather',
        emoji: '❄️',
        hint: 'White frozen water',
      },
      {
        word: 'cloud',
        pattern: 'cl_ud',
        category: 'Weather',
        emoji: '☁️',
        hint: 'White in the sky',
      },
      {
        word: 'wind',
        pattern: 'w_nd',
        category: 'Weather',
        emoji: '💨',
        hint: 'Moving air',
      },
      {
        word: 'cake',
        pattern: 'c_ke',
        category: 'Food',
        emoji: '🍰',
        hint: 'Sweet birthday treat',
      },
      {
        word: 'bread',
        pattern: 'br_ad',
        category: 'Food',
        emoji: '🍞',
        hint: 'Made from flour',
      },
      {
        word: 'apple',
        pattern: 'app_e',
        category: 'Food',
        emoji: '🍎',
        hint: 'Red fruit',
      },
      {
        word: 'banana',
        pattern: 'ban_na',
        category: 'Food',
        emoji: '🍌',
        hint: 'Yellow curved fruit',
      },
      {
        word: 'pizza',
        pattern: 'p_zza',
        category: 'Food',
        emoji: '🍕',
        hint: 'Round with cheese',
      },
      {
        word: 'ball',
        pattern: 'b_ll',
        category: 'Sports',
        emoji: '⚽',
        hint: 'Round object to play with',
      },
      {
        word: 'bat',
        pattern: 'b_t',
        category: 'Sports',
        emoji: '🏏',
        hint: 'Used to hit ball',
      },
      {
        word: 'goal',
        pattern: 'g_al',
        category: 'Sports',
        emoji: '🥅',
        hint: 'Where you score',
      },
      {
        word: 'team',
        pattern: 't_am',
        category: 'Sports',
        emoji: '👥',
        hint: 'Group of players',
      },
      {
        word: 'house',
        pattern: 'h_use',
        category: 'Home',
        emoji: '🏠',
        hint: 'Where you live',
      },
      {
        word: 'room',
        pattern: 'r_m',
        category: 'Home',
        emoji: '🏠',
        hint: 'Part of house',
      },
      {
        word: 'door',
        pattern: 'd_or',
        category: 'Home',
        emoji: '🚪',
        hint: 'You open this to enter',
      },
      {
        word: 'window',
        pattern: 'w_ndow',
        category: 'Home',
        emoji: '🪟',
        hint: 'You look through this',
      },
    ],
    syllables: [
      {
        word: 'table',
        syllables: ['ta', 'ble'],
        category: 'Furniture',
        emoji: '🪑',
        hint: 'You eat on this',
      },
      {
        word: 'window',
        syllables: ['win', 'dow'],
        category: 'House',
        emoji: '🪟',
        hint: 'You look through this',
      },
      {
        word: 'garden',
        syllables: ['gar', 'den'],
        category: 'Nature',
        emoji: '🌺',
        hint: 'Where flowers grow',
      },
      {
        word: 'pencil',
        syllables: ['pen', 'cil'],
        category: 'School',
        emoji: '✏️',
        hint: 'You write with this',
      },
      {
        word: 'basket',
        syllables: ['bas', 'ket'],
        category: 'Objects',
        emoji: '🧺',
        hint: 'Carry things in this',
      },
      {
        word: 'butter',
        syllables: ['but', 'ter'],
        category: 'Food',
        emoji: '🧈',
        hint: 'Spread on bread',
      },
      {
        word: 'candle',
        syllables: ['can', 'dle'],
        category: 'Objects',
        emoji: '🕯️',
        hint: 'Gives light',
      },
      {
        word: 'dinner',
        syllables: ['din', 'ner'],
        category: 'Food',
        emoji: '🍽️',
        hint: 'Evening meal',
      },
      {
        word: 'morning',
        syllables: ['mor', 'ning'],
        category: 'Time',
        emoji: '🌅',
        hint: 'Start of day',
      },
      {
        word: 'evening',
        syllables: ['eve', 'ning'],
        category: 'Time',
        emoji: '🌆',
        hint: 'End of day',
      },
      {
        word: 'picture',
        syllables: ['pic', 'ture'],
        category: 'Art',
        emoji: '🖼️',
        hint: 'Visual art',
      },
      {
        word: 'teacher',
        syllables: ['tea', 'cher'],
        category: 'School',
        emoji: '👨‍🏫',
        hint: 'Helps you learn',
      },
      {
        word: 'student',
        syllables: ['stu', 'dent'],
        category: 'School',
        emoji: '👨‍🎓',
        hint: 'Learns in school',
      },
      {
        word: 'library',
        syllables: ['li', 'bra', 'ry'],
        category: 'School',
        emoji: '📚',
        hint: 'Place with books',
      },
      {
        word: 'hospital',
        syllables: ['hos', 'pi', 'tal'],
        category: 'Health',
        emoji: '🏥',
        hint: 'Where sick people go',
      },
      {
        word: 'restaurant',
        syllables: ['res', 'tau', 'rant'],
        category: 'Food',
        emoji: '🍽️',
        hint: 'Place to eat',
      },
      {
        word: 'beautiful',
        syllables: ['beau', 'ti', 'ful'],
        category: 'Description',
        emoji: '✨',
        hint: 'Very pretty',
      },
      {
        word: 'wonderful',
        syllables: ['won', 'der', 'ful'],
        category: 'Description',
        emoji: '🌟',
        hint: 'Very good',
      },
      {
        word: 'computer',
        syllables: ['com', 'pu', 'ter'],
        category: 'Technology',
        emoji: '💻',
        hint: 'Electronic device',
      },
      {
        word: 'birthday',
        syllables: ['birth', 'day'],
        category: 'Celebration',
        emoji: '🎂',
        hint: 'Day you were born',
      },
      {
        word: 'rainbow',
        syllables: ['rain', 'bow'],
        category: 'Nature',
        emoji: '🌈',
        hint: 'Colorful arc in sky',
      },
      {
        word: 'butterfly',
        syllables: ['but', 'ter', 'fly'],
        category: 'Animals',
        emoji: '🦋',
        hint: 'Colorful flying insect',
      },
      {
        word: 'elephant',
        syllables: ['el', 'e', 'phant'],
        category: 'Animals',
        emoji: '🐘',
        hint: 'Big gray animal',
      },
    ],
    homophones: [
      {
        word: 'road',
        context: 'He rode the ___',
        options: ['road', 'rode'],
        category: 'Transport',
        emoji: '🛣️',
        hint: 'Cars drive on this',
      },
      {
        word: 'their',
        context: '___ house is big',
        options: ['their', 'there', "they're"],
        category: 'Grammar',
        emoji: '🏠',
        hint: 'Belongs to them',
      },
      {
        word: 'to',
        context: 'I want ___ go',
        options: ['to', 'too', 'two'],
        category: 'Grammar',
        emoji: '➡️',
        hint: 'Direction or purpose',
      },
      {
        word: 'here',
        context: 'Come ___',
        options: ['here', 'hear'],
        category: 'Location',
        emoji: '📍',
        hint: 'This place',
      },
      {
        word: 'write',
        context: 'Please ___ your name',
        options: ['write', 'right'],
        category: 'Action',
        emoji: '✍️',
        hint: 'Put words on paper',
      },
      {
        word: 'sea',
        context: 'The ___ is blue',
        options: ['sea', 'see'],
        category: 'Nature',
        emoji: '🌊',
        hint: 'Large body of water',
      },
      {
        word: 'meet',
        context: "Let's ___ tomorrow",
        options: ['meet', 'meat'],
        category: 'Action',
        emoji: '🤝',
        hint: 'Come together',
      },
      {
        word: 'sun',
        context: 'The ___ is bright',
        options: ['sun', 'son'],
        category: 'Space',
        emoji: '☀️',
        hint: 'Shines in the sky',
      },
      {
        word: 'buy',
        context: 'I want to ___ a car',
        options: ['buy', 'by'],
        category: 'Action',
        emoji: '🛒',
        hint: 'Purchase something',
      },
      {
        word: 'new',
        context: 'This is a ___ car',
        options: ['new', 'knew'],
        category: 'Description',
        emoji: '🆕',
        hint: 'Not old',
      },
      {
        word: 'know',
        context: 'I ___ the answer',
        options: ['know', 'no'],
        category: 'Knowledge',
        emoji: '🧠',
        hint: 'Have information',
      },
      {
        word: 'where',
        context: '___ are you going?',
        options: ['where', 'wear'],
        category: 'Question',
        emoji: '❓',
        hint: 'Asking about location',
      },
      {
        word: 'weather',
        context: 'The ___ is nice',
        options: ['weather', 'whether'],
        category: 'Nature',
        emoji: '🌤️',
        hint: 'Condition of atmosphere',
      },
      {
        word: 'break',
        context: "Don't ___ the rules",
        options: ['break', 'brake'],
        category: 'Action',
        emoji: '⚡',
        hint: 'Stop following',
      },
      {
        word: 'peace',
        context: 'We want ___',
        options: ['peace', 'piece'],
        category: 'Feeling',
        emoji: '🕊️',
        hint: 'No fighting',
      },
      {
        word: 'flower',
        context: 'The ___ is pretty',
        options: ['flower', 'flour'],
        category: 'Nature',
        emoji: '🌸',
        hint: 'Plant with petals',
      },
      {
        word: 'mail',
        context: 'Check the ___',
        options: ['mail', 'male'],
        category: 'Communication',
        emoji: '📮',
        hint: 'Letters and packages',
      },
      {
        word: 'night',
        context: 'Good ___',
        options: ['night', 'knight'],
        category: 'Time',
        emoji: '🌙',
        hint: 'Dark time of day',
      },
      {
        word: 'wait',
        context: 'Please ___ here',
        options: ['wait', 'weight'],
        category: 'Action',
        emoji: '⏰',
        hint: 'Stay in place',
      },
    ],
  };

  // Initialize game
  const startGame = () => {
    setGameStarted(true);
    setShowInstructions(false);
    setGameOver(false);
    setShowResults(false);
    setScore(0);
    setErrors([]);
    setResponseTimes([]);
    setTimeLeft(600);
    setCurrentLevel('simple');
    setStreak(0);
    setFeedback(null);
    setGameStartTime(Date.now());
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setInteractionLog([]);
    setUsedWords(new Set()); // Reset used words
    setGameEnded(false);
    gameEndedRef.current = false;
    generateNewWord();
    document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen not supported
    });
    setIsFullScreen(true);

    // Show game start toast
    toast.success('Game started! Complete the words! ✍️', { duration: 2000 });
  };

  // Generate new word with repetition prevention
  const generateNewWord = useCallback(() => {
    const now = Date.now();
    // Prevent multiple word generations within 500ms
    if (now - lastWordGenerationRef.current < 500) {
      return;
    }
    lastWordGenerationRef.current = now;

    const currentSet = wordSets[currentLevel];

    if (!currentSet || currentSet.length === 0) {
      return;
    }

    // Filter out already used words
    const availableWords = currentSet.filter(word => !usedWords.has(word.word));

    // If all words have been used, reset the used words set
    if (availableWords.length === 0) {
      setUsedWords(new Set());
    }

    // Get available words (either filtered or full set if reset)
    const wordsToChooseFrom = availableWords.length > 0 ? availableWords : currentSet;

    if (wordsToChooseFrom.length === 0) {
      return;
    }

    const randomWord = wordsToChooseFrom[Math.floor(Math.random() * wordsToChooseFrom.length)];

    // Add to used words set
    setUsedWords(prev => new Set([...prev, randomWord.word]));

    setCurrentWord(randomWord);
    setStartTime(Date.now());
    setFeedback(null);
    setShowHint(false);

    // Verify the word was set correctly
    setTimeout(() => {
      if (!currentWord || currentWord.word !== randomWord.word) {
        setCurrentWord(randomWord);
      }
    }, 100);
  }, [currentLevel, usedWords, currentWord]);

  // Handle word completion
  const handleCompletion = () => {
    if (!userInput.trim() || !currentWord) return;

    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => [...prev, responseTime]);
    setTotalAttempts(prev => prev + 1);

    let isCorrect = false;
    if (currentLevel === 'simple') {
      isCorrect = userInput.toLowerCase() === currentWord.word.toLowerCase();
    } else if (currentLevel === 'syllables') {
      isCorrect = userInput.toLowerCase() === currentWord.word.toLowerCase();
    } else if (currentLevel === 'homophones') {
      isCorrect = userInput.toLowerCase() === currentWord.word.toLowerCase();
    }

    // Track interaction
    const interactionEntry = {
      timestamp: Date.now(),
      type: 'word_completion',
      userInput: userInput,
      correctWord: currentWord.word,
      isCorrect: isCorrect,
      responseTime: responseTime,
      currentLevel: currentLevel,
    };
    setInteractionLog(prev => [...prev, interactionEntry]);

    if (isCorrect) {
      setScore(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      setStreak(prev => prev + 1);
      setFeedback({
        type: 'correct',
        message: `Correct! ${currentWord.emoji} "${currentWord.word}"`,
      });

      // Show success toast
      toast.success(`Correct! ${currentWord.emoji} "${currentWord.word}" ✅`, { duration: 1500 });

      // Show milestone toasts
      const newScore = score + 1;
      if (newScore === 5) {
        toast.success('🎉 Level Up! Moving to Syllables! 📝', { duration: 2000 });
      } else if (newScore === 10) {
        toast.success('🚀 Level Up! Moving to Homophones! 🎯', { duration: 2000 });
      } else if (newScore === 15) {
        toast.success('🏆 15 words completed! Amazing!', { duration: 2000 });
      }
    } else {
      setStreak(0);
      setErrors(prev => [
        ...prev,
        {
          word: currentWord.word,
          userInput,
          responseTime,
          level: currentLevel,
        },
      ]);
      setFeedback({
        type: 'incorrect',
        message: `Incorrect. The answer was "${currentWord.word}"`,
      });

      // Show error toast
      toast.error(`Incorrect. The answer was "${currentWord.word}" ❌`, { duration: 1500 });
    }

    // Progress to next level if needed
    const newScore = score + (isCorrect ? 1 : 0);
    let levelChanged = false;

    if (newScore >= 5 && currentLevel === 'simple') {
      setCurrentLevel('syllables');
      setUsedWords(new Set()); // Reset used words for new level
      levelChanged = true;
    } else if (newScore >= 10 && currentLevel === 'syllables') {
      setCurrentLevel('homophones');
      setUsedWords(new Set()); // Reset used words for new level
      levelChanged = true;
    }

    // Clear user input after a short delay to show feedback
    setTimeout(() => {
      setUserInput('');
      // Only generate new word if level didn't change (level change will trigger its own word generation)
      if (!levelChanged) {
        generateNewWord();
      }
    }, 1500);
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            toast.error("Time's up! ⏰ Game Over!", { duration: 2000 });
            // Only call handleGameOver if game is not already over
            if (!gameOver && !gameEndedRef.current) {
              // Call handleGameOver logic directly here to avoid dependency issues
              if (gameEndedRef.current) {
                return 0;
              }

              gameEndedRef.current = true;

              setGameOver(true);
              setShowResults(true);
              setGameStarted(false);

              const stats = calculateStats();
              setGameStats(stats);

              // Add a small delay to ensure state updates are processed
              setTimeout(() => {
                endGame();
              }, 100);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, isPaused, timeLeft]);

  // Regenerate word when level changes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // If no current word, generate one
      if (!currentWord || !currentWord.word) {
        generateNewWord();
        return;
      }

      // Check if current word belongs to the current level
      const currentSet = wordSets[currentLevel];
      const wordBelongsToCurrentLevel = currentSet.some(word => word.word === currentWord.word);

      if (!wordBelongsToCurrentLevel) {
        generateNewWord();
      }
    }
  }, [currentLevel, gameStarted, gameOver, currentWord, generateNewWord]);

  const endGame = async () => {
    // Prevent multiple saves
    if (gameEnded) {
      return;
    }
    setGameEnded(true);

    const endTime = Date.now();
    const totalTimeTaken = gameStartTime ? (endTime - gameStartTime) / 1000 : 0;
    setTotalTime(totalTimeTaken);

    const accuracyScore =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    setAccuracy(accuracyScore);

    // Prepare game results
    const gameResults = {
      gameId: 'word-completion',
      gameType: 'word-completion',
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
        errors: errors,
        responseTimes: responseTimes,
        interactionLog: interactionLog,
        totalInteractions: interactionLog.length,
      },
    };

    // If in suite mode, call the callback to continue the chain
    if (suiteMode && onGameComplete) {
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
        completedAt: new Date().toISOString(),
        gameSpecificData: {
          currentLevel: currentLevel,
          errors: errors,
          responseTimes: responseTimes,
          interactionLog: interactionLog,
          totalInteractions: interactionLog.length,
        },
      };

      await AssessmentService.completeGame(
        sessionId,
        'word-completion',
        'dyslexia-games',
        performanceData
      );

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      const localKey = `dyslexia_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Get existing word-completion data or initialize
      const existingWordCompletion = existingData['word-completion'] || {};

      // Update with new session data
      const updatedWordCompletion = {
        ...existingWordCompletion,
        ...performanceData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingWordCompletion.playCount || 0) + 1,
        bestScore: Math.max(existingWordCompletion.bestScore || 0, score),
        averageAccuracy: (() => {
          const existingSessions = existingWordCompletion.sessions || [];
          const allAccuracies = [...existingSessions.map(s => s.accuracy), accuracyScore];
          return Math.round(
            allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length
          );
        })(),
        sessions: [
          ...(existingWordCompletion.sessions || []),
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

      existingData['word-completion'] = updatedWordCompletion;
      localStorage.setItem(localKey, JSON.stringify(existingData));

      // Trigger game history refresh
      window.dispatchEvent(
        new CustomEvent('gameCompleted', {
          detail: {
            childId,
            gameId: 'word-completion',
            score,
            accuracy: accuracyScore,
            totalTime: totalTimeTaken,
          },
        })
      );
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to save game results');
    }
  };

  // Calculate game statistics
  const calculateStats = () => {
    const totalWords = responseTimes.length;
    const correctWords = score;
    const accuracy = (correctWords / totalWords) * 100;
    const timeTaken = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    const mistakes = errors.length;

    // Calculate error patterns
    const vowelErrors = errors.filter(
      e =>
        e.userInput &&
        e.word &&
        e.userInput.toLowerCase() !== e.word.toLowerCase() &&
        /[aeiou]/.test(e.userInput)
    ).length;

    const hesitationErrors = errors.filter(e => e.responseTime > 5000).length;

    return {
      totalWords,
      correctWords,
      accuracy,
      timeTaken,
      mistakes,
      vowelErrors,
      hesitationErrors,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxStreak: streak,
    };
  };

  // Format time
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Restart game
  const restartGame = () => {
    setShowInstructions(true);
    setGameStarted(false);
    setGameOver(false);
    setShowResults(false);
    setScore(0);
    setErrors([]);
    setResponseTimes([]);
    setTimeLeft(600);
    setCurrentLevel('simple');
    setStreak(0);
    setFeedback(null);
    setUserInput('');
    setCurrentWord(null);
    setStartTime(null);
    setIsPaused(false);
    setUsedWords(new Set()); // Reset used words
    setGameEnded(false);
    gameEndedRef.current = false;

    // Show restart toast
    toast.success('Game restarted! 🔄', { duration: 1500 });
  };

  // Return to games function
  const returnToGames = () => {
    // Get childId from URL parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const childId = urlParams.get('childId');
    const targetUrl = childId
      ? `/assessment/games/dyslexia?childId=${childId}`
      : '/assessment/games/dyslexia';
    navigate(targetUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-blue-500/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 to-transparent rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-indigo-500/8 to-transparent rounded-full"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={returnToGames}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Games
          </button>
          {gameStarted && !gameOver && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <ChartBarIcon className="w-5 h-5 text-green-500" />
                <span className="font-bold text-gray-900 dark:text-white">{score}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => {
                  const newPausedState = !isPaused;
                  setIsPaused(newPausedState);

                  if (newPausedState) {
                    toast.success('Game Paused ⏸️', { duration: 1500 });
                  } else {
                    toast.success('Game Resumed ▶️', { duration: 1500 });
                  }
                }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {isPaused ? <PlayIcon className="h-6 w-6" /> : <PauseIcon className="h-6 w-6" />}
              </button>
              <button
                onClick={restartGame}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>

        {/* Game Content */}
        {!showResults && (
          <div className="max-w-4xl mx-auto">
            {/* Instructions */}
            {!gameStarted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    Word Completion
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    Complete missing letters, match syllables, and choose the right homophones!
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Level 1: Simple
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Complete missing letters in words
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        Level 2: Syllables
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Match syllables to form words
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        Level 3: Homophones
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Choose the correct homophone
                      </p>
                    </div>
                  </div>
                  <div className="text-left space-y-3 text-gray-600 dark:text-gray-300 mb-8">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span>Complete missing letters in words</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span>Match syllables to form words</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span>Choose the correct homophone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span>Game lasts 10 minutes</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all duration-300 shadow-lg"
                >
                  Start Game
                </button>
              </motion.div>
            )}

            {/* Game Screen */}
            {gameStarted && !gameOver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                {currentWord ? (
                  <div>
                    {/* Level Progress */}
                    <div className="mb-6">
                      <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Level{' '}
                          {currentLevel === 'simple'
                            ? '1'
                            : currentLevel === 'syllables'
                              ? '2'
                              : '3'}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {currentWord.category}
                        </span>
                      </div>
                    </div>

                    {/* Streak Display */}
                    {streak > 0 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4">
                        <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-4 py-2">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">🔥</span>
                          <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                            Streak: {streak}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Word Display */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentWord.word}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="mb-8"
                      >
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                          {currentLevel === 'simple' && (
                            <div className="space-y-4">
                              <div className="text-6xl font-bold text-gray-900 dark:text-white">
                                {currentWord.pattern}
                              </div>
                              <div className="text-2xl text-gray-600 dark:text-gray-300">
                                {currentWord.emoji} {currentWord.category}
                              </div>
                            </div>
                          )}
                          {currentLevel === 'syllables' && currentWord.syllables && (
                            <div className="space-y-4">
                              <div className="flex justify-center space-x-4">
                                {currentWord.syllables.map((syllable, index) => (
                                  <div
                                    key={index}
                                    className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-6 py-3 rounded-xl border border-purple-200 dark:border-purple-700"
                                  >
                                    {syllable}
                                  </div>
                                ))}
                              </div>
                              <div className="text-xl text-gray-600 dark:text-gray-300">
                                {currentWord.emoji} {currentWord.category}
                              </div>
                              <div className="text-lg text-blue-600 dark:text-blue-400">
                                Type the complete word
                              </div>
                            </div>
                          )}
                          {currentLevel === 'syllables' && !currentWord.syllables && (
                            <div className="space-y-4">
                              <div className="text-6xl font-bold text-gray-900 dark:text-white">
                                {currentWord.word}
                              </div>
                              <div className="text-2xl text-gray-600 dark:text-gray-300">
                                {currentWord.emoji} {currentWord.category}
                              </div>
                              <div className="text-lg text-blue-600 dark:text-blue-400">
                                Type the complete word
                              </div>
                            </div>
                          )}
                          {currentLevel === 'homophones' && currentWord.context && (
                            <div className="space-y-4">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {currentWord.context}
                              </div>
                              <div className="text-lg text-gray-600 dark:text-gray-300">
                                {currentWord.emoji} {currentWord.category}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Hint Button */}
                    <div className="mb-6">
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                      {showHint && currentWord.hint && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-gray-600 dark:text-gray-300"
                        >
                          {currentWord.hint}
                        </motion.div>
                      )}
                    </div>

                    {/* Input Section */}
                    <div className="max-w-md mx-auto">
                      {currentLevel === 'homophones' && currentWord.options ? (
                        <div className="flex flex-wrap justify-center gap-3">
                          {currentWord.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setUserInput(option);
                                handleCompletion();
                              }}
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg border border-gray-200 dark:border-gray-600 font-semibold"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-4">
                          <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleCompletion()}
                            className="text-2xl text-center font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg border border-gray-200 dark:border-gray-600"
                            placeholder="Type your answer..."
                            autoFocus
                          />
                          <button
                            onClick={handleCompletion}
                            disabled={!userInput.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`mt-6 text-lg font-medium ${
                            feedback.type === 'correct'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {feedback.message}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Loading next word...
                      </div>
                      <div className="text-lg text-gray-600 dark:text-gray-300">
                        Current Level:{' '}
                        {currentLevel === 'simple' ? '1' : currentLevel === 'syllables' ? '2' : '3'}
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => generateNewWord()}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Force Generate Word
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Results Page */}
        {showResults && gameStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Game Results
              </h2>

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
                  <ChartBarIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {gameStats.accuracy.toFixed(1)}%
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">Accuracy</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
                  <ClockIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {formatTime(gameStats.timeTaken)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">Time Taken</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
                  <ChartBarIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {gameStats.correctWords}/{gameStats.totalWords}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">Correct Words</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Detailed Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-300">Total Errors</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {gameStats.mistakes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircleIcon className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-300">Vowel Errors</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {gameStats.vowelErrors}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-300">
                        Hesitations ({'>'}5s)
                      </span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {gameStats.hesitationErrors}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🔥</span>
                      <span className="text-gray-600 dark:text-gray-300">Max Streak</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {gameStats.maxStreak}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setGameOver(false);
                    startGame();
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300"
                >
                  Play Again
                </button>
                <button
                  onClick={returnToGames}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back to Games
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WordCompletion;
