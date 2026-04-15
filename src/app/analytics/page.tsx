'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Target,
  BookOpen,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Code,
  Database,
  Palette,
  Shield,
  Brain,
  Lightbulb,
  Zap,
  TrendingDown,
  Gauge,
  GraduationCap,
  RefreshCw,
  TreeDeciduous,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsApi, authApi } from '@/lib/api';
import { StudentAnalytics } from '@/types';
import { getTierFromScore, cn } from '@/lib/utils';

// Career Path definitions with required skills
interface CareerPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredSkills: { name: string; level: number }[];
}

const CAREER_PATHS: CareerPath[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    description: 'Build and maintain software applications',
    icon: '💻',
    color: '#3B82F6',
    requiredSkills: [
      { name: 'Python', level: 3 },
      { name: 'JavaScript', level: 3 },
      { name: 'Data Structures', level: 2 },
      { name: 'Web Development', level: 3 },
      { name: 'Databases', level: 2 },
      { name: 'Git', level: 2 },
    ]
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Analyze data and build ML models',
    icon: '📊',
    color: '#10B981',
    requiredSkills: [
      { name: 'Python', level: 3 },
      { name: 'Statistics', level: 3 },
      { name: 'Machine Learning', level: 3 },
      { name: 'Data Analysis', level: 3 },
      { name: 'SQL', level: 2 },
      { name: 'Visualization', level: 2 },
    ]
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity Expert',
    description: 'Protect systems from security threats',
    icon: '🔐',
    color: '#EF4444',
    requiredSkills: [
      { name: 'Network Security', level: 3 },
      { name: 'Ethical Hacking', level: 3 },
      { name: 'Cryptography', level: 2 },
      { name: 'Security Best Practices', level: 3 },
      { name: 'Risk Assessment', level: 2 },
      { name: 'Incident Response', level: 2 },
    ]
  },
  {
    id: 'fullstack-developer',
    name: 'Full Stack Developer',
    description: 'Develop both frontend and backend',
    icon: '🌐',
    color: '#8B5CF6',
    requiredSkills: [
      { name: 'HTML/CSS', level: 3 },
      { name: 'JavaScript', level: 3 },
      { name: 'React', level: 3 },
      { name: 'Node.js', level: 2 },
      { name: 'Databases', level: 2 },
      { name: 'API Design', level: 2 },
    ]
  },
  {
    id: 'cloud-engineer',
    name: 'Cloud Engineer',
    description: 'Design and manage cloud infrastructure',
    icon: '☁️',
    color: '#F59E0B',
    requiredSkills: [
      { name: 'AWS', level: 3 },
      { name: 'Azure', level: 2 },
      { name: 'DevOps', level: 3 },
      { name: 'Docker', level: 2 },
      { name: 'Kubernetes', level: 2 },
      { name: 'Infrastructure', level: 2 },
    ]
  },
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    description: 'Build artificial intelligence solutions',
    icon: '🤖',
    color: '#EC4899',
    requiredSkills: [
      { name: 'Python', level: 3 },
      { name: 'Machine Learning', level: 3 },
      { name: 'Deep Learning', level: 3 },
      { name: 'Neural Networks', level: 3 },
      { name: 'NLP', level: 2 },
      { name: 'TensorFlow', level: 2 },
    ]
  },
];

// Peer benchmark data
const INDUSTRY_BENCHMARKS = {
  'software-engineer': { avgXP: 850, avgSkills: 8, avgCredentials: 6 },
  'data-scientist': { avgXP: 920, avgSkills: 7, avgCredentials: 7 },
  'cybersecurity': { avgXP: 780, avgSkills: 6, avgCredentials: 5 },
  'fullstack-developer': { avgXP: 800, avgSkills: 9, avgCredentials: 6 },
  'cloud-engineer': { avgXP: 750, avgSkills: 7, avgCredentials: 5 },
  'ai-engineer': { avgXP: 950, avgSkills: 8, avgCredentials: 7 },
};

// Utility functions for skill levels
function getLevelColor(level: number): string {
  if (level >= 3) return '#EF4444'; // Red for expert
  if (level >= 2) return '#8B5CF6'; // Purple for advanced
  if (level >= 1) return '#3B82F6'; // Blue for intermediate
  return '#9CA3AF'; // Gray for beginner
}

function getLevelName(level: number): string {
  if (level >= 3) return 'Expert';
  if (level >= 2) return 'Advanced';
  if (level >= 1) return 'Intermediate';
  return 'Beginner';
}

