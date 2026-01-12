import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { AuditLogger } from "@/lib/audit";

/**
 * GET /api/audit-logs
 * Get audit logs (Admin and CTO only)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
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
    const user = await userRepo.findById(session.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Only Admin, CTO, and CEO can view audit logs
    if (
      !user.roles.includes("admin") &&
      !user.roles.includes("cto") &&
      !user.roles.includes("ceo")
    ) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin, CTO, and CEO can view audit logs." },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") || undefined;
    const targetId = searchParams.get("targetId") || undefined;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get logs
    const logs = await AuditLogger.getLogs(
      {
        userId,
        action: action as any,
        targetId,
      },
      limit,
      skip
    );

    // Get total count
    const total = await AuditLogger.getLogsCount({
      userId,
      action: action as any,
      targetId,
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Audit Logs API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
