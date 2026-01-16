import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { GameRepository } from "@/models/Game";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

/**
 * POST /api/games/upload-url
 * Generate signed URL for direct client upload to GCS
 */
export async function POST(request: Request) {
  try {
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

    const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
    if (!hasRole("dev") && !hasRole("admin")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { gameId, version, mongoGameId, fileName } = await request.json();

    if (!gameId || !version || !fileName) {
      return NextResponse.json(
        { error: "gameId, version, and fileName are required" },
        { status: 400 }
      );
    }

    // Validate version format
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    if (!semverRegex.test(version)) {
      return NextResponse.json(
        { error: "Invalid version format. Use SemVer (X.Y.Z)" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!fileName.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Only ZIP files are allowed" },
        { status: 400 }
      );
    }

    // Check game exists and ownership
    const gameRepo = await GameRepository.getInstance();
    let game = mongoGameId
      ? await gameRepo.findById(mongoGameId)
      : await gameRepo.findByGameId(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!hasRole("admin") && game.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "You can only upload to your own games" },
        { status: 403 }
      );
    }

    // Generate signed URL for upload
    const storagePath = `games/${gameId}/${version}/${fileName}`;
    const file = bucket.file(storagePath);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: "application/zip",
    });

    return NextResponse.json({
      uploadUrl: url,
      storagePath: `games/${gameId}/${version}`,
      fileName,
    });
  } catch (error: any) {
    console.error("[Upload URL] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
