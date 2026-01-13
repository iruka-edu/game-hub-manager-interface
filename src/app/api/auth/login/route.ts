import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/models/User';
import { createSession, createSessionCookie } from '@/lib/session';
import { forceReconnect } from '@/lib/mongodb';

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

    // Verify user credentials with retry logic for MongoDB connection issues
    let userRepo: UserRepository;
    let user: any;
    
    try {
      userRepo = await UserRepository.getInstance();
      user = await userRepo.verifyPassword(email.trim(), password);
    } catch (dbError) {
      // If it's a MongoDB connection error, try to reconnect once
      if (dbError instanceof Error && 
          (dbError.message.includes('Server selection timed out') || 
           dbError.message.includes('MongoServerSelectionError') ||
           dbError.message.includes('connection'))) {
        
        console.warn('[Auth] MongoDB connection issue detected, attempting reconnect...');
        
        try {
          await forceReconnect();
          userRepo = await UserRepository.getInstance();
          user = await userRepo.verifyPassword(email.trim(), password);
        } catch (retryError) {
          console.error('[Auth] MongoDB reconnection failed:', retryError);
          return NextResponse.json(
            { error: 'Database connection error. Please try again later.' },
            { status: 503 }
          );
        }
      } else {
        throw dbError; // Re-throw if it's not a connection error
      }
    }

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
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Server selection timed out') || 
          error.message.includes('MongoServerSelectionError')) {
        return NextResponse.json(
          { error: 'Database connection timeout. Please try again.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
