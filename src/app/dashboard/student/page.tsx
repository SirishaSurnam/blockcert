'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  FileText,
  Clock,
  Shield,
  TrendingUp,
  Activity,
  Trophy,
  Target,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi, credentialsApi, badgesApi } from '@/lib/api';
import { StudentAnalytics, Credential, Badge as BadgeType } from '@/types';
import { formatRelativeTime, getTierFromScore, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.walletAddress) return;
    
    try {
      const address = user.walletAddress;
      const [analyticsRes, credsRes, badgesRes] = await Promise.all([
        analyticsApi.getStudent(),
        credentialsApi.getMyCredentials(),
        badgesApi.getByStudent(address),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
       if (credsRes.success && credsRes.data) {
         // Add IPFS URL construction for credentials with IPFS hashes
         const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
         const credentialsWithIpfsUrl = credsRes.data.map(cred => ({
           ...cred,
           ipfsUrl: cred.ipfsHash 
             ? `${ipfsGateway}${cred.ipfsHash.replace('ipfs://', '')}` 
             : undefined
         }));
         setCredentials(credentialsWithIpfsUrl.slice(0, 5));
       }
      if (badgesRes.success && badgesRes.data) {
        setBadges(badgesRes.data.slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your credential portfolio
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/credentials">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Submit Credential
              </Button>
            </Link>
            <Link href="/profile">
              <Button className="gradient-bg text-white">
                View Portfolio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Total Credentials',
              value: analytics?.overview.totalCredentials || 0,
              icon: FileText,
              color: 'from-blue-500 to-blue-600',
              change: '+2 this month',
            },
            {
              title: 'Verified',
              value: analytics?.overview.validatedCredentials || 0,
              icon: Shield,
              color: 'from-green-500 to-green-600',
              change: `${analytics?.overview.validatedCredentials || 0} on blockchain`,
            },
            {
              title: 'NFT Badges',
              value: analytics?.overview.totalBadges || 0,
              icon: Award,
              color: 'from-purple-500 to-purple-600',
              change: 'View all',
            },
            {
              title: 'Unique Skills',
              value: analytics?.overview.uniqueSkills || 0,
              icon: Target,
              color: 'from-orange-500 to-orange-600',
              change: 'Explore skill tree',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="stat-card hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance Score
                </CardTitle>
                <CardDescription>Your overall credential performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(analytics?.performanceScore || 0) * 3.51} 351`}
                        className="text-primary"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{analytics?.performanceScore || 0}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        style={{ backgroundColor: tier.color }}
                        className="text-white capitalize"
                      >
                        {tier.label} Tier
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your performance score is calculated based on verified credentials,
                      NFT badges, skill diversity, and endorsement count.
                    </p>
                    <div className="mt-4">
                      <Progress value={analytics?.performanceScore || 0} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Credentials */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Credentials</CardTitle>
                  <CardDescription>Your latest credential submissions</CardDescription>
                </div>
                <Link href="/credentials">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {credentials.map((cred, index) => {
                    const statusColor = getStatusColor(cred.status);
                    return (
                      <motion.div
                        key={cred.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg ${statusColor.bg} flex items-center justify-center`}>
                          {cred.status === 'verified' ? (
                            <CheckCircle className={`w-5 h-5 ${statusColor.text}`} />
                          ) : cred.status === 'rejected' ? (
                            <XCircle className={`w-5 h-5 ${statusColor.text}`} />
                          ) : (
                            <AlertCircle className={`w-5 h-5 ${statusColor.text}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cred.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {cred.skills.slice(0, 3).join(', ')}
                            {cred.skills.length > 3 && ` +${cred.skills.length - 3} more`}
                          </p>
                           {/* Verification Materials */}
                           {(cred.verificationLink || cred.documentUrl || cred.ipfsUrl) && (
                             <div className="flex items-center gap-2 mt-1">
                               {cred.verificationLink && (
                                 <a 
                                   href={cred.verificationLink} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                 >
                                   <Eye className="w-3 h-3" />
                                   Link
                                 </a>
                               )}
                               {cred.ipfsUrl && (
                                 <a 
                                   href={cred.ipfsUrl} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                 >
                                   <FileText className="w-3 h-3" />
                                   IPFS Doc
                                 </a>
                               )}
                               {cred.documentUrl && (
                                 <a 
                                   href={cred.documentUrl} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                 >
                                   <FileText className="w-3 h-3" />
                                   Doc
                                 </a>
                               )}
                             </div>
                           )}
                        </div>
                        <Badge variant={cred.status === 'verified' ? 'success' : cred.status === 'pending' ? 'warning' : 'destructive'}>
                          {cred.status}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Skill Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Top Skills</CardTitle>
                <CardDescription>Your most validated skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.skills.topSkills.map((skill, index) => (
                    <div key={skill.skill} className="flex items-center gap-4">
                      <div className="w-8 text-sm text-muted-foreground">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{skill.skill}</p>
                          <Badge variant="outline">{skill.level}</Badge>
                        </div>
                        <Progress value={(skill.count / 5) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* NFT Badges */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>NFT Badges</CardTitle>
                <Link href="/badges">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {badges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-xl border text-center hover:shadow-lg transition-shadow cursor-pointer"
                      style={{ borderColor: badge.color }}
                    >
                      <div
                        className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <p className="text-sm font-medium truncate">{badge.skillName}</p>
                      <p className="text-xs text-muted-foreground">Level {badge.level}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Achievements</CardTitle>
                <Link href="/achievements">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.milestones.filter(m => m.achieved).slice(0, 3).map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10"
                    >
                      <span className="text-2xl">{milestone.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{milestone.name}</p>
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {analytics?.nextMilestone && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium mb-2">Next Milestone</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{analytics.nextMilestone.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm">{analytics.nextMilestone.name}</p>
                          <Progress
                            value={(analytics.nextMilestone.progress / analytics.nextMilestone.requirement) * 100}
                            className="h-2 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'verified' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' :
                        activity.status === 'rejected' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}