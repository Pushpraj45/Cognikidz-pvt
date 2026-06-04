const { body, validationResult } = require("express-validator");

// Ultra-minimal validation - only email required, everything else is accepted as-is
const feedbackValidationRules = () => {
  return [
    // Only validate email
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
  ];
};

// Only check email - ignore all other validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {


    // Only fail on email validation errors
    const emailErrors = errors.array().filter((error) => {
      return error.path === "email" && error.msg.includes("email");
    });

    if (emailErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
        errors: emailErrors,
      });
    }
  }

  // All validation passed or ignored
  next();
};

module.exports = {
  feedbackValidationRules,
  handleValidationErrors,
};
