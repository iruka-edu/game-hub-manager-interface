"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useAuth";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CloseButton } from "@/components/ui/CloseButton";
import { GameUploadForm } from "@/features/games/components/GameUploadForm";
import { UploadMetaForm } from "@/features/games/components/UploadMetaForm";
import { MetadataSummary } from "@/features/games/components/MetadataSummary";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";

function UploadPageContent() {
  const searchParams = useSearchParams();
  const { user, isLoading } = useSession();

  // Parse metadata from URL params
  const skills = searchParams.getAll("skill");
  const themes = searchParams.getAll("theme");

  const meta = {
    lop: searchParams.get("lop") || "",
    mon: searchParams.get("mon") || "",
    quyenSach: searchParams.get("quyenSach") || "",
    lessonNo: searchParams.get("lessonNo") || "",
    level: searchParams.get("level") || "",
    game: searchParams.get("game") || "",
    gameId: searchParams.get("gameId") || "",
    skills,
    themes,
    github: searchParams.get("github") || "",
  };

  // Check if metadata is ready for upload - require essential fields including difficulty and lessonNo
  const metaReady = Boolean(
    meta.lop &&
    meta.mon &&
    meta.game &&
    meta.gameId &&
    meta.github &&
    meta.level &&
    meta.lessonNo,
  );

  const gameMeta = {
    grade: meta.lop,
    subject: meta.mon,
    lessonNo: meta.lessonNo,
    backendGameId: meta.game,
    gameId: meta.gameId,
    level: meta.level,
    skills: meta.skills,
    themes: meta.themes,
    linkGithub: meta.github,
    quyenSach: meta.quyenSach,
  };

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "Upload Game" },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Middleware handles auth, but check just in case
  if (!user) {
    return null;
  }

  // Role check
  const userRoles = user.roles as any[];
  const canUpload = hasPermission(userRoles, PERMISSIONS.UPLOAD_GAME);

  if (!canUpload) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-700">
              Không có quyền truy cập
            </h2>
            <p className="text-red-600 mt-2">Bạn không có quyền upload game.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <CloseButton href="/console" title="Đóng" />
        </header>

        {metaReady ? (
          <>
            <MetadataSummary meta={meta} />
            <GameUploadForm meta={gameMeta} />
          </>
        ) : (
          <UploadMetaForm values={meta} />
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
              <div className="h-64 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}
