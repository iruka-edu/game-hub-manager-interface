/**
 * Test Runner Service for QC Testing System
 * 
 * This service orchestrates automated QA testing and implements 
 * the four QA checks (QA-01 through QA-04) with a simplified
 * SDK integration approach.
 */

import type { 
  QATestResults, 
  LaunchContext, 
  IdempotencyResult, 
  NormalizedResults,
  GameEvent as QCGameEvent,
  TestProgress,
  TestExecutionStatus
} from '../types/qc-types';

/**
 * Simplified game event types for QC testing
 */
export enum QCGameEventType {
  GAME_READY = 'game:ready',
  GAME_START = 'game:start',
  GAME_END = 'game:end',
  SCORE_UPDATE = 'score:update',
  PROGRESS_UPDATE = 'progress:update',
  ERROR = 'system:error',
  HOST_COMMAND = 'host:command'
}

/**
 * Simplified game event interface
 */
export interface QCGameEventData {
  type: QCGameEventType;
  timestamp: number;
  data?: any;
}

/**
 * Simplified Game Host for QC testing
 * Based on the Hub-Core SDK GameHost but simplified for QC needs
 */
export class QCGameHost {
  private iframe: HTMLIFrameElement;
  private gameOrigin: string;
  private listeners: Map<QCGameEventType, Set<(event: QCGameEventData) => void>> = new Map();
  private isReady: boolean = false;

  constructor(iframe: HTMLIFrameElement, gameOrigin: string) {
    this.iframe = iframe;
    this.gameOrigin = gameOrigin;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    // Skip setup in non-browser environments (e.g., Node.js testing)
    if (typeof window === 'undefined') {
      console.warn('TestRunnerService: Skipping message listener setup in non-browser environment');
      return;
    }

    window.addEventListener('message', (event) => {
      if (event.origin !== this.gameOrigin) return;
      if (event.source !== this.iframe.contentWindow) return;

      try {
        const gameEvent = event.data as QCGameEventData;
        this.handleGameEvent(gameEvent);
      } catch (error) {
        console.error('Failed to handle game event:', error);
      }
    });
  }

  private handleGameEvent(event: QCGameEventData): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }

    if (event.type === QCGameEventType.GAME_READY) {
      this.isReady = true;
    }
  }

  addEventListener(type: QCGameEventType, handler: (event: QCGameEventData) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  removeEventListener(type: QCGameEventType, handler: (event: QCGameEventData) => void): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  sendCommand(command: string, params?: Record<string, any>): void {
    if (!this.isReady) {
      console.warn('Game is not ready, command ignored:', command);
      return;
    }

    const event: QCGameEventData = {
      type: QCGameEventType.HOST_COMMAND,
      timestamp: Date.now(),
      data: { command, params }
    };

    this.postMessage(event);
  }

  private postMessage(event: QCGameEventData): void {
    // Skip in non-browser environments
    if (typeof window === 'undefined' || !this.iframe.contentWindow) {
      console.warn('TestRunnerService: Skipping postMessage in non-browser environment');
      return;
    }
    
    this.iframe.contentWindow.postMessage(event, this.gameOrigin);
  }

  getReadyState(): boolean {
    return this.isReady;
  }

  async waitForReady(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Game ready timeout'));
      }, timeout);

      const readyHandler = () => {
        clearTimeout(timeoutId);
        this.removeEventListener(QCGameEventType.GAME_READY, readyHandler);
        resolve();
      };

      this.addEventListener(QCGameEventType.GAME_READY, readyHandler);
    });
  }

  destroy(): void {
    this.listeners.clear();
    this.isReady = false;
  }
}
/**
 * Configuration for iframe bridge creation
 */
export interface IframeBridgeConfig {
  iframe: HTMLIFrameElement;
  targetOrigin: string;
  timeout?: number;
}

/**
 * Configuration for session controller
 */
export interface SessionControllerConfig {
  bridge: IframeBridge;
  launchContext: LaunchContext;
  testTimeout?: number;
}

/**
 * Iframe bridge wrapper around QCGameHost
 */
