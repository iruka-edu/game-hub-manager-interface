/**
 * Validation context determines the strictness of validation rules
 */
export type ValidationContext = 'draft' | 'publish';

/**
 * Validation error with detailed information
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Error code for programmatic handling */
  code: string;
  
  /** Severity level */
  severity: 'error' | 'warning';
  
  /** Validation context where error occurred */
  context?: ValidationContext;
}

/**
 * Validation warning (non-blocking)
 */
export interface ValidationWarning {
  /** Field name with warning */
  field: string;
  
  /** Warning message */
  message: string;
  
  /** Warning code */
  code: string;
  
  /** Suggestion for improvement */
  suggestion?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Validation errors (blocking) */
  errors: ValidationError[];
  
  /** Validation warnings (non-blocking) */
  warnings: ValidationWarning[];
  
  /** Validation context used */
  context: ValidationContext;
  
  /** Completeness percentage (0-100) */
  completeness?: number;
  
  /** Suggestions for improvement */
  suggestions?: string[];
}

/**
 * Field-specific validation result
 */
export interface FieldValidationResult {
  /** Field name */
  field: string;
  
  /** Whether field validation passed */
  valid: boolean;
  
  /** Error message if validation failed */
  error?: string;
  
  /** Warning message if applicable */
  warning?: string;
  
  /** Suggestion for improvement */
  suggestion?: string;
}

/**
 * Metadata completeness information
 */
export interface MetadataCompleteness {
  /** Completeness percentage (0-100) */
  percentage: number;
  
  /** List of required fields for current context */
  requiredFields: string[];
  
  /** List of missing required fields */
  missingFields: string[];
  
  /** List of completed fields */
  completedFields: string[];
  
  /** List of optional fields */
  optionalFields: string[];
}

/**
 * Validation configuration options
 */
export interface ValidationOptions {
  /** Validation context */
  context: ValidationContext;
  
  /** Schema version to validate against */
  schemaVersion?: number;
  
  /** Custom required fields (overrides schema defaults) */
  customRequiredFields?: string[];
  
  /** Whether to include warnings in result */
  includeWarnings?: boolean;
  
  /** Whether to calculate completeness percentage */
  calculateCompleteness?: boolean;
}