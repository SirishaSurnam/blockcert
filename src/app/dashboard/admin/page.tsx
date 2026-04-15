'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  Award,
  Shield,
  TrendingUp,
  Activity,
  AlertTriangle,
  BarChart3,
  GraduationCap,
  UserCheck,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { analyticsApi } from '@/lib/api';

interface InstituteAnalytics {
  overview: {
    totalStudents: number;
    totalFaculty: number;
    totalUsers: number;
    pendingStudents: number;
    pendingFaculty: number;
    totalPending: number;
    approvedStudents: number;
    approvedFaculty: number;
  };
  credentials: {
    total: number;
    verified: number;
    pending: number;
  };
  recentUsers: Array<{
    userId: string;
    email: string;
    role: string;
    status: string;
    firstName: string;
    lastName: string;
    collegeId?: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<InstituteAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'faculty'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await analyticsApi.getInstituteAnalytics();
      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const students = analytics?.recentUsers.filter(u => u.role === 'student') || [];
  const faculty = analytics?.recentUsers.filter(u => u.role === 'faculty') || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Institute Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your institute users and credentials
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Students</p>
                  <p className="text-3xl font-bold">{analytics?.overview.totalStudents || 0}</p>
                </div>
                <GraduationCap className="w-10 h-10 text-blue-200" />
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-blue-400/20 text-blue-100">
                  {analytics?.overview.approvedStudents || 0} Approved
                </Badge>
                <Badge className="bg-yellow-500/20 text-yellow-100">
                  {analytics?.overview.pendingStudents || 0} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Faculty */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Faculty</p>
                  <p className="text-3xl font-bold">{analytics?.overview.totalFaculty || 0}</p>
                </div>
                <Users className="w-10 h-10 text-purple-200" />
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-purple-400/20 text-purple-100">
                  {analytics?.overview.approvedFaculty || 0} Approved
                </Badge>
                <Badge className="bg-yellow-500/20 text-yellow-100">
                  {analytics?.overview.pendingFaculty || 0} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Users</p>
                  <p className="text-3xl font-bold">{analytics?.overview.totalUsers || 0}</p>
                </div>
                <UserCheck className="w-10 h-10 text-green-200" />
              </div>
              <div className="mt-4">
                <Badge variant="secondary" className="bg-green-400/20 text-green-100">
                  {(analytics?.overview.approvedStudents || 0) + (analytics?.overview.approvedFaculty || 0)} Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Credentials</p>
                  <p className="text-3xl font-bold">{analytics?.credentials.total || 0}</p>
                </div>
                <Award className="w-10 h-10 text-orange-200" />
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-orange-400/20 text-orange-100">
                  {analytics?.credentials.verified || 0} Verified
                </Badge>
                <Badge className="bg-yellow-500/20 text-yellow-100">
                  {analytics?.credentials.pending || 0} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Students ({analytics?.overview.totalStudents || 0})
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'faculty'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Faculty ({analytics?.overview.totalFaculty || 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {analytics?.recentUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {user.role === 'student' ? (
                          <GraduationCap className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Users className="w-5 h-5 text-purple-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.collegeId && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              ID: {user.collegeId}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Students
              </CardTitle>
              <CardDescription>All students in your institute</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No students registered yet</p>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.userId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <Badge variant={student.status === 'approved' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'faculty' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Faculty Members
              </CardTitle>
              <CardDescription>All faculty members in your institute</CardDescription>
            </CardHeader>
            <CardContent>
              {faculty.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No faculty members registered yet</p>
              ) : (
                <div className="space-y-2">
                  {faculty.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={member.status === 'approved' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
