'use client';

import Link from 'next/link';

interface GameWithVersion {
  game: any;
  latestVersion: any;
  liveVersion: any;
}

interface GameFiltersProps {
  statusFilter: string;
  groupedGames: Record<string, GameWithVersion[]>;
  totalCount: number;
}

const statusLabels: Record<string, string> = {
  draft: 'Nháp',
  qc_failed: 'QC cần sửa',
  uploaded: 'Đang chờ QC',
  qc_processing: 'Đang QC',
  qc_passed: 'QC đạt - Chờ duyệt',
  approved: 'Đã duyệt - Chờ xuất bản',
  published: 'Đã xuất bản',
};

export function GameFilters({ statusFilter, groupedGames, totalCount }: GameFiltersProps) {
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <Link
        href="/console/my-games"
        className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[40px] flex items-center ${
          !statusFilter
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        }`}
      >
        Tất cả ({totalCount})
      </Link>
      {Object.entries(groupedGames).map(([status, statusGames]) =>
        statusGames.length > 0 ? (
          <Link
            key={status}
            href={`/console/my-games?status=${status}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {statusLabels[status]} ({statusGames.length})
          </Link>
        ) : null
      )}
    </div>
  );
}
