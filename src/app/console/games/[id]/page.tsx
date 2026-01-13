import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { QCReportRepository } from "@/models/QcReport";
import { GameHistoryService } from "@/lib/game-history";
import { VersionStateMachine } from "@/lib/version-state-machine";
import { StatusChip } from "@/components/ui/StatusChip";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { GameDetailTabs } from "@/features/games/components/GameDetailTabs";
import { GameInfoSection } from "@/features/games/components/GameInfoSection";
import { SelfQAChecklist } from "@/features/games/components/SelfQAChecklist";
import { GameActions } from "@/features/games/components/GameActions";
import { WorkflowTimeline } from "@/features/games/components/WorkflowTimeline";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; error?: string; status?: string }>;
}

export const dynamic = "force-dynamic";

export default async function GameDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const {
    tab = "info",
    error: errorParam,
    status: statusParam,
  } = await searchParams;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("iruka_session");

  if (!sessionCookie?.value) {
    redirect("/login");
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect("/login");
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);

  if (!user) {
    redirect("/login");
  }

  // Get game
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const qcRepo = await QCReportRepository.getInstance();

  const game = await gameRepo.findById(id);
  if (!game) {
    notFound();
  }

  // Get latest version
  const latestVersion = game.latestVersionId
    ? await versionRepo.findById(game.latestVersionId.toString())
    : null;

  const currentStatus = latestVersion?.status || "draft";
  const selfQa = latestVersion?.selfQAChecklist || {
    testedDevices: false,
    testedAudio: false,
    gameplayComplete: false,
    contentVerified: false,
    note: "",
  };

  // Get owner info
  const owner = await userRepo.findById(game.ownerId);
  const ownerName = owner?.name || owner?.email || "Unknown";

  // Get last code updater info if exists
  let lastCodeUpdaterName: string | null = null;
  let isRecentCodeUpdate = false;
  if (latestVersion?.lastCodeUpdateBy) {
    const updater = await userRepo.findById(
      latestVersion.lastCodeUpdateBy.toString()
    );
    lastCodeUpdaterName = updater?.name || updater?.email || "Unknown";

    // Check if update was in last 24 hours
    if (latestVersion.lastCodeUpdateAt) {
      const hoursSinceUpdate =
        (Date.now() - latestVersion.lastCodeUpdateAt.getTime()) /
        (1000 * 60 * 60);
      isRecentCodeUpdate = hoursSinceUpdate < 24;
    }
  }

  // Get history and QC reports
  const history = await GameHistoryService.getHistory(id);
  const qcReports = await qcRepo.findByGameId(id);

  // Role checks
  const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
  const isOwner = game.ownerId === user._id.toString();
  const isDev = hasRole("dev");
  const isQC = hasRole("qc");
  const isCTO = hasRole("cto");
  const isCEO = hasRole("ceo");
  const isAdmin = hasRole("admin");

  // Action permissions
  const canEdit = isOwner && ["draft", "qc_failed"].includes(currentStatus);
  const canSubmitQC = isOwner && ["draft", "qc_failed"].includes(currentStatus);
  const canReview = (isQC || isAdmin) && currentStatus === "uploaded";
  const canApprove =
    (isCTO || isCEO || isAdmin) && currentStatus === "qc_passed";
  const canPublish = isAdmin && currentStatus === "approved";

  // Check if Self-QA is complete
  const stateMachine = await VersionStateMachine.getInstance();
  const isSelfQaComplete = stateMachine.validateSelfQA(selfQa);
  const needsSelfQaWarning = canSubmitQC && !isSelfQaComplete;

  // Error handling
  let errorMessage = "";
  if (errorParam === "cannot_edit") {
    const statusText =
      statusParam === "uploaded"
        ? "đang chờ QC"
        : statusParam === "qc_processing"
        ? "đang được QC kiểm tra"
        : statusParam === "qc_passed"
        ? "đã qua QC"
        : statusParam === "approved"
        ? "đã được duyệt"
        : statusParam === "published"
        ? "đã xuất bản"
        : statusParam === "archived"
        ? "đã lưu trữ"
        : "không thể chỉnh sửa";
    errorMessage = `Không thể chỉnh sửa game khi trạng thái là "${statusText}". Chỉ có thể chỉnh sửa khi game ở trạng thái "nháp" hoặc "QC không đạt".`;
  }

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "Thư viện", href: "/console/library" },
    { label: game.title || game.gameId },
  ];

  // Serialize data for client components
  const gameData = {
    _id: game._id.toString(),
    gameId: game.gameId,
    title: game.title,
    description: game.description,
    subject: game.subject,
    grade: game.grade,
    unit: game.unit,
    gameType: game.gameType,
    teamId: game.teamId,
    thumbnailDesktop: game.thumbnailDesktop,
    thumbnailMobile: game.thumbnailMobile,
    priority: game.priority,
    tags: game.tags,
    lesson: game.lesson,
    level: game.level,
    skills: game.skills,
    themes: game.themes,
    linkGithub: game.linkGithub,
    quyenSach: game.quyenSach,
    metadata: game.metadata,
    metadataCompleteness: game.metadataCompleteness,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };

  const versionData = latestVersion
    ? {
        _id: latestVersion._id.toString(),
        version: latestVersion.version,
        status: latestVersion.status,
        updatedAt: latestVersion.updatedAt.toISOString(),
        lastCodeUpdateAt: latestVersion.lastCodeUpdateAt?.toISOString(),
        lastCodeUpdateBy: latestVersion.lastCodeUpdateBy?.toString(),
      }
    : null;

  return (
    <div className="p-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-red-800">
              Không thể thực hiện thao tác
            </h4>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {game.title || game.gameId}
            </h1>
            <StatusChip status={currentStatus} />
          </div>
          <p className="text-slate-500">{game.gameId}</p>
          <p className="text-sm text-slate-400 mt-1">
            Người phụ trách: {ownerName}
            {isOwner && <span className="text-indigo-600"> (bạn)</span>}
          </p>
        </div>

        <GameActions
          gameId={id}
          gameSlug={game.gameId}
          version={latestVersion?.version}
          canEdit={canEdit}
          canSubmitQC={canSubmitQC}
          canReview={canReview}
          canApprove={canApprove}
          canPublish={canPublish}
          isSelfQaComplete={isSelfQaComplete}
        />
      </div>

      {/* Workflow Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Tiến trình phê duyệt
        </h3>
        <WorkflowTimeline currentStatus={currentStatus} />
      </div>

      {/* Recent Code Update Alert */}
      {isRecentCodeUpdate && latestVersion?.lastCodeUpdateAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <span>Code mới vừa được upload</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {new Date(latestVersion.lastCodeUpdateAt).toLocaleString(
                  "vi-VN"
                )}
              </span>
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              {lastCodeUpdaterName && (
                <>
                  <strong>{lastCodeUpdaterName}</strong> đã upload file ZIP mới
                  thay thế code cũ.
                </>
              )}
              {!lastCodeUpdaterName &&
                "File ZIP mới đã được upload thay thế code cũ."}
              {currentStatus === "qc_failed" && (
                <> Vui lòng kiểm tra Self-QA và gửi lại cho QC.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Self-QA Warning */}
      {needsSelfQaWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-500 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-amber-800">
              Self-QA chưa hoàn tất
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Bạn cần tích chọn và lưu tất cả mục trong checklist Self-QA bên
              dưới trước khi có thể gửi cho QC kiểm tra.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <GameDetailTabs
        gameId={id}
        currentTab={tab}
        historyCount={history.length}
        qcReportsCount={qcReports.length}
      />

      {/* Tab Content */}
      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <GameInfoSection game={gameData} canEdit={canEdit} />
            <SelfQAChecklist
              gameId={id}
              versionId={latestVersion?._id.toString()}
              selfQa={selfQa}
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
                {currentStatus === "uploaded" &&
                  "Game đang chờ QC kiểm tra chất lượng."}
                {currentStatus === "qc_processing" &&
                  "QC đang tiến hành kiểm tra game này."}
                {currentStatus === "qc_passed" &&
                  "Game đã qua QC và đang chờ CTO/CEO phê duyệt."}
                {currentStatus === "qc_failed" &&
                  "Game cần được Dev chỉnh sửa theo feedback của QC."}
                {currentStatus === "approved" &&
                  "Game đã được duyệt và đang chờ Admin xuất bản."}
                {currentStatus === "published" &&
                  "Game đã được xuất bản và học sinh có thể chơi."}
                {currentStatus === "archived" && "Game đã bị ngừng hiển thị."}
              </p>
            </div>

            {/* Version Info */}
            {versionData && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Phiên bản</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Version</dt>
                    <dd className="font-mono text-slate-900">
                      {versionData.version}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Cập nhật</dt>
                    <dd className="text-slate-900">
                      {new Date(versionData.updatedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </dd>
                  </div>
                  {versionData.lastCodeUpdateAt && (
                    <>
                      <div className="border-t border-slate-100 pt-3">
                        <dt className="text-slate-500 mb-1">Upload code mới</dt>
                        <dd className="text-slate-900 font-medium">
                          {new Date(
                            versionData.lastCodeUpdateAt
                          ).toLocaleString("vi-VN")}
                        </dd>
                      </div>
                      {lastCodeUpdaterName && (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Người upload</dt>
                          <dd className="text-slate-900">
                            {lastCodeUpdaterName}
                          </dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </div>
            )}

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
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex gap-4 pb-4 border-b border-slate-100 last:border-0"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-sm text-slate-900">{item.action}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.timestamp).toLocaleString("vi-VN")} -{" "}
                      {item.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Chưa có lịch sử thay đổi.</p>
          )}
        </div>
      )}

      {tab === "qc" && (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">QC Reports</h3>
          {qcReports.length > 0 ? (
            <div className="space-y-4">
              {qcReports.map((report: any) => (
                <div
                  key={report._id.toString()}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        report.decision === "pass"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {report.decision === "pass" ? "Đạt" : "Không đạt"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(report.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {report.notes && (
                    <p className="text-sm text-slate-600">{report.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Chưa có báo cáo QC nào.</p>
          )}
        </div>
      )}
    </div>
  );
}
