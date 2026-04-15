const mongoose = require('mongoose');

const skillNodeSchema = new mongoose.Schema({
  skillName: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'soft', 'domain', 'certification', 'language', 'other']
  },
  level: { type: Number, min: 1, max: 5, default: 1 },
  description: { type: String, maxlength: 500 },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SkillNode' }],
  credentials: [{
    credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential' },
    verified: { type: Boolean, default: false }
  }],
  badges: [{ tokenId: Number, earnedAt: Date }],
  xpPoints: { type: Number, default: 0 },
  icon: { type: String, default: '🎯' },
  isLocked: { type: Boolean, default: true },
  unlockedAt: Date
}, { timestamps: true });

const skillTreeSchema = new mongoose.Schema({
  studentAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: { type: String, default: 'My Skill Tree' },
  nodes: [skillNodeSchema],
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  completedNodes: { type: Number, default: 0 },
  totalNodes: { type: Number, default: 0 },
  branches: [{
    name: String,
    category: String,
    nodes: [{ type: mongoose.Schema.Types.ObjectId }],
    progress: { type: Number, default: 0 }
  }],
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

skillTreeSchema.index({ studentAddress: 1 });
skillTreeSchema.index({ 'nodes.skillName': 1 });

skillTreeSchema.methods.calculateProgress = function() {
  this.totalNodes = this.nodes.length;
  this.completedNodes = this.nodes.filter(n => !n.isLocked).length;
  this.totalXP = this.nodes.reduce((sum, n) => sum + n.xpPoints, 0);
  this.level = Math.floor(this.totalXP / 100) + 1;
  return this;
};

skillTreeSchema.methods.unlockNode = function(nodeId) {
  const node = this.nodes.id(nodeId);
  if (node && node.isLocked) {
    const prereqsMet = node.prerequisites.every(prereqId => {
      const prereqNode = this.nodes.id(prereqId);
      return prereqNode && !prereqNode.isLocked;
    });
    
    if (prereqsMet) {
      node.isLocked = false;
      node.unlockedAt = new Date();
      this.lastActivityAt = new Date();
      this.calculateProgress();
    }
  }
  return this;
};

skillTreeSchema.methods.addNodeXP = function(nodeId, points) {
  const node = this.nodes.id(nodeId);
  if (node) {
    node.xpPoints += points;
    this.lastActivityAt = new Date();
    this.calculateProgress();
  }
  return this;
};

skillTreeSchema.statics.getOrCreateForStudent = async function(studentAddress, studentId) {
  let tree = await this.findOne({ studentAddress });
  
  if (!tree) {
    tree = new this({
      studentAddress: studentAddress.toLowerCase(),
      studentId,
      nodes: [],
      branches: []
    });
    await tree.save();
  }
  
  return tree;
};

module.exports = mongoose.model('SkillTree', skillTreeSchema);