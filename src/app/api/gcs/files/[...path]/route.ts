import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getUserRepository } from "@/lib/repository-manager";
import { Storage } from "@google-cloud/storage";

// Initialize GCS client
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEY_FILE,
  credentials: process.env.GCLOUD_PRIVATE_KEY ? {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  } : undefined,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("iruka_session");

  if (!sessionCookie?.value) {
    return null;
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    return null;
  }

  const userRepo = await getUserRepository();
  return userRepo.findById(session.userId);
}

/**
 * DELETE /api/gcs/files/[...path]
 * Delete a file or directory from GCS
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can delete GCS files
    if (!currentUser.roles.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can delete GCS files." },
        { status: 403 }
      );
    }

    const { path } = await params;
    const filePath = path.join('/');

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Check if it's a directory (ends with /) or single file
    const isDirectory = filePath.endsWith('/') || !filePath.includes('.');

    if (isDirectory) {
      // Delete all files with this prefix
      const [files] = await bucket.getFiles({
        prefix: filePath.endsWith('/') ? filePath : filePath + '/',
      });

      if (files.length === 0) {
        return NextResponse.json(
          { error: "No files found with this prefix" },
          { status: 404 }
        );
      }

      // Delete all files
      const deletePromises = files.map(file => file.delete());
      await Promise.all(deletePromises);

      return NextResponse.json({
        success: true,
        message: `Deleted ${files.length} files from directory: ${filePath}`,
        deletedCount: files.length,
      });
    } else {
      // Delete single file
      const file = bucket.file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      await file.delete();

      return NextResponse.json({
        success: true,
        message: `Deleted file: ${filePath}`,
        deletedCount: 1,
      });
    }

  } catch (error) {
    console.error("[GCS] Delete file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}