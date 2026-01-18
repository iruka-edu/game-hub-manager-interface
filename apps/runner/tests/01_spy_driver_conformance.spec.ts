import { test, expect, type TestInfo } from "@playwright/test";
import { mustEnv, withE2E } from "./_utils/env";
import { hubLoadGameAndInit, hubWaitForType, hubGetLastGameMsg } from "./_utils/hub";
import { getGameFrame } from "./_utils/frame";
import { attachArtifactsOnFailure } from "./_utils/artifacts";
import { runSummary } from "./_utils/runSummary";

test.describe.configure({ mode: "serial" });

// ===== Helpers =====

function addWarning(testInfo: TestInfo, msg: string, warnings: string[]) {
  warnings.push(msg);
  console.warn(`[E2E WARNING] ${msg}`);
  testInfo.annotations.push({ type: "warning", description: msg });
  runSummary.addWarning(msg);
}

function sanitizeForArtifact(v: any, maxChars = 20_000) {
  const seen = new WeakSet<object>();

  function walk(x: any): any {
    if (x === null || x === undefined) return x;
    if (typeof x !== "object") return x;
    if (seen.has(x)) return "[Circular]";
    seen.add(x);

    if (Array.isArray(x)) return x.map(walk);

    const out: any = {};
    for (const [k, val] of Object.entries(x)) {
      if (/token|secret|password/i.test(k)) out[k] = "[REDACTED]";
      else out[k] = walk(val);
    }
    return out;
  }

  const obj = walk(v);
  try {
    const json = JSON.stringify(obj);
    if (json.length <= maxChars) return obj;
    return { truncated: true, preview: json.slice(0, maxChars) + "…" };
  } catch {
    return { unserializable: true };
  }
}

function validateCompletePayload(payload: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== "object") {
    errors.push("COMPLETE.payload must be an object");
    return { ok: false, errors, warnings };
  }

  if (typeof payload.timeMs !== "number" || !Number.isFinite(payload.timeMs)) {
    errors.push("COMPLETE.payload.timeMs is required and must be a finite number");
  } else if (payload.timeMs < 0) {
    errors.push("COMPLETE.payload.timeMs must be >= 0");
  }

  if ("score" in payload && payload.score !== undefined) {
    if (typeof payload.score !== "number" || !Number.isFinite(payload.score)) {
      errors.push("COMPLETE.payload.score (if present) must be a finite number");
    }
  } else {
    warnings.push("COMPLETE.payload.score is missing (optional).");
  }

  // extras can be either:
  // - extras: { finalScore, accuracy, ... }
  // - extras: { stats: { finalScore, accuracy, ... }, reason?: string }
  const extras = payload.extras;

  if (extras === undefined) {
    warnings.push("COMPLETE.payload.extras is missing (recommended).");
    return { ok: errors.length === 0, errors, warnings };
  }
  if (!extras || typeof extras !== "object") {
    errors.push("COMPLETE.payload.extras (if present) must be an object");
    return { ok: errors.length === 0, errors, warnings };
  }

  const statsObj =
    (extras as any).stats && typeof (extras as any).stats === "object"
      ? (extras as any).stats
      : extras;

  const recNum01 = (k: string, min = 0, max = 1) => {
    if (!(k in statsObj)) {
      warnings.push(`extras.${(extras as any).stats ? "stats." : ""}${k} is missing (recommended).`);
      return;
    }
    const v = (statsObj as any)[k];
    if (typeof v !== "number" || !Number.isFinite(v)) errors.push(`${k} must be a finite number`);
    else if (v < min || v > max) errors.push(`${k} must be in [${min}, ${max}]`);
  };

  const recNum = (k: string) => {
    if (!(k in statsObj)) {
      warnings.push(`extras.${(extras as any).stats ? "stats." : ""}${k} is missing (recommended).`);
      return;
    }
    const v = (statsObj as any)[k];
    if (typeof v !== "number" || !Number.isFinite(v)) errors.push(`${k} must be a finite number`);
    else if (v < 0) errors.push(`${k} must be >= 0`);
  };

  recNum("hintCount");
  recNum("mistakeCount");
  recNum("retryCount");
  recNum01("completion", 0, 1);
  recNum01("accuracy", 0, 1);

  if (!("completion_history" in statsObj)) {
    warnings.push(`extras.${(extras as any).stats ? "stats." : ""}completion_history is missing (recommended).`);
  } else if (!Array.isArray((statsObj as any).completion_history)) {
    errors.push("completion_history must be an array (if present).");
  }

  return { ok: errors.length === 0, errors, warnings };
}

