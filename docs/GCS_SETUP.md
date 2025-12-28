# Google Cloud Storage Setup Guide

This guide will help you set up and deploy the Google Cloud Storage configuration for the game hub manager.

## Prerequisites

Before running the deployment script, you need to have the following installed:

### 1. Google Cloud SDK

The Google Cloud SDK provides the `gcloud` command-line tool needed to manage your GCS bucket.

**Installation on Windows:**

1. Download the installer from: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow the prompts
3. Restart your terminal/PowerShell after installation
4. Verify installation:
   ```powershell
   gcloud --version
   ```

**Alternative (using Chocolatey):**

```powershell
choco install gcloudsdk
```

### 2. Authentication

After installing the SDK, authenticate with your Google Cloud account:

```powershell
gcloud auth login
```

This will open a browser window for you to sign in with your Google account.

## Configuration Files

The following files are used for storage configuration:

- **`storage-cors.json`**: Defines CORS rules for your bucket
- **`scripts/deploy-storage.ps1`**: PowerShell deployment script
- **`scripts/deploy-storage.sh`**: Bash deployment script (for Linux/macOS/Git Bash)

## Running the Deployment

Once you have the Google Cloud SDK installed and authenticated, run:

```powershell
npm run deploy:storage
```

This will:

1. Set the active GCP project to `noted-aloe-474810-u1`
2. Enable Uniform Bucket-Level Access on the bucket
3. Apply CORS configuration from `storage-cors.json`
4. Grant public read access (`allUsers` as `roles/storage.objectViewer`)

## Troubleshooting

### Error: "gcloud is not recognized"

**Cause:** Google Cloud SDK is not installed or not in your PATH.

**Solution:**

1. Install the Google Cloud SDK (see Prerequisites above)
2. Restart your terminal
3. Verify with `gcloud --version`

### Error: "You do not currently have an active account selected"

**Cause:** Not authenticated with Google Cloud.

**Solution:**

```powershell
gcloud auth login
```

### Error: "Permission denied" or "403 Forbidden"

**Cause:** Your account doesn't have permission to modify the bucket.

**Solution:**

1. Ensure you're logged in with the correct account
2. Verify you have Owner or Storage Admin role on the project
3. Contact your GCP administrator if needed

### Error: "Bucket not found"

**Cause:** The bucket name in the script doesn't match your actual bucket.

**Solution:**

1. Verify the bucket name in `scripts/deploy-storage.ps1`
2. Update `BUCKET_NAME` variable if needed

## Manual Deployment (Alternative)

If you prefer to run commands manually instead of using the script:

```powershell
# Set project
gcloud config set project noted-aloe-474810-u1

# Enable Uniform Bucket-Level Access
gcloud storage buckets update gs://iruka-edu-mini-game --uniform-bucket-level-access

# Apply CORS
gcloud storage buckets update gs://iruka-edu-mini-game --cors-file=storage-cors.json

# Grant public read access
gcloud storage buckets add-iam-policy-binding gs://iruka-edu-mini-game --member="allUsers" --role="roles/storage.objectViewer"
```

## Security Notes

- **Public Read Access**: Files in the bucket are publicly readable, but CORS restrictions prevent unauthorized domains from embedding your content
- **Write Access**: Only authenticated users with proper IAM roles can upload files
- **File Validation**: Server-side validation in `src/pages/api/upload.ts` ensures only valid file types are uploaded

## Next Steps

After successful deployment:

1. Verify CORS settings in the [GCP Console](https://console.cloud.google.com/storage)
2. Test file uploads through your admin interface
3. Verify games load correctly from the CDN
