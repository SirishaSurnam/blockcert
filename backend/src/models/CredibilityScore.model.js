const mongoose = require('mongoose');

const credibilityScoreSchema = new mongoose.Schema({
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
  
  // Overall Score (0-100)
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Component Scores
  credentialVerificationScore: { type: Number, default: 0, min: 0, max: 100 },
  endorsementScore: { type: Number, default: 0, min: 0, max: 100 },
  activityScore: { type: Number, default: 0, min: 0, max: 100 },
  reputationScore: { type: Number, default: 0, min: 0, max: 100 },
  blockchainScore: { type: Number, default: 0, min: 0, max: 100 },
  
  // Factors
  factors: {
    totalCredentials: { type: Number, default: 0 },
    verifiedCredentials: { type: Number, default: 0 },
    revokedCredentials: { type: Number, default: 0 },
    totalEndorsements: { type: Number, default: 0 },
    uniqueEndorsers: { type: Number, default: 0 },
    totalBadges: { type: Number, default: 0 },
    uniqueSkills: { type: Number, default: 0 },
    daysActive: { type: Number, default: 0 },
    avgCredentialAge: { type: Number, default: 0 },
    blockchainTransactions: { type: Number, default: 0 }
  },
  
  // Tier system
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  
  // History
  scoreHistory: [{
    score: Number,
    date: { type: Date, default: Date.now },
    change: Number,
    reason: String
  }],
  
  // Badges earned for credibility
  credibilityBadges: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  
  // Last calculation
  lastCalculated: { type: Date, default: Date.now },
  
  // Flags
  flags: {
    suspiciousActivity: { type: Boolean, default: false },
    needsReview: { type: Boolean, default: false },
    manuallyAdjusted: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes
credibilityScoreSchema.index({ overallScore: -1 });
credibilityScoreSchema.index({ tier: 1 });

// Calculate overall score
credibilityScoreSchema.methods.calculateOverallScore = function() {
  const weights = {
    verification: 0.30,
    endorsement: 0.25,
    activity: 0.20,
    reputation: 0.15,
    blockchain: 0.10
  };
  
  this.overallScore = Math.round(
    this.credentialVerificationScore * weights.verification +
    this.endorsementScore * weights.endorsement +
    this.activityScore * weights.activity +
    this.reputationScore * weights.reputation +
    this.blockchainScore * weights.blockchain
  );
  
  this.tier = this.calculateTier(this.overallScore);
  
  const previousScore = this.scoreHistory.length > 0 
    ? this.scoreHistory[this.scoreHistory.length - 1].score 
    : 0;
  
  this.scoreHistory.push({
    score: this.overallScore,
    change: this.overallScore - previousScore,
    reason: 'Automatic calculation'
  });
  
  this.lastCalculated = new Date();
  return this.overallScore;
};

credibilityScoreSchema.methods.calculateTier = function(score) {
  if (score >= 90) return 'diamond';
  if (score >= 75) return 'platinum';
  if (score >= 60) return 'gold';
  if (score >= 40) return 'silver';
  return 'bronze';
};

credibilityScoreSchema.methods.updateVerificationScore = function() {
  const { totalCredentials, verifiedCredentials, revokedCredentials } = this.factors;
  
  if (totalCredentials === 0) {
    this.credentialVerificationScore = 0;
    return;
  }
  
  const verificationRate = verifiedCredentials / totalCredentials;
  const revocationPenalty = revokedCredentials * 5;
  
  this.credentialVerificationScore = Math.max(0, Math.min(100,
    (verificationRate * 100) - revocationPenalty
  ));
};

credibilityScoreSchema.methods.updateEndorsementScore = function() {
  const { totalEndorsements, uniqueEndorsers } = this.factors;
  const diversityBonus = Math.min(uniqueEndorsers * 5, 50);
  const endorsementBonus = Math.min(totalEndorsements * 3, 50);
  this.endorsementScore = Math.min(100, diversityBonus + endorsementBonus);
};

credibilityScoreSchema.methods.updateActivityScore = function() {
  const { daysActive, totalCredentials } = this.factors;
  const activityBonus = Math.min(daysActive * 0.5, 50);
  const credentialBonus = Math.min(totalCredentials * 2, 50);
  this.activityScore = Math.min(100, activityBonus + credentialBonus);
};

credibilityScoreSchema.methods.updateBlockchainScore = function() {
  const { blockchainTransactions, verifiedCredentials } = this.factors;
  const txBonus = Math.min(blockchainTransactions * 2, 50);
  const verificationBonus = Math.min(verifiedCredentials * 5, 50);
  this.blockchainScore = Math.min(100, txBonus + verificationBonus);
};

credibilityScoreSchema.statics.getOrCreateForStudent = async function(studentAddress, studentId) {
  let score = await this.findOne({ studentAddress: studentAddress.toLowerCase() });
  
  if (!score) {
    score = new this({
      studentAddress: studentAddress.toLowerCase(),
      studentId
    });
    await score.save();
  }
  
  return score;
};

credibilityScoreSchema.statics.recalculateAll = async function() {
  const scores = await this.find({});
  
  for (const score of scores) {
    score.updateVerificationScore();
    score.updateEndorsementScore();
    score.updateActivityScore();
    score.updateBlockchainScore();
    score.calculateOverallScore();
    await score.save();
  }
  
  return scores.length;
};

module.exports = mongoose.model('CredibilityScore', credibilityScoreSchema);