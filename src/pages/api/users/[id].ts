import type { APIRoute } from 'astro';
import { UserRepository } from '../../../models/User';

/**
 * PUT /api/users/:id
 * Update user information (Admin and CTO only)
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

    // Check permissions
    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Only Admin and CTO can update users.' }),
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
    const { name, email, roles } = body;

    const userRepo = await UserRepository.getInstance();

    // Update basic info if provided
    if (name || email) {
      await userRepo.updateInfo(id, { name, email });
    }

    // Update roles if provided
    if (roles) {
      await userRepo.updateRoles(id, roles);
    }

    const updatedUser = await userRepo.findById(id);
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
          roles: updatedUser.roles,
          isActive: updatedUser.isActive,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Users] Update error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user (Admin and CTO only)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const currentUser = locals.user;

    // Check authentication
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions - both admin and cto can delete
    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Only Admin and CTO can delete users.' }),
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

    // Prevent self-deletion
    if (currentUser._id.toString() === id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userRepo = await UserRepository.getInstance();
    const deleted = await userRepo.delete(id);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Users] Delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
