import type { APIRoute } from 'astro';
import { UserRepository } from '../../../models/User';

/**
 * GET /api/users
 * List all users (Admin and CTO only)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const currentUser = locals.user;

    // Check authentication
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions - only admin and cto can list users
    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Only Admin and CTO can view users.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userRepo = await UserRepository.getInstance();
    const users = await userRepo.findAll();

    // Remove password hashes from response
    const sanitizedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return new Response(
      JSON.stringify({ users: sanitizedUsers }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Users] List error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST /api/users
 * Create a new user (Admin and CTO only)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const currentUser = locals.user;

    // Check authentication
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions - only admin and cto can create users
    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Only Admin and CTO can create users.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { email, password, name, roles } = body;

    // Validate input
    if (!email || !password || !name || !roles) {
      return new Response(
        JSON.stringify({ error: 'Email, password, name, and roles are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userRepo = await UserRepository.getInstance();
    const newUser = await userRepo.create({
      email,
      password,
      name,
      roles,
      isActive: true,
      createdBy: currentUser._id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          roles: newUser.roles,
          isActive: newUser.isActive,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Users] Create error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
