const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
  studentAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: {
    type: String,
    default: 'Anonymous'
  },
  
  // Scores
  totalScore: { type: Number, default: 0 },
  credentialScore: { type: Number, default: 0 },
  badgeScore: { type: Number, default: 0 },
  skillScore: { type: Number, default: 0 },
  endorsementScore: { type: Number, default: 0 },
  
  // Counts
  totalCredentials: { type: Number, default: 0 },
  totalBadges: { type: Number, default: 0 },
  totalEndorsements: { type: Number, default: 0 },
  uniqueSkills: { type: Number, default: 0 },
  
  // Rankings
  globalRank: { type: Number, default: 0 },
  departmentRank: { type: Number, default: 0 },
  previousRank: { type: Number, default: 0 },
  
  // Categories
  department: String,
  batch: String,
  
  // Streaks
  streakDays: { type: Number, default: 0 },
  lastActiveDate: Date,
  
  // Time period
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all-time'],
    default: 'all-time'
  },
  
  lastCalculated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound indexes
leaderboardEntrySchema.index({ period: 1, totalScore: -1 });
leaderboardEntrySchema.index({ department: 1, departmentRank: 1 });

leaderboardEntrySchema.statics.getTopPerformers = async function(limit = 10, period = 'all-time') {
  return this.find({ period })
    .sort({ totalScore: -1 })
    .limit(limit)
    .populate('studentId', 'profile.firstName profile.lastName email walletAddress');
};

leaderboardEntrySchema.statics.getByCategory = async function(category, limit = 10, period = 'all-time') {
  const sortField = `${category}Score`;
  return this.find({ period })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('studentId', 'profile.firstName profile.lastName walletAddress');
};

leaderboardEntrySchema.statics.getStudentRank = async function(studentAddress, period = 'all-time') {
  const entry = await this.findOne({ 
    studentAddress: studentAddress.toLowerCase(),
    period 
  });
  return entry ? entry.globalRank : null;
};

leaderboardEntrySchema.statics.recalculateRanks = async function(period = 'all-time') {
  const entries = await this.find({ period }).sort({ totalScore: -1 });
  
  for (let i = 0; i < entries.length; i++) {
    entries[i].previousRank = entries[i].globalRank;
    entries[i].globalRank = i + 1;
    entries[i].lastCalculated = new Date();
    await entries[i].save();
  }
  
  return entries.length;
};

leaderboardEntrySchema.methods.calculateScore = function() {
  this.credentialScore = this.totalCredentials * 10;
  this.badgeScore = this.totalBadges * 25;
  this.skillScore = this.uniqueSkills * 5;
  this.endorsementScore = this.totalEndorsements * 15;
  
  this.totalScore = (
    this.credentialScore +
    this.badgeScore +
    this.skillScore +
    this.endorsementScore
  );
  
  this.lastCalculated = new Date();
  return this.totalScore;
};

module.exports = mongoose.model('Leaderboard', leaderboardEntrySchema);