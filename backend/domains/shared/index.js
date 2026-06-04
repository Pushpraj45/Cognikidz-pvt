// Shared Domain - Main exports
const errorMiddleware = require('./error-middleware');
const uploadService = require('./upload-service');

module.exports = {
  errorMiddleware,
  uploadService
};
