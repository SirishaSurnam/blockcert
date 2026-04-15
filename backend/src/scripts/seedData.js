const mongoose = require('mongoose');
const User = require('../models/User.model');
const Institute = require('../models/Institute.model');
const Credential = require('../models/Credential.model');
const SkillTree = require('../models/SkillTree.model');
const Leaderboard = require('../models/Leaderboard.model');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockcert');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Institute.deleteMany({}),
      Credential.deleteMany({}),
      SkillTree.deleteMany({}),
      Leaderboard.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create default institute
    const institute = await Institute.create({
      name: 'Default Institute',
      code: 'DEFAULT',
      domain: 'default.edu',
      description: 'Default institute for the platform',
      isActive: true,
      settings: {
        requireApproval: true,
        allowStudentRegistration: true,
        allowFacultyRegistration: true,
        allowEmployerRegistration: true
      }
    });
    console.log('Created default institute');

    // Create test users - all approved by default
    const student = await User.create({
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      status: 'approved',
      instituteId: institute._id,
      instituteName: institute.name,
      walletAddress: '0x1234567890123456789012345678901234567890',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        department: 'Computer Science'
      }
    });

    const faculty = await User.create({
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty',
      status: 'approved',
      instituteId: institute._id,
      instituteName: institute.name,
      walletAddress: '0x0987654321098765432109876543210987654321',
      profile: {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        department: 'Computer Science'
      }
    });

    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      status: 'approved',
      instituteId: institute._id,
      instituteName: institute.name,
      walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    });

    // Add admin to institute's adminIds
    institute.adminIds = [admin._id];
    await institute.save();
    console.log('Assigned admin to institute');

    console.log('Created users');

    // Create credentials
    const credentials = await Credential.insertMany([
      {
        credentialId: 1,
        studentAddress: student.walletAddress.toLowerCase(),
        issuerAddress: faculty.walletAddress.toLowerCase(),
        issuerName: 'Dr. Jane Smith',
        metadataURI: 'ipfs://test1',
        title: 'Web Development Certificate',
        description: 'Completed web dev course',
        type: 'certificate',
        skills: ['HTML', 'CSS', 'JavaScript'],
        course: 'CS101'
      },
      {
        credentialId: 2,
        studentAddress: student.walletAddress.toLowerCase(),
        issuerAddress: faculty.walletAddress.toLowerCase(),
        issuerName: 'Dr. Jane Smith',
        metadataURI: 'ipfs://test2',
        title: 'React Development',
        description: 'Advanced React course',
        type: 'certificate',
        skills: ['React', 'JavaScript', 'Redux'],
        course: 'CS201'
      },
      {
        credentialId: 3,
        studentAddress: student.walletAddress.toLowerCase(),
        issuerAddress: faculty.walletAddress.toLowerCase(),
        issuerName: 'Dr. Jane Smith',
        metadataURI: 'ipfs://test3',
        title: 'Blockchain Fundamentals',
        description: 'Blockchain basics',
        type: 'certificate',
        skills: ['Solidity', 'Web3', 'Ethereum'],
        course: 'CS301'
      }
    ]);

    console.log('Created credentials');

    // Create skill tree
    await SkillTree.create({
      studentAddress: student.walletAddress.toLowerCase(),
      studentId: student._id,
      name: 'My Skill Tree',
      nodes: [
        { skillName: 'HTML', category: 'technical', level: 2, xpPoints: 20, isLocked: false },
        { skillName: 'CSS', category: 'technical', level: 2, xpPoints: 20, isLocked: false },
        { skillName: 'JavaScript', category: 'technical', level: 3, xpPoints: 30, isLocked: false },
        { skillName: 'React', category: 'technical', level: 3, xpPoints: 30, isLocked: false },
        { skillName: 'Solidity', category: 'technical', level: 2, xpPoints: 25, isLocked: false }
      ],
      totalXP: 125,
      level: 2
    });

    console.log('Created skill tree');

    // Create leaderboard entry
    await Leaderboard.create({
      studentAddress: student.walletAddress.toLowerCase(),
      studentId: student._id,
      studentName: 'John Doe',
      totalCredentials: 3,
      totalBadges: 0,
      uniqueSkills: 6,
      totalScore: 75,
      globalRank: 1,
      period: 'all-time'
    });

    console.log('Created leaderboard entry');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest Accounts:');
    console.log('  Student: student@test.com / password123');
    console.log('  Faculty: faculty@test.com / password123');
    console.log('  Admin:   admin@test.com / password123');
    console.log('  Institute: Default Institute (DEFAULT)');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();