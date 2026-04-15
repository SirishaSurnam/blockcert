'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi, credentialsApi } from '@/lib/api';
import { FacultyAnalytics, Credential } from '@/types';
import { formatRelativeTime, formatDateTime, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<FacultyAnalytics | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [searchAddress, setSearchAddress] = useState("");
  const [insights, setInsights] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    console.log('Faculty Dashboard - User info:', user);
    console.log('Faculty Dashboard - User role:', user?.role);
    console.log('Faculty Dashboard - User wallet:', user?.walletAddress);
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        analyticsApi.getFaculty(),
        credentialsApi.getPending(),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
       if (pendingRes.success && pendingRes.data) {
         // Add IPFS URL construction for credentials with IPFS hashes
         const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
         const pendingWithIpfsUrl = pendingRes.data.map(cred => ({
           ...cred,
           ipfsUrl: cred.ipfsHash 
             ? `${ipfsGateway}${cred.ipfsHash.replace('ipfs://', '')}` 
             : undefined
         }));
         setPendingCredentials(pendingWithIpfsUrl);
       }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (credentialId: string) => {
    setIsProcessing(true);
    try {
      const result = await credentialsApi.approve(credentialId);
      if (result.success) {
        setPendingCredentials(prev => prev.filter(c => c.id !== credentialId));
        // Analytics will be updated on next manual refresh
      } else {
        console.error('Failed to approve credential:', result.error);
        const errorMsg = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
        alert(`Failed to approve credential: ${errorMsg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve credential. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCredential || !rejectionReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await credentialsApi.reject(selectedCredential.id, rejectionReason);
      if (result.success) {
        setPendingCredentials(prev => prev.filter(c => c.id !== selectedCredential.id));
        setShowRejectDialog(false);
        setSelectedCredential(null);
        setRejectionReason('');
      } else {
        console.error('Failed to reject credential:', result.error);
        alert(`Failed to reject credential: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject credential. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  const fetchMentorshipInsights = async () => {
    if (!searchAddress || !searchAddress.startsWith('0x')) {
      alert("Please enter a valid wallet address starting with 0x");
      return;
    }

    setIsSearching(true);
    setInsights(null);

    try {
      // Call the backend route we created in the previous step
      const response = await axios.get(`/api/faculty/mentorship-insights/${searchAddress}`);
      
      if (response.data.success) {
        setInsights(response.data.data.mentorship_advice);
      } else {
        alert(response.data.error || "Failed to fetch AI insights.");
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      alert("Could not connect to AI Service. Showing manual advice.");
      // Optional: Set fallback advice here
      setInsights("Please review the student's portfolio manually.");
    } finally {
      setIsSearching(false);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">
              Review and validate student credentials
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/credentials">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                All Credentials
              </Button>
            </Link>
            <Link href="/badges">
              <Button variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Badges
              </Button>
            </Link>
            <Link href="/achievements">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Achievements
              </Button>
            </Link>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search credentials..." className="pl-10 w-64" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Pending Reviews',
              value: pendingCredentials.length,
              icon: Clock,
              color: 'from-yellow-500 to-orange-500',
              description: 'Awaiting your approval',
            },
            {
              title: 'Total Validations',
              value: analytics?.overview.totalValidations || 0,
              icon: FileText,
              color: 'from-blue-500 to-blue-600',
              description: 'All time',
            },
            {
              title: 'Students Supervised',
              value: analytics?.overview.studentsSupervised || 0,
              icon: Users,
              color: 'from-purple-500 to-purple-600',
              description: 'Under your guidance',
            },
            {
              title: 'Approval Rate',
              value: `${analytics?.performanceMetrics.approvalRate || 0}%`,
              icon: CheckCircle,
              color: 'from-green-500 to-green-600',
              description: 'Validated correctly',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="stat-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingCredentials.length})
            </TabsTrigger>
            <TabsTrigger value="validated" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Validated
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <FileText className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="mentorship" className="gap-2">
              <Users className="w-4 h-4" />
              AI Mentorship ({insights && <span className="ml-2 text-blue-500">Active</span>})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Credentials Pending Approval</CardTitle>
                <CardDescription>
                  Review student submissions and approve or reject them
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingCredentials.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-muted-foreground">
                      No pending credentials to review
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCredentials.map((cred, index) => (
                      <motion.div
                        key={cred.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{cred.title}</p>
                            <Badge variant="warning">Pending</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {cred.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cred.skills.map((skill, skillIndex) => (
                              <Badge key={`${skill}-${skillIndex}`} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Category: {cred.category}</span>
                            <span>Submitted: {formatRelativeTime(cred.issuedAt)}</span>
                          </div>
                          
                          {/* Credential Type Indicators */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {cred.documentData || cred.documentUrl || cred.ipfsHash || cred.documentIPFS ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                <FileText className="w-3 h-3 mr-1" />
                                Uploaded Document
                              </Badge>
                            ) : null}
                            {cred.verificationLink ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                <Eye className="w-3 h-3 mr-1" />
                                Verification Link
                              </Badge>
                            ) : null}
                            {cred.ipfsHash || cred.documentIPFS ? (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                IPFS Stored
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              // Handle different credential types with single button
                              if (cred.verificationLink) {
                                // Open verification link in new tab
                                window.open(cred.verificationLink, '_blank');
                              } else if ((cred.ipfsHash || cred.documentIPFS) && cred.status === 'verified') {
                                // Open IPFS document
                                const ipfsHash = (cred.ipfsHash || cred.documentIPFS || '').replace('ipfs://', '');
                                window.open(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, '_blank');
                              } else if (cred.documentData || cred.documentUrl) {
                                // Fetch document from backend API and open as blob
                                try {
                                  const result = await credentialsApi.getDocument(cred.id);
                                  if (result.success && result.blob) {
                                    const blobUrl = URL.createObjectURL(result.blob);
                                    const newWindow = window.open(blobUrl, '_blank');

                                    // Clean up the blob URL after some time to free memory
                                    if (newWindow) {
                                      setTimeout(() => {
                                        URL.revokeObjectURL(blobUrl);
                                      }, 30000); // 30 seconds
                                    }
                                  } else {
                                    alert(`Failed to load document: ${result.error || 'Unknown error'}`);
                                  }
                                } catch (error) {
                                  console.error('Document viewing error:', error);
                                  alert('Failed to load document. Please try again.');
                                }
                              } else {
                                // No document or link available
                                alert('No document or verification link available for this credential');
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View/Verify
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(cred.id)}
                            disabled={isProcessing}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedCredential(cred);
                              setShowRejectDialog(true);
                            }}
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validated">
            <Card>
              <CardHeader>
                <CardTitle>Validated Credentials</CardTitle>
                <CardDescription>Credentials you have approved</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-muted-foreground">
                  View your validation history in the analytics tab
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Validation Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Approval Rate</span>
                      <span className="text-sm font-medium">
                        {analytics?.performanceMetrics.approvalRate}%
                      </span>
                    </div>
                    <Progress value={Number(analytics?.performanceMetrics.approvalRate)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Revocation Rate</span>
                      <span className="text-sm font-medium">
                        {analytics?.performanceMetrics.revocationRate}%
                      </span>
                    </div>
                    <Progress value={Number(analytics?.performanceMetrics.revocationRate)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.skillDistribution.slice(0, 5).map((item) => (
                      <div key={item.skill} className="flex items-center justify-between">
                        <span className="text-sm">{item.skill}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mentorship">
            <div className="space-y-6">
              
              {/* 1. Search Section */}
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Student Guidance</CardTitle>
                  <CardDescription>
                    Enter a student's wallet address to generate personalized mentorship advice using Deep Learning.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="0x..." 
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        className="pl-10 font-mono"
                      />
                    </div>
                    <Button 
                      onClick={fetchMentorshipInsights}
                      disabled={isSearching || !searchAddress}
                      className="gradient-bg text-white"
                    >
                      {isSearching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Insights
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Insights Result Card */}
              {insights && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        AI Mentorship Advice
                      </CardTitle>
                      <CardDescription>
                        Generated using PyTorch Semantic Analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {/* Guidance Text */}
                      <div>
                        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">Guidance:</h4>
                        <p className="text-base text-gray-800 dark:text-gray-200">
                          {insights.guidance || "Student is progressing well."}
                        </p>
                      </div>

                      {/* Gap Analysis */}
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900">
                        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">Gap Analysis:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insights.gap_analysis || "No significant gaps detected."}
                        </p>
                      </div>

                      {/* Suggested Action (Faculty To-Do) */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-1">
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Faculty Action:</h4>
                            <p className="text-base font-medium text-blue-950 dark:text-blue-200">
                              {insights.suggested_action || "Review student's project and provide feedback."}
                            </p>
                          </div>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 3. Empty State / Fallback */}
              {!insights && !isSearching && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter an address above to see AI insights.</p>
                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Credential</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this credential.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              Reject Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}