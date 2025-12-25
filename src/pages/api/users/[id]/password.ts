import type { APIRoute } from 'astro';
import { UserRepository } from '../../../../models/User';

/**
 * PUT /api/users/:id/password
 * Reset user password (Admin and CTO only)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const currentUser = locals.user;

    // Check authentication
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions - both admin and cto can reset passwords
    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Only Admin and CTO can reset passwords.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'New password is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userRepo = await UserRepository.getInstance();
    const updatedUser = await userRepo.updatePassword(id, newPassword);

    if (!updatedUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password updated successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Users] Password reset error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
