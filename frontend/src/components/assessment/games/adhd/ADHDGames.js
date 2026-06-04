import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlayIcon,
  StarIcon,
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
  CommandLineIcon,
  ShieldCheckIcon,
  FireIcon,
  ChartBarIcon,
  AcademicCapIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import GameHistorySection from '../../games/GameHistorySection';
import LogoLoader from '../../../ui/LogoLoader';

const games = [
  {
    id: 'focus-finder',
    title: 'Focus Finder',
    description: 'Find specific objects in a cluttered scene within time limits',
    icon: '🔍',
    heroIcon: MagnifyingGlassIcon,
    testArea: 'Sustained attention, visual focus',
    scoring: 'Objects found + time taken',
    image: 'https://img.icons8.com/color/96/000000/search.png',
    color: 'from-blue-500 to-indigo-600',
    difficulty: 'Easy',
    duration: '5-7 min',
    type: 'Visual attention game',
    goal: 'Assess sustained attention',
    gameplay:
      'Children are shown a cluttered scene (like a busy park) and must find specific objects (e.g., 10 hidden stars) within a time limit.',
    observation:
      'Difficulty staying focused, missing obvious targets, or frequently shifting attention may indicate inattention.',
    skills: ['Visual Processing', 'Sustained Attention', 'Object Recognition'],
    ageRange: '6-12 years',
    cognitiveLoad: 'Low',
  },
  {
    id: 'impulse-freeze',
    title: 'Impulse Freeze',
    description: 'Stop and go game testing self-control and response inhibition',
    icon: '🛑',
    heroIcon: ShieldCheckIcon,
    testArea: 'Response inhibition, self-control',
    scoring: 'Correct responses + reaction time',
    image: 'https://img.icons8.com/color/96/000000/traffic-light.png',
    color: 'from-red-500 to-pink-600',
    difficulty: 'Medium',
    duration: '6-8 min',
    type: 'Response inhibition game',
    goal: 'Test self-control',
    gameplay:
      'Similar to "Red Light, Green Light," but with added rules. Children must stop moving when the "blue light" shows up and move only during the "green light."',
    observation: 'Children who repeatedly move on the wrong light may struggle with impulsivity.',
    skills: ['Self-Control', 'Response Inhibition', 'Rule Following'],
    ageRange: '5-11 years',
    cognitiveLoad: 'Medium',
  },
  {
    id: 'memory-trail',
    title: 'Memory Trail',
    description: 'Recall and repeat sequences of shapes in correct order',
    icon: '🧠',
    heroIcon: CpuChipIcon,
    testArea: 'Working memory, short-term memory',
    scoring: 'Correct sequences + pattern length',
    image: 'https://img.icons8.com/color/96/000000/brain.png',
    color: 'from-purple-500 to-pink-600',
    difficulty: 'Hard',
    duration: '7-10 min',
    type: 'Working memory game',
    goal: 'Evaluate short-term and working memory',
    gameplay:
      'A pattern of shapes appears for a few seconds. The child must recall and repeat the sequence in the correct order.',
    observation:
      'Frequent mistakes or frustration might indicate executive function challenges related to ADHD.',
    skills: ['Working Memory', 'Pattern Recognition', 'Sequence Processing'],
    ageRange: '7-13 years',
    cognitiveLoad: 'High',
  },
  {
    id: 'hyper-hop',
    title: 'Hyper Hop',
    description: 'Control character to jump on colored tiles in specific order',
    icon: '🦘',
    heroIcon: BoltIcon,
    testArea: 'Motor control, movement regulation',
    scoring: 'Correct jumps + timing accuracy',
    image: 'https://img.icons8.com/color/96/000000/jumping.png',
    color: 'from-green-500 to-emerald-600',
    difficulty: 'Easy',
    duration: '6-9 min',
    type: 'Motor control game',
    goal: 'Detect hyperactivity and movement regulation',
    gameplay:
      'The child controls a character that must jump only on colored tiles in a certain order, requiring timing and patience.',
    observation:
      'Excessive or random jumping, difficulty following the pattern, or skipping instructions may indicate hyperactivity or impulsivity.',
    skills: ['Motor Control', 'Timing', 'Pattern Following'],
    ageRange: '5-10 years',
    cognitiveLoad: 'Medium',
  },
  {
    id: 'task-twister-enhanced',
    title: 'Task Twister',
    description: 'Multi-modal interaction training with tap, hold, and double-tap',
    icon: '🎯',
    heroIcon: CommandLineIcon,
    testArea: 'Multi-modal interactions, executive function',
    scoring: 'Correct interactions + task switching',
    image: 'https://img.icons8.com/color/96/000000/task.png',
    color: 'from-purple-500 to-pink-600',
    difficulty: 'Hard',
    duration: '8-12 min',
    type: 'Multi-modal interaction game',
    goal: 'Assess executive function and task switching',
    gameplay:
      'Watch patterns and use different interactions: tap, hold, or double-tap. Each interaction type gives different points.',
    observation:
      'Difficulty with different interaction types or poor task switching may indicate executive function challenges.',
    skills: ['Task Switching', 'Multi-modal Coordination', 'Executive Function'],
    ageRange: '8-14 years',
    cognitiveLoad: 'High',
  },
  {
    id: 'sound-shift',
    title: 'Sound Shift',
    description: 'Tap when hearing target sounds while ignoring distractions',
    icon: '🎵',
    heroIcon: SpeakerWaveIcon,
    testArea: 'Auditory attention, distraction filtering',
    scoring: 'Correct responses + false alarms',
    image: 'https://img.icons8.com/color/96/000000/sound.png',
    color: 'from-indigo-500 to-blue-600',
    difficulty: 'Medium',
    duration: '7-10 min',
    type: 'Auditory attention game',
    goal: 'Assess focus and distraction handling',
    gameplay:
      'Children must tap only when they hear a certain sound in a stream of background noise and ignore distractions (e.g., funny voices, music).',
    observation:
      'Trouble filtering distractions or inconsistent reactions to target sounds can signal inattention.',
    skills: ['Auditory Processing', 'Selective Attention', 'Distraction Filtering'],
    ageRange: '6-12 years',
    cognitiveLoad: 'High',
  },
  {
    id: 'time-turtle',
    title: 'Time Turtle',
    description: 'Complete tasks within countdown timers',
    icon: '⏰',
    heroIcon: ClockIcon,
    testArea: 'Time management, executive function',
    scoring: 'Tasks completed + time efficiency',
    image: 'https://img.icons8.com/color/96/000000/timer.png',
    color: 'from-orange-500 to-red-600',
    difficulty: 'Hard',
    duration: '6-9 min',
    type: 'Time management game',
    goal: 'Understand the concept of time and urgency',
    gameplay:
      'The child must complete small tasks (like sorting objects) within a countdown timer.',
    observation:
      'Poor pacing, giving up midway, or rushing recklessly may reflect executive function delays.',
    skills: ['Time Management', 'Task Completion', 'Executive Planning'],
    ageRange: '7-13 years',
    cognitiveLoad: 'Medium',
  },
];

