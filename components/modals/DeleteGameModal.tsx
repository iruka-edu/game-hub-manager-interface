'use client';

import { useState } from 'react';

interface DeleteGameModalProps {
  gameId: string;
  gameTitle: string;
  userRoles: string[];
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteGameModal({
  gameId,
  gameTitle,
  userRoles,
  isOpen,
  onClose,
  onDeleted,
}: DeleteGameModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canDeleteAnyGame = userRoles.some((r) => ['admin', 'ceo', 'cto'].includes(r));
  const isReasonRequired = !canDeleteAnyGame;

  const handleDelete = async () => {
    if (isReasonRequired && !reason.trim()) {
      alert('Vui lòng nhập lý do xóa game');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi xóa game');
      }

      alert('Game đã được xóa thành công');
      onClose();
      onDeleted?.();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Xóa Game</h3>
            <p className="text-sm text-gray-600">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Bạn có chắc chắn muốn xóa game <strong>{gameTitle}</strong>?
          </p>
          <p className="text-sm text-red-600">
            ⚠️ Tất cả dữ liệu và phiên bản của game sẽ bị xóa vĩnh viễn.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do xóa {canDeleteAnyGame ? '(tùy chọn)' : '(bắt buộc)'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Nhập lý do xóa game..."
            required={isReasonRequired}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xóa...' : 'Xóa Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
