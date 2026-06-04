import api from './api';

// Cache for bookmark data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cache key
const getCacheKey = (endpoint, params = {}) => {
  return `${endpoint}_${JSON.stringify(params)}`;
};

// Helper function to clear user cache
const clearUserCache = () => {
  cache.clear();
};

const BookmarkService = {
  // Create a new bookmark
  async createBookmark(bookmarkData) {
    try {
      console.log('Creating bookmark with data:', bookmarkData);
      const response = await api.post('/api/bookmarks', bookmarkData);
      console.log('Bookmark created successfully:', response.data);

      // Clear cache after creating bookmark
      clearUserCache();

      return response.data;
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to create bookmark',
        friendlyMessage: error.response?.data?.message || 'Failed to create bookmark',
      };
    }
  },

  // Get user's bookmarks with pagination and filtering
  async getBookmarks(params = {}) {
    try {
      const cacheKey = getCacheKey('bookmarks', params);
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      console.log('Fetching bookmarks with params:', params);
      const response = await api.get('/api/bookmarks', { params });
      console.log('Bookmarks fetched successfully:', response.data);

      // Cache the result
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to fetch bookmarks',
        friendlyMessage: error.response?.data?.message || 'Failed to fetch bookmarks',
      };
    }
  },

  // Get a specific bookmark
  async getBookmark(id) {
    try {
      console.log(`Fetching bookmark with ID: ${id}`);
      const response = await api.get(`/api/bookmarks/${id}`);
      console.log('Bookmark fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bookmark with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to fetch bookmark',
        friendlyMessage: error.response?.data?.message || 'Failed to fetch bookmark',
      };
    }
  },

  // Update a bookmark
  async updateBookmark(id, bookmarkData) {
    try {
      console.log(`Updating bookmark with ID ${id}:`, bookmarkData);
      const response = await api.put(`/api/bookmarks/${id}`, bookmarkData);
      console.log('Bookmark updated successfully:', response.data);

      // Clear cache after updating bookmark
      clearUserCache();

      return response.data;
    } catch (error) {
      console.error(`Error updating bookmark with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to update bookmark',
        friendlyMessage: error.response?.data?.message || 'Failed to update bookmark',
      };
    }
  },

  // Delete a bookmark
  async deleteBookmark(id) {
    try {
      console.log(`Deleting bookmark with ID: ${id}`);
      const response = await api.delete(`/api/bookmarks/${id}`);
      console.log('Bookmark deleted successfully:', response.data);

      // Clear cache after deleting bookmark
      clearUserCache();

      return response.data;
    } catch (error) {
      console.error(`Error deleting bookmark with ID ${id}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to delete bookmark',
        friendlyMessage: error.response?.data?.message || 'Failed to delete bookmark',
      };
    }
  },

  // Toggle bookmark (quick add/remove)
  async toggleBookmark(resourceId) {
    try {
      console.log(`Toggling bookmark for resource: ${resourceId}`);
      const response = await api.post(`/api/bookmarks/toggle/${resourceId}`);
      console.log('Bookmark toggled successfully:', response.data);

      // Clear cache after toggling bookmark
      clearUserCache();

      return response.data;
    } catch (error) {
      console.error(`Error toggling bookmark for resource ${resourceId}:`, error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to toggle bookmark',
        friendlyMessage: error.response?.data?.message || 'Failed to toggle bookmark',
      };
    }
  },

  // Get bookmark statistics
  async getBookmarkStats() {
    try {
      const cacheKey = getCacheKey('bookmarkStats');
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      console.log('Fetching bookmark statistics');
      const response = await api.get('/api/bookmarks/stats');
      console.log('Bookmark statistics fetched successfully:', response.data);

      // Cache the result
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching bookmark statistics:', error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to fetch bookmark statistics',
        friendlyMessage: error.response?.data?.message || 'Failed to fetch bookmark statistics',
      };
    }
  },

  // Search bookmarks
  async searchBookmarks(query, limit = 10) {
    try {
      console.log(`Searching bookmarks with query: ${query}`);
      const response = await api.get('/api/bookmarks/search', {
        params: { q: query, limit },
      });
      console.log('Bookmark search completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      throw {
        ...error,
        message: error.response?.data?.message || 'Failed to search bookmarks',
        friendlyMessage: error.response?.data?.message || 'Failed to search bookmarks',
      };
    }
  },

  // Clear cache
  clearCache() {
    cache.clear();
  },
};

export default BookmarkService;
