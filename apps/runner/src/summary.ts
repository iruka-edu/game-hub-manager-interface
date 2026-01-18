import fs from "fs";
import path from "path";

type Severity = "blocker" | "warning";
type Check = { id: string; severity: Severity; ok: boolean; message?: string; details?: any };

type Summary = {
  schemaVersion: "1.0";
  run: {
    runId: string;
    gameUrl: string;
    hubUrl: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
  };
  status: "pass" | "fail" | "infra_error";
  checks: Check[];
  warnings: string[];
  artifacts: Record<string, string>;
};

function readIfExists(p: string) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

export async function buildSummary(opts: {
  runId: string;
  runDir: string;
  hubUrl: string;
  gameUrl: string;
  exitCode: number;
  startedAt: number;
  finishedAt: number;
  stdoutPath: string;
  stderrPath: string;
}) {
  const summaryPath = path.join(opts.runDir, "summary.json");

  // Nếu test-suite của bạn đã tạo iruka-summary.json ở đâu đó, thì merge vào đây
  const legacy = readIfExists(path.join(process.cwd(), "test-results", "iruka-summary.json"));
  // hoặc nếu bạn đã sửa test-suite để ghi theo RUN_DIR thì:
  const legacyInRunDir = readIfExists(path.join(opts.runDir, "iruka-summary.json"));

  const base: Summary = {
    schemaVersion: "1.0",
    run: {
      runId: opts.runId,
      gameUrl: opts.gameUrl,
      hubUrl: opts.hubUrl,
      startedAt: new Date(opts.startedAt).toISOString(),
      finishedAt: new Date(opts.finishedAt).toISOString(),
      durationMs: Math.max(0, opts.finishedAt - opts.startedAt),
    },
    status: opts.exitCode === 0 ? "pass" : "fail",
    checks: [],
    warnings: [],
    artifacts: {
      stdout: path.basename(opts.stdoutPath),
      stderr: path.basename(opts.stderrPath),
      // Playwright report folder sẽ config ở playwright.config.ts
      playwrightHtmlReport: "playwright-report/index.html",
      playwrightJsonReport: "playwright-report/report.json",
    },
  };

  const picked = legacyInRunDir || legacy;
  if (picked) {
    base.checks = picked.checks ?? base.checks;
    base.warnings = picked.warnings ?? base.warnings;
    // status: ưu tiên theo checks nếu có
    if (picked.status) base.status = picked.status;
  }

  fs.writeFileSync(summaryPath, JSON.stringify(base, null, 2), "utf8");
  return base;
}
