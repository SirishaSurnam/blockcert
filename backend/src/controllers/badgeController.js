const badgeService = require('../services/badgeService');
const User = require('../models/User.model');
const Credential = require('../models/Credential.model');

/**
 * Get all badges for a student
 */
exports.getStudentBadges = async (req, res) => {
  try {
    const { studentAddress } = req.params;

    const badges = await badgeService.getStudentBadges(studentAddress);

    res.json({
      success: true,
      count: badges.length,
      badges
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mint a new badge
 */
exports.mintBadge = async (req, res) => {
  try {
    const { studentAddress, skillName, level, metadata } = req.body;

    if (!studentAddress || !skillName || !level) {
      return res.status(400).json({
        error: 'studentAddress, skillName, and level are required'
      });
    }

    // Check permission
    if (req.user && req.user.userType !== 'faculty' && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to mint badges' });
    }

    const student = await User.findOne({
      walletAddress: { $regex: new RegExp(`^${studentAddress}$`, 'i') }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await badgeService.mintBadge(
      studentAddress,
      skillName,
      level,
      metadata || {}
    );

    const milestones = await badgeService.checkMilestones(studentAddress);

    res.json({
      success: true,
      message: 'Badge minted successfully',
      badge: result,
      milestones: milestones.milestones.filter(m => m.achieved && m.count === milestones.totalBadges),
      nextMilestone: milestones.nextMilestone
    });
  } catch (error) {
    console.error('Mint badge error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get milestone progress for a student
 */
exports.getMilestones = async (req, res) => {
  try {
    const { studentAddress } = req.params;

    const milestones = await badgeService.checkMilestones(studentAddress);

    res.json({
      success: true,
      ...milestones
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Revoke a badge
 */
exports.revokeBadge = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { reason } = req.body;

    if (req.user && req.user.userType !== 'faculty' && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to revoke badges' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Revocation reason is required' });
    }

    const result = await badgeService.revokeBadge(tokenId, reason);

    res.json({
      success: true,
      message: 'Badge revoked successfully',
      ...result
    });
  } catch (error) {
    console.error('Revoke badge error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get badge analytics
 */
exports.getBadgeAnalytics = async (req, res) => {
  try {
    if (req.user && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const analytics = await badgeService.getBadgeAnalytics();

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Badge analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Auto-mint badges based on credential validation
 */
exports.autoMintOnValidation = async (credentialId) => {
  try {
    const credential = await Credential.findById(credentialId);

    if (!credential || credential.revoked) {
      return;
    }

    let level = 1;
    if (credential.grade === 'A+' || credential.grade === 'O') level = 4;
    else if (credential.grade === 'A') level = 3;
    else if (credential.grade === 'B+' || credential.grade === 'B') level = 2;

    if (credential.skills && credential.skills.length > 0) {
      const primarySkill = credential.skills[0];

      await badgeService.mintBadge(
        credential.studentAddress,
        primarySkill,
        level,
        {
          category: credential.category || 'General',
          credentialId: credential._id
        }
      );

      console.log(`Auto-minted badge for ${credential.studentAddress}: ${primarySkill} (Level ${level})`);
    }
  } catch (error) {
    console.error('Auto-mint error:', error);
  }
};