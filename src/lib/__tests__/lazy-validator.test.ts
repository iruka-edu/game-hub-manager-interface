import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LazyValidator } from '../lazy-validator';
import { GameMetadata, DEFAULT_MANDATORY_FIELDS } from '../metadata-types';

describe('LazyValidator', () => {
  let validator: LazyValidator;

  beforeEach(() => {
    validator = new LazyValidator();
  });

  // Property 8: Development Phase Permissiveness
  describe('Property 8: Development Phase Permissiveness', () => {
    it('should accept incomplete metadata, provide warnings for missing fields, and calculate completeness without blocking operations', () => {
      fc.assert(fc.property(
        fc.record({
          gameType: fc.option(fc.oneof(fc.constant('quiz'), fc.constant('puzzle'), fc.constant('simulation'))),
          subject: fc.option(fc.string()),
          grade: fc.option(fc.string()),
          lessonNo: fc.option(fc.integer({ min: 1, max: 100 })),
          thumbnailUrl: fc.option(fc.webUrl()),
          theme_primary: fc.option(fc.string()),
          lessonSummary: fc.option(fc.string())
        }),
        (metadata: Partial<GameMetadata>) => {
          const result = validator.validateForDevelopment(metadata);
          
          // Should never block operations (no format errors for missing fields)
          const missingFieldErrors = result.formatErrors.filter(error => 
            error.includes('cannot be empty') && !error.includes('must be')
          );
          expect(missingFieldErrors.length).toBe(0);
          
          // Should provide warnings for missing required fields
          const missingRequired = DEFAULT_MANDATORY_FIELDS.filter(field => 
            !metadata[field] || metadata[field] === '' || 
            (Array.isArray(metadata[field]) && metadata[field].length === 0)
          );
          
          if (missingRequired.length > 0) {
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(warning => 
              warning.includes('Missing required fields')
            )).toBe(true);
          }
          
          // Should calculate completeness percentage
          expect(result.completeness).toBeGreaterThanOrEqual(0);
          expect(result.completeness).toBeLessThanOrEqual(100);
          expect(Number.isInteger(result.completeness)).toBe(true);
          
          // Should provide recommendations
          expect(Array.isArray(result.recommendations)).toBe(true);
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  // Property 9: Format Validation During Development
  describe('Property 9: Format Validation During Development', () => {
    it('should validate field formats and data types while allowing missing values', () => {
      fc.assert(fc.property(
        fc.record({
          lessonNo: fc.option(fc.oneof(
            fc.integer({ min: 1, max: 100 }), // Valid
            fc.string(), // Invalid type
            fc.float() // Invalid (should be integer)
          )),
          theme_secondary: fc.option(fc.oneof(
            fc.array(fc.string()), // Valid
            fc.string() // Invalid type
          )),
          gameType: fc.option(fc.oneof(
            fc.constant('quiz'), // Valid
            fc.integer() // Invalid type
          ))
        }),
        (metadata: Partial<GameMetadata>) => {
          const result = validator.validateForDevelopment(metadata);
          
          // Missing values (null/undefined) should not cause format errors
          for (const [key, value] of Object.entries(metadata)) {
            if (value === undefined || value === null) {
              const fieldErrors = result.formatErrors.filter(error => 
                error.toLowerCase().includes(key.toLowerCase())
              );
              expect(fieldErrors.length).toBe(0);
            }
          }
          
          // Test specific invalid type cases
          if (metadata.lessonNo !== undefined && metadata.lessonNo !== null && typeof metadata.lessonNo === 'string' && metadata.lessonNo !== '') {
            expect(result.formatErrors.some(error => 
              error.includes('must be a valid number')
            )).toBe(true);
          }
          
          if (metadata.lessonNo !== undefined && metadata.lessonNo !== null && typeof metadata.lessonNo === 'number' && isNaN(metadata.lessonNo)) {
            expect(result.formatErrors.some(error => 
              error.includes('must be a valid number')
            )).toBe(true);
          }
          
          if (metadata.theme_secondary !== undefined && metadata.theme_secondary !== null && typeof metadata.theme_secondary === 'string') {
            expect(result.formatErrors.some(error => 
              error.includes('must be an array')
            )).toBe(true);
          }
          
          if (metadata.gameType !== undefined && metadata.gameType !== null && typeof metadata.gameType === 'number') {
            expect(result.formatErrors.some(error => 
              error.includes('must be a text value')
            )).toBe(true);
          }
          
          return true;
        }
      ), { numRuns: 50 });
    });
  });

  describe('Individual Field Validation', () => {
    it('should validate text fields correctly', () => {
      // Valid text
      expect(validator.validateFieldFormat('subject', 'Math').valid).toBe(true);
      expect(validator.validateFieldFormat('theme_primary', 'Algebra').valid).toBe(true);
      
      // Invalid type
      expect(validator.validateFieldFormat('subject', 123).valid).toBe(false);
      expect(validator.validateFieldFormat('theme_primary', []).valid).toBe(false);
      
      // Missing values should be valid (lazy validation)
      expect(validator.validateFieldFormat('subject', undefined).valid).toBe(true);
      expect(validator.validateFieldFormat('subject', null).valid).toBe(true);
    });

    it('should validate number fields correctly', () => {
      // Valid numbers
      expect(validator.validateFieldFormat('lessonNo', 5).valid).toBe(true);
      expect(validator.validateFieldFormat('lessonNo', 1).valid).toBe(true);
      
      // Invalid numbers
      expect(validator.validateFieldFormat('lessonNo', 0).valid).toBe(false);
      expect(validator.validateFieldFormat('lessonNo', -1).valid).toBe(false);
      expect(validator.validateFieldFormat('lessonNo', 3.14).valid).toBe(false);
      
      // Invalid types
      expect(validator.validateFieldFormat('lessonNo', 'not-a-number').valid).toBe(false);
      expect(validator.validateFieldFormat('lessonNo', []).valid).toBe(false);
      
      // Missing values should be valid
      expect(validator.validateFieldFormat('lessonNo', undefined).valid).toBe(true);
    });

    it('should validate select fields correctly', () => {
      // Valid selections
      expect(validator.validateFieldFormat('gameType', 'quiz').valid).toBe(true);
      expect(validator.validateFieldFormat('gameType', 'puzzle').valid).toBe(true);
      
      // Invalid selections (not in options)
      expect(validator.validateFieldFormat('gameType', 'invalid-type').valid).toBe(false);
      
      // Invalid types
      expect(validator.validateFieldFormat('gameType', 123).valid).toBe(false);
      expect(validator.validateFieldFormat('gameType', []).valid).toBe(false);
      
      // Missing values should be valid
      expect(validator.validateFieldFormat('gameType', undefined).valid).toBe(true);
    });

    it('should validate tags fields correctly', () => {
      // Valid arrays
      expect(validator.validateFieldFormat('theme_secondary', ['algebra', 'geometry']).valid).toBe(true);
      expect(validator.validateFieldFormat('context_tags', ['k12', 'exam-prep']).valid).toBe(true);
      expect(validator.validateFieldFormat('theme_secondary', []).valid).toBe(true);
      
      // Invalid types
      expect(validator.validateFieldFormat('theme_secondary', 'not-an-array').valid).toBe(false);
      expect(validator.validateFieldFormat('theme_secondary', 123).valid).toBe(false);
      
      // Invalid array contents
      expect(validator.validateFieldFormat('theme_secondary', ['valid', 123]).valid).toBe(false);
      
      // Missing values should be valid
      expect(validator.validateFieldFormat('theme_secondary', undefined).valid).toBe(true);
    });

    it('should validate image fields correctly', () => {
      // Valid URLs
      expect(validator.validateFieldFormat('thumbnailUrl', 'https://example.com/image.png').valid).toBe(true);
      expect(validator.validateFieldFormat('thumbnailUrl', 'http://example.com/thumb.jpg').valid).toBe(true);
      
      // Valid relative paths
      expect(validator.validateFieldFormat('thumbnailUrl', '/images/thumb.png').valid).toBe(true);
      expect(validator.validateFieldFormat('thumbnailUrl', './assets/image.jpg').valid).toBe(true);
      
      // Valid file paths with extensions
      expect(validator.validateFieldFormat('thumbnailUrl', 'image.png').valid).toBe(true);
      expect(validator.validateFieldFormat('thumbnailUrl', 'thumb.jpg').valid).toBe(true);
      
      // Invalid types
      expect(validator.validateFieldFormat('thumbnailUrl', 123).valid).toBe(false);
      expect(validator.validateFieldFormat('thumbnailUrl', []).valid).toBe(false);
      
      // Invalid paths (no image extension)
      expect(validator.validateFieldFormat('thumbnailUrl', 'not-an-image.txt').valid).toBe(false);
      
      // Missing values should be valid
      expect(validator.validateFieldFormat('thumbnailUrl', undefined).valid).toBe(true);
    });
  });

  describe('Recommendations', () => {
    it('should provide helpful recommendations for incomplete metadata', () => {
      const incompleteMetadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math'
      };
      
      const recommendations = validator.getRecommendations(incompleteMetadata);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('lesson summary'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('primary theme'))).toBe(true);
    });

    it('should provide fewer recommendations for complete metadata', () => {
      const completeMetadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math',
        grade: 'Grade 1',
        lessonNo: 5,
        thumbnailUrl: 'https://example.com/thumb.png',
        lessonSummary: 'Basic addition and subtraction',
        theme_primary: 'Arithmetic',
        theme_secondary: ['addition', 'subtraction'],
        context_tags: ['k12', 'basic-math'],
        difficulty_levels: ['easy'],
        textbook: 'Canh Dieu'
      };
      
      const recommendations = validator.getRecommendations(completeMetadata);
      
      // Should have fewer recommendations for complete metadata
      expect(recommendations.length).toBeLessThan(3);
    });
  });

  describe('Publishing Readiness', () => {
    it('should correctly identify when metadata is ready for publishing', () => {
      const readyMetadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math',
        grade: 'Grade 1',
        lessonNo: 5,
        thumbnailUrl: 'https://example.com/thumb.png'
      };
      
      expect(validator.isReadyForPublishing(readyMetadata)).toBe(true);
      
      const notReadyMetadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math'
        // Missing required fields
      };
      
      expect(validator.isReadyForPublishing(notReadyMetadata)).toBe(false);
    });

    it('should provide accurate validation summary', () => {
      const metadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math',
        lessonNo: 'invalid' as any // Format error
      };
      
      const summary = validator.getValidationSummary(metadata);
      
      expect(summary.hasErrors).toBe(true);
      expect(summary.hasWarnings).toBe(true);
      expect(summary.canPublish).toBe(false);
      expect(summary.errorCount).toBeGreaterThan(0);
      expect(summary.completeness).toBeGreaterThan(0);
      expect(summary.completeness).toBeLessThan(100);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow updating field configuration', () => {
      const newConfig = [
        {
          name: 'customField',
          label: 'Custom Field',
          type: 'text' as const,
          required: true,
          status: 'active' as const
        }
      ];
      
      validator.updateFieldConfig(newConfig);
      
      // Should validate against new configuration
      const result = validator.validateFieldFormat('customField', 'test value');
      expect(result.valid).toBe(true);
    });

    it('should allow updating mandatory fields', () => {
      validator.updateMandatoryFields(['gameType', 'customField']);
      
      const metadata: GameMetadata = {
        gameType: 'quiz'
        // Missing customField
      };
      
      const result = validator.validateForDevelopment(metadata);
      expect(result.warnings.some(warning => 
        warning.includes('customField')
      )).toBe(true);
    });
  });
});

// Feature: extensible-metadata-system, Property 8: Development Phase Permissiveness
// Feature: extensible-metadata-system, Property 9: Format Validation During Development