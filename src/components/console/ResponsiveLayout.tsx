'use client';

import { ReactNode } from 'react';
import { MobileNav } from './MobileNav';

interface ResponsiveLayoutProps {
  children: ReactNode;
  user: {
    name?: string;
    email: string;
    roles: string[];
  };
}

export function ResponsiveLayout({ children, user }: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Navigation */}
      <MobileNav user={user} />

      {/* Main Content */}
      <main className="w-full">
        {/* Container with responsive padding */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}