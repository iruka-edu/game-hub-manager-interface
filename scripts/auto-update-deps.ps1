# Auto-update dependencies script for Windows/PowerShell
# This script checks for updates and can be run in automated environments

param(
    [switch]$AutoCommit = $false
)

Write-Host "🔄 Auto-updating dependencies..." -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository" -ForegroundColor Red
    exit 1
}

try {
    # Check for @iruka-edu/game-core updates
    Write-Host "📦 Checking @iruka-edu/game-core..." -ForegroundColor Yellow
    
    $checkResult = & npm run check-game-core 2>&1
    $checkOutput = $checkResult -join "`n"
    
    if ($checkOutput -match "Update available") {
        Write-Host "🆕 Updates found, installing..." -ForegroundColor Green
        & npm run update-game-core
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to update @iruka-edu/game-core"
        }
        
        # Run tests to ensure compatibility
        Write-Host "🧪 Running tests..." -ForegroundColor Yellow
        & npm test
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Tests failed after update" -ForegroundColor Yellow
            Write-Host "   Please review the changes manually" -ForegroundColor Yellow
        }
        
        # If tests pass and auto-commit is enabled, commit the changes
        if ($AutoCommit -and $LASTEXITCODE -eq 0) {
            git add package.json pnpm-lock.yaml
            git commit -m "chore: update @iruka-edu/game-core to latest version"
            Write-Host "✅ Changes committed" -ForegroundColor Green
        }
    }
    else {
        Write-Host "✅ Already using latest version" -ForegroundColor Green
    }
    
    Write-Host "🎉 Auto-update completed" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Auto-update failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}