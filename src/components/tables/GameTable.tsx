'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusChip } from '@/components/ui/StatusChip';

interface GameWithVersion {
  game: any;
  latestVersion: any;
  liveVersion: any;
}

interface GameTableProps {
  games: GameWithVersion[];
  showBulkActions?: boolean;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN');
}

function GameTableRow({
  game,
  latestVersion,
  liveVersion,
  showCheckbox,
  isSelected,
  onSelect,
}: {
  game: any;
  latestVersion: any;
  liveVersion: any;
  showCheckbox: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const versionStatus = latestVersion?.status || 'draft';
  const gameId = game._id?.toString() || game._id;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {showCheckbox && (
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(gameId)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>
      )}
      <td className="px-6 py-4">
        <Link href={`/console/games/${gameId}`} className="block">
          <p className="font-medium text-slate-900 hover:text-indigo-600">
            {game.title || game.gameId}
          </p>
          <p className="text-sm text-slate-500">{game.gameId}</p>
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-slate-700">
            {latestVersion?.version || '1.0.0'}
          </span>
          {liveVersion && liveVersion._id !== latestVersion?._id && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Live: {liveVersion.version}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusChip status={versionStatus} size="sm" />
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">
        {formatDate(latestVersion?.updatedAt || game.updatedAt)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/console/games/${gameId}`}
            className="text-slate-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Xem chi tiết"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <Link
            href={`/console/games/${gameId}/edit`}
            className="text-slate-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Chỉnh sửa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function GameTable({ games, showBulkActions = false }: GameTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = () => {
    if (selectedIds.size === games.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(games.map(g => g.game._id?.toString() || g.game._id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa ${selectedIds.size} game đã chọn?\n\n` +
      `Lưu ý: Chỉ có thể xóa game ở trạng thái draft hoặc bạn là admin.`
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    
    try {
      const deletePromises = Array.from(selectedIds).map(async (gameId) => {
        const response = await fetch(`/api/games/${gameId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'bulk_delete' }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete game');
        }
        
        return gameId;
      });
      
      const results = await Promise.allSettled(deletePromises);
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (succeeded > 0) {
        alert(`Đã xóa thành công ${succeeded} game${failed > 0 ? `, ${failed} game thất bại` : ''}`);
        window.location.reload();
      } else {
        alert('Không thể xóa game nào. Vui lòng kiểm tra quyền và trạng thái game.');
      }
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      alert('Có lỗi xảy ra khi xóa game: ' + error.message);
    } finally {
      setIsDeleting(false);
      setSelectedIds(new Set());
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {showBulkActions && (
                <th className="text-left px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === games.length && games.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Game</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Phiên bản</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Trạng thái</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Cập nhật</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {games.map(({ game, latestVersion, liveVersion }) => (
              <GameTableRow
                key={game._id?.toString() || game._id}
                game={game}
                latestVersion={latestVersion}
                liveVersion={liveVersion}
                showCheckbox={showBulkActions}
                isSelected={selectedIds.has(game._id?.toString() || game._id)}
                onSelect={handleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm">
            Đã chọn <strong>{selectedIds.size}</strong> game
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-slate-300 hover:text-white transition-colors"
            disabled={isDeleting}
          >
            Bỏ chọn
          </button>
          <button 
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xóa...
              </>
            ) : (
              'Xóa'
            )}
          </button>
        </div>
      )}
    </>
  );
}
