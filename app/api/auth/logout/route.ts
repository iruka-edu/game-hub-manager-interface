import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/src/lib/session';

/**
 * POST /api/auth/logout
 * Clears session cookie and redirects to login page
 * Migrated from: src/pages/api/auth/logout.ts
 */
export async function POST() {
  const cookie = clearSessionCookie();

  return new NextResponse(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      'Location': '/login',
    },
  });
}

/**
 * GET /api/auth/logout
 * Alternative logout via GET for convenience
 * Migrated from: src/pages/api/auth/logout.ts
 */
export async function GET() {
  const cookie = clearSessionCookie();

  return new NextResponse(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      'Location': '/login',
    },
  });
}
