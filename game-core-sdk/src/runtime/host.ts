import type { GameEvent, GameEventHandler, GameEventType, EventListenerConfig } from './events';

/**
 * Host-side iframe communication manager
 * Used by the Game Manager to communicate with games running in iframes
 */
export class GameHost {
  private iframe: HTMLIFrameElement;
  private listeners: Map<GameEventType, Set<GameEventHandler>> = new Map();
  private gameOrigin: string;
  private isReady: boolean = false;

  constructor(iframe: HTMLIFrameElement, gameOrigin: string) {
    this.iframe = iframe;
    this.gameOrigin = gameOrigin;
    this.setupMessageListener();
  }

  /**
   * Set up message listener for iframe communication
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.origin !== this.gameOrigin) {
        return;
      }

      // Verify source is our iframe
      if (event.source !== this.iframe.contentWindow) {
        return;
      }

      try {
        const gameEvent = event.data as GameEvent;
        this.handleGameEvent(gameEvent);
      } catch (error) {
        console.error('Failed to handle game event:', error);
      }
    });
  }

  /**
   * Handle incoming game events
   */
  private handleGameEvent(event: GameEvent): void {
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

    // Handle special events
    if (event.type === GameEventType.GAME_READY) {
      this.isReady = true;
    }
  }

  /**
   * Add event listener for specific game event type
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
   * Send command to game
   */
  sendCommand(command: string, params?: Record<string, any>): void {
    if (!this.isReady) {
      console.warn('Game is not ready, command ignored:', command);
      return;
    }

    const event: GameEvent = {
      type: GameEventType.HOST_COMMAND,
      timestamp: Date.now(),
      data: { command, params }
    } as any;

    this.postMessage(event);
  }

  /**
   * Send configuration to game
   */
  sendConfig(config: Record<string, any>): void {
    const event: GameEvent = {
      type: GameEventType.HOST_CONFIG,
      timestamp: Date.now(),
      data: config
    } as any;

    this.postMessage(event);
  }

  /**
   * Post message to iframe
   */
  private postMessage(event: GameEvent): void {
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(event, this.gameOrigin);
    }
  }

  /**
   * Check if game is ready
   */
  getReadyState(): boolean {
    return this.isReady;
  }

  /**
   * Wait for game to be ready
   */
  waitForReady(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        this.removeEventListener(GameEventType.GAME_READY, readyHandler);
        reject(new Error('Game ready timeout'));
      }, timeout);

      const readyHandler = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      this.addEventListener(GameEventType.GAME_READY, readyHandler, { once: true });
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.listeners.clear();
    this.isReady = false;
  }
}