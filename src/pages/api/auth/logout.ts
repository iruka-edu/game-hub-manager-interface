import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/session';

/**
 * POST /api/auth/logout
 * Clears session cookie and redirects to login page
 */
export const POST: APIRoute = async () => {
  const cookie = clearSessionCookie();

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      'Location': '/login',
    },
  });
};

/**
 * GET /api/auth/logout
 * Alternative logout via GET for convenience
 */
export const GET: APIRoute = async () => {
  const cookie = clearSessionCookie();

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      'Location': '/login',
    },
  });
};
