import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  ClockIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowLeftIcon,
  EyeIcon,
  CpuChipIcon,
  BoltIcon,
  FlagIcon,
  SpeakerWaveIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  FireIcon,
  ChartBarIcon,
  AcademicCapIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  CubeIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import GameHistorySection from '../GameHistorySection';
import LogoLoader from '../../../ui/LogoLoader';

const games = [
  {
    id: 'letter-sound-matching',
    title: 'Letter-Sound Matching',
    description: 'Play a sound; match it to the correct letter or letter pair',
    icon: '🎯',
    heroIcon: SpeakerWaveIcon,
    testArea: 'Phonemic awareness',
    scoring: 'Time to respond + accuracy',
    image: 'https://img.icons8.com/color/96/000000/ear.png',
    color: 'from-blue-500 to-indigo-600',
    difficulty: 'Easy',
    duration: '5-7 min',
    type: 'Phonemic awareness game',
    goal: 'Assess letter-sound correspondence',
    gameplay:
      'Children hear a sound and must identify the corresponding letter from multiple options. The game progressively includes more complex letter combinations.',
    observation:
      'Difficulty with letter-sound matching or confusion between similar sounds may indicate phonological processing challenges.',
    skills: ['Phonemic Awareness', 'Letter Recognition', 'Auditory Processing'],
    ageRange: '5-10 years',
    cognitiveLoad: 'Low',
  },
  {
    id: 'word-sequence-builder',
    title: 'Word Sequence Builder',
    description: 'Drag and drop letters to form words from shuffled letters',
    icon: '🔁',
    heroIcon: PuzzlePieceIcon,
    testArea: 'Spelling, letter sequencing',
    scoring: 'Correctness + number of attempts',
    image: 'https://img.icons8.com/color/96/000000/word.png',
    color: 'from-purple-500 to-pink-600',
    difficulty: 'Medium',
    duration: '7-10 min',
    type: 'Spelling and sequencing game',
    goal: 'Evaluate letter sequencing abilities',
    gameplay:
      'Children are presented with scrambled letters and must drag and drop them to form the correct word. Visual and audio cues help guide the process.',
    observation:
      'Frequent letter reversals or difficulty with letter order may indicate dyslexia-related challenges.',
    skills: ['Letter Sequencing', 'Visual Processing', 'Spelling'],
    ageRange: '6-12 years',
    cognitiveLoad: 'Medium',
  },
  {
    id: 'spot-correct-word',
    title: 'Spot the Correct Word',
    description: 'Select the real word from similar-looking pairs',
    icon: '👁️‍🗨️',
    heroIcon: EyeIcon,
    testArea: 'Visual discrimination, left-right confusion',
    scoring: 'Mistakes with mirrored letters',
    image: 'https://img.icons8.com/color/96/000000/eye.png',
    color: 'from-green-500 to-emerald-600',
    difficulty: 'Medium',
    duration: '5-8 min',
    type: 'Visual discrimination game',
    goal: 'Detect visual processing difficulties',
    gameplay:
      'Children are shown pairs of similar-looking words and must identify the correctly spelled word. Some pairs include mirror images or reversed letters.',
    observation:
      'Consistent selection of mirror images or reversed letters may indicate visual processing or directional confusion.',
    skills: ['Visual Discrimination', 'Letter Recognition', 'Attention to Detail'],
    ageRange: '6-11 years',
    cognitiveLoad: 'Medium',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Match words with their audio representations',
    icon: '🧠',
    heroIcon: CpuChipIcon,
    testArea: 'Working memory, phonological memory',
    scoring: 'Correct matches and time',
    image: 'https://img.icons8.com/color/96/000000/brain.png',
    color: 'from-yellow-500 to-orange-600',
    difficulty: 'Hard',
    duration: '8-12 min',
    type: 'Memory matching game',
    goal: 'Assess working memory and phonological processing',
    gameplay:
      'Children must match written words with their spoken counterparts. The game includes both visual and auditory memory challenges.',
    observation:
      'Difficulty holding words in memory or matching sounds to written words may indicate phonological memory deficits.',
    skills: ['Working Memory', 'Phonological Processing', 'Audio-Visual Integration'],
    ageRange: '7-13 years',
    cognitiveLoad: 'High',
  },
  {
    id: 'rapid-letter-naming',
    title: 'Rapid Letter Naming',
    description: 'Quickly identify letters as they flash on screen',
    icon: '🔤',
    heroIcon: BoltIcon,
    testArea: 'Processing speed, automaticity',
    scoring: 'Words per minute + errors',
    image: 'https://img.icons8.com/color/96/000000/alphabet.png',
    color: 'from-red-500 to-pink-600',
    difficulty: 'Medium',
    duration: '5-7 min',
    type: 'Processing speed game',
    goal: 'Measure rapid naming abilities',
    gameplay:
      'Letters appear rapidly on screen and children must name them as quickly as possible. The speed gradually increases to test automaticity.',
    observation:
      'Slow naming speed or frequent errors may indicate processing speed difficulties associated with dyslexia.',
    skills: ['Processing Speed', 'Letter Recognition', 'Automaticity'],
    ageRange: '6-12 years',
    cognitiveLoad: 'Medium',
  },
  {
    id: 'visual-tracking-maze',
    title: 'Visual Tracking Maze',
    description: 'Follow letter paths through visual mazes',
    icon: '🔍',
    heroIcon: MagnifyingGlassIcon,
    testArea: 'Visual tracking and scanning',
    scoring: 'Correct path vs distractions',
    image: 'https://img.icons8.com/color/96/000000/maze.png',
    color: 'from-blue-600 to-cyan-700',
    difficulty: 'Hard',
    duration: '7-10 min',
    type: 'Visual tracking game',
    goal: 'Assess visual scanning and tracking abilities',
    gameplay:
      'Children must follow a path of letters through a maze while avoiding distractors. The maze becomes more complex as the game progresses.',
    observation:
      'Difficulty following letter sequences or getting distracted by irrelevant visual information may indicate visual tracking challenges.',
    skills: ['Visual Tracking', 'Visual Scanning', 'Sustained Attention'],
    ageRange: '7-14 years',
    cognitiveLoad: 'High',
  },
  {
    id: 'rhyming-pairs',
    title: 'Rhyming Pairs',
    description: 'Identify if word pairs rhyme',
    icon: '📢',
    heroIcon: MicrophoneIcon,
    testArea: 'Phonological awareness',
    scoring: 'Rhyme recognition accuracy',
    image: 'https://img.icons8.com/color/96/000000/microphone.png',
    color: 'from-indigo-500 to-blue-600',
    difficulty: 'Easy',
    duration: '5-7 min',
    type: 'Phonological awareness game',
    goal: 'Evaluate rhyming abilities',
    gameplay:
      'Children listen to pairs of words and must determine if they rhyme. The game includes both obvious and subtle rhyming patterns.',
    observation:
      'Difficulty identifying rhyming patterns may indicate phonological awareness deficits common in dyslexia.',
    skills: ['Phonological Awareness', 'Rhyme Recognition', 'Auditory Processing'],
    ageRange: '5-9 years',
    cognitiveLoad: 'Low',
  },
  {
    id: 'mirror-letter-game',
    title: 'Mirror Letter Game',
    description: 'Select correctly oriented letters from pairs',
    icon: '⬅️➡️',
    heroIcon: CubeIcon,
    testArea: 'Directional confusion',
    scoring: 'Error rate with mirror letters',
    image: 'https://img.icons8.com/color/96/000000/mirror.png',
    color: 'from-orange-500 to-red-600',
    difficulty: 'Medium',
    duration: '6-8 min',
    type: 'Directional awareness game',
    goal: 'Detect letter orientation difficulties',
    gameplay:
      'Children are shown pairs of letters where one is correctly oriented and the other is mirrored. They must select the correct orientation.',
    observation:
      'Frequent selection of mirrored letters may indicate directional confusion or visual-spatial processing difficulties.',
    skills: ['Directional Awareness', 'Letter Orientation', 'Visual-Spatial Processing'],
    ageRange: '5-11 years',
    cognitiveLoad: 'Medium',
  },
  {
    id: 'syllable-clapper',
    title: 'Syllable Clapper',
    description: 'Count syllables in spoken words',
    icon: '📚',
    heroIcon: BookOpenIcon,
    testArea: 'Phonological segmentation',
    scoring: 'Accuracy in identifying syllables',
    image: 'https://img.icons8.com/color/96/000000/book.png',
    color: 'from-purple-600 to-pink-700',
    difficulty: 'Easy',
    duration: '5-7 min',
    type: 'Phonological segmentation game',
    goal: 'Assess syllable awareness',
    gameplay:
      'Children listen to spoken words and must clap or tap to count the number of syllables. Words range from simple to complex.',
    observation:
      'Difficulty breaking words into syllables may indicate phonological awareness challenges.',
    skills: ['Phonological Segmentation', 'Syllable Awareness', 'Rhythm Recognition'],
    ageRange: '5-10 years',
    cognitiveLoad: 'Low',
  },
  {
    id: 'word-completion',
    title: 'Word Completion',
    description: 'Complete words by choosing missing letters',
    icon: '🧩',
    heroIcon: DocumentTextIcon,
    testArea: 'Decoding and word prediction',
    scoring: 'Number of correct completions',
    image: 'https://img.icons8.com/color/96/000000/puzzle.png',
    color: 'from-emerald-500 to-green-600',
    difficulty: 'Medium',
    duration: '7-10 min',
    type: 'Word completion game',
    goal: 'Evaluate decoding and prediction skills',
    gameplay:
      'Children are presented with incomplete words and must choose the correct missing letters from multiple options to complete them.',
    observation:
      'Difficulty completing words or frequent incorrect letter choices may indicate decoding challenges.',
    skills: ['Decoding', 'Word Recognition', 'Letter-Sound Correspondence'],
    ageRange: '6-12 years',
    cognitiveLoad: 'Medium',
  },
];

