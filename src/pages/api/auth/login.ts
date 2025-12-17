import type { APIRoute } from 'astro';
import { UserRepository } from '../../../models/User';
import { createSession, createSessionCookie } from '../../../lib/session';

/**
 * POST /api/auth/login
 * Mock login endpoint for development - accepts email only
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findByEmail(email.trim());

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create session token
    const token = createSession(user);
    const cookie = createSessionCookie(token);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
