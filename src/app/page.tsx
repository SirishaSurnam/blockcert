'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Award,
  Shield,
  TreeDeciduous,
  FileText,
  BarChart3,
  Users,
  Wallet,
  QrCode,
  Trophy,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const features = [
    {
      icon: Award,
      title: 'NFT Skill Badges',
      description: 'Every validated skill becomes a unique NFT badge with metadata stored on blockchain.',
    },
    {
      icon: TreeDeciduous,
      title: 'Skill Tree Visualization',
      description: 'Interactive skill progression map showing your learning journey from Beginner to Expert.',
    },
    {
      icon: Shield,
      title: 'Public Verification',
      description: 'Anyone can verify credentials instantly using credential ID or QR code scan.',
    },
    {
      icon: QrCode,
      title: 'QR Code System',
      description: 'Each credential generates a unique QR code for easy sharing and verification.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track skill growth, validation speed, and compare with class averages.',
    },
    {
      icon: Trophy,
      title: 'Achievement System',
      description: 'Gamified milestones like "Rising Star" and "Certified Expert" to motivate learning.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Credentials Issued' },
    { value: '5,000+', label: 'Active Students' },
    { value: '500+', label: 'Partner Institutions' },
    { value: '99.9%', label: 'Verification Rate' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-50 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">BlockCert</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/verify" className="text-muted-foreground hover:text-foreground transition-colors">
              Verify
            </Link>
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-bg text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6" variant="secondary">
              🎓 Blockchain-Powered Credential Verification
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Skills,{' '}
              <span className="gradient-text">Verified Forever</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              A comprehensive blockchain-based system for verifying student competencies,
              issuing NFT badges, and building lifelong skill portfolios that employers trust.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gradient-bg text-white gap-2">
                  Start Building Your Profile
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/verify">
                <Button size="lg" variant="outline" gap-2>
                  <QrCode className="w-4 h-4" />
                  Verify a Credential
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-card p-8 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Card */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-6 text-center">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl font-bold">12</div>
                    <div className="text-sm opacity-80">NFT Badges Earned</div>
                  </CardContent>
                </Card>
                
                {/* Progress Card */}
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-6 text-center">
                    <TreeDeciduous className="w-12 h-12 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl font-bold">78%</div>
                    <div className="text-sm opacity-80">Skill Tree Progress</div>
                  </CardContent>
                </Card>
                
                {/* Credentials Card */}
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                  <CardContent className="p-6 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl font-bold">8</div>
                    <div className="text-sm opacity-80">Verified Credentials</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for{' '}
              <span className="gradient-text">Credential Verification</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for students, faculty, and employers to manage,
              verify, and showcase academic and professional achievements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple. Secure. <span className="gradient-text">Blockchain-Powered.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Upload Credential',
                description: 'Students submit certificates and achievements for verification.',
              },
              {
                step: '2',
                title: 'Faculty Verification',
                description: 'Faculty members review and approve credentials on blockchain.',
              },
              {
                step: '3',
                title: 'NFT Badge Minted',
                description: 'Approved credentials become NFT badges owned by students.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full gradient-bg text-white flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <Card className="pt-8 text-center">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-3xl mx-auto gradient-bg text-white border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Build Your Verified Skill Portfolio?
              </h2>
              <p className="text-white/80 mb-8">
                Join thousands of students who have already verified their credentials
                and earned NFT badges on the blockchain.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Create Free Account
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">BlockCert</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Blockchain-Powered Verification of Student Competencies and Records
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/verify" className="hover:text-foreground">Verify Credential</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Get Started</Link></li>
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">GDPR Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} BlockCert. A project by Surnam Sirisha & Paruchuri Mounika.
              <br />
              Geethanjali College of Engineering and Technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}