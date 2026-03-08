/**
 * TODO Continuation Enforcer
 *
 * Automatically resumes work when incomplete tasks are detected
 * and the session becomes idle.
 */
export interface TodoItem {
    id: string;
    subject: string;
    status: 'pending' | 'in_progress' | 'completed';
    owner?: string;
    blockedBy?: string[];
}
export interface TodoEnforcerContext {
    getTodos: () => Promise<TodoItem[]>;
    resumeWork: (message: string) => Promise<void>;
    isAgentActive: () => boolean;
    getCurrentAgent: () => string | null;
}
export interface TodoEnforcerState {
    isCountingDown: boolean;
    countdownTimer: ReturnType<typeof setTimeout> | null;
    remainingSeconds: number;
    lastCheckTime: Date | null;
}
export declare class TodoEnforcer {
    private context;
    private state;
    private onCountdownUpdate?;
    private onAutoResume?;
    constructor(context: TodoEnforcerContext);
    /**
     * Set callback for countdown updates
     */
    setOnCountdownUpdate(callback: (seconds: number) => void): void;
    /**
     * Set callback for auto-resume
     */
    setOnAutoResume(callback: () => void): void;
    /**
     * Handle session becoming idle
     */
    onSessionIdle(): Promise<void>;
    /**
     * Find incomplete tasks
     */
    findIncompleteTasks(): Promise<TodoItem[]>;
    /**
     * Start countdown to auto-resume
     */
    startCountdown(seconds: number): void;
    /**
     * Countdown tick
     */
    private tick;
    /**
     * Cancel countdown
     */
    cancelCountdown(): void;
    /**
     * Auto-resume work
     */
    private autoResume;
    /**
     * Find the next task to work on
     */
    private findNextTask;
    /**
     * Build resume message
     */
    private buildResumeMessage;
    /**
     * Handle user activity (cancels countdown)
     */
    onUserActivity(): void;
    /**
     * Handle assistant activity (cancels countdown)
     */
    onAssistantActivity(): void;
    /**
     * Get current state
     */
    getState(): Readonly<TodoEnforcerState>;
    /**
     * Check if countdown is active
     */
    isCountdownActive(): boolean;
    /**
     * Get remaining countdown seconds
     */
    getRemainingSeconds(): number;
    /**
     * Cleanup
     */
    destroy(): void;
}
export declare function createTodoEnforcer(context: TodoEnforcerContext): TodoEnforcer;
export interface TodoEnforcerHookHandlers {
    onSessionIdle: () => Promise<void>;
    onUserMessage: () => void;
    onAssistantMessage: () => void;
    destroy: () => void;
}
export declare function createTodoEnforcerHook(context: TodoEnforcerContext): TodoEnforcerHookHandlers;
//# sourceMappingURL=todo-enforcer.d.ts.map