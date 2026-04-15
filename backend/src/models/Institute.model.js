const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  adminIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    requireApproval: {
      type: Boolean,
      default: true
    },
    allowStudentRegistration: {
      type: Boolean,
      default: true
    },
    allowFacultyRegistration: {
      type: Boolean,
      default: true
    },
    allowEmployerRegistration: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
instituteSchema.index({ code: 1 });
instituteSchema.index({ domain: 1 });

module.exports = mongoose.model('Institute', instituteSchema);
