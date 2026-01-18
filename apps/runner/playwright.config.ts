import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1, // TEST-7: retry 1 lần để giảm flaky
  reporter: [
    ["line"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/report.json" }],
  ],
  use: {
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry", // TEST-6: trace khi retry
  },

  // ✅ Local run tiện: tự serve hub.html
  webServer: process.env.HUB_URL
    ? undefined
    : {
        command: "npm run serve:hub",
        url: "http://127.0.0.1:4173/hub.html",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
