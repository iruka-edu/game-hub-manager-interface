import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserRepository } from "@/models/User";
import { verifySession } from "@/lib/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/users/:id/status
 * Update user active status (Admin, CTO, CEO only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check using cookies (more reliable than headers if Middleware is not configured for this path)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("iruka_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const currentUser = await userRepo.findById(session.userId);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !currentUser.roles.includes("admin") &&
      !currentUser.roles.includes("cto") &&
      !currentUser.roles.includes("ceo")
    ) {
      return NextResponse.json(
        {
          error: "Forbidden. Only Admin, CTO, and CEO can update user status.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent deactivating own account
    if (currentUser._id.toString() === id) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive boolean is required" },
        { status: 400 }
      );
    }

    const updatedUser = await userRepo.updateActiveStatus(id, isActive);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    console.error("[Users] Status update error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
