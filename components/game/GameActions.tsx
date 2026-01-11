'use client';

import Link from 'next/link';
import { useState } from 'react';

interface GameActionsProps {
  gameId: string;
  canEdit: boolean;
  canSubmitQC: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  isSelfQaComplete: boolean;
}

export function GameActions({
  gameId,
  canEdit,
  canSubmitQC,
  canReview,
  canApprove,
  canPublish,
  isSelfQaComplete,
}: GameActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const response = await fetch(`/api/games/${gameId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Action failed');
      }

      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {canEdit && (
        <Link
          href={`/console/games/${gameId}/edit`}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Chỉnh sửa
        </Link>
      )}

      {canSubmitQC && (
        <button
          onClick={() => handleAction('submit-qc')}
          disabled={!isSelfQaComplete || loading === 'submit-qc'}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isSelfQaComplete ? 'Hoàn thành Self-QA trước khi gửi' : ''}
        >
          {loading === 'submit-qc' ? 'Đang gửi...' : 'Gửi QC'}
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
        <button
          onClick={() => handleAction('approve')}
          disabled={loading === 'approve'}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading === 'approve' ? 'Đang duyệt...' : 'Duyệt'}
        </button>
      )}

      {canPublish && (
        <button
          onClick={() => handleAction('publish')}
          disabled={loading === 'publish'}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading === 'publish' ? 'Đang xuất bản...' : 'Xuất bản'}
        </button>
      )}
    </div>
  );
}
