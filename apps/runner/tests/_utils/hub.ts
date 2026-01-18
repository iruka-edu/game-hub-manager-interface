import type { Page } from "@playwright/test";

export async function hubLoadGameAndInit(page: Page, gameUrl: string) {
  await page.evaluate((url) => {
    const hub = (window as any).__hubTest;

    hub.setOriginAny();
    hub.clearLogs();

    // mark log boundary (để hubWaitForType chỉ nhìn "log mới")
    const logs = hub.getLogs?.() ?? [];
    (window as any).__e2eLogMark = {
      first: logs[0] ?? null,
      last: logs[logs.length - 1] ?? null,
    };

    // (optional nhưng rất đáng làm) cache-bust để chắc chắn load instance mới
    const bust = `__run=${Date.now()}`;
    const u = url.includes("?") ? `${url}&${bust}` : `${url}?${bust}`;

    hub.setGameUrl(u);
    hub.sendInit();
  }, gameUrl);
}

export async function hubWaitForType(page: Page, type: string, timeout = 15_000) {
  await page.waitForFunction(
    (t) => {
      const hub = (window as any).__hubTest;
      const logs = hub.getLogs?.() ?? [];

      const mark = (window as any).__e2eLogMark ?? { first: null, last: null };
      const idxFirst = mark.first ? logs.indexOf(mark.first) : -1;
      const idxLast = mark.last ? logs.indexOf(mark.last) : -1;

      // "new logs" = phần nằm trước first (nếu unshift newest-first)
      // hoặc phần nằm sau last (nếu push oldest-first)
      const isNewIndex = (i: number) =>
        (idxFirst >= 0 ? i < idxFirst : true) || (idxLast >= 0 ? i > idxLast : true);

      for (let i = 0; i < logs.length; i++) {
        if (!isNewIndex(i)) continue;
        const x = logs[i];
        if (x.dir === "GAME → HUB" && x.msg?.type === t) return true;
      }
      return false;
    },
    type,
    { timeout }
  );
}

export async function hubDumpArtifacts(page: Page) {
  return await page.evaluate(() => (window as any).__hubTest.dumpArtifacts());
}

export async function hubGetLogs(page: Page) {
  return await page.evaluate(() => (window as any).__hubTest.getLogs());
}

/** newest-first, lấy msg GAME → HUB theo type */
export async function hubGetLastGameMsg(page: Page, type: string) {
  return await page.evaluate((t) => {
    const logs = (window as any).__hubTest.getLogs();
    const hit = logs.find((x: any) => x.dir === "GAME → HUB" && x.msg?.type === t);
    return hit?.msg ?? null;
  }, type);
}
