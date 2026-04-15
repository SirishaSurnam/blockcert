const express = require('express');
const axios = require('axios'); 
const User = require('../models/User.model');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const router = express.Router();

/**
 * GET /api/faculty/:facultyAddress
 */
router.get('/:facultyAddress', async (req, res, next) => {
  try {
    const { facultyAddress } = req.params;

    const faculty = await User.findOne({
      walletAddress: facultyAddress.toLowerCase(),
      role: 'faculty'
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: 'Faculty not found'
      });
    }

    res.json({
      success: true,
      data: {
        walletAddress: faculty.walletAddress,
        name: `${faculty.profile?.firstName || ''} ${faculty.profile?.lastName || ''}`.trim(),
        department: faculty.profile?.department,
        email: faculty.email
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/mentorship-insights/:studentAddress', async (req, res) => {
  try {
    const { studentAddress } = req.params;

    // 1. Fetch Student Data (Ensure you have these models imported at top)
    const student = await User.findOne({ 
      walletAddress: studentAddress.toLowerCase() 
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const credentials = await Credential.find({ 
      studentAddress: studentAddress.toLowerCase() 
    });

    // 2. Aggregate skills
    const skills = credentials.flatMap(c => c.skills || []);

    // 3. Call Python AI for advice
    let advice = "Review student manually.";
    try {
      const pythonServiceUrl = 'http://localhost:5001/mentorship-advice';
      const response = await axios.post(pythonServiceUrl, { skills });
      advice = response.data.advice || advice;
    } catch (err) {
      console.log("Python AI unreachable for advice, using default.");
    }

    // 4. Return structured Mentorship Insights
    res.json({
      success: true,
      student_name: student.fullName,
      current_skills: skills,
      // This data comes from AI or Fallback
      mentorship_advice: {
        guidance: advice,
        suggested_action: "Discuss this recommendation with the student in the next mentorship meeting."
      }
    });

  } catch (error) {
    console.error('Mentorship Insight Error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});


/**
 * GET /api/faculty
 */
router.get(
  '/',
  validate(schemas.paginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const faculty = await User.find({ isActive: true, role: 'faculty' })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments({ isActive: true, role: 'faculty' });

      res.json({
        success: true,
        data: faculty.map(f => ({
          walletAddress: f.walletAddress,
          name: `${f.profile?.firstName || ''} ${f.profile?.lastName || ''}`.trim(),
          department: f.profile?.department,
          email: f.email
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/faculty
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  validate(schemas.addFacultySchema),
  async (req, res, next) => {
    try {
      const { walletAddress, name, department, email } = req.body;

      const existing = await User.findOne({ walletAddress });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Faculty member already exists'
        });
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const faculty = new User({
        walletAddress: walletAddress.toLowerCase(),
        email: email.toLowerCase(),
        role: 'faculty',
        profile: {
          firstName,
          lastName,
          department,
        },
        isActive: true,
        isVerified: false,
      });

      await faculty.save();

      res.status(201).json({
        success: true,
        message: 'Faculty member registered successfully',
        data: {
          walletAddress,
          name,
          department
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/faculty/:facultyAddress
 */
router.delete(
  '/:facultyAddress',
  protect,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { facultyAddress } = req.params;

      const faculty = await User.findOne({ walletAddress: facultyAddress, role: 'faculty' });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          error: 'Faculty member not found'
        });
      }

      faculty.isActive = false;
      await faculty.save();

      res.json({
        success: true,
        message: 'Faculty member removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;