function countSummary(summary: Record<string, number>, k: string) {
  return summary[k] ?? 0;
}

function normalizeCapabilities(rawCaps: any): { capSet: Set<string>; raw: any; normalized: string[] } {
  const rawArr = Array.isArray(rawCaps) ? rawCaps : null;
  const normalized = (rawArr ?? [])
    .filter((x) => typeof x === "string")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // alias map
  const mapped = normalized.map((c) => {
    if (c === "hints") return "hint";
    if (c === "timers" || c === "timing") return "timer";
    if (c === "save-load" || c === "save/load") return "save_load";
    if (c === "set-state") return "set_state";
    return c;
  });

  return { capSet: new Set(mapped), raw: rawCaps, normalized: mapped };
}

// ===== Tests =====

test("Smoke: __irukaSpy + __irukaTest tồn tại (e2e=1)", async ({ page }, testInfo) => {
  const GAME_URL = mustEnv("GAME_URL");
  const HUB_URL = process.env.HUB_URL || "http://127.0.0.1:4173/hub.html";

  runSummary.startRun({ gameUrl: withE2E(GAME_URL), hubUrl: HUB_URL });

  await page.goto(HUB_URL);
  await hubLoadGameAndInit(page, withE2E(GAME_URL));

  await hubWaitForType(page, "READY", 20_000);
  const frame = await getGameFrame(page);

  try {
    await frame.waitForFunction(() => !!(window as any).__irukaSpy, null, { timeout: 20_000 });
    await frame.waitForFunction(() => !!(window as any).__irukaTest, null, { timeout: 20_000 });
    runSummary.upsertCheck({ id: "E2E_HOOKS", severity: "blocker", ok: true });
  } catch (e: any) {
    runSummary.upsertCheck({
      id: "E2E_HOOKS",
      severity: "blocker",
      ok: false,
      message: e?.message ?? "Missing __irukaSpy/__irukaTest",
    });
    throw e;
  } finally {
    await attachArtifactsOnFailure({ page, frame, testInfo });
    runSummary.finalize();
  }
});

