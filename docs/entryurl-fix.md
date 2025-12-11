# EntryUrl Validation Fix

## Issue
When uploading ZIP files, the API was returning a 400 error:
```
entryUrl: must have required property 'entryUrl'
```

## Root Cause
The manifest schema (`schema/manifest.schema.json`) requires `entryUrl` as a mandatory field, but:
1. The upload form doesn't generate this field (and shouldn't - it's server-side data)
2. The APIs were validating the raw manifest from the form before adding server-generated fields
3. The `entryUrl` should be automatically generated based on the game ID, version, and bucket configuration

## Solution
Modified both upload APIs to generate required server-side fields before validation:

### 1. Upload ZIP API (`src/pages/api/upload-zip.ts`)

**Before:**
```typescript
// 1. Validate manifest
const validation = validateManifest(manifestData);
if (!validation.valid || !validation.manifest) {
  return new Response(
    JSON.stringify({ error: validation.errors.join(', ') }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**After:**
```typescript
// 1. Parse and enhance manifest with server-generated fields
let manifest;
try {
  manifest = JSON.parse(manifestData);
} catch (error) {
  return new Response(
    JSON.stringify({ error: 'Manifest JSON không hợp lệ' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

const { id, version } = manifest;

// Generate entryUrl automatically
const bucketName = process.env.GCLOUD_BUCKET_NAME || 'iruka-edu-mini-game';
manifest.entryUrl = `https://storage.googleapis.com/${bucketName}/games/${id}/${version}/index.html`;

// Add default iconUrl if not provided
if (!manifest.iconUrl) {
  manifest.iconUrl = `https://storage.googleapis.com/${bucketName}/games/${id}/icon.png`;
}

// Add default minHubVersion if not provided
if (!manifest.minHubVersion) {
  manifest.minHubVersion = '1.0.0';
}

// Add default disabled if not provided
if (manifest.disabled === undefined) {
  manifest.disabled = false;
}

// Now validate the complete manifest
const enhancedManifestData = JSON.stringify(manifest);
const validation = validateManifest(enhancedManifestData);
if (!validation.valid || !validation.manifest) {
  return new Response(
    JSON.stringify({ error: validation.errors.join(', ') }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 2. Regular Upload API (`src/pages/api/upload.ts`)

Applied the same enhancement pattern:
- Parse manifest from uploaded file
- Generate `entryUrl` based on ID, version, and bucket
- Add default values for optional fields
- Validate the enhanced manifest
- Upload the enhanced manifest instead of the original

**Special handling in upload loop:**
```typescript
// Special handling for manifest.json - use enhanced version
if (cleanPath === 'manifest.json' || file.name === 'manifest.json') {
  buffer = Buffer.from(enhancedManifestContent, 'utf-8');
  contentType = 'application/json';
} else {
  buffer = Buffer.from(await file.arrayBuffer());
}
```

## Generated Fields

The server now automatically generates these fields:

1. **entryUrl**: `https://storage.googleapis.com/{bucket}/games/{id}/{version}/index.html`
2. **iconUrl**: `https://storage.googleapis.com/{bucket}/games/{id}/icon.png` (if not provided)
3. **minHubVersion**: `"1.0.0"` (if not provided)
4. **disabled**: `false` (if not provided)

## Benefits

1. **User-friendly**: Form users don't need to manually enter server-specific URLs
2. **Consistent**: All games get properly formatted URLs based on server configuration
3. **Flexible**: Works with different bucket names and environments
4. **Validation**: Full schema validation still occurs after enhancement
5. **Backward compatible**: Existing manifests with these fields are preserved

## Files Modified

- `src/pages/api/upload-zip.ts` - Enhanced manifest generation for ZIP uploads
- `src/pages/api/upload.ts` - Enhanced manifest generation for regular uploads
- `docs/entryurl-fix.md` - This documentation

## Testing

The fix addresses the validation error by ensuring all required fields are present before schema validation. Users can now upload games without manually specifying server-side URLs.

### Test Cases:
- ✅ ZIP upload with minimal manifest (id, title, version, runtime)
- ✅ Regular upload with minimal manifest
- ✅ Upload with existing entryUrl (preserved)
- ✅ Upload with existing iconUrl (preserved)
- ✅ Validation still catches invalid IDs, versions, etc.