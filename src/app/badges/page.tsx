'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  Filter,
  Search,
  Lock,
  Unlock,
  CheckCircle,
  Star,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Users,
  BookOpen,
  Code,
  Brain,
  Lightbulb,
  Globe,
  Mic,
  Heart,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/MainLayout';
import { badgesApi, achievementsApi } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Badge definitions with requirements
interface BadgeDefinition {
  id: string;
  skillName: string;
  description: string;
  icon: string;
  color: string;
  category: 'technical' | 'certification' | 'soft' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  xp: number;
  requirements: {
    description: string;
    criteria: string[];
    credentialType?: string;
    minLevel?: number;
  };
}

const normalizeBadgeKey = (value: string | undefined) =>
  value
    ? value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    : '';

const BADGE_ALIASES: Record<string, string[]> = {
  'python-basics': ['python fundamentals', 'python basics', 'python', 'pcep', 'pcep certification'],
  'python-advanced': ['python mastery', 'advanced python', 'python professional'],
  'web-dev': ['web development', 'full stack', 'full-stack', 'frontend development'],
};

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Technical Badges
  {
    id: 'python-basics',
    skillName: 'Python Fundamentals',
    description: 'Master the basics of Python programming',
    icon: '🐍',
    color: '#3572A5',
    category: 'technical',
    rarity: 'common',
    level: 1,
    xp: 100,
    requirements: {
      description: 'Complete Python basics course',
      criteria: ['Submit Python assignment', 'Score 70% or higher on quiz', 'Complete 5 coding exercises'],
      credentialType: 'Python Programming',
    },
  },
  {
    id: 'python-advanced',
    skillName: 'Python Mastery',
    description: 'Advanced Python programming and data structures',
    icon: '🐍',
    color: '#3572A5',
    category: 'technical',
    rarity: 'rare',
    level: 2,
    xp: 250,
    requirements: {
      description: 'Complete advanced Python course',
      criteria: ['Complete OOP project', 'Implement data structures', 'Pass advanced assessment'],
      credentialType: 'Advanced Python',
    },
  },
  {
    id: 'web-dev',
    skillName: 'Web Development',
    description: 'Full-stack web development skills',
    icon: '🌐',
    color: '#F16529',
    category: 'technical',
    rarity: 'uncommon',
    level: 1,
    xp: 150,
    requirements: {
      description: 'Complete web development bootcamp',
      criteria: ['Build responsive website', 'Implement REST API', 'Deploy to production'],
      credentialType: 'Web Development',
    },
  },
  {
    id: 'react-master',
    skillName: 'React Expert',
    description: 'Master React.js and modern frontend',
    icon: '⚛️',
    color: '#61DAFB',
    category: 'technical',
    rarity: 'rare',
    level: 2,
    xp: 300,
    requirements: {
      description: 'Complete React professional course',
      criteria: ['Build 3 React projects', 'Implement state management', 'Pass React certification'],
      credentialType: 'React Development',
    },
  },
  {
    id: 'data-science',
    skillName: 'Data Science',
    description: 'Data analysis and machine learning',
    icon: '📊',
    color: '#FF6F61',
    category: 'technical',
    rarity: 'epic',
    level: 3,
    xp: 500,
    requirements: {
      description: 'Complete data science specialization',
      criteria: ['Complete ML project', 'Build predictive model', 'Present data analysis'],
      credentialType: 'Data Science',
    },
  },
  {
    id: 'cloud-computing',
    skillName: 'Cloud Computing',
    description: 'AWS, Azure, or GCP cloud services',
    icon: '☁️',
    color: '#FF9900',
    category: 'technical',
    rarity: 'rare',
    level: 2,
    xp: 350,
    requirements: {
      description: 'Complete cloud certification',
      criteria: ['Pass cloud provider exam', 'Deploy cloud infrastructure', 'Complete lab exercises'],
      credentialType: 'Cloud Computing',
    },
  },
  {
    id: 'cybersecurity',
    skillName: 'Cybersecurity',
    description: 'Network security and ethical hacking',
    icon: '🔐',
    color: '#4A154B',
    category: 'technical',
    rarity: 'epic',
    level: 3,
    xp: 450,
    requirements: {
      description: 'Complete cybersecurity program',
      criteria: ['Complete security audit', 'Pass penetration testing exam', 'Implement security protocols'],
      credentialType: 'Cybersecurity',
    },
  },
  {
    id: 'ai-ml',
    skillName: 'AI & Machine Learning',
    description: 'Artificial intelligence and ML algorithms',
    icon: '🤖',
    color: '#FF6F00',
    category: 'technical',
    rarity: 'legendary',
    level: 3,
    xp: 750,
    requirements: {
      description: 'Complete AI/ML specialization',
      criteria: ['Build ML model', 'Complete deep learning project', 'Publish research paper'],
      credentialType: 'AI & Machine Learning',
    },
  },
  // Certification Badges
  {
    id: 'internship',
    skillName: 'Professional Intern',
    description: 'Complete a professional internship',
    icon: '💼',
    color: '#0078D4',
    category: 'certification',
    rarity: 'uncommon',
    level: 1,
    xp: 200,
    requirements: {
      description: 'Complete internship program',
      criteria: ['Complete 200+ hours', 'Receive supervisor evaluation', 'Submit final report'],
      credentialType: 'Internship',
    },
  },
  {
    id: 'research',
    skillName: 'Research Scholar',
    description: 'Conduct and publish research',
    icon: '🔬',
    color: '#6B21A8',
    category: 'certification',
    rarity: 'epic',
    level: 3,
    xp: 500,
    requirements: {
      description: 'Complete research project',
      criteria: ['Publish paper', 'Present at conference', 'Receive advisor approval'],
      credentialType: 'Research',
    },
  },
  {
    id: 'leadership',
    skillName: 'Team Leader',
    description: 'Demonstrate leadership skills',
    icon: '👑',
    color: '#FFD700',
    category: 'certification',
    rarity: 'rare',
    level: 2,
    xp: 300,
    requirements: {
      description: 'Lead a team project',
      criteria: ['Lead 5+ member team', 'Complete project successfully', 'Receive peer evaluations'],
      credentialType: 'Leadership',
    },
  },
  {
    id: 'entrepreneurship',
    skillName: 'Entrepreneur',
    description: 'Start and run a business',
    icon: '🚀',
    color: '#FF4757',
    category: 'certification',
    rarity: 'legendary',
    level: 3,
    xp: 800,
    requirements: {
      description: 'Launch a startup',
      criteria: ['Register business', 'Generate revenue', 'Create business plan'],
      credentialType: 'Entrepreneurship',
    },
  },
  // Soft Skills Badges
  {
    id: 'communication',
    skillName: 'Effective Communicator',
    description: 'Excellent verbal and written communication',
    icon: '💬',
    color: '#2ED573',
    category: 'soft',
    rarity: 'common',
    level: 1,
    xp: 75,
    requirements: {
      description: 'Demonstrate communication skills',
      criteria: ['Give presentation', 'Submit written report', 'Receive feedback'],
      credentialType: 'Communication',
    },
  },
  {
    id: 'teamwork',
    skillName: 'Team Player',
    description: 'Collaborate effectively with others',
    icon: '🤝',
    color: '#FFA502',
    category: 'soft',
    rarity: 'common',
    level: 1,
    xp: 75,
    requirements: {
      description: 'Participate in team activities',
      criteria: ['Complete group project', 'Contribute to team goals', 'Receive peer review'],
      credentialType: 'Teamwork',
    },
  },
  {
    id: 'problem-solving',
    skillName: 'Problem Solver',
    description: 'Analytical and creative problem solving',
    icon: '🧩',
    color: '#5352ED',
    category: 'soft',
    rarity: 'uncommon',
    level: 2,
    xp: 150,
    requirements: {
      description: 'Solve complex problems',
      criteria: ['Complete case study', 'Present solution', 'Receive expert evaluation'],
      credentialType: 'Problem Solving',
    },
  },
  {
    id: 'time-management',
    skillName: 'Time Master',
    description: 'Excellent time management skills',
    icon: '⏰',
    color: '#FF6348',
    category: 'soft',
    rarity: 'uncommon',
    level: 2,
    xp: 125,
    requirements: {
      description: 'Demonstrate time management',
      criteria: ['Complete tasks on time', 'Manage multiple projects', 'Show productivity gains'],
      credentialType: 'Time Management',
    },
  },
  // Achievement Badges - IDs match backend achievements
  {
    id: 'first-credential',
    skillName: 'First Step',
    description: 'Earn your first verified credential',
    icon: '🌟',
    color: '#FFD700',
    category: 'achievement',
    rarity: 'common',
    level: 1,
    xp: 50,
    requirements: {
      description: 'Complete your first credential',
      criteria: ['Submit a credential for verification', 'Receive faculty approval'],
    },
  },
  {
    id: 'five-credentials',
    skillName: 'Rising Star',
    description: 'Earn 5 verified credentials',
    icon: '⭐',
    color: '#FFD700',
    category: 'achievement',
    rarity: 'uncommon',
    level: 1,
    xp: 100,
    requirements: {
      description: 'Complete 5 credentials',
      criteria: ['Submit 5 credentials for verification', 'Receive faculty approval for all'],
    },
  },
  {
    id: 'ten-credentials',
    skillName: 'Skilled Professional',
    description: 'Earn 10 verified credentials',
    icon: '🏆',
    color: '#FFD700',
    category: 'achievement',
    rarity: 'rare',
    level: 2,
    xp: 200,
    requirements: {
      description: 'Complete 10 credentials',
      criteria: ['Submit 10 credentials for verification', 'Maintain good credibility score'],
    },
  },
  {
    id: 'twenty-credentials',
    skillName: 'Expert',
    description: 'Earn 20 verified credentials',
    icon: '💎',
    color: '#FFD700',
    category: 'achievement',
    rarity: 'epic',
    level: 3,
    xp: 500,
    requirements: {
      description: 'Complete 20 credentials',
      criteria: ['Submit 20 credentials for verification', 'Achieve high credibility score'],
    },
  },
  {
    id: 'fifty-credentials',
    skillName: 'Master',
    description: 'Earn 50 verified credentials',
    icon: '👑',
    color: '#FFD700',
    category: 'achievement',
    rarity: 'legendary',
    level: 3,
    xp: 1000,
    requirements: {
      description: 'Complete 50 credentials',
      criteria: ['Submit 50 credentials for verification', 'Become a top-ranked student'],
    },
  },
  // XP-based achievements
  {
    id: 'xp-100',
    skillName: 'XP Beginner',
    description: 'Earn 100 XP points',
    icon: '⚡',
    color: '#FFA502',
    category: 'achievement',
    rarity: 'common',
    level: 1,
    xp: 25,
    requirements: {
      description: 'Earn 100 XP from credentials',
      criteria: ['Complete credentials', 'Earn XP points'],
    },
  },
  {
    id: 'xp-500',
    skillName: 'XP Enthusiast',
    description: 'Earn 500 XP points',
    icon: '🔥',
    color: '#FF4757',
    category: 'achievement',
    rarity: 'uncommon',
    level: 2,
    xp: 50,
    requirements: {
      description: 'Earn 500 XP from credentials',
      criteria: ['Complete more credentials', 'Build up XP'],
    },
  },
  {
    id: 'xp-1000',
    skillName: 'XP Master',
    description: 'Earn 1000 XP points',
    icon: '🌈',
    color: '#A55EEA',
    category: 'achievement',
    rarity: 'rare',
    level: 3,
    xp: 100,
    requirements: {
      description: 'Earn 1000 XP from credentials',
      criteria: ['Master multiple skills', 'Earn high XP'],
    },
  },
  // Skill tree achievements
  {
    id: 'first-skill',
    skillName: 'Skill Unlocked',
    description: 'Unlock your first skill in the skill tree',
    icon: '🎯',
    color: '#26DE81',
    category: 'achievement',
    rarity: 'common',
    level: 1,
    xp: 25,
    requirements: {
      description: 'Complete first skill node',
      criteria: ['Build skill tree', 'Complete first node'],
    },
  },
  {
    id: 'ten-skills',
    skillName: 'Multi-Skilled',
    description: 'Unlock 10 skills in the skill tree',
    icon: '🌳',
    color: '#2ED573',
    category: 'achievement',
    rarity: 'rare',
    level: 2,
    xp: 100,
    requirements: {
      description: 'Complete 10 skill nodes',
      criteria: ['Build skill tree', 'Complete 10 nodes'],
    },
  },
];

