import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";

/**
 * GET /api/users
 * List all users (Admin and CTO only)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check using cookies
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
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (
      !currentUser.roles.includes("admin") &&
      !currentUser.roles.includes("cto") &&
      !currentUser.roles.includes("ceo")
    ) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin, CTO, and CEO can view users." },
        { status: 403 }
      );
    }

    const users = await userRepo.findAll();

    const sanitizedUsers = users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error("[Users] List error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (Admin and CTO only)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check using cookies
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
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (
      !currentUser.roles.includes("admin") &&
      !currentUser.roles.includes("cto") &&
      !currentUser.roles.includes("ceo")
    ) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin, CTO, and CEO can create users." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, roles } = body;

    if (!email || !password || !name || !roles) {
      return NextResponse.json(
        { error: "Email, password, name, and roles are required" },
        { status: 400 }
      );
    }

    const newUser = await userRepo.create({
      email,
      password,
      name,
      roles,
      isActive: true,
      createdBy: currentUser._id,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          roles: newUser.roles,
          isActive: newUser.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Users] Create error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
