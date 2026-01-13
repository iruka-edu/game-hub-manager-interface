/**
 * Repository Manager - Singleton pattern for repository instances
 * Prevents multiple repository instances and optimizes MongoDB connections
 */

import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { UserRepository } from '@/models/User';
import { QCReportRepository } from '@/models/QcReport';
import { NotificationRepository } from '@/models/Notification';
import { GameHistoryRepository } from '@/models/GameHistory';

// Cached repository instances
let gameRepo: GameRepository | null = null;
let gameVersionRepo: GameVersionRepository | null = null;
let userRepo: UserRepository | null = null;
let qcReportRepo: QCReportRepository | null = null;
let notificationRepo: NotificationRepository | null = null;
let gameHistoryRepo: GameHistoryRepository | null = null;

/**
 * Get GameRepository instance (cached)
 */
export async function getGameRepository(): Promise<GameRepository> {
  if (!gameRepo) {
    gameRepo = await GameRepository.getInstance();
  }
  return gameRepo;
}

/**
 * Get GameVersionRepository instance (cached)
 */
export async function getGameVersionRepository(): Promise<GameVersionRepository> {
  if (!gameVersionRepo) {
    gameVersionRepo = await GameVersionRepository.getInstance();
  }
  return gameVersionRepo;
}

/**
 * Get UserRepository instance (cached)
 */
export async function getUserRepository(): Promise<UserRepository> {
  if (!userRepo) {
    userRepo = await UserRepository.getInstance();
  }
  return userRepo;
}

/**
 * Get QCReportRepository instance (cached)
 */
export async function getQCReportRepository(): Promise<QCReportRepository> {
  if (!qcReportRepo) {
    qcReportRepo = await QCReportRepository.getInstance();
  }
  return qcReportRepo;
}

/**
 * Get NotificationRepository instance (cached)
 */
export async function getNotificationRepository(): Promise<NotificationRepository> {
  if (!notificationRepo) {
    notificationRepo = await NotificationRepository.getInstance();
  }
  return notificationRepo;
}

/**
 * Get GameHistoryRepository instance (cached)
 */
export async function getGameHistoryRepository(): Promise<GameHistoryRepository> {
  if (!gameHistoryRepo) {
    gameHistoryRepo = await GameHistoryRepository.getInstance();
  }
  return gameHistoryRepo;
}

/**
 * Clear all cached repositories (useful for testing or connection reset)
 */
export function clearRepositoryCache(): void {
  gameRepo = null;
  gameVersionRepo = null;
  userRepo = null;
  qcReportRepo = null;
  notificationRepo = null;
  gameHistoryRepo = null;
}

/**
 * Get all repositories at once (optimized for bulk operations)
 */
export async function getAllRepositories() {
  const [
    gameRepository,
    gameVersionRepository,
    userRepository,
    qcReportRepository,
    notificationRepository,
    gameHistoryRepository,
  ] = await Promise.all([
    getGameRepository(),
    getGameVersionRepository(),
    getUserRepository(),
    getQCReportRepository(),
    getNotificationRepository(),
    getGameHistoryRepository(),
  ]);

  return {
    gameRepository,
    gameVersionRepository,
    userRepository,
    qcReportRepository,
    notificationRepository,
    gameHistoryRepository,
  };
}