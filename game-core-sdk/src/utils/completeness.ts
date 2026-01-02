import type { GameMetadata, MetadataCompleteness } from '../types';

/**
 * Calculate metadata completeness percentage
 * 
 * @param metadata - Game metadata to analyze
 * @param requiredFields - List of required fields
 * @returns Completeness percentage (0-100)
 */
export function calculateCompleteness(
  metadata: GameMetadata, 
  requiredFields: string[]
): number {
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
 * Get missing required fields from metadata
 * 
 * @param metadata - Game metadata to analyze
 * @param requiredFields - List of required fields
 * @returns Array of missing field names
 */
export function getMissingFields(
  metadata: GameMetadata, 
  requiredFields: string[]
): string[] {
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

/**
 * Get detailed completeness information
 * 
 * @param metadata - Game metadata to analyze
 * @param requiredFields - List of required fields
 * @param allPossibleFields - List of all possible fields (for optional calculation)
 * @returns Detailed completeness information
 */
export function getDetailedCompleteness(
  metadata: GameMetadata,
  requiredFields: string[],
  allPossibleFields: string[] = []
): MetadataCompleteness {
  const missingFields = getMissingFields(metadata, requiredFields);
  const completedFields = requiredFields.filter(field => !missingFields.includes(field));
  const percentage = calculateCompleteness(metadata, requiredFields);
  
  const optionalFields = allPossibleFields.filter(field => 
    !requiredFields.includes(field)
  );
  
  return {
    percentage,
    requiredFields,
    missingFields,
    completedFields,
    optionalFields
  };
}

/**
 * Check if metadata is complete for a given context
 * 
 * @param metadata - Game metadata to check
 * @param requiredFields - List of required fields
 * @returns True if all required fields are present and valid
 */
export function isMetadataComplete(
  metadata: GameMetadata, 
  requiredFields: string[]
): boolean {
  return getMissingFields(metadata, requiredFields).length === 0;
}