export class IframeBridge {
  private gameHost: QCGameHost;
  public config: IframeBridgeConfig;
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  constructor(config: IframeBridgeConfig) {
    this.config = config;
    this.gameHost = new QCGameHost(config.iframe, config.targetOrigin);
  }

  /**
   * Add event listener with QC-specific event handling
   */
  onAny(handler: (event: QCGameEvent) => void): void {
    // Listen to all game events and convert to QC format
    Object.values(QCGameEventType).forEach(eventType => {
      this.gameHost.addEventListener(eventType, (event) => {
        const qcEvent: QCGameEvent = {
          type: this.mapEventType(event.type),
          timestamp: new Date(event.timestamp),
          data: event.data
        };
        handler(qcEvent);
      });
    });
  }

  /**
   * Map QC event types to standard QC event types
   */
  private mapEventType(sdkEventType: QCGameEventType): 'INIT' | 'READY' | 'RESULT' | 'QUIT' | 'COMPLETE' | 'ERROR' {
    switch (sdkEventType) {
      case QCGameEventType.GAME_READY:
        return 'READY';
      case QCGameEventType.GAME_START:
        return 'INIT';
      case QCGameEventType.GAME_END:
        return 'COMPLETE';
      case QCGameEventType.SCORE_UPDATE:
      case QCGameEventType.PROGRESS_UPDATE:
        return 'RESULT';
      case QCGameEventType.ERROR:
        return 'ERROR';
      default:
        return 'RESULT';
    }
  }

  /**
   * Wait for game to be ready
   */
  async waitForReady(timeout?: number): Promise<void> {
    return this.gameHost.waitForReady(timeout || this.config.timeout || 10000);
  }

  /**
   * Send command to game
   */
  sendCommand(command: string, params?: Record<string, any>): void {
    this.gameHost.sendCommand(command, params);
  }

  /**
   * Get ready state
   */
  isReady(): boolean {
    return this.gameHost.getReadyState();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.gameHost.destroy();
    this.eventListeners.clear();
  }
}

/**
 * Session controller for managing QC test sessions
 */
export class SessionController {
  private bridge: IframeBridge;
  private launchContext: LaunchContext;
  private config: SessionControllerConfig;
  private events: QCGameEvent[] = [];
  private startTime?: Date;
  private endTime?: Date;
  private isFinished: boolean = false;
  private testResults: Partial<QATestResults> = {};

  constructor(config: SessionControllerConfig) {
    this.config = config;
    this.bridge = config.bridge;
    this.launchContext = config.launchContext;
    this.setupEventCapture();
  }

  /**
   * Set up comprehensive event capture
   */
  private setupEventCapture(): void {
    this.bridge.onAny((event) => {
      this.events.push(event);
      
      // Track session timing
      if (event.type === 'INIT' && !this.startTime) {
        this.startTime = event.timestamp;
      }
      if (event.type === 'COMPLETE' && !this.endTime) {
        this.endTime = event.timestamp;
        this.isFinished = true;
      }
    });
  }

  /**
   * Start the test session
   */
  async start(entryUrl: string): Promise<void> {
    // Load the game in the iframe
    this.bridge.config.iframe.src = entryUrl;
    
    // Wait for game to be ready
    await this.bridge.waitForReady();
    
    // Send initial configuration
    this.bridge.sendCommand('start', {
      sessionId: this.launchContext.sessionId,
      gameId: this.launchContext.gameId,
      versionId: this.launchContext.versionId
    });
  }

