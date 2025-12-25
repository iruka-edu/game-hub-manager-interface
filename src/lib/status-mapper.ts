/**
 * Status Mapper Utility
 * Maps game and version status values to Vietnamese labels
 */

import type { GameStatus } from '../models/Game';
import type { VersionStatus } from '../models/GameVersion';

/**
 * Vietnamese labels for game/version statuses
 */
export const STATUS_LABELS: Record<GameStatus | VersionStatus, string> = {
  draft: 'Nháp',
  uploaded: 'Chờ QC',
  qc_processing: 'Đang QC',
  qc_failed: 'Cần sửa',
  qc_passed: 'Chờ duyệt',
  approved: 'Chờ xuất bản',
  published: 'Đang sử dụng',
  archived: 'Lưu trữ',
};

/**
 * Color codes for status badges
 */
export const STATUS_COLORS: Record<GameStatus | VersionStatus, string> = {
  draft: 'gray',
  uploaded: 'blue',
  qc_processing: 'yellow',
  qc_failed: 'red',
  qc_passed: 'green',
  approved: 'purple',
  published: 'green',
  archived: 'gray',
};

/**
 * Get Vietnamese label for a status
 * @param status - Game or version status
 * @returns Vietnamese label or the original status if not found
 */
export function getStatusLabel(status: GameStatus | VersionStatus): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Get color code for a status badge
 * @param status - Game or version status
 * @returns Color code (gray, blue, yellow, red, green, purple)
 */
export function getStatusColor(status: GameStatus | VersionStatus): string {
  return STATUS_COLORS[status] || 'gray';
}

/**
 * Get all valid statuses with their labels
 * @returns Array of status-label pairs
 */
export function getAllStatusLabels(): Array<{ value: GameStatus | VersionStatus; label: string }> {
  return Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value: value as GameStatus | VersionStatus,
    label,
  }));
}
