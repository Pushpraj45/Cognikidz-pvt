const Joi = require("joi");
const { ApiError } = require("../shared/error-middleware");
const { ArticleStatus, ArticleCategory } = require("./model");

/**
 * Middleware to validate article creation
 */
const validateCreateArticle = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required().max(255).messages({
      "string.empty": "Title is required",
      "string.max": "Title cannot exceed 255 characters",
      "any.required": "Title is required",
    }),
    body: Joi.string().required().messages({
      "string.empty": "Article body is required",
      "any.required": "Article body is required",
    }),
    excerpt: Joi.string().allow("").max(500).messages({
      "string.max": "Excerpt cannot exceed 500 characters",
    }),
    category: Joi.string()
      .valid(...Object.values(ArticleCategory))
      .required()
      .messages({
        "any.only": "Invalid category",
        "any.required": "Category is required",
      }),
    tags: Joi.string().allow("").messages({
      "string.base": "Tags must be a comma-separated string",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate article status update
 */
const validateStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid(...Object.values(ArticleStatus))
      .required()
      .messages({
        "any.only": "Invalid status",
        "any.required": "Status is required",
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate article rating
 */
const validateRating = (req, res, next) => {
  const schema = Joi.object({
    score: Joi.number().integer().min(1).max(5).required().messages({
      "number.base": "Score must be a number",
      "number.integer": "Score must be an integer",
      "number.min": "Score must be at least 1",
      "number.max": "Score cannot exceed 5",
      "any.required": "Score is required",
    }),
    comment: Joi.string().allow("").messages({
      "string.base": "Comment must be a string",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate article comment
 */
const validateComment = (req, res, next) => {
  const schema = Joi.object({
    content: Joi.string().required().messages({
      "string.empty": "Comment content is required",
      "any.required": "Comment content is required",
    }),
    parentCommentId: Joi.string().allow(null, "").messages({
      "string.base": "Parent comment ID must be a string",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate article like
 */
const validateLike = (req, res, next) => {
  const schema = Joi.object({
    isLike: Joi.boolean().required().messages({
      "boolean.base": "isLike must be a boolean",
      "any.required": "isLike is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

module.exports = {
  validateCreateArticle,
  validateStatusUpdate,
  validateRating,
  validateComment,
  validateLike,
};
