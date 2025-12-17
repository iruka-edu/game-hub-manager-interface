import type { APIRoute } from 'astro';
import { getUserFromRequest } from '../../../lib/session';

/**
 * GET /api/auth/me
 * Returns current user information from session
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
          avatar: user.avatar,
          teamIds: user.teamIds,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Auth] Me error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
