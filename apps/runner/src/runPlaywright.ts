import fs from "fs";
import path from "path";
import { spawn } from "child_process";

type Args = { runId: string; runDir: string; hubUrl: string; gameUrl: string };

export async function runPlaywrightJob(args: Args) {
  if (!fs.existsSync(args.runDir)) {
    fs.mkdirSync(args.runDir, { recursive: true });
  }

  const stdoutPath = path.join(args.runDir, "playwright.stdout.log");
  const stderrPath = path.join(args.runDir, "playwright.stderr.log");
  const out = fs.openSync(stdoutPath, "w");
  const err = fs.openSync(stderrPath, "w");

  // Xử lý lệnh npx cho Windows
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const pwArgs = [
    "playwright",
    "test",
    "--workers=1",
    "--config=playwright.config.ts",
  ];

  // QUAN TRỌNG: Lọc sạch env để không có giá trị undefined/null
  const cleanEnv: Record<string, string> = {};
  Object.entries({
    ...process.env,
    CI: "1",
    HUB_URL: args.hubUrl,
    GAME_URL: args.gameUrl,
    RUN_DIR: args.runDir,
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleanEnv[key] = String(value);
    }
  });

  const child = spawn(cmd, pwArgs, {
    cwd: process.cwd(),
    stdio: ["ignore", out, err],
    env: cleanEnv,
    shell: true, // Thêm cái này để thực thi lệnh .cmd/.bat trên Windows tốt hơn
  });

  const exitCode: number = await new Promise((resolve) => {
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
    child.on("error", (err) => {
      console.error("Child process error:", err);
      resolve(1);
    });
  });

  fs.closeSync(out);
  fs.closeSync(err);

  return { exitCode, stdoutPath, stderrPath };
}