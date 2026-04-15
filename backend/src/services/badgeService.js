const ethers = require('ethers');
const QRCode = require('qrcode');
const Credential = require('../models/Credential.model');

const normalizeSkillKey = (value) =>
  value
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';

const SKILL_ALIAS_MAP = {
  'pcep': 'Python Fundamentals',
  'pcep certification': 'Python Fundamentals',
  'python fundamentals': 'Python Fundamentals',
  'python basics': 'Python Fundamentals',
  'python': 'Python Fundamentals',
  'python mastery': 'Python Mastery',
  'python advanced': 'Python Mastery',
  'python professional': 'Python Mastery',
};

// XP values for different badge types
const BADGE_XP_MAP = {
  'Python Fundamentals': 100,
  'Python Mastery': 300,
  'Web Development': 200,
  'Data Science': 500,
  'Cloud Computing': 350,
  'Cybersecurity': 450,
  'AI & Machine Learning': 750,
  'Database Management': 150,
  'DevOps': 400,
  'Mobile Development': 250,
  'Blockchain': 600,
  'IoT': 300,
  'Game Development': 350,
  'UI/UX Design': 200,
  'Project Management': 175,
  'Leadership': 250,
  'Communication': 125,
  'Teamwork': 150,
  'Problem Solver': 150,
  'Time Master': 125,
  'First Step': 50,
  'Rising Star': 100,
  'Skilled Professional': 200,
  'Expert': 500,
  'Master': 1000,
};

class BadgeService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.nftContract = null;
    this.initialized = false;
  }

  initialize(provider, wallet, nftContractAddress) {
    this.provider = provider;
    this.wallet = wallet;
    this.initialized = true;
    console.log('🎖️ Badge service initialized');
  }

  async mintBadge(studentAddress, skillName, level, metadata = {}) {
    try {
      if (!ethers.isAddress(studentAddress)) {
        throw new Error('Invalid student address');
      }

      // Generate a token ID
      const tokenId = Date.now();

      // Generate QR code for badge verification
      const qrCodeData = await this.generateBadgeQR(tokenId, studentAddress);

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: '0x' + '0'.repeat(64),
        blockNumber: 0,
        metadataURI: `ipfs://badge/${tokenId}`,
        qrCode: qrCodeData
      };
    } catch (error) {
      console.error('Badge minting error:', error);
      throw new Error(`Failed to mint badge: ${error.message}`);
    }
  }

  async getStudentBadges(studentAddress) {
    try {
      if (!ethers.isAddress(studentAddress)) {
        throw new Error('Invalid student address');
      }

      // Get from database
      const credentials = await Credential.find({
        studentAddress: studentAddress.toLowerCase(),
        badgeTokenId: { $exists: true, $ne: null }
      });

      return credentials.map(cred => {
        const rawSkill = cred.skills?.[0] || cred.title || 'Unknown';
        const normalizedSkill = normalizeSkillKey(rawSkill);
        const skillName = SKILL_ALIAS_MAP[normalizedSkill] || rawSkill;

        return {
          tokenId: cred.badgeTokenId?.toString(),
          skillName,
          level: 1,
          timestamp: cred.issuedAt,
          credentialId: cred._id,
          metadata: cred.badgeMetadata || {},
          xp: cred.badgeMetadata?.xp || BADGE_XP_MAP[skillName] || 100
        };
      });
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  }

  async checkMilestones(studentAddress) {
    try {
      const badgeCount = await this.getBadgeCount(studentAddress);
      const count = badgeCount;

      const milestones = [
        { count: 1, name: 'First Step', description: 'Earned your first skill badge!', icon: '🌟' },
        { count: 5, name: 'Rising Star', description: '5 verified skills', icon: '⭐' },
        { count: 10, name: 'Skilled Professional', description: '10 verified skills', icon: '🏆' },
        { count: 20, name: 'Expert', description: '20 verified skills', icon: '💎' },
        { count: 50, name: 'Master', description: '50 verified skills', icon: '👑' }
      ].map(achievement => ({
        ...achievement,
        achieved: count >= achievement.count,
        progress: count >= achievement.count ? 100 : (count / achievement.count) * 100
      }));

      return {
        totalBadges: count,
        milestones,
        nextMilestone: milestones.find(m => !m.achieved) || null
      };
    } catch (error) {
      console.error('Error checking milestones:', error);
      throw error;
    }
  }

  async getBadgeCount(studentAddress) {
    try {
      return await Credential.countDocuments({
        studentAddress: studentAddress.toLowerCase(),
        badgeTokenId: { $exists: true, $ne: null }
      });
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async generateBadgeQR(tokenId, studentAddress) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/badge/${tokenId}?student=${studentAddress}`;

    try {
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      return {
        dataURL: qrCodeDataURL,
        verificationUrl
      };
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  async getBadgeAnalytics() {
    try {
      const stats = await Credential.aggregate([
        { $match: { badgeTokenId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$skills',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const totalBadgesIssued = await Credential.countDocuments({
        badgeTokenId: { $exists: true, $ne: null }
      });

      const recentBadges = await Credential.find({
        badgeTokenId: { $exists: true, $ne: null }
      })
        .sort({ issuedAt: -1 })
        .limit(10)
        .select('title skills issuedAt badgeTokenId');

      return {
        totalBadgesIssued,
        topSkills: stats.map(s => ({ skill: s._id?.[0] || 'Unknown', count: s.count })),
        recentBadges
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return { totalBadgesIssued: 0, topSkills: [], recentBadges: [] };
    }
  }

  async revokeBadge(tokenId, reason) {
    try {
      const credential = await Credential.findOne({ badgeTokenId: tokenId });

      if (credential) {
        credential.revoked = true;
        credential.revocationReason = reason;
        await credential.save();
      }

      return { success: true, tokenId, reason };
    } catch (error) {
      console.error('Badge revocation error:', error);
      throw new Error(`Failed to revoke badge: ${error.message}`);
    }
  }

  async autoMintOnValidation(credential) {
    try {
      if (!credential || credential.revoked) {
        return null;
      }

      let level = 1;
      if (credential.grade === 'A+' || credential.grade === 'O') level = 4;
      else if (credential.grade === 'A') level = 3;
      else if (credential.grade === 'B+' || credential.grade === 'B') level = 2;

      const rawPrimarySkill = credential.skills?.[0] || credential.title || 'Achievement';
      const normalizedSkill = normalizeSkillKey(rawPrimarySkill);
      const primarySkill = SKILL_ALIAS_MAP[normalizedSkill] || rawPrimarySkill;

      const result = await this.mintBadge(
        credential.studentAddress,
        primarySkill,
        level,
        {
          category: credential.category || 'General',
          credentialId: credential._id,
          xp: BADGE_XP_MAP[primarySkill] || 100 // Default XP if not found
        }
      );

      if (result.tokenId) {
        credential.badgeTokenId = result.tokenId;
        credential.badgeMetadata = {
          category: credential.category || 'General',
          credentialId: credential._id,
          xp: BADGE_XP_MAP[primarySkill] || 100,
          skillName: primarySkill,
          level: level
        };
        await credential.save();
      }

      console.log(`Auto-minted badge: ${primarySkill} (Level ${level})`);
      return result;
    } catch (error) {
      console.error('Auto-mint error:', error);
      return null;
    }
  }
}

module.exports = new BadgeService();