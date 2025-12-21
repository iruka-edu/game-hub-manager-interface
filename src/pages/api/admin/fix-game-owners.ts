import type { APIRoute } from "astro";
import { getUserFromRequest } from "../../../lib/session";
import { hasPermissionString } from "../../../auth/auth-rbac";
import { getMongoClient } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * POST /api/admin/fix-game-owners
 *
 * Admin endpoint to fix missing ownerId in games collection.
 * This addresses the issue where games were uploaded before the ownerId fix was implemented.
 *
 * Logic:
 * 1. Find all games missing ownerId or having empty ownerId
 * 2. For each game, look at its GameVersion records
 * 3. Use the most recent version's 'submittedBy' as the ownerId
 * 4. If no versions found, fallback to the first admin user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Auth check
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Permission check - only admin can run this
    if (!hasPermissionString(user, "system:admin")) {
      return new Response(
        JSON.stringify({ error: "Forbidden. Admin permission required." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { db } = await getMongoClient();
    const gamesColl = db.collection("games");
    const versionsColl = db.collection("game_versions");
    const usersColl = db.collection("users");

    console.log("[Fix Game Owners] Starting patch process...");

    // 1. Find an admin user for fallback
    const adminUser = await usersColl.findOne({ roles: "admin" });
    if (!adminUser) {
      console.error("[Fix Game Owners] No admin user found for fallback");
      return new Response(
        JSON.stringify({
          error: "No admin user found in database for fallback",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Find games with missing ownerId
    const gamesToFix = await gamesColl
      .find({
        $or: [
          { ownerId: { $exists: false } },
          { ownerId: null },
          { ownerId: "" },
        ],
      })
      .toArray();

    console.log(`[Fix Game Owners] Found ${gamesToFix.length} games to fix`);

    const results = {
      total: gamesToFix.length,
      fixed: 0,
      failed: 0,
      details: [] as Array<{
        gameId: string;
        title: string;
        status: "success" | "failed";
        newOwnerId?: string;
        method?: "version" | "admin_fallback";
        error?: string;
      }>,
    };

    // 3. Process each game
    for (const game of gamesToFix) {
      console.log(
        `[Fix Game Owners] Processing game: ${game.gameId} (${game.title})`
      );

      const detail: {
        gameId: string;
        title: string;
        status: "success" | "failed";
        newOwnerId?: string;
        method?: "version" | "admin_fallback";
        error?: string;
      } = {
        gameId: game.gameId,
        title: game.title || game.gameId,
        status: "failed",
      };

      try {
        // Try to find versions to get an owner
        const versions = await versionsColl
          .find({ gameId: game._id })
          .sort({ submittedAt: -1 })
          .limit(1)
          .toArray();

        let newOwnerId = "";
        let method: "version" | "admin_fallback" = "admin_fallback";

        if (versions.length > 0 && versions[0].submittedBy) {
          newOwnerId = versions[0].submittedBy.toString();
          method = "version";
          console.log(
            `[Fix Game Owners]   Found owner from version: ${newOwnerId}`
          );
        } else {
          newOwnerId = adminUser._id.toString();
          method = "admin_fallback";
          console.log(
            `[Fix Game Owners]   Falling back to admin owner: ${newOwnerId}`
          );
        }

        // Update the game
        const updateResult = await gamesColl.updateOne(
          { _id: game._id },
          { $set: { ownerId: newOwnerId, updatedAt: new Date() } }
        );

        if (updateResult.modifiedCount === 1) {
          console.log(`[Fix Game Owners]   ✓ Successfully updated`);
          detail.status = "success";
          detail.newOwnerId = newOwnerId;
          detail.method = method;
          results.fixed++;
        } else {
          console.log(
            `[Fix Game Owners]   ✗ Failed to update (no rows modified)`
          );
          detail.error = "No rows modified during update";
          results.failed++;
        }
      } catch (error) {
        console.error(`[Fix Game Owners]   ✗ Error processing game:`, error);
        detail.error = error instanceof Error ? error.message : "Unknown error";
        results.failed++;
      }

      results.details.push(detail);
    }

    console.log(
      `[Fix Game Owners] Patch completed. Fixed: ${results.fixed}, Failed: ${results.failed}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Game owner fix completed. Fixed ${results.fixed} games, ${results.failed} failed.`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Fix Game Owners] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
