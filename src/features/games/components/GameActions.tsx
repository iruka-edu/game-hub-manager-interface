"use client";

import Link from "next/link";
import { useState } from "react";
import { ReuploadModal } from "./ReuploadModal";
import {
  useSubmitToQC,
  useApproveGame,
  useRejectGame,
  usePublishGame,
  useUnpublishGame,
} from "@/features/games";

interface GameActionsProps {
  gameId: string; // Internal ID for hooks
  gameSlug: string; // Slug for upload API / display
  version?: string; // Current version
  canEdit: boolean;
  canSubmitQC: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  isSelfQaComplete: boolean;
  isLocked?: boolean;
  isLive?: boolean;
}

export function GameActions({
  gameId,
  gameSlug,
  version,
  canEdit,
  canSubmitQC,
  canReview,
  canApprove,
  canPublish,
  isSelfQaComplete,
  isLocked,
  isLive,
}: GameActionsProps) {
  const [isReuploadOpen, setIsReuploadOpen] = useState(false);

  const submitQC = useSubmitToQC();
  const approveGame = useApproveGame();
  const rejectGame = useRejectGame();
  const publishGame = usePublishGame();
  const unpublishGame = useUnpublishGame();

  const handleSubmitQC = () => {
    if (isLocked) return;
    submitQC.mutate(gameId);
  };

  const handleApproveDecision = (decision: "approve" | "reject") => {
    if (decision === "approve") {
      if (
        window.confirm(
          "Xác nhận DUYỆT nội dung game này? Trạng thái sẽ chuyển sang Approved.",
        )
      ) {
        approveGame.mutate({ gameId });
      }
    } else {
      const reason = window.prompt("Lý do từ chối (Ghi chú cho Developer):");
      if (reason) {
        rejectGame.mutate({
          gameId,
          payload: { decision: "reject", note: reason },
        });
      }
    }
  };

  const handlePublish = () => {
    if (
      window.confirm("Bạn có chắc chắn muốn XUẤT BẢN game này lên Live không?")
    ) {
      publishGame.mutate({ gameId, payload: {} });
    }
  };

  const handleUnpublish = () => {
    if (
      window.confirm(
        "Xác nhận GỠ XUẤT BẢN? Game sẽ không còn hiển thị với người dùng cuối.",
      )
    ) {
      unpublishGame.mutate(gameId);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Developer / Owner Actions */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link
              href={`/console/games/${gameId}/edit`}
              className={`px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:bg-slate-50 active:scale-95 ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={(e) => isLocked && e.preventDefault()}
            >
              Chỉnh sửa {isLocked && "🔒"}
            </Link>
            {version && (
              <button
                onClick={() => setIsReuploadOpen(true)}
                disabled={isLocked}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:bg-slate-50 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload lại
              </button>
            )}
          </div>
        )}

        {/* Workflow Actions */}
        {canSubmitQC && (
          <button
            onClick={handleSubmitQC}
            disabled={!isSelfQaComplete || submitQC.isPending || isLocked}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {submitQC.isPending ? "Đang gửi..." : "Gửi QC Request"}
          </button>
        )}

        {canReview && (
          <Link
            href={`/console/games/${gameId}/review`}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Review QC
          </Link>
        )}

        {canApprove && (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => handleApproveDecision("reject")}
              disabled={rejectGame.isPending || approveGame.isPending}
              className="px-4 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
            >
              {rejectGame.isPending ? "..." : "Reject"}
            </button>
            <button
              onClick={() => handleApproveDecision("approve")}
              disabled={approveGame.isPending || rejectGame.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {approveGame.isPending ? "Đang duyệt..." : "Approve Nội dung"}
            </button>
          </div>
        )}

        {/* Publish / Admin Gatekeeper */}
        {canPublish && (
          <div className="ml-auto flex items-center gap-2">
            {!isLive ? (
              <button
                onClick={handlePublish}
                disabled={publishGame.isPending}
                className="px-6 py-2.5 text-sm font-black text-white bg-linear-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
                {publishGame.isPending ? "ĐANG XUẤT BẢN..." : "XUẤT BẢN NGAY"}
              </button>
            ) : (
              <button
                onClick={handleUnpublish}
                disabled={unpublishGame.isPending}
                className="px-6 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                {unpublishGame.isPending ? "ĐANG GỠ..." : "GỠ XUẤT BẢN"}
              </button>
            )}
          </div>
        )}
      </div>

      {isReuploadOpen && version && (
        <ReuploadModal
          isOpen={isReuploadOpen}
          onClose={() => setIsReuploadOpen(false)}
          gameId={gameSlug}
          mongoGameId={gameId}
          version={version}
        />
      )}
    </>
  );
}
