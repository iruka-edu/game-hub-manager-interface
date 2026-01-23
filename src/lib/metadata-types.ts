import type { GameType, Subject, Grade, DifficultyLevel } from '@iruka-edu/game-core';

/**
 * Extensible Game Metadata Interface
 * 
 * This interface defines the flexible metadata structure that can accommodate
 * new fields without database migrations. All fields are optional to support
 * lazy validation during development phases.
 */
export interface GameMetadata {
  // === Classification Fields ===
  /** Type of game mechanics (quiz, puzzle, simulation, arcade, etc.) */
  gameType?: GameType | string;
  
  /** Academic subject area (Math, English, Science, etc.) */
  subject?: Subject | string;
  
  /** Grade level (Grade 1, Grade 2, etc.) */
  grade?: Grade | string;
  
  /** Textbook or curriculum reference (Canh Dieu, Ket Noi Tri Thuc, etc.) */
  textbook?: string;

  // === Content Fields ===
  /** Lesson number within the curriculum */
  lessonNo?: number;
  
  /** Brief summary of the lesson content */
  lessonSummary?: string;
  
  /** Primary theme or topic */
  theme_primary?: string;
  
  /** Additional themes or topics */
  theme_secondary?: string[];
  
  /** Context tags for categorization (e.g., ["k12", "exam-prep"]) */
  context_tags?: string[];

  // === Configuration Fields ===
  /** Available difficulty levels (e.g., ["easy", "medium", "hard"]) */
  difficulty_levels?: DifficultyLevel[] | string[];
  
  /** URL or path to game thumbnail image */
  thumbnailUrl?: string;

  // === Extensibility ===
  /** Allow any additional fields for future expansion */
  [key: string]: any;
}

/**
 * Metadata field configuration for dynamic form rendering
 */
export interface MetadataFieldConfig {
  /** Field name (must match GameMetadata property) */
  name: string;
  
  /** Display label for the field */
  label: string;
  
  /** Input type for form rendering */
  type: 'text' | 'select' | 'tags' | 'image-upload' | 'number' | 'textarea';
  
  /** Whether this field is required for publishing */
  required: boolean;
  
  /** Options for select fields */
  options?: string[];
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Help text or description */
  helpText?: string;
  
  /** Validation rules */
  validation?: FieldValidationRule[];
  
  /** Field status */
  status?: 'active' | 'deprecated' | 'hidden';
}

/**
 * Validation rule for metadata fields
 */
export interface FieldValidationRule {
  /** Type of validation */
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  
  /** Validation value (e.g., minimum length, regex pattern) */
  value?: any;
  
  /** Error message to display when validation fails */
  message: string;
}

/**
 * Result of metadata validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Warnings (non-blocking) */
  warnings: string[];
  
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Metadata completeness information
 */
export interface MetadataCompleteness {
  /** Completeness percentage (0-100) */
  percentage: number;
  
  /** List of required fields for publishing */
  requiredFields: string[];
  
  /** List of missing required fields */
  missingFields: string[];
  
  /** List of optional fields */
  optionalFields: string[];
  
  /** List of completed fields */
  completedFields: string[];
}

/**
 * Lazy validation result (permissive for development)
 */
export interface LazyValidationResult {
  /** Format errors (blocking) */
  formatErrors: string[];
  
  /** Warnings (non-blocking) */
  warnings: string[];
  
  /** Recommendations for improvement */
  recommendations: string[];
  
  /** Completeness percentage */
  completeness: number;
}

/**
 * Publish validation result (strict for publishing)
 */
export interface PublishValidationResult {
  /** Whether the game can be published */
  valid: boolean;
  
  /** List of missing required fields */
  missingFields: string[];
  
  /** Validation errors */
  errors: string[];
  
  /** Whether publishing is allowed */
  canPublish: boolean;
}

/**
 * Field validation result for individual fields
 */
export interface FieldValidationResult {
  /** Whether the field value is valid */
  valid: boolean;
  
  /** Error message if validation failed */
  error?: string;
  
  /** Suggestion for improvement */
  suggestion?: string;
}

/**
 * Metadata configuration document stored in database
 */
export interface MetadataConfigDocument {
  _id: string;
  
  /** Configuration version for tracking changes */
  version: string;
  
  /** List of fields required for publishing */
  mandatoryFields: string[];
  
  /** Field definitions for dynamic forms */
  fieldDefinitions: MetadataFieldConfig[];
  
  /** When this configuration was created */
  createdAt: Date;
  
  /** When this configuration was last updated */
  updatedAt: Date;
  
  /** User who last updated this configuration */
  updatedBy: string;
}

/**
 * Audit log entry for metadata changes
 */
export interface MetadataAuditLog {
  _id: string;
  
  /** Game ID that was modified */
  gameId: string;
  
  /** Type of action performed */
  action: 'update' | 'validate' | 'publish_attempt' | 'config_change';
  
  /** Changes made to metadata */
  changes: Record<string, any>;
  
  /** Previous values before changes */
  previousValues: Record<string, any>;
  
  /** User who made the changes */
  userId: string;
  
  /** When the change occurred */
  timestamp: Date;
  
  /** Validation result if applicable */
  validationResult?: ValidationResult;
}

/**
 * Game compliance issue for audit reports
 */
export interface GameComplianceIssue {
  /** Game ID */
  gameId: string;
  
  /** Game title */
  title: string;
  
  /** Game slug */
  slug: string;
  
  /** List of missing required fields */
  missingFields: string[];
  
  /** Metadata completeness percentage */
  completeness: number;
  
  /** Game owner ID */
  owner: string;
}

