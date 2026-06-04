const { awsS3Service } = require("../../services/aws-s3.service");
const logger = require("../../utils/logger");

/**
 * Upload image to AWS S3
 * @param {Object} file - Uploaded file object
 * @returns {String} - URL of uploaded image
 */
const uploadImage = async (file) => {
  try {
    return await awsS3Service.uploadImage(file, "avatars");
  } catch (error) {
    logger.error("Avatar upload error:", error);
    throw new Error("Failed to upload avatar");
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
    logger.info(`Avatar deleted: ${imageUrl}`);
    return true;
  } catch (error) {
    logger.error("Avatar deletion error:", error);
    throw new Error("Failed to delete avatar");
  }
};

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {Number} - Age in years
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

module.exports = {
  uploadImage,
  deleteImage,
  calculateAge,
};
