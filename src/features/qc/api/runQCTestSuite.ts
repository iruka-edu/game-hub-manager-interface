export type QCTestSuite = {
  gameId: string;
  versionId: string;
  gameUrl: string;
  manifest?: unknown;
  testConfig: {
    userId: string;
    timeout: number;
    skipManualTests: boolean;
    enableSDKDebugging: boolean;
    testEnvironment: string;
    deviceSimulation: { mobile: boolean; tablet: boolean; desktop: boolean };
    performanceThresholds: { maxLoadTime: number; minFrameRate: number; maxMemoryUsage: number };
  };
};

export type QCTestReport = any; // nếu bạn có type chuẩn thì thay vào

export async function runQCTestSuiteOnRunner(testSuite: QCTestSuite, accessToken: string) {
  const base = process.env.NEXT_PUBLIC_QC_RUNNER_URL || "https://runner-h7j3ksnhva-as.a.run.app"; // <-- set env này trỏ tới Cloud Run
  if (!base) throw new Error("Missing NEXT_PUBLIC_QC_RUNNER_URL");

  const res = await fetch(`${base}/runQCTestSuite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(testSuite),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Runner error: ${res.status}`);
  }

  return data as { testReport: QCTestReport } | QCTestReport;
}
