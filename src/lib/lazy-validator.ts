import {
  GameMetadata,
  LazyValidationResult,
  FieldValidationResult,
  MetadataFieldConfig,
  DEFAULT_METADATA_CONFIG,
  DEFAULT_MANDATORY_FIELDS,
  calculateCompleteness,
  getMissingFields
} from './metadata-types';

/**
 * Lazy Validation System
 * 
 * Provides permissive validation during development phases that allows incomplete
 * metadata while providing helpful warnings and suggestions. This enables developers
 * to iterate quickly without being blocked by metadata requirements.
 */
export class LazyValidator {
  private fieldConfig: MetadataFieldConfig[];
  private mandatoryFields: string[];

  constructor(
    fieldConfig: MetadataFieldConfig[] = DEFAULT_METADATA_CONFIG,
    mandatoryFields: string[] = DEFAULT_MANDATORY_FIELDS
  ) {
    this.fieldConfig = fieldConfig;
    this.mandatoryFields = mandatoryFields;
  }

  /**
   * Validate metadata for development phase (permissive)
   * Allows missing fields but provides warnings and recommendations
   * 
   * @param metadata - Metadata to validate
   * @returns LazyValidationResult
   */
  validateForDevelopment(metadata: GameMetadata): LazyValidationResult {
    const formatErrors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Format validation (blocking errors)
    const formatValidation = this.validateAllFieldFormats(metadata);
    formatErrors.push(...formatValidation.errors);

    // Missing field warnings (non-blocking)
    const missingRequired = getMissingFields(metadata, this.mandatoryFields);
    if (missingRequired.length > 0) {
      warnings.push(`Missing required fields for publishing: ${missingRequired.join(', ')}`);
    }

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(metadata));

    // Calculate completeness
    const completeness = calculateCompleteness(metadata, this.mandatoryFields);

