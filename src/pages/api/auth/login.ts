import type { APIRoute } from 'astro';
import { UserRepository } from '../../../models/User';
import { createSession, createSessionCookie } from '../../../lib/session';

/**
 * POST /api/auth/login
 * Login endpoint with email and password authentication
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user credentials
    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.verifyPassword(email.trim(), password);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return new Response(
        JSON.stringify({ error: 'Account is disabled. Please contact administrator.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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
