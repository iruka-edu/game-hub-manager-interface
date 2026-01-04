/**
 * QC Testing System Type Definitions
 * 
 * This file contains shared TypeScript interfaces and types used across
 * the QC Testing System components.
 */

/**
 * Launch context for game testing sessions
 */
export interface LaunchContext {
  gameId: string;
  versionId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
}

/**
 * QA Test Results from automated testing
 */
export interface QATestResults {
  qa01: {
    initToReadyMs: number;
    quitToCompleteMs: number;
    pass: boolean;
    events: GameEvent[];
  };
  qa02: {
    pass: boolean;
    accuracy: number;
    completion: number;
    normalizedResult: object;
    validationErrors?: string[];
  };
  qa03: {
    auto: {
      assetError: boolean;
      readyMs: number;
      errorDetails?: string[];
    };
    manual: {
      noAutoplay: boolean;
      noWhiteScreen: boolean;
      gestureOk: boolean;
    };
  };
  qa04: {
    pass: boolean;
    duplicateAttemptId: boolean;
    backendRecordCount: number;
    consistencyCheck: boolean;
  };
  rawResult: object;
  eventsTimeline: GameEvent[];
  testDuration: number;
}

/**
 * Game event types captured during testing
 */
export type GameEventType = 'INIT' | 'READY' | 'RESULT' | 'QUIT' | 'COMPLETE' | 'ERROR';

/**
 * Individual game event in the timeline
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  data?: any;
  duration?: number; // Time since previous event
}

/**
 * Idempotency test result
 */
export interface IdempotencyResult {
  pass: boolean;
  duplicateAttemptId: boolean;
  backendRecordCount: number;
  consistencyCheck: boolean;
  details?: string;
}

/**
 * Normalized results from QA-02 converter testing
 */
export interface NormalizedResults {
  accuracy: number;
  completion: number;
  isValid: boolean;
  validationErrors: string[];
  normalizedData: object;
}

/**
 * Manual QA validation state
 */
export interface ManualQAState {
  noAutoplay: boolean;
  noWhiteScreen: boolean;
  gestureOk: boolean;
  isComplete: boolean;
  notes?: string;
}

/**
 * QC decision with metadata
 */
export interface QCDecisionData {
  decision: 'pass' | 'fail';
  note: string;
  qcUserId: string;
  timestamp: Date;
  qaResults: QATestResults;
  manualValidation: ManualQAState;
}

/**
 * Test execution status
 */
export type TestExecutionStatus = 
  | 'idle'
  | 'initializing'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timeout';

/**
 * Test progress information
 */
export interface TestProgress {
  status: TestExecutionStatus;
  currentStep: string;
  progress: number; // 0-100
  startTime?: Date;
  estimatedCompletion?: Date;
  errors?: string[];
}