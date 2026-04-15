const Credential = require('../models/Credential.model');
const User = require('../models/User.model');

class ResumeService {
  /**
   * Generate resume PDF data for a student
   */
  async generateResumePDF(walletAddress) {
    try {
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      const credentials = await Credential.find({
        studentAddress: walletAddress.toLowerCase(),
        status: 'verified',
        revoked: false
      }).sort({ issuedAt: -1 });

      const resumeData = await this.prepareCVData(walletAddress);

      // Return as JSON (frontend will generate PDF)
      return JSON.stringify(resumeData);
    } catch (error) {
      console.error('Resume generation error:', error);
      throw error;
    }
  }

  /**
   * Prepare CV data from blockchain credentials
   */
  async prepareCVData(walletAddress) {
    try {
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    const credentials = await Credential.find({
      studentAddress: walletAddress.toLowerCase(),
      status: 'verified',
      revoked: false
    }).sort({ issuedAt: -1 });

      // Extract skills
      const skills = new Map();
      credentials.forEach(cred => {
        cred.skills?.forEach(skill => {
          skills.set(skill, (skills.get(skill) || 0) + 1);
        });
      });

      const sortedSkills = Array.from(skills.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([skill, count]) => ({
          name: skill,
          count,
          level: count >= 5 ? 'Expert' : count >= 3 ? 'Advanced' : count >= 2 ? 'Intermediate' : 'Beginner'
        }));

      return {
        personalInfo: {
          fullName: user ? `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() : 'Anonymous',
          email: user?.email,
          walletAddress: walletAddress,
          department: user?.profile?.department,
          bio: user?.profile?.bio
        },
        skills: sortedSkills,
        credentials: credentials.map(cred => ({
          id: cred._id,
          title: cred.title || cred.course,
          issuer: cred.issuerName,
          issuedAt: cred.issuedAt,
          type: cred.type,
          grade: cred.grade,
          skills: cred.skills,
          verified: !cred.revoked,
          transactionHash: cred.transactionHash
        })),
        statistics: {
          totalCredentials: credentials.length,
          verifiedCredentials: credentials.filter(c => !c.revoked).length,
          uniqueSkills: sortedSkills.length,
          totalEndorsements: credentials.reduce((sum, c) => sum + (c.endorsementCount || 0), 0)
        }
      };
    } catch (error) {
      console.error('CV data preparation error:', error);
      throw error;
    }
  }

  /**
   * Export credentials as JSON
   */
  async exportCredentials(walletAddress) {
    const credentials = await Credential.find({
      studentAddress: walletAddress.toLowerCase()
    }).sort({ issuedAt: -1 });

    return credentials.map(cred => ({
      id: cred.credentialId,
      title: cred.title,
      description: cred.description,
      issuer: cred.issuerName,
      issuedAt: cred.issuedAt,
      skills: cred.skills,
      grade: cred.grade,
      status: cred.revoked ? 'revoked' : 'valid',
      transactionHash: cred.transactionHash,
      metadataURI: cred.metadataURI
    }));
  }

  /**
   * Generate verification link
   */
  generateVerificationLink(credentialId) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/verify/${credentialId}`;
  }
}

module.exports = new ResumeService();