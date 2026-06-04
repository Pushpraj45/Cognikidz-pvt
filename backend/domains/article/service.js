const { awsS3Service } = require("../../services/aws-s3.service");
const logger = require("../../utils/logger");

/**
 * Calculate reading time for an article
 * @param {String} text - Article text
 * @returns {Number} - Reading time in minutes
 */
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime || 1; // Minimum 1 minute
};

/**
 * Upload image to AWS S3
 * @param {Object} file - Uploaded file object
 * @returns {String} - URL of uploaded image
 */
const uploadImage = async (file) => {
  try {
    return await awsS3Service.uploadImage(file, "articles");
  } catch (error) {
    logger.error("Article image upload error:", error);
    throw new Error("Failed to upload article image");
  }
};

/**
 * Delete image from AWS S3
 * @param {String} imageUrl - URL of image to delete
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    await awsS3Service.deleteFile(imageUrl);
    logger.info(`Article image deleted: ${imageUrl}`);
    return true;
  } catch (error) {
    logger.error("Article image deletion error:", error);
    throw new Error("Failed to delete article image");
  }
};

/**
 * Strip HTML tags from text
 * @param {String} html - HTML string
 * @returns {String} - Plain text
 */
const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Generate excerpt from article body
 * @param {String} body - Article body
 * @param {Number} length - Maximum length of excerpt
 * @returns {String} - Article excerpt
 */
const generateExcerpt = (body, length = 300) => {
  const plainText = stripHtml(body);
  if (plainText.length <= length) {
    return plainText;
  }
  return plainText.substring(0, length).trim() + "...";
};

module.exports = {
  calculateReadingTime,
  uploadImage,
  deleteImage,
  stripHtml,
  generateExcerpt,
};