function getBranchColor(branch: string): string {
  const colors: Record<string, string> = {
    'foundational': '#3B82F6',  // Blue
    'core': '#10B981',          // Green
    'applied': '#8B5CF6',       // Purple
    'specialized': '#F59E0B',   // Orange
    'default': '#6B7280'        // Gray
  };
  return colors[branch] || colors.default;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [userSkills, setUserSkills] = useState<{name: string, level: number}[]>([]);
  
  // AI Learning Path state (Gemini-powered)
  const [aiLearningPath, setAiLearningPath] = useState<any[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Recommendations state (Gemini-powered)
  const [recommendations, setRecommendations] = useState<{
    courses: any[];
    certifications: any[];
    internships: any[];
  } | null>(null);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await analyticsApi.getStudent();
      if (result.success && result.data) {
        setAnalytics(result.data);

        // Convert skill distribution to distinct user skills with levels
        const skills = Object.entries(result.data.skills?.distribution || {}).map(
          ([skillName, count]) => ({
            name: skillName,
            level: count >= 5 ? 3 : count >= 3 ? 2 : 1,
            count
          })
        );

        setUserSkills(skills);
      }
      
      // Load user's saved career path
      try {
        const userResult = await authApi.getMe();
        if (userResult.success && userResult.data?.preferredCareerPath) {
          setSelectedPath(userResult.data.preferredCareerPath);
        }
      } catch (userError) {
        console.log('Could not load user career path:', userError);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle career path selection and save to backend
  const handleSelectCareerPath = async (pathId: string) => {
    setSelectedPath(pathId);
    
    // Save to backend
    try {
      await authApi.saveCareerPath(pathId);
      console.log('Career path saved:', pathId);
    } catch (error) {
      console.error('Error saving career path:', error);
    }
  };

  // Fetch personalized recommendations using Gemini
  const fetchRecommendations = async () => {
    if (userSkills.length === 0) return;
    
    setIsRecommendationsLoading(true);
    
    try {
      const careerPath = getSelectedCareerPath();
      const skillNames = userSkills.map(s => s.name);
      
      const response = await fetch('http://localhost:5002/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: skillNames,
          projects: [], // Could be fetched from credentials
          certifications: [], // Could be fetched from badges
          education: {}, // Could be fetched from profile
          target_career: careerPath?.name || ''
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRecommendations({
          courses: data.courses || [],
          certifications: data.certifications || [],
          internships: data.internships || []
        });
      } else {
        console.error('Failed to get recommendations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsRecommendationsLoading(false);
    }
  };

  const getSelectedCareerPath = () => CAREER_PATHS.find(p => p.id === selectedPath);

  // Calculate skill gaps
  const getSkillGaps = () => {
    const careerPath = getSelectedCareerPath();
    if (!careerPath) return [];
    
    return careerPath.requiredSkills.map(required => {
      const userSkill = userSkills.find(s => s.name.toLowerCase() === required.name.toLowerCase());
      return {
        name: required.name,
        required: required.level,
        current: userSkill?.level || 0,
        gap: required.level - (userSkill?.level || 0),
      };
    }).sort((a, b) => b.gap - a.gap);
  };

  // Calculate completion percentage for career path
  const getCareerPathProgress = () => {
    const careerPath = getSelectedCareerPath();
    if (!careerPath) return 0;
    
    const gaps = getSkillGaps();
    const completedSkills = gaps.filter(g => g.current >= g.required).length;
    return Math.round((completedSkills / careerPath.requiredSkills.length) * 100);
  };

  // Get learning path recommendations
  const getLearningPath = () => {
    const gaps = getSkillGaps();
    return gaps
      .filter(g => g.gap > 0)
      .slice(0, 5)
      .map(gap => ({
        skill: gap.name,
        priority: gap.gap > 2 ? 'High' : gap.gap > 1 ? 'Medium' : 'Low',
        action: gap.gap > 2 ? 'Enroll in advanced course' : 'Complete certification',
      }));
  };

  // Generate AI-powered learning path using Gemini LLM
  const generateAILearningPath = async () => {
    if (!selectedPath || userSkills.length === 0) return;
    
    setIsAILoading(true);
    setAiError(null);
    
    try {
      const careerPath = getSelectedCareerPath();
      const skillNames = userSkills.map(s => s.name);
      
      // Use the dedicated AI learning path endpoint
      const response = await fetch('http://localhost:5002/api/ai/ai-learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: skillNames,
          target_career: careerPath?.name || '',
          interests: [],
          education_level: 'undergraduate'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.learning_path && data.learning_path.length > 0) {
        // Transform Gemini response to our format
        const transformedPath = data.learning_path.map((item: any) => ({
          skill: item.topic,
          priority: item.priority || (item.estimated_time?.includes('2') ? 'High' : 'Medium'),
          action: item.reason || 'Learn this topic',
          estimatedTime: item.estimated_time
        }));
        setAiLearningPath(transformedPath);
      } else if (data.career_options && data.career_options.length > 0) {
        // Fallback to PyTorch response format
        const topCareer = data.career_options[0];
        if (topCareer.missing_skills) {
          setAiLearningPath(topCareer.missing_skills.map((skill: string, idx: number) => ({
            skill: skill,
            priority: idx < 2 ? 'High' : 'Medium',
            action: 'Learn this skill to improve your profile',
            estimatedTime: `${(idx + 1) * 2} weeks`
          })));
        }
      } else {
        setAiError('Could not generate AI learning path. Using default path.');
        // Use fallback
        setAiLearningPath(getLearningPath());
      }
    } catch (error) {
      console.error('Error generating AI learning path:', error);
      setAiError('AI service unavailable. Using default path.');
      setAiLearningPath(getLearningPath());
    } finally {
      setIsAILoading(false);
    }
  };

   // Get peer comparison
   const getPeerComparison = () => {
     const careerPath = getSelectedCareerPath();
     if (!careerPath || !analytics) return null;
     
     const benchmark = INDUSTRY_BENCHMARKS[careerPath.id as keyof typeof INDUSTRY_BENCHMARKS];
     const userXP = analytics.performanceScore || 0;
     const userSkillsCount = userSkills.length;
     const userCredentials = analytics.overview?.totalCredentials || 0;
     
     return {
       xp: {
         user: userXP,
         peer: benchmark?.avgXP || 500,
         percentile: Math.min(100, Math.round((userXP / (benchmark?.avgXP || 500)) * 100)),
       },
       skills: {
         user: userSkillsCount,
         peer: benchmark?.avgSkills || 5,
         percentile: Math.min(100, Math.round((userSkillsCount / (benchmark?.avgSkills || 5)) * 100)),
       },
       credentials: {
         user: userCredentials,
         peer: benchmark?.avgCredentials || 4,
         percentile: Math.min(100, Math.round((userCredentials / (benchmark?.avgCredentials || 4)) * 100)),
       },
     };
   };

  // Enhanced skill tree state
  const [skillTreeData, setSkillTreeData] = useState<any>(null);
  const [selectedSkillNode, setSelectedSkillNode] = useState<any>(null);
  const [skillTreeLoading, setSkillTreeLoading] = useState(false);

  // Load skill tree data from backend
  const loadSkillTree = async () => {
    if (!selectedPath) return;

    setSkillTreeLoading(true);
    try {
      // Generate skill tree based on selected career path and user skills
      const mockSkillTree = generateEnhancedSkillTree();
      console.log('Generated skill tree:', mockSkillTree);
      setSkillTreeData(mockSkillTree);
    } catch (error) {
      console.error('Error loading skill tree:', error);
    } finally {
      setSkillTreeLoading(false);
    }
  };

  // Generate enhanced skill tree with proper relationships
  const generateEnhancedSkillTree = () => {
    const careerPath = getSelectedCareerPath();
    if (!careerPath) {
      console.log('No career path selected');
      return null;
    }

    console.log('Generating skill tree for career path:', careerPath.name);
    console.log('Analytics data:', analytics);
    console.log('User skills:', userSkills);

    // Define a simpler skill tree with fewer nodes and clearer branches
    const skillCategories = {
      'foundational': ['HTML/CSS', 'JavaScript', 'Git', 'Basic Programming'],
      'core': ['React', 'Node.js', 'Python', 'Databases'],
      'applied': ['APIs', 'Security', 'Cloud Computing', 'Testing'],
      'specialized': ['Blockchain', 'Machine Learning', 'Data Science']
    };

    // Helper function to get skill level from analytics data
    const getSkillLevel = (skillName: string): number => {
      if (!analytics?.skills?.distribution) {
        return 0;
      }

      if (analytics.skills.distribution[skillName] !== undefined) {
        const count = analytics.skills.distribution[skillName];
        return count >= 5 ? 3 : count >= 3 ? 2 : 1;
      }

      const skillLower = skillName.toLowerCase();
      for (const [skill, count] of Object.entries(analytics.skills.distribution)) {
        const analyticsSkillLower = skill.toLowerCase();
        if (analyticsSkillLower.includes(skillLower) || skillLower.includes(analyticsSkillLower)) {
          return count >= 5 ? 3 : count >= 3 ? 2 : 1;
        }
      }

      return 0;
    };

    // Create nodes with proper prerequisites
    const nodes: any[] = [];
    let nodeId = 0;

    // Foundational skills (no prerequisites)
    skillCategories.foundational.forEach((skill, index) => {
      nodes.push({
        id: nodeId++,
        skillName: skill,
        category: 'technical',
        level: getSkillLevel(skill),
        description: `Master the fundamentals of ${skill}`,
        prerequisites: [],
        credentials: [], // Would be populated from real data
        xpPoints: 100,
        icon: getSkillIcon(skill),
        isLocked: false,
        position: { x: 20 + (index * 15), y: 20 },
        branch: 'foundational'
      });
    });

    // Core skills (require foundational)
    skillCategories.core.forEach((skill, index) => {
      const prereqIds = nodes.filter(n => n.branch === 'foundational').map(n => n.id);
      const level = getSkillLevel(skill);
      const hasSkill = level > 0;

      nodes.push({
        id: nodeId++,
        skillName: skill,
        category: 'technical',
        level,
        description: `Build expertise in ${skill}`,
        prerequisites: prereqIds.slice(0, 2),
        credentials: [],
        xpPoints: 200,
        icon: getSkillIcon(skill),
        isLocked: !hasSkill && !prereqIds.slice(0, 2).every((id: number) => nodes.find(n => n.id === id)?.level >= 2),
        position: { x: 20 + (index * 15), y: 40 },
        branch: 'core'
      });
    });

    // Applied skills (require core)
    skillCategories.applied.forEach((skill, index) => {
      const coreIds = nodes.filter(n => n.branch === 'core').map(n => n.id);
      const level = getSkillLevel(skill);
      const hasSkill = level > 0;

      nodes.push({
        id: nodeId++,
        skillName: skill,
        category: 'technical',
        level,
        description: `Apply ${skill} in real projects`,
        prerequisites: coreIds.slice(0, 2),
        credentials: [],
        xpPoints: 250,
        icon: getSkillIcon(skill),
        isLocked: !hasSkill && !coreIds.slice(0, 2).every((id: number) => nodes.find(n => n.id === id)?.level >= 2),
        position: { x: 15 + (index * 15), y: 60 },
        branch: 'applied'
      });
    });

    // Specialized skills (require applied)
    skillCategories.specialized.forEach((skill, index) => {
      const appliedIds = nodes.filter(n => n.branch === 'applied').map(n => n.id);
      const level = getSkillLevel(skill);
      const hasSkill = level > 0;

      nodes.push({
        id: nodeId++,
        skillName: skill,
        category: 'specialized',
        level,
        description: `Gain specialized knowledge in ${skill}`,
        prerequisites: appliedIds.slice(0, 2),
        credentials: [],
        xpPoints: 300,
        icon: getSkillIcon(skill),
        isLocked: !hasSkill && !appliedIds.slice(0, 2).every((id: number) => nodes.find(n => n.id === id)?.level >= 2),
        position: { x: 25 + (index * 15), y: 75 },
        branch: 'specialized'
      });
    });

    return {
      nodes,
      totalXP: nodes.reduce((sum, node) => sum + node.xpPoints, 0),
      level: Math.floor(nodes.reduce((sum, node) => sum + node.xpPoints, 0) / 1000) + 1,
      completedNodes: nodes.filter(n => n.level >= 2).length,
      totalNodes: nodes.length,
      branches: [
        { name: 'Foundational', category: 'technical', nodes: nodes.filter(n => n.branch === 'foundational').map(n => n.id), progress: 0 },
        { name: 'Core', category: 'technical', nodes: nodes.filter(n => n.branch === 'core').map(n => n.id), progress: 0 },
        { name: 'Applied', category: 'technical', nodes: nodes.filter(n => n.branch === 'applied').map(n => n.id), progress: 0 },
        { name: 'Specialized', category: 'specialized', nodes: nodes.filter(n => n.branch === 'specialized').map(n => n.id), progress: 0 }
      ]
    };
  };

  // Get skill icon based on skill name
  const getSkillIcon = (skillName: string): string => {
    const iconMap: Record<string, string> = {
      'HTML/CSS': '🌐',
      'JavaScript': '💛',
      'React': '⚛️',
      'Vue.js': '💚',
      'Angular': '🔴',
      'Node.js': '🟢',
      'Python': '🐍',
      'Databases': '🗄️',
      'APIs': '🔌',
      'Security': '🔒',
      'Git': '🌿',
      'UI/UX Design': '🎨',
      'Cloud Computing': '☁️',
      'DevOps': '⚙️',
      'Testing': '🧪',
      'Machine Learning': '🤖',
      'Blockchain': '⛓️',
      'Mobile Development': '📱',
      'Data Science': '📊',
      'Basic Programming': '💻'
    };
    return iconMap[skillName] || '🎯';
  };

  // Load skill tree when component mounts or career path changes
  useEffect(() => {
    if (selectedPath) {
      loadSkillTree();
    }
  }, [selectedPath, userSkills]);

  // Also load skill tree when analytics loads (for initial data)
  useEffect(() => {
    if (selectedPath && analytics) {
      loadSkillTree();
    }
  }, [analytics]);

  // Enhanced skill tree connections with proper prerequisite visualization
  const getSkillTreeConnections = () => {
    if (!skillTreeData) return [];

    const connections: any[] = [];
    skillTreeData.nodes.forEach((node: any) => {
      node.prerequisites.forEach((prereqId: number) => {
        const prereqNode = skillTreeData.nodes.find((n: any) => n.id === prereqId);
        if (prereqNode) {
          connections.push({
            from: prereqNode.position,
            to: node.position,
            isLocked: node.isLocked,
            level: node.level,
            branch: node.branch
          });
        }
      });
    });
    return connections;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  const tier = getTierFromScore(analytics?.performanceScore || 0);
  const peerComparison = getPeerComparison();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track your skill growth, career progress, and compare with peers
          </p>
        </div>

           <Tabs defaultValue="overview" className="space-y-6">
             <TabsList className="grid w-full grid-cols-5">
               <TabsTrigger value="overview">Overview</TabsTrigger>
               <TabsTrigger value="career">Career Path</TabsTrigger>
               <TabsTrigger value="learning">Learning Path</TabsTrigger>
               <TabsTrigger value="skills">Skill Tree</TabsTrigger>
               <TabsTrigger value="peers">Peer Compare</TabsTrigger>
             </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Performance Score</p>
                      <p className="text-2xl font-bold">{analytics?.performanceScore || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tier</p>
                      <Badge style={{ backgroundColor: tier.color }} className="text-white">
                        {tier.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Skills</p>
                      <p className="text-2xl font-bold">{analytics?.overview?.uniqueSkills || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Badges Earned</p>
                      <p className="text-2xl font-bold">{analytics?.overview?.totalBadges || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skill Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Distribution</CardTitle>
                  <CardDescription>Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analytics?.skills?.distribution || {}).map(([category, count]) => (
                    <div key={category}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{category}</span>
                        <span className="text-sm text-muted-foreground">{count} skills</span>
                      </div>
                      <Progress
                        value={(count / Math.max(...Object.values(analytics?.skills?.distribution || {}), 1)) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Skills</CardTitle>
                  <CardDescription>Your strongest competencies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(analytics?.skills?.topSkills || []).map((skill, index) => (
                      <div key={skill.skill} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{skill.skill}</span>
                            <Badge variant="outline">{skill.level}</Badge>
                          </div>
                          <Progress value={(skill.count / 5) * 100} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
                <CardDescription>Your career path and skill development plan</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPath ? (
                  // Career Path Selection (if not selected)
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Choose Your Career Path</h3>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        Select your target career to get personalized skill gap analysis and learning recommendations.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {CAREER_PATHS.map((path) => (
                          <Button
                            key={path.id}
                            variant="outline"
                            className="h-auto py-2 flex flex-col items-center gap-1"
                            onClick={() => handleSelectCareerPath(path.id)}
                          >
                            <span className="text-xl">{path.icon}</span>
                            <span className="text-xs text-center">{path.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show career path, skill gaps, and recommendations
                  <div className="space-y-6">
                    {/* Selected Career Path Info */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${getSelectedCareerPath()?.color}20` }}
                        >
                          {getSelectedCareerPath()?.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{getSelectedCareerPath()?.name}</h3>
                          <p className="text-sm text-muted-foreground">{getSelectedCareerPath()?.description}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPath(null)}
                      >
                        Change
                      </Button>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Career Progress</span>
                        <span className="text-muted-foreground">{getCareerPathProgress()}%</span>
                      </div>
                      <Progress value={getCareerPathProgress()} className="h-3" />
                    </div>

                    {/* Skill Gaps */}
                    {getSkillGaps().length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Skill Gap Analysis</h4>
                        <div className="space-y-3">
                          {getSkillGaps().slice(0, 4).map((skill) => (
                            <div key={skill.name} className="flex items-center gap-3">
                              <div className="w-28 text-sm truncate">{skill.name}</div>
                              <div className="flex-1">
                                <Progress 
                                  value={(skill.current / 3) * 100} 
                                  className={`h-2 ${skill.gap > 0 ? 'bg-orange-100' : 'bg-green-100'}`}
                                />
                              </div>
                              <div className="w-16 text-xs text-muted-foreground text-right">
                                {skill.current}/3
                              </div>
                              {skill.gap > 0 && (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  -{skill.gap}
                                </Badge>
                              )}
                              {skill.gap === 0 && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learning Recommendations */}
                    {getLearningPath().length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Recommended Next Steps</h4>
                        <div className="space-y-2">
                          {getLearningPath().slice(0, 3).map((item, index) => (
                            <div 
                              key={item.skill} 
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50"
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <span className="font-medium">{item.skill}</span>
                              </div>
                              <Badge className={item.priority === 'High' ? 'bg-red-500' : item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}>
                                {item.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {getLearningPath().length === 0 && (
                      <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                        <h4 className="font-semibold">All Skills Complete!</h4>
                        <p className="text-sm text-muted-foreground">
                          You&apos;ve mastered all required skills for this career path.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Path Tab */}
          <TabsContent value="career" className="space-y-6">
            {/* Career Path Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Select Your Career Path
                </CardTitle>
                <CardDescription>
                  Choose a career path to identify skill gaps and get personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CAREER_PATHS.map((path) => (
                    <motion.div
                      key={path.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          selectedPath === path.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleSelectCareerPath(path.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: `${path.color}20` }}
                            >
                              {path.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{path.name}</h3>
                              <p className="text-xs text-muted-foreground">{path.requiredSkills.length} skills required</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{path.description}</p>
                          {selectedPath === path.id && (
                            <Badge className="w-full justify-center" style={{ backgroundColor: path.color }}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Gap Analysis */}
            {selectedPath && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Skill Gap Analysis
                  </CardTitle>
                  <CardDescription>
                    Compare your current skills with {getSelectedCareerPath()?.name} requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Career Path Progress</span>
                      <span className="text-muted-foreground">{getCareerPathProgress()}%</span>
                    </div>
                    <Progress value={getCareerPathProgress()} className="h-3" />
                  </div>

                  <div className="space-y-4">
                    {getSkillGaps().map((skill) => (
                      <div key={skill.name} className="flex items-center gap-4">
                        <div className="w-32 font-medium">{skill.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(skill.current / 3) * 100} 
                              className={`h-2 ${skill.gap > 0 ? 'bg-orange-200' : 'bg-green-200'}`}
                            />
                            <span className="text-sm w-8">{skill.current}/3</span>
                          </div>
                        </div>
                        {skill.gap > 0 ? (
                          <Badge variant="outline" className="text-orange-600">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Gap: {skill.gap}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="learning" className="space-y-6">
            {selectedPath ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Personalized Learning Path
                    </CardTitle>
                    <CardDescription>
                      Recommended steps to close your skill gaps for {getSelectedCareerPath()?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getLearningPath().map((item, index) => (
                        <motion.div
                          key={item.skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center gap-4 p-4 rounded-lg border">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{item.skill}</h3>
                                <Badge className={`
                                  ${item.priority === 'High' ? 'bg-red-500' : ''}
                                  ${item.priority === 'Medium' ? 'bg-yellow-500' : ''}
                                  ${item.priority === 'Low' ? 'bg-green-500' : ''}
                                  text-white
                                `}>
                                  {item.priority} Priority
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.action}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </motion.div>
                      ))}
                      {getLearningPath().length === 0 && (
                        <div className="text-center p-8">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          <h3 className="font-semibold text-lg">Congratulations!</h3>
                          <p className="text-muted-foreground">You&apos;ve completed all required skills for this career path!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions - Gemini Powered */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      Recommended Actions
                    </CardTitle>
                    <CardDescription>
                      AI-powered recommendations based on your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isAILoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Brain className="w-5 h-5 animate-pulse mr-2" />
                        <span>Generating recommendations...</span>
                      </div>
                    ) : aiLearningPath.length > 0 ? (
                      <div className="space-y-4">
                        {/* AI Recommended Courses */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Recommended Courses
                          </h4>
                          <div className="space-y-2">
                            {aiLearningPath.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="font-medium text-sm">{item.skill}</p>
                                <p className="text-xs text-muted-foreground">{item.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* AI Recommended Certifications */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Recommended Certifications
                          </h4>
                          <div className="space-y-2">
                            {aiLearningPath.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <p className="font-medium text-sm">{item.skill} Certification</p>
                                <p className="text-xs text-muted-foreground">Validate your skills</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* AI Internship Guidance */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Internship Opportunities
                          </h4>
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="font-medium text-sm">
                              {getSelectedCareerPath()?.name} Internship Pathway
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Build real-world projects to gain experience
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get personalized recommendations based on your profile using Gemini AI.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Button 
                            className="w-full"
                            onClick={fetchRecommendations}
                            disabled={isRecommendationsLoading}
                          >
                            {isRecommendationsLoading ? (
                              <Brain className="w-4 h-4 mr-2 animate-pulse" />
                            ) : (
                              <BookOpen className="w-4 h-4 mr-2" />
                            )}
                            Get Recommendations
                          </Button>
                        </div>
                        
                        {/* Display AI Recommendations */}
                        {recommendations && (
                          <div className="mt-6 space-y-4">
                            {/* Courses */}
                            {recommendations.courses.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  Recommended Courses
                                </h4>
                                <div className="space-y-2">
                                  {recommendations.courses.slice(0, 3).map((course, idx) => (
                                    <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                      <p className="font-medium text-sm">{course.title}</p>
                                      <p className="text-xs text-muted-foreground">{course.platform} • {course.level}</p>
                                      <p className="text-xs text-blue-600 mt-1">{course.reason}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Certifications */}
                            {recommendations.certifications.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Award className="w-4 h-4" />
                                  Recommended Certifications
                                </h4>
                                <div className="space-y-2">
                                  {recommendations.certifications.slice(0, 3).map((cert, idx) => (
                                    <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                                      <p className="font-medium text-sm">{cert.name}</p>
                                      <p className="text-xs text-muted-foreground">{cert.provider}</p>
                                      <p className="text-xs text-green-600 mt-1">{cert.reason}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Internships */}
                            {recommendations.internships.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Briefcase className="w-4 h-4" />
                                  Internship Opportunities
                                </h4>
                                <div className="space-y-2">
                                  {recommendations.internships.slice(0, 3).map((intern, idx) => (
                                    <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                      <p className="font-medium text-sm">{intern.title}</p>
                                      <p className="text-xs text-muted-foreground">{intern.company_type}</p>
                                      <p className="text-xs text-purple-600 mt-1">{intern.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Career Path First</h3>
                <p className="text-muted-foreground mb-4">
                  Choose your career path in the Career Path tab to see your personalized learning roadmap.
                </p>
                <Button onClick={() => document.querySelector('[value="career"]')?.dispatchEvent(new Event('click', { bubbles: true }))}>
                  Go to Career Path
                </Button>
              </Card>
            )}
          </TabsContent>

         {/* Skill Tree Tab */}
           <TabsContent value="skills" className="space-y-6">
             {selectedPath ? (
               <>
                 {/* Skill Tree Overview */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                           <TreeDeciduous className="w-5 h-5 text-blue-600" />
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground">Total Skills</p>
                           <p className="text-xl font-bold">{skillTreeData?.totalNodes || 0}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                           <CheckCircle className="w-5 h-5 text-green-600" />
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground">Mastered</p>
                           <p className="text-xl font-bold">{skillTreeData?.completedNodes || 0}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                           <Zap className="w-5 h-5 text-purple-600" />
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground">Total XP</p>
                           <p className="text-xl font-bold">{skillTreeData?.totalXP || 0}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                           <Gauge className="w-5 h-5 text-orange-600" />
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground">Tree Level</p>
                           <p className="text-xl font-bold">{skillTreeData?.level || 1}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </div>

                 {/* Skill Tree Branches */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <TreeDeciduous className="w-5 h-5" />
                       Skill Tree Branches
                     </CardTitle>
                     <CardDescription>
                       Your skill progression organized by expertise areas
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                       {skillTreeData?.branches.map((branch: any, index: number) => {
                         const branchNodes = skillTreeData.nodes.filter((n: any) => n.branch === branch.category.toLowerCase() || n.branch === branch.name.toLowerCase());
                         const completed = branchNodes.filter((n: any) => n.level >= 2).length;
                         const progress = branchNodes.length > 0 ? (completed / branchNodes.length) * 100 : 0;

                         return (
                           <div key={index} className="p-4 rounded-lg border bg-gradient-to-br from-background to-muted/20">
                             <div className="flex items-center justify-between mb-3">
                               <h4 className="font-semibold">{branch.name}</h4>
                               <Badge variant="outline">{completed}/{branchNodes.length}</Badge>
                             </div>
                             <Progress value={progress} className="h-2 mb-2" />
                             <p className="text-xs text-muted-foreground">
                               {Math.round(progress)}% complete
                             </p>
                           </div>
                         );
                       })}
                     </div>
                   </CardContent>
                 </Card>

                 {/* Interactive Skill Tree Visualization */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <TreeDeciduous className="w-5 h-5" />
                       Interactive Skill Tree
                     </CardTitle>
                     <CardDescription>
                       Click on skills to see details and prerequisites. Unlocked skills are ready to learn!
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     {skillTreeLoading ? (
                       <div className="flex items-center justify-center h-96">
                         <div className="spinner" />
                       </div>
                     ) : (
                       <div className="relative">
                         {/* Skill Tree Canvas */}
                         <div className="relative min-h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 overflow-hidden">
                           {/* Branch Labels */}
                           <div className="absolute top-4 left-4 space-y-2">
                             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                               <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                               Foundational
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                               <div className="w-3 h-3 rounded-full bg-green-500"></div>
                               Frontend
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                               <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                               Backend
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                               <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                               Advanced
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                               <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                               Specialized
                             </div>
                           </div>

                           {/* Skill Nodes */}
                           {skillTreeData?.nodes.map((node: any) => (
                             <motion.div
                               key={node.id}
                               className={cn(
                                 'absolute cursor-pointer transition-all duration-300 group',
                                 node.isLocked ? 'opacity-60' : 'hover:scale-110'
                               )}
                               style={{
                                 left: `${node.position.x}%`,
                                 top: `${node.position.y}%`,
                                 transform: 'translate(-50%, -50%)'
                               }}
                               onClick={() => setSelectedSkillNode(node)}
                               whileHover={{ scale: node.isLocked ? 1 : 1.1 }}
                               whileTap={{ scale: node.isLocked ? 1 : 0.95 }}
                             >
                               <div
                                 className={cn(
                                   'relative w-16 h-16 rounded-full flex items-center justify-center border-3 transition-all shadow-lg',
                                   selectedSkillNode?.id === node.id ? 'ring-4 ring-primary ring-opacity-50' : ''
                                 )}
                                 style={{
                                   borderColor: node.isLocked ? '#9CA3AF' : getBranchColor(node.branch),
                                   backgroundColor: node.isLocked ? '#F3F4F6' : `${getBranchColor(node.branch)}15`,
                                   boxShadow: node.isLocked ? '0 2px 8px rgba(0,0,0,0.1)' : `0 4px 20px ${getBranchColor(node.branch)}30`
                                 }}
                               >
                                 <span className="text-2xl">{node.icon}</span>
                                 {node.isLocked && (
                                   <Lock className="absolute -top-1 -right-1 w-5 h-5 text-muted-foreground bg-background rounded-full p-0.5" />
                                 )}
                                 {!node.isLocked && node.level >= 2 && (
                                   <CheckCircle className="absolute -top-1 -right-1 w-5 h-5 text-green-500 bg-background rounded-full" />
                                 )}
                                 {/* Skill Level Indicator */}
                                 <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                   <div className={cn(
                                     'w-6 h-3 rounded-full text-xs font-bold flex items-center justify-center text-white',
                                     node.level >= 3 ? 'bg-red-500' : node.level >= 2 ? 'bg-yellow-500' : 'bg-gray-400'
                                   )}>
                                     {node.level}
                                   </div>
                                 </div>
                               </div>
                               <p className={cn(
                                 'text-xs text-center mt-3 font-medium max-w-20 truncate',
                                 node.isLocked ? 'text-muted-foreground' : 'text-foreground'
                               )}>
                                 {node.skillName}
                               </p>
                             </motion.div>
                           ))}

                           {/* Connection Lines */}
                           <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                             {getSkillTreeConnections().map((conn: any, index: number) => (
                               <line
                                 key={index}
                                 x1={`${conn.from.x}%`}
                                 y1={`${conn.from.y}%`}
                                 x2={`${conn.to.x}%`}
                                 y2={`${conn.to.y}%`}
                                 stroke={conn.isLocked ? '#9CA3AF' : getBranchColor(conn.branch)}
                                 strokeWidth={conn.isLocked ? '1' : '2'}
                                 strokeDasharray={conn.isLocked ? '5,5' : undefined}
                                 opacity={conn.isLocked ? 0.4 : 0.8}
                                 markerEnd={conn.isLocked ? undefined : 'url(#arrowhead)'}
                               />
                             ))}
                             <defs>
                               <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                       refX="9" refY="3.5" orient="auto">
                                 <polygon points="0 0, 10 3.5, 0 7" fill={getBranchColor('default')} />
                               </marker>
                             </defs>
                           </svg>
                         </div>

                         {/* Skill Details Panel */}
                         {selectedSkillNode && (
                           <motion.div
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="mt-6 p-6 rounded-lg bg-gradient-to-r from-background to-muted/20 border"
                           >
                             <div className="flex items-start gap-4">
                               <div
                                 className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                                 style={{
                                   backgroundColor: `${getBranchColor(selectedSkillNode.branch)}20`,
                                   border: `2px solid ${getBranchColor(selectedSkillNode.branch)}`
                                 }}
                               >
                                 {selectedSkillNode.icon}
                               </div>
                               <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                   <h3 className="text-xl font-bold">{selectedSkillNode.skillName}</h3>
                                   <Badge
                                     className={cn(
                                       selectedSkillNode.level >= 3 ? 'bg-red-500' :
                                       selectedSkillNode.level >= 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                     )}
                                   >
                                     Level {selectedSkillNode.level}
                                   </Badge>
                                   {selectedSkillNode.isLocked ? (
                                     <Badge variant="outline" className="text-muted-foreground">
                                       <Lock className="w-3 h-3 mr-1" />
                                       Locked
                                     </Badge>
                                   ) : (
                                     <Badge className="bg-green-500">
                                       <Unlock className="w-3 h-3 mr-1" />
                                       Unlocked
                                     </Badge>
                                   )}
                                 </div>
                                 <p className="text-muted-foreground mb-4">{selectedSkillNode.description}</p>

                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                   <div className="text-center">
                                     <p className="text-2xl font-bold text-primary">{selectedSkillNode.xpPoints}</p>
                                     <p className="text-xs text-muted-foreground">XP Points</p>
                                   </div>
                                   <div className="text-center">
                                     <p className="text-2xl font-bold text-blue-500">{selectedSkillNode.credentials?.length || 0}</p>
                                     <p className="text-xs text-muted-foreground">Credentials</p>
                                   </div>
                                   <div className="text-center">
                                     <p className="text-2xl font-bold text-green-500">{selectedSkillNode.prerequisites?.length || 0}</p>
                                     <p className="text-xs text-muted-foreground">Prerequisites</p>
                                   </div>
                                   <div className="text-center">
                                     <p className="text-2xl font-bold text-purple-500">{selectedSkillNode.branch}</p>
                                     <p className="text-xs text-muted-foreground">Branch</p>
                                   </div>
                                 </div>

                                 {selectedSkillNode.prerequisites && selectedSkillNode.prerequisites.length > 0 && (
                                   <div className="mb-4">
                                     <h4 className="font-semibold mb-2 flex items-center gap-2">
                                       <ArrowRight className="w-4 h-4" />
                                       Prerequisites
                                     </h4>
                                     <div className="flex flex-wrap gap-2">
                                       {selectedSkillNode.prerequisites.map((prereqId: number) => {
                                         const prereqNode = skillTreeData.nodes.find((n: any) => n.id === prereqId);
                                         return prereqNode ? (
                                           <Badge key={prereqId} variant="outline" className="cursor-pointer hover:bg-accent">
                                             {prereqNode.icon} {prereqNode.skillName}
                                           </Badge>
                                         ) : null;
                                       })}
                                     </div>
                                   </div>
                                 )}

                                 {selectedSkillNode.credentials && selectedSkillNode.credentials.length > 0 && (
                                   <div className="mb-4">
                                     <h4 className="font-semibold mb-2 flex items-center gap-2">
                                       <Award className="w-4 h-4" />
                                       Related Credentials
                                     </h4>
                                     <div className="space-y-2">
                                       {selectedSkillNode.credentials.map((cred: any, idx: number) => (
                                         <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                           <CheckCircle className="w-4 h-4 text-green-500" />
                                           <span className="text-sm">{cred.title || 'Credential'}</span>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 <div className="flex gap-2">
                                   {selectedSkillNode.isLocked ? (
                                     <Button variant="outline" disabled>
                                       <Lock className="w-4 h-4 mr-2" />
                                       Complete Prerequisites First
                                     </Button>
                                   ) : (
                                     <>
                                       <Button>
                                         <BookOpen className="w-4 h-4 mr-2" />
                                         Start Learning
                                       </Button>
                                       <Button variant="outline">
                                         <Award className="w-4 h-4 mr-2" />
                                         View Credentials
                                       </Button>
                                     </>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </motion.div>
                         )}
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 {/* Skill Recommendations */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Lightbulb className="w-5 h-5" />
                       Next Skills to Unlock
                     </CardTitle>
                     <CardDescription>
                       Skills you can unlock by completing current prerequisites
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-3">
                       {skillTreeData?.nodes
                         .filter((node: any) => node.isLocked && node.prerequisites.every((prereqId: number) =>
                           skillTreeData.nodes.find((n: any) => n.id === prereqId)?.level >= 2
                         ))
                         .slice(0, 5)
                         .map((node: any) => (
                           <div key={node.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                                onClick={() => setSelectedSkillNode(node)}>
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                  style={{ backgroundColor: `${getBranchColor(node.branch)}20` }}>
                               {node.icon}
                             </div>
                             <div className="flex-1">
                               <h4 className="font-medium">{node.skillName}</h4>
                               <p className="text-sm text-muted-foreground">{node.description}</p>
                             </div>
                             <Badge variant="outline" className="text-orange-600">
                               <Zap className="w-3 h-3 mr-1" />
                               Ready to Unlock
                             </Badge>
                           </div>
                         ))}
                       {(() => {
                         const lockedNodes = skillTreeData?.nodes.filter((node: any) => node.isLocked) || [];
                         const readyToUnlock = lockedNodes.filter((node: any) =>
                           node.prerequisites.every((prereqId: number) =>
                             skillTreeData.nodes.find((n: any) => n.id === prereqId)?.level >= 2
                           )
                         );

                         if (lockedNodes.length === 0) {
                           return (
                             <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                               <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                               <h4 className="font-semibold">All Skills Completed!</h4>
                               <p className="text-sm text-muted-foreground">
                                 You have no locked skills left. Great progress!
                               </p>
                             </div>
                           );
                         }

                         if (readyToUnlock.length === 0) {
                           return (
                             <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                               <CheckCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                               <h4 className="font-semibold">No Skill Ready Yet</h4>
                               <p className="text-sm text-muted-foreground">
                                 Finish current prerequisites to unlock the next skill.
                               </p>
                             </div>
                           );
                         }

                         return null;
                       })()}
                     </div>
                   </CardContent>
                 </Card>
               </>
             ) : (
               <Card className="p-12 text-center">
                 <TreeDeciduous className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                 <h3 className="text-xl font-semibold mb-2">Select a Career Path First</h3>
                 <p className="text-muted-foreground mb-4">
                   Choose your career path to see your personalized skill tree and progression.
                 </p>
                 <Button onClick={() => document.querySelector('[value="career"]')?.dispatchEvent(new Event('click', { bubbles: true }))}>
                   Go to Career Path
                 </Button>
               </Card>
             )}
           </TabsContent>
           
         {/* Peer Comparison Tab */}
           <TabsContent value="peers" className="space-y-6">
            {selectedPath && peerComparison ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Peer Comparison
                    </CardTitle>
                    <CardDescription>
                      How you compare to other {getSelectedCareerPath()?.name} students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* XP Comparison */}
                      <div className="p-6 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Performance Score</h3>
                          <Badge className={peerComparison.xp.percentile >= 100 ? 'bg-green-500' : 'bg-yellow-500'}>
                            Top {100 - peerComparison.xp.percentile}%
                          </Badge>
                        </div>
                        <div className="flex items-end gap-4 mb-4">
                          <div>
                            <p className="text-3xl font-bold">{peerComparison.xp.user}</p>
                            <p className="text-sm text-muted-foreground">Your Score</p>
                          </div>
                          <div className="flex-1 border-b border-dashed mb-2" />
                          <div className="text-right">
                            <p className="text-3xl font-bold text-muted-foreground">{peerComparison.xp.peer}</p>
                            <p className="text-sm text-muted-foreground">Peer Avg</p>
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(peerComparison.xp.percentile, 100)} 
                          className={`h-2 ${peerComparison.xp.percentile >= 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'}`}
                        />
                      </div>

                      {/* Skills Comparison */}
                      <div className="p-6 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Skills</h3>
                          <Badge className={peerComparison.skills.percentile >= 100 ? 'bg-green-500' : 'bg-yellow-500'}>
                            Top {100 - peerComparison.skills.percentile}%
                          </Badge>
                        </div>
                        <div className="flex items-end gap-4 mb-4">
                          <div>
                            <p className="text-3xl font-bold">{peerComparison.skills.user}</p>
                            <p className="text-sm text-muted-foreground">Your Skills</p>
                          </div>
                          <div className="flex-1 border-b border-dashed mb-2" />
                          <div className="text-right">
                            <p className="text-3xl font-bold text-muted-foreground">{peerComparison.skills.peer}</p>
                            <p className="text-sm text-muted-foreground">Peer Avg</p>
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(peerComparison.skills.percentile, 100)} 
                          className={`h-2 ${peerComparison.skills.percentile >= 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'}`}
                        />
                      </div>

                      {/* Credentials Comparison */}
                      <div className="p-6 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Credentials</h3>
                          <Badge className={peerComparison.credentials.percentile >= 100 ? 'bg-green-500' : 'bg-yellow-500'}>
                            Top {100 - peerComparison.credentials.percentile}%
                          </Badge>
                        </div>
                        <div className="flex items-end gap-4 mb-4">
                          <div>
                            <p className="text-3xl font-bold">{peerComparison.credentials.user}</p>
                            <p className="text-sm text-muted-foreground">Your Credentials</p>
                          </div>
                          <div className="flex-1 border-b border-dashed mb-2" />
                          <div className="text-right">
                            <p className="text-3xl font-bold text-muted-foreground">{peerComparison.credentials.peer}</p>
                            <p className="text-sm text-muted-foreground">Peer Avg</p>
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(peerComparison.credentials.percentile, 100)} 
                          className={`h-2 ${peerComparison.credentials.percentile >= 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Industry Benchmark */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Industry Benchmark
                    </CardTitle>
                    <CardDescription>
                      Based on anonymized data from {getSelectedCareerPath()?.name} professionals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <span>Industry average XP for {getSelectedCareerPath()?.name}</span>
                        </div>
                        <span className="font-bold">{INDUSTRY_BENCHMARKS[selectedPath as keyof typeof INDUSTRY_BENCHMARKS]?.avgXP || 500} XP</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-5 h-5 text-green-600" />
                          <span>Average credentials to land first job</span>
                        </div>
                        <span className="font-bold">{INDUSTRY_BENCHMARKS[selectedPath as keyof typeof INDUSTRY_BENCHMARKS]?.avgCredentials || 4}+ credentials</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Career Path First</h3>
                <p className="text-muted-foreground mb-4">
                  Choose your career path to see how you compare with peers in your field.
                </p>
                <Button onClick={() => document.querySelector('[value="career"]')?.dispatchEvent(new Event('click', { bubbles: true }))}>
                  Go to Career Path
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
