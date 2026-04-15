const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const aiRoutes = require('./routes/aiRoutes');
//const aiRoutes = require('./routes/aiRoutes_ENHANCED');
app.use('/api/ai', aiRoutes);

// Root health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'AI Engine running', 
    port: process.env.PORT || 5002 
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 AI Engine running on port ${PORT}`);
  console.log(`📍 Routes: /api/ai/*`);
  console.log(`${'='.repeat(50)}\n`);
});

// Connect to MongoDB (reuse backend DB)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockcert')
  .then(() => console.log('AI Engine connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/*
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'AI Engine is running', timestamp: new Date() , port: process.env.PORT || 5002 });
});

app.listen(PORT, () => {
  console.log(`AI Engine running on port ${PORT}`);
  //console.log(`📍 Routes: /api/ai/*`);
});
*/