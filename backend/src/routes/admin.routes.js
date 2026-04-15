const express = require('express');
const User = require('../models/User.model');
const Institute = require('../models/Institute.model');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/pending-users
 * Get all pending users (for institute admin)
 */
router.get('/pending-users', protect, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    
    // Build query
    const query = { status: 'pending' };
    
    // If admin has an institute, only show users from that institute
    const admin = await User.findById(req.user.userId);
    if (admin && admin.instituteId) {
      query.instituteId = admin.instituteId;
    }
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users.map(user => ({
        userId: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        status: user.status,
        instituteId: user.instituteId,
        instituteName: user.instituteName,
        profile: user.profile,
        createdAt: user.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get all users in institute
 */
router.get('/users', protect, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status } = req.query;
    
    // Build query
    const query = {};
    
    // If admin has an institute, only show users from that institute
    const admin = await User.findById(req.user.userId);
    if (admin && admin.instituteId) {
      query.instituteId = admin.instituteId;
    }
    
    // Filter by role if provided
    if (role) {
      query.role = role;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users.map(user => ({
        userId: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        status: user.status,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        collegeId: user.profile?.collegeId || '',
        instituteId: user.instituteId,
        instituteName: user.instituteName,
        profile: user.profile,
        createdAt: user.createdAt,
        approvedAt: user.approvedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/approve
 * Approve a pending user
 */
router.post('/users/:id/approve', protect, isAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already approved
    if (user.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'User is already approved'
      });
    }

    // If admin has institute, verify user belongs to same institute
    const admin = await User.findById(req.user.userId);
    if (admin && admin.instituteId) {
      if (user.instituteId?.toString() !== admin.instituteId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You can only approve users from your institute'
        });
      }
    }

    // Approve the user
    user.status = 'approved';
    user.approvedBy = req.user.userId;
    user.approvedAt = new Date();
    
    await user.save();

    res.json({
      success: true,
      message: 'User approved successfully',
      data: {
        userId: user._id,
        email: user.email,
        status: user.status,
        approvedAt: user.approvedAt
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject a pending user
 */
router.post('/users/:id/reject', protect, isAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already rejected
    if (user.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'User is already rejected'
      });
    }

    // If admin has institute, verify user belongs to same institute
    const admin = await User.findById(req.user.userId);
    if (admin && admin.instituteId) {
      if (user.instituteId?.toString() !== admin.instituteId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You can only reject users from your institute'
        });
      }
    }

    // Reject the user
    user.status = 'rejected';
    user.rejectionReason = reason || 'Rejected by admin';
    user.approvedBy = req.user.userId;
    
    await user.save();

    res.json({
      success: true,
      message: 'User rejected',
      data: {
        userId: user._id,
        email: user.email,
        status: user.status,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get admin statistics
 */
router.get('/stats', protect, isAdmin, async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.userId);
    
    // Base query based on institute
    const instituteQuery = admin.instituteId 
      ? { instituteId: admin.instituteId } 
      : {};

    // Get pending users count
    const pendingCount = await User.countDocuments({ 
      ...instituteQuery, 
      status: 'pending' 
    });

    // Get approved users count
    const approvedCount = await User.countDocuments({ 
      ...instituteQuery, 
      status: 'approved' 
    });

    // Get rejected users count
    const rejectedCount = await User.countDocuments({ 
      ...instituteQuery, 
      status: 'rejected' 
    });

    // Get users by role
    const studentsCount = await User.countDocuments({ 
      ...instituteQuery, 
      role: 'student' 
    });

    const facultyCount = await User.countDocuments({ 
      ...instituteQuery, 
      role: 'faculty' 
    });

    const employersCount = await User.countDocuments({ 
      ...instituteQuery, 
      role: 'employer' 
    });

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
        byRole: {
          students: studentsCount,
          faculty: facultyCount,
          employers: employersCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    next(error);
  }
});

/**
 * GET /api/admin/institutes
 * Get all institutes (for admin to manage)
 */
router.get('/institutes', protect, isAdmin, async (req, res, next) => {
  try {
    const institutes = await Institute.find({ isActive: true })
      .sort({ name: 1 });

    // Get user count for each institute
    const institutesWithCount = await Promise.all(
      institutes.map(async (institute) => {
        const userCount = await User.countDocuments({ instituteId: institute._id });
        return {
          id: institute._id,
          name: institute.name,
          code: institute.code,
          domain: institute.domain,
          userCount,
          settings: institute.settings
        };
      })
    );

    res.json({
      success: true,
      data: institutesWithCount
    });
  } catch (error) {
    console.error('Error fetching institutes:', error);
    next(error);
  }
});

/**
 * GET /api/institutes/public
 * Get all active institutes (public - for students to see during registration)
 */
router.get('/public', async (req, res, next) => {
  try {
    const institutes = await Institute.find({ isActive: true })
      .select('name code domain')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: institutes.map(i => ({
        id: i._id,
        name: i.name,
        code: i.code,
        domain: i.domain
      }))
    });
  } catch (error) {
    console.error('Error fetching institutes:', error);
    next(error);
  }
});

/**
 * GET /api/admin/institutes/:id
 * Get single institute by ID (for admin to manage their institute)
 */
router.get('/institutes/:id', protect, isAdmin, async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.params.id);
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        error: 'Institute not found'
      });
    }

    // Get user stats
    const totalUsers = await User.countDocuments({ instituteId: institute._id });
    const pendingUsers = await User.countDocuments({ instituteId: institute._id, status: 'pending' });
    const approvedUsers = await User.countDocuments({ instituteId: institute._id, status: 'approved' });

    res.json({
      success: true,
      data: {
        id: institute._id,
        name: institute.name,
        code: institute.code,
        domain: institute.domain,
        description: institute.description,
        isActive: institute.isActive,
        settings: institute.settings,
        stats: {
          totalUsers,
          pendingUsers,
          approvedUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching institute:', error);
    next(error);
  }
});

/**
 * PUT /api/admin/institutes/:id
 * Update institute details
 */
router.put('/institutes/:id', protect, isAdmin, async (req, res, next) => {
  try {
    const { name, code, domain, description, settings, isActive } = req.body;
    
    const institute = await Institute.findById(req.params.id);
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        error: 'Institute not found'
      });
    }

    // Check if admin has permission to update this institute
    const admin = await User.findById(req.user.userId);
    if (!admin.instituteId || admin.instituteId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own institute'
      });
    }

    // Update fields
    if (name) institute.name = name;
    if (code) institute.code = code.toUpperCase();
    if (domain) institute.domain = domain.toLowerCase();
    if (description !== undefined) institute.description = description;
    if (settings) institute.settings = settings;
    if (isActive !== undefined) institute.isActive = isActive;

    await institute.save();

    res.json({
      success: true,
      message: 'Institute updated successfully',
      data: {
        id: institute._id,
        name: institute.name,
        code: institute.code,
        domain: institute.domain,
        description: institute.description,
        isActive: institute.isActive,
        settings: institute.settings
      }
    });
  } catch (error) {
    console.error('Error updating institute:', error);
    next(error);
  }
});

