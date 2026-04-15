const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Main backend router configuration for BlockCert.
// This service handles authentication, credential management,
// institutional data, skill tracking, and public verification APIs.

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const credentialsRoutes = require('./routes/credentials.routes');
const credibilityRoutes = require('./routes/credibility.routes');
const facultyRoutes = require('./routes/faculty.routes');
const publicRoutes = require('./routes/public.routes');
const skillsRoutes = require('./routes/skills.routes');

// Import services
const blockchainService = require('./services/blockchain.service');

// Import models
const Institute = require('./models/Institute.model');
const User = require('./models/User.model');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - permissive for development
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint - list all users (remove in production)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Debug endpoint - list all institutes (remove in production)
app.get('/api/debug/institutes', async (req, res) => {
  try {
    const institutes = await Institute.find({});
    res.json({ success: true, count: institutes.length, data: institutes });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BlockCert API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount all API route groups below. Each route module is responsible
// for its own REST endpoints and request validation.
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/credibility', credibilityRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/skills', skillsRoutes);

// Public institute route for registration
app.use('/api/institutes', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockcert');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Initialize blockchain service
const initBlockchain = async () => {
  try {
    await blockchainService.initialize();
  } catch (error) {
    console.warn('⚠️ Blockchain initialization warning:', error.message);
  }
};

// Initialize default institute (disabled - admins create their own)
const initDefaultInstitute = async () => {
  // No auto-creation - admins create institutes during registration
  console.log('ℹ️ Institutes will be created by admins during registration');
};

// Start server
const startServer = async () => {
  await connectDB();
  await initDefaultInstitute();
  await initBlockchain();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`💚 Health check at http://localhost:${PORT}/health`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
});

module.exports = app;