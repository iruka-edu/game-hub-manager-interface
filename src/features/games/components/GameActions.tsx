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
}: GameActionsProps) {
  const [isReuploadOpen, setIsReuploadOpen] = useState(false);

  const submitQC = useSubmitToQC();
  const approveGame = useApproveGame();
  const rejectGame = useRejectGame();
  const publishGame = usePublishGame();

  const handleSubmitQC = () => {
    submitQC.mutate(gameId);
  };

  const handleApproveDecision = (decision: "approve" | "reject") => {
    if (decision === "approve") {
      approveGame.mutate(gameId);
    } else {
      rejectGame.mutate(gameId);
    }
  };

  const handlePublish = () => {
    publishGame.mutate({ gameId, payload: {} });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {canEdit && (
          <>
            <Link
              href={`/console/games/${gameId}/edit`}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Chỉnh sửa
            </Link>
            {version && (
              <button
                onClick={() => setIsReuploadOpen(true)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
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
                Upload lại file zip
              </button>
            )}
          </>
        )}

        {canSubmitQC && (
          <button
            onClick={handleSubmitQC}
            disabled={!isSelfQaComplete || submitQC.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isSelfQaComplete ? "Hoàn thành Self-QA trước khi gửi" : ""}
          >
            {submitQC.isPending ? "Đang gửi..." : "Gửi QC"}
          </button>
        )}

        {canReview && (
          <Link
            href={`/console/games/${gameId}/review`}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Mở Review
          </Link>
        )}

        {canApprove && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApproveDecision("reject")}
              disabled={rejectGame.isPending || approveGame.isPending}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {rejectGame.isPending ? "Đang xử lý..." : "Từ chối"}
            </button>
            <button
              onClick={() => handleApproveDecision("approve")}
              disabled={approveGame.isPending || rejectGame.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {approveGame.isPending ? "Đang duyệt..." : "Duyệt"}
            </button>
          </div>
        )}

        {canPublish && (
          <button
            onClick={handlePublish}
            disabled={publishGame.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {publishGame.isPending ? "Đang xuất bản..." : "Xuất bản"}
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
