// controllers/childprofile.controller.js
const { ApiError } = require("../shared/error-middleware");
const ChildProfile = require("../childprofile/model");
const childprofileService = require("./service");
const logger = require("../../utils/logger");

/**
 * Helper function to process concerns/diagnoses data
 */
const processConcernsData = (data) => {
  let concerns = [];

  // Handle different possible sources of concerns data
  if (data.concerns) {
    if (Array.isArray(data.concerns)) {
      concerns = data.concerns;
    } else if (typeof data.concerns === "string" && data.concerns.trim()) {
      // Split comma-separated string and clean up
      concerns = data.concerns
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
    }
  }

  // Handle diagnoses field (mapped to concerns)
  if (data.diagnoses) {
    if (Array.isArray(data.diagnoses)) {
      concerns = [...concerns, ...data.diagnoses];
    } else if (typeof data.diagnoses === "object") {
      // Handle object format {adhd: true, autism: false, ...}
      const diagnosesArray = Object.entries(data.diagnoses)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      concerns = [...concerns, ...diagnosesArray];
    } else if (typeof data.diagnoses === "string" && data.diagnoses.trim()) {
      const diagnosesArray = data.diagnoses
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
      concerns = [...concerns, ...diagnosesArray];
    }
  }

  // Handle FormData concerns (when concerns are sent as individual fields)
  // This happens when we send concerns[0], concerns[1], etc.
  const concernKeys = Object.keys(data).filter(
    (key) => key.startsWith("concerns[") && key.endsWith("]")
  );
  if (concernKeys.length > 0) {
    const formDataConcerns = concernKeys
      .map((key) => data[key])
      .filter((c) => c && c.trim());
    concerns = [...concerns, ...formDataConcerns];
  }

  // Remove duplicates and validate against allowed values
  const allowedConcerns = [
    "adhd",
    "autism",
    "dyslexia",
    "communication",
    "motor_skills",
    "social",
    "behavior",
    "other",
  ];

  concerns = [...new Set(concerns)].filter((concern) => {
    if (!allowedConcerns.includes(concern)) {
      logger.warn(
        `Invalid concern removed: ${concern}. Allowed values: ${allowedConcerns.join(
          ", "
        )}`
      );
      return false;
    }
    return true;
  });

  return concerns;
};

/**
 * Helper function to validate child age
 */
const validateChildAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(birthDate.getTime())) {
    throw new ApiError(400, "Invalid date of birth format");
  }

  if (birthDate > today) {
    throw new ApiError(400, "Date of birth cannot be in the future");
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const adjustedAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;

  if (adjustedAge < 1) {
    throw new ApiError(400, "Child must be at least 1 year old");
  }

  if (adjustedAge > 16) {
    throw new ApiError(400, "Child cannot be more than 16 years old");
  }

  return adjustedAge;
};

/**
 * Create a new child profile
 * @route POST /childprofile
 * @access Private
 */
const createChildProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      grade,
      languages,
      concerns,
      diagnoses,
      otherConcern,
      diagnosis_details,
      notes,
      parental_consent,
      familyHistory,
      environmentalFactors,
      schoolRecords,
    } = req.body;

    logger.info("Creating child profile", {
      firstName,
      gender,
      hasFile: !!req.file,
      concerns,
    });

    let avatar = null;

    // Handle file upload if avatar is provided as a file
    if (req.file) {
      logger.info("Uploading avatar file:", req.file.originalname);
      avatar = await childprofileService.uploadImage(req.file);
      logger.info("Avatar uploaded successfully:", avatar);
    } else if (req.body.avatar) {
      // If avatar is provided as a string (predefined avatar)
      avatar = req.body.avatar;
    } else if (req.body.photo) {
      // If photo is provided as a fallback
      avatar = req.body.photo;
    }

    // Enhanced validation
    if (!firstName || firstName.trim().length === 0) {
      return next(
        new ApiError(400, "First name is required and cannot be empty")
      );
    }

    if (!dateOfBirth) {
      return next(new ApiError(400, "Date of birth is required"));
    }

    if (!gender) {
      return next(new ApiError(400, "Gender is required"));
    }

    // Validate child age
    validateChildAge(dateOfBirth);

    // Validate parental consent
    if (!parental_consent) {
      return next(
        new ApiError(
          400,
          "Parental consent is required to create a child profile"
        )
      );
    }

    // Process concerns data
    const processedConcerns = processConcernsData({ concerns, diagnoses });

    // Prepare child data for database
    const childData = {
      firstName: firstName.trim(),
      lastName: lastName && lastName.trim() ? lastName.trim() : null, // Use null instead of undefined
      dateOfBirth: new Date(dateOfBirth),
      gender: gender.toLowerCase(),
      grade: grade || "",
      languages:
        typeof languages === "string"
          ? languages
          : Array.isArray(languages)
          ? languages.join(", ")
          : "",
      concerns: processedConcerns,
      otherConcern: otherConcern || "",
      diagnosis_details: diagnosis_details || "",
      notes: notes || "",
      avatar,
      parent: req.user.id,
      parental_consent: true,
      familyHistory: familyHistory || {},
      environmentalFactors: environmentalFactors || {},
      schoolRecords: schoolRecords || {},
    };

    // Create the child profile
    const newChild = new ChildProfile(childData);
    const savedChild = await newChild.save();

    logger.info("Child profile created successfully", {
      childId: savedChild._id,
      firstName: savedChild.firstName,
      parentId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Child profile created successfully",
      data: savedChild,
    });
  } catch (error) {
    logger.error("Create child profile error:", error);

    // Handle specific MongoDB validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => {
        if (err.kind === "enum") {
          const allowedValues = err.properties.enumValues;
          return `${err.path}: "${
            err.value
          }" is not valid. Allowed values are: ${allowedValues.join(", ")}`;
        }
        return err.message;
      });
      return next(
        new ApiError(400, `Validation failed: ${messages.join("; ")}`)
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return next(
        new ApiError(
          400,
          "A child profile with this information already exists"
        )
      );
    }

    // Pass other errors to error handler
    next(error);
  }
};

