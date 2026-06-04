const { awsS3Service } = require("../../services/aws-s3.service");
const logger = require("../../utils/logger");

/**
 * Upload image to AWS S3
 * @param {Object} file - The file object from multer
 * @param {String} folder - Folder name (optional, defaults to 'uploads')
 * @returns {Promise<string>} The URL of the uploaded image
 */
const uploadImage = async (file, folder = "uploads") => {
  try {
    return await awsS3Service.uploadImage(file, folder);
  } catch (error) {
    logger.error("Image upload error:", error);
    throw new Error("Failed to upload image");
  }
};

/**
 * Delete image from AWS S3
 * @param {string} imagePath - The URL path of the image to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
const deleteImage = async (imagePath) => {
  try {
    if (!imagePath) return true;

    await awsS3Service.deleteFile(imagePath);
    logger.info(`Image deleted: ${imagePath}`);
    return true;
  } catch (error) {
    logger.error("Image deletion error:", error);
    throw new Error("Failed to delete image");
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
