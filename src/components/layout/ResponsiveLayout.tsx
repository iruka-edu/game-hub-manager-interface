'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Breakpoint } from '@/lib/responsive/breakpoints';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  actionBar?: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveLayout Component
 * 
 * Implements Progressive Disclosure architecture with three distinct layouts:
 * - Desktop: Multi-column with fixed sidebar
 * - Tablet: Single-column with collapsible sections
 * - Mobile: Single-column, one-focus design
 * 
 * Validates Requirements: 2.1, 3.1, 4.1
 */
export function ResponsiveLayout({
  children,
  sidebar,
  actionBar,
  className = ''
}: ResponsiveLayoutProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

  // Desktop Layout: Multi-column with fixed sidebar
  if (isDesktop) {
    return (
      <div className={`gh-layout-desktop ${className}`}>
        {sidebar && (
          <aside className="gh-sidebar-desktop">
            {sidebar}
          </aside>
        )}
        <main className="gh-main-content-desktop">
          {children}
          {actionBar && (
            <div className="gh-action-bar-desktop">
              {actionBar}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Tablet Layout: Single-column with accordion sections
  if (isTablet) {
    return (
      <div className={`gh-layout-tablet ${className}`}>
        {sidebar && (
          <div className="gh-sidebar-tablet">
            {sidebar}
          </div>
        )}
        <main className="gh-main-content-tablet">
          {children}
        </main>
        {actionBar && (
          <div className="gh-action-bar-tablet gh-sticky-bottom">
            {actionBar}
          </div>
        )}
      </div>
    );
  }

  // Mobile Layout: Single-column, one-focus design
  return (
    <div className={`gh-layout-mobile ${className}`}>
      <main className="gh-main-content-mobile">
        {children}
      </main>
      {actionBar && (
        <div className="gh-action-bar-mobile gh-sticky-bottom">
          {actionBar}
        </div>
      )}
    </div>
  );
}

/**
 * Layout Context Provider for child components to access current breakpoint
 */
interface LayoutContextValue {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const LayoutContext = React.createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const breakpointData = useBreakpoint();
  
  return (
    <LayoutContext.Provider value={breakpointData}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Responsive Container Component
 * Provides consistent spacing and max-width across breakpoints
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = 'full'
}: ResponsiveContainerProps) {
  const { breakpoint } = useBreakpoint();
  
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={`
      gh-responsive-container
      ${maxWidthClasses[maxWidth]}
      mx-auto
      px-4 sm:px-6 lg:px-8
      ${className}
    `}>
      {children}
    </div>
  );
}