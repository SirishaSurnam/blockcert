const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

// Helper function to call Python service
async function callPythonService(endpoint, data) {
  try {
    const response = await axios.post(`${PYTHON_AI_URL}${endpoint}`, data, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Python service error (${endpoint}):`, error.message);
    return { success: false, error: error.message };
  }
}

// 1. Health Check
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_AI_URL}/health`, { timeout: 5000 });
    res.json({
      node_service: 'running',
      python_service: response.data
    });
  } catch (error) {
    res.json({
      node_service: 'running',
      python_service: 'unavailable',
      error: error.message
    });
  }
});

// 2. Career Guidance (PyTorch Sentence Transformers)
// Using ML-based semantic similarity for career matching
router.post('/career-guidance', async (req, res) => {
  try {
    const { skills } = req.body;
    
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills array required' });
    }

    // Call Python service with PyTorch endpoint (direct, no Gemini)
    const result = await callPythonService('/career-guidance', { skills });
    
    if (result.success && result.data.success) {
      const data = result.data;
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        source: 'pytorch-sentence-transformers',
        overall_recommendation: data.overall_recommendation,
        career_options: data.career_options || [],
        total_careers_analyzed: data.total_careers_analyzed
      });
    } else {
      // Provide detailed error
      const errorMsg = result.data?.error || result.error || 'Unknown error';
      res.status(503).json({ 
        success: false,
        error: 'Career guidance service unavailable',
        details: errorMsg,
        hint: 'Make sure Python service is running on port 5001'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Course Recommendations
router.post('/recommend-courses', async (req, res) => {
  try {
    const { skills } = req.body;
    
    const result = await callPythonService('/recommend-courses', { skills });
    
    if (result.success) {
      res.json(result.data);
    } else {
      // Fallback
      res.json({
        success: true,
        source: 'Fallback',
        recommendations: []
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Skill Gap Analysis
router.post('/skill-gap', async (req, res) => {
  try {
    const { current_skills, target_career } = req.body;
    
    const result = await callPythonService('/skill-gap-analysis', {
      current_skills,
      target_career: target_career || 'fullstack_developer'
    });
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Skill gap analysis unavailable' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Learning Path
router.post('/learning-path', async (req, res) => {
  try {
    const { target_career, current_skills } = req.body;
    
    const result = await callPythonService('/learning-path', {
      target_career,
      current_skills: current_skills || []
    });
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Learning path unavailable' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Mentorship Insights (for Faculty)
router.post('/mentorship-insights', async (req, res) => {
  try {
    const { skills, name } = req.body;
    
    const result = await callPythonService('/mentorship-insights', {
      skills: skills || [],
      name: name || 'Student'
    });
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.json({
        success: true,
        advice: 'Review student credentials manually.',
        priority: 'medium'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. AI Learning Path (Gemini LLM powered - for Analytics page)
router.post('/ai-learning-path', async (req, res) => {
  try {
    const { skills, target_career, interests, education_level } = req.body;
    
    // Build user profile for Gemini
    const profile = {
      skills: skills || [],
      interests: interests || [],
      education_level: education_level || 'undergraduate',
      target_career: target_career || '',
      current_role: 'student',
      experience_years: 0
    };
    
    // Call Gemini-powered endpoint
    const result = await callPythonService('/ai-career-guidance', profile);
    
    if (result.success && result.data.success) {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...result.data,
        source: 'gemini-1.5-flash'
      });
    } else {
      // Try fallback to learning-path endpoint
      const fallbackResult = await callPythonService('/learning-path', {
        target_career: target_career,
        current_skills: skills || []
      });
      
      if (fallbackResult.success) {
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          source: 'fallback-pytorch',
          learning_path: fallbackResult.data.learning_path || []
        });
      } else {
        res.status(503).json({ 
          success: false,
          error: 'AI learning path service unavailable',
          details: result.error 
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Get Personalized Recommendations (Courses, Certifications, Internships)
router.post('/recommendations', async (req, res) => {
  try {
    const { 
      skills, 
      projects, 
      certifications, 
      education, 
      target_career 
    } = req.body;
    
    const profile = {
      skills: skills || [],
      projects: projects || [],
      certifications: certifications || [],
      education: education || {},
      target_career: target_career || ''
    };
    
    // Call Python service for Gemini-powered recommendations
    const result = await callPythonService('/recommendations', profile);
    
    if (result.success && result.data.success) {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...result.data,
        source: 'gemini-1.5-flash'
      });
    } else {
      res.status(503).json({ 
        success: false,
        error: 'Recommendations service unavailable',
        details: result.error || result.data?.error
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;