const Joi = require("joi");
const { ApiError } = require("../shared/error-middleware");

/**
 * Middleware to validate registration data
 */
const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&)",
        "any.required": "Password is required",
      }),
    firstName: Joi.string().required().messages({
      "any.required": "First name is required",
    }),
    lastName: Joi.string().required().messages({
      "any.required": "Last name is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate login data
 */
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

/**
 * Middleware to validate profile update data
 */
const validateProfileUpdate = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email().messages({
      "string.email": "Please provide a valid email address",
    }),
    password: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&)",
      }),
    phone: Joi.string().allow(""),
    address: Joi.string().allow(""),
    location: Joi.string().allow(""),
    parental_role: Joi.string(),
    dateOfBirth: Joi.date().iso(),
    occupation: Joi.string().allow(""),
    mentalHealthInfo: Joi.object({
      hasMentalIllness: Joi.boolean(),
      mentalIllnessDetails: Joi.string().allow(""),
      hasDepression: Joi.boolean(),
      hasAnxiety: Joi.boolean(),
      hasBipolarDisorder: Joi.boolean(),
      hasSchizophrenia: Joi.boolean(),
      hadMaternalStress: Joi.boolean(),
      hadAutoimmuneDuringPregnancy: Joi.boolean(),
      hadThyroidIssuesDuringPregnancy: Joi.boolean(),
    }),
  }).min(1); // At least one field must be provided

  const { error } = schema.validate(req.body);

  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
};
