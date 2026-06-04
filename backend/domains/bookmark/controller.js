const { Bookmark } = require("./model");
const { Article } = require("../article/model");
const mongoose = require("mongoose");

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cache key
const getCacheKey = (prefix, userId, additional = "") => {
  return `${prefix}:${userId}:${additional}`;
};

// Helper function to clear user cache
const clearUserCache = (userId) => {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.includes(`:${userId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
};

// Simplified Bookmark Controllers
const bookmarkController = {
  // Create a new bookmark
  async createBookmark(req, res) {
    try {
      const { resourceId, notes, tags } = req.body;
      const userId = req.user.id;

      // Check if resource exists
      const resource = await Article.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      // Check if bookmark already exists
      const existingBookmark = await Bookmark.findOne({
        user: userId,
        resource: resourceId,
      });

      if (existingBookmark) {
        return res.status(400).json({ message: "Resource already bookmarked" });
      }

      // Create bookmark
      const bookmark = new Bookmark({
        user: userId,
        resource: resourceId,
        notes: notes?.trim(),
        tags: tags?.map(tag => tag.toLowerCase().trim()).filter(Boolean) || [],
      });

      await bookmark.save();

      // Clear user cache
      clearUserCache(userId);

      // Populate resource details for response
      await bookmark.populate({
        path: "resource",
        select: "title excerpt category tags bannerUrl author",
        model: "Article"
      });

      // Transform bookmark to include resourceDetails
      const transformedBookmark = {
        ...bookmark.toObject(),
        resourceDetails: bookmark.resource
      };

      res.status(201).json({
        success: true,
        data: transformedBookmark,
        message: "Bookmark created successfully",
      });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create bookmark",
        error: error.message,
      });
    }
  },

  // Get user's bookmarks with pagination and filtering
  async getBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        tags,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const cacheKey = getCacheKey("bookmarks", userId, JSON.stringify(req.query));
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      // Build query
      const query = { user: userId };
      
      if (tags) {
        const tagArray = tags.split(",").map(tag => tag.toLowerCase().trim());
        query.tags = { $in: tagArray };
      }
      
      if (search) {
        query.$or = [
          { notes: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [bookmarks, total] = await Promise.all([
        Bookmark.find(query)
          .populate({
            path: "resource",
            select: "title excerpt category tags bannerUrl author",
            model: "Article"
          })
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Bookmark.countDocuments(query),
      ]);

      // Transform bookmarks to include resourceDetails
      const transformedBookmarks = bookmarks.map(bookmark => ({
        ...bookmark,
        resource: bookmark.resource._id || bookmark.resource, // Ensure resource is always the ID
        resourceDetails: bookmark.resource
      }));

      const result = {
        success: true,
        bookmarks: transformedBookmarks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch bookmarks",
        error: error.message,
      });
    }
  },

  // Get a specific bookmark
  async getBookmark(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const bookmark = await Bookmark.findOne({
        _id: id,
        user: userId,
      }).populate({
        path: "resource",
        select: "title excerpt category tags bannerUrl author",
        model: "Article"
      });

      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      // Transform bookmark to include resourceDetails
      const transformedBookmark = {
        ...bookmark.toObject(),
        resource: bookmark.resource._id || bookmark.resource, // Ensure resource is always the ID
        resourceDetails: bookmark.resource
      };

      res.json({
        success: true,
        data: transformedBookmark,
      });
    } catch (error) {
      console.error("Error fetching bookmark:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch bookmark",
        error: error.message,
      });
    }
  },

  // Update a bookmark
  async updateBookmark(req, res) {
    try {
      const { id } = req.params;
      const { notes, tags } = req.body;
      const userId = req.user.id;

      const bookmark = await Bookmark.findOne({
        _id: id,
        user: userId,
      });

      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      // Update fields
      const updates = {};
      if (notes !== undefined) updates.notes = notes?.trim();
      if (tags !== undefined) {
        updates.tags = tags?.map(tag => tag.toLowerCase().trim()).filter(Boolean) || [];
      }

      const updatedBookmark = await Bookmark.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate("resourceDetails");

      // Clear user cache
      clearUserCache(userId);

      res.json({
        success: true,
        data: updatedBookmark,
        message: "Bookmark updated successfully",
      });
    } catch (error) {
      console.error("Error updating bookmark:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update bookmark",
        error: error.message,
      });
    }
  },

  // Delete a bookmark
  async deleteBookmark(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const bookmark = await Bookmark.findOneAndDelete({
        _id: id,
        user: userId,
      });

      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      // Clear user cache
      clearUserCache(userId);

      res.json({
        success: true,
        message: "Bookmark deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete bookmark",
        error: error.message,
      });
    }
  },

  // Toggle bookmark (quick add/remove)
  async toggleBookmark(req, res) {
    try {
      const { resourceId } = req.params;
      const userId = req.user.id;

      const existingBookmark = await Bookmark.findOne({
        user: userId,
        resource: resourceId,
      });

      if (existingBookmark) {
        // Remove bookmark
        await Bookmark.findByIdAndDelete(existingBookmark._id);
        clearUserCache(userId);
        
        res.json({
          success: true,
          data: { bookmarked: false },
          message: "Bookmark removed",
        });
      } else {
        // Add bookmark
        const bookmark = new Bookmark({
          user: userId,
          resource: resourceId,
        });

        await bookmark.save();
        clearUserCache(userId);

        res.json({
          success: true,
          data: { bookmarked: true },
          message: "Bookmark added",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle bookmark",
        error: error.message,
      });
    }
  },

  // Get bookmark statistics
  async getBookmarkStats(req, res) {
    try {
      const userId = req.user.id;
      
      const cacheKey = getCacheKey("bookmarkStats", userId);
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      const stats = await Bookmark.getUserStats(userId);

      const result = {
        success: true,
        data: stats,
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching bookmark stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch bookmark statistics",
        error: error.message,
      });
    }
  },

  // Search bookmarks
  async searchBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }

      const searchQuery = {
        user: userId,
        $or: [
          { notes: { $regex: q, $options: "i" } },
          { tags: { $in: [new RegExp(q, "i")] } },
        ],
      };

      const bookmarks = await Bookmark.find(searchQuery)
        .populate("resourceDetails", "title excerpt category tags")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: bookmarks,
      });
    } catch (error) {
      console.error("Error searching bookmarks:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search bookmarks",
        error: error.message,
      });
    }
  },
};

module.exports = bookmarkController; 