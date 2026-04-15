const Credential = require('../models/Credential.model');
const User = require('../models/User.model');
const qrService = require('../services/qrService');

/**
 * Public verification - no authentication required
 */
exports.verifyCredential = async (req, res) => {
  try {
    const { credentialId, studentAddress } = req.params;

    if (!credentialId) {
      return res.status(400).json({ error: 'Credential ID required' });
    }

     const credential = await Credential.findById(credentialId);

    if (!credential) {
      return res.status(404).json({
        verified: false,
        error: 'Credential not found'
      });
    }

    const isValid = !credential.revoked;
    const isRevoked = credential.revoked || false;

    // Generate profile QR code for the student (shows all credentials)
    const profileQR = await qrService.generateProfileQR(
      credential.studentAddress,
      '' // Name will be fetched separately if needed
    );
    
    // Get IPFS gateway URL from environment or use default
    const ipfsGateway = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    
    // Check both ipfsHash and documentIPFS fields (for backward compatibility)
    const ipfsHash = credential.ipfsHash || credential.documentIPFS;
    
    // Construct IPFS URL if credential has IPFS hash
    const ipfsUrl = ipfsHash 
      ? `${ipfsGateway}${ipfsHash.replace('ipfs://', '')}` 
      : null;
     
     const response = {
       verified: isValid && !isRevoked,
       credential: {
         id: credential._id,
         courseName: credential.title || 'Credential',
         skillsVerified: credential.skills || [],
         grade: credential.grade || 'N/A',
         description: credential.description,
         issueDate: credential.issuedAt
       },
        student: {
          name: credential.studentAddress ? 'Student' : 'Unknown',
          walletAddress: credential.studentAddress
        },
       issuer: {
         name: credential.issuerName || 'Unknown'
       },
       status: {
         isValid,
         isRevoked,
         currentStatus: isRevoked ? 'Revoked' : isValid ? 'Valid' : 'Invalid'
       },
        // IPFS document access
        document: {
          ipfsHash: ipfsHash,
          ipfsUrl: ipfsUrl,
          originalFileName: credential.originalFileName,
          documentType: credential.documentType,
          documentSize: credential.documentSize,
          hasDocumentData: !!(credential.documentData && credential.documentData.length > 0),
          verificationLink: credential.verificationLink
        },
       // Return profile QR instead of credential-specific QR
       profileQR: profileQR.qrCode,
       profileUrl: profileQR.profileUrl,
       verifiedAt: new Date().toISOString()
     };

    res.json(response);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      verified: false,
      error: 'Verification failed',
      details: error.message
    });
  }
};

/**
 * Verify credential by QR code scan
 */
exports.verifyByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    const parsedData = qrService.parseQRData(qrData);

    if (parsedData.error) {
      return res.status(400).json({ error: parsedData.error });
    }

    const credentialId = parsedData.id || parsedData.credentialId;

    if (!credentialId) {
      return res.status(400).json({ error: 'Invalid QR code' });
    }

    req.params.credentialId = credentialId;
    return exports.verifyCredential(req, res);
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ error: 'QR verification failed' });
  }
};

/**
 * Batch verify multiple credentials
 */
exports.batchVerify = async (req, res) => {
  try {
    const { credentialIds } = req.body;

    if (!Array.isArray(credentialIds) || credentialIds.length === 0) {
      return res.status(400).json({ error: 'Credential IDs array required' });
    }

    if (credentialIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 credentials per batch' });
    }

    const results = await Promise.all(
      credentialIds.map(async (id) => {
        try {
          const credential = await Credential.findById(id);
          if (!credential) {
            return { id, verified: false, error: 'Not found' };
          }

          return {
            id,
            verified: !credential.revoked,
            status: credential.revoked ? 'revoked' : 'valid',
            courseName: credential.title,
            issueDate: credential.issuedAt
          };
        } catch (error) {
          return { id, verified: false, error: error.message };
        }
      })
    );

    const summary = {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      revoked: results.filter(r => r.status === 'revoked').length,
      errors: results.filter(r => r.error).length
    };

    res.json({ results, summary });
  } catch (error) {
    console.error('Batch verification error:', error);
    res.status(500).json({ error: 'Batch verification failed' });
  }
};

