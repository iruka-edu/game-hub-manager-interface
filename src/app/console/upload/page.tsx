"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";
import Link from "next/link";
import { ResponsiveUploadPage } from "@/features/upload/components/ResponsiveUploadPage";
import { uploadWithMetadata } from "@/features/games/api/gameMutations";
import type { UploadFormData } from "@/features/upload/components/ResponsiveUploadPage";

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();

  const handleUpload = async (data: UploadFormData) => {
    if (!data.files || data.files.length === 0) {
      throw new Error("No files selected");
    }

    setIsUploading(true);

    try {
      // Prepare form data for upload
      const formData = new FormData();
      formData.append("file", data.files[0]);
      formData.append(
        "gameData",
        JSON.stringify({
          gameId: data.gameId,
          title: data.title,
          description: data.description,
          version: data.version,
          subject: data.subject,
          grade: data.grade,
          gameType: data.gameType,
          lessonNo: data.lessonNo,
          unit: data.unit,
          textbook: data.textbook,
          theme_primary: data.theme_primary,
          theme_secondary: data.theme_secondary,
          context_tags: data.context_tags,
          difficulty_levels: data.difficulty_levels,
          thumbnailDesktop: data.thumbnailDesktop,
          thumbnailMobile: data.thumbnailMobile,
          priority: data.priority,
          tags: data.tags,
          skills: data.skills,
          themes: data.themes,
          linkGithub: data.linkGithub,
        }),
      );

      // Use external API via features
      await uploadWithMetadata(formData);

      console.log("Upload successful");

      // Navigate to my-games page after successful upload
      router.push("/console/my-games");
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (gameId: string) => {
    // TODO: Implement publish logic
    console.log("Publish game:", gameId);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (sessionLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
        </div>
      </div>
    );
  }

  const userRoles = user?.roles as any[];
  if (!isAuthenticated || !hasPermission(userRoles, PERMISSIONS.UPLOAD_GAME)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600 mt-2">Bạn không được quyền upload game.</p>
          <Link
            href="/console"
            className="inline-block mt-4 text-sm text-red-600 underline"
          >
            Quay về Console
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Game</h1>
          <p className="mt-2 text-gray-600">
            Upload your game files and provide metadata information
          </p>
        </div>

        <ResponsiveUploadPage
          onUpload={handleUpload}
          onPublish={handlePublish}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
