// Application Constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const BLOCKCHAIN_NETWORK = process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || 'polygon-mumbai';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: {
    STUDENT: '/dashboard/student',
    FACULTY: '/dashboard/faculty',
    ADMIN: '/dashboard/admin',
    EMPLOYER: '/dashboard/employer',
  },
  BADGES: '/badges',
  SKILL_TREE: '/skill-tree',
  CREDENTIALS: '/credentials',
  VERIFY: '/verify',
  PROFILE: '/profile',
  ANALYTICS: '/analytics',
  ACHIEVEMENTS: '/achievements',
  SETTINGS: '/settings',
  MENTORSHIP: '/mentorship',
} as const;

// Credential Status Colors
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600',
    border: 'border-yellow-500',
    badge: 'bg-yellow-500',
  },
  verified: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    border: 'border-green-500',
    badge: 'bg-green-500',
  },
  rejected: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500',
    badge: 'bg-red-500',
  },
  revoked: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500',
    badge: 'bg-red-500',
  },
} as const;

// Badge Colors
export const BADGE_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
] as const;

// Skill Categories
export const SKILL_CATEGORIES = [
  { id: 'technical', name: 'Technical Skills', icon: '⚙️' },
  { id: 'soft', name: 'Soft Skills', icon: '🤝' },
  { id: 'domain', name: 'Domain Knowledge', icon: '📚' },
  { id: 'certification', name: 'Certifications', icon: '🏆' },
  { id: 'language', name: 'Languages', icon: '🌐' },
  { id: 'other', name: 'Other', icon: '📋' },
] as const;

// Skill Levels
export const SKILL_LEVELS = [
  { level: 1, name: 'Beginner', xp: 100, color: '#9CA3AF' },
  { level: 2, name: 'Intermediate', xp: 300, color: '#3B82F6' },
  { level: 3, name: 'Advanced', xp: 600, color: '#8B5CF6' },
  { level: 4, name: 'Expert', xp: 1000, color: '#F59E0B' },
  { level: 5, name: 'Master', xp: 1500, color: '#EF4444' },
] as const;

// Credibility Tiers
export const CREDIBILITY_TIERS = [
  { tier: 'bronze', min: 0, max: 39, color: '#CD7F32', label: 'Bronze' },
  { tier: 'silver', min: 40, max: 59, color: '#C0C0C0', label: 'Silver' },
  { tier: 'gold', min: 60, max: 74, color: '#FFD700', label: 'Gold' },
  { tier: 'platinum', min: 75, max: 89, color: '#E5E4E2', label: 'Platinum' },
  { tier: 'diamond', min: 90, max: 100, color: '#B9F2FF', label: 'Diamond' },
] as const;

// Achievement Categories
export const ACHIEVEMENT_CATEGORIES = {
  credential: { name: 'Credentials', icon: '📜' },
  badge: { name: 'Badges', icon: '🏅' },
  skill: { name: 'Skills', icon: '🎯' },
  endorsement: { name: 'Endorsements', icon: '✨' },
  special: { name: 'Special', icon: '⭐' },
} as const;

// Default Achievements
export const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'first-credential',
    name: 'First Step',
    description: 'Get your first credential verified',
    icon: '🎯',
    category: 'credential' as const,
    requirement: 1,
    reward: { xp: 50 },
  },
  {
    id: 'five-credentials',
    name: 'Getting Started',
    description: 'Get 5 credentials verified',
    icon: '📚',
    category: 'credential' as const,
    requirement: 5,
    reward: { xp: 100 },
  },
  {
    id: 'ten-credentials',
    name: 'Certified Expert',
    description: 'Get 10 credentials verified',
    icon: '🏆',
    category: 'credential' as const,
    requirement: 10,
    reward: { xp: 250 },
  },
  {
    id: 'first-badge',
    name: 'Badge Collector',
    description: 'Earn your first NFT badge',
    icon: '🏅',
    category: 'badge' as const,
    requirement: 1,
    reward: { xp: 100 },
  },
  {
    id: 'five-badges',
    name: 'Badge Enthusiast',
    description: 'Earn 5 NFT badges',
    icon: '💎',
    category: 'badge' as const,
    requirement: 5,
    reward: { xp: 300 },
  },
  {
    id: 'first-endorsement',
    name: 'Recognized',
    description: 'Receive your first endorsement',
    icon: '✨',
    category: 'endorsement' as const,
    requirement: 1,
    reward: { xp: 75 },
  },
  {
    id: 'ten-skills',
    name: 'Skill Builder',
    description: 'Add 10 skills to your profile',
    icon: '🛠️',
    category: 'skill' as const,
    requirement: 10,
    reward: { xp: 150 },
  },
  {
    id: 'blockchain-verified',
    name: 'Blockchain Verified',
    description: 'Have a credential stored on blockchain',
    icon: '⛓️',
    category: 'special' as const,
    requirement: 1,
    reward: { xp: 200 },
  },
] as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  credential_approved: {
    title: 'Credential Approved',
    icon: '✅',
  },
  credential_rejected: {
    title: 'Credential Rejected',
    icon: '❌',
  },
  badge_earned: {
    title: 'Badge Earned',
    icon: '🏅',
  },
  milestone_achieved: {
    title: 'Milestone Achieved',
    icon: '🏆',
  },
  verification_request: {
    title: 'Verification Request',
    icon: '🔍',
  },
  system: {
    title: 'System Notification',
    icon: '🔔',
  },
} as const;

// File Upload Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];