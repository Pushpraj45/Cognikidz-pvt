// validators/childprofile.validator.js
const Joi = require("joi");
const { ApiError } = require("../shared/error-middleware");
const logger = require("../../utils/logger");

/**
 * Middleware to validate child profile creation
 */
const validateCreateProfile = (req, res, next) => {
  // Pre-process FormData concerns before validation
  if (req.body) {
    // Handle FormData concerns format (concerns[0], concerns[1], etc.)
    const concernKeys = Object.keys(req.body).filter(
      (key) => key.startsWith("concerns[") && key.endsWith("]")
    );

    if (concernKeys.length > 0) {
      // Extract concerns from FormData format and create array
      const concernsArray = concernKeys
        .map((key) => req.body[key])
        .filter((concern) => concern && concern.trim());

      // Remove individual concern fields and add as array
      concernKeys.forEach((key) => delete req.body[key]);
      req.body.concerns = concernsArray;
    }

    // Handle complex object fields that might be JSON strings
    ["familyHistory", "environmentalFactors", "schoolRecords"].forEach(
      (field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            // If parsing fails, leave as string - validator will catch it
          }
        }
      }
    );
  }

  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).required().messages({
      "string.empty": "First name is required",
      "string.min": "First name must be at least 1 character long",
      "any.required": "First name is required",
    }),
    lastName: Joi.string().trim().allow("").messages({
      "string.base": "Last name must be a string",
    }),
    dateOfBirth: Joi.date().max("now").required().messages({
      "date.base": "Date of birth must be a valid date",
      "date.max": "Date of birth cannot be in the future",
      "any.required": "Date of birth is required",
    }),
    gender: Joi.string()
      .valid("male", "female", "other", "prefer_not_to_say")
      .required()
      .messages({
        "any.only":
          "Gender must be one of: male, female, other, or prefer_not_to_say",
        "any.required": "Gender is required",
      }),
    grade: Joi.string().allow("").messages({
      "string.base": "Grade must be a string",
    }),
    languages: Joi.alternatives()
      .try(Joi.string().allow(""), Joi.array().items(Joi.string()))
      .messages({
        "alternatives.match": "Languages must be a string or array of strings",
      }),
    // Fix concerns validation - should be array of enum values or comma-separated string
    concerns: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.string().valid(
            "adhd",
            "autism",
            "dyslexia",
            "communication",
            "motor_skills",
            "social",
            "behavior",
            "other"
          )
        ),
        Joi.string().allow("") // Allow comma-separated string that will be split later
      )
      .optional()
      .messages({
        "alternatives.match": "Concerns must be valid concern types",
        "any.only":
          "Each concern must be one of: adhd, autism, dyslexia, communication, motor_skills, social, behavior, other",
      }),
    otherConcern: Joi.string().allow("").messages({
      "string.base": "Other concern must be a string",
    }),
    diagnosis_details: Joi.string().allow("").messages({
      "string.base": "Diagnosis details must be a string",
    }),
    notes: Joi.string().allow("").messages({
      "string.base": "Notes must be a string",
    }),
    avatar: Joi.alternatives()
      .try(
        Joi.string().allow(""),
        Joi.any() // Allow file upload
      )
      .messages({
        "alternatives.match": "Avatar must be a string or file",
      }),
    photo: Joi.any().messages({
      "any.unknown": "Photo field is allowed",
    }),
    parent_id: Joi.string().allow("").messages({
      "string.base": "Parent ID must be a string",
    }),
    parental_consent: Joi.boolean().truthy().messages({
      "boolean.base": "Parental consent must be true or false",
      "any.only": "Parental consent is required to create a child profile",
    }),
    // Enhanced diagnoses field (mapped to concerns)
    diagnoses: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.string().valid(
            "adhd",
            "autism",
            "dyslexia",
            "communication",
            "motor_skills",
            "social",
            "behavior",
            "other"
          )
        ),
        Joi.object().pattern(Joi.string(), Joi.boolean()),
        Joi.string().allow("")
      )
      .messages({
        "alternatives.match": "Diagnoses must be valid diagnosis types",
      }),
    // Family History validation with better error messages
    familyHistory: Joi.object({
      adhd: Joi.boolean().messages({
        "boolean.base": "ADHD family history must be true or false",
      }),
      autism: Joi.boolean().messages({
        "boolean.base": "Autism family history must be true or false",
      }),
      dyslexia: Joi.boolean().messages({
        "boolean.base": "Dyslexia family history must be true or false",
      }),
      learningIssues: Joi.boolean().messages({
        "boolean.base": "Learning issues history must be true or false",
      }),
      otherConditions: Joi.string().allow("").messages({
        "string.base": "Other conditions must be a string",
      }),
    }).messages({
      "object.base": "Family history must be an object with valid fields",
    }),
    // Environmental Factors validation with better error messages
    environmentalFactors: Joi.object({
      traumaHistory: Joi.boolean().messages({
        "boolean.base": "Trauma history must be true or false",
      }),
      traumaDetails: Joi.string().allow("").messages({
        "string.base": "Trauma details must be a string",
      }),
      screenTimeHours: Joi.number().min(0).max(24).messages({
        "number.base": "Screen time hours must be a number",
        "number.min": "Screen time hours cannot be negative",
        "number.max": "Screen time hours cannot exceed 24",
      }),
      parentingStyle: Joi.string()
        .valid(
          "authoritative",
          "authoritarian",
          "permissive",
          "uninvolved",
          "other"
        )
        .messages({
          "any.only":
            "Parenting style must be one of: authoritative, authoritarian, permissive, uninvolved, or other",
        }),
    }).messages({
      "object.base":
        "Environmental factors must be an object with valid fields",
    }),
    // School Records validation with better error messages
    schoolRecords: Joi.object({
      academicPerformance: Joi.string()
        .valid(
          "excellent",
          "good",
          "average",
          "below_average",
          "poor",
          "unknown"
        )
        .messages({
          "any.only":
            "Academic performance must be one of: excellent, good, average, below_average, poor, or unknown",
        }),
      learningDifficulties: Joi.boolean().messages({
        "boolean.base": "Learning difficulties must be true or false",
      }),
      attentionIssues: Joi.boolean().messages({
        "boolean.base": "Attention issues must be true or false",
      }),
      schoolNotes: Joi.string().allow("").messages({
        "string.base": "School notes must be a string",
      }),
    }).messages({
      "object.base": "School records must be an object with valid fields",
    }),
  });

  const { error } = schema.validate(req.body, {
    allowUnknown: true, // Allow additional fields for flexibility
    stripUnknown: false, // Keep unknown fields for debugging
  });

  if (error) {
    const errorMessage = error.details[0].message;
    console.error("Child profile validation error:", {
      error: errorMessage,
      field: error.details[0].path,
      value: error.details[0].context?.value,
      body: req.body,
    });
    return next(new ApiError(400, errorMessage));
  }

  next();
};

