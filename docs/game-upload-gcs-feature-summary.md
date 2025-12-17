# Game Upload to Google Cloud Storage (GCS) Feature Summary

## Overview

The Game Hub Manager implements a comprehensive game upload system that allows developers to upload HTML5 games to Google Cloud Storage (GCS) with automatic validation, manifest processing, and registry management. The system supports multiple upload methods and provides a complete workflow from upload to deployment.

## Architecture Overview

```mermaid
graph TB
    subgraph Client
        UI[Upload Form UI]
        DZ[Drag & Drop Zone]
        MF[Manifest Editor]
    end
    
    subgraph Upload Processing
        API[Upload API]
        ZIP[ZIP Processor]
        VAL[Validator]
    end
    
    subgraph Google Cloud Storage
        GCS[(GCS Bucket)]
        CDN[CDN URLs]
    end
    
    subgraph Registry System
        REG[Registry Manager]
        META[Game Metadata]
    end
    
    UI --> API
    DZ --> API
    MF --> API
    API --> ZIP
    API --> VAL
    VAL --> GCS
    ZIP --> GCS
    API --> REG
    REG --> META
    GCS --> CDN
```

## Core Components

### 1. Upload Interface (`src/components/GameUploadForm.astro`)

**Multi-Method Upload Support:**
- **File Upload**: Select individual files
- **Folder Upload**: Upload entire directory structure
- **ZIP Upload**: Upload and auto-extract ZIP files (recommended)
- **Drag & Drop**: Support for all upload methods

**Key Features:**
- Real-time file validation
- Progress tracking with folder-level details
- Manifest editor with form and JSON views
- Requirements checklist with live validation
- File size limits (10MB max, 3MB recommended)

**Upload Flow:**
1. User selects upload method (Files/Folder/ZIP)
2. System validates file structure and requirements
3. Manifest editor appears (auto-populated if manifest.json exists)
4. User completes manifest information
5. Real-time validation provides feedback
6. Upload proceeds with progress tracking

### 2. Google Cloud Storage Integration (`src/lib/gcs.ts`)

**Multi-Credential Support:**
```typescript
// Method 1: Individual fields (Vercel-friendly)
GCLOUD_CLIENT_EMAIL + GCLOUD_PRIVATE_KEY

// Method 2: JSON string
GCLOUD_CREDENTIALS (full JSON)

// Method 3: File path (local development)
GOOGLE_APPLICATION_CREDENTIALS
```

**Core Functions:**
- `uploadBuffer()` - Upload files with proper content types and caching
- `getFileContent()` - Download and parse JSON files
- `saveFileContent()` - Save JSON with proper headers
- `deleteFiles()` - Bulk delete with prefix matching
- `listFiles()` - List files under prefix

**CDN Integration:**
- Automatic CDN URL generation: `https://storage.googleapis.com/{bucket}/games/{id}/{version}/`
- Optimized caching headers: `public, max-age=31536000, immutable` for assets
- No-cache for HTML files to ensure fresh content

### 3. Upload API Endpoints

#### Regular Upload (`src/pages/api/upload.ts`)

**Process Flow:**
1. **Credential Validation** - Check GCS credentials early
2. **Manifest Processing** - Find and enhance manifest.json
3. **File Organization** - Group files by folder structure
4. **Path Cleaning** - Handle various folder structures (dist/, build/, etc.)
5. **Sequential Upload** - Upload folder by folder for organization
6. **Registry Update** - Update game registry with new version

