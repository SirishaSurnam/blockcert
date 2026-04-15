const mongoose = require('mongoose');
const credentialSchema = new mongoose.Schema(
  {
    credentialId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    studentAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    issuerAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    issuerName: String,
    metadataURI: {
      type: String,
      default: 'pending-verification',
    },
    title: String,
    description: String,
    type: { type: String, default: 'certificate' },
    category: String,
    course: String,
    grade: String,
    skills: [String],
    
    // Document storage fields
    documentData: Buffer, // Binary document data stored in MongoDB
    documentUrl: String, // URL/path to uploaded document (MongoDB or local)
    documentType: String, // pdf, json, image, etc.
    originalFileName: String, // Original uploaded file name
    documentUploadedAt: Date, // When document was uploaded
    
    // IPFS storage (used after verification)
    ipfsHash: String, // IPFS hash after verified
    ipfsUploadedAt: Date, // When uploaded to IPFS
    documentIPFS: String, // Alternative field name for IPFS document hash
    documentSize: Number, // File size in bytes
    
    // Direct verification link field (for frontend compatibility)
    verificationLink: String,
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    validUntil: Date,
    revoked: {
      type: Boolean,
      default: false,
    },
    revocationReason: String,
    rejectionReason: String, // Alias for frontend compatibility
    revokedAt: Date,
    revokedBy: String,
    endorsementCount: {
      type: Number,
      default: 0,
    },
    endorsers: [
      {
        address: { type: String, lowercase: true },
        endorsedAt: { type: Date, default: Date.now },
        comment: String,
      },
    ],
    transactionHash: String,
    blockNumber: Number,
    badgeTokenId: Number,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'revoked'],
      default: 'pending',
    },
    
    // ===== AUTOMATED VERIFICATION FIELDS =====
    verificationMethod: {
      type: String,
      enum: ['manual', 'automated', 'oauth'],
      default: 'manual',
    },
    verificationType: {
      type: String,
      enum: ['faculty', 'platform', 'oauth', 'manual'],
      default: 'faculty',
    },
    
    // Platform verification details
    platform: {
      name: {
        type: String,
        enum: ['coursera', 'simplilearn', 'edx', 'udemy', 'linkedin', 'google', 'microsoft', 'aws', 'other', 'internal'],
      },
      certificateUrl: String,
      credentialId: String, // Platform's own credential ID
      verificationUrl: String, // Direct verification link
      verificationCheckedAt: Date,
      verificationResponse: mongoose.Schema.Types.Mixed, // Raw response from platform
    },
    
    // Who verified this credential
    verifiedBy: {
      type: String, // Wallet address or 'system' for automated
      default: null,
    },
    verifiedByName: {
      type: String, // Faculty name or platform name
      default: null,
    },
    verifiedAt: Date,
    
    // Automated verification confidence score (0-100)
    verificationConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    
    // Verification attempt history
    verificationAttempts: [{
      attemptedAt: { type: Date, default: Date.now },
      method: String,
      success: Boolean,
      error: String,
      responseData: mongoose.Schema.Types.Mixed,
    }],
    
    // For OAuth connected accounts
    oauthConnection: {
      provider: String,
      connectedAt: Date,
      accessTokenEncrypted: String,
      refreshTokenEncrypted: String,
      tokenExpiresAt: Date,
    },
    
    // Student's name as it appears on the certificate (for matching)
    certificateHolderName: String,
    nameMatchScore: Number, // How closely the name matches student profile
  },
  { timestamps: true }
);

// Indexes for efficient queries
credentialSchema.index({ studentAddress: 1, revoked: 1 });
credentialSchema.index({ issuerAddress: 1 });
credentialSchema.index({ issuedAt: -1 });
credentialSchema.index({ 'platform.name': 1 });
credentialSchema.index({ verificationMethod: 1 });
credentialSchema.index({ status: 1 });

// Method to add endorsement
credentialSchema.methods.addEndorsement = function (endorserAddress, comment = '') {
  const existingEndorsement = this.endorsers.find(
    (e) => e.address.toLowerCase() === endorserAddress.toLowerCase()
  );
  if (!existingEndorsement) {
    this.endorsers.push({ address: endorserAddress.toLowerCase(), comment });
    this.endorsementCount = this.endorsers.length;
  }
  return this;
};

// Method to revoke
credentialSchema.methods.revoke = function (reason, revokedBy) {
  this.revoked = true;
  this.revocationReason = reason;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.status = 'revoked';
  return this;
};

// Method to mark as verified (automated or manual)
credentialSchema.methods.markVerified = function(verifiedBy, verifiedByName, verificationMethod = 'manual') {
  this.status = 'verified';
  this.verifiedBy = verifiedBy;
  this.verifiedByName = verifiedByName;
  this.verifiedAt = new Date();
  this.verificationMethod = verificationMethod;
  return this;
};

// Add verification attempt
credentialSchema.methods.addVerificationAttempt = function(method, success, error = null, responseData = null) {
  this.verificationAttempts.push({
    attemptedAt: new Date(),
    method,
    success,
    error,
    responseData,
  });
  return this;
};

module.exports = mongoose.model('Credential', credentialSchema);