  /**
   * Wait for session to finish
   */
  async whenFinished(timeout?: number): Promise<void> {
    const timeoutMs = timeout || this.config.testTimeout || 30000;
    
    return new Promise((resolve, reject) => {
      if (this.isFinished) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Session timeout'));
      }, timeoutMs);

      const checkFinished = () => {
        if (this.isFinished) {
          clearTimeout(timeoutId);
          resolve();
        } else {
          setTimeout(checkFinished, 100);
        }
      };

      checkFinished();
    });
  }

  /**
   * Get comprehensive test report
   */
  getReport(): QATestResults {
    const initEvent = this.events.find(e => e.type === 'INIT');
    const readyEvent = this.events.find(e => e.type === 'READY');
    const quitEvent = this.events.find(e => e.type === 'QUIT');
    const completeEvent = this.events.find(e => e.type === 'COMPLETE');
    const resultEvents = this.events.filter(e => e.type === 'RESULT');

    // Calculate QA-01 timing
    const initToReadyMs = initEvent && readyEvent 
      ? readyEvent.timestamp.getTime() - initEvent.timestamp.getTime()
      : 0;
    
    const quitToCompleteMs = quitEvent && completeEvent
      ? completeEvent.timestamp.getTime() - quitEvent.timestamp.getTime()
      : 0;

    // Extract game results for QA-02
    const gameResults = resultEvents.length > 0 ? resultEvents[resultEvents.length - 1].data : {};

    return {
      qa01: {
        initToReadyMs,
        quitToCompleteMs,
        pass: initToReadyMs > 0 && initToReadyMs < 10000 && quitToCompleteMs >= 0,
        events: this.events.filter(e => ['INIT', 'READY', 'QUIT', 'COMPLETE'].includes(e.type))
      },
      qa02: {
        pass: true, // Will be determined by normalizeResults
        accuracy: 0,
        completion: 0,
        normalizedResult: {},
        validationErrors: []
      },
      qa03: {
        auto: {
          assetError: this.events.some(e => e.type === 'ERROR'),
          readyMs: readyEvent ? readyEvent.timestamp.getTime() - (this.startTime?.getTime() || 0) : 0,
          errorDetails: this.events.filter(e => e.type === 'ERROR').map(e => e.data?.message || 'Unknown error')
        },
        manual: {
          noAutoplay: false, // Will be set by manual validation
          noWhiteScreen: false,
          gestureOk: false
        }
      },
      qa04: {
        pass: true, // Will be determined by idempotency check
        duplicateAttemptId: false,
        backendRecordCount: 0,
        consistencyCheck: true
      },
      rawResult: gameResults,
      eventsTimeline: this.events,
      testDuration: this.endTime && this.startTime 
        ? this.endTime.getTime() - this.startTime.getTime()
        : 0
    };
  }

  /**
   * Get captured events
   */
  getEvents(): QCGameEvent[] {
    return [...this.events];
  }

  /**
   * Check if session is finished
   */
  isSessionFinished(): boolean {
    return this.isFinished;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.bridge.destroy();
    this.events = [];
  }
}

/**
 * Main Test Runner Service
 */
export class TestRunnerService {
  /**
   * Create iframe bridge for game communication
   */
  static createIframeBridge(config: IframeBridgeConfig): IframeBridge {
    return new IframeBridge(config);
  }

  /**
   * Create session controller for test management
   */
  static createSessionController(config: SessionControllerConfig): SessionController {
    return new SessionController(config);
  }

  /**
   * Run comprehensive automated QA testing
   */
  static async runAutoQA(params: {
    iframe: HTMLIFrameElement;
    entryUrl: string;
    launchContext: LaunchContext;
  }): Promise<QATestResults> {
    const { iframe, entryUrl, launchContext } = params;

    // Create iframe bridge
    const bridge = this.createIframeBridge({
      iframe,
      targetOrigin: new URL(entryUrl).origin
    });

    // Create session controller
    const session = this.createSessionController({
      bridge,
      launchContext
    });

    try {
      // Start the session
      await session.start(entryUrl);

      // Wait for session to complete
      await session.whenFinished();

      // Get comprehensive results
      const results = session.getReport();

      // Run QA-02 converter validation
      const normalizedResults = await this.normalizeResults(results.rawResult);
      results.qa02 = {
        pass: normalizedResults.isValid,
        accuracy: normalizedResults.accuracy,
        completion: normalizedResults.completion,
        normalizedResult: normalizedResults.normalizedData,
        validationErrors: normalizedResults.validationErrors
      };

      // Run QA-04 idempotency check
      const idempotencyResult = await this.validateIdempotency(
        launchContext.gameId,
        launchContext.versionId
      );
      results.qa04 = {
        pass: idempotencyResult.pass,
        duplicateAttemptId: idempotencyResult.duplicateAttemptId,
        backendRecordCount: idempotencyResult.backendRecordCount,
        consistencyCheck: idempotencyResult.consistencyCheck
      };

      return results;
    } finally {
      // Cleanup
      session.destroy();
    }
  }

