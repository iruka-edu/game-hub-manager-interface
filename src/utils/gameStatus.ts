// Game status utilities
export type GameStatus = 
  | 'draft' 
  | 'uploaded' 
  | 'qc_processing' 
  | 'qc_passed' 
  | 'qc_failed' 
  | 'approved' 
  | 'published' 
  | 'archived';

export const STATUS_LABELS: Record<GameStatus, string> = {
  draft: 'Nháp',
  uploaded: 'Chờ QC',
  qc_processing: 'Đang QC',
  qc_passed: 'QC đạt',
  qc_failed: 'QC cần sửa',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  archived: 'Lưu trữ',
};

export const STATUS_COLORS: Record<GameStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  uploaded: 'bg-blue-100 text-blue-700',
  qc_processing: 'bg-purple-100 text-purple-700',
  qc_passed: 'bg-green-100 text-green-700',
  qc_failed: 'bg-red-100 text-red-700',
  approved: 'bg-emerald-100 text-emerald-700',
  published: 'bg-indigo-100 text-indigo-700',
  archived: 'bg-slate-100 text-slate-500',
};

export const STATUS_PRIORITIES: Record<GameStatus, number> = {
  draft: 1,
  qc_failed: 2,
  uploaded: 3,
  qc_processing: 4,
  qc_passed: 5,
  approved: 6,
  published: 7,
  archived: 8,
};

export function getStatusLabel(status: GameStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: GameStatus): string {
  return STATUS_COLORS[status] || STATUS_COLORS.draft;
}

export function getStatusPriority(status: GameStatus): number {
  return STATUS_PRIORITIES[status] || 0;
}

export function canEdit(status: GameStatus): boolean {
  return ['draft', 'qc_failed'].includes(status);
}

export function canSubmitQC(status: GameStatus): boolean {
  return ['draft', 'qc_failed'].includes(status);
}

export function canUpdateCode(status: GameStatus): boolean {
  return ['draft', 'qc_failed', 'uploaded', 'qc_processing', 'qc_passed', 'approved', 'published'].includes(status);
}

export function canCreateNewVersion(status: GameStatus): boolean {
  return status === 'qc_failed';
}

export function sortGamesByStatus<T extends { latestVersion?: { status: GameStatus } }>(games: T[]): T[] {
  return games.sort((a, b) => {
    const statusA = a.latestVersion?.status || 'draft';
    const statusB = b.latestVersion?.status || 'draft';
    return getStatusPriority(statusA) - getStatusPriority(statusB);
  });
}