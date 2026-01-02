import { z } from 'zod';

/**
 * Publish validation schema (strict)
 * Enforces all mandatory fields for publishing
 */
export const PublishMetadataSchema = z.object({
  // Core Educational Fields (MF-01) - required for publishing
  gameType: z.string().min(1, { message: "Game type is required for publishing" }),
  subject: z.string().min(1, { message: "Subject is required for publishing" }),
  grade: z.union([z.string(), z.number()]).refine(
    val => val !== null && val !== undefined && val !== '',
    { message: "Grade level is required for publishing" }
  ),
  lessonNo: z.number().min(1, { message: "Lesson number must be greater than 0" }),
  lessonSummary: z.string().optional(),
  textbook: z.string().optional(),
  
  // Visual Fields - thumbnailUrl required for publishing
  thumbnailUrl: z.string().url({ message: "Thumbnail must be a valid URL" }),
  
  // Categorization Fields - optional but validated if present
  theme_primary: z.string().optional(),
  theme_secondary: z.array(z.string()).optional(),
  context_tags: z.array(z.string()).optional(),
  difficulty_levels: z.array(z.string()).min(1, { 
    message: "At least one difficulty level is required if specified" 
  }).optional(),
  
  // Schema Evolution Support
  schemaVersion: z.number().optional(),
}).passthrough(); // Allow additional fields for extensibility