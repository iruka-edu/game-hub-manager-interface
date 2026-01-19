/**
 * QC Feature Types
 * Matching BE_vu_v2.json API schemas
 */

/**
 * QC Decision Input
 * Matches QcDecisionIn schema
 */
export interface QCDecisionPayload {
  versionId: string;
  decision: "pass" | "fail";
  notes?: string | null;
}

/**
 * QC Run Input
 * Matches QcRunIn schema
 */
export interface QCRunPayload {
  versionId: string;
  testResults: QATestResult;
}

/**
 * QC Item Result
 */
export interface QCItemResult {
  id: string;
  name: string;
  passed?: boolean | null;
  notes?: string;
  is_auto_test?: boolean | null;
}

/**
 * QC Category Result
 */
export interface QCCategoryResult {
  name: string;
  tests: QCItemResult[];
}

/**
 * Full QA Test Result
 */
export interface QATestResult {
  overall?: string | null;
  categories?: Record<string, QCCategoryResult> | null;
  qa01?: {
    pass: boolean;
    init_to_ready_ms?: number | null;
    quit_to_complete_ms?: number | null;
  } | null;
  qa02?: {
    pass: boolean;
    accuracy?: number | null;
    completion?: number | null;
    normalized_result?: Record<string, any> | null;
  } | null;
  qa03?: {
    auto?: {
      asset_error: boolean;
      ready_ms: number;
    };
    manual?: {
      no_autoplay: boolean;
      no_white_screen: boolean;
      gesture_ok: boolean;
    };
  } | null;
  qa04?: {
    pass: boolean;
    duplicate_attempt_id?: boolean | null;
    backend_record_count?: number | null;
  } | null;
  total_tests?: number | null;
  passed_tests?: number | null;
  failed_tests?: number | null;
  notes?: string | null;
  tested_by?: string | null;
  tested_at?: string | null;
}

/**
 * QC Decision Response
 */
export interface QCDecisionResponse {
  success: boolean;
  message?: string;
}

/**
 * QC Run Response
 */
export interface QCRunResponse {
  success: boolean;
  message?: string;
}

// Legacy aliases for backward compatibility
export type QCDecision = QCDecisionPayload;
export type TestRunResult = QCRunPayload;
export type TestRunResponse = QCRunResponse;