const BADGE_XP_LOOKUP: Record<string, number> = BADGE_DEFINITIONS.reduce((map, badge) => {
  map[badge.skillName] = badge.xp;
  map[normalizeBadgeKey(badge.skillName)] = badge.xp;
  map[badge.id] = badge.xp;
  return map;
}, {} as Record<string, number>);

const getBadgeXP = (badge: BadgeType) => {
  return (
    badge.metadata?.xp ??
    (badge as any).xp ??
    BADGE_XP_LOOKUP[badge.skillName] ??
    BADGE_XP_LOOKUP[normalizeBadgeKey(badge.skillName)] ??
    0
  );
};

export default function BadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const address = user?.walletAddress || '';
      
      // Fetch both blockchain badges and achievements
      const [badgesResult, achievementsResult] = await Promise.all([
        address ? badgesApi.getByStudent(address) : Promise.resolve({ success: false, data: [] }),
        achievementsApi.getAll()
      ]);
      
      if (badgesResult.success && badgesResult.data) {
        setBadges(badgesResult.data);
      }
      
      if (achievementsResult.success && achievementsResult.data) {
        setAchievements(achievementsResult.data);
        // Create set of earned achievement IDs
        const earned = new Set<string>();
        achievementsResult.data
          .filter((a: any) => a.achieved)
          .forEach((a: any) => {
            earned.add(a.id);
            // Also add name-based ID for matching
            earned.add(a.name?.toLowerCase().replace(/\s+/g, '-'));
          });
        setEarnedBadgeIds(earned);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.walletAddress]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      case 'uncommon': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-400/30';
      case 'epic': return 'border-purple-500 shadow-purple-500/30';
      case 'rare': return 'border-blue-500 shadow-blue-500/30';
      case 'uncommon': return 'border-green-500 shadow-green-500/30';
      default: return 'border-gray-400';
    }
  };

  const isBadgeEarned = (badgeDef: BadgeDefinition): boolean => {
    const normalizedName = normalizeBadgeKey(badgeDef.skillName);
    const normalizedIds = new Set(Array.from(earnedBadgeIds).map(normalizeBadgeKey));

    if (badgeDef.category === 'achievement') {
      return normalizedIds.has(badgeDef.id) || normalizedIds.has(normalizedName);
    }

    if (earnedBadgeIds.has(badgeDef.id) || normalizedIds.has(normalizedName)) {
      return true;
    }

    const normalizedOwnedBadges = badges.map(b => normalizeBadgeKey(b.skillName));
    if (normalizedOwnedBadges.some(name => name === normalizedName || name.includes(normalizedName) || normalizedName.includes(name))) {
      return true;
    }

    const aliases = BADGE_ALIASES[badgeDef.id] || [];
    return aliases.some(alias => {
      const normalizedAlias = normalizeBadgeKey(alias);
      return normalizedOwnedBadges.some(name => name === normalizedAlias || name.includes(normalizedAlias) || normalizedAlias.includes(name));
    });
  };

  // Calculate progress - count unique earned badges from achievements
  const earnedFromAchievements = achievements.filter((a: any) => a.achieved).length;
  const earnedCount = badges.length + earnedFromAchievements;
  const totalPossible = BADGE_DEFINITIONS.length;
  const completionPercent = Math.round((earnedCount / totalPossible) * 100);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">NFT Badge Gallery</h1>
            <p className="text-muted-foreground">
              Earn badges by completing credentials and demonstrating skills
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Badge Collection Progress
                </h3>
                <p className="text-sm text-muted-foreground">
                  {earnedCount} of {totalPossible} badges earned
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-600">{completionPercent}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={completionPercent} className="h-3" />
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span>Legendary: {badges.filter(b => b.metadata?.rarity === 'legendary').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Epic: {badges.filter(b => b.metadata?.rarity === 'epic').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Rare: {badges.filter(b => b.metadata?.rarity === 'rare').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'NFT Badges', value: badges.length, icon: Award, color: 'text-indigo-500' },
            { label: 'Achievements', value: achievements.filter((a: any) => a.achieved).length, icon: Trophy, color: 'text-purple-500' },
            { label: 'Total XP', value: badges.reduce((sum, b) => sum + getBadgeXP(b), 0) + achievements.filter((a: any) => a.achieved && a.reward).reduce((sum: number, a: any) => sum + (a.reward?.xp || 0), 0), icon: Zap, color: 'text-yellow-500' },
            { label: 'Available', value: totalPossible - earnedCount, icon: Target, color: 'text-blue-500' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Badge Tabs */}
        <Tabs defaultValue="available">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              <Award className="w-4 h-4 mr-2" />
              Available Badges
            </TabsTrigger>
            <TabsTrigger value="earned">
              <CheckCircle className="w-4 h-4 mr-2" />
              My Badges 
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Filter className="w-4 h-4 mr-2" />
              By Category
            </TabsTrigger>
          </TabsList>

          {/* Available Badges Tab - Shows all badges with lock status */}
          <TabsContent value="available" className="mt-6">
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                How to Earn Badges
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Complete the specified credentials and requirements to unlock badges. 
                Badges show locked status until you meet all criteria.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {BADGE_DEFINITIONS.map((badgeDef, index) => {
                const earned = isBadgeEarned(badgeDef);
                return (
                  <motion.div
                    key={badgeDef.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={`group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative
                        ${earned ? '' : 'opacity-75 hover:opacity-100'}
                        ${earned ? 'ring-2 ring-green-500/50' : ''}
                      `}
                      onClick={() => setSelectedBadge(badgeDef as any)}
                    >
                      {/* Locked overlay */}
                      {!earned && (
                        <div className="absolute inset-0 bg-gray-900/10 z-10 flex items-center justify-center">
                          <div className="bg-gray-900/80 text-white px-4 py-2 rounded-full flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Locked
                          </div>
                        </div>
                      )}
                      
                      {/* Earned indicator */}
                      {earned && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-green-500 text-white p-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    
                      {/* Gradient header */}
                      <div className={`h-2 bg-gradient-to-r ${getRarityColor(badgeDef.rarity)}`} />
                    
                      <CardContent className="p-5">
                        <div className="text-center mb-3">
                          <div
                            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg"
                            style={{ 
                              backgroundColor: `${badgeDef.color}20`,
                              boxShadow: earned ? `0 0 15px ${badgeDef.color}40` : 'none'
                            }}
                          >
                            {badgeDef.icon}
                          </div>
                        </div>

                        <div className="text-center">
                          <h3 className="font-semibold text-sm mb-1">{badgeDef.skillName}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badgeDef.description}</p>
                          
                          <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">Lv.{badgeDef.level}</Badge>
                            <Badge
                              className={`bg-gradient-to-r ${getRarityColor(badgeDef.rarity)} text-white text-xs`}
                            >
                              {badgeDef.rarity}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span>+{badgeDef.xp} XP</span>
                          </div>
                        </div>

                        {/* Requirements preview */}
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Requirements:</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {badgeDef.requirements.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Earned Badges Tab */}
          <TabsContent value="earned" className="mt-6">
            {badges.length === 0 && achievements.filter((a: any) => a.achieved).length === 0 ? (
              <Card className="p-12 text-center">
                <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Badges Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start completing credentials to earn your first badge!
                </p>
                <Button>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Available Badges
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Show blockchain badges */}
                {badges.map((badge, index) => (
                  <motion.div
                    key={`badge-${badge.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ring-2 ring-green-500/30"
                      onClick={() => setSelectedBadge(badge)}
                    >
                      {/* Gradient header */}
                      <div className={`h-2 bg-gradient-to-r ${getRarityColor(badge.metadata?.rarity)}`} />
                    
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg badge-glow"
                            style={{ 
                              backgroundColor: `${badge.color}20`,
                              boxShadow: `0 0 20px ${badge.color}40`
                            }}
                          >
                            {badge.icon}
                          </div>
                        </div>

                        <div className="text-center">
                          <h3 className="font-semibold text-lg mb-1">{badge.skillName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                          
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <Badge variant="outline">Level {badge.level}</Badge>
                            <Badge
                              className={`bg-gradient-to-r ${getRarityColor(badge.metadata?.rarity)} text-white text-xs`}
                            >
                              {badge.metadata?.rarity || 'common'}
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <p>Earned: {formatDateTime(badge.earnedAt)}</p>
                            <p>XP: +{badge.metadata?.xp || 0}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {/* Show earned achievements */}
                {achievements.filter((a: any) => a.achieved).map((achievement: any, index: number) => (
                  <motion.div
                    key={`achievement-${achievement.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (badges.length + index) * 0.05 }}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ring-2 ring-purple-500/30">
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                      <CardContent className="p-6 text-center">
                        <div className="text-center mb-4">
                          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg bg-purple-100 dark:bg-purple-900/30">
                            {achievement.icon}
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold text-lg mb-1">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                              Achievement Unlocked
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>XP: +{achievement.reward?.xp || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <Tabs defaultValue="technical">
              <TabsList>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="certification">Certifications</TabsTrigger>
                <TabsTrigger value="soft">Soft Skills</TabsTrigger>
                <TabsTrigger value="achievement">Achievements</TabsTrigger>
              </TabsList>

              {['technical', 'certification', 'soft', 'achievement'].map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {BADGE_DEFINITIONS.filter(b => b.category === cat).map((badgeDef, index) => {
                      const earned = isBadgeEarned(badgeDef);
                      return (
                        <motion.div
                          key={badgeDef.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={`transition-all duration-300 ${earned ? '' : 'opacity-60'}`}>
                            <div className={`h-2 bg-gradient-to-r ${getRarityColor(badgeDef.rarity)}`} />
                            <CardContent className="p-5 text-center">
                              <div
                                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-3"
                                style={{ backgroundColor: `${badgeDef.color}20` }}
                              >
                                {earned ? <Unlock className="w-8 h-8" /> : badgeDef.icon}
                              </div>
                              <h3 className="font-semibold text-sm">{badgeDef.skillName}</h3>
                              <div className="flex items-center justify-center gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">Lv.{badgeDef.level}</Badge>
                                <Badge className={`bg-gradient-to-r ${getRarityColor(badgeDef.rarity)} text-white text-xs`}>
                                  {badgeDef.rarity}
                                </Badge>
                              </div>
                              {earned && (
                                <p className="text-xs text-green-500 mt-2 flex items-center justify-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Earned
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBadge(null)}>
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className={`h-2 bg-gradient-to-r ${getRarityColor(selectedBadge.metadata?.rarity || (selectedBadge as any).rarity || 'common')}`} />
              <CardHeader className="text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl mb-4"
                  style={{ 
                    backgroundColor: `${selectedBadge.color}20`,
                    boxShadow: `0 0 30px ${selectedBadge.color}40`
                  }}
                >
                  {selectedBadge.icon}
                </div>
                <CardTitle className="text-2xl">{selectedBadge.skillName}</CardTitle>
                <CardDescription>{selectedBadge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    Level {selectedBadge.level}
                  </Badge>
                  <Badge className={`bg-gradient-to-r ${getRarityColor(selectedBadge.metadata?.rarity)} text-white text-lg px-4 py-1`}>
                    {selectedBadge.metadata?.rarity || 'common'}
                  </Badge>
                  <Badge variant="outline" className="text-lg px-4 py-1 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    +{selectedBadge.metadata?.xp || (selectedBadge as any).xp || 0} XP
                  </Badge>
                </div>

                {/* Show requirements for locked badges or earned info for earned badges */}
                {'requirements' in selectedBadge ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        How to Earn
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {(selectedBadge as any).requirements?.description}
                      </p>
                      <ul className="space-y-2">
                        {((selectedBadge as any).requirements?.criteria || []).map((crit: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {crit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        You have earned this badge!
                      </p>
                    </div>
                    {selectedBadge.earnedAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Earned on: {formatDateTime(selectedBadge.earnedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download Badge
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
