// controllers/article.controller.js
const { ApiError } = require("../shared/error-middleware");
const {
  Article,
  ArticleRating,
  ArticleComment,
  ArticleLike,
  ArticleStatus,
} = require("./model");
const articleService = require("./service");
const logger = require("../../utils/logger");

/**
 * Create a new article
 * @route POST /articles
 * @access Private
 */
const createArticle = async (req, res, next) => {
  try {
    const { title, body, excerpt, category, tags } = req.body;
    let bannerUrl = null;

    // Handle file upload if banner is provided
    if (req.file) {
      bannerUrl = await articleService.uploadImage(req.file);
    }

    // Create article - all articles are published immediately
    const article = new Article({
      author: req.user._id,
      title,
      body,
      excerpt,
      category,
      tags: tags ? tags.split(",") : [],
      bannerUrl,
      readingTime: articleService.calculateReadingTime(body),
      status: ArticleStatus.PUBLISHED, // Always publish immediately
      publishedAt: Date.now(), // Set published date immediately
    });

    await article.save();

    res.status(201).json(article);
  } catch (error) {
    logger.error("Create article error:", error);
    next(new ApiError(500, "Could not create article"));
  }
};

/**
 * Get all articles
 * @route GET /articles
 * @access Public
 */
const getArticles = async (req, res, next) => {
  try {
    const { category, tags, featured, page = 1, limit = 20 } = req.query;

    // Build filters
    const filter = { isDeleted: false };

    // If user is not admin, only show published articles
    if (!req.user || !req.user.isAdmin) {
      filter.status = ArticleStatus.PUBLISHED;
    }

    if (category) {
      filter.category = category;
    }

    if (featured) {
      filter.featured = featured === "true";
    }

    if (tags) {
      filter.tags = { $in: tags.split(",") };
    }

    // Count total matching documents
    const total = await Article.countDocuments(filter);

    // Get paginated articles with like and comment counts
    const articles = await Article.find(filter)
      .populate("author", "firstName lastName")
      .populate({
        path: "likes",
        select: "isLike user",
      })
      .populate({
        path: "comments",
        match: { isDeleted: false },
        select: "_id",
      })
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Transform articles to include frontend-expected fields
    const transformedArticles = await Promise.all(articles.map(async (article) => {
      // Calculate proper like and dislike counts
      const likeCount = article.likes
        ? article.likes.filter((like) => like.isLike === true).length
        : 0;
      const dislikeCount = article.likes
        ? article.likes.filter((like) => like.isLike === false).length
        : 0;

      // Check user's like status if authenticated
      let userLikeStatus = null;
      if (req.user && article.likes) {
        const userLike = article.likes.find(
          (like) => like.user.toString() === req.user._id.toString()
        );
        if (userLike) {
          userLikeStatus = userLike.isLike;
        }
      }

      // Get ratings for this article
      const ratingsData = await ArticleRating.find({ article: article._id });
      const ratingsCount = ratingsData.length;
      const averageRating = ratingsCount > 0 
        ? ratingsData.reduce((sum, rating) => sum + rating.score, 0) / ratingsCount
        : 0;

      // Process tags - handle both array and hashtag string formats
      let processedTags = [];
      if (article.tags) {
        if (Array.isArray(article.tags)) {
          // Already an array
          processedTags = article.tags
            .map(tag => typeof tag === 'string' ? tag.replace(/^#/, '').trim() : tag)
            .filter(tag => tag && tag.length > 0);
        } else if (typeof article.tags === 'string') {
          // Convert hashtag string to array
          processedTags = article.tags
            .split(/[#\s]+/)
            .map(tag => tag.trim())
            .filter(tag => tag && tag.length > 0);
        }
      }

      return {
        ...article.toJSON(),
        image: article.bannerUrl,
        content: article.body,
        created_at: article.createdAt, // Add snake_case field for frontend
        timestamp: article.createdAt,
        likes: likeCount,
        dislikes: dislikeCount,
        average_rating: averageRating, // Frontend expects snake_case
        ratings_count: ratingsCount, // Frontend expects snake_case
        comments: article.commentCount,
        tags: processedTags, // Properly processed tags
        userLikeStatus, // User's current like status for this article
        author: article.author ? {
          ...article.author.toJSON(),
          name: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || 'Anonymous'
        } : {
          name: 'Anonymous',
          firstName: '',
          lastName: ''
        }
      };
    }));

    res.json({
      items: transformedArticles,
      total,
      page: Number(page),
      size: Number(limit),
    });
  } catch (error) {
    logger.error("Get articles error:", error);
    next(new ApiError(500, "Could not fetch articles"));
  }
};

/**
 * Get a single article
 * @route GET /articles/:id
 * @access Public
 */
const getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("author", "firstName lastName")
      .populate({
        path: "likes",
        select: "isLike user",
      })
      .populate({
        path: "ratings",
        select: "score comment ratedAt",
        populate: {
          path: "user",
          select: "firstName lastName",
        },
      })
      .populate({
        path: "comments",
        select: "content createdAt user parentComment",
        match: { isDeleted: false },
        populate: [
          {
            path: "user",
            select: "firstName lastName",
          },
          {
            path: "replies",
            match: { isDeleted: false },
            populate: {
              path: "user",
              select: "firstName lastName",
            },
          },
        ],
      });

    if (!article) {
      return next(new ApiError(404, "Article not found"));
    }

    // If not admin and article is not published, deny access
    if (
      (!req.user || !req.user.isAdmin) &&
      article.status !== ArticleStatus.PUBLISHED
    ) {
      return next(new ApiError(403, "Access denied"));
    }

    // Calculate proper like and dislike counts
    const likeCount = article.likes
      ? article.likes.filter((like) => like.isLike === true).length
      : 0;
    const dislikeCount = article.likes
      ? article.likes.filter((like) => like.isLike === false).length
      : 0;

    // Check user's like status
    let userLikeStatus = null;
    if (req.user && article.likes) {
      const userLike = article.likes.find(
        (like) => like.user.toString() === req.user._id.toString()
      );
      if (userLike) {
        userLikeStatus = userLike.isLike;
      }
    }

    // Calculate ratings
    const ratingsCount = article.ratings ? article.ratings.length : 0;
    const averageRating = ratingsCount > 0 
      ? article.ratings.reduce((sum, rating) => sum + rating.score, 0) / ratingsCount
      : 0;

    // Check if user has rated this article
    let userRating = 0;
    if (req.user && article.ratings) {
      const userRatingObj = article.ratings.find(
        rating => rating.user._id.toString() === req.user._id.toString()
      );
      if (userRatingObj) {
        userRating = userRatingObj.score;
      }
    }

    // Transform comments to include expected date fields
    const transformedComments = article.comments ? article.comments.map(comment => ({
      ...comment.toJSON(),
      created_at: comment.createdAt, // Add snake_case field for frontend
      user: comment.user ? {
        ...comment.user.toJSON(),
        name: `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || 'Anonymous'
      } : {
        name: 'Anonymous',
        firstName: '',
        lastName: ''
      }
    })) : [];

    // Process tags - handle both array and hashtag string formats
    let processedTags = [];
    if (article.tags) {
      if (Array.isArray(article.tags)) {
        // Already an array
        processedTags = article.tags
          .map(tag => typeof tag === 'string' ? tag.replace(/^#/, '').trim() : tag)
          .filter(tag => tag && tag.length > 0);
      } else if (typeof article.tags === 'string') {
        // Convert hashtag string to array
        processedTags = article.tags
          .split(/[#\s]+/)
          .map(tag => tag.trim())
          .filter(tag => tag && tag.length > 0);
      }
    }

    // Transform article to include frontend-expected fields
    const transformedArticle = {
      ...article.toJSON(),
      image: article.bannerUrl,
      content: article.body,
      created_at: article.createdAt, // Add snake_case field for frontend
      timestamp: article.createdAt,
      likes: likeCount, // Proper like count
      dislikes: dislikeCount, // Proper dislike count
      average_rating: averageRating, // Frontend expects snake_case
      ratings_count: ratingsCount, // Frontend expects snake_case
      user_rating: userRating, // Current user's rating
      comments: transformedComments, // Transformed comments
      tags: processedTags, // Properly processed tags
      userLikeStatus, // User's current like status: true (liked), false (disliked), null (no action)
      author: article.author ? {
        ...article.author.toJSON(),
        name: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || 'Anonymous'
      } : {
        name: 'Anonymous',
        firstName: '',
        lastName: ''
      }
    };

    res.json(transformedArticle);
  } catch (error) {
    logger.error("Get article error:", error);
    next(new ApiError(500, "Could not fetch article"));
  }
};

/**
 * Delete an article
 * @route DELETE /articles/:id
 * @access Private (Admin or Author)
 */
const deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return next(new ApiError(404, "Article not found"));
    }

    // Check if user is author or admin
    if (
      article.author.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return next(new ApiError(403, "Not authorized"));
    }

    // Soft delete
    article.isDeleted = true;
    article.deletedAt = Date.now();
    await article.save();

    res.status(204).json({});
  } catch (error) {
    logger.error("Delete article error:", error);
    next(new ApiError(500, "Could not delete article"));
  }
};

/**
 * Rate an article
 * @route POST /articles/:id/ratings
 * @access Private
 */
const rateArticle = async (req, res, next) => {
  try {
    const { score, comment } = req.body;

    logger.info('🌟 Rating article request:', {
      articleId: req.params.id,
      userId: req.user._id,
      userEmail: req.user.email,
      score,
      comment: comment || 'no comment'
    });

    // Check if article exists
    const article = await Article.findById(req.params.id);
    if (!article) {
      logger.warn('Article not found for rating:', req.params.id);
      return next(new ApiError(404, "Article not found"));
    }

    // Check if user already rated this article
    const existingRating = await ArticleRating.findOne({
      article: req.params.id,
      user: req.user._id,
    });

    let rating;
    if (existingRating) {
      // Update existing rating
      existingRating.score = score;
      existingRating.comment = comment;
      await existingRating.save();
      rating = existingRating;
    } else {
      // Create new rating
      const newRating = new ArticleRating({
        article: req.params.id,
        user: req.user._id,
        score,
        comment,
      });
      await newRating.save();
      rating = newRating;
    }

    // Calculate updated average rating and count
    const allRatings = await ArticleRating.find({ article: req.params.id });
    const ratingsCount = allRatings.length;
    const averageRating = ratingsCount > 0 
      ? allRatings.reduce((sum, r) => sum + r.score, 0) / ratingsCount
      : 0;

    const responseData = {
      ...rating.toJSON(),
      average_rating: averageRating,
      ratings_count: ratingsCount
    };

    logger.info('✅ Rating successful:', {
      articleId: req.params.id,
      userId: req.user._id,
      newScore: score,
      averageRating,
      ratingsCount
    });

    res.json(responseData);
  } catch (error) {
    logger.error("Rate article error:", error);
    next(new ApiError(500, "Could not rate article"));
  }
};

/**
 * Add a comment to an article
 * @route POST /articles/:id/comments
 * @access Private
 */
const addComment = async (req, res, next) => {
  try {
    const { content, parentCommentId } = req.body;

    // Check if article exists
    const article = await Article.findById(req.params.id);
    if (!article) {
      return next(new ApiError(404, "Article not found"));
    }

    // Create new comment
    const newComment = new ArticleComment({
      article: req.params.id,
      user: req.user._id,
      content,
      parentComment: parentCommentId,
    });

    await newComment.save();

    // Populate user details
    await newComment.populate("user", "firstName lastName");

    // Transform comment to include expected date fields
    const transformedComment = {
      ...newComment.toJSON(),
      created_at: newComment.createdAt, // Add snake_case field for frontend
      user: newComment.user ? {
        ...newComment.user.toJSON(),
        name: `${newComment.user.firstName || ''} ${newComment.user.lastName || ''}`.trim() || 'Anonymous'
      } : {
        name: 'Anonymous',
        firstName: '',
        lastName: ''
      }
    };

    res.status(201).json(transformedComment);
  } catch (error) {
    logger.error("Add comment error:", error);
    next(new ApiError(500, "Could not add comment"));
  }
};

/**
 * Update a comment
 * @route PUT /articles/comments/:id
 * @access Private
 */
const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return next(new ApiError(400, "Comment content is required"));
    }

    const comment = await ArticleComment.findById(req.params.id);

    if (!comment) {
      return next(new ApiError(404, "Comment not found"));
    }

    // Check if user is comment author
    if (comment.user.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "Not authorized to edit this comment"));
    }

    // Update comment content
    comment.content = content.trim();
    await comment.save();

    // Populate user details for response
    await comment.populate("user", "firstName lastName");

    // Transform comment to include expected date fields
    const transformedComment = {
      ...comment.toJSON(),
      created_at: comment.createdAt,
      user: comment.user ? {
        ...comment.user.toJSON(),
        name: `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || 'Anonymous'
      } : {
        name: 'Anonymous',
        firstName: '',
        lastName: ''
      }
    };

    res.json(transformedComment);
  } catch (error) {
    logger.error("Update comment error:", error);
    next(new ApiError(500, "Could not update comment"));
  }
};

/**
 * Delete a comment
 * @route DELETE /articles/comments/:id
 * @access Private
 */
const deleteComment = async (req, res, next) => {
  try {
    console.log('Delete comment request:', {
      commentId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    const comment = await ArticleComment.findById(req.params.id);

    if (!comment) {
      console.log('Comment not found:', req.params.id);
      return next(new ApiError(404, "Comment not found"));
    }

    console.log('Found comment:', {
      commentId: comment._id,
      commentUserId: comment.user,
      requestingUserId: req.user._id,
      isAdmin: req.user.isAdmin
    });

    // Check if user is comment author or admin
    if (
      comment.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      console.log('User not authorized to delete comment');
      return next(new ApiError(403, "Not authorized"));
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = Date.now();
    await comment.save();

    console.log('Comment soft deleted successfully');
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    logger.error("Delete comment error:", error);
    next(new ApiError(500, "Could not delete comment"));
  }
};

/**
 * Like or dislike an article
 * @route POST /articles/:id/like
 * @access Private
 */
const toggleLikeArticle = async (req, res, next) => {
  try {
    const { isLike } = req.body; // true for like, false for dislike

    // Check if article exists
    const article = await Article.findById(req.params.id);
    if (!article) {
      return next(new ApiError(404, "Article not found"));
    }

    // Check if user already liked/disliked this article
    const existingLike = await ArticleLike.findOne({
      article: req.params.id,
      user: req.user._id,
    });

    if (existingLike) {
      if (existingLike.isLike === isLike) {
        // Remove like/dislike if same action
        await ArticleLike.deleteOne({ _id: existingLike._id });
        return res.json({
          message: `${isLike ? "Like" : "Dislike"} removed`,
          isLiked: null,
        });
      } else {
        // Update like/dislike if different action
        existingLike.isLike = isLike;
        await existingLike.save();
        return res.json({
          message: `Changed to ${isLike ? "like" : "dislike"}`,
          isLiked: isLike,
        });
      }
    }

    // Create new like/dislike
    const newLike = new ArticleLike({
      article: req.params.id,
      user: req.user._id,
      isLike,
    });

    await newLike.save();

    res.status(201).json({
      message: `Article ${isLike ? "liked" : "disliked"}`,
      isLiked: isLike,
    });
  } catch (error) {
    logger.error("Toggle like article error:", error);
    next(new ApiError(500, "Could not toggle like"));
  }
};

/**
 * Get user's articles
 * @route GET /articles/my-articles
 * @access Private
 */
const getUserArticles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const filter = {
      author: req.user._id,
      isDeleted: false,
    };

    // Count total matching documents
    const total = await Article.countDocuments(filter);

    // Get paginated articles
    const articles = await Article.find(filter)
      .populate("author", "firstName lastName")
      .populate({
        path: "likes",
        select: "isLike user",
      })
      .populate({
        path: "comments",
        match: { isDeleted: false },
        select: "_id",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Transform articles to include frontend-expected fields
    const transformedArticles = articles.map((article) => {
      // Calculate proper like and dislike counts
      const likeCount = article.likes
        ? article.likes.filter((like) => like.isLike === true).length
        : 0;
      const dislikeCount = article.likes
        ? article.likes.filter((like) => like.isLike === false).length
        : 0;

      // Check user's like status (since this is the user's own articles, they can see their own like status)
      let userLikeStatus = null;
      if (article.likes) {
        const userLike = article.likes.find(
          (like) => like.user.toString() === req.user._id.toString()
        );
        if (userLike) {
          userLikeStatus = userLike.isLike;
        }
      }

      return {
        ...article.toJSON(),
        image: article.bannerUrl,
        content: article.body,
        timestamp: article.createdAt,
        likes: likeCount,
        dislikes: dislikeCount,
        comments: article.commentCount,
        userLikeStatus, // User's current like status for this article
      };
    });

    res.json({
      items: transformedArticles,
      total,
      page: Number(page),
      size: Number(limit),
    });
  } catch (error) {
    logger.error("Get user articles error:", error);
    next(new ApiError(500, "Could not fetch user articles"));
  }
};

module.exports = {
  createArticle,
  getArticles,
  getArticleById,
  deleteArticle,
  rateArticle,
  addComment,
  updateComment,
  deleteComment,
  toggleLikeArticle,
  getUserArticles,
};
