'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Wallet, Shield, Bell, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasRealWallet = (user as any)?.hasRealWallet || false;

  const copyWalletAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const connectWallet = async () => {
    if (!walletInput || walletInput.length !== 42 || !walletInput.startsWith('0x')) {
      setMessage({ type: 'error', text: 'Please enter a valid Ethereum address (42 characters starting with 0x)' });
      return;
    }

    setIsConnecting(true);
    setMessage(null);

    try {
      const response = await authApi.connectWallet(walletInput);
      
      if (response.success) {
        updateUser({ 
          walletAddress: walletInput.toLowerCase(),
          hasRealWallet: true 
        });
        setMessage({ type: 'success', text: 'Wallet connected successfully!' });
        setWalletInput('');
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to connect wallet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    setIsConnecting(true);
    setMessage(null);

    try {
      const response = await authApi.disconnectWallet();
      
      if (response.success && response.data) {
        updateUser({ 
          walletAddress: response.data.walletAddress,
          hasRealWallet: false 
        });
        setMessage({ type: 'success', text: 'Wallet disconnected. A new address has been generated.' });
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to disconnect wallet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          setWalletInput(accounts[0]);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to connect MetaMask' });
      }
    } else {
      setMessage({ type: 'error', text: 'MetaMask not installed. Please install MetaMask extension.' });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={user?.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={user?.lastName} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email} disabled />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Wallet Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Settings
            </CardTitle>
            <CardDescription>
              Manage your wallet for blockchain features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Wallet Display */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Wallet Address</p>
                  <code className="text-sm font-mono break-all">
                    {user?.walletAddress || 'No wallet'}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyWalletAddress}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasRealWallet ? (
                  <Badge className="bg-green-500">Real Wallet Connected</Badge>
                ) : (
                  <Badge variant="secondary">Auto-generated (Not a real wallet)</Badge>
                )}
              </div>
            </div>

            {/* Info Box */}
            {!hasRealWallet && (
              <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-yellow-600">About Your Wallet Address</p>
                    <p className="text-muted-foreground">
                      This is an auto-generated identifier for your account. It&apos;s unique to you but 
                      <strong> not a real blockchain wallet</strong>. To use blockchain features like 
                      receiving NFT badges or on-chain credentials, connect your MetaMask wallet below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                {message.text}
              </div>
            )}

            {/* Connect Real Wallet */}
            {!hasRealWallet ? (
              <div className="space-y-4">
                <Separator />
                <div className="space-y-3">
                  <Label>Connect Your Real Wallet</Label>
                  <p className="text-sm text-muted-foreground">
                    Enter your Ethereum wallet address or connect MetaMask to enable blockchain features.
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="0x..."
                      value={walletInput}
                      onChange={(e) => setWalletInput(e.target.value)}
                      className="font-mono"
                    />
                    <Button onClick={connectWallet} disabled={isConnecting}>
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={connectMetaMask}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect with MetaMask
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Connected Wallet</p>
                    <p className="text-sm text-muted-foreground">
                      You can receive NFT badges and on-chain credentials
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={disconnectWallet}
                    disabled={isConnecting}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your password
                </p>
              </div>
              <Button variant="outline">Update</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Badge className="bg-green-500">Enabled</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Browser push notifications
                </p>
              </div>
              <Badge variant="secondary">Disabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}