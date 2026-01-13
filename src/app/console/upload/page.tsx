"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveUploadPage } from "@/features/upload/components/ResponsiveUploadPage";
import type { UploadFormData } from "@/features/upload/components/ResponsiveUploadPage";

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

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
        })
      );

      const response = await fetch("/api/games/upload-with-metadata", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      console.log("Upload successful:", result);

      // Navigate to game detail page
      if (result.game?._id) {
        router.push(`/console/games/${result.game._id}`);
      } else {
        router.push("/console/my-games");
      }
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