/**
 * Get all child profiles for current user
 * @route GET /childprofile
 * @access Private
 */
const getChildProfiles = async (req, res, next) => {
  try {
    const childProfiles = await ChildProfile.find({
      parent: req.user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    logger.info(
      `Retrieved ${childProfiles.length} child profiles for user: ${req.user.email}`
    );
    res.json(childProfiles);
  } catch (error) {
    logger.error("Get child profiles error:", error);
    next(new ApiError(500, "Could not fetch child profiles"));
  }
};

/**
 * Get a single child profile
 * @route GET /childprofile/:id
 * @access Private
 */
const getChildProfileById = async (req, res, next) => {
  try {
    const childProfile = await ChildProfile.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!childProfile) {
      return next(new ApiError(404, "Child profile not found"));
    }

    // Check if user is parent of this profile or admin
    if (
      childProfile.parent.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      logger.warn(
        `Unauthorized access attempt to child profile ${req.params.id} by user ${req.user.email}`
      );
      return next(
        new ApiError(403, "Not authorized to access this child profile")
      );
    }

    logger.info(
      `Child profile ${req.params.id} accessed by user: ${req.user.email}`
    );
    res.json(childProfile);
  } catch (error) {
    logger.error("Get child profile error:", error);
    next(new ApiError(500, "Could not fetch child profile"));
  }
};

/**
 * Update a child profile
 * @route PUT /childprofile/:id
 * @access Private
 */
const updateChildProfile = async (req, res, next) => {
  try {
    logger.info("Update child profile request:", {
      params: req.params,
      body: req.body,
      hasFile: !!req.file,
      fileDetails: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
    });

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      grade,
      languages,
      concerns,
      otherConcern,
      diagnosis_details,
      notes,
      parental_consent,
      familyHistory,
      environmentalFactors,
      schoolRecords,
    } = req.body;

    const childProfile = await ChildProfile.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!childProfile) {
      return next(new ApiError(404, "Child profile not found"));
    }

    // Check if user is parent of this profile or admin
    if (
      childProfile.parent.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      logger.warn(
        `Unauthorized update attempt to child profile ${req.params.id} by user ${req.user.email}`
      );
      return next(
        new ApiError(403, "Not authorized to update this child profile")
      );
    }

    logger.info("Processing avatar update:", {
      hasFile: !!req.file,
      bodyAvatar: req.body.avatar,
      bodyPhoto: req.body.photo,
      currentAvatar: childProfile.avatar,
    });

    // Handle file upload if avatar is provided as a file
    if (req.file) {
      logger.info(
        "Processing file upload for avatar update:",
        req.file.originalname
      );
      // Delete old avatar if exists and is a file URL (not a predefined avatar)
      if (childProfile.avatar && childProfile.avatar.startsWith("/")) {
        logger.info("Deleting old avatar:", childProfile.avatar);
        await childprofileService.deleteImage(childProfile.avatar);
      }

      childProfile.avatar = await childprofileService.uploadImage(req.file);
      logger.info("Avatar updated successfully:", childProfile.avatar);
    } else if (req.body.avatar && req.body.avatar !== childProfile.avatar) {
      // If avatar is provided as a string (predefined avatar)
      // and it's different from the current one
      logger.info("Using predefined avatar for update:", req.body.avatar);

      // Delete old avatar if exists and is a file URL (not a predefined avatar)
      if (childProfile.avatar && childProfile.avatar.startsWith("/")) {
        logger.info("Deleting old avatar for predefined:", childProfile.avatar);
        await childprofileService.deleteImage(childProfile.avatar);
      }

      childProfile.avatar = req.body.avatar;
    } else if (req.body.photo && req.body.photo !== childProfile.avatar) {
      // If photo is provided as a fallback and it's different from the current avatar
      logger.info("Using photo as avatar for update:", req.body.photo);

      // Delete old avatar if exists and is a file URL (not a predefined avatar)
      if (childProfile.avatar && childProfile.avatar.startsWith("/")) {
        logger.info("Deleting old avatar for photo:", childProfile.avatar);
        await childprofileService.deleteImage(childProfile.avatar);
      }

      childProfile.avatar = req.body.photo;
    } else {
      logger.info("No avatar changes detected");
    }

    logger.info("Updating child profile fields...");

    // Update fields
    childProfile.firstName = firstName || childProfile.firstName;
    childProfile.lastName = lastName || childProfile.lastName;
    childProfile.dateOfBirth = dateOfBirth || childProfile.dateOfBirth;
    childProfile.gender = gender || childProfile.gender;
    childProfile.grade = grade !== undefined ? grade : childProfile.grade;
    childProfile.languages =
      languages !== undefined ? languages : childProfile.languages;

    // Process concerns data properly using the existing helper function
    if (concerns !== undefined) {
      logger.info("Processing concerns for update:", {
        concerns,
        type: typeof concerns,
      });
      const processedConcerns = processConcernsData({ concerns });
      logger.info("Processed concerns result:", processedConcerns);
      childProfile.concerns = processedConcerns;
    }

    childProfile.otherConcern =
      otherConcern !== undefined ? otherConcern : childProfile.otherConcern;
    childProfile.diagnosis_details =
      diagnosis_details !== undefined
        ? diagnosis_details
        : childProfile.diagnosis_details;
    childProfile.notes = notes !== undefined ? notes : childProfile.notes;
    childProfile.parental_consent =
      parental_consent !== undefined
        ? parental_consent
        : childProfile.parental_consent;

    // Update new fields
    if (familyHistory) {
      childProfile.familyHistory = {
        ...childProfile.familyHistory,
        ...familyHistory,
      };
    }

    if (environmentalFactors) {
      childProfile.environmentalFactors = {
        ...childProfile.environmentalFactors,
        ...environmentalFactors,
      };
    }

    if (schoolRecords) {
      childProfile.schoolRecords = {
        ...childProfile.schoolRecords,
        ...schoolRecords,
      };
    }

    logger.info("Saving updated child profile...");
    await childProfile.save();

    logger.info(
      `Child profile ${req.params.id} updated successfully by user: ${req.user.email}`
    );

    res.json(childProfile);
  } catch (error) {
    logger.error("Update child profile error:", error.message);
    logger.error("Error stack:", error.stack);
    next(new ApiError(500, "Could not update child profile"));
  }
};

/**
 * Delete a child profile
 * @route DELETE /childprofile/:id
 * @access Private
 */
const deleteChildProfile = async (req, res, next) => {
  try {
    const childProfile = await ChildProfile.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!childProfile) {
      return next(new ApiError(404, "Child profile not found"));
    }

    // Check if user is parent of this profile or admin
    if (
      childProfile.parent.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      logger.warn(
        `Unauthorized delete attempt to child profile ${req.params.id} by user ${req.user.email}`
      );
      return next(
        new ApiError(403, "Not authorized to delete this child profile")
      );
    }

    // Soft delete
    childProfile.isDeleted = true;
    childProfile.deletedAt = Date.now();
    await childProfile.save();

    logger.info(
      `Child profile ${req.params.id} deleted by user: ${req.user.email}`
    );

    res.status(204).json({});
  } catch (error) {
    logger.error("Delete child profile error:", error);
    next(new ApiError(500, "Could not delete child profile"));
  }
};

module.exports = {
  createChildProfile,
  getChildProfiles,
  getChildProfileById,
  updateChildProfile,
  deleteChildProfile,
};
