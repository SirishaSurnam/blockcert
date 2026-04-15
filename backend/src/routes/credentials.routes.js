const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Credential = require('../models/Credential.model');
const User = require('../models/User.model');
const SkillTree = require('../models/SkillTree.model');
const blockchainService = require('../services/blockchain.service');
const ipfsService = require('../services/ipfsService');
const badgeService = require('../services/badgeService');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const router = express.Router();

// Configure multer for document upload
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/json'];
    
    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, PNG, and JSON files are allowed'));
  }
});

/**
 * POST /api/credentials/upload-document
 * Upload document for a credential
 */
router.post('/upload-document', protect, upload.single('document'), async (req, res) => {
  console.log('========================================');
  console.log('=== DOCUMENT UPLOAD REQUEST RECEIVED ===');
  console.log('========================================');
  console.log('User wallet:', req.user?.walletAddress);
  console.log('User role:', req.user?.userType);
  console.log('Content-Type header:', req.headers['content-type']);
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('req.body.credentialId:', req.body.credentialId);
  
  // Force JSON response header
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('Checking for file...');
    if (!req.file) {
      console.log('ERROR: No file in request');
      console.log('Available files:', req.files);
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      return res.status(400).json({ success: false, error: 'No file uploaded. Make sure the form has enctype="multipart/form-data"' });
    }

    const { credentialId } = req.body;
    
    console.log('FILE DETAILS:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      path: req.file.path
    });
    
    console.log('Received credentialId:', credentialId);
    
    if (!credentialId) {
      console.log('ERROR: No credential ID in body');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'No credential ID provided' });
    }

    console.log('Looking for credential with ID:', credentialId);
    
    // Try to find by ID directly
    const credential = await Credential.findById(credentialId);
    
    if (!credential) {
      console.log('ERROR: Credential not found with ID:', credentialId);
      try { fs.unlinkSync(req.file.path); } catch(e) {}
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    console.log('Found credential:', credential.credentialId, '-', credential.title);

    // Read file data and store as binary in MongoDB
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Update credential with binary document data
    credential.documentData = fileBuffer;
    credential.documentType = req.file.mimetype;
    credential.originalFileName = req.file.originalname;
    credential.documentUploadedAt = new Date();
    credential.documentSize = req.file.size;
    
    await credential.save();
    
    // Clean up the temporary uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('✅ Document saved to MongoDB as binary data:', credential.originalFileName);

    return res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentUrl: `/api/credentials/document/${credential._id}`, // URL to access document
        originalFileName: credential.originalFileName
      }
    });
  } catch (error) {
    console.error('ERROR in upload:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credentials/document/:id
 * Get document for a credential
 */
router.get('/document/:id', protect, async (req, res) => {
  console.log('========================================');
  console.log('=== DOCUMENT VIEW REQUEST RECEIVED ===');
  console.log('========================================');
  console.log('User wallet:', req.user?.walletAddress);
  console.log('User role:', req.user?.userType);
  console.log('User ID:', req.user?.userId);
  console.log('Requested credential ID:', req.params.id);
  
  try {
    const credential = await Credential.findById(req.params.id);
    if (!credential) {
      console.log('ERROR: Credential not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Credential not found' });
    }

    console.log('Found credential:', {
      id: credential._id,
      title: credential.title,
      studentAddress: credential.studentAddress,
      status: credential.status,
      hasDocumentData: !!(credential.documentData && credential.documentData.length > 0),
      hasDocumentUrl: !!credential.documentUrl,
      hasVerificationLink: !!credential.verificationLink,
      hasIpfsHash: !!credential.ipfsHash
    });

    const walletAddress = req.user.walletAddress?.toLowerCase();
    const userRole = req.user.userType; // JWT token uses 'userType', not 'role'

    console.log('Authorization check:', {
      credentialOwner: credential.studentAddress,
      userWallet: walletAddress,
      userRole: userRole,
      isOwner: credential.studentAddress === walletAddress,
      isFaculty: userRole === 'faculty',
      isAdmin: userRole === 'admin'
    });

    // Only allow student (owner), faculty, or admin to view
    if (credential.studentAddress !== walletAddress && 
        userRole !== 'faculty' && 
        userRole !== 'admin') {
      console.log('❌ ACCESS DENIED: User does not have permission to view this document');
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('✅ ACCESS GRANTED: User can view this document');

    // Handle verification links first (redirect directly)
    if (credential.verificationLink) {
      return res.redirect(credential.verificationLink);
    }
    
    // If verified and has IPFS, redirect to IPFS gateway
    const ipfsHash = credential.ipfsHash || credential.documentIPFS;
    if (credential.status === 'verified' && ipfsHash) {
      const ipfsGateway = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
      const ipfsUrl = `${ipfsGateway}${ipfsHash.replace('ipfs://', '')}`;
      
      // Redirect directly to IPFS gateway instead of returning JSON
      return res.redirect(ipfsUrl);
    }
    
    // If has document in MongoDB (pending or rejected)
    if (credential.documentData && credential.documentData.length > 0) {
      // Set appropriate headers for file download
      const mimeType = credential.documentType || 'application/octet-stream';
      const fileName = credential.originalFileName || 'document';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', credential.documentData.length);
      
      // Send the binary data directly
      return res.send(credential.documentData);
    }
    
    // If has document URL (legacy local file path)
    if (credential.documentUrl && credential.documentUrl.startsWith('/uploads/')) {
      // For legacy local documents, redirect to the uploaded file
      return res.redirect(credential.documentUrl);
    }
    
    // No document or verification link available
    return res.json({
      success: false,
      error: 'No document or verification link available'
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/credentials/my-credentials
 * Get all credentials for the logged-in user (student)
 */
router.get('/my-credentials', protect, async (req, res, next) => {
  try {
    const walletAddress = req.user.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'No wallet address associated with account'
      });
    }

    const credentials = await Credential.find({
      studentAddress: walletAddress.toLowerCase()
    }).sort({ issuedAt: -1 });

    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/credentials/pending
 * Get all pending credentials (faculty only)
 */
router.get('/pending', protect, authorize('faculty', 'admin'), async (req, res, next) => {
  try {
    const credentials = await Credential.find({ status: 'pending' })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: credentials,
      count: credentials.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/credentials/submit
 * Student submits credential for verification
 */
router.post('/submit', protect, async (req, res, next) => {
  try {
    const { title, description, category, skills, verificationLink } = req.body;
    const studentAddress = req.user.walletAddress;

    if (!studentAddress) {
      return res.status(400).json({
        success: false,
        error: 'No wallet address associated with your account'
      });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Credential title is required'
      });
    }

    // Create credential with pending status
    // Use max credentialId + 1 instead of count to avoid duplicates
    const maxCredential = await Credential.findOne().sort({ credentialId: -1 });
    const nextCredentialId = maxCredential ? maxCredential.credentialId + 1 : 1;
    
    // Parse skills from comma-separated string or array
    let skillsArray = [];
    if (skills) {
      if (typeof skills === 'string') {
        skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(skills)) {
        skillsArray = skills;
      }
    }

    const credential = new Credential({
      credentialId: nextCredentialId,
      studentAddress: studentAddress.toLowerCase(),
      issuerAddress: studentAddress.toLowerCase(),
      metadataURI: 'pending-verification',
      title: title.trim(),
      description: description || '',
      category: category || 'technical',
      skills: skillsArray,
      status: 'pending',
      verificationLink: verificationLink || null,
      verificationMethod: 'manual',
      verificationType: 'faculty',
      platform: {
        verificationUrl: verificationLink || null,
        certificateUrl: verificationLink || null,
      },
      issuedAt: new Date()
    });

    await credential.save();

    console.log(`📝 Credential submitted: ${title} by ${studentAddress}`);

    res.status(201).json({
      success: true,
      message: 'Credential submitted for verification',
      data: credential
    });
  } catch (error) {
    console.error('Credential submission error:', error);
    next(error);
  }
});

/**
 * POST /api/credentials/:id/approve
 * Approve a credential (faculty only)
 */
router.post('/:id/approve', protect, authorize('faculty', 'admin'), async (req, res, next) => {
  try {
    const credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    if (credential.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Credential is not pending approval' });
    }

    // Update credential status to verified
    credential.status = 'verified';
    credential.verifiedBy = req.user.walletAddress;
    credential.verifiedByName = req.user.role;
    credential.verifiedAt = new Date();

    // Check if credential has a document that needs to be uploaded to IPFS
    if (credential.documentData && credential.documentData.length > 0) {
      try {
        console.log('📤 Uploading document to IPFS for credential:', credential._id);

        const fileBuffer = credential.documentData;
        const fileName = credential.originalFileName || 'document';

        // Upload to IPFS
        const ipfsUri = await ipfsService.uploadFile(fileBuffer, fileName);

        // Store IPFS hash in credential and remove binary data
        credential.documentIPFS = ipfsUri;
        credential.ipfsHash = ipfsUri.replace('ipfs://', '');
        credential.ipfsUploadedAt = new Date();

        // Remove document data from MongoDB to save space
        credential.documentData = undefined;
        credential.documentUrl = undefined; // Clear legacy URL if exists

        console.log('✅ Document uploaded to IPFS and removed from MongoDB:', ipfsUri);
      } catch (ipfsError) {
        console.error('❌ IPFS upload failed:', ipfsError);
        // Continue with approval even if IPFS upload fails
      }
    } else if (credential.verificationLink) {
      // Handle link-based credentials - upload metadata to IPFS
      try {
        console.log('📤 Uploading credential metadata to IPFS for link-based credential:', credential._id);

        // Create metadata object for the credential
        const credentialMetadata = {
          id: credential._id,
          credentialId: credential.credentialId,
          title: credential.title,
          description: credential.description,
          category: credential.category,
          skills: credential.skills,
          studentAddress: credential.studentAddress,
          issuerAddress: credential.issuerAddress,
          verificationLink: credential.verificationLink,
          platform: credential.platform,
          issuedAt: credential.issuedAt,
          verifiedAt: credential.verifiedAt,
          verifiedBy: credential.verifiedBy,
          status: credential.status,
          type: 'link-based-credential'
        };

        // Upload metadata to IPFS
        const ipfsUri = await ipfsService.uploadJSON(credentialMetadata, `credential-${credential.credentialId}`);

        // Store IPFS hash in credential
        credential.documentIPFS = ipfsUri;
        credential.ipfsHash = ipfsUri.replace('ipfs://', '');
        credential.ipfsUploadedAt = new Date();

        console.log('✅ Credential metadata uploaded to IPFS:', ipfsUri);
      } catch (ipfsError) {
        console.error('❌ IPFS metadata upload failed:', ipfsError);
        // Continue with approval even if IPFS upload fails
      }
    }

    await credential.save();

    // Auto-mint badge for the verified credential
    try {
      await badgeService.autoMintOnValidation(credential);
      console.log(`🎖️ Auto-minted badge for credential: ${credential.title}`);
    } catch (badgeError) {
      console.error('❌ Badge auto-mint failed:', badgeError);
      // Continue with approval even if badge minting fails
    }

    console.log(`✅ Credential approved: ${credential.title} by ${req.user.walletAddress}`);

    res.json({
      success: true,
      message: 'Credential approved successfully',
      data: credential
    });
  } catch (error) {
    console.error('Credential approval error:', error);
    next(error);
  }
});

/**
 * POST /api/credentials/:id/reject
 * Reject a credential (faculty only)
 */
router.post('/:id/reject', protect, authorize('faculty', 'admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;

    const credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    if (credential.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Credential is not pending approval' });
    }

    // Update credential status to rejected
    credential.status = 'rejected';
    credential.rejectionReason = reason || 'Rejected by faculty';
    credential.verifiedBy = req.user.walletAddress;
    credential.verifiedByName = req.user.role;
    credential.verifiedAt = new Date();

    await credential.save();

    console.log(`❌ Credential rejected: ${credential.title} by ${req.user.walletAddress}`);

    res.json({
      success: true,
      message: 'Credential rejected successfully',
      data: credential
    });
  } catch (error) {
    console.error('Credential rejection error:', error);
    next(error);
  }
});

module.exports = router;