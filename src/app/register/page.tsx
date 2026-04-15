'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, Mail, Lock, User, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface Institute {
  id: string;
  name: string;
  code: string;
  domain: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, getDashboardRoute } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
    // Institute fields for admin
    instituteName: '',
    instituteCode: '',
    instituteDomain: '',
    // Institute selection for student/faculty
    instituteId: '',
    // College ID / Roll number for student/faculty
    collegeId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Fetch institutes when role changes to student or faculty
  useEffect(() => {
    const fetchInstitutes = async () => {
      if (formData.role === 'student' || formData.role === 'faculty') {
        setLoadingInstitutes(true);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          console.log('Fetching institutes from:', `${apiUrl}/institutes/public`);
          const response = await fetch(`${apiUrl}/institutes/public`);
          const data = await response.json();
          console.log('Institutes response:', data);
          if (data.success && data.data) {
            setInstitutes(data.data);
            console.log('Set institutes:', data.data);
          } else {
            console.error('Failed to fetch institutes:', data);
          }
        } catch (err) {
          console.error('Failed to fetch institutes:', err);
        } finally {
          setLoadingInstitutes(false);
        }
      } else {
        setInstitutes([]);
      }
    };

    fetchInstitutes();
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Validate institute for student/faculty
    if ((formData.role === 'student' || formData.role === 'faculty') && !formData.instituteId) {
      setError('Please select your institute');
      return;
    }

    // Validate college ID for student/faculty
    if ((formData.role === 'student' || formData.role === 'faculty') && !formData.collegeId) {
      setError(formData.role === 'student' ? 'Please enter your roll number' : 'Please enter your employee ID');
      return;
    }

    // Validate institute creation for admin
    if (formData.role === 'admin') {
      if (!formData.instituteName || !formData.instituteCode) {
        setError('Please provide your institute name and code');
        return;
      }
    }

    setIsLoading(true);

    try {
      const registerData: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      };

      // Add institute details based on role
      if (formData.role === 'admin') {
        registerData.instituteName = formData.instituteName;
        registerData.instituteCode = formData.instituteCode;
      } else if (formData.role === 'student' || formData.role === 'faculty') {
        registerData.instituteCode = formData.instituteId;  // Using college code
        registerData.collegeId = formData.collegeId;
      }

      const result = await register(registerData);

      // For pending users, backend returns success with requiresApproval flag
      const isPending = (result as any).requiresApproval;
      
      if (result.success) {
        // Check if registration requires approval - redirect to pending page
        if (isPending) {
          router.push('/pending-approval');
          return;
        }
        router.push(getDashboardRoute());
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show/hide institute fields based on role
  const showInstituteSelection = formData.role === 'student' || formData.role === 'faculty';
  const showInstituteCreation = formData.role === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-blue-50 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold gradient-text">BlockCert</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              {showInstituteCreation 
                ? 'Register your institute and start managing credentials'
                : 'Start building your verified credential portfolio'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value, instituteId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="admin">Institute Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* College Code for Student/Faculty */}
              {showInstituteSelection && (
                <div className="space-y-2">
                  <Label htmlFor="instituteCode">
                    College Code
                  </Label>
                  <Input
                    id="instituteCode"
                    placeholder={formData.role === 'student' ? 'e.g., GCET001' : 'e.g., GCET001'}
                    value={formData.instituteId}  // Using instituteId field for college code
                    onChange={(e) => setFormData({ ...formData, instituteId: e.target.value.toUpperCase() })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your institute admin for the college code
                  </p>
                </div>
              )}

              {/* College ID for Student/Faculty */}
              {showInstituteSelection && (
                <div className="space-y-2">
                  <Label htmlFor="collegeId">
                    {formData.role === 'student' ? 'Roll Number' : 'Employee ID'}
                  </Label>
                  <Input
                    id="collegeId"
                    placeholder={formData.role === 'student' ? 'e.g., 21CS001' : 'e.g., FAC001'}
                    value={formData.collegeId}
                    onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.role === 'student' 
                      ? 'Your university/college roll number'
                      : 'Your employee ID from the institute'}
                  </p>
                </div>
              )}

              {/* Institute Creation for Admin */}
              {showInstituteCreation && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Building2 className="w-5 h-5" />
                    <Label className="text-base font-medium">Institute Details</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instituteName">Institute Name</Label>
                    <Input
                      id="instituteName"
                      placeholder="e.g., MIT University"
                      value={formData.instituteName}
                      onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                      required={showInstituteCreation}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instituteCode">Institute Code</Label>
                      <Input
                        id="instituteCode"
                        placeholder="e.g., MITU"
                        value={formData.instituteCode}
                        onChange={(e) => setFormData({ ...formData, instituteCode: e.target.value.toUpperCase() })}
                        maxLength={10}
                        required={showInstituteCreation}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instituteDomain">Email Domain</Label>
                      <Input
                        id="instituteDomain"
                        placeholder="e.g., mit.edu"
                        value={formData.instituteDomain}
                        onChange={(e) => setFormData({ ...formData, instituteDomain: e.target.value.toLowerCase() })}
                        required={showInstituteCreation}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only users with emails ending in your domain can join your institute.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                You can connect your wallet later in Profile Settings to enable blockchain features.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full gradient-bg text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
