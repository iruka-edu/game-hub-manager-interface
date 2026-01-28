"use client";

import { Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGameDetail } from "@/features/games/hooks/useGames";
import { StatusChip } from "@/components/ui/StatusChip";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { GameDetailTabs } from "@/features/games/components/GameDetailTabs";
import { GameInfoSection } from "@/features/games/components/GameInfoSection";
import { SelfQAChecklist } from "@/features/games/components/SelfQAChecklist";
import { GameActions } from "@/features/games/components/GameActions";
import { WorkflowTimeline } from "@/features/games/components/WorkflowTimeline";

const extractName = (data: any): string => {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    return data.name || data.title || data.label || data.id || "";
  }
  return String(data);
};

const extractArrayNames = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(extractName);
  return [extractName(data)];
};

function GameDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tab = searchParams.get("tab") || "info";
  const errorParam = searchParams.get("error");
  const statusParam = searchParams.get("status");

  const { user, isLoading: sessionLoading } = useSession();
  const {
    data: game,
    isLoading: gameLoading,
    error: gameError,
  } = useGameDetail(id);

  const savedChecklist = game?.version?.build_data?.selfQAChecklist;

  const isSelfQaChecklistComplete = !!(
    savedChecklist?.testedDevices &&
    savedChecklist?.testedAudio &&
    savedChecklist?.gameplayComplete &&
    savedChecklist?.contentVerified
  );

  // Calculate completeness and status derived from game data
  const { completeness, isSelfQaComplete } = useMemo(() => {
    if (!game) return { completeness: 0, isSelfQaComplete: false };

    let score = 0;

    // Basic Info (20%)
    if (game.title && game.description) score += 20;

    // Edu Info (30%)
    const hasSubject = !!game.meta_data?.subject;
    const hasGrade = !!game.meta_data?.grade;
    if (hasSubject && hasGrade) score += 30;

    // Assets (20%)
    const hasThumb =
      !!game.meta_data?.thumbnail ||
      !!(game as any).thumbnailDesktop ||
      !!(game as any).thumbnailMobile;
    if (hasThumb) score += 20;

    // Classification (20%)
    const hasGameType = !!game.meta_data?.gameType;
    const hasSkills = game.meta_data?.skills && game.meta_data.skills.length > 0;
    if (hasGameType && hasSkills) score += 20;

    // Self QA (10%) - ✅ dùng checklist đã lưu thật
    const selfQaScore = isSelfQaChecklistComplete ? 10 : 0;
    score += selfQaScore;

    return {
      completeness: score,
      isSelfQaComplete: score >= 100, // hoặc: (score === 100)
    };
  }, [game, isSelfQaChecklistComplete]);

  // Loading state
  if (sessionLoading || gameLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (gameError || !game) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Không tìm thấy game
          </h2>
          <p className="text-red-600 mt-2">
            Game này không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/console/library"
            className="inline-block mt-4 text-sm text-red-600 hover:text-red-700 underline"
          >
            ← Quay về thư viện
          </Link>
        </div>
      </div>
    );
  }

  // Auth check (Middleware handles redirect, just check for safety)
  if (!user) {
    return null;
  }

  // Get current status from game data
  const currentStatus = (game as any).status ?? "draft";

  // Role checks
  const userRoles = user.roles as string[];
  const isOwner = game.owner_id === user.id;
  const isDev = userRoles.includes("dev");
  const isQC = userRoles.includes("qc");
  const isCTO = userRoles.includes("cto");
  const isCEO = userRoles.includes("ceo");
  const isAdmin = userRoles.includes("admin");

  // Action permissions
  const canEdit = isOwner || isAdmin;
  const canSubmitQC = isOwner || isDev || isAdmin; // Logic update
  const canReview = isQC || isAdmin;
  const canApprove = isCTO || isCEO || isAdmin;
  const canPublish = isAdmin;

  // Local SelfQA State Construction (Mock/Transform)
  // We try to extract from game if possible, otherwise empty default
  const selfQaData = {
    testedDevices: !!savedChecklist?.testedDevices,
    testedAudio: !!savedChecklist?.testedAudio,
    gameplayComplete: !!savedChecklist?.gameplayComplete,
    contentVerified: !!savedChecklist?.contentVerified,
    note: savedChecklist?.note ?? "",
  };

  const errorMessage =
    errorParam === "cannot_edit"
      ? `Không thể chỉnh sửa game khi trạng thái là "${
          statusParam || "không thể chỉnh sửa"
        }".`
      : "";

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "Thư viện", href: "/console/library" },
    { label: game.title || game.game_id },
  ];

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 100)
      return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (percentage >= 80) return "text-green-600 bg-green-50 border-green-100";
    if (percentage >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  // Transform game data for components
  const gameData = {
    _id: game.id,
    gameId: game.game_id,
    title: game.title || "",
    description: game.description || "",
    subject: extractName(game.meta_data?.subject),
    grade: extractName(
      game.meta_data?.grade || (game.meta_data as any)?.ageBand,
    ),
    unit: extractName(game.meta_data?.unit),
    gameType: extractName(game.meta_data?.gameType),
    teamId: game.team_id || "",
    thumbnailDesktop:
      game.meta_data?.thumbnail?.desktop || (game as any).thumbnailDesktop || "",
    thumbnailMobile: 
      game.meta_data?.thumbnail?.mobile || (game as any).thumbnailMobile || "",
    priority: game.meta_data?.priority || "",
    tags: game.meta_data?.tags || [],
    lesson: extractArrayNames(game.meta_data?.lesson),
    level: extractName(game.meta_data?.level),
    skills: extractArrayNames(game.meta_data?.skills),
    themes: extractArrayNames(game.meta_data?.themes),
    linkGithub: game.github_link || "",
    quyenSach: game.meta_data?.quyenSach || "",
    metadata: game.meta_data as any,
    // version: game?.version?.version,
    metadataCompleteness: completeness,
    createdAt: game.created_at || "",
    updatedAt: game.updated_at || "",
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header Section with Gradient Backdrop */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-8 mt-6 group">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-50/40 via-transparent to-sky-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/20 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {game.title || game.game_id}
                </h1>
                <StatusChip status={currentStatus} />
                {completeness >= 100 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Sẵn sàng QC
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-md font-mono text-slate-600 border border-slate-200">
                  {game.game_id}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  ID:{" "}
                  <span className="text-slate-600 select-all">{game.id}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  Chủ sở hữu:{" "}
                  <span className="text-indigo-600 font-medium">
                    {isOwner ? "Bạn" : (game as any).owner_name || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="lg:pr-6 lg:border-r border-slate-200 hidden xl:block">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Độ hoàn thiện
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${getCompletenessColor(completeness).split(" ")[0]}`}
                  >
                    {completeness}%
                  </span>
                </div>
              </div>

              <GameActions
                gameId={game.id}
                gameSlug={game.game_id}
                version={game.last_version_id || "1.0.0"}
                canEdit={canEdit}
                canSubmitQC={canSubmitQC}
                canReview={canReview}
                canApprove={canApprove}
                canPublish={canPublish}
                isSelfQaComplete={isSelfQaChecklistComplete}
                isLocked={currentStatus !== "draft"}
                isLive={!!game.live_version_id}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Phiên bản",
              value: "1.0.0",
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Môn học",
              value: extractName(game.meta_data?.subject) || "N/A",
              color: "bg-indigo-50 text-indigo-700",
            },
            {
              label: "Khối lớp",
              value:
                extractName(
                  game.meta_data?.grade || (game.meta_data as any)?.ageBand,
                ) || "N/A",
              color: "bg-sky-50 text-sky-700",
            },
            {
              label: "Cập nhật",
              value: game.updated_at
                ? new Date(game.updated_at).toLocaleDateString("vi-VN")
                : "N/A",
              color: "bg-slate-100 text-slate-700",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-100 hover:shadow-sm"
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-tight mb-1">
                {stat.label}
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Timeline - More Compact & Modern */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 overflow-x-auto shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Tiến trình phê duyệt
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Cập nhật lúc {new Date().toLocaleTimeString("vi-VN")}
            </span>
          </div>
          <WorkflowTimeline currentStatus={currentStatus} />
        </div>

        {/* Tabs */}
        <GameDetailTabs
          gameId={id}
          currentTab={tab}
          historyCount={0}
          qcReportsCount={0}
        />

        {/* Tab Content */}
        {tab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <GameInfoSection game={gameData} canEdit={canEdit} />
              <SelfQAChecklist
                gameId={id}
                version={game.version}
                selfQa={selfQaData}
                canEdit={canEdit}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Trạng thái hiện tại
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <StatusChip status={currentStatus} />
                </div>
                <p className="text-sm text-slate-600">
                  {currentStatus === "draft" &&
                    "Game đang ở trạng thái nháp. Dev có thể chỉnh sửa và gửi QC khi sẵn sàng."}
                  {currentStatus === "published" &&
                    "Game đã được xuất bản và học sinh có thể chơi."}
                </p>
              </div>

              {/* Version Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Phiên bản</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Version</dt>
                    <dd className="font-mono text-slate-900">1.0.0</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Cập nhật</dt>
                    <dd className="text-slate-900">
                      {game.updated_at
                        ? new Date(game.updated_at).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Thao tác</h3>
                <div className="space-y-2">
                  <Link
                    href={`/play/${id}`}
                    target="_blank"
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Chơi thử game
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/console/games/${id}/edit`}
                      className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 text-slate-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Chỉnh sửa thông tin
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Lịch sử thay đổi
            </h3>
            <p className="text-slate-500 text-sm">Chưa có lịch sử thay đổi.</p>
          </div>
        )}

        {tab === "qc" && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">QC Reports</h3>
            <p className="text-slate-500 text-sm">Chưa có báo cáo QC nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GameDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      }
    >
      <GameDetailContent />
    </Suspense>
  );
}
