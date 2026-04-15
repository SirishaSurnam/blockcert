'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { verificationApi } from '@/lib/api';
import { VerificationResult } from '@/types';
import { formatDateTime, truncateAddress, copyToClipboard } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function VerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const credentialId = params.id as string || searchParams.get('id') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (credentialId) {
      verifyCredential(credentialId);
    } else {
      setIsLoading(false);
    }
  }, [credentialId]);

  const verifyCredential = async (id: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await verificationApi.verifyCredential(id);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Credential not found');
      }
    } catch {
      setError('An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying credential...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-50 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">BlockCert</span>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {!credentialId && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Verify a Credential</CardTitle>
                <CardDescription>
                  Enter a credential ID to verify its authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  No credential ID provided. Please provide an ID in the URL or scan a QR code.
                </p>
              </CardContent>
            </Card>
          )}

          {error && !result && (
            <Card className="border-red-500">
              <CardContent className="p-12 text-center">
                <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

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
                    <div className="flex items-center gap-4">
                      {result.verified ? (
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                          <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-2xl">
                          {result.verified ? 'Credential Verified' : 'Credential Not Verified'}
                        </CardTitle>
                        <CardDescription className="text-base">
                          This credential is <strong>{result.status.currentStatus}</strong>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`text-base px-4 py-2 ${
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
                  {/* Credential */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Credential Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Credential Name</p>
                        <p className="text-lg font-semibold">{result.credential.courseName}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Grade Achieved</p>
                        <p className="text-lg font-semibold">{result.credential.grade || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Date Issued</p>
                        <p className="font-medium">{formatDateTime(result.credential.issueDate)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Validity</p>
                        <p className="font-medium">
                          {result.credential.validUntil 
                            ? `Valid until ${formatDateTime(result.credential.validUntil)}`
                            : 'Permanently Valid'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="font-semibold mb-3">Skills Verified</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.credential.skillsVerified.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-base px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Student */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Credential Holder</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-semibold">{result.student.name}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
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

                  {/* Issuer */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Issuing Authority</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Issuer</p>
                        <p className="font-semibold">{result.issuer.name}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="font-semibold">{result.issuer.institution || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain */}
                  {result.blockchain && (
                    <>
                      <Separator />
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold">Blockchain Verified</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Transaction Hash</p>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono">
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
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Block Number</p>
                            <p className="font-medium">#{result.blockchain.blockNumber?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* QR Code */}
                  <div className="flex justify-center pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">Scan to verify again</p>
                      <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                        <QRCodeSVG
                          value={result.verificationUrl}
                          size={180}
                          level="H"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Verified on {formatDateTime(result.verifiedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}