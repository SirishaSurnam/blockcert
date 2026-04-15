'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle,
  Shield,
  Hash,
  ExternalLink,
  Wallet,
  Calendar,
  Verified,
  Copy,
  QrCode,
  Search,
  SortAsc,
  SortDesc,
  Building,
  Link,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { verificationApi } from '@/lib/api';

interface Credential {
  id: string;
  title: string;
  description?: string;
  skills: string[];
  issuedAt: string;
  verified: boolean;
  status: string;
  issuerName?: string;
  issuerAddress?: string;
  blockchainHash?: string | null;
  blockNumber?: number | null;
  metadataURI?: string | null;
  category?: string;
  course?: string;
  grade?: string;
}

interface PublicProfileData {
  student: {
    name: string;
    walletAddress: string;
    bio?: string;
    department?: string;
    instituteName?: string | null;
  };
  credentials: Credential[];
  skills: Array<{
    skill: string;
    count: number;
    level: string;
  }>;
  statistics: {
    totalCredentials: number;
    uniqueSkills: number;
  };
  blockchain: {
    walletAddress: string;
    profileHash: string;
    transactionHash: string | null;
    verifiedAt: string;
  };
  profileQR?: string;
  profileUrl?: string;
}

type SortOption = 'newest' | 'oldest' | 'name';

export default function PublicProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const [address, setAddress] = useState<string>('');
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setAddress(resolved.address);
      if (resolved.address) {
        loadPublicProfile(resolved.address);
      }
    };
    resolveParams();
  }, [params]);

  const loadPublicProfile = async (addr: string) => {
    try {
      setIsLoading(true);
      const response = await verificationApi.getPublicProfile(addr);
      
      if (response.success && response.data) {
        setProfileData(response.data as unknown as PublicProfileData);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatHash = (hash: string | null) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter and sort credentials
  const filteredCredentials = useMemo(() => {
    if (!profileData?.credentials) return [];
    
    let creds = [...profileData.credentials];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      creds = creds.filter(c => 
        c.title?.toLowerCase().includes(query) ||
        c.issuerName?.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query)
      );
    }
    
    // Sort credentials
    switch (sortBy) {
      case 'newest':
        creds.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
        break;
      case 'oldest':
        creds.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());
        break;
      case 'name':
        creds.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
    }
    
    return creds;
  }, [profileData?.credentials, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full mx-auto mb-4"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-blue-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Profile Not Found
            </CardTitle>
            <CardDescription>
              The requested profile could not be found or is not publicly available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Please verify the wallet address and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, credentials, skills, statistics, blockchain } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Verification Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Blockchain Verified Profile
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
          <p className="text-muted-foreground">Verified credentials on blockchain</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader className="text-center pb-4">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                  {student.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription>
                {student.bio || 'BlockCert User'}
              </CardDescription>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                {student.department && (
                  <Badge variant="outline">
                    {student.department}
                  </Badge>
                )}
                {student.instituteName && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    <Building className="w-3 h-3 mr-1" />
                    {student.instituteName}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Wallet Address */}
              <div className="flex items-center justify-center gap-2 text-sm bg-gray-100 p-3 rounded-lg">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-gray-700">
                  {student.walletAddress?.slice(0, 10)}...{student.walletAddress?.slice(-8)}
                </span>
                <button
                  onClick={() => copyToClipboard(student.walletAddress)}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blockchain Verification Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                Blockchain Verification
              </CardTitle>
              <CardDescription>
                Cryptographic proof of credential authenticity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Hash */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Profile Hash</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm text-blue-600 font-mono break-all">
                    {blockchain.profileHash || 'N/A'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(blockchain.profileHash)}
                    className="text-gray-500 hover:text-blue-600 transition-colors shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Verification Status */}
              <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Verified</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(blockchain.verifiedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {statistics?.totalCredentials || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Verified Credentials</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-purple-600">
                  {statistics?.uniqueSkills || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Skills</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Search and Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-4"
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search credentials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing {filteredCredentials.length} of {credentials.length} credentials
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Verified Credentials
              </CardTitle>
              <CardDescription>
                {filteredCredentials.length} credential{filteredCredentials.length !== 1 ? 's' : ''} verified on blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCredentials.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No credentials match your search' : 'No verified credentials yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCredentials.map((credential, index) => (
                    <div
                      key={credential.id || index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                    >
                      {/* Header - Title and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <Verified className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-lg">{credential.title}</p>
                            <Badge variant="success" className="mt-1 bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {credential.description && (
                        <p className="text-sm text-muted-foreground mb-3 ml-13">{credential.description}</p>
                      )}

                      {/* Credential Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {/* Issuer */}
                        {credential.issuerName && (
                          <div className="bg-white p-2 rounded border">
                            <label className="text-xs text-muted-foreground">Issuing Authority</label>
                            <p className="text-sm">{credential.issuerName}</p>
                          </div>
                        )}

                        {/* Date Issued */}
                        <div className="bg-white p-2 rounded border">
                          <label className="text-xs text-muted-foreground">Date Issued</label>
                          <p className="text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(credential.issuedAt)}
                          </p>
                        </div>

                        {/* Category */}
                        {credential.category && (
                          <div className="bg-white p-2 rounded border">
                            <label className="text-xs text-muted-foreground">Category</label>
                            <p className="text-sm">{credential.category}</p>
                          </div>
                        )}

                        {/* Course/Grade */}
                        {(credential.course || credential.grade) && (
                          <div className="bg-white p-2 rounded border">
                            <label className="text-xs text-muted-foreground">Course/Grade</label>
                            <p className="text-sm">
                              {credential.course} {credential.grade && ` - ${credential.grade}`}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Blockchain & IPFS Details */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-3">
                          {/* Blockchain Indicator */}
                          {credential.blockchainHash && (
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full">
                              <Hash className="w-3 h-3 text-purple-600" />
                              <span className="text-xs text-purple-700">On Blockchain</span>
                              <code className="text-xs text-purple-600 font-mono">
                                {formatHash(credential.blockchainHash)}
                              </code>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${credential.blockchainHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {/* Block Number */}
                          {credential.blockNumber && (
                            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full">
                              <span className="text-xs text-blue-300">Block:</span>
                              <span className="text-xs text-blue-400 font-mono">#{credential.blockNumber.toLocaleString()}</span>
                            </div>
                          )}

                          {/* IPFS Indicator */}
                          {credential.metadataURI && (
                            <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1.5 rounded-full">
                              <Link className="w-3 h-3 text-cyan-400" />
                              <span className="text-xs text-cyan-300">IPFS</span>
                              <code className="text-xs text-cyan-400 font-mono max-w-[150px] truncate">
                                {credential.metadataURI.replace('ipfs://', '').slice(0, 20)}...
                              </code>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills */}
                      {credential.skills && credential.skills.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex flex-wrap gap-1">
                            {credential.skills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white-800/50 border-slate-700 backdrop-blur mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-black">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 15).map((s, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={`border-slate-600 text-slate-300 ${
                        s.level === 'Expert' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                        s.level === 'Advanced' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                        'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      }`}
                    >
                      {s.skill} ({s.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
            <QrCode className="w-4 h-4" />
            <span className="text-sm">Powered by BlockCert</span>
          </div>
          <p className="text-xs text-slate-600">
            This profile is cryptographically verified on the blockchain
          </p>
        </motion.div>
      </div>
    </div>
  );
}
