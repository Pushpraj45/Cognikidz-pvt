import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ArticleService from '../../services/ArticleService';
import Button from '../ui/Button';
import BookmarkButton from '../ui/BookmarkButton';
import { motion } from 'framer-motion';
import { FADE_UP } from '../../utils/animations';
import { createSafeMarkup, stripHtmlTags, containsHTML } from '../../utils/htmlUtils';
import { formatArticleDate, formatCommentDate } from '../../utils/dateUtils';
import LogoLoader from '../ui/LogoLoader';
import PDFDownloadButton from '../ui/PDFDownloadButton';

const ArticleDetail = () => {
  const { articleId } = useParams();
  const { currentUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Constants
  const MAX_COMMENT_LENGTH = 1250;

  // Article state
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Related articles state
  const [related, setRelated] = useState([]);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef(null);

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
        setShareDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch article details
  useEffect(() => {
    const fetchArticleDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await ArticleService.getArticleById(articleId);
        setArticle(data);
        setComments(data.comments || []);

        // Debug: Log comment structure
        if (data.comments && data.comments.length > 0) {
          console.log('Comment structure:', data.comments[0]);
          console.log(
            'Comment ID fields:',
            data.comments.map(c => ({ id: c.id, _id: c._id, content: c.content.substring(0, 50) }))
          );
        }

        // If user has already rated, set their rating
        if (data.user_rating) {
          setUserRating(data.user_rating);
        }

        console.log('🔍 Article loaded:', {
          title: data.title,
          userRating: data.user_rating,
          averageRating: data.average_rating,
          ratingsCount: data.ratings_count,
          isLoggedIn,
        });
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load the article. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticleDetails();
    }
  }, [articleId, isLoggedIn]);

  // Fetch related articles
  useEffect(() => {
    const fetchRelated = async () => {
      if (article?.category) {
        try {
          const response = await ArticleService.getArticles({
            category: article.category,
            limit: 3,
          });
          // Filter out current article if it's in the results
          const relatedArticles = response.items?.filter(item => item._id !== article._id) || [];
          setRelated(relatedArticles.slice(0, 3));
        } catch (err) {
          console.error('Failed to fetch related articles:', err);
        }
      }
    };

    if (article) {
      fetchRelated();
    }
  }, [article]);

  // Handle rating submission
  const handleRatingSubmit = async rating => {
    console.log('🌟 Rating submission attempted:', {
      rating,
      isLoggedIn,
      currentUser,
      articleId,
    });

    if (!isLoggedIn) {
      console.log('❌ User not logged in, redirecting to login');
      navigate('/login', { state: { from: `/blog/${articleId}` } });
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);

    try {
      console.log('📤 Sending rating to backend...');
      const response = await ArticleService.rateArticle(articleId, { score: rating });
      console.log('✅ Rating response:', response);

      setUserRating(rating);

      // Update the article with new average rating
      setArticle(prev => ({
        ...prev,
        average_rating: response.average_rating,
        ratings_count: response.ratings_count,
      }));

      console.log('🎉 Rating successfully updated!');
    } catch (err) {
      console.error('❌ Error submitting rating:', err);
      setRatingError(`Failed to submit your rating: ${err.message || 'Please try again.'}`);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async e => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/blog/${articleId}` } });
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    if (newComment.length > MAX_COMMENT_LENGTH) {
      setCommentError(`Comment exceeds the maximum length of ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await ArticleService.addComment(articleId, { content: newComment });

      // Add new comment to comments list
      setComments(prevComments => [response, ...prevComments]);
      setNewComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      setCommentError('Failed to submit your comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Show delete confirmation
  const showDeleteConfirm = commentId => {
    setDeleteConfirmId(commentId);
  };

  // Confirm comment deletion
  const confirmDeleteComment = async commentId => {
    try {
      console.log('Attempting to delete comment:', commentId);
      console.log(
        'Comment object being deleted:',
        comments.find(c => c.id === commentId || c._id === commentId)
      );

      const response = await ArticleService.deleteComment(commentId);
      console.log('Delete response:', response);

      // Remove the comment from the local state (check both id and _id)
      setComments(prevComments =>
        prevComments.filter(comment => comment.id !== commentId && comment._id !== commentId)
      );
      setDeleteConfirmId(null);

      // Show success message
      alert('Comment deleted successfully!');
    } catch (err) {
      console.error('Error deleting comment:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      alert(`Failed to delete the comment: ${err.message || 'Please try again.'}`);
    }
  };

  // Cancel delete confirmation
  const cancelDeleteConfirm = () => {
    setDeleteConfirmId(null);
  };

  // Handle comment editing
  const handleEditComment = comment => {
    // Only allow editing if user is the comment author
    if (currentUser.id !== comment.user?.id && currentUser.id !== comment.user?._id) {
      return;
    }

    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setIsEditing(true);
  };

  // Handle comment update
  const handleUpdateComment = async commentId => {
    if (!editingContent.trim()) {
      return;
    }

    if (editingContent.length > MAX_COMMENT_LENGTH) {
      setCommentError(`Comment exceeds the maximum length of ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    // Find the comment to verify ownership
    const comment = comments.find(c => c.id === commentId);
    if (!comment || (currentUser.id !== comment.user?.id && currentUser.id !== comment.user?._id)) {
      setCommentError('You are not authorized to edit this comment.');
      return;
    }

    try {
      const response = await ArticleService.updateComment(commentId, { content: editingContent });

      // Update the comment in the comments list
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId ? { ...comment, content: editingContent } : comment
        )
      );

      // Reset editing state
      setEditingCommentId(null);
      setEditingContent('');
      setIsEditing(false);
      setCommentError(null);
    } catch (err) {
      console.error('Error updating comment:', err);
      setCommentError('Failed to update your comment. Please try again.');
    }
  };

  // Cancel comment editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
    setIsEditing(false);
    setCommentError(null);
  };

  // Handle article deletion
  const handleDeleteArticle = async () => {
    if (
      !window.confirm('Are you sure you want to delete this article? This action cannot be undone.')
    ) {
      return;
    }

    try {
      await ArticleService.deleteArticle(articleId);
      navigate('/blog', { state: { message: 'Article deleted successfully' } });
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Failed to delete the article. Please try again.');
    }
  };

  // Share functionality
  const shareUrl = `${window.location.origin}/blog/${articleId}`;
  const shareText = `Check out this article: ${article?.title || 'CogniKidz Article'}`;

  const handleShare = async platform => {
    setShareDropdownOpen(false);

    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
          break;
        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          window.open(twitterUrl, '_blank');
          break;
        case 'facebook':
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          window.open(facebookUrl, '_blank');
          break;
        case 'linkedin':
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
          window.open(linkedinUrl, '_blank');
          break;
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
          window.open(whatsappUrl, '_blank');
          break;
        case 'email':
          const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`I thought you might find this article interesting:\n\n${shareText}\n\n${shareUrl}`)}`;
          window.location.href = emailUrl;
          break;
        default:
          // Native share API fallback
          if (navigator.share) {
            await navigator.share({
              title: article?.title || 'CogniKidz Article',
              text: shareText,
              url: shareUrl,
            });
          } else {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
          }
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to copy link
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (copyErr) {
        alert('Unable to share. Please copy the URL manually.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <LogoLoader size="large" message="Loading article..." showMessage={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Article</h2>
          <p>{error}</p>
          <Link to="/blog" className="mt-4 inline-block text-primary hover:underline">
            &larr; Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog" className="mt-4 inline-block text-primary hover:underline">
            &larr; Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={FADE_UP}
      className="container mx-auto px-4 pt-24 pb-16"
    >
      {/* Article Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/blog"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-all text-blue-700 dark:text-blue-200 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>

          <div className="flex items-center gap-3">
            {/* Bookmark Button */}
            <BookmarkButton
              resourceId={articleId}
              resourceType="article"
              resourceTitle={article?.title}
              resourceUrl={`/blog/${articleId}`}
              showText={true}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-md hover:shadow-md transition-all duration-300 text-sm font-medium shadow-sm hover:scale-105 active:scale-95 px-3 py-1.5"
            />

            {/* Share Button */}
            <div className="relative" ref={shareDropdownRef}>
              <button
                onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md hover:shadow-md transition-all duration-300 text-sm font-medium shadow-sm hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </button>

              {/* Share Dropdown */}
              {shareDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.488z" />
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Email
                    </button>
                  </div>
                </div>
              )}
            </div>

            <PDFDownloadButton
              type="article"
              itemId={article._id}
              itemName={article.title}
              variant="primary"
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-transparent shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            >
              Export Article
            </PDFDownloadButton>
          </div>
        </div>

        {/* Banner Image */}
        <div className="relative mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
          <img
            src={`${
              article.bannerUrl ||
              'https://placehold.co/1200x600/e6f2ff/1a75ff?text=CogniKidz+Article'
            }?v=${Date.now()}`}
            alt={article.title}
            className="w-full h-48 md:h-56 lg:h-64 object-cover object-center"
            style={{ maxHeight: '256px' }}
            onError={e => {
              e.target.src = 'https://placehold.co/1200x600/e6f2ff/1a75ff?text=CogniKidz+Article';
            }}
          />

          {article.featured && (
            <span className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </span>
          )}
        </div>

        {/* Category and Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {article.category}
          </span>
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            {formatArticleDate(article)}
          </span>
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            By {article.author?.name || 'CogniKidz Team'}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {article.title}
        </h1>

        {/* Article Actions */}
        {isLoggedIn && (currentUser.id === article.author?.id || currentUser.role === 'admin') && (
          <div className="flex gap-3 mb-6">
            <Button variant="outline" onClick={() => navigate(`/blog/edit/${articleId}`)}>
              Edit Article
            </Button>
            <Button variant="danger" onClick={handleDeleteArticle}>
              Delete Article
            </Button>
          </div>
        )}

        {/* Rating Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 flex items-center flex-wrap gap-2">
          <div className="flex items-center mr-4">
            <span className="text-gray-700 dark:text-gray-300 mr-2">Average Rating:</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(article.average_rating || 0)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                ({article.average_rating?.toFixed(1) || '0'}/5 from {article.ratings_count || 0}{' '}
                {article.ratings_count === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-gray-700 dark:text-gray-300 mr-2">Rate this article:</span>
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      disabled={submittingRating}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => handleRatingSubmit(star)}
                      className={`w-7 h-7 transition-all duration-200 ${
                        submittingRating
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:scale-110'
                      }`}
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <svg
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoveredRating || userRating)
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                    You rated: {userRating} star{userRating > 1 ? 's' : ''}
                  </span>
                )}
                {submittingRating && (
                  <span className="text-sm text-blue-600 ml-2">Submitting...</span>
                )}
              </div>
            ) : (
              <Link
                to={`/login?redirect=/blog/${articleId}`}
                className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-600 transition-colors"
              >
                Login to Rate
              </Link>
            )}
          </div>

          {ratingError && <div className="w-full mt-2 text-danger text-sm">{ratingError}</div>}
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg dark:prose-invert prose-primary max-w-none mb-12">
          {/* Render the article content safely */}
          <div dangerouslySetInnerHTML={createSafeMarkup(article.content)} />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/blog?tag=${tag}`}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Leave a Comment
            </h4>

            {!isLoggedIn ? (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You need to be logged in to leave a comment.
                </p>
                <Link
                  to={`/login?redirect=/blog/${articleId}`}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                >
                  Log In to Comment
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit}>
                {commentError && (
                  <div className="bg-danger/10 border border-danger/30 text-danger rounded-md p-3 mb-4">
                    {commentError}
                  </div>
                )}

                <div className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this article..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 text-gray-900 dark:text-white ${
                      newComment.length > MAX_COMMENT_LENGTH
                        ? 'border-red-500 focus:ring-red-500'
                        : newComment.length > MAX_COMMENT_LENGTH - 100
                          ? 'border-orange-500 focus:ring-orange-500'
                          : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={4}
                    required
                    maxLength={MAX_COMMENT_LENGTH}
                  />

                  {/* Character Counter and Limit Message */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      {newComment.length > MAX_COMMENT_LENGTH && (
                        <span className="text-red-500 text-sm font-medium">
                          Exceeding word limit
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span
                        className={
                          newComment.length > MAX_COMMENT_LENGTH
                            ? 'text-red-500 font-medium'
                            : newComment.length > MAX_COMMENT_LENGTH - 100
                              ? 'text-orange-500 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                        }
                      >
                        {newComment.length}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">
                        {' '}
                        / {MAX_COMMENT_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          newComment.length > MAX_COMMENT_LENGTH
                            ? 'bg-red-500'
                            : newComment.length > MAX_COMMENT_LENGTH - 100
                              ? 'bg-orange-500'
                              : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min((newComment.length / MAX_COMMENT_LENGTH) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={submittingComment}
                  disabled={
                    submittingComment ||
                    !newComment.trim() ||
                    newComment.length > MAX_COMMENT_LENGTH
                  }
                  variant="gradient"
                  size="lg"
                  className="mt-2"
                >
                  <span className="flex items-center gap-2">
                    Post Comment
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M12 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Button>
              </form>
            )}
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map(comment => {
                // Debug logging to understand comment structure
                console.log('Comment debug:', {
                  commentId: comment.id,
                  commentUserId: comment.user?.id,
                  commentUser_id: comment.user?._id,
                  currentUserId: currentUser?.id,
                  isLoggedIn,
                  canEdit:
                    isLoggedIn &&
                    (currentUser?.id === comment.user?.id || currentUser?.id === comment.user?._id),
                });

                return (
                  <div
                    key={comment.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {comment.user?.name || 'Anonymous'}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCommentDate(comment)}
                        </p>
                      </div>

                      {/* Comment Actions */}
                      {isLoggedIn &&
                        (currentUser.id === comment.user?._id ||
                          currentUser.id === comment.user?.id) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="text-primary hover:text-primary-700 text-sm"
                              title="Edit Comment"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => showDeleteConfirm(comment._id || comment.id)}
                              className="text-danger hover:text-danger-700 text-sm"
                              title="Delete Comment"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}

                      {/* Admin Delete Action */}
                      {isLoggedIn &&
                        (currentUser.role === 'admin' || currentUser.isAdmin) &&
                        currentUser.id !== comment.user?._id &&
                        currentUser.id !== comment.user?.id && (
                          <button
                            onClick={() => showDeleteConfirm(comment._id || comment.id)}
                            className="text-danger hover:text-danger-700 text-sm"
                            title="Delete Comment (Admin)"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                    </div>

                    {/* Delete Confirmation Dialog */}
                    {deleteConfirmId === (comment._id || comment.id) && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <svg
                            className="w-5 h-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            {(currentUser.role === 'admin' || currentUser.isAdmin) &&
                            currentUser.id !== comment.user?.id &&
                            currentUser.id !== comment.user?._id
                              ? 'Are you sure you want to delete this comment as an admin?'
                              : 'Are you sure you want to delete your comment?'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => confirmDeleteComment(comment._id || comment.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={cancelDeleteConfirm}
                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            No, Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {isEditing && editingCommentId === comment.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 text-gray-900 dark:text-white ${
                            editingContent.length > MAX_COMMENT_LENGTH
                              ? 'border-red-500 focus:ring-red-500'
                              : editingContent.length > MAX_COMMENT_LENGTH - 100
                                ? 'border-orange-500 focus:ring-orange-500'
                                : 'border-gray-300 dark:border-gray-600'
                          }`}
                          rows={4}
                          maxLength={MAX_COMMENT_LENGTH}
                        />

                        {/* Character Counter for Edit Mode */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {editingContent.length > MAX_COMMENT_LENGTH && (
                              <span className="text-red-500 text-sm font-medium">
                                Exceeding word limit
                              </span>
                            )}
                          </div>
                          <div className="text-sm">
                            <span
                              className={
                                editingContent.length > MAX_COMMENT_LENGTH
                                  ? 'text-red-500 font-medium'
                                  : editingContent.length > MAX_COMMENT_LENGTH - 100
                                    ? 'text-orange-500 font-medium'
                                    : 'text-gray-500 dark:text-gray-400'
                              }
                            >
                              {editingContent.length}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">
                              {' '}
                              / {MAX_COMMENT_LENGTH}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Edit Mode */}
                        <div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                editingContent.length > MAX_COMMENT_LENGTH
                                  ? 'bg-red-500'
                                  : editingContent.length > MAX_COMMENT_LENGTH - 100
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${Math.min((editingContent.length / MAX_COMMENT_LENGTH) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleUpdateComment(comment.id)}
                            isLoading={submittingComment}
                            disabled={
                              submittingComment ||
                              !editingContent.trim() ||
                              editingContent.length > MAX_COMMENT_LENGTH
                            }
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to comment on this article!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Articles */}
      {related.length > 0 && (
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Related Articles
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map(relatedArticle => (
                <article
                  key={relatedArticle._id}
                  className="group cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={() => navigate(`/blog/${relatedArticle._id}`)}
                >
                  {relatedArticle.image && (
                    <img
                      src={`${relatedArticle.image}?v=${Date.now()}`}
                      alt={relatedArticle.title}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {relatedArticle.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    by{' '}
                    {relatedArticle.author?.firstName && relatedArticle.author?.lastName
                      ? `${relatedArticle.author.firstName} ${relatedArticle.author.lastName}`
                      : relatedArticle.author?.name || 'Anonymous'}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ArticleDetail;
