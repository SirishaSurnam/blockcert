const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper function to determine default status based on role
const getDefaultStatus = function() {
  // Employers don't need approval, students and faculty do
  if (this.role === 'employer') return 'approved';
  if (this.role === 'admin') return 'approved';
  return 'pending';
};

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    walletAddress: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
    },
    hasRealWallet: {
      type: Boolean,
      default: false, // false = auto-generated, true = connected real wallet
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'issuer', 'admin', 'employer'],
      required: true,
    },
    // Approval status: pending, approved, rejected
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: function() { return getDefaultStatus.call(this); }
    },
    // Institute reference (required for students and faculty)
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute'
    },
    instituteName: {
      type: String,
      default: ''
    },
    // College code - for admin to define, for students/faculty to use
    instituteCode: {
      type: String,
      default: '',
      uppercase: true
    },
    // Approval tracking
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    profile: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      did: String,
      department: String,
      bio: String,
      avatar: String,
      preferredCareerPath: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    didRegistered: { type: Boolean, default: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Get full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.profile?.firstName || ''} ${this.profile?.lastName || ''}`.trim();
});

module.exports = mongoose.model('User', userSchema);