test("Conformance: capabilities REQUIRED; stats REQUIRED; claimed hint/timer must be observed; COMPLETE schema", async ({ page }, testInfo) => {
  const GAME_URL = mustEnv("GAME_URL");
  const HUB_URL = process.env.HUB_URL || "http://127.0.0.1:4173/hub.html";

  const warnings: string[] = [];

  runSummary.startRun({ gameUrl: withE2E(GAME_URL), hubUrl: HUB_URL });

  await page.goto(HUB_URL);
  await hubLoadGameAndInit(page, withE2E(GAME_URL));

  await hubWaitForType(page, "READY", 20_000);
  const readyMsg = await hubGetLastGameMsg(page, "READY");

  // 1) capabilities MUST exist and be string[]
  const rawCaps = readyMsg?.payload?.capabilities;

  if (!Array.isArray(rawCaps)) {
    runSummary.upsertCheck({
      id: "CAPABILITIES_PRESENT",
      severity: "blocker",
      ok: false,
      message: "READY.payload.capabilities is REQUIRED (string[])",
      details: { got: rawCaps },
    });
    expect(Array.isArray(rawCaps), "READY.payload.capabilities is REQUIRED (string[])").toBe(true);
  }

  const { capSet, raw, normalized } = normalizeCapabilities(rawCaps);

  // attach caps for debug
  const capsArtifact = sanitizeForArtifact({ raw, normalized });
  runSummary.writeArtifact("readyCaps", "readyCaps.json", capsArtifact);
  await testInfo.attach("readyCaps.json", {
    body: Buffer.from(JSON.stringify(capsArtifact, null, 2)),
    contentType: "application/json",
  });

  runSummary.upsertCheck({ id: "CAPABILITIES_PRESENT", severity: "blocker", ok: true });

  // 2) stats MUST exist (vì bạn muốn check correct/wrong cho mọi game)
  if (!capSet.has("stats")) {
    runSummary.upsertCheck({
      id: "CAP_STATS_REQUIRED",
      severity: "blocker",
      ok: false,
      message: "capabilities MUST include 'stats' to enforce correct/wrong checks",
      details: { normalizedCaps: Array.from(capSet) },
    });
    expect(capSet.has("stats"), "capabilities MUST include 'stats'").toBe(true);
  } else {
    runSummary.upsertCheck({ id: "CAP_STATS_REQUIRED", severity: "blocker", ok: true });
  }

  const hasHint = capSet.has("hint");
  const hasTimer = capSet.has("timer");

  const frame = await getGameFrame(page);

  try {
    await frame.waitForFunction(() => !!(window as any).__irukaSpy, null, { timeout: 20_000 });
    await frame.waitForFunction(() => !!(window as any).__irukaTest, null, { timeout: 20_000 });
    runSummary.upsertCheck({ id: "E2E_HOOKS", severity: "blocker", ok: true });

    // reset spy
    await frame.evaluate(() => (window as any).__irukaSpy.reset());

    // probe driver methods (để bắt case claim nhưng driver thiếu)
    const drvProbe = await frame.evaluate(() => {
      const drv = (window as any).__irukaTest;
      return {
        setTotal: typeof drv.setTotal === "function",
        makeWrong: typeof drv.makeWrong === "function",
        makeCorrect: typeof drv.makeCorrect === "function",
        useHint: typeof drv.useHint === "function",
        startQ: typeof drv.startQ === "function",
        finishQ: typeof drv.finishQ === "function",
        finish: typeof drv.finish === "function",
      };
    });

    // stats driver: warning nếu thiếu (vì để debug “thiếu gì báo hết”)
    if (!drvProbe.setTotal) addWarning(testInfo, "Driver missing: __irukaTest.setTotal(n)", warnings);
    if (!drvProbe.makeWrong) addWarning(testInfo, "Driver missing: __irukaTest.makeWrong(n)", warnings);
    if (!drvProbe.makeCorrect) addWarning(testInfo, "Driver missing: __irukaTest.makeCorrect(n)", warnings);
    if (!drvProbe.finish) addWarning(testInfo, "Driver missing: __irukaTest.finish()", warnings);

    // claim hint/timer: driver phải có, không có => warning
    if (hasHint && !drvProbe.useHint) addWarning(testInfo, "Claimed 'hint' but driver missing: __irukaTest.useHint(n)", warnings);
    if (hasTimer && !drvProbe.startQ) addWarning(testInfo, "Claimed 'timer' but driver missing: __irukaTest.startQ(n)", warnings);
    if (hasTimer && !drvProbe.finishQ) addWarning(testInfo, "Claimed 'timer' but driver missing: __irukaTest.finishQ(n)", warnings);

    // drive: chỉ call những thứ có thể call, nhưng hint/timer chỉ call nếu claim
    await frame.evaluate((arg) => {
      const drv = (window as any).__irukaTest;

      try { drv.setTotal?.(3); } catch {}
      try { drv.makeWrong?.(2); } catch {}
      try { drv.makeCorrect?.(3); } catch {}

      if (arg.hasTimer) {
        try { drv.startQ?.(1); } catch {}
        try { drv.finishQ?.(1); } catch {}
      }
      if (arg.hasHint) {
        try { drv.useHint?.(1); } catch {}
      }

      try { drv.finish?.(); } catch {}
    }, { hasHint, hasTimer });

    const summary: Record<string, number> = await frame.evaluate(() => (window as any).__irukaSpy.getSummary());

    // attach spy summary for debug
    runSummary.writeArtifact("spySummary", "spySummary.json", summary);
    await testInfo.attach("spySummary.json", {
      body: Buffer.from(JSON.stringify(summary, null, 2)),
      contentType: "application/json",
    });

    // ===== HARD: stats conformance (stats required) =====
    expect(countSummary(summary, "stats:recordWrong")).toBe(2);
    expect(countSummary(summary, "stats:recordCorrect")).toBe(3);
    expect(countSummary(summary, "stats:finalizeAttempt")).toBeGreaterThan(0);

    runSummary.upsertCheck({ id: "STATS_COUNTS", severity: "blocker", ok: true });

    // ===== IMPORTANT: claim hint => must observe addHint =====
    // Đây là cái bạn bảo “quan trọng nhất”
    if (hasHint) {
      if (countSummary(summary, "stats:addHint") <= 0) {
        addWarning(testInfo, "Claimed 'hint' but spy did not observe stats:addHint.", warnings);
      }
    }

    // timer: claim thì nên thấy start/finish (warning thôi)
    if (hasTimer) {
      if (countSummary(summary, "stats:startQuestionTimer") <= 0) {
        addWarning(testInfo, "Claimed 'timer' but spy did not observe stats:startQuestionTimer.", warnings);
      }
      if (countSummary(summary, "stats:finishQuestionTimer") <= 0) {
        addWarning(testInfo, "Claimed 'timer' but spy did not observe stats:finishQuestionTimer.", warnings);
      }
    }

    // sdk:sendEvent (warning)
    if (countSummary(summary, "sdk:sendEvent") <= 0) {
      addWarning(testInfo, "Spy did not observe sdk:sendEvent (check SDK hook in createGameSdk).", warnings);
    }

    // ===== COMPLETE + schema =====
    await hubWaitForType(page, "COMPLETE", 20_000);
    runSummary.upsertCheck({ id: "COMPLETE_PRESENT", severity: "blocker", ok: true });

    const completeMsg = await hubGetLastGameMsg(page, "COMPLETE");
    const completePayload = completeMsg?.payload;

    const sanitized = sanitizeForArtifact(completePayload);
    runSummary.writeArtifact("completePayload", "completePayload.json", sanitized);

    await testInfo.attach("completePayload.json", {
      body: Buffer.from(JSON.stringify(sanitized, null, 2)),
      contentType: "application/json",
    });

    const v = validateCompletePayload(completePayload);

    for (const w of v.warnings) addWarning(testInfo, w, warnings);

    if (v.errors.length === 0) {
      runSummary.upsertCheck({ id: "COMPLETE_SCHEMA", severity: "blocker", ok: true });
    } else {
      runSummary.upsertCheck({
        id: "COMPLETE_SCHEMA",
        severity: "blocker",
        ok: false,
        message: "COMPLETE payload schema invalid",
        details: { errors: v.errors, warnings: v.warnings },
      });
    }

    expect(v.errors, `COMPLETE payload schema errors:\n- ${v.errors.join("\n- ")}`).toEqual([]);

  } catch (e: any) {
    runSummary.upsertCheck({
      id: "TEST_RUNTIME",
      severity: "blocker",
      ok: false,
      message: e?.message ?? "Test runtime failure",
    });
    throw e;
  } finally {
    // ALWAYS attach warnings artifact
    const body = warnings.length ? warnings.join("\n") : "NO_WARNINGS";
    runSummary.writeArtifact("warnings", "warnings.txt", body);
    await testInfo.attach("warnings.txt", { body: Buffer.from(body), contentType: "text/plain" });

    await attachArtifactsOnFailure({ page, frame, testInfo });
    runSummary.finalize();
  }
});