    return {
      formatErrors,
      warnings,
      recommendations,
      completeness
    };
  }

  /**
   * Validate individual field format and data type
   * 
   * @param fieldName - Name of the field
   * @param value - Value to validate
   * @returns FieldValidationResult
   */
  validateFieldFormat(fieldName: string, value: any): FieldValidationResult {
    const fieldConfig = this.fieldConfig.find(config => config.name === fieldName);
    
    if (!fieldConfig) {
      // Unknown field - allow it (extensibility)
      return { valid: true };
    }

    // Skip validation for undefined/null values (lazy validation)
    if (value === undefined || value === null) {
      return { valid: true };
    }

    // For lazy validation, empty strings are allowed only for text fields
    if (value === '' && (fieldConfig.type === 'text' || fieldConfig.type === 'textarea')) {
      return { valid: true };
    }

    // Type-specific validation
    switch (fieldConfig.type) {
      case 'text':
      case 'textarea':
        return this.validateTextField(fieldName, value, fieldConfig);
      
      case 'number':
        return this.validateNumberField(fieldName, value, fieldConfig);
      
      case 'select':
        return this.validateSelectField(fieldName, value, fieldConfig);
      
      case 'tags':
        return this.validateTagsField(fieldName, value, fieldConfig);
      
      case 'image-upload':
        return this.validateImageField(fieldName, value, fieldConfig);
      
      default:
        return { valid: true };
    }
  }

  /**
   * Get recommendations for improving metadata
   * 
   * @param metadata - Current metadata
   * @returns string[] - Array of recommendations
   */
  getRecommendations(metadata: GameMetadata): string[] {
    return this.generateRecommendations(metadata);
  }

  /**
   * Check if metadata is ready for publishing (strict check)
   * 
   * @param metadata - Metadata to check
   * @returns boolean
   */
  isReadyForPublishing(metadata: GameMetadata): boolean {
    const formatValidation = this.validateAllFieldFormats(metadata);
    const missingRequired = getMissingFields(metadata, this.mandatoryFields);
    
    return formatValidation.errors.length === 0 && missingRequired.length === 0;
  }

  /**
   * Get validation summary for UI display
   * 
   * @param metadata - Metadata to analyze
   * @returns Object with validation summary
   */
  getValidationSummary(metadata: GameMetadata): {
    completeness: number;
    hasErrors: boolean;
    hasWarnings: boolean;
    canPublish: boolean;
    errorCount: number;
    warningCount: number;
  } {
    const result = this.validateForDevelopment(metadata);
    
    return {
      completeness: result.completeness,
      hasErrors: result.formatErrors.length > 0,
      hasWarnings: result.warnings.length > 0,
      canPublish: this.isReadyForPublishing(metadata),
      errorCount: result.formatErrors.length,
      warningCount: result.warnings.length
    };
  }

  /**
   * Validate all field formats
   * 
   * @param metadata - Metadata to validate
   * @returns ValidationResult with errors
   */
  private validateAllFieldFormats(metadata: GameMetadata): { errors: string[] } {
    const errors: string[] = [];

    for (const [fieldName, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        const fieldResult = this.validateFieldFormat(fieldName, value);
        if (!fieldResult.valid && fieldResult.error) {
          errors.push(fieldResult.error);
        }
      }
    }

    return { errors };
  }

  /**
   * Generate helpful recommendations
   * 
   * @param metadata - Current metadata
   * @returns string[] - Recommendations
   */
  private generateRecommendations(metadata: GameMetadata): string[] {
    const recommendations: string[] = [];

    // Recommend adding lesson summary if missing
    if (!metadata.lessonSummary) {
      recommendations.push('Consider adding a lesson summary to help users understand the content');
    }

    // Recommend adding primary theme if missing
    if (!metadata.theme_primary) {
      recommendations.push('Adding a primary theme helps with categorization and discovery');
    }

    // Recommend adding difficulty levels for games
    if (!metadata.difficulty_levels || metadata.difficulty_levels.length === 0) {
      recommendations.push('Consider specifying difficulty levels to help users choose appropriate content');
    }

    // Recommend adding context tags
    if (!metadata.context_tags || metadata.context_tags.length === 0) {
      recommendations.push('Adding context tags improves searchability and organization');
    }

    // Recommend textbook association if missing
    if (!metadata.textbook && metadata.subject) {
      recommendations.push('Consider associating this game with a specific textbook or curriculum');
    }

    // Recommend secondary themes for rich content
    if (metadata.theme_primary && (!metadata.theme_secondary || metadata.theme_secondary.length === 0)) {
      recommendations.push('Consider adding secondary themes to provide more detailed categorization');
    }

    return recommendations;
  }

  /**
   * Validate text field
   */
  private validateTextField(fieldName: string, value: any, config: MetadataFieldConfig): FieldValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        error: `${config.label} must be a text value`,
        suggestion: 'Please provide a text value'
      };
    }

    // Check validation rules
    if (config.validation) {
      for (const rule of config.validation) {
        switch (rule.type) {
          case 'minLength':
            if (value.length < rule.value) {
              return {
                valid: false,
                error: rule.message,
                suggestion: `Please provide at least ${rule.value} characters`
              };
            }
            break;
          
          case 'maxLength':
            if (value.length > rule.value) {
              return {
                valid: false,
                error: rule.message,
                suggestion: `Please limit to ${rule.value} characters`
              };
            }
            break;
          
          case 'pattern':
            const regex = new RegExp(rule.value);
            if (!regex.test(value)) {
              return {
                valid: false,
                error: rule.message,
                suggestion: 'Please check the format of your input'
              };
            }
            break;
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validate number field
   */
  private validateNumberField(fieldName: string, value: any, config: MetadataFieldConfig): FieldValidationResult {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        valid: false,
        error: `${config.label} must be a valid number`,
        suggestion: 'Please provide a numeric value'
      };
    }

    // Special validation for lessonNo
    if (fieldName === 'lessonNo') {
      if (value < 1) {
        return {
          valid: false,
          error: 'Lesson number must be greater than 0',
          suggestion: 'Please provide a positive lesson number'
        };
      }
      
      if (!Number.isInteger(value)) {
        return {
          valid: false,
          error: 'Lesson number must be a whole number',
          suggestion: 'Please provide an integer value'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate select field
   */
  private validateSelectField(fieldName: string, value: any, config: MetadataFieldConfig): FieldValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        error: `${config.label} must be a text value`,
        suggestion: 'Please select a valid option'
      };
    }

    // Check if value is in allowed options (if options are defined)
    if (config.options && config.options.length > 0) {
      if (!config.options.includes(value)) {
        return {
          valid: false,
          error: `${config.label} must be one of: ${config.options.join(', ')}`,
          suggestion: `Please select from: ${config.options.join(', ')}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate tags field (array of strings)
   */
  private validateTagsField(fieldName: string, value: any, config: MetadataFieldConfig): FieldValidationResult {
    if (!Array.isArray(value)) {
      return {
        valid: false,
        error: `${config.label} must be an array of tags`,
        suggestion: 'Please provide an array of text values'
      };
    }

    // Check that all items are strings
    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string') {
        return {
          valid: false,
          error: `All ${config.label.toLowerCase()} must be text values`,
          suggestion: 'Please ensure all tags are text values'
        };
      }
    }

    // Check against allowed options if defined
    if (config.options && config.options.length > 0) {
      for (const tag of value) {
        if (!config.options.includes(tag)) {
          return {
            valid: false,
            error: `Invalid ${config.label.toLowerCase()}: ${tag}. Allowed values: ${config.options.join(', ')}`,
            suggestion: `Please use only these values: ${config.options.join(', ')}`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validate image field (URL or path)
   */
  private validateImageField(fieldName: string, value: any, config: MetadataFieldConfig): FieldValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        error: `${config.label} must be a URL or file path`,
        suggestion: 'Please provide a valid URL or file path'
      };
    }

    // Check if it's a valid URL
    try {
      new URL(value);
      return { valid: true };
    } catch {
      // Not a URL, check if it's a valid relative path
      if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
        return { valid: true };
      }
      
      // Check for common image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        value.toLowerCase().endsWith(ext)
      );
      
      if (!hasImageExtension) {
        return {
          valid: false,
          error: `${config.label} should be a valid URL or image file path`,
          suggestion: 'Please provide a URL or path to an image file (.jpg, .png, .gif, etc.)'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Update field configuration
   * 
   * @param newConfig - New field configuration
   */
  updateFieldConfig(newConfig: MetadataFieldConfig[]): void {
    this.fieldConfig = newConfig;
  }

  /**
   * Update mandatory fields list
   * 
   * @param newMandatoryFields - New mandatory fields list
   */
  updateMandatoryFields(newMandatoryFields: string[]): void {
    this.mandatoryFields = newMandatoryFields;
  }
}