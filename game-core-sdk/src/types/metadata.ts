/**
 * Enhanced Game Metadata Interface (MF-01)
 * 
 * This interface defines the flexible metadata structure that can accommodate
 * new fields without breaking existing games. Supports schema versioning for evolution.
 */
export interface GameMetadata {
  // === Core Educational Fields (MF-01) ===
  /** Type of game mechanics (quiz, puzzle, simulation, arcade, etc.) */
  gameType?: string;
  
  /** Academic subject area (Math, English, Science, etc.) */
  subject?: string;
  
  /** Grade level (flexible: string "Grade 5" or number 5) */
  grade?: string | number;
  
  /** Lesson number within the curriculum */
  lessonNo?: number;
  
  /** Brief summary of the lesson content */
  lessonSummary?: string;
  
  /** Textbook or curriculum reference (Canh Dieu, Ket Noi Tri Thuc, etc.) */
  textbook?: string;

  // === Visual Fields ===
  /** URL or path to game thumbnail image */
  thumbnailUrl?: string;

  // === Categorization Fields ===
  /** Primary theme or topic */
  theme_primary?: string;
  
  /** Additional themes or topics */
  theme_secondary?: string[];
  
  /** Context tags for categorization (e.g., ["k12", "exam-prep"]) */
  context_tags?: string[];

  /** Available difficulty levels (e.g., ["easy", "medium", "hard"]) */
  difficulty_levels?: string[];

  // === Schema Evolution Support ===
  /** Metadata structure version for backward compatibility */
  schemaVersion?: number;

  // === Extensibility ===
  /** Allow any additional fields for future expansion */
  [key: string]: any;
}

/**
 * Schema version information for metadata evolution
 */
export interface SchemaVersionInfo {
  version: number;
  description: string;
  requiredFields: string[];
  deprecatedFields: string[];
  migrationPath?: string;
}

/**
 * Schema version registry
 */
export const SCHEMA_VERSIONS: Record<number, SchemaVersionInfo> = {
  1: {
    version: 1,
    description: "Initial enhanced metadata schema (MF-01)",
    requiredFields: ['gameType', 'subject', 'grade', 'thumbnailUrl'],
    deprecatedFields: [],
  }
};

/**
 * Default mandatory fields for publishing (schema version 1)
 */
export const DEFAULT_MANDATORY_FIELDS: string[] = [
  'gameType',
  'subject', 
  'grade',
  'thumbnailUrl'
];

/**
 * Type guard to check if an object has valid metadata structure
 */
export function isValidGameMetadata(obj: any): obj is GameMetadata {
  return obj !== null && typeof obj === 'object';
}

/**
 * Get schema version from metadata (defaults to 1 if not specified)
 */
export function getSchemaVersion(metadata: GameMetadata): number {
  return metadata.schemaVersion || 1;
}

/**
 * Get required fields for a specific schema version
 */
export function getRequiredFields(schemaVersion: number = 1): string[] {
  const versionInfo = SCHEMA_VERSIONS[schemaVersion];
  return versionInfo ? versionInfo.requiredFields : DEFAULT_MANDATORY_FIELDS;
}