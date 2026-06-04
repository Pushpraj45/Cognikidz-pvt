// validators/contact.validator.js
const Joi = require("joi");
const { ApiError } = require("../shared/error-middleware");
const { ContactStatus } = require("./model");

/**
 * Middleware to validate contact form submission
 */
const validateContactForm = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().max(100).messages({
      "string.empty": "Name is required",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    subject: Joi.string().required().max(200).messages({
      "string.empty": "Subject is required",
      "string.max": "Subject cannot exceed 200 characters",
      "any.required": "Subject is required",
    }),
    message: Joi.string().required().messages({
      "string.empty": "Message is required",
      "any.required": "Message is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate contact status update
 */
const validateStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid(...Object.values(ContactStatus))
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
 * Middleware to validate contact reply
 */
const validateReply = (req, res, next) => {
  const schema = Joi.object({
    message: Joi.string().required().messages({
      "string.empty": "Reply message is required",
      "any.required": "Reply message is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

module.exports = {
  validateContactForm,
  validateStatusUpdate,
  validateReply,
};
