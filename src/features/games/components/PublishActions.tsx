'use client';

import { useState } from 'react';

interface PublishActionsProps {
  gameId: string;
  gameTitle: string;
  versionStatus?: string;
  liveVersionId?: string;
  rolloutPercentage: number;
  disabled?: boolean;
}

export function PublishActions({
  gameId,
  gameTitle,
  versionStatus,
  liveVersionId,
  rolloutPercentage,
  disabled,
}: PublishActionsProps) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [rollout, setRollout] = useState(rolloutPercentage);
  const [disableReason, setDisableReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setAsLive: true, rolloutPercentage: rollout }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDisable = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !disabled, reason: disableReason }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleRepublish = async () => {
    if (!liveVersionId) {
      alert('Không tìm thấy version');
      return;
    }
    if (!confirm('Xuất bản lại game này?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/games/republish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, versionId: liveVersionId }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {versionStatus === 'approved' && !disabled && (
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Xuất bản
          </button>
        )}
        {versionStatus === 'published' && (
          <>
            <button
              onClick={() => setShowDisableModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              {disabled ? 'Bật lại' : 'Tắt ngay'}
            </button>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Lưu trữ
            </button>
          </>
        )}
        {versionStatus === 'archived' && !disabled && (
          <button
            onClick={handleRepublish}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Xuất bản lại'}
          </button>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowPublishModal(false)}
        >
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Xác nhận xuất bản</h3>
            <p className="text-slate-600 mb-4">
              Bạn đang xuất bản game "<span className="font-medium">{gameTitle}</span>".
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tỷ lệ rollout: {rollout}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={rollout}
                onChange={(e) => setRollout(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Phần trăm người dùng có thể thấy game này</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
              <p className="text-sm text-amber-800">
                ⚠️ Khi xuất bản, học sinh có thể thấy và chơi game này.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowDisableModal(false)}
        >
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {disabled ? 'Bật game' : 'Tắt game'}
            </h3>
            <p className="text-slate-600 mb-4">
              Game "<span className="font-medium">{gameTitle}</span>" sẽ{' '}
              {disabled ? 'được hiển thị lại' : 'bị ẩn khỏi'} Game Hub.
            </p>
            {!disabled && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Lý do</label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Nhập lý do..."
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDisableModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleToggleDisable}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowArchiveModal(false)}
        >
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Lưu trữ game</h3>
            <p className="text-slate-600 mb-6">
              Game "<span className="font-medium">{gameTitle}</span>" sẽ không còn hiển thị cho học
              sinh.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleArchive}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Lưu trữ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
