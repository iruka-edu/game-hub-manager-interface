import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/models/User';
import { createSession, createSessionCookie } from '@/lib/session';

/**
 * POST /api/auth/login
 * Login endpoint with email and password authentication
 * Migrated from: src/pages/api/auth/login.ts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify user credentials
    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.verifyPassword(email.trim(), password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Create session token
    const token = createSession(user);
    const cookie = createSessionCookie(token);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
