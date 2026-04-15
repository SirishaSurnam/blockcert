const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const auth = require('../middleware/auth');

// Get student badges
router.get('/student/:studentAddress', badgeController.getStudentBadges);

// Mint badge (Faculty/Admin only)
router.post('/mint', auth, badgeController.mintBadge);

// Get milestones
router.get('/milestones/:studentAddress', badgeController.getMilestones);

module.exports = router;