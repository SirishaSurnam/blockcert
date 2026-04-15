const express = require('express');
const User = require('../models/User.model');
const Credential = require('../models/Credential.model');
const CredibilityScore = require('../models/CredibilityScore.model');
const { protect } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/credibility/:studentAddress
 */
router.get('/:studentAddress', async (req, res) => {
  try {
    const { studentAddress } = req.params;

    let score = await CredibilityScore.findOne({
      studentAddress: studentAddress.toLowerCase()
    }).populate('studentId', 'profile.firstName profile.lastName email walletAddress');

    if (!score) {
      score = await calculateCredibilityScore(studentAddress);
    }

    res.json({
      success: true,
      credibility: {
        overallScore: score.overallScore,
        tier: score.tier,
        components: {
          verification: score.credentialVerificationScore,
          endorsement: score.endorsementScore,
          activity: score.activityScore,
          reputation: score.reputationScore,
          blockchain: score.blockchainScore
        },
        factors: score.factors,
        badges: score.credibilityBadges,
        lastCalculated: score.lastCalculated
      }
    });
  } catch (error) {
    console.error('Get credibility error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/credibility/my-score
 */
router.get('/my-score', protect, async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;

    let score = await CredibilityScore.findOne({
      studentAddress: walletAddress.toLowerCase()
    });

    if (!score) {
      score = await calculateCredibilityScore(walletAddress);
    }

    res.json({
      success: true,
      score: {
        overall: score.overallScore,
        tier: score.tier,
        breakdown: {
          credentialVerification: score.credentialVerificationScore,
          endorsement: score.endorsementScore,
          activity: score.activityScore,
          reputation: score.reputationScore,
          blockchain: score.blockchainScore
        },
        factors: score.factors,
        history: score.scoreHistory.slice(-10)
      }
    });
  } catch (error) {
    console.error('Get my score error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/credibility/leaderboard/all
 */
router.get('/leaderboard/all', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const scores = await CredibilityScore.find({})
      .sort({ overallScore: -1 })
      .limit(parseInt(limit))
      .populate('studentId', 'profile.firstName profile.lastName walletAddress');

    res.json({
      success: true,
      leaderboard: scores.map((score, index) => ({
        rank: index + 1,
        studentAddress: score.studentAddress,
        studentName: score.studentId
          ? `${score.studentId.profile?.firstName || ''} ${score.studentId.profile?.lastName || ''}`.trim()
          : 'Anonymous',
        score: score.overallScore,
        tier: score.tier
      }))
    });
  } catch (error) {
    console.error('Get credibility leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credibility/recalculate/:studentAddress
 */
router.post('/recalculate/:studentAddress', protect, async (req, res) => {
  try {
    const { studentAddress } = req.params;

    if (req.user.userType !== 'admin' &&
      req.user.walletAddress?.toLowerCase() !== studentAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const score = await calculateCredibilityScore(studentAddress);

    res.json({
      success: true,
      message: 'Credibility score recalculated',
      score: {
        overall: score.overallScore,
        tier: score.tier
      }
    });
  } catch (error) {
    console.error('Recalculate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate credibility score
async function calculateCredibilityScore(studentAddress) {
  const user = await User.findOne({ walletAddress: studentAddress.toLowerCase() });

  const score = await CredibilityScore.getOrCreateForStudent(
    studentAddress.toLowerCase(),
    user?._id
  );

  const credentials = await Credential.find({
    studentAddress: studentAddress.toLowerCase(),
    status: 'verified'
  });

  score.factors.totalCredentials = credentials.length;
  score.factors.verifiedCredentials = credentials.filter(c => !c.revoked).length;
  score.factors.revokedCredentials = 0;
  score.factors.totalEndorsements = credentials.reduce((sum, c) => sum + (c.endorsementCount || 0), 0);
  score.factors.totalBadges = credentials.filter(c => c.badgeTokenId).length;

  const skills = new Set();
  credentials.forEach(c => c.skills?.forEach(s => skills.add(s)));
  score.factors.uniqueSkills = skills.size;

  if (credentials.length > 0) {
    const firstCredential = credentials.sort((a, b) =>
      new Date(a.issuedAt) - new Date(b.issuedAt)
    )[0];
    const daysSinceFirst = Math.floor(
      (Date.now() - new Date(firstCredential.issuedAt)) / (1000 * 60 * 60 * 24)
    );
    score.factors.daysActive = daysSinceFirst;
  }

  score.updateVerificationScore();
  score.updateEndorsementScore();
  score.updateActivityScore();
  score.updateBlockchainScore();
  score.reputationScore = Math.min(score.factors.totalEndorsements * 10, 100);

  score.calculateOverallScore();

  await score.save();
  return score;
}

module.exports = router;