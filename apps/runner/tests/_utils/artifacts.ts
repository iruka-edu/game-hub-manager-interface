import type { Page, TestInfo, Frame } from "@playwright/test";
import { hubDumpArtifacts } from "./hub";
import { runSummary } from "./runSummary";

export async function attachArtifactsOnFailure(opts: {
  page: Page;
  frame?: Frame;
  testInfo: TestInfo;
}) {
  const { page, frame, testInfo } = opts;
  const failed = testInfo.status !== testInfo.expectedStatus;
  if (!failed) return;

  // hub logs + meta
  try {
    const hub = await hubDumpArtifacts(page);
    runSummary.writeArtifact("hubLogs", "hubLogs.json", hub);

    await testInfo.attach("hubLogs.json", {
      body: Buffer.from(JSON.stringify(hub, null, 2)),
      contentType: "application/json",
    });
  } catch {}

  // spy records (from game iframe)
  try {
    if (frame) {
      const spyRecords = await frame.evaluate(() => (window as any).__irukaSpy?.getRecords?.() ?? null);
      if (spyRecords) {
        runSummary.writeArtifact("spyRecords", "spyRecords.json", spyRecords);

        await testInfo.attach("spyRecords.json", {
          body: Buffer.from(JSON.stringify(spyRecords, null, 2)),
          contentType: "application/json",
        });
      }
    }
  } catch {}

  // screenshot thêm cho chắc
  try {
    const png = await page.screenshot({ fullPage: true });
    await testInfo.attach("page.png", { body: png, contentType: "image/png" });
  } catch {}
}