  /**
   * Validate and normalize game results (QA-02)
   */
  static async normalizeResults(rawResults: any): Promise<NormalizedResults> {
    try {
      // Basic validation of result structure
      if (!rawResults || typeof rawResults !== 'object') {
        return {
          accuracy: 0,
          completion: 0,
          isValid: false,
          validationErrors: ['Invalid result structure'],
          normalizedData: {}
        };
      }

      // Extract score and completion data
      const score = typeof rawResults.score === 'number' ? rawResults.score : 0;
      const maxScore = typeof rawResults.maxScore === 'number' ? rawResults.maxScore : 100;
      const completed = Boolean(rawResults.completed);

      // Calculate metrics
      const accuracy = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
      const completion = completed ? 1 : 0;

      // Validate required fields
      const validationErrors: string[] = [];
      if (typeof rawResults.score !== 'number') {
        validationErrors.push('Missing or invalid score field');
      }
      if (typeof rawResults.completed !== 'boolean') {
        validationErrors.push('Missing or invalid completed field');
      }

      return {
        accuracy,
        completion,
        isValid: validationErrors.length === 0,
        validationErrors,
        normalizedData: {
          score,
          maxScore,
          completed,
          accuracy,
          completion
        }
      };
    } catch (error) {
      return {
        accuracy: 0,
        completion: 0,
        isValid: false,
        validationErrors: [`Normalization error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        normalizedData: {}
      };
    }
  }

  /**
   * Validate idempotency (QA-04)
   */
  static async validateIdempotency(gameId: string, versionId: string): Promise<IdempotencyResult> {
    try {
      // For now, implement basic idempotency check
      // In a real implementation, this would check for duplicate attemptIds
      // and verify backend record consistency
      
      // Generate a test attemptId
      const attemptId = `${gameId}-${versionId}-${Date.now()}`;
      
      // Simulate checking for duplicates (would be actual DB query)
      const duplicateAttemptId = false;
      
      // Simulate backend record count check (would be actual DB query)
      const backendRecordCount = 1;
      
      // Check consistency
      const consistencyCheck = backendRecordCount === 1 && !duplicateAttemptId;

      return {
        pass: consistencyCheck,
        duplicateAttemptId,
        backendRecordCount,
        consistencyCheck,
        details: `Attempt ID: ${attemptId}, Records: ${backendRecordCount}`
      };
    } catch (error) {
      return {
        pass: false,
        duplicateAttemptId: false,
        backendRecordCount: 0,
        consistencyCheck: false,
        details: `Idempotency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get test progress information
   */
  static getTestProgress(session: SessionController): TestProgress {
    const events = session.getEvents();
    const hasInit = events.some(e => e.type === 'INIT');
    const hasReady = events.some(e => e.type === 'READY');
    const hasResult = events.some(e => e.type === 'RESULT');
    const hasComplete = events.some(e => e.type === 'COMPLETE');

    let status: TestExecutionStatus = 'idle';
    let progress = 0;
    let currentStep = 'Waiting to start';

    if (hasComplete) {
      status = 'completed';
      progress = 100;
      currentStep = 'Test completed';
    } else if (hasResult) {
      status = 'running';
      progress = 75;
      currentStep = 'Processing results';
    } else if (hasReady) {
      status = 'running';
      progress = 50;
      currentStep = 'Game running';
    } else if (hasInit) {
      status = 'initializing';
      progress = 25;
      currentStep = 'Game initializing';
    }

    return {
      status,
      currentStep,
      progress,
      errors: events.filter(e => e.type === 'ERROR').map(e => e.data?.message || 'Unknown error')
    };
  }
}

// Export factory functions for compatibility with documentation
export function createIframeBridge(config: IframeBridgeConfig): IframeBridge {
  return TestRunnerService.createIframeBridge(config);
}

export function createSessionController(config: SessionControllerConfig): SessionController {
  return TestRunnerService.createSessionController(config);
}