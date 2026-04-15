'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle, TrendingUp, Medal, Award, Zap, Filter, Search, Target, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/MainLayout';
import { achievementsApi, badgesApi } from '@/lib/api';
import { Achievement, Badge as BadgeType } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Badge definitions
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
  requirements: { description: string; criteria: string[] };
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'python-basics', skillName: 'Python Fundamentals', description: 'Master Python basics', icon: '🐍', color: '#3572A5', category: 'technical', rarity: 'common', level: 1, xp: 100, requirements: { description: 'Complete Python basics', criteria: ['Submit Python assignment', 'Score 70%+ on quiz'] } },
  { id: 'python-advanced', skillName: 'Python Mastery', description: 'Advanced Python programming', icon: '🐍', color: '#3572A5', category: 'technical', rarity: 'rare', level: 2, xp: 250, requirements: { description: 'Complete advanced Python', criteria: ['Complete OOP project', 'Implement data structures'] } },
  { id: 'web-dev', skillName: 'Web Development', description: 'Full-stack web development', icon: '🌐', color: '#F16529', category: 'technical', rarity: 'uncommon', level: 1, xp: 150, requirements: { description: 'Complete web dev bootcamp', criteria: ['Build responsive website', 'Implement REST API'] } },
  { id: 'react-master', skillName: 'React Expert', description: 'Master React.js', icon: '⚛️', color: '#61DAFB', category: 'technical', rarity: 'rare', level: 2, xp: 300, requirements: { description: 'Complete React professional', criteria: ['Build 3 React projects', 'Implement state management'] } },
  { id: 'data-science', skillName: 'Data Science', description: 'Data analysis and ML', icon: '📊', color: '#FF6F61', category: 'technical', rarity: 'epic', level: 3, xp: 500, requirements: { description: 'Complete data science specialization', criteria: ['Complete ML project', 'Build predictive model'] } },
  { id: 'cloud-computing', skillName: 'Cloud Computing', description: 'AWS, Azure, GCP', icon: '☁️', color: '#FF9900', category: 'technical', rarity: 'rare', level: 2, xp: 350, requirements: { description: 'Complete cloud certification', criteria: ['Pass cloud provider exam', 'Deploy cloud infrastructure'] } },
  { id: 'cybersecurity', skillName: 'Cybersecurity', description: 'Network security', icon: '🔐', color: '#4A154B', category: 'technical', rarity: 'epic', level: 3, xp: 450, requirements: { description: 'Complete cybersecurity program', criteria: ['Complete security audit', 'Pass penetration testing exam'] } },
  { id: 'ai-ml', skillName: 'AI & Machine Learning', description: 'AI and ML algorithms', icon: '🤖', color: '#FF6F00', category: 'technical', rarity: 'legendary', level: 3, xp: 750, requirements: { description: 'Complete AI/ML specialization', criteria: ['Build ML model', 'Complete deep learning project'] } },
  { id: 'internship', skillName: 'Professional Intern', description: 'Complete internship', icon: '💼', color: '#0078D4', category: 'certification', rarity: 'uncommon', level: 1, xp: 200, requirements: { description: 'Complete internship program', criteria: ['Complete 200+ hours', 'Receive supervisor evaluation'] } },
  { id: 'research', skillName: 'Research Scholar', description: 'Conduct research', icon: '🔬', color: '#6B21A8', category: 'certification', rarity: 'epic', level: 3, xp: 500, requirements: { description: 'Complete research project', criteria: ['Publish paper', 'Present at conference'] } },
  { id: 'leadership', skillName: 'Team Leader', description: 'Demonstrate leadership', icon: '👑', color: '#FFD700', category: 'certification', rarity: 'rare', level: 2, xp: 300, requirements: { description: 'Lead a team project', criteria: ['Lead 5+ member team', 'Complete project successfully'] } },
  { id: 'entrepreneurship', skillName: 'Entrepreneur', description: 'Start and run a business', icon: '🚀', color: '#FF4757', category: 'certification', rarity: 'legendary', level: 3, xp: 800, requirements: { description: 'Launch a startup', criteria: ['Register business', 'Generate revenue'] } },
  { id: 'communication', skillName: 'Effective Communicator', description: 'Communication skills', icon: '💬', color: '#2ED573', category: 'soft', rarity: 'common', level: 1, xp: 75, requirements: { description: 'Demonstrate communication', criteria: ['Give presentation', 'Submit written report'] } },
  { id: 'teamwork', skillName: 'Team Player', description: 'Collaborate effectively', icon: '🤝', color: '#FFA502', category: 'soft', rarity: 'common', level: 1, xp: 75, requirements: { description: 'Participate in team activities', criteria: ['Complete group project', 'Contribute to team goals'] } },
  { id: 'problem-solving', skillName: 'Problem Solver', description: 'Analytical problem solving', icon: '🧩', color: '#5352ED', category: 'soft', rarity: 'uncommon', level: 2, xp: 150, requirements: { description: 'Solve complex problems', criteria: ['Complete case study', 'Present solution'] } },
  { id: 'time-management', skillName: 'Time Master', description: 'Time management', icon: '⏰', color: '#FF6348', category: 'soft', rarity: 'uncommon', level: 2, xp: 125, requirements: { description: 'Demonstrate time management', criteria: ['Complete tasks on time', 'Manage multiple projects'] } },
  { id: 'first-credential', skillName: 'First Step', description: 'Earn first credential', icon: '🌟', color: '#FFD700', category: 'achievement', rarity: 'common', level: 1, xp: 50, requirements: { description: 'Complete your first credential', criteria: ['Submit credential', 'Receive approval'] } },
  { id: 'five-credentials', skillName: 'Rising Star', description: 'Earn 5 credentials', icon: '⭐', color: '#FFD700', category: 'achievement', rarity: 'uncommon', level: 1, xp: 100, requirements: { description: 'Complete 5 credentials', criteria: ['Submit 5 credentials', 'Receive approval for all'] } },
  { id: 'ten-credentials', skillName: 'Skilled Professional', description: 'Earn 10 credentials', icon: '🏆', color: '#FFD700', category: 'achievement', rarity: 'rare', level: 2, xp: 200, requirements: { description: 'Complete 10 credentials', criteria: ['Submit 10 credentials', 'Maintain good credibility'] } },
  { id: 'twenty-credentials', skillName: 'Expert', description: 'Earn 20 credentials', icon: '💎', color: '#FFD700', category: 'achievement', rarity: 'epic', level: 3, xp: 500, requirements: { description: 'Complete 20 credentials', criteria: ['Submit 20 credentials', 'Achieve high credibility'] } },
  { id: 'fifty-credentials', skillName: 'Master', description: 'Earn 50 credentials', icon: '👑', color: '#FFD700', category: 'achievement', rarity: 'legendary', level: 3, xp: 1000, requirements: { description: 'Complete 50 credentials', criteria: ['Submit 50 credentials', 'Become top-ranked'] } },
  { id: 'xp-100', skillName: 'XP Beginner', description: 'Earn 100 XP', icon: '⚡', color: '#FFA502', category: 'achievement', rarity: 'common', level: 1, xp: 25, requirements: { description: 'Earn 100 XP', criteria: ['Complete credentials', 'Earn XP points'] } },
  { id: 'xp-500', skillName: 'XP Enthusiast', description: 'Earn 500 XP', icon: '🔥', color: '#FF4757', category: 'achievement', rarity: 'uncommon', level: 2, xp: 50, requirements: { description: 'Earn 500 XP', criteria: ['Complete more credentials'] } },
  { id: 'xp-1000', skillName: 'XP Master', description: 'Earn 1000 XP', icon: '🌈', color: '#A55EEA', category: 'achievement', rarity: 'rare', level: 3, xp: 100, requirements: { description: 'Earn 1000 XP', criteria: ['Master multiple skills'] } },
  { id: 'first-skill', skillName: 'Skill Unlocked', description: 'Unlock first skill', icon: '🎯', color: '#26DE81', category: 'achievement', rarity: 'common', level: 1, xp: 25, requirements: { description: 'Complete first skill node', criteria: ['Build skill tree', 'Complete first node'] } },
  { id: 'ten-skills', skillName: 'Multi-Skilled', description: 'Unlock 10 skills', icon: '🌳', color: '#2ED573', category: 'achievement', rarity: 'rare', level: 2, xp: 100, requirements: { description: 'Complete 10 skill nodes', criteria: ['Build skill tree', 'Complete 10 nodes'] } },
];

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

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Search and filters
  const [milestoneSearch, setMilestoneSearch] = useState('');
  const [badgeSearch, setBadgeSearch] = useState('');
  
  // NFT Badge filters (horizontal bar)
  const [badgeStatus, setBadgeStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [badgeCategory, setBadgeCategory] = useState<'all' | 'technical' | 'certification' | 'soft'>('all');
  const [badgeRarity, setBadgeRarity] = useState<'all' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common'>('all');

  const loadData = useCallback(async () => {
    try {
      const [achievementsResult, badgesResult] = await Promise.all([
        achievementsApi.getAll(),
        user?.walletAddress ? badgesApi.getByStudent(user.walletAddress) : Promise.resolve({ success: false, data: [] })
      ]);
      
      if (achievementsResult.success && achievementsResult.data) {
        setAchievements(achievementsResult.data);
        const earned = new Set<string>();
        achievementsResult.data.filter((a: Achievement) => a.achieved).forEach((a: Achievement) => {
          earned.add(a.id);
          earned.add(a.name?.toLowerCase().replace(/\s+/g, '-'));
        });
        setEarnedBadgeIds(earned);
      }
      
      if (badgesResult.success && badgesResult.data) {
        setBadges(badgesResult.data);
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      credential: 'from-blue-500 to-blue-600',
      badge: 'from-purple-500 to-purple-600',
      skill: 'from-green-500 to-green-600',
      endorsement: 'from-orange-500 to-orange-600',
      special: 'from-pink-500 to-pink-600',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getRarityColor = (rarity?: string) => {
    const colors: Record<string, string> = {
      legendary: 'from-yellow-400 to-orange-500',
      epic: 'from-purple-500 to-pink-500',
      rare: 'from-blue-500 to-cyan-500',
      uncommon: 'from-green-500 to-emerald-500',
      common: 'from-gray-400 to-gray-500',
    };
    return colors[rarity || ''] || 'from-gray-400 to-gray-500';
  };

  const getRarityValue = (rarity: string) => {
    const values: Record<string, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    return values[rarity] || 0;
  };

  const isBadgeEarned = useCallback((badgeDef: BadgeDefinition): boolean => {
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
  }, [earnedBadgeIds, badges]);

  // Filter and sort milestones
  const filteredMilestones = useMemo(() => {
    let filtered = [...achievements];
    
    if (milestoneSearch) {
      const search = milestoneSearch.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(search) || 
        a.description.toLowerCase().includes(search)
      );
    }
    
    filtered.sort((a, b) => {
      if (a.achieved && !b.achieved) return -1;
      if (!a.achieved && b.achieved) return 1;
      if (a.achieved && b.achieved && a.achievedAt && b.achievedAt) {
        return new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime();
      }
      const aProgress = (a.progress / a.requirement) * 100;
      const bProgress = (b.progress / b.requirement) * 100;
      return bProgress - aProgress;
    });
    
    return filtered;
  }, [achievements, milestoneSearch]);

  // Filter and sort badges (exclude achievement/milestone badges)
  const filteredBadges = useMemo(() => {
    let filtered = BADGE_DEFINITIONS.filter(b => b.category !== 'achievement');
    
    if (badgeSearch) {
      const search = badgeSearch.toLowerCase();
      filtered = filtered.filter(b => 
        b.skillName.toLowerCase().includes(search) || 
        b.description.toLowerCase().includes(search)
      );
    }
    
    if (badgeStatus === 'unlocked') {
      filtered = filtered.filter(b => isBadgeEarned(b));
    } else if (badgeStatus === 'locked') {
      filtered = filtered.filter(b => !isBadgeEarned(b));
    }
    
    if (badgeCategory !== 'all') {
      filtered = filtered.filter(b => b.category === badgeCategory);
    }
    
    if (badgeRarity !== 'all') {
      filtered = filtered.filter(b => b.rarity === badgeRarity);
    }
    
    filtered.sort((a, b) => b.level - a.level);
    
    return filtered;
  }, [badgeSearch, badgeStatus, badgeCategory, badgeRarity, isBadgeEarned]);

  const achievedCount = achievements.filter(a => a.achieved).length;
  const totalXP = achievements.filter(a => a.achieved && a.reward).reduce((sum, a) => sum + (a.reward?.xp || 0), 0);
  const totalNFTBadges = BADGE_DEFINITIONS.filter(b => b.category !== 'achievement').length;
  const unlockedBadgeCount = useMemo(() => BADGE_DEFINITIONS.filter(b => b.category !== 'achievement' && isBadgeEarned(b)).length, [isBadgeEarned]);
  const totalBadgeXP = badges.reduce((sum, b) => sum + getBadgeXP(b), 0);
  const combinedTotalXP = totalXP + totalBadgeXP;
  
  // Overall progress: milestones + NFT badges combined
  const totalMilestones = achievements.length;
  const totalBadgesPossible = totalNFTBadges;
  const totalAchieved = achievedCount + unlockedBadgeCount;
  const totalPossible = totalMilestones + totalBadgesPossible;
  const overallProgress = totalPossible > 0 ? Math.round((totalAchieved / totalPossible) * 100) : 0;

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Achievements & Badges</h1>
            <p className="text-muted-foreground">Track milestones, earn badges, and unlock rewards</p>
          </div>
        </div>

        {/* 6 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{achievedCount}</p>
              <p className="text-xs opacity-80">Milestones</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{unlockedBadgeCount}</p>
              <p className="text-xs opacity-80">Badges Unlocked</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{totalXP}</p>
              <p className="text-xs opacity-80">Milestone XP</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white">
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{totalBadgeXP}</p>
              <p className="text-xs opacity-80">Badge XP</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500 to-fuchsia-500 text-white">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{combinedTotalXP}</p>
              <p className="text-xs opacity-80">Total XP</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{overallProgress}%</p>
              <p className="text-xs opacity-80">Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Button */}
        <div className="flex justify-end">
          <Button onClick={() => router.push('/leaderboard')} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white gap-2">
            <Medal className="w-4 h-4" />
            View Leaderboard
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="milestones">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="milestones" className="gap-2">
              <Trophy className="w-4 h-4" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="w-4 h-4" />
              NFT Badges
            </TabsTrigger>
          </TabsList>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="mt-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search milestones..." 
                value={milestoneSearch}
                onChange={(e) => setMilestoneSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMilestones.map((achievement, index) => (
                <motion.div key={achievement.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className={`h-full transition-all ${achievement.achieved ? 'border-green-500/50 shadow-lg shadow-green-500/10' : 'opacity-70'}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <span className="text-4xl">{achievement.icon}</span>
                        {achievement.achieved && <CheckCircle className="w-6 h-6 text-green-500" />}
                      </div>
                      <CardTitle className="flex items-center gap-2">
                        {achievement.name}
                        {achievement.achieved && (
                          <Badge className={`bg-gradient-to-r ${getCategoryColor(achievement.category)} text-white text-xs`}>Unlocked</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.requirement}</span>
                          </div>
                          <Progress value={Math.min((achievement.progress / achievement.requirement) * 100, 100)} className={`h-2 ${achievement.achieved ? '[&>div]:bg-green-500' : ''}`} />
                        </div>
                        {achievement.reward && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">+{achievement.reward.xp} XP</Badge>
                          </div>
                        )}
                        {achievement.achieved && achievement.achievedAt && (
                          <p className="text-xs text-muted-foreground">Unlocked on {formatDateTime(achievement.achievedAt)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredMilestones.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No milestones match your search</p>
              </div>
            )}
          </TabsContent>

          {/* NFT Badges Tab */}
          <TabsContent value="badges" className="mt-6">
            {/* Search and Filters - Side by Side */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search badges..." 
                  value={badgeSearch}
                  onChange={(e) => setBadgeSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                <select
                  value={badgeCategory}
                  onChange={(e) => setBadgeCategory(e.target.value as any)}
                  className="px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="technical">Technical</option>
                  <option value="certification">Certification</option>
                  <option value="soft">Soft Skills</option>
                </select>
              </div>

              {/* Rarity Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rarity:</span>
                <select
                  value={badgeRarity}
                  onChange={(e) => setBadgeRarity(e.target.value as any)}
                  className="px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="all">All Rarities</option>
                  <option value="legendary">Legendary</option>
                  <option value="epic">Epic</option>
                  <option value="rare">Rare</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="common">Common</option>
                </select>
              </div>

              {/* Status Toggle - Single toggle button */}
              <div className="flex items-center">
                <button
                  onClick={() => setBadgeStatus(badgeStatus === 'unlocked' ? 'locked' : 'unlocked')}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    badgeStatus === 'unlocked' 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  {badgeStatus === 'unlocked' ? 'Showing: Unlocked' : 'Showing: Locked'}
                </button>
              </div>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBadges.map((badgeDef, index) => {
                const earned = isBadgeEarned(badgeDef);
                return (
                  <motion.div key={badgeDef.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.02 }}>
                    <Card className={`transition-all cursor-pointer ${earned ? 'ring-2 ring-green-500/30 hover:ring-green-500/50' : 'opacity-60 hover:opacity-80'}`}>
                      <div className={`h-1.5 bg-gradient-to-r ${getRarityColor(badgeDef.rarity)}`} />
                      <CardContent className="p-4 text-center">
                        <div className="mb-2">
                          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl" style={{ backgroundColor: `${badgeDef.color}20`, boxShadow: earned ? `0 0 15px ${badgeDef.color}40` : 'none' }}>
                            {earned ? badgeDef.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 truncate">{badgeDef.skillName}</h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badgeDef.description}</p>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Badge variant="outline" className="text-xs">Lv{badgeDef.level}</Badge>
                          <Badge className={`bg-gradient-to-r ${getRarityColor(badgeDef.rarity)} text-white text-xs`}>{badgeDef.rarity}</Badge>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span>+{badgeDef.xp} XP</span>
                        </div>
                        {earned && <Badge className="mt-2 bg-green-500 text-xs">Unlocked</Badge>}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredBadges.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No badges match the selected filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}