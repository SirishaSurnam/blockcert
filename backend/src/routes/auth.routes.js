const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const Institute = require('../models/Institute.model');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const walletPoolService = require('../services/walletPool.service');

const router = express.Router();

/**
 * Helper function to determine default status based on role
 */
function getDefaultStatus(role) {
  // Employers don't need approval, students and faculty do
  if (role === 'employer') return 'approved';
  if (role === 'admin') return 'approved';
  return 'pending';
}

/**
 * Helper function to find institute by email domain
 */
async function findInstituteByEmail(email) {
  try {
    const domain = email.split('@')[1];
    if (!domain) return null;
    
    // Find institute by domain
    const institute = await Institute.findOne({ domain: domain.toLowerCase() });
    return institute;
  } catch (error) {
    console.error('Error finding institute:', error);
    return null;
  }
}

/**
 * Generate a mock wallet address (fallback when no Hardhat wallets available)
 * Format: 0x + 40 hex characters (like Ethereum address)
 */
function generateMockWalletAddress(email, timestamp) {
  const data = `${email.toLowerCase()}-${timestamp}-${Math.random()}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return '0x' + hash.substring(0, 40);
}

/**
 * POST /api/auth/register
 * Assigns a real Hardhat wallet from the pool if available
 */
router.post(
  '/register',
  validate(schemas.registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, userType, firstName, lastName, instituteId, instituteName, instituteCode, collegeId } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Determine status based on role
      const status = getDefaultStatus(userType);

      // Handle institute based on role - SIMPLE VERSION (no separate institute collection)
      let userInstituteName = '';
      let userInstituteCode = '';

      // Admin: stores college name and code directly in their profile
      if (userType === 'admin') {
        // Check if institute code already exists (another admin has it)
        const existingAdmin = await User.findOne({ 
          instituteCode: instituteCode?.toUpperCase(),
          role: 'admin'
        });
        if (existingAdmin) {
          return res.status(409).json({
            success: false,
            error: 'An admin with this college code already exists'
          });
        }
        
        userInstituteName = instituteName;
        userInstituteCode = instituteCode?.toUpperCase();
        console.log(`🏛️ Admin registered: ${instituteName} (${userInstituteCode})`);
      }
      // Student/Faculty: find admin by college code
      else if (userType === 'student' || userType === 'faculty') {
        if (!instituteCode) {
          return res.status(400).json({
            success: false,
            error: 'Please enter your college code'
          });
        }
        
        // Find admin with this college code
        const admin = await User.findOne({
          instituteCode: instituteCode.toUpperCase(),
          role: 'admin'
        });
        
        if (!admin) {
          return res.status(400).json({
            success: false,
            error: 'Invalid college code. Please check with your institute admin.'
          });
        }
        
        userInstituteName = admin.instituteName;
        userInstituteCode = admin.instituteCode;
        console.log(`📚 ${userType} registered: ${email} - Institute: ${userInstituteName} (${userInstituteCode})`);
      }
      // Employers don't need institute
      else if (userType === 'employer') {
        userInstituteName = 'Employer';
      }

      // Try to get a real wallet from the Hardhat pool
      let walletAddress;
      let hasRealWallet = false;

      // Initialize wallet pool if not done
      await walletPoolService.initialize();
      
      // Try to assign a real wallet (will return null if none available)
      walletAddress = await walletPoolService.assignWallet(email);
      
      if (walletAddress) {
        hasRealWallet = true;
        console.log(`🎉 Assigned real blockchain wallet to ${email}: ${walletAddress}`);
      } else {
        // Fallback to generated mock wallet
        walletAddress = generateMockWalletAddress(email, Date.now());
        console.log(`📦 Using mock wallet for ${email}: ${walletAddress}`);
      }

      // Create user
      const user = new User({
        email,
        password,
        walletAddress: walletAddress.toLowerCase(),
        hasRealWallet,
        role: userType,
        status,
        instituteName: userInstituteName,
        instituteCode: userInstituteCode,
        profile: {
          firstName: firstName || '',
          lastName: lastName || '',
          collegeId: collegeId || '',
        }
      });

      await user.save();

      // Build response based on status
      const token = jwt.sign(
        {
          userId: user._id,
          walletAddress: user.walletAddress,
          userType: user.role,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
      );

      // For approved users, return token. For pending, explain the situation.
      if (status === 'pending') {
        return res.status(201).json({
          success: true,
          message: 'Registration successful. Your account is pending approval from institute admin.',
          requiresApproval: true,
          data: {
            userId: user._id,
            email: user.email,
            walletAddress: user.walletAddress,
            userType: user.role,
            status: user.status,
            instituteName: user.instituteName,
            instituteCode: user.instituteCode,
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            collegeId: user.profile?.collegeId,
            hasRealWallet: user.hasRealWallet
          }
        });
      }

      // Approved users (employers, admins) get immediate access
      res.status(201).json({
        success: true,
        message: userInstituteName ? 'User registered successfully' : 'Admin registered successfully',
        data: {
          userId: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          userType: user.role,
          status: user.status,
          instituteName: user.instituteName,
          instituteCode: user.instituteCode,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          collegeId: user.profile?.collegeId,
          hasRealWallet: user.hasRealWallet
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  validate(schemas.loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check user status - block pending users
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          error: 'Your account is pending approval from institute admin',
          requiresApproval: true,
          status: 'pending'
        });
      }

      // Check if user is rejected
      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          error: 'Your account was rejected. Contact admin for more information.',
          status: 'rejected'
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          walletAddress: user.walletAddress,
          userType: user.role,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          userId: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          userType: user.role,
          status: user.status,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          hasRealWallet: user.hasRealWallet || false,
          instituteName: user.instituteName || ''
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 */
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();

    res.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        userType: user.role,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        fullName,
        role: user.role,
        status: user.status,
        instituteId: user.instituteId,
        instituteName: user.instituteName,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        hasRealWallet: user.hasRealWallet || false,
        preferredCareerPath: user.profile?.preferredCareerPath || ''
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/career-path
 * Save preferred career path
 */
router.put('/career-path', protect, async (req, res, next) => {
  try {
    const { careerPath } = req.body;

    if (!careerPath) {
      return res.status(400).json({
        success: false,
        error: 'Career path is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        'profile.preferredCareerPath': careerPath 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        preferredCareerPath: user.profile?.preferredCareerPath || ''
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/wallet
 * Connect real MetaMask wallet (replaces auto-generated one)
 */
router.put('/wallet', protect, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Check if wallet is already used by another user
    const existingUser = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: req.user.userId }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Wallet address already connected to another account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        walletAddress: walletAddress.toLowerCase(),
        hasRealWallet: true
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      data: {
        walletAddress: user.walletAddress,
        hasRealWallet: true
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/wallet
 * Disconnect wallet (reverts to auto-generated)
 */
router.delete('/wallet', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    // Generate new mock wallet address
    const newWalletAddress = generateMockWalletAddress(user.email, Date.now());

    user.walletAddress = newWalletAddress;
    user.hasRealWallet = false;
    await user.save();

    res.json({
      success: true,
      message: 'Wallet disconnected',
      data: {
        walletAddress: user.walletAddress,
        hasRealWallet: false
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh-token
 */
router.post('/refresh-token', protect, (req, res) => {
  try {
    const token = jwt.sign(
      {
        userId: req.user.userId,
        walletAddress: req.user.walletAddress,
        userType: req.user.role,
        email: req.user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

/**
 * GET /api/auth/wallet-pool/status
 * Admin endpoint to check wallet pool status
 */
router.get('/wallet-pool/status', protect, async (req, res) => {
  try {
    // Only allow admins
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const status = walletPoolService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet pool status'
    });
  }
});

module.exports = router;