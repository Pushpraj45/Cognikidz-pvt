const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define article status enum
const ArticleStatus = {
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
};

// Define article category enum
const ArticleCategory = {
  ADHD: "ADHD",
  AUTISM: "Autism",
  DYSLEXIA: "Dyslexia",
  DEVELOPMENT: "Development",
  EARLY_INTERVENTION: "Early Intervention",
};

// Article schema
const articleSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    body: {
      type: String,
      required: true,
    },
    bannerUrl: {
      type: String,
    },
    tags: [String],
    category: {
      type: String,
      required: true,
      enum: Object.values(ArticleCategory),
    },
    readingTime: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.PUBLISHED,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for article ratings
articleSchema.virtual("ratings", {
  ref: "ArticleRating",
  localField: "_id",
  foreignField: "article",
});

// Virtual for article comments
articleSchema.virtual("comments", {
  ref: "ArticleComment",
  localField: "_id",
  foreignField: "article",
});

// Virtual for average rating
articleSchema.virtual("averageRating").get(function () {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
    return sum / this.ratings.length;
  }
  return 0;
});

// Article Rating schema
const articleRatingSchema = new Schema(
  {
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    ratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Article Comment schema
const articleCommentSchema = new Schema(
  {
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "ArticleComment",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for comment replies
articleCommentSchema.virtual("replies", {
  ref: "ArticleComment",
  localField: "_id",
  foreignField: "parentComment",
});

// Article Like schema (separate from ratings)
const articleLikeSchema = new Schema(
  {
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isLike: {
      type: Boolean,
      required: true, // true for like, false for dislike
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one like/dislike per article
articleLikeSchema.index({ article: 1, user: 1 }, { unique: true });

// Virtual for article likes/dislikes
articleSchema.virtual("likes", {
  ref: "ArticleLike",
  localField: "_id",
  foreignField: "article",
});

// Virtual for like count
articleSchema.virtual("likeCount").get(function () {
  if (this.likes && this.likes.length > 0) {
    return this.likes.filter((like) => like.isLike === true).length;
  }
  return 0;
});

// Virtual for dislike count
articleSchema.virtual("dislikeCount").get(function () {
  if (this.likes && this.likes.length > 0) {
    return this.likes.filter((like) => like.isLike === false).length;
  }
  return 0;
});

// Virtual for comment count
articleSchema.virtual("commentCount").get(function () {
  if (this.comments && this.comments.length > 0) {
    return this.comments.filter((comment) => !comment.isDeleted).length;
  }
  return 0;
});

// Create models
const Article = mongoose.model("Article", articleSchema);
const ArticleRating = mongoose.model("ArticleRating", articleRatingSchema);
const ArticleComment = mongoose.model("ArticleComment", articleCommentSchema);
const ArticleLike = mongoose.model("ArticleLike", articleLikeSchema);

module.exports = {
  Article,
  ArticleRating,
  ArticleComment,
  ArticleLike,
  ArticleStatus,
  ArticleCategory,
};
