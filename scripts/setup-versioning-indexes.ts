#!/usr/bin/env node
/**
 * Setup database indexes for the versioning system
 *
 * Usage:
 *   npx ts-node scripts/setup-versioning-indexes.ts
 */

import { GameRepository } from "../src/models/Game";
import { GameVersionRepository } from "../src/models/GameVersion";
import { QCReportRepository } from "../src/models/QcReport";
import { closeConnection } from "../src/lib/mongodb";

async function main() {
  console.log("=".repeat(60));
  console.log("Game Versioning System - Index Setup");
  console.log("=".repeat(60));
  console.log("");

  try {
    console.log("[Indexes] Setting up indexes for games collection...");
    const gameRepo = await GameRepository.getInstance();
    await gameRepo.ensureIndexes();
    console.log("  ✓ games indexes created");

    console.log("[Indexes] Setting up indexes for game_versions collection...");
    const versionRepo = await GameVersionRepository.getInstance();
    await versionRepo.ensureIndexes();
    console.log("  ✓ game_versions indexes created");

    console.log("[Indexes] Setting up indexes for qc_reports collection...");
    const qcRepo = await QCReportRepository.getInstance();
    await qcRepo.ensureIndexes();
    console.log("  ✓ qc_reports indexes created");

    console.log("");
    console.log("=".repeat(60));
    console.log("Index Summary");
    console.log("=".repeat(60));
    console.log("");
    console.log("games:");
    console.log("  - { gameId: 1 } (unique)");
    console.log("  - { ownerId: 1 }");
    console.log("  - { isDeleted: 1 }");
    console.log("  - { subject: 1, grade: 1 }");
    console.log("");
    console.log("game_versions:");
    console.log("  - { gameId: 1 }");
    console.log("  - { gameId: 1, version: 1 } (unique)");
    console.log("  - { status: 1 }");
    console.log("  - { submittedAt: -1 }");
    console.log("");
    console.log("qc_reports:");
    console.log("  - { versionId: 1 }");
    console.log("  - { gameId: 1, createdAt: -1 }");
    console.log("  - { qcUserId: 1 }");
    console.log("  - { decision: 1 }");
    console.log("  - { createdAt: -1 }");
    console.log("");
    console.log("✓ All indexes created successfully!");

    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Index setup failed:", error);
    await closeConnection();
    process.exit(1);
  }
}

// Run the setup
main();
