# GCS Deployment Quick-Start Checklist

Follow these steps to deploy your Google Cloud Storage configuration.

## ☐ Step 1: Install Google Cloud SDK

Choose one method:

### Method A: Using winget (Recommended)

```powershell
winget install Google.CloudSDK
```

### Method B: Direct Download

1. Visit: https://cloud.google.com/sdk/docs/install
2. Download the Windows installer (`.exe` file)
3. Run the installer
4. Follow the installation wizard
5. ✅ Check "Run `gcloud init`" at the end (optional but helpful)

### Method C: Using Chocolatey

```powershell
choco install gcloudsdk
```

## ☐ Step 2: Restart Terminal

**Important**: Close and reopen your PowerShell/terminal after installation.

## ☐ Step 3: Verify Installation

```powershell
gcloud --version
```

You should see output like:

```
Google Cloud SDK 456.0.0
...
```

## ☐ Step 4: Authenticate

```powershell
gcloud auth login
```

This will:

- Open your browser
- Ask you to sign in with your Google account
- Grant permissions to the gcloud CLI

## ☐ Step 5: Verify Project Access

```powershell
gcloud config set project noted-aloe-474810-u1
gcloud projects describe noted-aloe-474810-u1
```

Ensure you have access to the project.

## ☐ Step 6: Run Deployment

```powershell
npm run deploy:storage
```

## Expected Output

If successful, you should see:

```
=== Bắt đầu cấu hình Google Cloud Storage (Native) ===
>>> Thiết lập project noted-aloe-474810-u1...
>>> Bật Uniform Bucket-Level Access...
>>> Cập nhật CORS từ file storage-cors.json...
>>> Cấp quyền Public Read cho user...
=== Hoàn tất! Bucket đã sẵn sàng. ===
```

## Troubleshooting

### ❌ "gcloud is not recognized"

- SDK not installed or terminal not restarted
- **Fix**: Install SDK and restart terminal

### ❌ "You do not currently have an active account selected"

- Not authenticated
- **Fix**: Run `gcloud auth login`

### ❌ "Permission denied" or "403 Forbidden"

- Insufficient permissions
- **Fix**: Ensure your account has Owner or Storage Admin role

### ❌ "Bucket not found"

- Bucket name mismatch
- **Fix**: Verify bucket name in `scripts/deploy-storage.ps1`

## Verification

After deployment, verify in GCP Console:

1. Go to: https://console.cloud.google.com/storage/browser/iruka-edu-mini-game
2. Click on "Permissions" tab
3. Verify `allUsers` has "Storage Object Viewer" role
4. Click on "Configuration" tab
5. Verify CORS is configured

## Next Steps

- ✅ Test file uploads through your admin interface
- ✅ Verify games load correctly from CDN
- ✅ Check browser console for CORS errors (should be none)
