import express from "express";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { ensureE2EParam, validateGameUrlAllowlist } from "./url";
import { runPlaywrightJob } from "./runPlaywright";
import { buildSummary } from "./summary";
// Tạm thời comment hoặc bỏ gcs và callback nếu bạn chưa làm Web
import { uploadRunDirToGCS, makeGcsPublicUrl  } from "./gcs"; 
import { sendCallback } from "./callback";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 8080);

// 1. Cấu hình thư mục lưu kết quả (đổi từ /tmp sang thư mục runs trong dự án cho dễ xem)
const RUNS_ROOT = path.join(process.cwd(), "runs");
if (!fs.existsSync(RUNS_ROOT)) fs.mkdirSync(RUNS_ROOT);

// 2. Serve hub.html nội bộ
app.use(express.static(path.resolve(process.cwd(), "public")));

// 3. MỚI: Serve toàn bộ artifacts để có thể xem video/report qua browser
// Ví dụ: http://localhost:8081/artifacts/runID/playwright-report/index.html
app.use("/artifacts", express.static(RUNS_ROOT));

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.post("/run", async (req, res) => {
  const startedAt = Date.now();
  const runId = nanoid(16);

  try {
    const gameUrlRaw = String(req.body?.gameUrl || "").trim();
    if (!gameUrlRaw) return res.status(400).json({ error: "Missing gameUrl" });

    const allowlist = (process.env.ALLOWLIST_DOMAINS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (allowlist.length && !validateGameUrlAllowlist(gameUrlRaw, allowlist)) {
      return res.status(400).json({ error: "gameUrl not in allowlist" });
    }

    const hubUrl = `http://127.0.0.1:${PORT}/hub.html`;
    const gameUrl = ensureE2EParam(gameUrlRaw);

    // Lưu vào thư mục local thay vì /tmp
    const runDir = path.join(RUNS_ROOT, runId);

    // Chạy Playwright
    const job = await runPlaywrightJob({ runId, runDir, hubUrl, gameUrl });

    // Tạo summary chuẩn
    const summary = await buildSummary({
      runId,
      runDir,
      hubUrl,
      gameUrl,
      exitCode: job.exitCode,
      startedAt,
      finishedAt: Date.now(),
      stdoutPath: job.stdoutPath,
      stderrPath: job.stderrPath,
    });

    // 4. THAY ĐỔI: Không dùng GCS, tạo reportUrl trỏ về chính server này
    // const reportUrl = `http://localhost:${PORT}/artifacts/${runId}/playwright-report/index.html`;

    // Upload toàn bộ runDir lên GCS
    const { prefix } = await uploadRunDirToGCS({ runId, runDir });

    // Report url trên GCS (public URL)
    const reportObjectPath = `${prefix}/playwright-report/index.html`;
    const reportUrl = makeGcsPublicUrl(reportObjectPath);

    // Callback về web Next.js (Nếu bạn đang bật web local)
    if (process.env.CALLBACK_URL) {
      try {
        await sendCallback({
          callbackUrl: process.env.CALLBACK_URL,
          secret: process.env.HMAC_SECRET || "",
          payload: {
            runId,
            status: summary.status,
            summary,
            reportUrl, // Link GCS
            meta: req.body?.meta ?? null,
          },
        });
      } catch (cbError) {
        console.warn("[runner] Callback failed (Web might be offline)");
      }
    }

    return res.status(200).json({ 
      runId, 
      status: summary.status, 
      summary, 
      reportUrl, 
      localPath: runDir 
    });
    
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ runId, error: e?.message || "Runner error" });
  }
});

app.listen(PORT, () => {
  console.log(`[runner] local mode listening on :${PORT}`);
  console.log(`[runner] artifacts served at http://localhost:${PORT}/artifacts`);
});