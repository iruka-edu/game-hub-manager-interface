#!/usr/bin/env node
/**
 * Script to update @iruka-edu/game-core to the latest version
 * 
 * Usage:
 *   npm run update-game-core
 *   tsx scripts/update-game-core.ts
 *   tsx scripts/update-game-core.ts --check-only  # Only check for updates
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageInfo {
  name: string;
  version: string;
  'dist-tags': {
    latest: string;
  };
}

class GameCoreUpdater {
  private packageJsonPath = join(process.cwd(), 'package.json');

  /**
   * Get current installed version from node_modules
   */
  getInstalledVersion(): string | null {
    try {
      const packagePath = join(process.cwd(), 'node_modules', '@iruka-edu', 'game-core', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      return null;
    }
  }
  /**
   * Get current installed version
   */
  getCurrentVersion(): string | null {
    try {
      const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
      const version = packageJson.dependencies?.['@iruka-edu/game-core'];
      
      if (!version) {
        console.log('❌ @iruka-edu/game-core not found in dependencies');
        return null;
      }

      // Remove ^ or ~ prefix if present
      return version.replace(/^[\^~]/, '');
    } catch (error) {
      console.error('❌ Error reading package.json:', error.message);
      return null;
    }
  }

  /**
   * Get latest available version from npm registry
   */
  async getLatestVersion(): Promise<string | null> {
    try {
      console.log('🔍 Checking for latest version...');
      
      // Use npm view to get package info
      const result = execSync('npm view @iruka-edu/game-core version --json', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const version = JSON.parse(result.trim());
      return typeof version === 'string' ? version : version.latest || null;
    } catch (error) {
      console.warn('⚠️  Could not fetch latest version from registry');
      console.warn('   This might be due to authentication or network issues');
      return null;
    }
  }

  /**
   * Compare versions (simple string comparison for now)
   */
  isNewerVersion(current: string, latest: string): boolean {
    // Simple semver comparison
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  /**
   * Check if GitHub token is available for authentication
   */
  checkAuthentication(): boolean {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⚠️  GITHUB_TOKEN not found in environment variables');
      console.log('   This package is hosted on GitHub Packages and requires authentication');
      console.log('   Please set GITHUB_TOKEN in your environment or .env file');
      return false;
    }
    return true;
  }

  /**
   * Update the package to latest version
   */
  async updateToLatest(): Promise<boolean> {
    try {
      console.log('📦 Installing latest version...');
      
      execSync('pnpm add @iruka-edu/game-core@latest', {
        stdio: 'inherit'
      });

      console.log('✅ Successfully updated @iruka-edu/game-core');
      return true;
    } catch (error) {
      console.error('❌ Failed to update package:', error.message);
      return false;
    }
  }

  /**
   * Update package.json to use latest tag
   */
  updatePackageJson(): void {
    try {
      const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
      
      if (packageJson.dependencies?.['@iruka-edu/game-core']) {
        packageJson.dependencies['@iruka-edu/game-core'] = 'latest';
        
        writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ Updated package.json to use "latest" tag');
      }
    } catch (error) {
      console.error('❌ Failed to update package.json:', error.message);
    }
  }

  /**
   * Main update process
   */
  async run(checkOnly: boolean = false): Promise<void> {
    console.log('🚀 Game Core Updater');
    console.log('='.repeat(40));

    // Check authentication first
    if (!this.checkAuthentication()) {
      return;
    }

    const currentVersion = this.getCurrentVersion();
    if (!currentVersion) {
      console.log('💡 Run: npm run setup');
      return;
    }

    console.log(`📋 Current version: ${currentVersion}`);

    // Also show installed version if different
    const installedVersion = this.getInstalledVersion();
    if (installedVersion && installedVersion !== currentVersion) {
      console.log(`📦 Installed version: ${installedVersion}`);
    }

    const latestVersion = await this.getLatestVersion();
    if (!latestVersion) {
      console.log('⚠️  Could not determine latest version');
      if (!checkOnly) {
        console.log('🔄 Attempting to update anyway...');
        await this.updateToLatest();
      }
      return;
    }

    console.log(`📋 Latest version:  ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log('✅ Already using the latest version!');
      return;
    }

    if (this.isNewerVersion(currentVersion, latestVersion)) {
      console.log('🆕 Update available!');
      
      if (checkOnly) {
        console.log('💡 Run: npm run update-game-core');
        return;
      }

      const success = await this.updateToLatest();
      if (success) {
        console.log('\n📝 Updating package.json to use "latest" tag...');
        this.updatePackageJson();
        
        console.log('\n🎉 Update completed successfully!');
        console.log('💡 Consider running tests to ensure compatibility');
      }
    } else {
      console.log('ℹ️  Current version is newer than registry (development version?)');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');

  try {
    const updater = new GameCoreUpdater();
    await updater.run(checkOnly);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);