import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/src/models/User';
import { getUserFromHeaders } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/users/:id
 * Update user information (Admin and CTO only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getUserFromHeaders(request.headers);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return NextResponse.json(
        { error: 'Forbidden. Only Admin and CTO can update users.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, roles } = body;

    const userRepo = await UserRepository.getInstance();

    if (name || email) {
      await userRepo.updateInfo(id, { name, email });
    }

    if (roles) {
      await userRepo.updateRoles(id, roles);
    }

    const updatedUser = await userRepo.findById(id);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        roles: updatedUser.roles,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('[Users] Update error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/users/:id
 * Delete a user (Admin and CTO only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getUserFromHeaders(request.headers);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('cto')) {
      return NextResponse.json(
        { error: 'Forbidden. Only Admin and CTO can delete users.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (currentUser._id.toString() === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const userRepo = await UserRepository.getInstance();
    const deleted = await userRepo.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Users] Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
