const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// Student Dashboard
router.get('/student', auth, analyticsController.getStudentAnalytics);

// Faculty Dashboard
router.get('/faculty', auth, analyticsController.getFacultyAnalytics);

// Admin Dashboard
router.get('/admin', auth, analyticsController.getAdminAnalytics);

// Employer Dashboard
router.get('/employer', auth, analyticsController.getEmployerAnalytics);

module.exports = router;