'use client';

import { useEffect, useState } from 'react';
import { checkAuthStatus, redirectToLogin, hasSessionCookie } from '@/lib/client-auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side authentication guard
 * Enhanced for mobile compatibility
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // First check if session cookie exists (quick check)
        if (!hasSessionCookie()) {
          if (mounted) {
            setIsAuthenticated(false);
            setIsChecking(false);
          }
          return;
        }

        // Then verify with server
        const isValid = await checkAuthStatus();
        
        if (mounted) {
          setIsAuthenticated(isValid);
          setIsChecking(false);
          
          // If not authenticated, redirect to login
          if (!isValid) {
            redirectToLogin();
          }
        }
      } catch (error) {
        console.error('[AuthGuard] Auth check failed:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsChecking(false);
          redirectToLogin();
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Show loading state while checking
  if (isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-600">Đang kiểm tra đăng nhập...</span>
        </div>
      </div>
    );
  }

  // Show children only if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - this shouldn't normally be reached due to redirect
  return fallback || null;
}