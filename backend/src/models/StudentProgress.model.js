const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  studentAddress: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  
  credentialProgress: {
    total: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    revoked: { type: Number, default: 0 }
  },
  
  skillProgress: {
    total: { type: Number, default: 0 },
    beginner: { type: Number, default: 0 },
    intermediate: { type: Number, default: 0 },
    advanced: { type: Number, default: 0 },
    expert: { type: Number, default: 0 }
  },
  
  badgeProgress: {
    total: { type: Number, default: 0 },
    bronze: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    platinum: { type: Number, default: 0 }
  },
  
  endorsementProgress: {
    received: { type: Number, default: 0 },
    given: { type: Number, default: 0 },
    uniqueEndorsers: { type: Number, default: 0 }
  },
  
  learningPaths: [{
    pathId: String,
    name: String,
    totalSteps: { type: Number, default: 0 },
    completedSteps: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    startedAt: Date,
    lastActivityAt: Date,
    estimatedCompletion: Date,
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'paused'],
      default: 'not-started'
    }
  }],
  
  milestones: [{
    milestoneId: String,
    name: String,
    description: String,
    category: String,
    target: Number,
    current: { type: Number, default: 0 },
    achieved: { type: Boolean, default: false },
    achievedAt: Date,
    reward: { type: String, value: mongoose.Schema.Types.Mixed }
  }],
  
  activityTimeline: [{
    date: Date,
    type: {
      type: String,
      enum: ['credential', 'badge', 'endorsement', 'skill', 'milestone', 'login']
    },
    action: String,
    details: mongoose.Schema.Types.Mixed,
    xpEarned: { type: Number, default: 0 }
  }],
  
  weeklyStats: {
    credentialsAdded: { type: Number, default: 0 },
    badgesEarned: { type: Number, default: 0 },
    endorsementsReceived: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    weekStart: Date
  },
  
  monthlyStats: {
    credentialsAdded: { type: Number, default: 0 },
    badgesEarned: { type: Number, default: 0 },
    endorsementsReceived: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    monthStart: Date
  },
  
  goals: [{
    type: {
      type: String,
      enum: ['credential', 'badge', 'skill', 'endorsement', 'custom']
    },
    target: Number,
    current: { type: Number, default: 0 },
    deadline: Date,
    achieved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  xp: {
    total: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
    level: { type: Number, default: 1 }
  },
  
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: Date
  },
  
  predictions: {
    estimatedCompletionDate: Date,
    suggestedNextSteps: [String],
    skillGaps: [String],
    recommendedCredentials: [String],
    lastUpdated: Date
  },
  
  lastCalculated: { type: Date, default: Date.now }
}, { timestamps: true });

studentProgressSchema.index({ studentAddress: 1 });
studentProgressSchema.index({ 'milestones.achieved': 1 });

studentProgressSchema.methods.xpForLevel = function(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

studentProgressSchema.methods.calculateLevel = function() {
  let level = 1;
  let xpRequired = 100;
  let totalXp = this.xp.total;
  
  while (totalXp >= xpRequired) {
    totalXp -= xpRequired;
    level++;
    xpRequired = this.xpForLevel(level);
  }
  
  this.xp.level = level;
  this.xp.current = totalXp;
  return level;
};

studentProgressSchema.methods.addXP = function(amount, reason = '') {
  this.xp.total += amount;
  const oldLevel = this.xp.level;
  const newLevel = this.calculateLevel();
  
  if (newLevel > oldLevel) {
    this.milestones.push({
      milestoneId: `level-${newLevel}`,
      name: `Level ${newLevel} Achieved`,
      description: `Reached level ${newLevel}`,
      category: 'level',
      target: newLevel,
      current: newLevel,
      achieved: true,
      achievedAt: new Date()
    });
  }
  
  return { xp: this.xp.total, levelUp: newLevel > oldLevel, newLevel };
};

studentProgressSchema.methods.updateStreak = function() {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActivity = this.streaks.lastActivityDate 
    ? new Date(this.streaks.lastActivityDate).setHours(0, 0, 0, 0) 
    : null;
  
  if (!lastActivity) {
    this.streaks.currentStreak = 1;
  } else if (today - lastActivity === 86400000) {
    this.streaks.currentStreak++;
  } else if (today - lastActivity > 86400000) {
    this.streaks.currentStreak = 1;
  }
  
  this.streaks.longestStreak = Math.max(this.streaks.longestStreak, this.streaks.currentStreak);
  this.streaks.lastActivityDate = new Date();
  return this.streaks.currentStreak;
};

studentProgressSchema.methods.recordActivity = function(type, action, details = {}, xp = 0) {
  this.activityTimeline.push({
    date: new Date(),
    type,
    action,
    details,
    xpEarned: xp
  });
  
  if (xp > 0) this.addXP(xp);
  this.updateStreak();
  this.lastCalculated = new Date();
  return this.activityTimeline[this.activityTimeline.length - 1];
};

studentProgressSchema.methods.calculateOverallProgress = function() {
  const credentialWeight = 0.4;
  const skillWeight = 0.3;
  const badgeWeight = 0.2;
  const endorsementWeight = 0.1;
  
  const credentialScore = this.credentialProgress.total > 0 
    ? (this.credentialProgress.verified / this.credentialProgress.total) * 100 
    : 0;
  
  const skillScore = Math.min(this.skillProgress.total * 5, 100);
  const badgeScore = Math.min(this.badgeProgress.total * 10, 100);
  const endorsementScore = Math.min(this.endorsementProgress.received * 5, 100);
  
  this.overallProgress = Math.round(
    credentialScore * credentialWeight +
    skillScore * skillWeight +
    badgeScore * badgeWeight +
    endorsementScore * endorsementWeight
  );
  
  this.lastCalculated = new Date();
  return this.overallProgress;
};

studentProgressSchema.statics.getOrCreateForStudent = async function(studentAddress, studentId) {
  let progress = await this.findOne({ studentAddress: studentAddress.toLowerCase() });
  
  if (!progress) {
    progress = new this({
      studentAddress: studentAddress.toLowerCase(),
      studentId,
      milestones: [
        { milestoneId: 'first-credential', name: 'First Credential', description: 'Get your first credential verified', category: 'credential', target: 1 },
        { milestoneId: 'five-credentials', name: 'Getting Started', description: 'Get 5 credentials verified', category: 'credential', target: 5 },
        { milestoneId: 'first-badge', name: 'Badge Collector', description: 'Earn your first NFT badge', category: 'badge', target: 1 },
        { milestoneId: 'first-endorsement', name: 'Recognized', description: 'Receive your first endorsement', category: 'endorsement', target: 1 },
        { milestoneId: 'ten-skills', name: 'Skill Builder', description: 'Add 10 skills to your profile', category: 'skill', target: 10 }
      ]
    });
    await progress.save();
  }
  
  return progress;
};

module.exports = mongoose.model('StudentProgress', studentProgressSchema);