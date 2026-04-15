'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Award,
  FileText,
  TreeDeciduous,
  ExternalLink,
  Share2,
  Download,
  QrCode,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi, badgesApi, credentialsApi, exportApi } from '@/lib/api';
import { StudentAnalytics, Badge as BadgeType, Credential } from '@/types';
import { getTierFromScore, truncateAddress } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, badgesRes, credsRes] = await Promise.all([
        analyticsApi.getStudent(),
        badgesApi.getByStudent(''),
        credentialsApi.getMyCredentials(),
      ]);

      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
      if (badgesRes.success && badgesRes.data) setBadges(badgesRes.data);
      if (credsRes.success && credsRes.data) setCredentials(credsRes.data);
    } catch (error) {
      console.error('Error loading profile:', error);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.profile?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold">{user?.fullName}</h1>
                <p className="text-muted-foreground">{user?.profile?.bio || 'Student'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                  <Badge style={{ backgroundColor: tier.color }} className="text-white">
                    {tier.label} Tier
                  </Badge>
                  <Badge variant="outline">{user?.profile?.department}</Badge>
                </div>
                {user?.walletAddress && (
                  <code className="block mt-2 text-sm text-muted-foreground">
                    {truncateAddress(user.walletAddress, 10, 8)}
                  </code>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button className="gradient-bg text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
                <Button variant="outline" onClick={async () => {
                  try {
                    await exportApi.downloadResumeAsHTML();
                  } catch (error) {
                    alert('Failed to download resume. Please try again.');
                  }
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Resume
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{analytics?.overview.totalCredentials || 0}</p>
              <p className="text-sm text-muted-foreground">Credentials</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{analytics?.overview.totalBadges || 0}</p>
              <p className="text-sm text-muted-foreground">NFT Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{analytics?.overview.uniqueSkills || 0}</p>
              <p className="text-sm text-muted-foreground">Skills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{analytics?.performanceScore || 0}</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              NFT Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.slice(0, 8).map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 rounded-lg border text-center hover:shadow-lg transition-shadow"
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreeDeciduous className="w-5 h-5" />
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.skills.topSkills.map((skill) => (
                <div key={skill.skill} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{skill.skill}</span>
                      <Badge variant="outline">{skill.level}</Badge>
                    </div>
                    <Progress value={(skill.count / 5) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {credentials.slice(0, 5).map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{cred.title}</p>
                    <p className="text-xs text-muted-foreground">{cred.category}</p>
                  </div>
                  <Badge
                    variant={
                      cred.status === 'verified' ? 'success' :
                      cred.status === 'pending' ? 'warning' : 'destructive'
                    }
                  >
                    {cred.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Share Profile
            </CardTitle>
            <CardDescription>
              Others can scan this QR to view your verified credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {user?.walletAddress ? (
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCodeSVG
                  value={`http://localhost:3000/public-profile/${user.walletAddress.toLowerCase()}`}
                  size={300}
                  level="H"
                  fgColor="#000000"
                  includeMargin={true}
                />
                <p className="text-xs text-center text-muted-foreground mt-2 font-mono">
                  {user.walletAddress.toLowerCase().slice(0, 10)}...{user.walletAddress.toLowerCase().slice(-8)}
                </p>
                <a 
                  href={`http://localhost:3000/public-profile/${user.walletAddress.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-2 block text-center"
                >
                  Open Public Profile Link
                </a>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Connect your wallet to generate QR code
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}