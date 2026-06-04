import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import BookmarkService from '../services/BookmarkService';
import LogoLoader from '../components/ui/LogoLoader';
import { BookmarkIcon, MagnifyingGlassIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import TranslatedText from '../components/ui/TranslatedText';
import { formatDate } from '../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';

// Add CSS to remove focus borders
const focusStyles = `
  .no-focus-border:focus {
    outline: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }
  .no-focus-border:focus-visible {
    outline: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }
`;

const SavedArticles = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchBookmarks();
    }
  }, [currentUser]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await BookmarkService.getBookmarks({
        limit: 100, // Get more bookmarks
      });

      // Fix: Access bookmarks directly from response, not response.data
      setBookmarks(response.bookmarks || []);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async bookmarkId => {
    try {
      await BookmarkService.deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(bookmark => bookmark._id !== bookmarkId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch =
      bookmark.resourceDetails?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.resourceDetails?.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !categoryFilter ||
      (bookmark.resourceDetails?.category &&
        bookmark.resourceDetails.category.toLowerCase() === categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return 0;
    }
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
              <TranslatedText>Please log in to access your saved articles</TranslatedText>
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              <TranslatedText>Your bookmarked articles will appear here</TranslatedText>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <style>{focusStyles}</style>
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
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center mb-6 bg-gradient-to-r from-accent-100 to-yellow-100 dark:from-accent-900/30 dark:to-yellow-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
            <span className="bg-gradient-to-r from-accent-500 to-yellow-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
              <BookmarkIcon className="h-4 w-4" />
            </span>
            <span className="text-accent-700 dark:text-accent-300 text-sm font-semibold tracking-wide">
              <TranslatedText>Your Collection</TranslatedText>
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-text dark:text-white leading-tight">
            <TranslatedText>Your</TranslatedText>{' '}
            <span className="bg-gradient-to-r from-accent-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent animate-gradient bg-300%">
              <TranslatedText>Saved Articles</TranslatedText>
            </span>
          </h2>
        </motion.div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search saved articles..."
              aria-label="Search saved articles"
              className="w-full px-4 py-2 rounded-full glassmorphism-card border border-white/20 dark:border-gray-700/30 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-900/60 backdrop-blur-md pr-10 no-focus-border"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent dark:text-accent-300">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-2 py-1 flex flex-wrap gap-2 md:gap-4 overflow-x-auto pb-2 border-b border-white/20 dark:border-gray-700/30 mb-8">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-full font-medium transition-colors duration-200 backdrop-blur-md border border-white/20 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 no-focus-border"
          >
            <option value="">All Categories</option>
            <option value="ADHD">ADHD</option>
            <option value="Dyslexia">Dyslexia</option>
            <option value="Autism">Autism</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-full font-medium transition-colors duration-200 backdrop-blur-md border border-white/20 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 no-focus-border"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8">
            <LogoLoader size="large" message="Loading saved articles..." showMessage={true} />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        ) : sortedBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <TranslatedText>No saved articles yet</TranslatedText>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <TranslatedText>Start bookmarking articles to see them here</TranslatedText>
            </p>
            <button
              onClick={() => navigate('/blog')}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 focus:ring-2 focus:ring-accent/60"
            >
              <TranslatedText>Browse Articles</TranslatedText>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBookmarks.map(bookmark => (
              <Link
                key={bookmark._id}
                to={`/blog/${typeof bookmark.resource === 'object' ? bookmark.resource._id || bookmark.resource.id : bookmark.resource}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow block focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ textDecoration: 'none' }}
              >
                <div className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🔖</span>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        {bookmark.resourceDetails?.category || 'Article'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(bookmark.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {bookmark.resourceDetails?.title || 'Unknown Article'}
                    </h3>
                    {bookmark.resourceDetails?.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {bookmark.resourceDetails.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Saved {formatDate(bookmark.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 justify-between">
                    <span className="text-accent-600 dark:text-accent-300 font-medium text-sm">
                      View more
                    </span>
                    <button
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveBookmark(bookmark._id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Remove Bookmark"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedArticles;
