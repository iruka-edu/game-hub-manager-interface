import type { GameMetadata } from '../types';

/**
 * Game compliance issue information
 */
export interface GameComplianceIssue {
  /** Game identifier */
  gameId: string;
  
  /** Game title */
  title: string;
  
  /** List of missing required fields */
  missingFields: string[];
  
  /** Metadata completeness percentage */
  completeness: number;
  
  /** Game owner identifier */
  ownerId?: string;
}

/**
 * System-wide compliance statistics
 */
export interface ComplianceStats {
  /** Total number of games analyzed */
  totalGames: number;
  
  /** Number of fully compliant games */
  fullyCompliantGames: number;
  
  /** Number of partially compliant games */
  partiallyCompliantGames: number;
  
  /** Number of non-compliant games */
  nonCompliantGames: number;
  
  /** Most commonly missing fields */
  mostMissingFields: Array<{ field: string; count: number }>;
  
  /** Overall system completeness percentage */
  overallCompleteness: number;
}

/**
 * Compliance report for audit purposes
 */
export interface ComplianceReport {
  /** Report generation timestamp */
  generatedAt: Date;
  
  /** Total number of games audited */
  totalGames: number;
  
  /** Number of compliant games */
  compliantGames: number;
  
  /** List of non-compliant games with details */
  nonCompliantGames: GameComplianceIssue[];
  
  /** Overall system statistics */
  statistics: ComplianceStats;
  
  /** Schema version used for compliance check */
  schemaVersion: number;
}

/**
 * Analyze game compliance against required fields
 * 
 * @param gameId - Game identifier
 * @param title - Game title
 * @param metadata - Game metadata
 * @param requiredFields - List of required fields
 * @param ownerId - Optional owner identifier
 * @returns Compliance issue if non-compliant, null if compliant
 */
export function analyzeGameCompliance(
  gameId: string,
  title: string,
  metadata: GameMetadata,
  requiredFields: string[],
  ownerId?: string
): GameComplianceIssue | null {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = metadata[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    } else if (Array.isArray(value) && value.length === 0) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length === 0) {
    return null; // Compliant
  }
  
  const completeness = Math.round(
    ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
  );
  
  return {
    gameId,
    title,
    missingFields,
    completeness,
    ownerId
  };
}

/**
 * Generate compliance statistics from a list of games
 * 
 * @param games - Array of game data with metadata
 * @param requiredFields - List of required fields
 * @returns Compliance statistics
 */
export function generateComplianceStats(
  games: Array<{ gameId: string; title: string; metadata: GameMetadata; ownerId?: string }>,
  requiredFields: string[]
): ComplianceStats {
  let fullyCompliantGames = 0;
  let partiallyCompliantGames = 0;
  let nonCompliantGames = 0;
  let totalCompleteness = 0;
  
  const fieldMissingCounts: Record<string, number> = {};
  
  for (const game of games) {
    const issue = analyzeGameCompliance(
      game.gameId,
      game.title,
      game.metadata,
      requiredFields,
      game.ownerId
    );
    
    if (issue === null) {
      fullyCompliantGames++;
      totalCompleteness += 100;
    } else {
      if (issue.completeness > 0) {
        partiallyCompliantGames++;
      } else {
        nonCompliantGames++;
      }
      totalCompleteness += issue.completeness;
      
      // Count missing fields
      for (const field of issue.missingFields) {
        fieldMissingCounts[field] = (fieldMissingCounts[field] || 0) + 1;
      }
    }
  }
  
  const mostMissingFields = Object.entries(fieldMissingCounts)
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const overallCompleteness = games.length > 0 
    ? Math.round(totalCompleteness / games.length)
    : 100;
  
  return {
    totalGames: games.length,
    fullyCompliantGames,
    partiallyCompliantGames,
    nonCompliantGames,
    mostMissingFields,
    overallCompleteness
  };
}