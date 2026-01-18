import type { Frame, Page } from "@playwright/test";

export async function getGameFrame(page: Page): Promise<Frame> {
  const handle = await page.locator("#gameFrame").elementHandle();
  if (!handle) throw new Error("Cannot find #gameFrame");
  const frame = await handle.contentFrame();
  if (!frame) throw new Error("Iframe exists but contentFrame() is null (not loaded yet)");
  return frame;
}
