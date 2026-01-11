'use client';

import { StatusChip } from '@/components/ui/StatusChip';

interface GameData {
  _id: string;
  gameId: string;
  title?: string;
  description?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  teamId?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  createdAt: string;
  updatedAt: string;
}

interface GameInfoSectionProps {
  game: GameData;
  canEdit: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function GameInfoSection({ game, canEdit }: GameInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Thông tin chi tiết</h3>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-slate-500">Game ID</dt>
          <dd className="font-medium text-slate-900">{game.gameId}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Tiêu đề</dt>
          <dd className="font-medium text-slate-900">{game.title || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Team</dt>
          <dd className="font-medium text-slate-900">{game.teamId || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Môn học</dt>
          <dd className="font-medium text-slate-900">{game.subject || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Lớp</dt>
          <dd className="font-medium text-slate-900">{game.grade || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Unit</dt>
          <dd className="font-medium text-slate-900">{game.unit || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Loại game</dt>
          <dd className="font-medium text-slate-900">{game.gameType || '-'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-sm text-slate-500">Mô tả</dt>
          <dd className="font-medium text-slate-900">{game.description || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Ngày tạo</dt>
          <dd className="font-medium text-slate-900">{formatDate(game.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Cập nhật lần cuối</dt>
          <dd className="font-medium text-slate-900">{formatDate(game.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
