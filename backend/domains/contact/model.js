// models/contact.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define contact status enum
const ContactStatus = {
  NEW: 'new',
  REPLIED: 'replied',
  CLOSED: 'closed',
  SPAM: 'spam'
};

const contactSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ContactStatus),
    default: ContactStatus.NEW
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  replies: [{
    responder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = {
  Contact,
  ContactStatus
}; 