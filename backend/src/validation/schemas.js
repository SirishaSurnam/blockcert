const Joi = require('joi');

// Register schema
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  walletAddress: Joi.string().allow('').optional(),
  userType: Joi.string().valid('student', 'faculty', 'employer', 'admin').required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  // Institute fields for admin
  instituteName: Joi.string().optional(),
  instituteCode: Joi.string().optional(),
  // College ID for students/faculty
  collegeId: Joi.string().optional()
});

// Login schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Issue credential schema
const issueCredentialSchema = Joi.object({
  studentAddress: Joi.string().required(),
  metadataURI: Joi.string().required(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  grade: Joi.string().optional(),
  course: Joi.string().optional()
});

// Endorse credential schema
const endorseCredentialSchema = Joi.object({
  comment: Joi.string().optional()
});

// Revoke credential schema
const revokeCredentialSchema = Joi.object({
  reason: Joi.string().required()
});

// Credential query schema
const credentialQuerySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  studentAddress: Joi.string().optional(),
  issuerAddress: Joi.string().optional(),
  revoked: Joi.string().valid('true', 'false').optional()
});

// Pagination schema
const paginationSchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
});

// Add faculty schema
const addFacultySchema = Joi.object({
  walletAddress: Joi.string().required(),
  name: Joi.string().required(),
  department: Joi.string().optional(),
  email: Joi.string().email().required()
});

// Remove faculty schema
const removeFacultySchema = Joi.object({});

// Register student schema
const registerStudentSchema = Joi.object({
  walletAddress: Joi.string().required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  department: Joi.string().optional(),
  enrollmentYear: Joi.number().optional()
});

// Mint badge schema
const mintBadgeSchema = Joi.object({
  recipientAddress: Joi.string().required(),
  credentialId: Joi.string().required(),
  tokenURI: Joi.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  issueCredentialSchema,
  endorseCredentialSchema,
  revokeCredentialSchema,
  credentialQuerySchema,
  paginationSchema,
  addFacultySchema,
  removeFacultySchema,
  registerStudentSchema,
  mintBadgeSchema
};