/**
 * Middleware to validate child profile update
 */
const validateUpdateProfile = (req, res, next) => {
  // Pre-process FormData concerns before validation (same as create)
  if (req.body) {
    // Handle FormData concerns format (concerns[0], concerns[1], etc.)
    const concernKeys = Object.keys(req.body).filter(
      (key) => key.startsWith("concerns[") && key.endsWith("]")
    );

    if (concernKeys.length > 0) {
      // Extract concerns from FormData format and create array
      const concernsArray = concernKeys
        .map((key) => req.body[key])
        .filter((concern) => concern && concern.trim());

      // Remove individual concern fields and add as array
      concernKeys.forEach((key) => delete req.body[key]);
      req.body.concerns = concernsArray;
    }

    // Handle complex object fields that might be JSON strings
    ["familyHistory", "environmentalFactors", "schoolRecords"].forEach(
      (field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            // If parsing fails, leave as string - validator will catch it
          }
        }
      }
    );
  }

  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).messages({
      "string.empty": "First name cannot be empty",
      "string.min": "First name must be at least 1 character long",
    }),
    lastName: Joi.string().trim().allow("").messages({
      "string.base": "Last name must be a string",
    }),
    dateOfBirth: Joi.date().max("now").messages({
      "date.base": "Date of birth must be a valid date",
      "date.max": "Date of birth cannot be in the future",
    }),
    gender: Joi.string()
      .valid("male", "female", "other", "prefer_not_to_say")
      .messages({
        "any.only":
          "Gender must be one of: male, female, other, or prefer_not_to_say",
      }),
    grade: Joi.string().allow("").messages({
      "string.base": "Grade must be a string",
    }),
    languages: Joi.alternatives()
      .try(Joi.string().allow(""), Joi.array().items(Joi.string()))
      .messages({
        "alternatives.match": "Languages must be a string or array of strings",
      }),
    // Fix concerns validation for updates too
    concerns: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.string().valid(
            "adhd",
            "autism",
            "dyslexia",
            "communication",
            "motor_skills",
            "social",
            "behavior",
            "other"
          )
        ),
        Joi.string().allow("")
      )
      .messages({
        "alternatives.match": "Concerns must be valid concern types",
        "any.only":
          "Each concern must be one of: adhd, autism, dyslexia, communication, motor_skills, social, behavior, other",
      }),
    otherConcern: Joi.string().allow("").messages({
      "string.base": "Other concern must be a string",
    }),
    diagnosis_details: Joi.string().allow("").messages({
      "string.base": "Diagnosis details must be a string",
    }),
    notes: Joi.string().allow("").messages({
      "string.base": "Notes must be a string",
    }),
    avatar: Joi.alternatives().try(Joi.string().allow(""), Joi.any()).messages({
      "alternatives.match": "Avatar must be a string or file",
    }),
    photo: Joi.any().messages({
      "any.unknown": "Photo field is allowed",
    }),
    parent_id: Joi.string().allow("").messages({
      "string.base": "Parent ID must be a string",
    }),
    parental_consent: Joi.boolean().messages({
      "boolean.base": "Parental consent must be true or false",
    }),
    // Enhanced diagnoses field (mapped to concerns) for updates
    diagnoses: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.string().valid(
            "adhd",
            "autism",
            "dyslexia",
            "communication",
            "motor_skills",
            "social",
            "behavior",
            "other"
          )
        ),
        Joi.object().pattern(Joi.string(), Joi.boolean()),
        Joi.string().allow("")
      )
      .messages({
        "alternatives.match": "Diagnoses must be valid diagnosis types",
      }),
    // Family History validation with better error messages
    familyHistory: Joi.object({
      adhd: Joi.boolean().messages({
        "boolean.base": "ADHD family history must be true or false",
      }),
      autism: Joi.boolean().messages({
        "boolean.base": "Autism family history must be true or false",
      }),
      dyslexia: Joi.boolean().messages({
        "boolean.base": "Dyslexia family history must be true or false",
      }),
      learningIssues: Joi.boolean().messages({
        "boolean.base": "Learning issues history must be true or false",
      }),
      otherConditions: Joi.string().allow("").messages({
        "string.base": "Other conditions must be a string",
      }),
    }).messages({
      "object.base": "Family history must be an object with valid fields",
    }),
    // Environmental Factors validation with better error messages
    environmentalFactors: Joi.object({
      traumaHistory: Joi.boolean().messages({
        "boolean.base": "Trauma history must be true or false",
      }),
      traumaDetails: Joi.string().allow("").messages({
        "string.base": "Trauma details must be a string",
      }),
      screenTimeHours: Joi.number().min(0).max(24).messages({
        "number.base": "Screen time hours must be a number",
        "number.min": "Screen time hours cannot be negative",
        "number.max": "Screen time hours cannot exceed 24",
      }),
      parentingStyle: Joi.string()
        .valid(
          "authoritative",
          "authoritarian",
          "permissive",
          "uninvolved",
          "other"
        )
        .messages({
          "any.only":
            "Parenting style must be one of: authoritative, authoritarian, permissive, uninvolved, or other",
        }),
    }).messages({
      "object.base":
        "Environmental factors must be an object with valid fields",
    }),
    // School Records validation with better error messages
    schoolRecords: Joi.object({
      academicPerformance: Joi.string()
        .valid(
          "excellent",
          "good",
          "average",
          "below_average",
          "poor",
          "unknown"
        )
        .messages({
          "any.only":
            "Academic performance must be one of: excellent, good, average, below_average, poor, or unknown",
        }),
      learningDifficulties: Joi.boolean().messages({
        "boolean.base": "Learning difficulties must be true or false",
      }),
      attentionIssues: Joi.boolean().messages({
        "boolean.base": "Attention issues must be true or false",
      }),
      schoolNotes: Joi.string().allow("").messages({
        "string.base": "School notes must be a string",
      }),
    }).messages({
      "object.base": "School records must be an object with valid fields",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    logger.error("Child profile update validation error:", {
      error: error.details[0].message,
      field: error.details.map((detail) => detail.path),
      value: error.details[0].context?.value,
      body: req.body,
    });
    return next(new ApiError(400, error.details[0].message));
  }

  next();
};

module.exports = {
  validateCreateProfile,
  validateUpdateProfile,
};
