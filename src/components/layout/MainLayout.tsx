'use client';

import React, { ReactNode, useState } from 'react';
import { Sidebar, MobileMenuButton, TopBar } from './Navbar';
import { cn } from '@/lib/utils';
import { FloatingChatbot } from '@/components/chat/FloatingChatbot';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop: Static, Mobile: Fixed overlay */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex h-full items-center justify-between px-4">
            {/* Left side - Mobile menu button */}
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            
            {/* Right side - Top bar content */}
            <TopBar />
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('flex-1 p-6', className)}>
          {children}
        </main>
      </div>

      {/* Floating AI Chatbot */}
      <FloatingChatbot />
    </div>
  );
}