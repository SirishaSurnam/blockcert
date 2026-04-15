'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Medal, Trophy, TrendingUp, Award, User, Star, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { leaderboardApi } from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  studentAddress: string;
  studentName?: string;
  totalScore: number;
  totalXP?: number;
  credentialsCount?: number;
  totalCredentials?: number;
  totalBadges?: number;
  credibilityScore?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  change?: number;
  department?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; totalXP: number; credibilityScore: number; percentile: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'credentials' | 'badges'>('all');

  useEffect(() => {
    loadLeaderboard();
    loadMyRank();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const result = await leaderboardApi.getAll(50);
      if (result.success && result.data) {
        // Transform data to match our interface
        const transformed = result.data.map((entry: LeaderboardEntry) => ({
          ...entry,
          studentName: entry.studentName || entry.studentAddress ? getShortAddress(entry.studentAddress) : 'Anonymous',
          totalXP: entry.totalXP || entry.totalScore,
          credentialsCount: entry.credentialsCount || entry.totalCredentials || 0,
        }));
        setLeaderboard(transformed);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyRank = async () => {
    try {
      const result = await leaderboardApi.getMyRank();
      if (result.success && result.data) {
        setMyRank(result.data);
      }
    } catch (error) {
      console.error('Error loading my rank:', error);
    }
  };

  const getShortAddress = (address: string) => {
    if (!address) return 'Anonymous';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTierColor = (tier?: string) => {
    const colors = {
      bronze: 'from-amber-700 to-amber-900',
      silver: 'from-gray-400 to-gray-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
      diamond: 'from-cyan-400 to-blue-500',
    };
    return colors[tier as keyof typeof colors] || 'from-gray-400 to-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  };

  const getRankChange = (change?: number) => {
    if (!change || change === 0) return <span className="text-muted-foreground">-</span>;
    if (change > 0) return <span className="text-green-500">▲{change}</span>;
    return <span className="text-red-500">▼{Math.abs(change)}</span>;
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              See how you rank against other students
            </p>
          </div>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Your Current Rank</p>
                  <p className="text-4xl font-bold">#{myRank.rank}</p>
                  <p className="text-sm opacity-80 mt-2">
                    Top {Math.round(myRank.percentile)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Total XP</p>
                  <p className="text-2xl font-bold">{myRank.totalXP.toLocaleString()}</p>
                  <p className="text-sm opacity-80 mt-2">
                    Credibility: {myRank.credibilityScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            All Rankings
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'credentials'
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            By Credentials
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'badges'
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            By Badges
          </button>
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Showing top {leaderboard.length} students based on credentials and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 px-2">Rank</th>
                    <th className="text-left pb-3 px-2">Student</th>
                    <th className="text-right pb-3 px-2">Total XP</th>
                    <th className="text-right pb-3 px-2">Credentials</th>
                    <th className="text-right pb-3 px-2">Badges</th>
                    <th className="text-right pb-3 px-2">Credibility</th>
                    <th className="text-right pb-3 px-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <motion.tr
                      key={entry.studentAddress || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`border-b hover:bg-muted/50 transition-colors ${
                        entry.rank <= 3 ? 'bg-yellow-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTierColor(entry.tier)} flex items-center justify-center text-white font-bold`}>
                            {entry.studentName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {entry.studentName || getShortAddress(entry.studentAddress)}
                            </p>
                            {entry.department && (
                              <p className="text-xs text-muted-foreground">{entry.department}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="font-bold text-lg">
                          {((entry.totalXP ?? entry.totalScore) ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Award className="w-4 h-4 text-blue-500" />
                          {entry.credentialsCount || entry.totalCredentials || 0}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-4 h-4 text-purple-500" />
                          {entry.totalBadges || 0}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {entry.credibilityScore ? (
                          <Badge className={`bg-gradient-to-r ${getTierColor(entry.tier)} text-white`}>
                            {Math.round(entry.credibilityScore)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right">
                        {getRankChange(entry.change)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No leaderboard data available yet.</p>
                <p className="text-sm text-muted-foreground">
                  Start earning credentials and badges to appear on the leaderboard!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