/**
 * GET /api/admin/institute-analytics
 * Get analytics specific to the admin's institute
 */
router.get('/institute-analytics', protect, isAdmin, async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.userId);
    
    if (!admin || !admin.instituteCode) {
      return res.status(404).json({
        success: false,
        error: 'Institute not found'
      });
    }

    const instituteCode = admin.instituteCode;

    // Get user counts using instituteCode
    const totalStudents = await User.countDocuments({ instituteCode, role: 'student' });
    const totalFaculty = await User.countDocuments({ instituteCode, role: 'faculty' });
    const pendingStudents = await User.countDocuments({ instituteCode, role: 'student', status: 'pending' });
    const pendingFaculty = await User.countDocuments({ instituteCode, role: 'faculty', status: 'pending' });
    const approvedStudents = await User.countDocuments({ instituteCode, role: 'student', status: 'approved' });
    const approvedFaculty = await User.countDocuments({ instituteCode, role: 'faculty', status: 'approved' });

    // Get credential counts
    const Credential = require('../models/Credential.model');
    const totalCredentials = await Credential.countDocuments({ issuerAddress: admin.walletAddress });
    const verifiedCredentials = await Credential.countDocuments({ issuerAddress: admin.walletAddress, status: 'verified' });
    const pendingCredentials = await Credential.countDocuments({ issuerAddress: admin.walletAddress, status: 'pending' });

    // Get recent activity (last 10 users)
    const recentUsers = await User.find({ instituteCode })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalFaculty,
          totalUsers: totalStudents + totalFaculty,
          pendingStudents,
          pendingFaculty,
          totalPending: pendingStudents + pendingFaculty,
          approvedStudents,
          approvedFaculty,
        },
        credentials: {
          total: totalCredentials,
          verified: verifiedCredentials,
          pending: pendingCredentials,
        },
        recentUsers: recentUsers.map(u => ({
          userId: u._id,
          email: u.email,
          role: u.role,
          status: u.status,
          firstName: u.profile?.firstName || '',
          lastName: u.profile?.lastName || '',
          createdAt: u.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching institute analytics:', error);
    next(error);
  }
});

module.exports = router;
