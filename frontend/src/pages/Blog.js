import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/ui/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import BlogWrite from '../components/blog/BlogWrite';
import ArticleService from '../services/ArticleService';
import { containsHTML, stripHtmlTags } from '../utils/htmlUtils';
import LogoLoader from '../components/ui/LogoLoader';
import BookmarkButton from '../components/ui/BookmarkButton';
import {
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  AcademicCapIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import TranslatedText from '../components/ui/TranslatedText';
import { formatArticleDate } from '../utils/dateUtils';

// Community tab data and helpers
const COMMUNITY_FILTERS = [
  'For you',
  'Featured',
  'ADHD',
  'Autism',
  'Dyslexia',
  'Development',
  'Early Intervention',
];
const COMMUNITY_CATEGORY_COLORS = {
  ADHD: 'bg-blue-100 text-blue-800',
  Autism: 'bg-purple-100 text-purple-800',
  Dyslexia: 'bg-green-100 text-green-800',
  'Early Intervention': 'bg-pink-100 text-pink-800',
  Development: 'bg-yellow-100 text-yellow-800',
};

const Blog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States for blog functionality
  const [activeTab, setActiveTab] = useState('blog');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // API states
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Additional state for like functionality
  const [isLiking, setIsLiking] = useState(false);

  // Authentication check function (similar to BlogDetail)
  const checkAuthentication = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const userFromStorage = JSON.parse(localStorage.getItem('user') || 'null');

    console.log('🔍 Auth Check:', {
      token: !!token,
      tokenValid: token && token.length > 0,
      user: !!user,
      userFromStorage: !!userFromStorage,
    });

    // Check for token existence first
    if (!token || token.length === 0) {
      console.log('❌ No valid token found');
      return false;
    }

    // Check if we have user data
    if (!user && !userFromStorage) {
      console.log('❌ No user data found');
      return false;
    }

    // If we have a token and user data, consider authenticated
    if (token && (user || userFromStorage)) {
      console.log('✅ Authentication check passed');
      return true;
    }

    return false;
  };

  // Fetch articles from API
  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await ArticleService.getArticles({
        page: 1,
        limit: 50,
      });
      console.log('Articles fetched:', response.items);
      setStories(response.items || []);

      // Initialize like states based on userLikeStatus from API
      const initialLikeStates = {};
      (response.items || []).forEach(article => {
        if (article.userLikeStatus !== null) {
          initialLikeStates[article._id] = {
            liked: article.userLikeStatus === true,
            disliked: article.userLikeStatus === false,
          };
        }
      });
      setLikeStates(initialLikeStates);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'blog') {
      fetchStories();
    }
  }, [activeTab]);

  // Success callback for when an article is created
  const handleArticleSuccess = async newArticle => {
    // Refresh the articles list to show the new article
    await fetchStories();
    // Go back to feed view
    setView('feed');
  };

  // Handle like/dislike functionality (matching BlogDetail implementation)
  const handleLike = async (articleId, isLike) => {
    // Don't proceed if already processing a like action
    if (isLiking) return;

    console.log('🔄 Starting like/dislike process...');

    // Enhanced authentication check
    const isAuthenticated = checkAuthentication();

    if (!isAuthenticated) {
      console.log('❌ Authentication failed, showing login prompt');
      alert('Please log in to like articles');
      const shouldRedirect = window.confirm('Would you like to log in now?');
      if (shouldRedirect) {
        window.location.href = '/login';
      }
      return;
    }

    try {
      setIsLiking(true);

      console.log(`${isLike ? 'Liking' : 'Disliking'} article ${articleId}`);

      // Get current state for this article
      const currentState = likeStates[articleId] || { liked: false, disliked: false };

      // Call the API and get response
      const response = await ArticleService.toggleLikeArticle(articleId, isLike);

      console.log('Backend response:', response);

      // Handle the response from backend
      if (response.isLiked === null) {
        // Like/dislike was removed
        setLikeStates(prev => ({
          ...prev,
          [articleId]: {
            liked: isLike ? false : prev[articleId]?.liked || false,
            disliked: !isLike ? false : prev[articleId]?.disliked || false,
          },
        }));

        setStories(prev =>
          prev.map(story => {
            if (story._id === articleId) {
              return {
                ...story,
                likes: isLike ? Math.max(0, (story.likes || 0) - 1) : story.likes || 0,
                dislikes: !isLike ? Math.max(0, (story.dislikes || 0) - 1) : story.dislikes || 0,
              };
            }
            return story;
          })
        );

        console.log(`${isLike ? 'Like' : 'Dislike'} removed`);
      } else {
        // Like/dislike was added or changed
        const wasOppositeAction = isLike ? currentState.disliked : currentState.liked;

        setLikeStates(prev => ({
          ...prev,
          [articleId]: {
            liked: isLike,
            disliked: !isLike,
          },
        }));

        setStories(prev =>
          prev.map(story => {
            if (story._id === articleId) {
              return {
                ...story,
                likes: isLike
                  ? wasOppositeAction
                    ? (story.likes || 0) + 1
                    : (story.likes || 0) + 1
                  : wasOppositeAction
                    ? Math.max(0, (story.likes || 0) - 1)
                    : story.likes || 0,
                dislikes: !isLike
                  ? wasOppositeAction
                    ? (story.dislikes || 0) + 1
                    : (story.dislikes || 0) + 1
                  : wasOppositeAction
                    ? Math.max(0, (story.dislikes || 0) - 1)
                    : story.dislikes || 0,
              };
            }
            return story;
          })
        );

        console.log(`Article ${isLike ? 'liked' : 'disliked'}!`);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);

      // More detailed error handling (matching BlogDetail)
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;

      console.log('❌ Like toggle error details:', {
        status,
        message,
        response: err.response?.data,
        hasToken: !!localStorage.getItem('access_token'),
      });

      // Handle specific error cases
      if (status === 401) {
        console.log('🔑 Received 401 - Authentication issue');
        alert('Your session has expired. Please log in again.');

        // Clear potentially bad tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');

        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else if (status === 403) {
        alert('You do not have permission to perform this action.');
      } else if (status === 404) {
        alert('Article not found.');
      } else {
        alert(`Failed to update like status: ${message}`);
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Community filter state
  const [communityFilter, setCommunityFilter] = useState('For you');
  const [view, setView] = useState('feed'); // 'feed' | 'detail' | 'write'
  const [selectedTag, setSelectedTag] = useState(null);
  const [likeStates, setLikeStates] = useState({}); // { [storyId]: { liked: bool, disliked: bool } }

  if (view === 'write')
    return (
      <BlogWrite key="blog-write" onBack={() => setView('feed')} onSuccess={handleArticleSuccess} />
    );

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Decorative background gradients and dots for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        <div className="absolute top-[30%] left-[15%] w-3 h-3 bg-primary rounded-full"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full"></div>
        <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-secondary rounded-full"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full"></div>
      </div>
      <main className="flex-1 pt-24 pb-12 max-w-6xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Visually hidden heading for screen readers */}
        <h1 className="sr-only">CogniKidz Community Stories</h1>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
              <BeakerIcon className="h-4 w-4" />
            </span>
            <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
              <TranslatedText>Research & Community</TranslatedText>
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-text dark:text-white leading-tight">
            <TranslatedText>CogniKidz</TranslatedText>{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
              <TranslatedText>Blog & Community</TranslatedText>
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto px-4 sm:px-0">
            <TranslatedText>
              Insights, research, support strategies, and real stories for parents of neurodiverse
              children
            </TranslatedText>
          </p>
        </motion.div>
        <main role="main" className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <section className="flex-1 min-w-0" aria-label="Community Stories">
            {/* Search Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, category..."
                  aria-label="Search stories"
                  className="w-full px-4 py-2 rounded-full glassmorphism-card border border-white/20 dark:border-gray-700/30 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-900/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/60 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary dark:text-primary-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
              </div>
            </div>
            {/* Tag filter bar (if a tag is selected) */}
            {selectedTag && (
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary text-white font-semibold text-sm">
                  Tag: {selectedTag}
                </span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-primary underline text-sm"
                >
                  Clear
                </button>
              </div>
            )}
            {/* Secondary Filter Bar */}
            <div className="px-2 py-1 flex flex-wrap gap-2 md:gap-4 overflow-x-auto pb-2 border-b border-white/20 dark:border-gray-700/30 mb-8">
              {COMMUNITY_FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setCommunityFilter(filter)}
                  aria-label={`Show stories for ${filter}`}
                  className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 backdrop-blur-md border border-white/20 dark:border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary-400/60 ${
                    communityFilter === filter
                      ? 'bg-white/80 dark:bg-gray-900/80 text-primary shadow-md'
                      : 'bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
                  }`}
                >
                  {filter}
                </button>
              ))}
              <Button
                className="ml-auto flex-shrink-0"
                variant="gradient"
                size="lg"
                aria-label="Write a new community story"
                onClick={() => setView('write')}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <TranslatedText>Write Something</TranslatedText>
                </span>
              </Button>
            </div>
            {/* Stories List */}
            {loading ? (
              <div className="text-center py-8">
                <LogoLoader size="large" message="Loading stories..." showMessage={true} />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">No stories found</p>
                <Button variant="primary" onClick={() => setView('write')}>
                  Write the first story
                </Button>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-y-8 gap-x-6"
                aria-live="polite"
              >
                {stories
                  .filter(story => {
                    // Filter by category
                    const matchesCategory =
                      communityFilter === 'For you' ||
                      (communityFilter === 'Featured' && story.featured) ||
                      (communityFilter !== 'For you' &&
                        communityFilter !== 'Featured' &&
                        story.category === communityFilter);
                    // Filter by tag
                    const matchesTag =
                      !selectedTag || (story.tags && story.tags.includes(selectedTag));
                    // Filter by search query (title, category, tags)
                    const q = searchQuery.trim().toLowerCase();
                    const matchesSearch =
                      !q ||
                      story.title.toLowerCase().includes(q) ||
                      story.category.toLowerCase().includes(q) ||
                      (story.tags && story.tags.some(tag => tag.toLowerCase().includes(q)));
                    return matchesCategory && matchesTag && matchesSearch;
                  })
                  .map(story => (
                    <motion.div
                      key={story._id}
                      tabIndex={0}
                      onClick={() => {
                        navigate(`/blog/${story._id}`);
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/400/60 outline-none"
                      aria-label={`Story by ${story.author?.firstName && story.author?.lastName ? `${story.author.firstName} ${story.author.lastName}` : 'Anonymous'}: ${story.title}`}
                    >
                      {/* Enhanced top decoration */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 animate-gradient bg-300%"></div>

                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex-shrink-0">
                              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-primary shadow-lg group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-primary/20">
                                {story.author?.firstName && story.author?.lastName
                                  ? `${story.author.firstName[0]}${story.author.lastName[0]}`
                                  : 'A'}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white truncate max-w-xs md:max-w-none">
                                {story.author?.firstName && story.author?.lastName
                                  ? `${story.author.firstName} ${story.author.lastName}`
                                  : 'Anonymous'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {new Date(story.timestamp || story.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 md:line-clamp-1">
                            {story.title}
                          </h3>
                          {/* Safely render HTML content or show plain text excerpt */}
                          <div className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-4 md:line-clamp-3 leading-relaxed">
                            {containsHTML(story.content || story.body || story.excerpt)
                              ? stripHtmlTags(story.content || story.body || story.excerpt, 300)
                              : story.content || story.body || story.excerpt}
                          </div>
                          <div className="flex items-center gap-3 mt-auto flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${COMMUNITY_CATEGORY_COLORS[story.category] || 'bg-gray-100 text-gray-700'}`}
                            >
                              {story.category}
                            </span>
                            {/* Tags */}
                            {story.tags &&
                              story.tags.map(tag => (
                                <button
                                  key={tag}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedTag(tag);
                                  }}
                                  className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-gray-800/60 text-primary dark:text-white border border-white/20 dark:border-gray-700/30 text-xs font-medium ml-1 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/60"
                                  aria-label={`Filter by tag ${tag}`}
                                >
                                  #{tag}
                                </button>
                              ))}
                            {/* Like/Dislike Buttons */}
                            <div className="flex items-center gap-2 ml-2">
                              {/* Bookmark Button */}
                              <BookmarkButton
                                resourceId={story._id}
                                resourceType="article"
                                resourceTitle={story.title}
                                resourceUrl={`/blog/${story._id}`}
                                className="text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300"
                              />
                              <button
                                className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 relative ${
                                  likeStates[story._id]?.liked || story.userLiked
                                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={
                                  likeStates[story._id]?.liked || story.userLiked
                                    ? 'Unlike'
                                    : 'Like'
                                }
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isLiking) {
                                    handleLike(story._id, true);
                                  }
                                }}
                                onMouseDown={e => e.stopPropagation()}
                                disabled={isLiking}
                                tabIndex={0}
                              >
                                {/* Heart icon for like */}
                                <svg
                                  className={`w-4 h-4 transition-colors ${isLiking ? '' : 'group-hover:scale-110'}`}
                                  fill={
                                    likeStates[story._id]?.liked || story.userLiked
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                                {story.likes || 0}
                                {isLiking && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-spin border border-white border-t-transparent"></div>
                                  </div>
                                )}
                              </button>

                              <button
                                className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 relative ${
                                  likeStates[story._id]?.disliked || story.userDisliked
                                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={
                                  likeStates[story._id]?.disliked || story.userDisliked
                                    ? 'Remove dislike'
                                    : 'Dislike'
                                }
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isLiking) {
                                    handleLike(story._id, false);
                                  }
                                }}
                                onMouseDown={e => e.stopPropagation()}
                                disabled={isLiking}
                                tabIndex={0}
                              >
                                {/* Thumbs down icon for dislike */}
                                <svg
                                  className={`w-4 h-4 transition-colors ${isLiking ? '' : 'group-hover:scale-110'}`}
                                  fill={
                                    likeStates[story._id]?.disliked || story.userDisliked
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
                                  />
                                </svg>
                                {story.dislikes || 0}
                                {isLiking && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-spin border border-white border-t-transparent"></div>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="md:w-56 w-full h-48 md:h-auto flex-shrink-0">
                          <img
                            src={
                              story.image ||
                              story.bannerUrl ||
                              'https://placehold.co/600x400/e6f2ff/1a75ff?text=CogniKidz+Article'
                            }
                            alt={`Story visual for ${story.title}`}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </section>

          {/* Sidebar - Write on Blog */}
          <aside className="w-full md:w-80 flex-shrink-0 mb-8 md:mb-0">
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20 rounded-2xl shadow-xl p-8 backdrop-blur-lg border border-primary/20 dark:border-primary/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/20 dark:bg-primary/30 rounded-full p-3 text-primary dark:text-primary-300">
                  <AcademicCapIcon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-text dark:text-white">
                  <TranslatedText>Write on CogniKidz Blog</TranslatedText>
                </h3>
              </div>
              <ul className="mb-8 space-y-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <li className="flex items-start gap-3">
                  <div className="bg-primary/20 rounded-full p-1 mt-1 flex-shrink-0">
                    <SparklesIcon className="h-3 w-3 text-primary" />
                  </div>
                  <span>
                    <TranslatedText>Express Yourself</TranslatedText>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-secondary/20 rounded-full p-1 mt-1 flex-shrink-0">
                    <SparklesIcon className="h-3 w-3 text-secondary" />
                  </div>
                  <span>
                    <TranslatedText>Help with advice</TranslatedText>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-accent/20 rounded-full p-1 mt-1 flex-shrink-0">
                    <SparklesIcon className="h-3 w-3 text-accent" />
                  </div>
                  <span>
                    <TranslatedText>Share your thoughts</TranslatedText>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-primary/20 rounded-full p-1 mt-1 flex-shrink-0">
                    <SparklesIcon className="h-3 w-3 text-primary" />
                  </div>
                  <span>
                    <TranslatedText>Tell about your experience</TranslatedText>
                  </span>
                </li>
              </ul>
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                aria-label="Start writing on CogniKidz Blog"
                onClick={() => setView('write')}
              >
                <TranslatedText>Start Writing</TranslatedText>
              </Button>
            </div>
          </aside>
        </main>
      </main>
    </div>
  );
};

export default Blog;
