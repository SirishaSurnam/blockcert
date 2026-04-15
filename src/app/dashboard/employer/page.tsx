'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Shield,
  QrCode,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { verificationApi } from '@/lib/api';
import { VerificationResult } from '@/types';
import { formatDateTime, truncateAddress, copyToClipboard } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function EmployerPortal() {
  const [credentialId, setCredentialId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!credentialId.trim()) {
      setError('Please enter a credential ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await verificationApi.verifyCredential(credentialId);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Verification failed');
      }
    } catch {
      setError('An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Credential Verification</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of credentials instantly
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Verify Credential
            </CardTitle>
            <CardDescription>
              Enter a credential ID or scan a QR code to verify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credentialId">Credential ID</Label>
                <Input
                  id="credentialId"
                  placeholder="Enter credential ID..."
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletAddress">
                  Wallet Address <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="walletAddress"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleVerify}
                disabled={isLoading || !credentialId.trim()}
                className="gradient-bg text-white"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-4 h-4 mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Verify Credential
                  </>
                )}
              </Button>
              <Button variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border-2 ${
              result.status.statusColor === 'green' ? 'border-green-500' :
              result.status.statusColor === 'red' ? 'border-red-500' :
              'border-yellow-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.verified ? (
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle>
                        {result.verified ? 'Verified' : 'Not Verified'}
                      </CardTitle>
                      <CardDescription>
                        {result.status.currentStatus}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      result.status.statusColor === 'green' ? 'bg-green-500' :
                      result.status.statusColor === 'red' ? 'bg-red-500' :
                      'bg-yellow-500'
                    } text-white`}
                  >
                    {result.status.currentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Credential Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Credential Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Course/Credential Name</p>
                      <p className="font-medium">{result.credential.courseName}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="font-medium">{result.credential.grade || 'N/A'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{formatDateTime(result.credential.issueDate)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Valid Until</p>
                      <p className="font-medium">
                        {result.credential.validUntil ? formatDateTime(result.credential.validUntil) : 'No Expiry'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="font-semibold mb-2">Skills Verified</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.credential.skillsVerified.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Student Info */}
                <div>
                  <h3 className="font-semibold mb-3">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{result.student.name}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Wallet Address</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {truncateAddress(result.student.walletAddress, 10, 6)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(result.student.walletAddress)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Issuer Info */}
                <div>
                  <h3 className="font-semibold mb-3">Issuer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Issuer Name</p>
                      <p className="font-medium">{result.issuer.name}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Institution</p>
                      <p className="font-medium">{result.issuer.institution || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Blockchain Info */}
                {result.blockchain && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Blockchain Verification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Transaction Hash</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono truncate">
                              {truncateAddress(result.blockchain.transactionHash, 12, 8)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(result.blockchain!.transactionHash)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Block Number</p>
                          <p className="font-medium">#{result.blockchain.blockNumber?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* QR Code */}
                <div className="flex justify-center pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Share this verification</p>
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <QRCodeSVG
                        value={result.verificationUrl}
                        size={150}
                        level="H"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verified at {formatDateTime(result.verifiedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}