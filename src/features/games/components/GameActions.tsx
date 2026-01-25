"use client";

import Link from "next/link";
import { useState } from "react";
import { ReuploadModal } from "./ReuploadModal";
import {
  useSubmitToQC,
  useApproveGame,
  useRejectGame,
  usePublishGame,
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
  isLocked, // New prop
}: GameActionsProps & { isLocked?: boolean }) {
  const [isReuploadOpen, setIsReuploadOpen] = useState(false);

  // ... (keep hooks)
  const submitQC = useSubmitToQC();
  const approveGame = useApproveGame();
  const rejectGame = useRejectGame();
  const publishGame = usePublishGame();

  const handleSubmitQC = () => {
    if (isLocked) return;
    submitQC.mutate(gameId);
  };

  const handleApproveDecision = (decision: "approve" | "reject") => {
    if (decision === "approve") {
      if (window.confirm("Bạn có chắc chắn muốn DUYỆT game này không?")) {
        approveGame.mutate({ gameId });
      }
    } else {
      const reason = window.prompt("Vui lòng nhập lý do từ chối:");
      if (reason) {
        rejectGame.mutate({
          gameId,
          payload: { decision: "reject", note: reason },
        });
      }
    }
  };

  const handlePublish = () => {
    if (window.confirm("Bạn có chắc chắn muốn XUẤT BẢN game này không?")) {
      publishGame.mutate({ gameId, payload: {} });
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {canEdit && (
          <>
            <Link
              href={`/console/games/${gameId}/edit`}
              className={`px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg transition-colors ${
                isLocked
                  ? "opacity-50 cursor-not-allowed bg-slate-50"
                  : "hover:bg-slate-50"
              }`}
              onClick={(e) => isLocked && e.preventDefault()}
            >
              Chỉnh sửa {isLocked && "(Locked)"}
            </Link>
            {version && (
              <button
                onClick={() => setIsReuploadOpen(true)}
                disabled={isLocked}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload lại {isLocked && "(Locked)"}
              </button>
            )}
          </>
        )}

        {canSubmitQC && (
          <button
            onClick={handleSubmitQC}
            disabled={!isSelfQaComplete || submitQC.isPending || isLocked}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
            title={
              !isSelfQaComplete
                ? "Hoàn thành Self-QA trước khi gửi"
                : isLocked
                  ? "Game đang bị khóa (QC/Review)"
                  : ""
            }
          >
            {submitQC.isPending ? "Đang gửi..." : "Gửi QC Request"}
          </button>
        )}

        {canReview && (
          <Link
            href={`/console/games/${gameId}/review`}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Mở QC Review
          </Link>
        )}

        {canApprove && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApproveDecision("reject")}
              disabled={rejectGame.isPending || approveGame.isPending}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              {rejectGame.isPending ? "Đang xử lý..." : "Từ chối"}
            </button>
            <button
              onClick={() => handleApproveDecision("approve")}
              disabled={approveGame.isPending || rejectGame.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm shadow-green-200"
            >
              {approveGame.isPending ? "Đang duyệt..." : "Duyệt & Publish"}
            </button>
          </div>
        )}

        {canPublish && (
          <button
            onClick={handlePublish}
            disabled={publishGame.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {publishGame.isPending ? "Đang xuất bản..." : "Xuất bản ngay"}
          </button>
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
