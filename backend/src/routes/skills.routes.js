const express = require('express');
const User = require('../models/User.model');
const Credential = require('../models/Credential.model');
const SkillTree = require('../models/SkillTree.model');
const Leaderboard = require('../models/Leaderboard.model');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get user's skill progress
router.get('/progress/me', protect, async (req, res) => {
  try {
    // Only count verified credentials (exclude rejected)
    const credentials = await Credential.find({
      studentAddress: req.user.walletAddress?.toLowerCase(),
      status: 'verified'
    });

    const totalXP = credentials.length * 100;
    const totalLevel = Math.floor(totalXP / 500) + 1;

    const skills = new Set();
    credentials.forEach(cred => {
      if (cred.title) {
        const skillName = cred.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        if (skillName) skills.add(skillName);
      }
    });

    res.json({
      success: true,
      data: {
        totalXP,
        totalLevel,
        progress: [{
          category: 'credentials',
          completedSkills: Array.from(skills),
          xpEarned: totalXP
        }],
        credentialsCount: credentials.length
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { department, limit = 50 } = req.query;

    // First try to get from Leaderboard collection
    let query = { period: 'all-time' };
    if (department) {
      query.department = department;
    }

    let leaderboardData = await Leaderboard.find(query)
      .sort({ totalScore: -1 })
      .limit(parseInt(limit))
      .populate('studentId', 'profile.firstName profile.lastName walletAddress');

    // If Leaderboard is empty, fall back to User aggregation
    if (!leaderboardData || leaderboardData.length === 0) {
      const pipeline = [
        { $match: { role: 'student', isActive: { $ne: false } } },
        {
          $lookup: {
            from: 'credentials',
            let: { wallet: '$walletAddress' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$studentAddress', '$$wallet'] },
                  status: 'verified',
                  revoked: { $ne: true }
                }
              }
            ],
            as: 'credentials'
          }
        },
        {
          $lookup: {
            from: 'skilltrees',
            localField: 'walletAddress',
            foreignField: 'studentAddress',
            as: 'skillTree'
          }
        },
        {
          $addFields: {
            credentialsCount: { $size: '$credentials' },
            // Get badges count from skillTree badges array
            badgesCount: { $size: { $ifNull: [{ $arrayElemAt: ['$skillTree.badges', 0] }, []] } },
            totalXP: { $multiply: [{ $size: '$credentials' }, 100] }
          }
        },
        { $sort: { totalXP: -1 } },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 1,
            walletAddress: 1,
            profile: 1,
            credentialsCount: 1,
            badgesCount: 1,
            totalXP: 1
          }
        }
      ];

      if (department) {
        pipeline[0].$match['profile.department'] = department;
      }

      const students = await User.aggregate(pipeline);

      leaderboardData = students.map((student, index) => ({
        _id: student._id,
        studentAddress: student.walletAddress,
        studentId: { profile: student.profile },
        studentName: null,
        totalScore: student.totalXP || 0,
        totalCredentials: student.credentialsCount || 0,
        totalBadges: student.badgesCount || 0,
        globalRank: index + 1,
        department: student.profile?.department
      }));
    }

    const leaderboard = leaderboardData.map((entry, index) => {
      // Get name from populated studentId profile or use existing studentName
      let studentName = entry.studentName;
      if (entry.studentId?.profile) {
        const firstName = entry.studentId.profile.firstName || '';
        const lastName = entry.studentId.profile.lastName || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        if (fullName) studentName = fullName;
      }

      return {
        _id: entry._id,
        studentId: entry.studentId,
        studentAddress: entry.studentAddress,
        studentName: studentName || 'Anonymous',
        rank: entry.globalRank || index + 1,
        totalXP: entry.totalScore || entry.totalXP || 0,
        credentialsCount: entry.totalCredentials || entry.credentialsCount || 0,
        totalBadges: entry.totalBadges || entry.badgesCount || 0,
        credibilityScore: entry.totalScore || entry.totalXP || 0,
        department: entry.department
      };
    });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my rank
router.get('/rank/me', protect, async (req, res) => {
  try {
    const userWallet = req.user.walletAddress?.toLowerCase();

    const students = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'credentials',
          localField: 'walletAddress',
          foreignField: 'studentAddress',
          as: 'credentials'
        }
      },
      {
        $addFields: {
          totalXP: { $multiply: [{ $size: '$credentials' }, 100] }
        }
      },
      { $sort: { totalXP: -1 } }
    ]);

    const userIndex = students.findIndex(
      s => s.walletAddress?.toLowerCase() === userWallet
    );

    if (userIndex === -1) {
      return res.json({
        success: true,
        data: {
          rank: students.length,
          totalXP: 0,
          credibilityScore: 50,
          percentile: 0
        }
      });
    }

    const user = students[userIndex];
    const percentile = Math.round(((students.length - userIndex - 1) / students.length) * 100);

    res.json({
      success: true,
      data: {
        rank: userIndex + 1,
        totalXP: user.totalXP,
        credibilityScore: Math.min(50 + user.totalXP / 10, 100),
        percentile
      }
    });
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get skill trees
router.get('/trees', protect, async (req, res) => {
  try {
    const studentAddress = req.user.walletAddress?.toLowerCase();
    
    if (!studentAddress) {
      return res.status(400).json({ success: false, error: 'No wallet address found' });
    }

    // Try to get existing skill tree from database
    let skillTree = await SkillTree.findOne({ studentAddress });
    
    // If no skill tree exists, create one with skills from credentials
    if (!skillTree) {
      const credentials = await Credential.find({
        studentAddress,
        status: 'verified'
      });
      
      skillTree = new SkillTree({
        studentAddress,
        nodes: [],
        branches: []
      });

      // Group credentials by domain based on title keywords
      const domainGroups = {
        networking: { name: 'Networking', icon: '🌐', skills: [] },
        programming: { name: 'Programming', icon: '💻', skills: [] },
        iot: { name: 'IoT', icon: '📡', skills: [] },
        database: { name: 'Database', icon: '🗄️', skills: [] },
        security: { name: 'Security', icon: '🔒', skills: [] },
        cloud: { name: 'Cloud', icon: '☁️', skills: [] },
        other: { name: 'Technical', icon: '⚙️', skills: [] }
      };

      // Map credentials to domains
      credentials.forEach((cred) => {
        const title = cred.title?.toLowerCase() || '';
        let domain = 'other';
        
        if (title.includes('network') || title.includes('cisco')) {
          domain = 'networking';
        } else if (title.includes('java') || title.includes('python') || title.includes('programming') || title.includes('sql')) {
          domain = 'programming';
        } else if (title.includes('iot') || title.includes('internet of things')) {
          domain = 'iot';
        } else if (title.includes('database') || title.includes('oracle') || title.includes('sql')) {
          domain = 'database';
        } else if (title.includes('security') || title.includes('cyber')) {
          domain = 'security';
        } else if (title.includes('cloud') || title.includes('aws') || title.includes('azure')) {
          domain = 'cloud';
        }
        
        domainGroups[domain].skills.push({ cred });
      });

      // Create the root node (level 1)
      const rootNode = {
        skillName: 'My Skills',
        category: 'domain',
        level: 1,
        description: 'Root of your skill tree',
        prerequisites: [],
        credentials: [],
        badges: [],
        xpPoints: 0,
        icon: '🎓',
        isLocked: false,
        unlockedAt: new Date()
      };
      skillTree.nodes.push(rootNode);

      // Create domain nodes (level 2)
      const domainNodes = {};
      Object.entries(domainGroups).forEach(([key, group]) => {
        if (group.skills.length > 0) {
          const domainNode = {
            skillName: group.name,
            category: 'domain',
            level: 2,
            description: `${group.name} domain skills`,
            prerequisites: [skillTree.nodes[0]._id],
            credentials: [],
            badges: [],
            xpPoints: 50,
            icon: group.icon,
            isLocked: false,
            unlockedAt: new Date()
          };
          skillTree.nodes.push(domainNode);
          domainNodes[key] = domainNode;
        }
      });

      // Add skill nodes (level 3) with prerequisites pointing to domain
      Object.entries(domainGroups).forEach(([key, group]) => {
        const domainNode = domainNodes[key];
        group.skills.forEach((skillItem) => {
          const cred = skillItem.cred;
          const skillNode = {
            skillName: cred.title ? cred.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() : 'unknown skill',
            category: cred.category || 'technical',
            level: 3,
            description: cred.description || `Skill from ${cred.title}`,
            prerequisites: domainNode && domainNode._id ? [domainNode._id] : [],
            credentials: [{
              credentialId: cred._id,
              verified: true
            }],
            badges: [],
            xpPoints: 100,
            icon: '🎯',
            isLocked: false,
            unlockedAt: cred.issuedAt
          };
          skillTree.nodes.push(skillNode);
        });
      });
      
      skillTree.calculateProgress();
      await skillTree.save();
    }

    // Transform nodes to match frontend expected format
    // Group nodes by level for position calculation
    const levelGroups = {};
    skillTree.nodes.forEach(node => {
      const lvl = node.level || 1;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(node);
    });

    const positions = {};
    const NODE_WIDTH = 150;
    const LEVEL_GAP = 140;

    Object.keys(levelGroups).forEach(lvl => {
      const nodes = levelGroups[lvl];
      const totalWidth = nodes.length * NODE_WIDTH;
      const startX = Math.max(50, (600 - totalWidth) / 2);
      
      nodes.forEach((node, idx) => {
        positions[node._id?.toString()] = {
          x: startX + idx * NODE_WIDTH,
          y: 50 + (parseInt(lvl) - 1) * LEVEL_GAP
        };
      });
    });

    const transformedNodes = skillTree.nodes.map((node, index) => ({
      id: node._id?.toString() || `node-${index}`,
      name: node.skillName,
      level: node.level,
      position: positions[node._id?.toString()] || { x: 50 + (index % 4) * 130, y: 50 + Math.floor(index / 4) * 100 },
      progress: node.isLocked ? 0 : 100,
      verified: !node.isLocked,
      description: node.description,
      category: node.category,
      prerequisites: (node.prerequisites || []).map(p => p ? p.toString() : ''),
      credentials: node.credentials,
      badges: node.badges,
      xpPoints: node.xpPoints,
      icon: node.icon,
      isLocked: node.isLocked,
      unlockedAt: node.unlockedAt
    }));

    res.json({
      success: true,
      data: {
        _id: skillTree._id,
        studentAddress: skillTree.studentAddress,
        name: skillTree.name,
        nodes: transformedNodes,
        totalXP: skillTree.totalXP,
        level: skillTree.level,
        completedNodes: skillTree.completedNodes,
        totalNodes: skillTree.totalNodes,
        branches: skillTree.branches,
        lastActivityAt: skillTree.lastActivityAt
      }
    });
  } catch (error) {
    console.error('Error fetching skill trees:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get achievements
router.get('/achievements', protect, async (req, res) => {
  try {
    const studentAddress = req.user.walletAddress?.toLowerCase();
    
    if (!studentAddress) {
      return res.status(400).json({ success: false, error: 'No wallet address found' });
    }

    // Get verified credentials count
    const credentialsCount = await Credential.countDocuments({
      studentAddress,
      status: 'verified'
    });

    // Get skill tree for XP calculation
    const skillTree = await SkillTree.findOne({ studentAddress });
    const totalXP = skillTree?.totalXP || credentialsCount * 100;

    // Define achievements based on credentials and XP
    const achievements = [
      // Credential-based achievements
      {
        id: 'first-credential',
        name: 'First Step',
        description: 'Earn your first verified credential',
        icon: '🌟',
        category: 'credential',
        requirement: 1,
        progress: Math.min(credentialsCount, 1),
        achieved: credentialsCount >= 1,
        reward: { xp: 50 },
        achievedAt: credentialsCount >= 1 ? new Date() : null
      },
      {
        id: 'five-credentials',
        name: 'Rising Star',
        description: 'Earn 5 verified credentials',
        icon: '⭐',
        category: 'credential',
        requirement: 5,
        progress: Math.min(credentialsCount, 5),
        achieved: credentialsCount >= 5,
        reward: { xp: 100 },
        achievedAt: credentialsCount >= 5 ? new Date() : null
      },
      {
        id: 'ten-credentials',
        name: 'Skilled Professional',
        description: 'Earn 10 verified credentials',
        icon: '🏆',
        category: 'credential',
        requirement: 10,
        progress: Math.min(credentialsCount, 10),
        achieved: credentialsCount >= 10,
        reward: { xp: 200 },
        achievedAt: credentialsCount >= 10 ? new Date() : null
      },
      {
        id: 'twenty-credentials',
        name: 'Expert',
        description: 'Earn 20 verified credentials',
        icon: '💎',
        category: 'credential',
        requirement: 20,
        progress: Math.min(credentialsCount, 20),
        achieved: credentialsCount >= 20,
        reward: { xp: 500 },
        achievedAt: credentialsCount >= 20 ? new Date() : null
      },
      {
        id: 'fifty-credentials',
        name: 'Master',
        description: 'Earn 50 verified credentials',
        icon: '👑',
        category: 'credential',
        requirement: 50,
        progress: Math.min(credentialsCount, 50),
        achieved: credentialsCount >= 50,
        reward: { xp: 1000 },
        achievedAt: credentialsCount >= 50 ? new Date() : null
      },
      // XP-based achievements
      {
        id: 'xp-100',
        name: 'XP Beginner',
        description: 'Earn 100 XP points',
        icon: '⚡',
        category: 'skill',
        requirement: 100,
        progress: Math.min(totalXP, 100),
        achieved: totalXP >= 100,
        reward: { xp: 25 },
        achievedAt: totalXP >= 100 ? new Date() : null
      },
      {
        id: 'xp-500',
        name: 'XP Enthusiast',
        description: 'Earn 500 XP points',
        icon: '🔥',
        category: 'skill',
        requirement: 500,
        progress: Math.min(totalXP, 500),
        achieved: totalXP >= 500,
        reward: { xp: 50 },
        achievedAt: totalXP >= 500 ? new Date() : null
      },
      {
        id: 'xp-1000',
        name: 'XP Master',
        description: 'Earn 1000 XP points',
        icon: '🌈',
        category: 'skill',
        requirement: 1000,
        progress: Math.min(totalXP, 1000),
        achieved: totalXP >= 1000,
        reward: { xp: 100 },
        achievedAt: totalXP >= 1000 ? new Date() : null
      },
      // Skill tree achievements
      {
        id: 'first-skill',
        name: 'Skill Unlocked',
        description: 'Unlock your first skill in the skill tree',
        icon: '🎯',
        category: 'skill',
        requirement: 1,
        progress: Math.min(skillTree?.completedNodes || 0, 1),
        achieved: (skillTree?.completedNodes || 0) >= 1,
        reward: { xp: 25 },
        achievedAt: (skillTree?.completedNodes || 0) >= 1 ? new Date() : null
      },
      {
        id: 'ten-skills',
        name: 'Multi-Skilled',
        description: 'Unlock 10 skills in the skill tree',
        icon: '🌳',
        category: 'skill',
        requirement: 10,
        progress: Math.min(skillTree?.completedNodes || 0, 10),
        achieved: (skillTree?.completedNodes || 0) >= 10,
        reward: { xp: 100 },
        achievedAt: (skillTree?.completedNodes || 0) >= 10 ? new Date() : null
      }
    ];

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user skills for career guidance
router.get('/my-skills', protect, async (req, res) => {
  try {
    const studentAddress = req.user.walletAddress?.toLowerCase();
    
    if (!studentAddress) {
      return res.status(400).json({ success: false, error: 'No wallet address found' });
    }

    // Get verified credentials and extract skills (only verified count for skills)
    const credentials = await Credential.find({
      studentAddress,
      status: 'verified'
    });

    // Extract unique skills from credentials
    const skillSet = new Set();
    credentials.forEach(cred => {
      // Add from skills array if exists
      if (cred.skills && cred.skills.length > 0) {
        cred.skills.forEach(skill => skillSet.add(skill.toLowerCase()));
      }
      // Also add from title as a skill
      if (cred.title) {
        skillSet.add(cred.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
      }
    });

    // Also get skills from skill tree nodes
    const skillTree = await SkillTree.findOne({ studentAddress });
    if (skillTree && skillTree.nodes) {
      skillTree.nodes.forEach(node => {
        if (node.skillName) {
          skillSet.add(node.skillName.toLowerCase());
        }
      });
    }

    const skills = Array.from(skillSet).filter(s => s.length > 0);

    res.json({
      success: true,
      data: {
        skills,
        credentialsCount: credentials.length,
        skillTreeNodes: skillTree?.nodes?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;