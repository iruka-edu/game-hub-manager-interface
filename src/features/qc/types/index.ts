/**
 * QC Feature Types
 */

export interface QCDecision {
  gameId: string;
  versionId: string;
  result: "pass" | "fail";
  note: string;
  severity?: "low" | "medium" | "high";
}

export interface QCDecisionResponse {
  success: boolean;
  message: string;
  game?: unknown;
}

export interface TestRunResult {
  gameId: string;
  versionId: string;
  testResults: {
    deviceType: string;
    browser: string;
    status: "pass" | "fail" | "skip";
    notes?: string;
  }[];
  overallStatus: "pass" | "fail";
}

export interface TestRunResponse {
  success: boolean;
  message: string;
}
