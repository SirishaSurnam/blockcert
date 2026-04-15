const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const analyticsController = require('../controllers/analyticsController');
const badgeController = require('../controllers/badgeController');
const { protect } = require('../middleware/auth');
const Credential = require('../models/Credential.model');
const User = require('../models/User.model');
const qrService = require('../services/qrService');
const resumeService = require('../services/resumeService');

// ======================
// PUBLIC ROUTES
// ======================

router.get('/verify/:credentialId', verificationController.verifyCredential);
router.get('/verify/:credentialId/:studentAddress', verificationController.verifyCredential);
router.post('/verify-qr', verificationController.verifyByQR);
router.post('/batch-verify', verificationController.batchVerify);
router.get('/profile/:studentAddress', verificationController.getPublicProfile);
router.get('/stats', verificationController.getVerificationStats);

// Generate profile QR code
router.get('/qr/:studentAddress', async (req, res) => {
  try {
    const { studentAddress } = req.params;
    const { name } = req.query;
    
    const qr = await qrService.generateProfileQR(studentAddress, name || '');
    
    res.json({
      success: true,
      qrCode: qr.qrCode,
      profileUrl: qr.profileUrl
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ======================
// PROTECTED ROUTES
// ======================

// Analytics
router.get('/analytics/student', protect, analyticsController.getStudentAnalytics);
router.get('/analytics/faculty', protect, analyticsController.getFacultyAnalytics);
router.get('/analytics/admin', protect, analyticsController.getAdminAnalytics);
router.get('/analytics/employer', protect, analyticsController.getEmployerAnalytics);

// Badges
router.get('/badges/:studentAddress', badgeController.getStudentBadges);
router.post('/badges/mint', protect, badgeController.mintBadge);
router.get('/badges/milestones/:studentAddress', badgeController.getMilestones);
router.post('/badges/revoke/:tokenId', protect, badgeController.revokeBadge);
router.get('/badges/analytics', protect, badgeController.getBadgeAnalytics);

// QR Codes - Student Profile QR only (shows all credentials)
router.get('/qr/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const qr = await qrService.generateProfileQR(
      user.walletAddress,
      `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
    );

    res.json(qr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export
router.get('/export/credentials', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const credentials = await Credential.find({
      studentAddress: user.walletAddress.toLowerCase()
    });

    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume - Generate CV/Resume data
router.get('/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const resumeData = await resumeService.prepareCVData(user.walletAddress);
    
    res.json({
      success: true,
      data: resumeData
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume - Download as JSON
router.get('/resume/export', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const resumeJson = await resumeService.generateResumePDF(user.walletAddress);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=resume-${user.walletAddress.slice(0, 8)}.json`);
    res.send(resumeJson);
  } catch (error) {
    console.error('Resume export error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;