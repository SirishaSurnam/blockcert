const Credential = require('../models/Credential.model');
const User = require('../models/User.model');
const Leaderboard = require('../models/Leaderboard.model');
const badgeService = require('../services/badgeService');

/**
 * Get student dashboard analytics
 */
exports.getStudentAnalytics = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;

    const credentials = await Credential.find({
      studentAddress: walletAddress?.toLowerCase()
    });

    // Filter out rejected credentials for analytics (only verified credentials count)
    const verifiedCredentials = credentials.filter(c => c.status === 'verified' && !c.revoked);
    const pendingCredentials = credentials.filter(c => c.status === 'pending');
    const rejectedCredentials = credentials.filter(c => c.status === 'rejected');
    const revokedCredentials = credentials.filter(c => c.revoked);

    // Calculate skill statistics - only from verified credentials
    const skillStats = {};
    const skillCategories = {};

    verifiedCredentials.forEach(cred => {
      cred.skills?.forEach(skill => {
        skillStats[skill] = (skillStats[skill] || 0) + 1;

        const category = cred.category || 'Other';
        if (!skillCategories[category]) {
          skillCategories[category] = [];
        }
        if (!skillCategories[category].includes(skill)) {
          skillCategories[category].push(skill);
        }
      });
    });

    // Get badges and milestones
    const milestones = await badgeService.checkMilestones(walletAddress);

    // Calculate progress metrics
    const validatedCount = verifiedCredentials.length;
    const pendingCount = credentials.filter(c => c.status === 'pending').length;
    const revokedCount = credentials.filter(c => c.revoked).length;

    // Skill proficiency levels - based on verified credentials only
    const skillLevels = Object.entries(skillStats).map(([skill, count]) => ({
      skill,
      level: count >= 5 ? 'Expert' : count >= 3 ? 'Advanced' : count >= 2 ? 'Intermediate' : 'Beginner',
      count,
      percentage: verifiedCredentials.length > 0 ? (count / verifiedCredentials.length) * 100 : 0
    })).sort((a, b) => b.count - a.count);

    // Recent activity - include all credential statuses but mark rejected
    const recentActivity = credentials
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
      .slice(0, 10)
      .map(cred => ({
        id: cred._id,
        type: 'credential',
        action: cred.revoked ? 'Revoked' : cred.status === 'rejected' ? 'Rejected' : 'Issued',
        title: cred.title || 'Credential',
        date: cred.issuedAt,
        status: cred.revoked ? 'revoked' : cred.status === 'rejected' ? 'rejected' : 'valid'
      }));

    const performanceScore = calculatePerformanceScore(verifiedCredentials, milestones.totalBadges);

    res.json({
      overview: {
        totalCredentials: credentials.length, // All credentials including rejected/pending/revoked
        validatedCredentials: validatedCount,
        pendingValidation: pendingCredentials.length,
        rejectedCredentials: rejectedCredentials.length,
        revokedCredentials: revokedCredentials.length,
        totalBadges: milestones.totalBadges,
        uniqueSkills: Object.keys(skillStats).length // Only from verified credentials
      },
      skills: {
        topSkills: skillLevels.slice(0, 10),
        categories: skillCategories,
        distribution: skillStats
      },
      milestones: milestones.milestones,
      nextMilestone: milestones.nextMilestone,
      recentActivity,
      performanceScore
    });
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get faculty dashboard analytics
 */
exports.getFacultyAnalytics = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress;

    const issuedCredentials = await Credential.find({
      issuerAddress: walletAddress?.toLowerCase()
    });

    const totalValidations = issuedCredentials.length;
    const approvedCount = issuedCredentials.filter(c => !c.revoked).length;
    const revokedCount = issuedCredentials.filter(c => c.revoked).length;

    const uniqueStudents = [...new Set(issuedCredentials.map(c => c.studentAddress))];

    const skillDistribution = {};
    issuedCredentials.forEach(cred => {
      cred.skills?.forEach(skill => {
        skillDistribution[skill] = (skillDistribution[skill] || 0) + 1;
      });
    });

    res.json({
      overview: {
        totalValidations,
        approved: approvedCount,
        revoked: revokedCount,
        studentsSupervised: uniqueStudents.length
      },
      students: uniqueStudents.slice(0, 20).map(addr => ({ address: addr })),
      skillDistribution: Object.entries(skillDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count })),
      performanceMetrics: {
        approvalRate: totalValidations ? ((approvedCount / totalValidations) * 100).toFixed(1) : 0,
        revocationRate: totalValidations ? ((revokedCount / totalValidations) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Faculty analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get admin dashboard analytics
 */
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalEmployers = await User.countDocuments({ role: 'employer' });

    const totalCredentials = await Credential.countDocuments();
    const validCredentials = await Credential.countDocuments({ revoked: false });
    const revokedCredentials = await Credential.countDocuments({ revoked: true });

    const validationRate = totalCredentials
      ? ((validCredentials / totalCredentials) * 100).toFixed(1)
      : 0;

    const badgeAnalytics = await badgeService.getBadgeAnalytics();

    const activeStudents = await Credential.aggregate([
      { $match: { revoked: false } },
      { $group: { _id: '$studentAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalEmployers,
        totalCredentials,
        validCredentials,
        revokedCredentials,
        validationRate: `${validationRate}%`,
        totalBadges: badgeAnalytics.totalBadgesIssued
      },
      topSkills: badgeAnalytics.topSkills,
      topStudents: activeStudents.map(s => ({
        address: s._id,
        credentialCount: s.count
      })),
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get employer analytics
 */
exports.getEmployerAnalytics = async (req, res) => {
  try {
    const totalCredentials = await Credential.countDocuments({ revoked: false });
    const totalStudents = await User.countDocuments({ role: 'student' });

    const topSkills = await Credential.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      overview: {
        totalVerifiableCredentials: totalCredentials,
        totalVerifiedStudents: totalStudents
      },
      topSkills: topSkills.map(s => ({ skill: s._id, count: s.count }))
    });
  } catch (error) {
    console.error('Employer analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function
function calculatePerformanceScore(credentials, badgeCount) {
  const validatedCount = credentials.filter(c => !c.revoked).length;
  const totalCount = credentials.length;

  const validationScore = totalCount ? (validatedCount / totalCount) * 40 : 0;
  const badgeScore = Math.min(badgeCount * 3, 40);
  const activityScore = Math.min(totalCount * 2, 20);

  return Math.round(validationScore + badgeScore + activityScore);
}