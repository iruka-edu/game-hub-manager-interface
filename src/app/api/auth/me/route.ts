import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Get current user information
 * Enhanced for mobile compatibility
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return user info without sensitive data
    return NextResponse.json(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        isActive: user.isActive,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[Auth] Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}