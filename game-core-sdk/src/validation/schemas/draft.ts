import { z } from 'zod';

/**
 * Draft validation schema (permissive)
 * Allows incomplete or missing optional fields for development phase
 */
export const DraftMetadataSchema = z.object({
  // Core Educational Fields (MF-01) - all optional for draft
  gameType: z.string().optional(),
  subject: z.string().optional(),
  grade: z.union([z.string(), z.number()]).optional(),
  lessonNo: z.number().optional(),
  lessonSummary: z.string().optional(),
  textbook: z.string().optional(),
  
  // Visual Fields - optional for draft
  thumbnailUrl: z.string().optional(),
  
  // Categorization Fields - all optional for draft
  theme_primary: z.string().optional(),
  theme_secondary: z.array(z.string()).optional(),
  context_tags: z.array(z.string()).optional(),
  difficulty_levels: z.array(z.string()).optional(),
  
  // Schema Evolution Support
  schemaVersion: z.number().optional(),
}).passthrough(); // Allow additional fields for extensibility