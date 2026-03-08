/**
 * Session Manager Hook
 *
 * Manages session lifecycle and state.
 */
import { initializeSession, endSession, getState, markIdle, recordActivity, } from '../orchestrator/state.js';
import { getBackgroundManager } from '../orchestrator/manager.js';
// ============================================
// Session Manager
// ============================================
export class SessionManager {
    callbacks;
    currentSession = null;
    idleTimeout = null;
    idleThreshold;
    constructor(callbacks = {}, idleThreshold = 30000 // 30 seconds
    ) {
        this.callbacks = callbacks;
        this.idleThreshold = idleThreshold;
    }
    /**
     * Start a new session
     */
    start(sessionId, projectRoot) {
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
    end() {
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
    activity() {
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
    resetIdleTimer() {
        this.clearIdleTimer();
        this.idleTimeout = setTimeout(() => {
            this.onIdle();
        }, this.idleThreshold);
    }
    /**
     * Clear the idle timer
     */
    clearIdleTimer() {
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }
    }
    /**
     * Handle idle state
     */
    onIdle() {
        markIdle();
        this.callbacks.onSessionIdle?.();
    }
    /**
     * Get current session info
     */
    getCurrentSession() {
        return this.currentSession;
    }
    /**
     * Check if session is active
     */
    isActive() {
        return this.currentSession !== null;
    }
    /**
     * Get session duration in milliseconds
     */
    getSessionDuration() {
        if (!this.currentSession) {
            return 0;
        }
        return Date.now() - this.currentSession.startedAt.getTime();
    }
    /**
     * Cleanup
     */
    destroy() {
        this.clearIdleTimer();
        if (this.currentSession) {
            this.end();
        }
    }
}
// ============================================
// Factory Function
// ============================================
export function createSessionManager(callbacks, idleThreshold) {
    return new SessionManager(callbacks, idleThreshold);
}
export function createSessionManagerHook(callbacks = {}) {
    const manager = createSessionManager(callbacks);
    return {
        onSessionStart: (sessionId, projectRoot) => manager.start(sessionId, projectRoot),
        onSessionEnd: () => manager.end(),
        onMessage: () => manager.activity(),
        onToolUse: () => manager.activity(),
        destroy: () => manager.destroy(),
    };
}
//# sourceMappingURL=session-manager.js.map