/**
 * System-wide compliance statistics
 */
export interface ComplianceStats {
  /** Total number of published games */
  totalPublishedGames: number;
  
  /** Number of fully compliant games */
  fullyCompliantGames: number;
  
  /** Number of partially compliant games */
  partiallyCompliantGames: number;
  
  /** Number of non-compliant games */
  nonCompliantGames: number;
  
  /** Most commonly missing fields */
  mostMissingFields: string[];
}

/**
 * Audit report for metadata compliance
 */
export interface AuditReport {
  /** Total number of games audited */
  totalGames: number;
  
  /** Number of compliant games */
  compliantGames: number;
  
  /** List of non-compliant games with details */
  nonCompliantGames: GameComplianceIssue[];
  
  /** Overall system completeness percentage */
  overallCompleteness: number;
}

/**
 * Fix suggestion for improving metadata
 */
export interface FixSuggestion {
  /** Field that needs attention */
  field: string;
  
  /** Current value (if any) */
  currentValue?: any;
  
  /** Suggested value or action */
  suggestion: string;
  
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  
  /** Explanation of why this fix is needed */
  reason: string;
}

/**
 * Enhanced Game interface with extensible metadata
 * Extends the existing Game interface to include the new metadata structure
 */
export interface GameWithMetadata {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  
  // Version references
  latestVersionId?: string;
  liveVersionId?: string;
  
  // Extensible metadata object
  metadata: GameMetadata;
  
  // Metadata tracking fields
  metadataCompleteness?: number;
  lastMetadataUpdate?: Date;
  
  // Existing fields preserved
  disabled: boolean;
  rolloutPercentage: number;
  publishedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default metadata field configuration
 * This configuration defines the standard fields and their properties
 */
export const DEFAULT_METADATA_CONFIG: MetadataFieldConfig[] = [
  {
    name: 'gameType',
    label: 'Game Type',
    type: 'select',
    required: true,
    options: ['quiz', 'drag_drop', 'trace', 'classify', 'memory', 'custom'],
    helpText: 'Select the primary game mechanics type',
    status: 'active'
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'select',
    required: true,
    options: ['math', 'vietnamese', 'english', 'logic', 'science', 'art', 'music', 'pe'],
    helpText: 'Academic subject area',
    status: 'active'
  },
  {
    name: 'grade',
    label: 'Grade Level',
    type: 'select',
    required: true,
    options: ['pre-k', 'k', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    helpText: 'Target grade level for this game',
    status: 'active'
  },
  {
    name: 'textbook',
    label: 'Textbook',
    type: 'select',
    required: false,
    options: ['Canh Dieu', 'Ket Noi Tri Thuc', 'Chan Troi Sang Tao'],
    helpText: 'Associated textbook or curriculum (optional)',
    status: 'active'
  },
  {
    name: 'lessonNo',
    label: 'Lesson Number',
    type: 'number',
    required: true,
    helpText: 'Lesson number within the curriculum',
    status: 'active'
  },
  {
    name: 'lessonSummary',
    label: 'Lesson Summary',
    type: 'textarea',
    required: false,
    helpText: 'Brief description of the lesson content',
    status: 'active'
  },
  {
    name: 'theme_primary',
    label: 'Primary Theme',
    type: 'text',
    required: false,
    helpText: 'Main theme or topic of the game',
    status: 'active'
  },
  {
    name: 'theme_secondary',
    label: 'Secondary Themes',
    type: 'tags',
    required: false,
    helpText: 'Additional themes or topics (optional)',
    status: 'active'
  },
  {
    name: 'context_tags',
    label: 'Context Tags',
    type: 'tags',
    required: false,
    helpText: 'Tags for categorization (e.g., k12, exam-prep)',
    status: 'active'
  },
  {
    name: 'difficulty_levels',
    label: 'Difficulty Levels',
    type: 'tags',
    required: false,
    options: ['easy', 'medium', 'hard'],
    helpText: 'Available difficulty levels in the game',
    status: 'active'
  },
  {
    name: 'thumbnailUrl',
    label: 'Game Thumbnail',
    type: 'image-upload',
    required: true,
    helpText: 'Upload a representative image for your game',
    status: 'active'
  }
];

/**
 * Default mandatory fields for publishing
 * These fields must be present and non-empty before a game can be published
 */
export const DEFAULT_MANDATORY_FIELDS: string[] = [
  'gameType',
  'subject',
  'grade',
  'lessonNo',
  'thumbnailUrl'
];

/**
 * Type guard to check if an object has metadata
 */
export function hasMetadata(game: any): game is GameWithMetadata {
  if (!game || game === null || typeof game !== 'object') {
    return false;
  }
  return typeof game.metadata === 'object' && game.metadata !== null;
}

/**
 * Type guard to check if metadata is complete for publishing
 */
export function isMetadataComplete(metadata: GameMetadata, requiredFields: string[]): boolean {
  for (const field of requiredFields) {
    const value = metadata[field];
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
  }
  return true;
}

/**
 * Utility function to calculate metadata completeness percentage
 */
export function calculateCompleteness(metadata: GameMetadata, requiredFields: string[]): number {
  if (requiredFields.length === 0) return 100;
  
  let completedCount = 0;
  for (const field of requiredFields) {
    const value = metadata[field];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) completedCount++;
      } else {
        completedCount++;
      }
    }
  }
  
  return Math.round((completedCount / requiredFields.length) * 100);
}

/**
 * Utility function to get missing required fields
 */
export function getMissingFields(metadata: GameMetadata, requiredFields: string[]): string[] {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    const value = metadata[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(field);
    }
  }
  
  return missing;
}
