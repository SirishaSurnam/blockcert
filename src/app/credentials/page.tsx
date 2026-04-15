'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { credentialsApi } from '@/lib/api';
import { Credential } from '@/types';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { SKILL_CATEGORIES } from '@/lib/constants';
import { API_BASE_URL } from '@/lib/constants';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const result = await credentialsApi.getMyCredentials();
      if (result.success && result.data) {
        setCredentials(result.data);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const skills = formData.get('skills') as string;
    const verificationLink = formData.get('verificationLink') as string;
    
    // Get file from input - need to access the input element directly
    const fileInput = e.currentTarget.elements.namedItem('document') as HTMLInputElement;
    const document = fileInput?.files?.[0];
    
    console.log('=== SUBMIT DEBUG ===');
    console.log('Title:', title);
    console.log('Verification Link:', verificationLink);
    console.log('File input:', fileInput);
    console.log('File:', document);
    console.log('File name:', document?.name);
    console.log('File size:', document?.size);
    
    // Validate: Title is required
    if (!title || title.trim() === '') {
      setValidationError('Credential title is required.');
      return;
    }
    
    // Validate: At least one of verification link or document is required
    if ((!verificationLink || verificationLink.trim() === '') && (!document || document.size === 0)) {
      setValidationError('Please provide either a verification link OR upload a document. Faculty needs something to verify your credential.');
      return;
    }
    
    // Validate URL format if provided
    if (verificationLink && verificationLink.trim() !== '') {
      try {
        new URL(verificationLink);
      } catch {
        setValidationError('Please enter a valid URL (e.g., https://coursera.org/verify/ABC123)');
        return;
      }
    }
    
    setIsSubmitting(true);

    try {
      // First create the credential
      const result = await credentialsApi.submitForVerification({
        title: title.trim(),
        description: description?.trim() || undefined,
        category: category || 'technical',
        skills: skills || undefined,
        verificationLink: verificationLink?.trim() || undefined,
      });
      
      console.log('Credential submit result:', result);
      console.log('result.data:', result.data);
      console.log('result.success:', result.success);
      
      if (result.success && result.data) {
        // Get the MongoDB _id from the response
        const credId = result.data._id || result.data.id;
        console.log('Credential created, ID:', credId);
        console.log('Has document:', !!document, 'size:', document?.size);
        
        // Upload document IMMEDIATELY after credential creation - await it
        if (document && document.size > 0) {
          console.log('Starting document upload for credential:', credId);
          try {
            const uploadResult = await credentialsApi.uploadDocument(credId, document);
            console.log('Document upload result:', uploadResult);
            
            if (!uploadResult.success) {
              setValidationError('Credential created but document upload failed: ' + uploadResult.error);
              return;
            } else {
              console.log('Document uploaded successfully:', uploadResult.data);
            }
          } catch (uploadErr) {
            console.error('Upload exception:', uploadErr);
            setValidationError('Credential created but document upload failed with error');
            return;
          }
        } else {
          console.log('No document to upload');
        }
        
        setShowAddDialog(false);
        loadCredentials();
      } else {
        setValidationError(result.error || 'Failed to submit credential');
      }
    } catch (error) {
      console.error('Error submitting credential:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
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
            <h1 className="text-3xl font-bold">Credentials</h1>
            <p className="text-muted-foreground">
              Manage your academic and skill credentials
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search credentials..." className="pl-10 w-64" />
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-bg text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Credential
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit New Credential</DialogTitle>
                  <DialogDescription>
                    Submit a credential for faculty verification. Provide a verification link or upload a document.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Credential Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Machine Learning Specialization"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief description about this credential (e.g., skills learned, projects completed)..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" defaultValue="technical">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills</Label>
                      <Input
                        id="skills"
                        name="skills"
                        placeholder="e.g., Python, ML, AI"
                      />
                    </div>
                  </div>

                  {/* Verification Section */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>Verification Proof (at least one required)</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="verificationLink" className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Verification Link
                      </Label>
                      <Input
                        id="verificationLink"
                        name="verificationLink"
                        type="url"
                        placeholder="https://coursera.org/verify/ABC123XYZ"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add certificate URL from Coursera, edX, Simplilearn, etc. Faculty can click to verify.
                      </p>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <span className="relative bg-muted/50 px-3 text-xs text-muted-foreground">OR</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Upload Document
                      </Label>
                      <Input
                        id="document"
                        name="document"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload certificate PDF or image (max 5MB)
                      </p>
                    </div>
                  </div>

                  {/* Validation Error */}
                  {validationError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {validationError}
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setValidationError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: credentials.length, color: 'bg-blue-500' },
            { label: 'Verified', value: credentials.filter(c => c.status === 'verified').length, color: 'bg-green-500' },
            { label: 'Pending', value: credentials.filter(c => c.status === 'pending').length, color: 'bg-yellow-500' },
            { label: 'Rejected', value: credentials.filter(c => c.status === 'rejected').length, color: 'bg-red-500' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credentials List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({credentials.length})</TabsTrigger>
            <TabsTrigger value="verified">
              Verified ({credentials.filter(c => c.status === 'verified').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({credentials.filter(c => c.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({credentials.filter(c => c.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {credentials.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No credentials yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Submit your first credential to get started
                    </p>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Credential
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                credentials.map((cred, index) => {
                  const statusColor = getStatusColor(cred.status);
                  return (
                    <motion.div
                      key={cred.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className={`p-3 rounded-lg ${statusColor.bg}`}>
                              {getStatusIcon(cred.status)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{cred.title}</h3>
                                <Badge
                                  variant={
                                    cred.status === 'verified' ? 'success' :
                                    cred.status === 'pending' ? 'warning' : 'destructive'
                                  }
                                >
                                  {cred.status}
                                </Badge>
                              </div>
                              
                              {cred.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {cred.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {cred.skills?.map((skill) => (
                                  <Badge key={skill} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <span>Category: {cred.category}</span>
                                <span>Issued: {formatDateTime(cred.issuedAt)}</span>
                                {cred.transactionHash && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    On Blockchain
                                  </span>
                                )}
                              </div>

                              {/* Document and Verification Link Indicators */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {cred.documentData || cred.documentUrl || cred.ipfsHash || cred.documentIPFS ? (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Uploaded Document
                                  </Badge>
                                ) : null}
                                {cred.verificationLink ? (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                    <LinkIcon className="w-3 h-3 mr-1" />
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

                              {/* Verification Link */}
                              {cred.verificationLink && (
                                <div className="mt-3 flex items-center gap-2">
                                  <LinkIcon className="w-4 h-4 text-blue-500" />
                                  <a
                                    href={cred.verificationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    View Verification Link
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}

                              {cred.rejectionReason && (
                                <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950 text-sm text-red-600">
                                  <strong>Rejection Reason:</strong> {cred.rejectionReason}
                                </div>
                              )}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="verified" className="mt-6">
            <div className="space-y-4">
              {credentials
                .filter(c => c.status === 'verified')
                .map((cred) => (
                  <Card key={cred.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{cred.title}</h3>
                          <p className="text-sm text-muted-foreground">{cred.category}</p>
                          {cred.verificationLink && (
                            <a href={cred.verificationLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              View verification link →
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {credentials
                .filter(c => c.status === 'pending')
                .map((cred) => (
                  <Card key={cred.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{cred.title}</h3>
                          <p className="text-sm text-muted-foreground">Awaiting faculty review</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {credentials
                .filter(c => c.status === 'rejected')
                .map((cred) => (
                  <Card key={cred.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{cred.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cred.rejectionReason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}