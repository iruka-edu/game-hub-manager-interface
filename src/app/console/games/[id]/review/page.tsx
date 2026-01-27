"use client";

import { Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGameDetail } from "@/features/games/hooks/useGames";
import { StatusChip } from "@/components/ui/StatusChip";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { QCReviewForm } from "@/features/games/components/QCReviewForm";

function QCReviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const versionId = searchParams.get("versionId");
  const router = useRouter();

  const { user, isLoading: sessionLoading } = useSession();
  const { data: game, isLoading: gameLoading } = useGameDetail(gameId);

  // Loading
  if (sessionLoading || gameLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Auth/Role Check
  const isQC = user?.roles?.includes("qc");
  const isAdmin = user?.roles?.includes("admin");

  if (!user || (!isQC && !isAdmin)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600 mt-2">
            Bạn không có quyền QC review game.
          </p>
          <Link
            href="/console"
            className="inline-block mt-4 text-sm text-red-600 hover:text-red-700 underline"
          >
            ← Quay về Console
          </Link>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-red-800 font-semibold">Game not found</h3>
          <Link
            href="/console/qc-inbox"
            className="text-red-600 underline mt-2 inline-block"
          >
            ← Back to QC Inbox
          </Link>
        </div>
      </div>
    );
  }

  // Mock version data (placeholder until API supports version details)
  const versionData = {
    // If URL has no versionId or invalid versionId, try to use game's last_version_id
    // But be careful: defaults to "v-latest" causes issues if backend demands UUID.
    // If we have game.last_version_id, use it. If not, we might be in trouble or need to handle "no version".
    // For now, let's prefer game.last_version_id if available.
    _id:
      versionId && versionId !== "v-latest"
        ? versionId
        : game.last_version_id || (game as any).version?.id || "",
    version: (game as any).version?.version || "1.0.0",
    status: "uploaded" as any, // Assumption so review is allowed
    buildSize: 0,
    selfQAChecklist: null,
    releaseNote: "",
    qaSummary: null,
    submittedAt: game.updated_at || new Date().toISOString(),
    createdAt: game.created_at || new Date().toISOString(),
    updatedAt: game.updated_at || new Date().toISOString(),
  };

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "QC Inbox", href: "/console/qc-inbox" },
    { label: game.title || game.game_id },
  ];

  const gameData = {
    _id: game.id,
    gameId: game.game_id,
    title: game.title || "",
    description: game.description || "",
    subject: "",
    grade: "",
    unit: "",
    gameType: "html5",
    thumbnailDesktop: game.meta_data?.thumbnail?.desktop || "",
    thumbnailMobile: game.meta_data?.thumbnail?.mobile || "",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">QC Review</h1>
              <StatusChip status={versionData.status} />
            </div>
            <h2 className="text-xl text-slate-700">
              {game.title || game.game_id}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Version {versionData.version}
            </p>
          </div>
          <Link
            href="/console/qc-inbox"
            className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50"
          >
            ← Back to Inbox
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {versionData._id ? (
            <QCReviewForm
              gameId={game.id}
              versionId={versionData._id}
              game={gameData}
              version={versionData}
              reviewerName={user.full_name || user.email || "QC"}
              userId={user.id}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h3 className="text-yellow-800 font-semibold">
                Không tìm thấy phiên bản để review
              </h3>
              <p className="text-yellow-700 mt-2">
                Game chưa có phiên bản nào được upload hoặc đang ở trạng thái
                nháp.
              </p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Game Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Môn học</dt>
                <dd className="text-slate-900">N/A</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Lớp</dt>
                <dd className="text-slate-900">N/A</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Người tạo</dt>
                <dd className="text-slate-900 truncate max-w-[150px]">
                  {game.owner_id}
                </dd>
              </div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Version Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Ngày upload</dt>
                <dd className="text-slate-900">
                  {new Date(versionData.submittedAt).toLocaleDateString(
                    "vi-VN",
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QCReviewPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <QCReviewContent />
    </Suspense>
  );
}
