import type { APIRoute } from 'astro';
import { UserRepository } from '../../../../models/User';

/**
 * PATCH /api/users/:id/status
 * Enable/Disable a user account (Admin only - CTO cannot do this)
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const currentUser = locals.user;

    // Check authentication
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions - ONLY admin can disable/enable users
    // CTO is explicitly blocked from this action per requirements
    if (!currentUser.roles.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Only Admin can enable/disable user accounts.' }),
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
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'isActive must be a boolean value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prevent disabling own account
    if (currentUser._id.toString() === id) {
      return new Response(
        JSON.stringify({ error: 'Cannot disable your own account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userRepo = await UserRepository.getInstance();
    const updatedUser = await userRepo.updateActiveStatus(id, isActive);

    if (!updatedUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: updatedUser._id.toString(),
          email: updatedUser.email,
          name: updatedUser.name,
          isActive: updatedUser.isActive,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Users] Status update error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
