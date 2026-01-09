#!/bin/bash
# Auto-update dependencies script for CI/CD
# This script checks for updates and can be run in automated environments

set -e

echo "🔄 Auto-updating dependencies..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check for @iruka-edu/game-core updates
echo "📦 Checking @iruka-edu/game-core..."
npm run check-game-core

# If there are updates available, install them
if npm run check-game-core 2>&1 | grep -q "Update available"; then
    echo "🆕 Updates found, installing..."
    npm run update-game-core
    
    # Run tests to ensure compatibility
    echo "🧪 Running tests..."
    npm test
    
    # If tests pass, commit the changes (optional, for automated environments)
    if [ "$AUTO_COMMIT" = "true" ]; then
        git add package.json pnpm-lock.yaml
        git commit -m "chore: update @iruka-edu/game-core to latest version"
        echo "✅ Changes committed"
    fi
else
    echo "✅ Already using latest version"
fi

echo "🎉 Auto-update completed"