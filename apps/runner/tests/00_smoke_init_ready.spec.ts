import { test, expect } from "@playwright/test";
import { mustEnv, withE2E } from "./_utils/env";
import { hubLoadGameAndInit, hubWaitForType } from "./_utils/hub";
import { attachArtifactsOnFailure } from "./_utils/artifacts";
import { runSummary } from "./_utils/runSummary";

test("Smoke: INIT → READY", async ({ page }, testInfo) => {
  const GAME_URL = mustEnv("GAME_URL");
  const HUB_URL = process.env.HUB_URL || "http://127.0.0.1:4173/hub.html";

  runSummary.startRun({ gameUrl: withE2E(GAME_URL), hubUrl: HUB_URL });

  await page.goto(HUB_URL);

  await page.evaluate(() => (window as any).__hubTest.clearLogs());
  await hubLoadGameAndInit(page, withE2E(GAME_URL));

  try {
    await hubWaitForType(page, "READY", 20_000);
    runSummary.upsertCheck({ id: "INIT_READY", severity: "blocker", ok: true });
    expect(true).toBeTruthy();
  } catch (e: any) {
    runSummary.upsertCheck({
      id: "INIT_READY",
      severity: "blocker",
      ok: false,
      message: e?.message ?? "INIT→READY failed",
    });
    runSummary.upsertCheck({ id: "INFRA_READY_TIMEOUT", severity: "blocker", ok: false, message: "Timeout waiting READY" });
    throw e;
  } finally {
    await attachArtifactsOnFailure({ page, testInfo });
    runSummary.finalize();
  }
});