**Enhanced Manifest Generation:**
```typescript
// Auto-generated fields
manifest.entryUrl = `https://storage.googleapis.com/${bucket}/games/${id}/${version}/index.html`;
manifest.iconUrl = `https://storage.googleapis.com/${bucket}/games/${id}/icon.png`;
manifest.minHubVersion = '1.0.0';
manifest.disabled = false;
```

#### ZIP Upload (`src/pages/api/upload-zip.ts`)

**ZIP Processing Features:**
- **Smart Extraction** - Handles various ZIP structures
- **Root Folder Detection** - Automatically removes build folders (dist/, build/, etc.)
- **Path Normalization** - Cleans up file paths for consistent structure
- **Content Type Detection** - Automatic MIME type assignment
- **Progress Tracking** - Detailed extraction and upload progress

**ZIP Structure Handling:**
```
Input ZIP structures supported:
- game.zip/index.html (flat structure)
- game.zip/dist/index.html (build folder - auto-removed)
- game.zip/my-game/index.html (project folder - auto-removed)
```

### 4. Validation System (`src/lib/validator.ts`)

**Multi-Level Validation:**

**File Structure Validation:**
- ✅ `index.html` presence (entry point)
- ✅ `manifest.json` presence and validity
- ✅ File size limits (10MB max, 3MB warning)

**Manifest Validation:**
- **ID Format**: Must start with `com.iruka.` + kebab-case slug
- **Version**: Semantic versioning (x.y.z) with prerelease detection
- **Title**: 3-40 characters, no emojis, proper casing
- **Runtime**: `iframe-html` or `esm-module`
- **Capabilities**: Validated against allowed list

**Enhanced Validation Features:**
```typescript
// Validation categories
errors: string[]      // Blocking issues
warnings: string[]    // Non-blocking concerns  
suggestions: string[] // Improvement recommendations
```

### 5. Registry Management (`src/lib/registry.ts`)

**Game Registry Structure:**
```typescript
interface GameEntry {
  id: string;
  title: string;
  activeVersion: string;        // Currently deployed version
  versions: VersionInfo[];      // All uploaded versions
  entryUrl: string;             // CDN URL to active version
  manifest: GameManifest;       // Active version manifest
  updatedAt: string;
  owner?: string;
  capabilities?: string[];
}
```

**Version Management:**
- **Auto-Activation** - New versions automatically become active
- **Version History** - Complete history of all uploads
- **Rollback Support** - Can activate any previous version
- **Migration Support** - Handles legacy registry formats

**Registry Operations:**
- `updateGame()` - Add/update game versions
- `setActiveVersion()` - Promote/rollback versions
- `deleteVersion()` - Remove specific versions (with safety checks)
- `deleteGame()` - Remove entire game

### 6. Permission System Integration

**Role-Based Upload Access:**
- **Dev Role**: Can upload games (status: draft)
- **Admin Role**: Can upload and immediately publish
- **Other Roles**: No upload access

**Upload Page Protection:**
```typescript
// Auth check in upload.astro
const canUpload = hasRole('dev') || hasRole('admin');
if (!canUpload) {
  return Astro.redirect('/dashboard?error=unauthorized');
}
```

## Game Workflow Integration

### Upload to Deployment Flow

```mermaid
graph LR
    A[Dev Upload] --> B[Draft Status]
    B --> C[Submit for QC]
    C --> D[QC Review]
    D --> E[CTO/CEO Approval]
    E --> F[Admin Publish]
    F --> G[Live on CDN]
    
    style A fill:#e1f5fe
    style G fill:#e8f5e8
```

**Status Progression:**
1. **Draft** - Initial upload state
2. **Uploaded** - Submitted for QC review
3. **QC Passed** - Quality check approved
4. **Approved** - Management approval received
5. **Published** - Live and accessible to users

### CDN and Access Patterns

**File Structure on GCS:**
```
bucket/
├── games/
│   └── com.iruka.my-game/
│       ├── 1.0.0/
│       │   ├── index.html
│       │   ├── manifest.json
│       │   ├── assets/
│       │   └── ...
│       └── 1.1.0/
│           └── ...
└── registry/
    └── index.json
```

**Access URLs:**
- **Game Entry**: `https://storage.googleapis.com/{bucket}/games/{id}/{version}/index.html`
- **Assets**: `https://storage.googleapis.com/{bucket}/games/{id}/{version}/assets/image.png`
- **Registry**: `https://storage.googleapis.com/{bucket}/registry/index.json`

## Technical Implementation Details

### File Processing Pipeline

**1. Upload Preparation:**
```typescript
// File organization by folder
const filesByFolder: Record<string, File[]> = {};
files.forEach(file => {
  const cleanPath = cleanupFilePath(file.webkitRelativePath || file.name);
  const folderPath = getFolderPath(cleanPath);
  filesByFolder[folderPath] = filesByFolder[folderPath] || [];
  filesByFolder[folderPath].push(file);
});
```

