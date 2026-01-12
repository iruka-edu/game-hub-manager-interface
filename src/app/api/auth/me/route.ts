import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeaders } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Returns current user information from session
 * Migrated from: src/pages/api/auth/me.ts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
          avatar: user.avatar,
          teamIds: user.teamIds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth] Me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
