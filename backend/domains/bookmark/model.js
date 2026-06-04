const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Simplified Bookmark Schema - Basic bookmark functionality without folders
const bookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resource: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance
bookmarkSchema.index({ user: 1, createdAt: -1 }); // User's bookmarks by date
bookmarkSchema.index({ user: 1, tags: 1 }); // User's bookmarks by tags
bookmarkSchema.index({ resource: 1, user: 1 }, { unique: true }); // Prevent duplicate bookmarks

// Virtual for resource details
bookmarkSchema.virtual("resourceDetails", {
  ref: "Article",
  localField: "resource",
  foreignField: "_id",
  justOne: true,
});

// Static method to get user stats
bookmarkSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBookmarks: { $sum: 1 },
        totalTags: { $sum: { $size: "$tags" } },
      },
    },
  ]);

  return stats[0] || { totalBookmarks: 0, totalTags: 0 };
};

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

module.exports = {
  Bookmark,
}; 