**2. Path Normalization:**
```typescript
// Handle various folder structures
let cleanPath = relativePath;
if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

// Remove build folders
const pathParts = cleanPath.split('/');
if (pathParts.length > 1) {
  const rootFolder = pathParts[0].toLowerCase();
  if (['dist', 'build', 'public', 'output'].includes(rootFolder)) {
    cleanPath = pathParts.slice(1).join('/');
  }
}
```

**3. Content Type Detection:**
```typescript
const getContentType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css', 
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    // ... more types
  };
  return types[ext] || 'application/octet-stream';
};
```

### Error Handling and Recovery

**Upload Resilience:**
- Individual file upload failures don't stop the entire process
- Detailed error reporting per file
- Automatic retry logic for transient failures
- Graceful degradation for partial uploads

**Validation Feedback:**
- Real-time validation during file selection
- Progressive enhancement of manifest data
- Clear error categorization (errors vs warnings vs suggestions)
- Actionable error messages with fix suggestions

### Performance Optimizations

**Upload Efficiency:**
- Folder-by-folder upload for better organization
- Parallel processing where possible
- Progress tracking with granular feedback
- Smart caching headers for optimal CDN performance

**Client-Side Optimizations:**
- File validation before upload starts
- Manifest pre-processing and enhancement
- Real-time UI updates without blocking
- Efficient drag-and-drop handling

## Configuration and Environment

### Required Environment Variables

```bash
# GCS Configuration
GCLOUD_PROJECT_ID=your-project-id
GCLOUD_BUCKET_NAME=your-bucket-name

# Credentials (choose one method)
# Method 1: Individual fields (recommended for Vercel)
GCLOUD_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GCLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Method 2: JSON string
GCLOUD_CREDENTIALS='{"type":"service_account",...}'

# Method 3: File path (local development)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### GCS Bucket Setup

**Required Permissions:**
- `storage.objects.create` - Upload files
- `storage.objects.delete` - Delete files
- `storage.objects.get` - Read files
- `storage.objects.list` - List files

**CORS Configuration:**
```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## Usage Examples

### Basic Upload Flow

1. **Navigate to Upload Page**: `/upload` (dev/admin only)
2. **Select Upload Method**: Choose Files/Folder/ZIP
3. **Drag & Drop or Browse**: Select game files
4. **Manifest Configuration**: Auto-filled or manual entry
5. **Validation**: Real-time feedback and requirements check
6. **Upload**: Progress tracking and completion
7. **Registry Update**: Automatic game registration

### Manifest Example

```json
{
  "id": "com.iruka.bubble-shooter",
  "title": "Bubble Shooter Game",
  "version": "1.2.0",
  "runtime": "iframe-html",
  "capabilities": ["score", "audio", "save-progress"],
  "minHubVersion": "1.0.0",
  "disabled": false,
  "entryUrl": "https://storage.googleapis.com/bucket/games/com.iruka.bubble-shooter/1.2.0/index.html",
  "iconUrl": "https://storage.googleapis.com/bucket/games/com.iruka.bubble-shooter/icon.png"
}
```

## Benefits and Features

### Developer Experience
- **Multiple Upload Methods** - Flexibility for different workflows
- **Real-time Validation** - Immediate feedback prevents errors
- **Progress Tracking** - Clear visibility into upload status
- **Manifest Editor** - User-friendly configuration interface
- **Error Recovery** - Graceful handling of upload issues

### System Benefits
- **Scalable Storage** - Google Cloud Storage handles any load
- **Global CDN** - Fast game loading worldwide
- **Version Management** - Complete history and rollback capability
- **Automated Processing** - Minimal manual intervention required
- **Security** - Role-based access and validation

### Operational Advantages
- **Centralized Registry** - Single source of truth for all games
- **Automated Deployment** - Seamless integration with approval workflow
- **Monitoring** - Detailed logging and error tracking
- **Maintenance** - Easy cleanup and version management

The Game Upload to GCS feature provides a robust, scalable foundation for managing HTML5 games in the Game Hub Manager system, with comprehensive validation, multiple upload methods, and seamless integration with the approval workflow.