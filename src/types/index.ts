// User Types
export type UserRole = 'student' | 'faculty' | 'admin' | 'employer';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  hasRealWallet?: boolean;
  role: UserRole;
  status?: UserStatus;
  firstName: string;
  lastName: string;
  fullName: string;
  instituteId?: string;
  instituteName?: string;
  profile?: {
    bio?: string;
    department?: string;
    institution?: string;
    avatar?: string;
    linkedin?: string;
    github?: string;
  };
  createdAt: string;
  isVerified: boolean;
  preferredCareerPath?: string;
}

// Credential Types
export type CredentialStatus = 'pending' | 'verified' | 'rejected' | 'revoked';

export interface Credential {
  id: string;
  _id?: string;
  credentialId: string;
  studentAddress: string;
  issuerAddress: string;
  title: string;
  description?: string;
  skills: string[];
  category: string;
  status: CredentialStatus;
  issuedAt: string;
  validUntil?: string;
  metadataURI?: string;
  transactionHash?: string;
  blockNumber?: number;
  ipfsHash?: string;
  documentUrl?: string;
  documentData?: string; // Base64 encoded binary data
  documentIPFS?: string; // IPFS hash for document
  documentType?: string;
  originalFileName?: string;
  documentUploadedAt?: string;
  documentSize?: number;
  verificationLink?: string;  // URL for online certificate verification
  endorsementCount: number;
  badgeTokenId?: number;
  rejectionReason?: string;
  // IPFS document access (for verified credentials)
  ipfsUrl?: string;
}

// Badge Types
export interface Badge {
  id: string;
  tokenId: number;
  skillName: string;
  level: number;
  category: string;
  description?: string;
  icon: string;
  color: string;
  earnedAt: string;
  issuer: string;
  metadata?: {
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    xp?: number;
  };
  verified: boolean;
}

// Skill Tree Types
export interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  description?: string;
  xpPoints: number;
  isLocked: boolean;
  prerequisites: string[];
  credentials: string[];
  icon: string;
  position: { x: number; y: number };
  unlockedAt?: string;
}

export interface SkillTree {
  id: string;
  studentAddress: string;
  name: string;
  nodes: SkillNode[];
  totalXP: number;
  level: number;
  completedNodes: number;
  totalNodes: number;
  branches: {
    name: string;
    category: string;
    progress: number;
  }[];
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'credential' | 'badge' | 'skill' | 'endorsement' | 'special';
  requirement: number;
  progress: number;
  achieved: boolean;
  achievedAt?: string;
  reward?: {
    xp: number;
    badge?: string;
  };
}

// Analytics Types
export interface StudentAnalytics {
  overview: {
    totalCredentials: number;
    validatedCredentials: number;
    pendingValidation: number;
    revokedCredentials: number;
    totalBadges: number;
    uniqueSkills: number;
  };
  skills: {
    topSkills: { skill: string; count: number; level: string }[];
    categories: Record<string, string[]>;
    distribution: Record<string, number>;
  };
  milestones: Achievement[];
  nextMilestone?: Achievement;
  recentActivity: Activity[];
  recommendations: any[];
  performanceScore: number;
}

export interface FacultyAnalytics {
  overview: {
    totalValidations: number;
    approved: number;
    revoked: number;
    avgValidationTime: string;
    studentsSupervised: number;
  };
  students: { address: string; name?: string }[];
  skillDistribution: { skill: string; count: number }[];
  monthlyTrends: { month: string; issued: number; revoked: number }[];
  performanceMetrics: {
    approvalRate: string;
    revocationRate: string;
  };
}

export interface AdminAnalytics {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalFaculty: number;
    totalEmployers: number;
    totalCredentials: number;
    validCredentials: number;
    revokedCredentials: number;
    validationRate: string;
    totalBadges: number;
  };
  topSkills: { skill: string; count: number }[];
  topStudents: { address: string; credentialCount: number }[];
  growth: {
    users: { month: string; count: number }[];
    credentials: { month: string; count: number }[];
  };
  recentActivity: Activity[];
  systemHealth: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

// Activity Types
export interface Activity {
  id: string;
  type: 'credential' | 'badge' | 'endorsement' | 'skill' | 'milestone' | 'verification';
  action: string;
  title: string;
  description?: string;
  date: string;
  status?: CredentialStatus;
  metadata?: Record<string, unknown>;
}

// Verification Types
export interface VerificationResult {
  verified: boolean;
  credential: {
    id: string;
    courseName: string;
    skillsVerified: string[];
    grade?: string;
    description?: string;
    issueDate: string;
    validUntil?: string;
  };
  student: {
    name: string;
    walletAddress: string;
  };
  issuer: {
    name: string;
    institution?: string;
  };
  status: {
    isValid: boolean;
    isRevoked: boolean;
    currentStatus: 'Valid' | 'Revoked' | 'Invalid';
    statusColor: 'green' | 'red' | 'yellow';
  };
  // IPFS document access
  document?: {
    ipfsHash?: string;
    ipfsUrl?: string;
    originalFileName?: string;
    documentType?: string;
    documentSize?: number;
  };
  blockchain?: {
    transactionHash: string;
    blockNumber?: number;
    timestamp?: string;
  };
  qrCode?: string;
  verificationUrl: string;
  verifiedAt: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  studentAddress: string;
  studentName: string;
  totalScore: number;
  totalCredentials: number;
  totalBadges: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  change: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'credential_approved' | 'credential_rejected' | 'badge_earned' | 'milestone_achieved' | 'verification_request' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Mentorship Types
export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  skills: string[];
  rating: number;
  sessions: number;
  avatar?: string;
  bio?: string;
  available: boolean;
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  studentId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt: string;
  duration: number;
  topic: string;
  notes?: string;
}

// Institute Types
export interface Institute {
  id: string;
  name: string;
  code: string;
  domain?: string;
  description?: string;
  isActive: boolean;
  settings: {
    requireApproval: boolean;
    allowStudentRegistration: boolean;
    allowFacultyRegistration: boolean;
    allowEmployerRegistration: boolean;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  walletAddress?: string;
  role: UserRole;
}

export interface CredentialFormData {
  title: string;
  description: string;
  skills: string[];
  category: string;
  document?: File;
  issuedAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}