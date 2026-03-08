/**
 * Session Manager Hook
 *
 * Manages session lifecycle and state.
 */

import {
  initializeSession,
  endSession,
  getState,
  markIdle,
  recordActivity,
} from '../orchestrator/state.js';
import { getBackgroundManager } from '../orchestrator/manager.js';

// ============================================
// Types
// ============================================

export interface SessionInfo {
  id: string;
  projectRoot: string;
  startedAt: Date;
}

export interface SessionManagerCallbacks {
  onSessionStart?: (info: SessionInfo) => void;
  onSessionEnd?: (info: SessionInfo) => void;
  onSessionIdle?: () => void;
  onSessionActive?: () => void;
}

// ============================================
// Session Manager
// ============================================

export class SessionManager {
  private callbacks: SessionManagerCallbacks;
  private currentSession: SessionInfo | null = null;
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private idleThreshold: number;

  constructor(
    callbacks: SessionManagerCallbacks = {},
    idleThreshold: number = 30000 // 30 seconds
  ) {
    this.callbacks = callbacks;
    this.idleThreshold = idleThreshold;
  }

  /**
   * Start a new session
   */
  start(sessionId: string, projectRoot: string): void {
    this.currentSession = {
      id: sessionId,
      projectRoot,
      startedAt: new Date(),
    };

    initializeSession(sessionId, projectRoot);
    this.callbacks.onSessionStart?.(this.currentSession);
    this.resetIdleTimer();
  }

  /**
   * End the current session
   */
  end(): void {
    if (this.currentSession) {
      this.callbacks.onSessionEnd?.(this.currentSession);
      endSession();
      this.currentSession = null;
    }

    this.clearIdleTimer();

    // Shutdown background manager
    getBackgroundManager().shutdown();
  }

  /**
   * Record activity and reset idle timer
   */
  activity(): void {
    recordActivity();
    this.resetIdleTimer();

    const state = getState();
    if (state.isIdle) {
      this.callbacks.onSessionActive?.();
    }
  }

  /**
   * Reset the idle timer
   */
  private resetIdleTimer(): void {
    this.clearIdleTimer();

    this.idleTimeout = setTimeout(() => {
      this.onIdle();
    }, this.idleThreshold);
  }

  /**
   * Clear the idle timer
   */
  private clearIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  /**
   * Handle idle state
   */
  private onIdle(): void {
    markIdle();
    this.callbacks.onSessionIdle?.();
  }

  /**
   * Get current session info
   */
  getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number {
    if (!this.currentSession) {
      return 0;
    }
    return Date.now() - this.currentSession.startedAt.getTime();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearIdleTimer();
    if (this.currentSession) {
      this.end();
    }
  }
}

// ============================================
// Factory Function
// ============================================

export function createSessionManager(
  callbacks?: SessionManagerCallbacks,
  idleThreshold?: number
): SessionManager {
  return new SessionManager(callbacks, idleThreshold);
}

// ============================================
// Hook Handler
// ============================================

export interface SessionManagerHookHandlers {
  onSessionStart: (sessionId: string, projectRoot: string) => void;
  onSessionEnd: () => void;
  onMessage: () => void;
  onToolUse: () => void;
  destroy: () => void;
}

export function createSessionManagerHook(
  callbacks: SessionManagerCallbacks = {}
): SessionManagerHookHandlers {
  const manager = createSessionManager(callbacks);

  return {
    onSessionStart: (sessionId: string, projectRoot: string) =>
      manager.start(sessionId, projectRoot),
    onSessionEnd: () => manager.end(),
    onMessage: () => manager.activity(),
    onToolUse: () => manager.activity(),
    destroy: () => manager.destroy(),
  };
}
