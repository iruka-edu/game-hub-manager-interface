import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { QCReportRepository } from "@/models/QcReport";
import { StatusChip } from "@/components/ui/StatusChip";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { QCReviewForm } from "@/features/games/components/QCReviewForm";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ versionId?: string }>;
}

export default async function QCReviewPage({ params, searchParams }: Props) {
  const { id: gameId } = await params;
  const { versionId } = await searchParams;

  // Auth check
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

  // Check if user has QC or Admin role
  const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
  const isQC = hasRole("qc");
  const isAdmin = hasRole("admin");

  if (!isQC && !isAdmin) {
    redirect("/console");
  }

  // Get game and version
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();

  const game = await gameRepo.findById(gameId);
  if (!game) {
    notFound();
  }

  // Get the version to review
  let version;
  if (versionId) {
    version = await versionRepo.findById(versionId);
  } else if (game.latestVersionId) {
    version = await versionRepo.findById(game.latestVersionId.toString());
  }

  if (!version) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-red-800 font-semibold">
            Không tìm thấy phiên bản
          </h3>
          <p className="text-red-700 text-sm mt-2">
            Game này chưa có phiên bản nào để review.
          </p>
          <Link
            href="/console/qc-inbox"
            className="inline-block mt-4 text-sm text-red-600 hover:text-red-700 underline"
          >
            ← Quay lại QC Inbox
          </Link>
        </div>
      </div>
    );
  }

  // Check if version can be reviewed
  const canReview = version.status === "uploaded";

  if (!canReview) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-amber-800 font-semibold">Không thể review</h3>
          <p className="text-amber-700 text-sm mt-2">
            Phiên bản này có trạng thái <StatusChip status={version.status} />{" "}
            và không thể review. Chỉ có thể review các phiên bản ở trạng thái
            "Uploaded".
          </p>
          <Link
            href="/console/qc-inbox"
            className="inline-block mt-4 text-sm text-amber-600 hover:text-amber-700 underline"
          >
            ← Quay lại QC Inbox
          </Link>
        </div>
      </div>
    );
  }

  // Get owner info
  const owner = await userRepo.findById(game.ownerId);
  const ownerName = owner?.name || owner?.email || "Unknown";

  // Get previous QC reports for this game
  const qcRepo = await QCReportRepository.getInstance();
  const previousReports = await qcRepo.findByGameId(gameId);

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "QC Inbox", href: "/console/qc-inbox" },
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
    thumbnailDesktop: game.thumbnailDesktop,
    thumbnailMobile: game.thumbnailMobile,
  };

  const versionData = {
    _id: version._id.toString(),
    version: version.version,
    status: version.status,
    buildSize: version.buildSize,
    selfQAChecklist: version.selfQAChecklist,
    releaseNote: version.releaseNote,
    qaSummary: version.qaSummary, // Pass existing QA results (including auto-tests)
    submittedAt: version.submittedAt?.toISOString(),
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">QC Review</h1>
              <StatusChip status={version.status} />
            </div>
            <h2 className="text-xl text-slate-700">
              {game.title || game.gameId}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Version {version.version} • Submitted by {ownerName}
            </p>
          </div>
          <Link
            href="/console/qc-inbox"
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            ← Back to Inbox
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - QC Review Form */}
        <div className="lg:col-span-2">
          <QCReviewForm
            gameId={gameId}
            versionId={version._id.toString()}
            game={gameData}
            version={versionData}
            reviewerName={user.name || user.email}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Game Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Game Info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 mb-1">Game ID</dt>
                <dd className="font-mono text-slate-900">{game.gameId}</dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Subject</dt>
                <dd className="text-slate-900">{game.subject || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Grade</dt>
                <dd className="text-slate-900">{game.grade || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Type</dt>
                <dd className="text-slate-900">{game.gameType || "N/A"}</dd>
              </div>
            </dl>
          </div>

          {/* Version Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Version Info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 mb-1">Version</dt>
                <dd className="font-mono text-slate-900">{version.version}</dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Build Size</dt>
                <dd className="text-slate-900">
                  {version.buildSize
                    ? `${(version.buildSize / 1024 / 1024).toFixed(2)} MB`
                    : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Submitted</dt>
                <dd className="text-slate-900">
                  {version.submittedAt
                    ? new Date(version.submittedAt).toLocaleString("vi-VN")
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Self-QA Checklist */}
          {version.selfQAChecklist && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Self-QA Checklist
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {version.selfQAChecklist.testedDevices ? (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-slate-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-slate-700">Tested on devices</span>
                </div>
                <div className="flex items-center gap-2">
                  {version.selfQAChecklist.testedAudio ? (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-slate-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-slate-700">Audio tested</span>
                </div>
                <div className="flex items-center gap-2">
                  {version.selfQAChecklist.gameplayComplete ? (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-slate-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-slate-700">Gameplay complete</span>
                </div>
                <div className="flex items-center gap-2">
                  {version.selfQAChecklist.contentVerified ? (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-slate-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-slate-700">Content verified</span>
                </div>
              </div>
              {version.selfQAChecklist.note && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Note:</p>
                  <p className="text-sm text-slate-700">
                    {version.selfQAChecklist.note}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Release Note */}
          {version.releaseNote && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Release Note
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {version.releaseNote}
              </p>
            </div>
          )}

          {/* Play Game */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Test Game</h3>
            <Link
              href={`/play/${gameId}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
              Play Game
            </Link>
          </div>

          {/* Previous Reports */}
          {previousReports.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Previous QC Reports
              </h3>
              <div className="space-y-3">
                {previousReports.slice(0, 3).map((report: any) => (
                  <div
                    key={report._id.toString()}
                    className="p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${
                          report.decision === "pass"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {report.decision === "pass" ? "PASS" : "FAIL"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {report.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {report.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
