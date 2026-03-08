/**
 * Session Manager Hook
 *
 * Manages session lifecycle and state.
 */
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
export declare class SessionManager {
    private callbacks;
    private currentSession;
    private idleTimeout;
    private idleThreshold;
    constructor(callbacks?: SessionManagerCallbacks, idleThreshold?: number);
    /**
     * Start a new session
     */
    start(sessionId: string, projectRoot: string): void;
    /**
     * End the current session
     */
    end(): void;
    /**
     * Record activity and reset idle timer
     */
    activity(): void;
    /**
     * Reset the idle timer
     */
    private resetIdleTimer;
    /**
     * Clear the idle timer
     */
    private clearIdleTimer;
    /**
     * Handle idle state
     */
    private onIdle;
    /**
     * Get current session info
     */
    getCurrentSession(): SessionInfo | null;
    /**
     * Check if session is active
     */
    isActive(): boolean;
    /**
     * Get session duration in milliseconds
     */
    getSessionDuration(): number;
    /**
     * Cleanup
     */
    destroy(): void;
}
export declare function createSessionManager(callbacks?: SessionManagerCallbacks, idleThreshold?: number): SessionManager;
export interface SessionManagerHookHandlers {
    onSessionStart: (sessionId: string, projectRoot: string) => void;
    onSessionEnd: () => void;
    onMessage: () => void;
    onToolUse: () => void;
    destroy: () => void;
}
export declare function createSessionManagerHook(callbacks?: SessionManagerCallbacks): SessionManagerHookHandlers;
//# sourceMappingURL=session-manager.d.ts.map