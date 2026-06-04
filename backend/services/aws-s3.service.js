const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const path = require("path");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.join(__dirname, "../.env") });

/**
 * AWS S3 Storage Service
 * Handles file uploads, downloads, and deletions using AWS S3
 * Production version - no local storage fallback
 */
class AWSS3Service {
  constructor() {
    this.s3Client = null;
    this.bucketName = process.env.AWS_S3_BUCKET;
    this.region = process.env.AWS_REGION || "us-east-1";
    this.initialized = false;

    // Don't initialize immediately - do it lazily
    this.initializeS3();
  }

  /**
   * Initialize S3 client
   */
  initializeS3() {
    try {
      // Check if already initialized
      if (this.initialized) {
        return;
      }

      // Debug environment variables
      logger.debug("AWS Environment Variables Check:");
      logger.debug(
        "AWS_ACCESS_KEY_ID:",
        process.env.AWS_ACCESS_KEY_ID
          ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`
          : "NOT SET"
      );
      logger.debug(
        "AWS_SECRET_ACCESS_KEY:",
        process.env.AWS_SECRET_ACCESS_KEY
          ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8)}...`
          : "NOT SET"
      );
      logger.debug("AWS_S3_BUCKET:", process.env.AWS_S3_BUCKET || "NOT SET");
      logger.debug(
        "AWS_REGION:",
        process.env.AWS_REGION || "NOT SET (will use us-east-1)"
      );

      // Check if AWS credentials are provided
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY ||
        !this.bucketName
      ) {
        const errorMessage =
          "AWS S3 credentials not fully configured. Production requires valid S3 configuration.";
        logger.error(errorMessage);
        logger.error("Required environment variables:");
        logger.error("- AWS_ACCESS_KEY_ID");
        logger.error("- AWS_SECRET_ACCESS_KEY");
        logger.error("- AWS_S3_BUCKET");
        logger.error("- AWS_REGION (optional, defaults to us-east-1)");
        throw new Error(errorMessage);
      }

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      this.initialized = true;
      logger.info("AWS S3 client initialized successfully");
      logger.info(`Bucket: ${this.bucketName}`);
      logger.info(`Region: ${this.region}`);
    } catch (error) {
      logger.error("Failed to initialize AWS S3 client:", error);
      throw new Error(
        "AWS S3 initialization failed. Production requires valid S3 configuration."
      );
    }
  }

  /**
   * Check if AWS S3 is available
   * @returns {Boolean}
   */
  isAvailable() {
    return this.initialized && this.s3Client !== null && this.bucketName;
  }

  /**
   * Upload file to AWS S3
   * @param {Object} file - File object from multer
   * @param {String} folder - Folder name (e.g., 'avatars', 'articles', 'reports')
   * @returns {String} - Public URL of uploaded file
   */
  async uploadFile(file, folder = "uploads") {
    if (!this.isAvailable()) {
      throw new Error(
        "AWS S3 service not available. Check your S3 configuration."
      );
    }

    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${folder}/${uuidv4()}${fileExtension}`;

      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: "public, max-age=31536000", // 1 year cache
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Construct the public URL
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;

      logger.info(`File uploaded to AWS S3: ${fileName}`);
      return publicUrl;
    } catch (error) {
      logger.error("AWS S3 upload error:", error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload image specifically
   * @param {Object} file - Image file object
   * @param {String} folder - Folder name
   * @returns {String} - Public URL of uploaded image
   */
  async uploadImage(file, folder = "images") {
    // Validate image file
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
    ];

    // Also check if mimetype starts with 'image/' for broader compatibility
    const isImageType =
      allowedTypes.includes(file.mimetype) ||
      (file.mimetype && file.mimetype.startsWith("image/"));

    if (!isImageType) {
      throw new Error(
        `Invalid file type: ${file.mimetype}. Only images are allowed.`
      );
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File too large. Maximum size is 5MB.");
    }

    return this.uploadFile(file, folder);
  }

  /**
   * Upload PDF file
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {String} fileName - File name
   * @param {String} folder - Folder name
   * @returns {String} - Public URL of uploaded PDF
   */
  async uploadPDF(pdfBuffer, fileName, folder = "reports") {
    if (!this.isAvailable()) {
      throw new Error(
        "AWS S3 service not available. Check your S3 configuration."
      );
    }

    try {
      const fullFileName = `${folder}/${fileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: fullFileName,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        CacheControl: "public, max-age=31536000",
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fullFileName}`;

      logger.info(`PDF uploaded to AWS S3: ${fullFileName}`);
      return publicUrl;
    } catch (error) {
      logger.error("PDF upload error:", error);
      throw new Error(`Failed to upload PDF to S3: ${error.message}`);
    }
  }

  /**
   * Delete file from AWS S3
   * @param {String} fileUrl - URL of file to delete
   */
  async deleteFile(fileUrl) {
    try {
      if (!fileUrl) return true;

      if (!this.isAvailable()) {
        throw new Error(
          "AWS S3 service not available. Check your S3 configuration."
        );
      }

      if (!fileUrl.includes("amazonaws.com")) {
        logger.warn("File URL does not appear to be from AWS S3:", fileUrl);
        return false;
      }

      // Extract file path from URL
      const urlPattern = new RegExp(
        `https://${this.bucketName}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`
      );
      const match = fileUrl.match(urlPattern);

      if (!match) {
        logger.warn("Invalid AWS S3 URL format:", fileUrl);
        return false;
      }

      const filePath = match[1];

      const params = {
        Bucket: this.bucketName,
        Key: filePath,
      };

      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);

      logger.info(`File deleted from AWS S3: ${filePath}`);
      return true;
    } catch (error) {
      if (error.name === "NoSuchKey") {
        logger.info("File not found in AWS S3, may have been already deleted");
        return true;
      }
      logger.error("File deletion error:", error);
      return false;
    }
  }

  /**
   * Get signed URL for private file access
   * @param {String} filePath - Path to file in bucket
   * @param {Number} expiresIn - Expiration time in minutes (default: 60)
   * @returns {String} - Signed URL
   */
  async getSignedUrl(filePath, expiresIn = 60) {
    try {
      if (!this.isAvailable()) {
        throw new Error("AWS S3 not available");
      }

      const params = {
        Bucket: this.bucketName,
        Key: filePath,
      };

      const command = new GetObjectCommand(params);
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresIn * 60, // Convert minutes to seconds
      });

      return signedUrl;
    } catch (error) {
      logger.error("Error generating signed URL:", error);
      throw error;
    }
  }

  /**
   * List files in a folder
   * @param {String} folder - Folder name
   * @param {Number} limit - Maximum number of files to return
   * @returns {Array} - Array of file objects
   */
  async listFiles(folder, limit = 100) {
    try {
      if (!this.isAvailable()) {
        throw new Error("AWS S3 not available");
      }

      const params = {
        Bucket: this.bucketName,
        Prefix: `${folder}/`,
        MaxKeys: limit,
      };

      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((object) => ({
        name: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag,
        publicUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${object.Key}`,
      }));
    } catch (error) {
      logger.error("Error listing files:", error);
      return [];
    }
  }

  /**
   * Get file metadata
   * @param {String} filePath - Path to file in bucket
   * @returns {Object} - File metadata
   */
  async getFileMetadata(filePath) {
    try {
      if (!this.isAvailable()) {
        throw new Error("AWS S3 not available");
      }

      const params = {
        Bucket: this.bucketName,
        Key: filePath,
      };

      const command = new HeadObjectCommand(params);
      const response = await this.s3Client.send(command);

      return {
        name: filePath,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag,
        cacheControl: response.CacheControl,
      };
    } catch (error) {
      logger.error("Error getting file metadata:", error);
      throw error;
    }
  }

  /**
   * Test S3 connection and bucket access
   * @returns {Object} - Test results
   */
  async testConnection() {
    const results = {
      s3Available: false,
      bucketAccessible: false,
      uploadTest: false,
      error: null,
    };

    try {
      if (!this.isAvailable()) {
        results.error = "AWS S3 service not available (missing credentials)";
        return results;
      }

      results.s3Available = true;

      // Test bucket access
      const listParams = {
        Bucket: this.bucketName,
        MaxKeys: 1,
      };

      const listCommand = new ListObjectsV2Command(listParams);
      await this.s3Client.send(listCommand);
      results.bucketAccessible = true;

      // Test upload
      const testFile = {
        originalname: "test.txt",
        buffer: Buffer.from("AWS S3 test file"),
        mimetype: "text/plain",
        size: 16,
      };

      const uploadUrl = await this.uploadFile(testFile, "test");
      if (uploadUrl) {
        results.uploadTest = true;
        // Clean up test file
        await this.deleteFile(uploadUrl);
      }
    } catch (error) {
      results.error = error.message;
      logger.error("S3 connection test failed:", error);
    }

    return results;
  }

  /**
   * Upload assessment image with structured naming
   * @param {Buffer} imageBuffer - Image buffer
   * @param {String} assessmentType - autism, adhd, dyslexia
   * @param {String} setNumber - Set number (001, 002, etc.)
   * @param {String} imageType - positive, negative
   * @param {String} originalExtension - Original file extension (.jpg, .webp, .png, etc.)
   * @returns {Object} - Upload result with S3 key and public URL
   */
  async uploadAssessmentImage(
    imageBuffer,
    assessmentType,
    setNumber,
    imageType,
    originalExtension = ".jpg"
  ) {
    if (!this.isAvailable()) {
      throw new Error(
        "AWS S3 service not available. Check your S3 configuration."
      );
    }

    try {
      // Helper function to get content type from extension
      const getContentType = (ext) => {
        const types = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".webp": "image/webp",
          ".avif": "image/avif",
          ".gif": "image/gif",
          ".bmp": "image/bmp",
        };
        return types[ext.toLowerCase()] || "image/jpeg";
      };

      // Structure: assessment-images/autism/set-001/positive.webp (preserves original extension)
      const s3Key = `assessment-images/${assessmentType}/set-${setNumber}/${imageType}${originalExtension}`;

      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: getContentType(originalExtension),
        CacheControl: "public, max-age=31536000", // 1 year cache
        Metadata: {
          "assessment-type": assessmentType,
          "set-number": setNumber,
          "image-type": imageType,
          "original-extension": originalExtension,
          "uploaded-at": new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

      logger.info(`Assessment image uploaded to AWS S3: ${s3Key}`);

      return {
        s3Key,
        publicUrl,
        assessmentType,
        setNumber,
        imageType,
      };
    } catch (error) {
      logger.error("Assessment image upload error:", error);
      throw new Error(
        `Failed to upload assessment image to S3: ${error.message}`
      );
    }
  }

  /**
   * Get signed URLs for assessment image pairs
   * @param {Array} imagePairs - Array of image pair objects with s3Keys
   * @param {Number} expiresInMinutes - URL expiration time
   * @returns {Array} - Array of signed URLs
   */
  async getAssessmentImageUrls(imagePairs, expiresInMinutes = 30) {
    if (!this.isAvailable()) {
      throw new Error("AWS S3 service not available");
    }

    const signedUrls = [];

    for (const pair of imagePairs) {
      try {
        const positiveUrl = await this.getSignedUrl(
          pair.positiveS3Key,
          expiresInMinutes
        );
        const negativeUrl = await this.getSignedUrl(
          pair.negativeS3Key,
          expiresInMinutes
        );

        signedUrls.push({
          setId: pair.setId,
          positiveUrl,
          negativeUrl,
          expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
        });
      } catch (error) {
        logger.error(`Error generating signed URLs for ${pair.setId}:`, error);
        throw error;
      }
    }

    return signedUrls;
  }

  /**
   * List all assessment images by type
   * @param {String} assessmentType - autism, adhd, dyslexia
   * @returns {Array} - Array of image sets
   */
  async listAssessmentImages(assessmentType) {
    if (!this.isAvailable()) {
      throw new Error("AWS S3 service not available");
    }

    try {
      const prefix = `assessment-images/${assessmentType}/`;
      const files = await this.listFiles(prefix, 1000);

      // Group files by set
      const sets = {};
      files.forEach((file) => {
        const pathParts = file.name.split("/");
        if (pathParts.length >= 3) {
          const setName = pathParts[2]; // set-001, set-002, etc.
          const imageType = pathParts[3]?.replace(".jpg", ""); // positive, negative

          if (!sets[setName]) {
            sets[setName] = {};
          }
          sets[setName][imageType] = file;
        }
      });

      return sets;
    } catch (error) {
      logger.error("Error listing assessment images:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const awsS3Service = new AWSS3Service();

module.exports = {
  awsS3Service,
  AWSS3Service,
};
