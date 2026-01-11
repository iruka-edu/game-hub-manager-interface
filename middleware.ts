import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';
import { getRequiredPermission } from '@/lib/page-permissions';
import { ROLE_PERMISSIONS, type Permission } from '@/lib/auth-rbac';
import type { Role } from '@/types/user-types';

/**
 * Protected route patterns - matching original Astro middleware
 */
const PROTECTED_PAGE_PATTERNS = ['/dashboard', '/console', '/admin'];
const PROTECTED_API_PATTERNS = [
  '/api/games',
  '/api/admin',
  '/api/debug',
  '/api/upload',
  '/api/notifications',
  '/api/audit-logs',
  '/api/users',
];

/**
 * API routes that require specific permissions
 */
const API_PERMISSION_MAP: Record<string, Permission> = {
  '/api/admin': 'system:admin',
  '/api/debug': 'system:admin',
  '/api/audit-logs': 'system:audit_view',
};

/**
 * Check if a path matches any of the patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path.startsWith(pattern));
}

/**
 * Check if user roles have a specific permission
 */
function checkPermission(roles: Role[], permission: Permission): boolean {
  return roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions && permissions.includes(permission);
  });
}

/**
 * Get required permission for an API route
 */
function getApiPermission(pathname: string): Permission | null {
  for (const [pattern, permission] of Object.entries(API_PERMISSION_MAP)) {
    if (pathname.startsWith(pattern)) {
      return permission;
    }
  }
  return null;
}

/**
 * Next.js middleware for session validation and route protection
 * Mirrors the behavior of the original Astro middleware
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtectedPage = matchesPattern(pathname, PROTECTED_PAGE_PATTERNS);
  const isProtectedApi = matchesPattern(pathname, PROTECTED_API_PATTERNS);

  if (!isProtectedPage && !isProtectedApi) {
    // Not a protected route, continue
    return NextResponse.next();
  }

  // Try to get session from cookie
  const token = request.cookies.get('iruka_session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    // Session invalid or expired
    if (isProtectedApi) {
      // Return 401 for API routes
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      // Clear the invalid session cookie
      response.cookies.set('iruka_session', '', {
        httpOnly: true,
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      });
      return response;
    } else {
      // Redirect to login for page routes with return URL
      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(
        new URL(`/login?redirect=${returnUrl}`, request.url)
      );
    }
  }

  const userRoles = (session.roles || []) as Role[];

  // For page routes, check page-level permissions
  if (isProtectedPage) {
    const requiredPermission = getRequiredPermission(pathname);

    // If specific permission is required, check it
    if (requiredPermission !== undefined && requiredPermission !== null) {
      const hasPermission = checkPermission(userRoles, requiredPermission);

      if (!hasPermission) {
        // User doesn't have permission - redirect to 403
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }

  // For API routes, check API-level permissions
  if (isProtectedApi) {
    const requiredPermission = getApiPermission(pathname);

    if (requiredPermission) {
      const hasPermission = checkPermission(userRoles, requiredPermission);

      if (!hasPermission) {
        // User doesn't have permission - return 403
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
  }

  // Attach user info to headers for downstream handlers
  const response = NextResponse.next();
  
  // Set user info in request headers for route handlers to access
  response.headers.set('x-user-id', session.userId);
  response.headers.set('x-user-email', session.email);
  response.headers.set('x-user-roles', JSON.stringify(session.roles));

  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    // Protected pages
    '/dashboard/:path*',
    '/console/:path*',
    '/admin/:path*',
    // Protected APIs
    '/api/games/:path*',
    '/api/admin/:path*',
    '/api/debug/:path*',
    '/api/upload/:path*',
    '/api/notifications/:path*',
    '/api/audit-logs/:path*',
    '/api/users/:path*',
  ],
};
