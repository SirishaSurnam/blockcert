'use client';

import React, { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  FileText,
  ExternalLink,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { verificationApi } from '@/lib/api';

interface PublicProfileData {
  student: {
    name: string;
    walletAddress: string;
    bio?: string;
    department?: string;
  };
  credentials: Array<{
    id: string;
    title: string;
    skills: string[];
    issuedAt: string;
    verified: boolean;
  }>;
  skills: Array<{
    skill: string;
    count: number;
    level: string;
  }>;
  statistics: {
    totalCredentials: number;
    uniqueSkills: number;
  };
}

export default function PublicProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = use(params);
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resolvedParams.address) {
      loadPublicProfile(resolvedParams.address);
    }
  }, [resolvedParams.address]);

  const loadPublicProfile = async (address: string) => {
    try {
      setIsLoading(true);
      const response = await verificationApi.getPublicProfile(address);
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Profile Not Found</CardTitle>
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

  const { student, credentials, skills, statistics } = profileData;
  const verifiedCredentials = credentials.filter(c => c.verified);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Blockchain Verified Profile
          </div>
        </motion.div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                {student.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{student.name}</CardTitle>
            <CardDescription>{student.bio || 'BlockCert User'}</CardDescription>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {student.department && (
                <Badge variant="outline">{student.department}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {student.walletAddress?.slice(0, 6)}...{student.walletAddress?.slice(-4)}
              </span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{statistics?.totalCredentials || 0}</div>
              <p className="text-sm text-muted-foreground">Credentials</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{statistics?.uniqueSkills || 0}</div>
              <p className="text-sm text-muted-foreground">Skills</p>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 10).map((s, idx) => (
                  <Badge key={idx} variant="secondary">
                    {s.skill} ({s.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Verified Credentials
            </CardTitle>
            <CardDescription>
              {verifiedCredentials.length} credential{verifiedCredentials.length !== 1 ? 's' : ''} verified on blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifiedCredentials.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No verified credentials yet
              </p>
            ) : (
              <div className="space-y-4">
                {verifiedCredentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{credential.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Issued: {new Date(credential.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>This profile is verified on the blockchain</p>
          <p className="mt-1">Powered by BlockCert</p>
        </div>
      </div>
    </div>
  );
}
