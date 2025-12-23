import type { APIRoute } from "astro";
import { ObjectId } from "mongodb";
import { getMongoClient } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/session";

/**
 * @route POST /api/qc/review
 */

// ===== Types =====
type QcResult = "pass" | "fail";
type QcItemStatus = "ok" | "warning" | "fail";
type Severity = "minor" | "major" | "critical";

type ReviewPayload = {
  gameId: string;
  versionId: string;
  result: QcResult;
  checklist: Record<string, QcItemStatus>;
  note?: string;
  severity?: Severity;
};

function isQcItemStatus(v: any): v is QcItemStatus {
  return v === "ok" || v === "warning" || v === "fail";
}

function isQcResult(v: any): v is QcResult {
  return v === "pass" || v === "fail";
}

function isSeverity(v: any): v is Severity {
  return v === "minor" || v === "major" || v === "critical";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1) Auth
    const user = await getUserFromRequest(request);
    const roles = user?.roles ?? [];
    if (!user || (!roles.includes("qc") && !roles.includes("admin"))) {
      return new Response(JSON.stringify({ error: "QC/Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Parse body
    const body = (await request.json()) as Partial<ReviewPayload>;

    // 3) Validate basic fields
    if (!body.gameId || !ObjectId.isValid(body.gameId)) {
      return new Response(JSON.stringify({ error: "Invalid gameId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.versionId || !ObjectId.isValid(body.versionId)) {
      return new Response(JSON.stringify({ error: "Invalid versionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!isQcResult(body.result)) {
      return new Response(JSON.stringify({ error: "Invalid result" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.checklist || typeof body.checklist !== "object") {
      return new Response(JSON.stringify({ error: "checklist is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate checklist values
    for (const [k, v] of Object.entries(body.checklist)) {
      if (!isQcItemStatus(v)) {
        return new Response(
          JSON.stringify({ error: `Invalid checklist value for "${k}"` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Severity required if fail
    if (body.result === "fail") {
      if (!body.severity || !isSeverity(body.severity)) {
        return new Response(
          JSON.stringify({ error: 'severity is required when result is "fail"' }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const gameIdObj = new ObjectId(body.gameId);
    const versionIdObj = new ObjectId(body.versionId);

    // 4) DB
    const { db } = await getMongoClient();
    const versionsCol = db.collection("game_versions");
    const qcReviewsCol = db.collection("qc_reviews");

    // 5) Atomic gate: chỉ cho submit nếu status đang là uploaded
    const newStatus = body.result === "pass" ? "qc_passed" : "qc_failed";
    const now = new Date();

    const updated = await versionsCol.findOneAndUpdate(
      {
        _id: versionIdObj,
        gameId: gameIdObj,
        status: "uploaded",
        isDeleted: { $ne: true },
      },
      {
        $set: {
          status: newStatus,
          updatedAt: now,
          // optional: lưu thời điểm QC xong
          qcReviewedAt: now,
          qcReviewedBy: user._id, // nếu user._id là ObjectId
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      // driver cũ có thể trả null
      return new Response(
        JSON.stringify({ error: "Update failed unexpectedly" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mongo driver tuỳ phiên bản:
    // - một số trả { value: ... }
    // - một số trả thẳng doc
    const updatedDoc: any = (updated as any).value ?? updated;

    if (!updatedDoc) {
      // Không match filter => không còn uploaded / sai gameId/versionId
      return new Response(
        JSON.stringify({
          error: 'Version is not in "uploaded" status (already reviewed or invalid)',
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6) Insert qc review history
    await qcReviewsCol.insertOne({
      gameId: gameIdObj,
      versionId: versionIdObj,
      reviewerId: user._id, // theo system của bạn
      reviewerEmail: user.email,
      result: body.result,
      severity: body.result === "fail" ? body.severity : undefined,
      checklist: body.checklist,
      note: body.note ?? "",
      createdAt: now,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        gameId: body.gameId,
        versionId: body.versionId,
        status: newStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("QC submit review error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
