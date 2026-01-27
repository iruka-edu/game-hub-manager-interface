"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { QCTestReport, QCTestSuite } from "@/lib/MiniGameQCService.client";
import { MiniGameQCService } from "@/lib/MiniGameQCService.client";

type Phase = "idle" | "running" | "completed" | "error";

export function GameAutoTestPanel(props: {
  gameId: string;      // gameId dạng com.iruka...
  versionId?: string;  // nếu bạn chưa có version thật thì cứ truyền gì cũng được
  gcsPath?: string;    // dạng "games/com.iruka.xxx"
}) {
  const searchParams = useSearchParams();
  const shouldAutoRun = searchParams.get("autotest") === "1";

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [report, setReport] = useState<QCTestReport | null>(null);

  const gameUrl = useMemo(() => {
    const gcsPath = props.gcsPath || `games/${props.gameId}`;
    // mock version 1.0.0 theo quyết định hiện tại
    return `https://storage.googleapis.com/iruka-edu-mini-game/${gcsPath}/1.0.0/index.html`;
  }, [props.gcsPath, props.gameId]);

  const run = useCallback(async () => {
    setError("");
    setPhase("running");
    setReport(null);

    try {
      const testSuite: QCTestSuite = {
        gameId: props.gameId,
        versionId: props.versionId || "1.0.0",
        gameUrl,
        manifest: undefined,
        testConfig: {
          userId: "system",
          timeout: 120000,
          skipManualTests: true,
          enableSDKDebugging: true,
          testEnvironment: "staging",
          deviceSimulation: { mobile: true, tablet: true, desktop: true },
          performanceThresholds: {
            maxLoadTime: 60000,
            minFrameRate: 30,
            maxMemoryUsage: 100 * 1024 * 1024,
          },
        },
      };

      const r = await MiniGameQCService.runQCTestSuite(testSuite);
      setReport(r);
      setPhase("completed");
    } catch (e: any) {
      setPhase("error");
      setError(e?.message || "Auto test failed");
    }
  }, [gameUrl, props.gameId, props.versionId]);

  // Auto-run ONLY right after upload (autotest=1)
  useEffect(() => {
    if (shouldAutoRun) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoRun]);

  const qa = report?.qaResults;
  const qa01Pass = !!qa?.qa01?.pass;
  const qa02Pass = !!qa?.qa02?.pass;
  const qa03Pass = qa ? !qa.qa03?.auto?.assetError : false;

  // sdk_events: theo rule bạn chốt -> bám QA-01
  const sdkEventsPass = qa01Pass;

  return (
    <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="font-semibold text-slate-900">Auto test (Runner)</h3>

            {phase === "completed" && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Hoàn thành
              </span>
            )}
            {phase === "error" && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Lỗi
              </span>
            )}
            {phase === "running" && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Đang chạy
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 break-all">
            URL: <span className="font-mono text-xs">{gameUrl}</span>
          </p>

          {phase === "completed" && report && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge label="SDK Handshake (QA-01)" ok={qa01Pass} />
                <Badge label="SDK Events" ok={sdkEventsPass} />
                <Badge label="Data Format (QA-02)" ok={qa02Pass} />
                <Badge label="Performance (QA-03)" ok={qa03Pass} />
              </div>

              <div
                className={`p-3 rounded-lg ${
                  report.overallResult === "PASS"
                    ? "bg-green-50 border border-green-200"
                    : report.overallResult === "WARNING"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="text-sm font-medium text-slate-900">
                  Kết quả tổng: {report.overallResult}
                </div>

                {!!report.criticalIssues?.length && (
                  <div className="mt-2 text-sm text-red-700">
                    • Critical: {report.criticalIssues.join(" | ")}
                  </div>
                )}
                {!!report.warnings?.length && (
                  <div className="mt-1 text-sm text-amber-700">
                    • Warnings: {report.warnings.join(" | ")}
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === "error" && error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 break-all">
              {error}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={phase === "running"}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shrink-0 ${
            phase === "running"
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
          }`}
        >
          {phase === "running" ? "Đang chạy..." : "Chạy kiểm tra"}
        </button>
      </div>
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-2 rounded-lg text-xs border ${
        ok ? "bg-green-100 border-green-200 text-green-800" : "bg-red-100 border-red-200 text-red-800"
      }`}
    >
      <span className="font-semibold mr-2">{ok ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}
