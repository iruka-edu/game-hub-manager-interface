"use client";

import Link from "next/link";
import { useState } from "react";
import { ReuploadModal } from "./ReuploadModal";

interface GameActionsProps {
  gameId: string; // Mongo ID used for existing actions
  gameSlug: string; // Slug for upload API
  version?: string; // Current version for upload API
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
  const [loading, setLoading] = useState<string | null>(null);
  const [isReuploadOpen, setIsReuploadOpen] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const response = await fetch(`/api/games/${gameId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }

      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
  };

  const handleApproveDecision = async (decision: "approve" | "reject") => {
    setLoading(decision);
    try {
      const response = await fetch(`/api/games/${gameId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }

      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
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
            onClick={() => handleAction("submit-qc")}
            disabled={!isSelfQaComplete || loading === "submit-qc"}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isSelfQaComplete ? "Hoàn thành Self-QA trước khi gửi" : ""}
          >
            {loading === "submit-qc" ? "Đang gửi..." : "Gửi QC"}
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
              disabled={loading === "reject" || loading === "approve"}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loading === "reject" ? "Đang xử lý..." : "Từ chối"}
            </button>
            <button
              onClick={() => handleApproveDecision("approve")}
              disabled={loading === "approve" || loading === "reject"}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading === "approve" ? "Đang duyệt..." : "Duyệt"}
            </button>
          </div>
        )}

        {canPublish && (
          <button
            onClick={() => handleAction("publish")}
            disabled={loading === "publish"}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading === "publish" ? "Đang xuất bản..." : "Xuất bản"}
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
