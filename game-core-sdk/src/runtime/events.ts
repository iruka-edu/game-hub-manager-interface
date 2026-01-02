/**
 * Event types for iframe communication between host and game
 */
export enum GameEventType {
  // Lifecycle events
  GAME_READY = 'game:ready',
  GAME_START = 'game:start',
  GAME_PAUSE = 'game:pause',
  GAME_RESUME = 'game:resume',
  GAME_END = 'game:end',
  
  // Score and progress events
  SCORE_UPDATE = 'score:update',
  PROGRESS_UPDATE = 'progress:update',
  LEVEL_COMPLETE = 'level:complete',
  
  // User interaction events
  USER_ACTION = 'user:action',
  HINT_REQUEST = 'hint:request',
  HINT_RESPONSE = 'hint:response',
  
  // System events
  ERROR = 'system:error',
  LOG = 'system:log',
  RESIZE = 'system:resize',
  
  // Host commands
  HOST_COMMAND = 'host:command',
  HOST_CONFIG = 'host:config'
}

/**
 * Base interface for all game events
 */
export interface BaseGameEvent {
  type: GameEventType;
  timestamp: number;
  gameId?: string;
}

/**
 * Game lifecycle events
 */
export interface GameReadyEvent extends BaseGameEvent {
  type: GameEventType.GAME_READY;
  data: {
    version: string;
    capabilities: string[];
  };
}

export interface GameStartEvent extends BaseGameEvent {
  type: GameEventType.GAME_START;
  data: {
    level?: number;
    difficulty?: string;
  };
}

export interface GameEndEvent extends BaseGameEvent {
  type: GameEventType.GAME_END;
  data: {
    score?: number;
    completed: boolean;
    duration: number;
  };
}

/**
 * Score and progress events
 */
export interface ScoreUpdateEvent extends BaseGameEvent {
  type: GameEventType.SCORE_UPDATE;
  data: {
    score: number;
    maxScore?: number;
    delta?: number;
  };
}

export interface ProgressUpdateEvent extends BaseGameEvent {
  type: GameEventType.PROGRESS_UPDATE;
  data: {
    progress: number; // 0-100 percentage
    stage?: string;
    details?: Record<string, any>;
  };
}

/**
 * System events
 */
export interface ErrorEvent extends BaseGameEvent {
  type: GameEventType.ERROR;
  data: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export interface LogEvent extends BaseGameEvent {
  type: GameEventType.LOG;
  data: {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: any;
  };
}

/**
 * Host command events
 */
export interface HostCommandEvent extends BaseGameEvent {
  type: GameEventType.HOST_COMMAND;
  data: {
    command: 'pause' | 'resume' | 'restart' | 'mute' | 'unmute';
    params?: Record<string, any>;
  };
}

export interface HostConfigEvent extends BaseGameEvent {
  type: GameEventType.HOST_CONFIG;
  data: {
    theme?: 'light' | 'dark';
    language?: string;
    settings?: Record<string, any>;
  };
}

/**
 * Union type for all game events
 */
export type GameEvent = 
  | GameReadyEvent
  | GameStartEvent
  | GameEndEvent
  | ScoreUpdateEvent
  | ProgressUpdateEvent
  | ErrorEvent
  | LogEvent
  | HostCommandEvent
  | HostConfigEvent;

/**
 * Event handler function type
 */
export type GameEventHandler<T extends GameEvent = GameEvent> = (event: T) => void;

/**
 * Event listener configuration
 */
export interface EventListenerConfig {
  once?: boolean;
  passive?: boolean;
}