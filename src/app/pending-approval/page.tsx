'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, Clock, ArrowRight, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, isAuthenticated, login: authLogin } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  // If user is already authenticated and approved, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.status === 'approved') {
        router.push('/dashboard');
      }
    }
  }, [user, isAuthenticated, router]);

  // Check if user is now approved by trying to login
  const checkApprovalStatus = async () => {
    if (!email || !password) {
      setError('Enter your email and password to check status');
      return;
    }
    
    setCheckingStatus(true);
    setError('');
    
    try {
      const result = await authApi.login(email, password) as any;
      
      if (result.success) {
        // Login successful - check if approved
        const userData = result.data;
        const status = userData?.status || userData?.user?.status;
        
        if (status === 'approved') {
          // Login and redirect to dashboard
          await authLogin(email, password);
          router.push('/dashboard');
        } else {
          setError('Your account is still pending approval');
        }
      } else {
        // Login failed - might be pending
        if (result.requiresApproval) {
          setError('Your account is still pending approval');
        } else {
          setError(result.error || 'Unable to check status');
        }
      }
    } catch (err) {
      setError('Error checking status');
    } finally {
      setCheckingStatus(false);
      setLastCheck(new Date());
    }
  };

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
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Your account is pending approval from institute admin
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                What's Next?
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• The institute admin will review your registration</li>
                <li>• Use the form below to check if you're approved</li>
                <li>• After approval, you can access your dashboard</li>
              </ul>
            </div>

            {/* Login form to check status */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Check Approval Status:</p>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {lastCheck && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={checkApprovalStatus}
              className="w-full gradient-bg text-white"
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>

            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Login Page
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
