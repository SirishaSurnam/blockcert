'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Award,
  TreeDeciduous,
  FileText,
  BarChart3,
  Trophy,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Wallet,
  Shield,
  Users,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

    const studentLinks = [
      { href: ROUTES.DASHBOARD.STUDENT, label: 'Dashboard', icon: Home },
      { href: ROUTES.CREDENTIALS, label: 'Credentials', icon: FileText },
      { href: ROUTES.ANALYTICS, label: 'Analytics', icon: BarChart3 },
      { label: 'Career Guidance', href: '/career-guidance', icon: Award },
      { href: ROUTES.ACHIEVEMENTS, label: 'Achievements', icon: Trophy },
      { href: ROUTES.MENTORSHIP, label: 'Mentorship', icon: Users },
      { href: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
    ];

  const facultyLinks = [
    { href: ROUTES.DASHBOARD.FACULTY, label: 'Dashboard', icon: Home },
    { href: ROUTES.CREDENTIALS, label: 'Credentials', icon: FileText },
    { href: ROUTES.ANALYTICS, label: 'Analytics', icon: BarChart3 },
    { href: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { href: ROUTES.DASHBOARD.ADMIN, label: 'Dashboard', icon: Home },
    { href: '/dashboard/admin/pending', label: 'Pending Users', icon: Users },
    { href: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const employerLinks = [
    { href: ROUTES.DASHBOARD.EMPLOYER, label: 'Dashboard', icon: Home },
    { href: ROUTES.VERIFY, label: 'Verify', icon: Shield },
    { href: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'student':
        return studentLinks;
      case 'faculty':
        return facultyLinks;
      case 'admin':
        return adminLinks;
      case 'employer':
        return employerLinks;
      default:
        return studentLinks;
    }
  };

  const links = getLinks();

  const handleLogoClick = () => {
    onClose(); // Close mobile sidebar if open
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-card border-r border-border',
          'transform transition-transform duration-300 ease-in-out',
          // On mobile: translate based on isOpen state
          // On desktop (lg:): always visible (translate-x-0)
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo - Click to go home */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2" onClick={handleLogoClick}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                BlockCert
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profile?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Top bar content (right side of header)
export function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-3">
      {/* Role Badge */}
      <Badge variant="outline" className="hidden sm:flex capitalize">
        {user?.role}
      </Badge>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">New Badge Earned!</p>
              <p className="text-xs text-muted-foreground">
                You received a Blockchain Developer badge
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Credential Verified</p>
              <p className="text-xs text-muted-foreground">
                Your React.js credential was approved
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-center text-primary">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Wallet */}
      {user?.walletAddress && (
        <Button variant="outline" size="sm" className="hidden md:flex gap-2">
          <Wallet className="w-4 h-4" />
          <span className="font-mono">
            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
          </span>
        </Button>
      )}

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profile?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Mobile menu button component for use in layout
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}

// Search bar component
export function SearchBar() {
  return (
    <div className="hidden md:flex items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search credentials, skills..."
          className="w-[300px] pl-10"
        />
      </div>
    </div>
  );
}