const ADHDGames = () => {
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

        // Load game performance data from backend and merge with localStorage
        await fetchGamePerformanceData();
      } catch (error) {
        toast.error('Error loading child information');
      } finally {
        setIsLoadingChild(false);
      }
    };

    fetchChildData();
  }, [childId, navigate]);

  // Fetch game performance data from backend
  const fetchGamePerformanceData = async () => {
    try {
      // Import AssessmentService dynamically
      const { default: AssessmentService } = await import('../../../../services/AssessmentService');

      // Fetch from backend
      const backendData = await AssessmentService.getChildGamePerformance(childId);
      console.log('🎮 Backend game performance data:', backendData);
      console.log('🎮 Backend data structure:', {
        success: backendData.success,
        hasData: !!backendData.data,
        gamePerformances: backendData.data?.gamePerformances,
        soundShiftData: backendData.data?.gamePerformances?.['sound-shift'],
      });

      // Load from localStorage
      const storedPerformance = localStorage.getItem(`adhd_games_performance_${childId}`);
      const localData = storedPerformance ? JSON.parse(storedPerformance) : {};

      // Merge backend data with local data (backend data takes precedence)
      const mergedPerformance = {};

      // Add backend data
      if (backendData.data && backendData.data.gamePerformances) {
        console.log(
          '🎮 Processing backend game performances:',
          Object.keys(backendData.data.gamePerformances)
        );
        Object.keys(backendData.data.gamePerformances).forEach(gameId => {
          const backendGame = backendData.data.gamePerformances[gameId];
          console.log(`🎮 Processing game ${gameId}:`, backendGame);

          // Special debugging for sound-shift
          if (gameId === 'sound-shift') {
            console.log(`🎮 Sound-shift specific data:`, {
              backendGame,
              averageAccuracy: backendGame.averageAccuracy,
              playCount: backendGame.playCount,
              sessions: backendGame.sessions,
              bestScore: backendGame.bestScore,
            });
          }

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

          console.log(`🎮 Merged performance for ${gameId}:`, mergedPerformance[gameId]);
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

      console.log('🎮 Merged game performance data:', mergedPerformance);
      setGamePerformance(mergedPerformance);
    } catch (error) {
      console.error('Error fetching game performance data:', error);
      // Fallback to localStorage only
      const storedPerformance = localStorage.getItem(`adhd_games_performance_${childId}`);
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
  };

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
      console.warn('Invalid game ID:', gameId, 'Valid IDs:', validGameIds);
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
    const validGameIds = games.map(g => g.id);
    if (!validGameIds.includes(gameId)) {
      toast.error('Invalid game selected. Please choose a valid game.');
      return;
    }
    navigate(`/assessment/games/adhd/${gameId}?childId=${childId}`);
  };

  // Function to update game performance
  const updateGamePerformance = (gameId, performance) => {
    const updatedPerformance = {
      ...gamePerformance,
      [gameId]: {
        ...gamePerformance[gameId],
        ...performance,
        lastPlayed: new Date().toISOString(),
        playCount: (gamePerformance[gameId]?.playCount || 0) + 1,
      },
    };

    setGamePerformance(updatedPerformance);
    localStorage.setItem(`adhd_games_performance_${childId}`, JSON.stringify(updatedPerformance));
  };

  // Calculate total performance score
  const calculateTotalScore = () => {
    const scores = Object.values(gamePerformance).map(game => game.accuracy || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  // Get games with performance data
  const gamesWithPerformance = games.map(game => ({
    ...game,
    performance: gamePerformance[game.id] || null,
    bestScore: gamePerformance[game.id]?.bestScore || 0,
    averageAccuracy: gamePerformance[game.id]?.accuracy || 0,
    playCount: gamePerformance[game.id]?.playCount || 0,
    lastPlayed: gamePerformance[game.id]?.lastPlayed || null,
  }));

  // Show loader while loading child data
  if (isLoadingChild) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <LogoLoader size="large" message="Loading ADHD Assessment Games..." showMessage={true} />
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
        <div className="mb-8">
          <button
            onClick={() => navigate('/assessment')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 shadow-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Assessment Selection
          </button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center mb-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full pl-1 pr-4 py-1 border border-secondary/20 shadow-lg">
            <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
              <SparklesIcon className="h-3 w-3" />
            </span>
            <span className="text-primary dark:text-primary-300 text-sm font-medium">
              Interactive Learning Games
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-text dark:text-white leading-tight">
            ADHD Assessment{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
              Games
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Interactive games designed to assess attention, focus, and executive function skills
            through engaging activities
          </p>
        </div>

        {/* Child Information and Performance Header */}
        {!isLoadingChild && childData && (
          <div className="mb-12">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
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
                      Age: {childData.age || '8'} years • ADHD Assessment Games
                    </p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{calculateTotalScore()}%</div>
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
                      {Object.values(gamePerformance).reduce(
                        (total, game) => total + (game.playCount || 0),
                        0
                      )}
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
        <div className="max-w-7xl mx-auto mb-8">
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
                  <TrophyIcon className="w-4 h-4" />
                  Progressive Suite
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
              .map(game => ({
                ...game,
                performance: gamePerformance[game.id] || null,
                bestScore: gamePerformance[game.id]?.bestScore || 0,
                averageAccuracy: gamePerformance[game.id]?.accuracy || 0,
                playCount: gamePerformance[game.id]?.playCount || 0,
                lastPlayed: gamePerformance[game.id]?.lastPlayed || null,
              }))
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

                    <div className="relative glass-card overflow-hidden h-full min-h-[380px] flex flex-col">
                      {/* Enhanced Card Header with gradient */}
                      <div className={`h-3 bg-gradient-to-r ${game.color} relative flex-shrink-0`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        {/* Enhanced Game Icon and Title Section */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`glass-icon w-12 h-12 bg-gradient-to-r ${game.color} flex items-center justify-center text-white`}
                            >
                              <game.heroIcon className="w-6 h-6" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold glass-text-primary mb-1 line-clamp-1">
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
                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm line-clamp-2">
                          {game.description}
                        </p>

                        {/* Performance Data - Compact */}
                        {game.performance && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg border border-green-200/50 dark:border-green-700/30">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {game.bestScore}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ChartBarIcon className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {Math.round(game.averageAccuracy)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FireIcon className="w-4 h-4 text-orange-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {game.playCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Assessment Focus - Compact */}
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FlagIcon className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {game.testArea}
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-2xl"
            >
              <div className="flex items-center mb-6">
                <div className="text-6xl mr-4">🧠</div>
                <div>
                  <h2 className="text-4xl font-bold mb-2">ADHD Progressive Suite</h2>
                  <p className="text-xl opacity-90">
                    Complete 7 games in progressive difficulty over 65 minutes
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">7</div>
                  <div className="text-sm opacity-75">Games</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4">
                  <div className="text-3xl font-bold">65</div>
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
                  navigate(`/assessment/games/adhd/progressive-suite?childId=${childId}&type=adhd`)
                }
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center mx-auto"
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
                Assessment Sequence
              </h3>
              <div className="space-y-4">
                {[
                  {
                    level: 1,
                    title: 'Focus Finder',
                    difficulty: 'Easy',
                    duration: 8,
                    description: 'Visual attention and focus training',
                    color: 'from-blue-500 to-indigo-600',
                    icon: '🔍',
                  },
                  {
                    level: 2,
                    title: 'Impulse Freeze',
                    difficulty: 'Easy',
                    duration: 8,
                    description: 'Self-control and response inhibition',
                    color: 'from-red-500 to-pink-600',
                    icon: '🛑',
                  },
                  {
                    level: 3,
                    title: 'Memory Trail',
                    difficulty: 'Medium',
                    duration: 10,
                    description: 'Working memory enhancement',
                    color: 'from-purple-500 to-pink-600',
                    icon: '🧠',
                  },
                  {
                    level: 4,
                    title: 'Hyper Hop',
                    difficulty: 'Medium',
                    duration: 9,
                    description: 'Motor control and movement regulation',
                    color: 'from-green-500 to-emerald-600',
                    icon: '🦘',
                  },
                  {
                    level: 5,
                    title: 'Sound Shift',
                    difficulty: 'Medium',
                    duration: 9,
                    description: 'Auditory attention and distraction filtering',
                    color: 'from-indigo-500 to-blue-600',
                    icon: '🎵',
                  },
                  {
                    level: 6,
                    title: 'Time Turtle',
                    difficulty: 'Hard',
                    duration: 10,
                    description: 'Time management and planning',
                    color: 'from-yellow-500 to-orange-600',
                    icon: '⏰',
                  },
                  {
                    level: 7,
                    title: 'Task Twister',
                    difficulty: 'Hard',
                    duration: 11,
                    description: 'Multi-step instruction following',
                    color: 'from-purple-500 to-pink-600',
                    icon: '🔄',
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
                    Get a complete picture of ADHD-related cognitive functions through progressive
                    difficulty
                  </p>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Adaptive Difficulty
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Games adapt to your child's performance, ensuring optimal challenge and
                    engagement
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
                    Receive comprehensive reports with actionable recommendations for your child
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Game History Section */}
        {activeTab === 'history' && childData && (
          <GameHistorySection childId={childId} childData={childData} assessmentType="adhd" />
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

export default ADHDGames;
