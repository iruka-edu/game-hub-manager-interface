# Game Info & Edit Pages Fix

## Issue
When clicking "Xem thông tin" or "Sửa thông tin" in the GameCard dropdown menu, users were getting unhandled rejection errors because these routes didn't exist:
- `/games/${game.id}` - "Xem thông tin" (View game info)
- `/games/${game.id}/edit` - "Sửa thông tin" (Edit game info)

The catch-all route `[...path].ts` was trying to serve these as files from GCS, causing 404 errors and unhandled rejections.

## Solution

### 1. Created Game Info Page
**File**: `src/pages/games/[id]/index.astro`

A comprehensive game information page that displays:
- **Game Header**: Title, ID, active version, version count
- **Basic Information**: ID, title, version, runtime, owner, last updated
- **Capabilities**: Visual tags for game features
- **URLs**: Entry URL and Icon URL with direct links
- **Quick Actions**: Play, manage versions, edit buttons
- **Version Summary**: Total versions, latest version, active version
- **Manifest JSON**: Full manifest with copy button

**Features**:
- ✅ Clean, professional layout with sidebar
- ✅ Direct links to play game and manage versions
- ✅ Copy manifest JSON to clipboard
- ✅ Responsive design
- ✅ Error handling for missing games

### 2. Created Game Edit Page
**File**: `src/pages/games/[id]/edit.astro`

A comprehensive game editing interface that allows:
- **Basic Information**: Edit title, runtime, owner
- **Capabilities**: Tag-based selector for game features
- **URLs**: Edit icon URL (entry URL is auto-generated)
- **Advanced Settings**: Min Hub version, disable game option
- **Form Validation**: Client-side and server-side validation
- **Preview**: Direct link to test game

**Features**:
- ✅ Interactive capabilities selector (same as upload form)
- ✅ Form validation with user-friendly error messages
- ✅ Preview functionality
- ✅ Proper form state management
- ✅ Breadcrumb navigation

### 3. Created Update API Endpoint
**File**: `src/pages/api/games/update.ts`

A robust API endpoint for updating game information:
- **Validation**: Comprehensive validation for all fields
- **Registry Update**: Updates both game entry and manifest
- **Error Handling**: Detailed error messages
- **Capabilities Validation**: Ensures only valid capabilities
- **URL Validation**: Validates icon URLs

**Validation Rules**:
- Title: 3-40 characters
- Runtime: Must be 'iframe-html' or 'esm-module'
- Capabilities: Must be from predefined list
- Icon URL: Must be valid URL with image extension
- Min Hub Version: Must follow x.y.z format

## Route Structure

The new route structure properly handles game management:

```
/games/[id]                   → Game info page
/games/[id]/edit              → Game edit page  
/games/[id]/versions          → Version management page
/games/[game]/[...path]       → File serving from GCS
```

This prevents conflicts and ensures each route handles its intended purpose.

## UI/UX Features

### Game Info Page:
1. **Professional Layout**
   - Header with game title and quick actions
   - Two-column layout with main content and sidebar
   - Clean information display with proper spacing

2. **Interactive Elements**
   - Copy manifest JSON button
   - Direct links to play game
   - Quick access to version management and editing

3. **Information Rich**
   - All game metadata clearly displayed
   - Visual capability tags
   - Version summary with status indicators

### Game Edit Page:
1. **User-Friendly Form**
   - Grouped sections for better organization
   - Interactive capability selector
   - Clear field labels and help text

2. **Validation & Feedback**
   - Real-time form validation
   - Clear error messages
   - Loading states during submission

3. **Safety Features**
   - Preview functionality before saving
   - Confirmation for destructive actions
   - Proper form state management

## API Integration

The pages integrate with existing and new API endpoints:
- `GET /api/games/list` - For loading game data
- `POST /api/games/update` - For updating game information
- `POST /api/games/set-active` - For version management
- `DELETE /api/games/delete` - For deletion operations

## Files Created

- `src/pages/games/[id]/index.astro` - Game information page
- `src/pages/games/[id]/edit.astro` - Game editing page
- `src/pages/api/games/update.ts` - Update API endpoint
- `docs/game-info-pages-fix.md` - This documentation

## Testing

The fix addresses the unhandled rejection by:
1. ✅ Providing proper routes for game info and editing
2. ✅ Adding comprehensive game management interface
3. ✅ Implementing robust validation and error handling
4. ✅ Maintaining consistent UI/UX with existing pages

Users can now access game information and editing without errors, and have full-featured interfaces for managing games.

## Benefits

1. **Complete Game Management**: Users can view and edit all game properties
2. **Professional Interface**: Clean, consistent design matching the dashboard
3. **Robust Validation**: Prevents invalid data from being saved
4. **User-Friendly**: Clear navigation, helpful error messages, and intuitive controls
5. **Error Prevention**: Proper route handling eliminates unhandled rejections

The GameCard dropdown menu now works properly with fully functional "Xem thông tin" and "Sửa thông tin" options! 🎉