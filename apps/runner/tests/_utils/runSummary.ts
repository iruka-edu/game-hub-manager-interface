import fs from "node:fs";
import path from "node:path";

export type Severity = "blocker" | "warning";
export type Check = {
  id: string;
  severity: Severity;
  ok: boolean;
  message?: string;
  details?: any;
};

type Summary = {
  schemaVersion: "1.0";
  run: {
    runId?: string;
    gameUrl?: string;
    hubUrl?: string;
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
  };
  status: "pass" | "fail" | "infra_error";
  checks: Check[];
  warnings: string[];
  artifacts: Record<string, string>;
};

const OUT_DIR = path.resolve(process.cwd(), "test-results");
const OUT_FILE = path.join(OUT_DIR, "iruka-summary.json");

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function readSummary(): Summary {
  ensureOutDir();
  if (!fs.existsSync(OUT_FILE)) {
    return {
      schemaVersion: "1.0",
      run: {},
      status: "pass",
      checks: [],
      warnings: [],
      artifacts: {
        playwrightHtmlReport: "playwright-report/index.html",
      },
    };
  }
  return JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
}

function severityRank(s: Severity) {
  return s === "blocker" ? 2 : 1;
}

function mergeCheck(existing: Check | undefined, next: Check): Check {
  if (!existing) return next;

  // “worst wins”: blocker > warning, fail > pass
  const severity = severityRank(next.severity) >= severityRank(existing.severity) ? next.severity : existing.severity;
  const ok = existing.ok && next.ok;

  // giữ message/detail hữu ích nhất (ưu tiên fail)
  const pick = (!ok && !existing.ok) ? existing : (!ok ? next : existing);

  return {
    id: existing.id,
    severity,
    ok,
    message: pick.message ?? existing.message,
    details: pick.details ?? existing.details,
  };
}

export const runSummary = {
  startRun(meta: { gameUrl?: string; hubUrl?: string; runId?: string }) {
    const s = readSummary();
    s.run.gameUrl = meta.gameUrl ?? s.run.gameUrl;
    s.run.hubUrl = meta.hubUrl ?? s.run.hubUrl;
    s.run.runId = meta.runId ?? s.run.runId;
    if (!s.run.startedAt) s.run.startedAt = new Date().toISOString();
    fs.writeFileSync(OUT_FILE, JSON.stringify(s, null, 2), "utf8");
  },

  upsertCheck(check: Check) {
    const s = readSummary();
    const idx = s.checks.findIndex((c) => c.id === check.id);
    const merged = mergeCheck(idx >= 0 ? s.checks[idx] : undefined, check);
    if (idx >= 0) s.checks[idx] = merged;
    else s.checks.push(merged);
    fs.writeFileSync(OUT_FILE, JSON.stringify(s, null, 2), "utf8");
  },

  addWarning(msg: string) {
    const s = readSummary();
    s.warnings.push(msg);
    fs.writeFileSync(OUT_FILE, JSON.stringify(s, null, 2), "utf8");
  },

  writeArtifact(name: string, filename: string, content: any) {
    ensureOutDir();
    const filePath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filePath, typeof content === "string" ? content : JSON.stringify(content, null, 2), "utf8");

    const s = readSummary();
    s.artifacts[name] = `test-results/${filename}`;
    fs.writeFileSync(OUT_FILE, JSON.stringify(s, null, 2), "utf8");

    return filePath;
  },

  finalize() {
    const s = readSummary();
    s.run.finishedAt = new Date().toISOString();

    // duration
    if (s.run.startedAt) {
      const dt = Date.parse(s.run.finishedAt) - Date.parse(s.run.startedAt);
      if (Number.isFinite(dt)) s.run.durationMs = dt;
    }

    // status
    const anyBlockerFail = s.checks.some((c) => c.severity === "blocker" && !c.ok);
    const anyInfraFail = s.checks.some((c) => c.id.startsWith("INFRA_") && !c.ok);

    s.status = anyInfraFail ? "infra_error" : anyBlockerFail ? "fail" : "pass";

    fs.writeFileSync(OUT_FILE, JSON.stringify(s, null, 2), "utf8");
  },
};
