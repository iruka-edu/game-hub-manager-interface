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
  qaSummary?: Record<string, any> | null;
  reviewerName?: string | null;
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

/**
 * QC Issue Status Enum
 */
export type QCIssueStatus = "open" | "resolved" | "closed";

/**
 * QC Issue Schema
 */
export interface QCIssue {
  id: string;
  version_id: string;
  title: string;
  description?: string;
  status: QCIssueStatus;
  priority: "low" | "medium" | "high";
  assigned_to?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for closing an issue
 */
export interface CloseIssuePayload {
  issueId: string;
  notes?: string;
}

/**
 * Payload for assigning an issue
 */
export interface AssignIssuePayload {
  issueId: string;
  assigneeId: string;
}
