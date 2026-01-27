import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameUrl } = body || {};

    if (!gameUrl || typeof gameUrl !== "string") {
      return NextResponse.json({ error: "Missing gameUrl" }, { status: 400 });
    }

    const runnerBase =
      process.env.RUNNER_URL || "https://runner-h7j3ksnhva-as.a.run.app";

    const r = await fetch(`${runnerBase}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameUrl }),
      // Cloud Run đôi khi chậm, nhưng fetch server-side ok.
    });

    const contentType = r.headers.get("content-type") || "application/json";
    const text = await r.text();

    // Pass-through status + body
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Runner proxy failed" },
      { status: 500 },
    );
  }
}
