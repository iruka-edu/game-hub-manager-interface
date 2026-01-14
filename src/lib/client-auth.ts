'use client';

/**
 * Client-side authentication utilities
 * Enhanced for mobile compatibility
 */

/**
 * Check if user is authenticated by making a request to the server
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.warn('[ClientAuth] Auth check failed:', error);
    return false;
  }
}

/**
 * Logout user and redirect to login page
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.warn('[ClientAuth] Logout request failed:', error);
  }
  
  // Always redirect to login, even if logout request failed
  window.location.href = '/login';
}

/**
 * Redirect to login with current page as return URL
 */
export function redirectToLogin(): void {
  const currentPath = window.location.pathname + window.location.search;
  const returnUrl = encodeURIComponent(currentPath);
  window.location.href = `/login?redirect=${returnUrl}`;
}

/**
 * Get cookie value by name (client-side)
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Check if session cookie exists (basic check)
 */
export function hasSessionCookie(): boolean {
  return getCookie('iruka_session') !== null;
}