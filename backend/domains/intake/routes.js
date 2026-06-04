const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect, optionalAuth } = require("../auth/middleware");
const Intake = require("../intake/model");

/**
 * @route   POST /api/intake
 * @desc    Create a new intake document
 * @access  Private (changed from Public - intakes should be associated with authenticated users)
 */
router.post("/", protect, async (req, res) => {
  try {
    // Validate required fields
    const { childName, age, parentName, parentEmail, dataConsent } = req.body;

    if (!childName || !age || !parentName || !parentEmail || !dataConsent) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Ensure the intake is associated with the authenticated user
    req.body.userId = req.user._id;

    // Create new intake document
    const intake = new Intake(req.body);
    await intake.save();

    res.status(201).json({
      success: true,
      message: "Intake information saved successfully",
      intakeId: intake._id,
    });
  } catch (error) {
    console.error("Error creating intake:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error saving intake information",
    });
  }
});

/**
 * @route   GET /api/intake
 * @desc    Get all intakes for the current user
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    const intakes = await Intake.find({ userId: req.user._id })
      .select("childName age gender createdAt status")
      .sort("-createdAt");

    res.json({
      success: true,
      intakes,
    });
  } catch (error) {
    console.error("Error fetching intakes:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching intake information",
    });
  }
});

/**
 * @route   GET /api/intake/:id
 * @desc    Get an intake by ID
 * @access  Private (changed from Public - only allow access to own intakes)
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intake ID format",
      });
    }

    // Find intake and ensure it belongs to the authenticated user
    const intake = await Intake.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!intake) {
      return res.status(404).json({
        success: false,
        message: "Intake not found or you do not have access to it",
      });
    }

    res.json({
      success: true,
      intake,
    });
  } catch (error) {
    console.error(`Error fetching intake with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching intake information",
    });
  }
});

/**
 * @route   PUT /api/intake/:id
 * @desc    Update an intake
 * @access  Private
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intake ID format",
      });
    }

    // Find intake and ensure it belongs to the authenticated user
    const intake = await Intake.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!intake) {
      return res.status(404).json({
        success: false,
        message: "Intake not found or you do not have access to it",
      });
    }

    // Update intake (prevent userId changes)
    Object.keys(req.body).forEach((key) => {
      if (key !== "userId" && key !== "_id") {
        intake[key] = req.body[key];
      }
    });

    await intake.save();

    res.json({
      success: true,
      message: "Intake updated successfully",
      intake,
    });
  } catch (error) {
    console.error(`Error updating intake with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating intake information",
    });
  }
});

/**
 * @route   DELETE /api/intake/:id
 * @desc    Delete an intake
 * @access  Private
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intake ID format",
      });
    }

    // Find intake and ensure it belongs to the authenticated user
    const intake = await Intake.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!intake) {
      return res.status(404).json({
        success: false,
        message: "Intake not found or you do not have access to it",
      });
    }

    // Delete the intake
    await Intake.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Intake deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting intake with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting intake",
    });
  }
});

module.exports = router;


