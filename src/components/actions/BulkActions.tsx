'use client';

import { useState } from 'react';

interface BulkActionsProps {
  selectedIds: string[];
  selectedGames: { id: string; title: string }[];
  onClearSelection: () => void;
  onDeleted?: () => void;
}

export function BulkActions({
  selectedIds,
  selectedGames,
  onClearSelection,
  onDeleted,
}: BulkActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          fetch(`/api/games/${id}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Bulk delete' }),
          })
        )
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        alert(`Đã xóa ${selectedIds.length - failed}/${selectedIds.length} games. ${failed} games không thể xóa.`);
      } else {
        alert(`Đã xóa ${selectedIds.length} games thành công`);
      }

      setShowDeleteModal(false);
      onClearSelection();
      onDeleted?.();
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-lg px-6 py-4 z-40">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} game được chọn
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Xóa đã chọn
            </button>
            <button
              onClick={onClearSelection}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa games</h3>
            </div>

            <p className="text-slate-600 mb-4">
              Bạn có chắc chắn muốn xóa{' '}
              <span className="font-medium text-red-600">{selectedIds.length}</span> game(s) đã chọn?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">
                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu game sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="max-h-32 overflow-y-auto mb-6 space-y-1">
              {selectedGames.map((game) => (
                <div key={game.id} className="text-sm text-slate-600 py-1">
                  • {game.title}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
