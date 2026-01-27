#!/usr/bin/env node
/**
 * Force update @iruka-edu/game-core to latest version
 * This script bypasses version checking and always installs latest
 *
 * Usage:
 *   npm run force-update-game-core
 *   tsx scripts/force-update-game-core.ts
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

async function forceUpdateGameCore() {
  console.log("🚀 Force updating @iruka-edu/game-core to latest version");
  console.log("=".repeat(60));

  // Check if GITHUB_TOKEN is available
  if (!process.env.GAME_HUB_MANAGER_GITHUB_TOKEN) {
    console.log("⚠️  GITHUB_TOKEN not found in environment variables");
    console.log(
      "   This package is hosted on GitHub Packages and requires authentication",
    );
    console.log("   Please set GITHUB_TOKEN in your environment or .env file");
    console.log("");
    console.log("💡 Alternative: Use the existing installed version");

    try {
      const installedPackagePath = join(
        process.cwd(),
        "node_modules",
        "@iruka-edu",
        "game-core",
        "package.json",
      );
      const installedPackage = JSON.parse(
        readFileSync(installedPackagePath, "utf8"),
      );
      console.log(`📦 Currently installed: ${installedPackage.version}`);
    } catch (error) {
      console.log("📦 Package not currently installed");
    }

    return;
  }

  try {
    // Step 1: Remove current installation
    console.log("🗑️  Removing current installation...");
    try {
      execSync("pnpm remove @iruka-edu/game-core", { stdio: "inherit" });
    } catch (error) {
      console.log("   (Package not found, continuing...)");
    }

    // Step 2: Install latest version
    console.log("📦 Installing latest version...");
    execSync("pnpm add @iruka-edu/game-core@latest", { stdio: "inherit" });

    // Step 3: Update package.json to use "latest" tag
    console.log("📝 Updating package.json...");
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    if (packageJson.dependencies) {
      packageJson.dependencies["@iruka-edu/game-core"] = "latest";
      writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
      );
      console.log('✅ Updated package.json to use "latest" tag');
    }

    // Step 4: Show installed version
    try {
      const installedPackagePath = join(
        process.cwd(),
        "node_modules",
        "@iruka-edu",
        "game-core",
        "package.json",
      );
      const installedPackage = JSON.parse(
        readFileSync(installedPackagePath, "utf8"),
      );
      console.log(
        `✅ Successfully installed version: ${installedPackage.version}`,
      );
    } catch (error) {
      console.log(
        "✅ Installation completed (could not read installed version)",
      );
    }

    console.log("\n🎉 Force update completed successfully!");
    console.log("💡 Consider running tests to ensure compatibility:");
    console.log("   npm test");
  } catch (error) {
    console.error(
      "❌ Force update failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script
forceUpdateGameCore().catch(console.error);
