'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SerializedGame extends Record<string, unknown> {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  ownerId: string;
  subject?: string;
  grade?: string;
  gameType?: string;
  disabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializedGameVersion extends Record<string, unknown> {
  _id: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface GameWithVersion {
  game: SerializedGame;
  latestVersion?: SerializedGameVersion;
  owner?: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
  };
}

interface GameLibraryClientProps {
  initialGames: GameWithVersion[];
  currentUserId: string;
  userRoles: string[];
}

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  uploaded: 'bg-blue-100 text-blue-700',
  qc_processing: 'bg-yellow-100 text-yellow-700',
  qc_passed: 'bg-green-100 text-green-700',
  qc_failed: 'bg-red-100 text-red-700',
  approved: 'bg-purple-100 text-purple-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS = {
  draft: 'Nháp',
  uploaded: 'Đã gửi QC',
  qc_processing: 'Đang QC',
  qc_passed: 'QC đạt',
  qc_failed: 'QC không đạt',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
};

export function GameLibraryClient({ 
  initialGames, 
  currentUserId, 
  userRoles 
}: GameLibraryClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Filter games based on search and filters
  const filteredGames = useMemo(() => {
    return initialGames.filter((item) => {
      const { game, latestVersion } = item;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          game.title.toLowerCase().includes(searchLower) ||
          game.gameId.toLowerCase().includes(searchLower) ||
          (game.description && game.description.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (!latestVersion || latestVersion.status !== statusFilter) {
          return false;
        }
      }

      // Subject filter
      if (subjectFilter !== 'all') {
        if (game.subject !== subjectFilter) {
          return false;
        }
      }

      return true;
    });
  }, [initialGames, searchTerm, statusFilter, subjectFilter]);

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    initialGames.forEach((item) => {
      if (item.game.subject) {
        subjectSet.add(item.game.subject);
      }
    });
    return Array.from(subjectSet).sort();
  }, [initialGames]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên game, Game ID..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="uploaded">Đã gửi QC</option>
              <option value="qc_processing">Đang QC</option>
              <option value="qc_passed">QC đạt</option>
              <option value="qc_failed">QC không đạt</option>
              <option value="approved">Đã duyệt</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Môn học
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-600">
        Hiển thị {filteredGames.length} / {initialGames.length} game
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((item) => {
          const { game, latestVersion, owner } = item;
          
          return (
            <div
              key={game._id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-[308/211] bg-slate-100 rounded-t-xl overflow-hidden">
                {game.thumbnailDesktop ? (
                  <Image
                    src={game.thumbnailDesktop}
                    alt={game.title}
                    width={308}
                    height={211}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    {game.title}
                  </h3>
                  {latestVersion && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full shrink-0 ml-2 ${
                      STATUS_COLORS[latestVersion.status as keyof typeof STATUS_COLORS] || 'bg-slate-100 text-slate-700'
                    }`}>
                      {STATUS_LABELS[latestVersion.status as keyof typeof STATUS_LABELS] || latestVersion.status}
                    </span>
                  )}
                </div>

                {/* Game ID */}
                <p className="text-xs text-slate-500 font-mono mb-2">
                  {game.gameId}
                </p>

                {/* Metadata */}
                <div className="space-y-1 mb-3">
                  {game.subject && (
                    <div className="flex items-center text-xs text-slate-600">
                      <span className="font-medium">Môn:</span>
                      <span className="ml-1">{game.subject}</span>
                      {game.grade && <span className="ml-1">- Lớp {game.grade}</span>}
                    </div>
                  )}
                  {game.gameType && (
                    <div className="flex items-center text-xs text-slate-600">
                      <span className="font-medium">Loại:</span>
                      <span className="ml-1">{game.gameType}</span>
                    </div>
                  )}
                  {owner && (
                    <div className="flex items-center text-xs text-slate-600">
                      <span className="font-medium">Tác giả:</span>
                      <span className="ml-1">{owner.name || owner.username || owner.email}</span>
                    </div>
                  )}
                </div>

                {/* Version Info */}
                {latestVersion && (
                  <div className="text-xs text-slate-500 mb-3">
                    <div>Version: {latestVersion.version}</div>
                    <div>
                      Cập nhật: {new Date(latestVersion.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Link
                    href={`/console/games/${game._id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Xem chi tiết
                  </Link>
                  
                  {game.disabled && (
                    <span className="text-xs text-red-600 font-medium">
                      Đã tắt
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Không tìm thấy game nào
          </h3>
          <p className="text-slate-500">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      )}
    </div>
  );
}
