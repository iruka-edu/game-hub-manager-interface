/**
 * @iruka/game-core-sdk
 * 
 * Core SDK for Iruka game validation, metadata types, and runtime protocols.
 * This package provides pure TypeScript functions and types for game metadata
 * validation, completeness tracking, and iframe-based game communication.
 */

// Export all types
export * from './types';

// Export validation functions and schemas
export * from './validation';

// Export utility functions
export * from './utils';

// Export runtime communication protocols
export * from './runtime';

// Re-export commonly used types for convenience
export type {
  GameMetadata,
  ValidationResult,
  ValidationContext,
  ValidationError,
  MetadataCompleteness
} from './types';

// Re-export commonly used functions
export {
  validateMetadata
} from './validation';

export {
  calculateCompleteness,
  getMissingFields,
  isMetadataComplete
} from './utils';

export {
  GameHost,
  GameClient,
  GameEventType
} from './runtime';