#!/usr/bin/env node
/**
 * Setup GitHub authentication for @iruka-edu/game-core package
 * 
 * Usage:
 *   tsx scripts/setup-github-auth.ts
 *   tsx scripts/setup-github-auth.ts --check
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function loadEnvFile(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    const env: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value;
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

function checkGitHubAuth(): void {
  console.log('🔐 GitHub Authentication Checker');
  console.log('='.repeat(40));

  // Check environment variable
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    console.log('✅ GITHUB_TOKEN found in environment variables');
    console.log(`   Token: ${envToken.substring(0, 8)}...`);
    return;
  }

  // Check .env file
  const envFile = loadEnvFile();
  const fileToken = envFile.GITHUB_TOKEN;
  
  if (fileToken) {
    console.log('✅ GITHUB_TOKEN found in .env file');
    console.log(`   Token: ${fileToken.substring(0, 8)}...`);
    console.log('');
    console.log('💡 To use it, run commands with dotenv:');
    console.log('   pnpm dlx dotenv-cli -- npm run update-game-core');
    return;
  }

  // No token found
  console.log('❌ GITHUB_TOKEN not found');
  console.log('');
  console.log('📝 To setup GitHub authentication:');
  console.log('');
  console.log('1. Create a GitHub Personal Access Token:');
  console.log('   - Go to: https://github.com/settings/tokens');
  console.log('   - Generate new token (classic)');
  console.log('   - Select scopes: read:packages');
  console.log('');
  console.log('2. Add token to .env file:');
  console.log('   GITHUB_TOKEN=your_token_here');
  console.log('');
  console.log('3. Or set as environment variable:');
  console.log('   export GITHUB_TOKEN=your_token_here  # Linux/Mac');
  console.log('   $env:GITHUB_TOKEN="your_token_here"  # Windows PowerShell');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check') || args.length === 0) {
    checkGitHubAuth();
  } else {
    console.log('Usage: tsx scripts/setup-github-auth.ts [--check]');
  }
}

main();