/**
 * Get student public profile - enhanced with blockchain hash
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { studentAddress } = req.params;

    // Normalize the address - convert to lowercase for lookup
    const normalizedAddress = studentAddress.toLowerCase();
    
    // Find student by wallet address (case-insensitive)
    const student = await User.findOne({
      walletAddress: normalizedAddress
    });

    if (!student) {
      // Try to find by regex as fallback
      const studentByRegex = await User.findOne({
        walletAddress: { $regex: new RegExp('^' + normalizedAddress + '$', 'i') }
      });
      
      if (!studentByRegex) {
        return res.status(404).json({ error: 'Student not found', address: normalizedAddress });
      }
    }

    // Get only verified credentials for public profile
    // Filter out revoked and pending ones
    const credentials = await Credential.find({
      studentAddress: normalizedAddress,
      status: 'verified',
      revoked: false
    }).sort({ issuedAt: -1 });

    const skills = {};
    credentials.forEach(cred => {
      cred.skills?.forEach(skill => {
        skills[skill] = (skills[skill] || 0) + 1;
      });
    });

    const skillsSummary = Object.entries(skills)
      .map(([skill, count]) => ({
        skill,
        count,
        level: count >= 5 ? 'Expert' : count >= 3 ? 'Advanced' : 'Intermediate'
      }))
      .sort((a, b) => b.count - a.count);

    const profileQR = await qrService.generateProfileQR(
      normalizedAddress,
      `${student?.profile?.firstName || ''} ${student?.profile?.lastName || ''}`.trim()
    );

     // Get blockchain hash from first credential (for verification)
     const blockchainHash = credentials.length > 0 && credentials[0].transactionHash 
       ? credentials[0].transactionHash 
       : null;
       
     // Get IPFS gateway URL for document access
     const ipfsGateway = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

    res.json({
      student: {
        name: `${student?.profile?.firstName || ''} ${student?.profile?.lastName || ''}`.trim() || 'Anonymous',
        walletAddress: student?.walletAddress || normalizedAddress,
        bio: student?.profile?.bio,
        department: student?.profile?.department,
        instituteName: student?.instituteName || null
      },
       credentials: credentials.map(c => {
         // Construct IPFS URL if credential has IPFS hash
         const ipfsUrl = c.ipfsHash 
           ? `${ipfsGateway}${c.ipfsHash.replace('ipfs://', '')}` 
           : null;
         
         return {
           id: c._id,
           title: c.title,
           description: c.description,
           skills: c.skills,
           issuedAt: c.issuedAt,
           verified: c.status === 'verified',
           status: c.status,
           // Issuer information
           issuerName: c.issuerName,
           issuerAddress: c.issuerAddress,
           // Blockchain verification
           blockchainHash: c.transactionHash || null,
           blockNumber: c.blockNumber || null,
           // IPFS metadata
           metadataURI: c.metadataURI || null,
           ipfsHash: c.ipfsHash,
           ipfsUrl: ipfsUrl,
           // Additional details
           category: c.category,
           course: c.course,
           grade: c.grade
         };
       }),
      skills: skillsSummary,
      statistics: {
        totalCredentials: credentials.length,
        uniqueSkills: skillsSummary.length
      },
      // Blockchain verification data
      blockchain: {
        walletAddress: student?.walletAddress || normalizedAddress,
        // Use a consistent profile hash based on wallet address for verification
        profileHash: normalizedAddress 
          ? '0x' + Buffer.from(normalizedAddress).toString('hex').slice(0, 64).padEnd(64, '0')
          : null,
        transactionHash: blockchainHash,
        verifiedAt: new Date().toISOString()
      },
      profileQR: profileQR.qrCode,
      profileUrl: profileQR.profileUrl
    });
  } catch (error) {
    console.error('Public profile error:', error);
    res.status(500).json({ error: 'Failed to load profile', details: error.message });
  }
};

/**
 * Get verification statistics
 */
exports.getVerificationStats = async (req, res) => {
  try {
    const totalCredentials = await Credential.countDocuments();
    const validCredentials = await Credential.countDocuments({ revoked: false });
    const revokedCredentials = await Credential.countDocuments({ revoked: true });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });

    const recentCredentials = await Credential.find()
      .sort({ issuedAt: -1 })
      .limit(10)
      .select('title issuedAt revoked');

    res.json({
      stats: {
        totalCredentials,
        validCredentials,
        revokedCredentials,
        totalStudents,
        totalFaculty,
        lastUpdated: new Date().toISOString()
      },
      recentCredentials
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
};
