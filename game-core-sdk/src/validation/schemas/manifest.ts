import { z } from 'zod';

/**
 * Game manifest validation schema
 * Based on the existing manifest.schema.json but using Zod
 */
export const GameManifestSchema = z.object({
  id: z.string()
    .max(64)
    .regex(/^com\.iruka\.[a-z](?:[a-z0-9]*)(?:-[a-z0-9]+)*$/, 
      "ID must follow com.iruka.<slug> format with kebab-case"),
  
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(40, "Title must be at most 40 characters")
    .regex(/^(?!\s)(?!.*\s$)(?![A-Z\s]+$)[^\p{Cc}\p{Cs}\p{So}]{3,40}$/u,
      "Title: 3-40 characters, no emoji/control characters, no leading/trailing spaces, not all UPPERCASE"),
  
  version: z.string()
    .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][\da-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][\da-zA-Z-]*))*)?(?:\+[\da-zA-Z-]+(\.[\da-zA-Z-]+)*)?$/,
      "Version must follow Semantic Versioning (SemVer)"),
  
  runtime: z.enum(["iframe-html", "esm-module"], {
    errorMap: () => ({ message: "Runtime must be 'iframe-html' or 'esm-module'" })
  }),
  
  entryUrl: z.string()
    .url("Entry URL must be a valid URL")
    .regex(/^https:\/\/.+\/games\/com\.iruka\.[a-z](?:[a-z0-9]*)(?:-[a-z0-9]+)*\/(0|[1-9]\d*\.\d+\.\d+)\/index\.html$/,
      "Entry URL must match id and version, ending with /index.html"),
  
  iconUrl: z.string()
    .url("Icon URL must be a valid URL")
    .regex(/^https:\/\/.+\.(png|jpg|jpeg|webp|svg)$/,
      "Icon URL must point to PNG, JPG, JPEG, WebP, or SVG file")
    .optional(),
  
  capabilities: z.array(
    z.enum(["score", "save-progress", "levels", "hints", "audio", "telemetry", "leaderboard"])
  ).optional(),
  
  minHubVersion: z.string()
    .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
      "Minimum Hub version must follow semantic versioning (major.minor.patch)")
    .optional(),
  
  disabled: z.boolean().optional()
}).strict(); // Don't allow additional properties for manifest

/**
 * Type inference for GameManifest
 */
export type GameManifest = z.infer<typeof GameManifestSchema>;