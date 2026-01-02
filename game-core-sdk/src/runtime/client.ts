import type { GameEvent, GameEventHandler, GameEventType, EventListenerConfig } from './events';

/**
 * Client-side iframe communication manager
 * Used by games running inside iframes to communicate with the host
 */
export class GameClient {
  private listeners: Map<GameEventType, Set<GameEventHandler>> = new Map();
  private hostOrigin: string;
  private isInitialized: boolean = false;

  constructor(hostOrigin: string) {
    this.hostOrigin = hostOrigin;
    this.setupMessageListener();
  }

  /**
   * Initialize the game client and notify host that game is ready
   */
  initialize(gameInfo: { version: string; capabilities: string[] }): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    
    // Notify host that game is ready
    this.sendEvent(GameEventType.GAME_READY, {
      version: gameInfo.version,
      capabilities: gameInfo.capabilities
    });
  }

  /**
   * Set up message listener for host communication
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.origin !== this.hostOrigin) {
        return;
      }

      try {
        const gameEvent = event.data as GameEvent;
        this.handleHostEvent(gameEvent);
      } catch (error) {
        console.error('Failed to handle host event:', error);
      }
    });
  }

  /**
   * Handle incoming host events
   */
  private handleHostEvent(event: GameEvent): void {
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
  }

  /**
   * Add event listener for host events
   */
  addEventListener<T extends GameEvent>(
    type: GameEventType,
    handler: GameEventHandler<T>,
    config?: EventListenerConfig
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const handlers = this.listeners.get(type)!;
    
    if (config?.once) {
      const onceHandler = (event: GameEvent) => {
        handler(event as T);
        this.removeEventListener(type, onceHandler);
      };
      handlers.add(onceHandler);
    } else {
      handlers.add(handler as GameEventHandler);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: GameEventType, handler: GameEventHandler): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Send event to host
   */
  sendEvent(type: GameEventType, data: any): void {
    if (!this.isInitialized && type !== GameEventType.GAME_READY) {
      console.warn('Game client not initialized, event ignored:', type);
      return;
    }

    const event: GameEvent = {
      type,
      timestamp: Date.now(),
      data
    } as any;

    this.postMessage(event);
  }

  /**
   * Send score update to host
   */
  updateScore(score: number, maxScore?: number, delta?: number): void {
    this.sendEvent(GameEventType.SCORE_UPDATE, {
      score,
      maxScore,
      delta
    });
  }

  /**
   * Send progress update to host
   */
  updateProgress(progress: number, stage?: string, details?: Record<string, any>): void {
    this.sendEvent(GameEventType.PROGRESS_UPDATE, {
      progress,
      stage,
      details
    });
  }

  /**
   * Send game start event
   */
  startGame(level?: number, difficulty?: string): void {
    this.sendEvent(GameEventType.GAME_START, {
      level,
      difficulty
    });
  }

  /**
   * Send game end event
   */
  endGame(score?: number, completed: boolean = true, duration: number = 0): void {
    this.sendEvent(GameEventType.GAME_END, {
      score,
      completed,
      duration
    });
  }

  /**
   * Send error event
   */
  reportError(message: string, code?: string, stack?: string): void {
    this.sendEvent(GameEventType.ERROR, {
      message,
      code,
      stack
    });
  }

  /**
   * Send log event
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    this.sendEvent(GameEventType.LOG, {
      level,
      message,
      data
    });
  }

  /**
   * Post message to parent window
   */
  private postMessage(event: GameEvent): void {
    if (window.parent) {
      window.parent.postMessage(event, this.hostOrigin);
    }
  }

  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.listeners.clear();
    this.isInitialized = false;
  }
}