const DyslexiaGames = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [childData, setChildData] = useState(null);
  const [gamePerformance, setGamePerformance] = useState({});
  const [isLoadingChild, setIsLoadingChild] = useState(true);
  const [activeTab, setActiveTab] = useState('games');
  const [forceUpdate, setForceUpdate] = useState(0);

  // Define fetchGamePerformanceData first
  const fetchGamePerformanceData = React.useCallback(async () => {
    try {
      // Import AssessmentService dynamically
      const { default: AssessmentService } = await import('../../../../services/AssessmentService');

      // Fetch from backend
      const backendData = await AssessmentService.getChildGamePerformance(childId);

      // Load from localStorage
      const storedPerformance = localStorage.getItem(`dyslexia_games_performance_${childId}`);
      const localData = storedPerformance ? JSON.parse(storedPerformance) : {};

      // Merge backend data with local data (backend data takes precedence)
      const mergedPerformance = {};

      // Add backend data
      if (backendData.data && backendData.data.gamePerformances) {
        Object.keys(backendData.data.gamePerformances).forEach(gameId => {
          const backendGame = backendData.data.gamePerformances[gameId];
          // Convert accuracy to percentage if it's a decimal (0-1 range)
          let accuracy = backendGame.averageAccuracy || 0;
          if (accuracy > 0 && accuracy <= 1) {
            accuracy = accuracy * 100; // Convert decimal to percentage
          }

          mergedPerformance[gameId] = {
            accuracy: Math.round(accuracy),
            bestScore: backendGame.bestScore || 0,
            playCount: backendGame.playCount || 0,
            lastPlayed: backendGame.lastPlayed,
            sessions: backendGame.sessions || [],
            averageScore: backendGame.averageScore || 0,
          };
        });
      }

      // Add local data for games not in backend
      Object.keys(localData).forEach(gameId => {
        if (!mergedPerformance[gameId]) {
          // Also handle accuracy conversion for local data
          let accuracy = localData[gameId].accuracy || 0;
          if (accuracy > 0 && accuracy <= 1) {
            accuracy = accuracy * 100;
          }
          mergedPerformance[gameId] = {
            ...localData[gameId],
            accuracy: Math.round(accuracy),
          };
        }
      });

      setGamePerformance(mergedPerformance);
    } catch (error) {
      // Fallback to localStorage only
      const storedPerformance = localStorage.getItem(`dyslexia_games_performance_${childId}`);
      if (storedPerformance) {
        const localData = JSON.parse(storedPerformance);
        // Handle accuracy conversion for fallback data too
        Object.keys(localData).forEach(gameId => {
          let accuracy = localData[gameId].accuracy || 0;
          if (accuracy > 0 && accuracy <= 1) {
            accuracy = accuracy * 100;
          }
          localData[gameId].accuracy = Math.round(accuracy);
        });
        setGamePerformance(localData);
      }
    }
  }, [childId]);

  // Validate child ID and fetch child data on component mount
  React.useEffect(() => {
    if (!childId) {
      toast.error('Child information is required to start the assessment');
      navigate('/assessment');
      return;
    }

    // Fetch child data
    const fetchChildData = async () => {
      try {
        setIsLoadingChild(true);

        // Import ChildProfileService dynamically
        const { default: ChildProfileService } = await import(
          '../../../../services/ChildProfileService'
        );

        try {
          // Try to fetch from API first
          const childProfile = await ChildProfileService.getChild(childId);
          if (childProfile) {
            // Calculate age from dateOfBirth if available
            let age = 8; // default age
            if (childProfile.dateOfBirth) {
              const birthDate = new Date(childProfile.dateOfBirth);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            setChildData({
              _id: childProfile.id || childProfile._id,
              firstName: childProfile.firstName || 'Child',
              lastName: childProfile.lastName || 'User',
              age: age,
              avatar: childProfile.avatar || null,
            });
          } else {
            throw new Error('Child not found');
          }
        } catch (apiError) {
          // Fallback to localStorage if API fails
          const storedChildData = localStorage.getItem(`child_${childId}`);
          if (storedChildData) {
            setChildData(JSON.parse(storedChildData));
          } else {
            // Final fallback
            setChildData({
              _id: childId,
              firstName: 'Child',
              lastName: 'User',
              age: 8,
              avatar: null,
            });
          }
        }

        // Fetch game performance data
        await fetchGamePerformanceData();
      } catch (error) {
        toast.error('Error loading child information');
      } finally {
        setIsLoadingChild(false);
      }
    };

    fetchChildData();
  }, [childId, navigate, fetchGamePerformanceData]);

  // Listen for game completion events to refresh performance data
  React.useEffect(() => {
    const handleGameCompleted = event => {
      // Refresh game performance data if the completed game is for the current child
      if (event.detail.childId === childId) {
        const gameTitle = event.detail.gameId?.replace(/-/g, ' ').toUpperCase() || 'GAME';

        // Show success notification
        toast.success(`🎉 ${gameTitle} completed successfully!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: 'white',
            border: '2px solid #059669',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          },
        });

        // Add a small delay to ensure backend has processed the data
        setTimeout(() => {
          fetchGamePerformanceData();
          // Force a re-render
          setForceUpdate(prev => prev + 1);
        }, 1000);
      }
    };

    window.addEventListener('gameCompleted', handleGameCompleted);

    return () => {
      window.removeEventListener('gameCompleted', handleGameCompleted);
    };
  }, [childId, fetchGamePerformanceData]);

  // Listen for localStorage changes
  React.useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === `dyslexia_games_performance_${childId}`) {
        fetchGamePerformanceData();
        setForceUpdate(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [childId, fetchGamePerformanceData]);

  // Listen for localStorage changes to update performance data in real-time
  React.useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === `dyslexia_games_performance_${childId}`) {
        // Small delay to ensure the data is fully written
        setTimeout(() => {
          fetchGamePerformanceData();
          setForceUpdate(prev => prev + 1);
        }, 100);
      }
    };

    const handleFocus = () => {
      fetchGamePerformanceData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [childId, fetchGamePerformanceData]);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || game.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, difficultyFilter]);

  const handleGameSelect = gameId => {
    // Enhanced validation - check if gameId is actually a child avatar value
    const avatarIds = ['girl1', 'girl2', 'boy1', 'boy2', 'girl3', 'boy3'];
    if (avatarIds.includes(gameId)) {
      console.warn('Avatar ID detected as game ID:', gameId);
      toast.error('Invalid game selection. Please select a valid game.');
      return;
    }

    // Validate against actual game IDs
    const validGameIds = games.map(g => g.id);
    if (!validGameIds.includes(gameId)) {
      toast.error('Invalid game selected. Please choose a valid game.');
      return;
    }

    setSelectedGame(gameId);
    setShowInstructions(true);
  };

  const startGame = gameId => {
    if (!childId) {
      toast.error('Child information is required to start the game');
      return;
    }

    // Validate gameId - ensure it's a valid game ID, not an avatar name
    const validGameIds = games.map(g => g.id);
    if (!validGameIds.includes(gameId)) {
      toast.error('Invalid game selected. Please choose a valid game.');
      return;
    }

    navigate(`/assessment/games/dyslexia/${gameId}?childId=${childId}`);
  };

  // Calculate total performance score
  const calculateTotalScore = useMemo(() => {
    // Use the gamePerformance state which includes backend data
    const scores = Object.values(gamePerformance).map(game => game.accuracy || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [gamePerformance]);

  // Show loader while loading child data
  if (isLoadingChild) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <LogoLoader
          size="large"
          message="Loading Dyslexia Assessment Games..."
          showMessage={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Decorative dots */}
        <div className="absolute top-[30%] left-[15%] w-3 h-3 bg-primary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full animate-pulse-light"></div>
        <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-secondary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full animate-pulse-light"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 relative z-10">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/assessment')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 shadow-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Assessment Selection
          </button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center mb-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full pl-1 pr-4 py-1 border border-secondary/20 shadow-lg">
            <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
              <SparklesIcon className="h-3 w-3" />
            </span>
            <span className="text-primary dark:text-primary-300 text-sm font-medium">
              Interactive Learning Games
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-text dark:text-white leading-tight">
            Dyslexia Assessment{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
              Games
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Interactive games designed to assess and improve reading skills through engaging
            activities
          </p>
        </div>

        {/* Child Information and Performance Header */}
        {!isLoadingChild && childData && (
          <div className="mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Child Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {childData.avatar ? (
                      <img
                        src={childData.avatar}
                        alt={childData.firstName ? childData.firstName.split(' ')[0] : 'Child'}
                        className="w-16 h-16 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-primary/20">
                        {childData.firstName ? childData.firstName[0].toUpperCase() : 'C'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {childData.firstName ? childData.firstName.split(' ')[0] : 'Child'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Age: {childData.age} years • Dyslexia Assessment Games
                    </p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{calculateTotalScore}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">
                      {Object.keys(gamePerformance).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent">
                      {(() => {
                        const totalPlayCount = Object.values(gamePerformance).reduce(
                          (sum, game) => sum + (game.playCount || 0),
                          0
                        );
                        return totalPlayCount;
                      })()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="glass-nav flex flex-col sm:flex-row gap-2 items-center justify-between p-2">
            {/* Search Bar */}
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="glass-input block w-full pl-10 pr-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                placeholder="Search games..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Difficulty Filter */}
            <div className="flex gap-1">
              {['all', 'Easy', 'Medium', 'Hard'].map(level => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`glass-filter px-4 py-2.5 text-sm font-medium ${
                    difficultyFilter === level ? 'active' : ''
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center justify-center">
            <div className="glass-tabs">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('games')}
                  className={`glass-tab px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'games' ? 'active' : ''
                  }`}
                >
                  <PlayIcon className="w-4 h-4" />
                  Assessment Games
                </button>
                <button
                  onClick={() => setActiveTab('progressive-suite')}
                  className={`glass-tab px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'progressive-suite' ? 'active' : ''
                  }`}
                >
                  <BookOpenIcon className="w-4 h-4" />
                  Progressive Suite (45 min)
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`glass-tab px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                    activeTab === 'history' ? 'active' : ''
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4" />
                  Game History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {activeTab === 'games' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredGames
              .map(game => {
                // Fallback to localStorage if gamePerformance doesn't have data
                const localStorageData = JSON.parse(
                  localStorage.getItem(`dyslexia_games_performance_${childId}`) || '{}'
                );
                const fallbackData = localStorageData[game.id] || {};

                const gameData = {
                  ...game,
                  performance: gamePerformance[game.id] || fallbackData || null,
                  // Try multiple possible score fields
                  score:
                    gamePerformance[game.id]?.score ||
                    gamePerformance[game.id]?.bestScore ||
                    fallbackData.score ||
                    fallbackData.bestScore ||
                    (fallbackData.sessions && fallbackData.sessions.length > 0
                      ? Math.max(...fallbackData.sessions.map(s => s.score || 0))
                      : 0) ||
                    0,
                  // Try multiple possible accuracy fields
                  averageAccuracy:
                    gamePerformance[game.id]?.accuracy ||
                    gamePerformance[game.id]?.averageAccuracy ||
                    fallbackData.accuracy ||
                    fallbackData.averageAccuracy ||
                    (fallbackData.sessions && fallbackData.sessions.length > 0
                      ? Math.round(
                          fallbackData.sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) /
                            fallbackData.sessions.length
                        )
                      : 0) ||
                    0,
                  playCount: gamePerformance[game.id]?.playCount || fallbackData.playCount || 0,
                  lastPlayed:
                    gamePerformance[game.id]?.lastPlayed || fallbackData.lastPlayed || null,
                };

                return gameData;
              })
              .map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative h-full transform hover:scale-105 transition-all duration-500">
                    {/* Enhanced card glow effect */}
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${game.color} rounded-3xl blur-lg opacity-0 group-hover:opacity-80 transition-all duration-700 animate-gradient bg-300%`}
                    ></div>

                    <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl overflow-hidden h-full min-h-[380px] shadow-xl group-hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 flex flex-col">
                      {/* Enhanced Card Header with gradient */}
                      <div className={`h-3 bg-gradient-to-r ${game.color} relative flex-shrink-0`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        {/* Enhanced Game Icon and Title Section */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`relative w-12 h-12 bg-gradient-to-r ${game.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}
                            >
                              <game.heroIcon className="w-6 h-6" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                              {game.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
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
                              <span className="flex items-center glass-text-secondary text-xs">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {game.duration}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Compact Description */}
                        <p className="glass-text-secondary mb-3 text-sm line-clamp-2">
                          {game.description}
                        </p>

                        {/* Performance Data - Compact */}
                        {game.performance && Object.keys(game.performance).length > 0 && (
                          <div className="mb-3 p-3 glass-card glass-gradient-green">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold glass-text-primary">
                                  {game.score || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ChartBarIcon className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold glass-text-primary">
                                  {Math.round(game.averageAccuracy)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FireIcon className="w-4 h-4 text-orange-500" />
                                <span className="glass-text-secondary">{game.playCount}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Assessment Focus - Compact */}
                        <div className="mb-4 p-3 glass-card glass-gradient-blue">
                          <div className="flex items-start gap-2">
                            <FlagIcon className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-medium glass-text-primary">
                                {game.testArea}
                              </span>
                              <p className="text-xs glass-text-secondary mt-1 line-clamp-1">
                                {game.scoring}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Play Button - Fixed to bottom */}
                        <div className="mt-auto">
                          <button
                            onClick={() => handleGameSelect(game.id)}
                            className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${game.color} text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary/20 shadow-lg hover:shadow-xl hover:scale-105 transform`}
                          >
                            <PlayIcon className="w-4 h-4" />
                            <span>{game.performance ? 'Play Again' : 'Start Game'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {/* No Results Message */}
        {activeTab === 'games' && filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No games found matching your search criteria.
            </p>
          </div>
        )}

        {/* Progressive Suite Tab */}
        {activeTab === 'progressive-suite' && (
          <div className="max-w-4xl mx-auto">
            {/* Suite Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8 shadow-2xl"
            >
              <div className="flex items-center mb-6">
                <div className="text-6xl mr-4">📚</div>
                <div>
                  <h2 className="text-4xl font-bold mb-2">Dyslexia Progressive Suite</h2>
                  <p className="text-xl opacity-90">
                    Complete 9 games in progressive difficulty over 85 minutes
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">9</div>
                  <div className="text-sm opacity-75">Games</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">85</div>
                  <div className="text-sm opacity-75">Minutes</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">Progressive</div>
                  <div className="text-sm opacity-75">Difficulty</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  navigate(
                    `/assessment/games/dyslexia/progressive-suite?childId=${childId}&type=dyslexia`
                  )
                }
                className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center mx-auto"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Start Progressive Suite
              </motion.button>
            </motion.div>

            {/* Game Sequence Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Reading & Language Assessment Sequence
              </h3>
              <div className="space-y-4">
                {[
                  {
                    level: 1,
                    title: 'Letter Sound Matching',
                    difficulty: 'Easy',
                    duration: 8,
                    description: 'Letter-sound correspondence',
                    color: 'from-blue-500 to-indigo-600',
                    icon: '🎯',
                  },
                  {
                    level: 2,
                    title: 'Rhyming Pairs',
                    difficulty: 'Easy',
                    duration: 8,
                    description: 'Phonological awareness',
                    color: 'from-indigo-500 to-blue-600',
                    icon: '📢',
                  },
                  {
                    level: 3,
                    title: 'Word Sequence Builder',
                    difficulty: 'Medium',
                    duration: 10,
                    description: 'Letter sequencing abilities',
                    color: 'from-purple-500 to-pink-600',
                    icon: '🔁',
                  },
                  {
                    level: 4,
                    title: 'Spot Correct Word',
                    difficulty: 'Medium',
                    duration: 9,
                    description: 'Visual discrimination',
                    color: 'from-green-500 to-emerald-600',
                    icon: '👁️‍🗨️',
                  },
                  {
                    level: 5,
                    title: 'Memory Match',
                    difficulty: 'Medium',
                    duration: 10,
                    description: 'Working memory and phonological processing',
                    color: 'from-yellow-500 to-orange-600',
                    icon: '🧠',
                  },
                  {
                    level: 6,
                    title: 'Rapid Letter Naming',
                    difficulty: 'Medium',
                    duration: 9,
                    description: 'Rapid automatic naming and processing speed',
                    color: 'from-indigo-500 to-blue-600',
                    icon: '⚡',
                  },
                  {
                    level: 7,
                    title: 'Visual Tracking Maze',
                    difficulty: 'Hard',
                    duration: 10,
                    description: 'Visual tracking and eye movement',
                    color: 'from-purple-500 to-pink-600',
                    icon: '👁️',
                  },
                  {
                    level: 8,
                    title: 'Word Completion',
                    difficulty: 'Hard',
                    duration: 10,
                    description: 'Word recognition and completion',
                    color: 'from-orange-500 to-red-600',
                    icon: '📝',
                  },
                  {
                    level: 9,
                    title: 'Syllable Clapper',
                    difficulty: 'Hard',
                    duration: 11,
                    description: 'Syllable awareness and rhythm',
                    color: 'from-red-500 to-pink-600',
                    icon: '👏',
                  },
                ].map((game, index) => (
                  <div
                    key={game.level}
                    className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0 mr-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                      >
                        {game.level}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mr-2">
                          {game.title}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            game.difficulty === 'Easy'
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : game.difficulty === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}
                        >
                          {game.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {game.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {game.duration} min
                      </div>
                    </div>
                    <div className="text-2xl opacity-50">{game.icon}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-3 gap-6 mt-8"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Comprehensive Assessment
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get a complete picture of reading, language, and phonological processing skills
                  </p>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center">
                  <div className="text-4xl mb-4">📖</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Reading Skills Focus
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Targeted assessment of phonological awareness, decoding, and fluency
                  </p>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Detailed Insights
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Receive comprehensive reports with literacy intervention recommendations
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Game History Section */}
        {activeTab === 'history' && childData && (
          <GameHistorySection childId={childId} childData={childData} assessmentType="dyslexia" />
        )}

        {/* Enhanced Game Instructions Modal */}
        {showInstructions && selectedGame && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl p-8 max-w-5xl w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[80vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${games.find(g => g.id === selectedGame)?.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                  >
                    {React.createElement(games.find(g => g.id === selectedGame)?.heroIcon, {
                      className: 'w-8 h-8',
                    })}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
                      {games.find(g => g.id === selectedGame)?.title}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      {games.find(g => g.id === selectedGame)?.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Game Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  {/* Game Type */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                    <h4 className="flex items-center font-semibold text-blue-900 dark:text-blue-100 mb-2 text-lg">
                      {React.createElement(games.find(g => g.id === selectedGame)?.heroIcon, {
                        className: 'w-5 h-5 mr-2',
                      })}
                      Game Type
                    </h4>
                    <p className="text-blue-700 dark:text-blue-200 text-sm">
                      {games.find(g => g.id === selectedGame)?.type}
                    </p>
                  </div>

                  {/* Goal */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200/30 dark:border-green-700/30">
                    <h4 className="flex items-center font-semibold text-green-900 dark:text-green-100 mb-2 text-lg">
                      <FlagIcon className="w-5 h-5 mr-2" />
                      Goal
                    </h4>
                    <p className="text-green-700 dark:text-green-200 text-sm">
                      {games.find(g => g.id === selectedGame)?.goal}
                    </p>
                  </div>

                  {/* Gameplay */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-200/30 dark:border-purple-700/30">
                    <h4 className="flex items-center font-semibold text-purple-900 dark:text-purple-100 mb-2 text-lg">
                      <PlayIcon className="w-5 h-5 mr-2" />
                      How to Play
                    </h4>
                    <p className="text-purple-700 dark:text-purple-200 text-sm leading-relaxed">
                      {games.find(g => g.id === selectedGame)?.gameplay}
                    </p>
                  </div>

                  {/* What We Observe */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-4 border border-orange-200/30 dark:border-orange-700/30">
                    <h4 className="flex items-center font-semibold text-orange-900 dark:text-orange-100 mb-2 text-lg">
                      <EyeIcon className="w-5 h-5 mr-2" />
                      What We Observe
                    </h4>
                    <p className="text-orange-700 dark:text-orange-200 text-sm leading-relaxed">
                      {games.find(g => g.id === selectedGame)?.observation}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Game Stats */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                    <h4 className="flex items-center font-semibold text-gray-900 dark:text-gray-100 mb-4 text-lg">
                      <ChartBarIcon className="w-5 h-5 mr-2" />
                      Game Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {games.find(g => g.id === selectedGame)?.difficulty}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Difficulty</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {games.find(g => g.id === selectedGame)?.duration}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {games.find(g => g.id === selectedGame)?.ageRange}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Age Range</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {games.find(g => g.id === selectedGame)?.cognitiveLoad}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Cognitive Load
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-indigo-200/30 dark:border-indigo-700/30">
                    <h4 className="flex items-center font-semibold text-indigo-900 dark:text-indigo-100 mb-3 text-lg">
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Skills Assessed
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {games
                        .find(g => g.id === selectedGame)
                        ?.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border border-teal-200/30 dark:border-teal-700/30">
                    <h4 className="flex items-center font-semibold text-teal-900 dark:text-teal-100 mb-3 text-lg">
                      <AcademicCapIcon className="w-5 h-5 mr-2" />
                      Success Tips
                    </h4>
                    <ul className="space-y-2 text-teal-700 dark:text-teal-200 text-sm">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Take your time to understand each task
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Focus on accuracy rather than speed
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Don't worry about mistakes - they help us understand your needs
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Try to stay calm and focused throughout the game
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary/20 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startGame(selectedGame)}
                  className={`px-8 py-3 rounded-2xl bg-gradient-to-r ${
                    games.find(g => g.id === selectedGame)?.color
                  } text-white font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary/20 hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transform relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full hover:translate-x-0 transition-transform duration-1000"></div>
                  <span className="relative z-10">Start Game</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DyslexiaGames;
