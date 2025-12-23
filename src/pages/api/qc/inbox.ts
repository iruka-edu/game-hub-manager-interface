import type { APIRoute } from "astro";
import { getMongoClient } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/session";

export type QCInboxItem = {
  versionId: string;
  gameId: string;
  gameTitle: string;
  devName: string;
  version: string;
  submittedAt: string;
  retestCount: number;
};

/**
 * Get QC inbox items (only for QC or admin)
 * @route GET /api/qc/inbox
 * @return {QCInboxItem[]} list of games with uploaded versions
 * @throws {Response} 403 if user is not QC or admin
 * @throws {Response} 500 if internal server error occurs
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // 1) Auth (QC hoặc admin)
    const user = await getUserFromRequest(request);
    const roles = user?.roles ?? [];
    if (!user || (!roles.includes("qc") && !roles.includes("admin"))) {
      return new Response(JSON.stringify({ error: "QC/Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Aggregation: game_versions (status uploaded) -> games -> users -> qc_reviews count
    const { db } = await getMongoClient();
    const gameVersionsCol = db.collection("game_versions");

    const pipeline: any[] = [
      // 1) Lọc inbox
      {
        $match: {
          status: "uploaded",
          isDeleted: { $ne: true },
        },
      },

      // 2) Chuẩn hoá gameId -> ObjectId (phòng khi gameId là string)
      {
        $addFields: {
          gameIdObj: {
            $cond: [
              { $eq: [{ $type: "$gameId" }, "objectId"] },
              "$gameId",
              {
                $cond: [
                  { $eq: [{ $type: "$gameId" }, "string"] },
                  { $toObjectId: "$gameId" },
                  null,
                ],
              },
            ],
          },
        },
      },

      // 3) Join games: game_versions.gameIdObj == games._id
      {
        $lookup: {
          from: "games",
          let: { gid: "$gameIdObj" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$gid"] } } },
            { $project: { title: 1, ownerId: 1, isDeleted: 1 } },
          ],
          as: "game",
        },
      },
      { $unwind: "$game" },

      // (optional) bỏ game bị xoá
      {
        $match: {
          "game.isDeleted": { $ne: true },
        },
      },

      // 4) Convert ownerId string -> ObjectId để lookup users
      {
        $addFields: {
          ownerIdObj: {
            $cond: [
              { $eq: [{ $type: "$game.ownerId" }, "objectId"] },
              "$game.ownerId",
              {
                $cond: [
                  { $and: [{ $eq: [{ $type: "$game.ownerId" }, "string"] }, { $ne: ["$game.ownerId", ""] }] },
                  { $toObjectId: "$game.ownerId" },
                  null,
                ],
              },
            ],
          },
        },
      },

      // 5) Join users: users._id == ownerIdObj
      {
        $lookup: {
          from: "users",
          let: { oid: "$ownerIdObj" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$oid"] } } },
            { $project: { name: 1, email: 1 } },
          ],
          as: "dev",
        },
      },
      { $unwind: { path: "$dev", preserveNullAndEmptyArrays: true } },

      // 6) Count qc_reviews theo versionId
      {
        $lookup: {
          from: "qc_reviews",
          let: { vId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$versionId", "$$vId"] } } },
            { $count: "count" },
          ],
          as: "qcCount",
        },
      },

      // 7) computed fields
      {
        $addFields: {
          retestCount: {
            $ifNull: [{ $arrayElemAt: ["$qcCount.count", 0] }, 0],
          },
          submittedAtSafe: { $ifNull: ["$submittedAt", "$createdAt"] },
        },
      },

      // 8) Output đúng contract FE
      {
        $project: {
          _id: 0,
          versionId: { $toString: "$_id" },
          gameId: { $toString: "$gameIdObj" },
          gameTitle: "$game.title",
          devName: {
            $ifNull: ["$dev.name", { $ifNull: ["$dev.email", "Unknown"] }],
          },
          version: "$version",
          submittedAt: {
            $dateToString: {
              date: "$submittedAtSafe",
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
          retestCount: 1,
        },
      },

      // 9) sort
      { $sort: { submittedAt: 1 } },
    ];

    const items = (await gameVersionsCol.aggregate(pipeline).toArray()) as QCInboxItem[];

    console.log("QC inbox items:", items);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("QC inbox error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
