const natural = require('natural');
const mongoose = require('mongoose');

// Reuse Credential model from backend
const Credential = mongoose.model('Credential', new mongoose.Schema({
  studentId: String,
  course: String,
  grade: String,
  skills: [String],
  description: String,
  issuedBy: String,
  issuedDate: Date,
  status: String
}));

// Skill keywords for assessment
const skillKeywords = {
  technical: ['javascript', 'python', 'react', 'node.js', 'blockchain', 'solidity', 'web3', 'typescript', 'java', 'c++', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes'],
  soft: ['communication', 'leadership', 'teamwork', 'problem-solving', 'critical thinking', 'time management', 'adaptability'],
  business: ['management', 'finance', 'marketing', 'strategy', 'project management', 'agile', 'scrum']
};

// Assess skills from credentials
exports.assessSkills = async (req, res) => {
  try {
    const { userId } = req.body;

    const credentials = await Credential.find({ studentId: userId });

    if (!credentials.length) {
      return res.json({ skills: [], assessment: 'No credentials found' });
    }

    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;

    let extractedSkills = [];
    credentials.forEach(cred => {
      const text = `${cred.course} ${cred.description} ${cred.skills?.join(' ')}`;
      const tokens = tokenizer.tokenize(text.toLowerCase());
      const stemmed = tokens.map(token => stemmer.stem(token));

      Object.keys(skillKeywords).forEach(category => {
        skillKeywords[category].forEach(skill => {
          if (stemmed.includes(stemmer.stem(skill))) {
            extractedSkills.push({ skill, category, confidence: 0.8 });
          }
        });
      });
    });

    const uniqueSkills = extractedSkills.reduce((acc, curr) => {
      const existing = acc.find(s => s.skill === curr.skill);
      if (existing) {
        existing.confidence = Math.max(existing.confidence, curr.confidence);
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    res.json({
      skills: uniqueSkills,
      assessment: `Found ${uniqueSkills.length} skills across ${credentials.length} credentials`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recommendations based on skills
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    const userSkills = ['javascript', 'react', 'node.js']; // Default skills

    const recommendations = [];

    if (userSkills.includes('javascript')) {
      recommendations.push({
        type: 'course',
        title: 'Advanced React Development',
        reason: 'Build on existing JS skills',
        priority: 'high'
      });
    }

    if (userSkills.includes('blockchain') || userSkills.includes('solidity')) {
      recommendations.push({
        type: 'job',
        title: 'Blockchain Developer',
        reason: 'Strong match with blockchain skills',
        priority: 'high'
      });
    }

    if (userSkills.includes('python')) {
      recommendations.push({
        type: 'skill',
        title: 'Machine Learning with Python',
        reason: 'Enhance Python expertise',
        priority: 'medium'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'course',
        title: 'Introduction to Programming',
        reason: 'Start building technical skills',
        priority: 'low'
      });
    }

    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Analytics and insights
exports.getAnalytics = async (req, res) => {
  try {
    const credentials = await Credential.find({});

    const skillCounts = {};
    credentials.forEach(cred => {
      cred.skills?.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const gradeCounts = {};
    credentials.forEach(cred => {
      gradeCounts[cred.grade] = (gradeCounts[cred.grade] || 0) + 1;
    });

    res.json({
      totalCredentials: credentials.length,
      topSkills,
      gradeDistribution: gradeCounts,
      insights: [
        `Most demanded skill: ${topSkills[0]?.skill || 'N/A'}`,
        `Average credentials per student: ${(credentials.length / new Set(credentials.map(c => c.studentId)).size).toFixed(1)}`
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Skill gap analysis
exports.analyzeSkillGap = async (req, res) => {
  try {
    const { userId, targetSkills } = req.body;

    const userSkills = ['javascript', 'react']; // Default user skills

    const gaps = targetSkills.filter(skill => !userSkills.includes(skill.toLowerCase()));

    const recommendations = gaps.map(skill => ({
      skill,
      priority: 'high',
      suggestion: `Take course in ${skill}`,
      resources: [
        `Online course: ${skill} Fundamentals`,
        `Documentation: ${skill} Official Docs`
      ]
    }));

    res.json({
      currentSkills: userSkills,
      targetSkills,
      gaps,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};