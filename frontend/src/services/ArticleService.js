import api from './api';

// Helper function to redirect to login if needed
const redirectToLogin = () => {
  // Check if we're not already on the login page to avoid redirect loops
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  }
};

// ArticleService leverages the standardized API configuration from api.js
const ArticleService = {
  // Get all articles with optional pagination and filters
  async getArticles(params = {}) {
    try {
      console.log('Fetching articles with params:', params);
      const response = await api.get('/api/articles', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  // Get a specific article by ID
  async getArticleById(id) {
    try {
      // Handle various ID formats: object, string, or nested object
      let resolvedId = id;
      if (typeof id === 'object') {
        resolvedId = id._id || id.id || id.articleId || id.resource;
        // If it's still an object, try to get the _id from it
        if (typeof resolvedId === 'object') {
          resolvedId = resolvedId._id || resolvedId.id;
        }
      }

      if (!resolvedId) {
        throw new Error('Invalid article ID provided');
      }

      console.log(`Fetching article with ID: ${resolvedId}`);
      const response = await api.get(`/api/articles/${resolvedId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching article with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new article
  async createArticle(articleData) {
    try {
      console.log('Creating new article with data:', articleData);

      // Handle file uploads if needed
      if (articleData.image && articleData.image instanceof File) {
        const formData = new FormData();

        // Add all properties to formData
        Object.keys(articleData).forEach(key => {
          if (key === 'image') {
            formData.append('image', articleData.image);
          } else if (key === 'tags' && Array.isArray(articleData[key])) {
            // Convert tags array to comma-separated string
            formData.append(key, articleData[key].join(','));
          } else {
            formData.append(key, articleData[key]);
          }
        });

        const response = await api.post('/api/articles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('Article created successfully with image:', response.data);
        return response.data;
      } else {
        // Regular JSON request - handle tags array
        const processedData = {
          ...articleData,
          tags: Array.isArray(articleData.tags) ? articleData.tags.join(',') : articleData.tags,
        };

        const response = await api.post('/api/articles', processedData);
        console.log('Article created successfully:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating article:', error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to create article',
        friendlyMessage: error.response?.data?.message || 'Failed to create article',
      };
    }
  },

  // Update an existing article
  async updateArticle(id, articleData) {
    try {
      console.log(`Updating article with ID ${id}:`, articleData);

      // Handle file uploads if needed
      if (articleData.image && articleData.image instanceof File) {
        const formData = new FormData();

        // Add all properties to formData
        Object.keys(articleData).forEach(key => {
          if (key === 'image') {
            formData.append('image', articleData.image);
          } else {
            formData.append(key, articleData[key]);
          }
        });

        const response = await api.put(`/api/articles/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('Article updated successfully with image:', response.data);
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.put(`/api/articles/${id}`, articleData);
        console.log('Article updated successfully:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error(`Error updating article with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to update article',
        friendlyMessage: error.response?.data?.message || 'Failed to update article',
      };
    }
  },

  // Delete an article
  async deleteArticle(id) {
    try {
      console.log(`Deleting article with ID: ${id}`);
      const response = await api.delete(`/api/articles/${id}`);
      console.log('Article deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting article with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to delete article',
        friendlyMessage: error.response?.data?.message || 'Failed to delete article',
      };
    }
  },

  // Rate an article
  async rateArticle(id, ratingData) {
    try {
      console.log(`Rating article ${id} with data:`, ratingData);
      const response = await api.post(`/api/articles/${id}/ratings`, {
        score: ratingData.score || ratingData.rating,
        comment: ratingData.comment,
      });
      console.log('Article rated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error rating article with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to rate article',
        friendlyMessage: error.response?.data?.message || 'Failed to rate article',
      };
    }
  },

  // Like or dislike an article
  async toggleLikeArticle(id, isLike) {
    try {
      console.log(`${isLike ? 'Liking' : 'Disliking'} article ${id}`);
      const response = await api.post(`/api/articles/${id}/like`, { isLike });
      console.log('Article like status toggled successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error toggling like for article with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to toggle like',
        friendlyMessage: error.response?.data?.message || 'Failed to toggle like',
      };
    }
  },

  // Get user's own articles
  async getUserArticles(params = {}) {
    try {
      console.log('Fetching user articles with params:', params);
      const response = await api.get('/api/articles/my-articles', { params });
      console.log('User articles fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user articles:', error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to fetch user articles',
        friendlyMessage: error.response?.data?.message || 'Failed to fetch user articles',
      };
    }
  },

  // Add a comment to an article
  async addComment(id, commentData) {
    try {
      console.log(`Adding comment to article ${id}:`, commentData);
      const response = await api.post(`/api/articles/${id}/comments`, {
        content: commentData.content || commentData.comment,
        parentCommentId: commentData.parentCommentId,
      });
      console.log('Comment added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to article with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to add comment',
        friendlyMessage: error.response?.data?.message || 'Failed to add comment',
      };
    }
  },

  // Update a comment
  async updateComment(commentId, commentData) {
    try {
      console.log(`Updating comment ${commentId}:`, commentData);
      const response = await api.put(`/api/articles/comments/${commentId}`, {
        content: commentData.content,
      });
      console.log('Comment updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to update comment',
        friendlyMessage: error.response?.data?.message || 'Failed to update comment',
      };
    }
  },

  // Delete a comment
  async deleteComment(commentId) {
    try {
      console.log(`Deleting comment ${commentId}`);
      const response = await api.delete(`/api/articles/comments/${commentId}`);
      console.log('Comment deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to delete comment',
        friendlyMessage: error.response?.data?.message || 'Failed to delete comment',
      };
    }
  },
};

export default ArticleService;
