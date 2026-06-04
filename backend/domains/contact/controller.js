// controllers/contact.controller.js
const { ApiError } = require("../shared/error-middleware");
const { Contact, ContactStatus } = require("./model");
const contactService = require("./service");
const logger = require("../../utils/logger");

/**
 * Submit a contact form
 * @route POST /contact
 * @access Public
 */
const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Create contact entry
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      status: ContactStatus.NEW,
    });

    await contact.save();

    // Send notification to admin
    await contactService.sendContactNotification(contact);

    // Send confirmation to user
    await contactService.sendConfirmationEmail({
      name,
      email,
      subject,
    });

    res.status(201).json({
      success: true,
      message: "Your message has been received. We will get back to you soon.",
      contactId: contact._id,
    });
  } catch (error) {
    logger.error("Contact form submission error:", error);
    next(new ApiError(500, "Could not submit contact form"));
  }
};

/**
 * Get all contact submissions
 * @route GET /contact
 * @access Admin
 */
const getContactSubmissions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, sort = "-createdAt" } = req.query;

    // Build filters
    const filter = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    // Count total matching documents
    const total = await Contact.countDocuments(filter);

    // Parse sort field and direction
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortOptions = { [sortField]: sortDirection };

    // Get paginated contacts
    const contacts = await Contact.find(filter)
      .populate("assignedTo", "firstName lastName")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      items: contacts,
      total,
      page: Number(page),
      size: Number(limit),
    });
  } catch (error) {
    logger.error("Get contacts error:", error);
    next(new ApiError(500, "Could not fetch contact submissions"));
  }
};

/**
 * Get a single contact submission
 * @route GET /contact/:id
 * @access Admin
 */
const getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate("assignedTo", "firstName lastName")
      .populate("replies.responder", "firstName lastName");

    if (!contact) {
      return next(new ApiError(404, "Contact submission not found"));
    }

    res.json(contact);
  } catch (error) {
    logger.error("Get contact error:", error);
    next(new ApiError(500, "Could not fetch contact submission"));
  }
};

/**
 * Update contact status
 * @route PUT /contact/:id/status
 * @access Admin
 */
const updateContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ApiError(404, "Contact submission not found"));
    }

    contact.status = status;
    await contact.save();

    res.json(contact);
  } catch (error) {
    logger.error("Update contact status error:", error);
    next(new ApiError(500, "Could not update contact status"));
  }
};

/**
 * Assign contact to admin
 * @route PUT /contact/:id/assign
 * @access Admin
 */
const assignContact = async (req, res, next) => {
  try {
    const { adminId } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ApiError(404, "Contact submission not found"));
    }

    contact.assignedTo = adminId || req.user._id;
    await contact.save();

    await contact.populate("assignedTo", "firstName lastName");

    res.json(contact);
  } catch (error) {
    logger.error("Assign contact error:", error);
    next(new ApiError(500, "Could not assign contact"));
  }
};

/**
 * Add a reply to a contact
 * @route POST /contact/:id/reply
 * @access Admin
 */
const replyToContact = async (req, res, next) => {
  try {
    const { message } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ApiError(404, "Contact submission not found"));
    }

    // Add reply
    contact.replies.push({
      responder: req.user._id,
      message,
      sentAt: Date.now(),
    });

    // Update status to replied
    contact.status = ContactStatus.REPLIED;

    await contact.save();

    // Send email to contact with the reply
    await contactService.sendReplyEmail({
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message,
      responder: `${req.user.firstName} ${req.user.lastName}`,
    });

    await contact.populate("replies.responder", "firstName lastName");

    res.status(201).json(contact);
  } catch (error) {
    logger.error("Reply to contact error:", error);
    next(new ApiError(500, "Could not send reply"));
  }
};

/**
 * Delete a contact
 * @route DELETE /contact/:id
 * @access Admin
 */
const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ApiError(404, "Contact submission not found"));
    }

    // Soft delete
    contact.isDeleted = true;
    contact.deletedAt = Date.now();
    await contact.save();

    res.status(204).json({});
  } catch (error) {
    logger.error("Delete contact error:", error);
    next(new ApiError(500, "Could not delete contact"));
  }
};

module.exports = {
  submitContactForm,
  getContactSubmissions,
  getContactById,
  updateContactStatus,
  assignContact,
  replyToContact,
  deleteContact,
};
