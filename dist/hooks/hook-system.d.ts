/**
 * Hook System - Comprehensive Event Hook Infrastructure
 *
 * Provides 25+ extension points for customizing Claude Code behavior.
 * Hooks can be synchronous or asynchronous, and can modify data or perform side effects.
 *
 * Hook Categories:
 * - Session: start, end, idle, resume
 * - Tool: pre-execute, post-execute, error
 * - User: prompt-submit, response-ready
 * - Context: compaction, overflow, refresh
 * - File: change, create, delete
 * - Git: commit, push, pull, merge
 * - Task: create, start, complete, fail
 * - Error: occurred, recovered, fatal
 */
import { EventEmitter } from 'events';
export type HookPriority = 'high' | 'normal' | 'low';
export interface HookContext<T = unknown> {
    /** Hook name */
    hookName: string;
    /** Original data passed to the hook */
    data: T;
    /** Modified data (hooks can update this) */
    modifiedData: T;
    /** Timestamp when hook was triggered */
    timestamp: number;
    /** Session ID */
    sessionId?: string;
    /** Whether to cancel the operation */
    cancelled: boolean;
    /** Reason for cancellation */
    cancelReason?: string;
    /** Additional metadata */
    metadata: Record<string, unknown>;
}
export type HookHandler<T = unknown> = (context: HookContext<T>) => void | Promise<void>;
export interface RegisteredHook<T = unknown> {
    id: string;
    name: string;
    handler: HookHandler<T>;
    priority: HookPriority;
    enabled: boolean;
    description?: string;
    once?: boolean;
}
export interface HookDefinition {
    name: string;
    description: string;
    category: string;
    dataType: string;
    cancellable: boolean;
    modifiable: boolean;
}
export declare const HOOK_DEFINITIONS: HookDefinition[];
export interface SessionStartData {
    sessionId: string;
    startTime: number;
    projectRoot: string;
    config: Record<string, unknown>;
}
export interface SessionEndData {
    sessionId: string;
    endTime: number;
    duration: number;
    stats: {
        toolCalls: number;
        tokensUsed: number;
        tasksCompleted: number;
    };
}
export interface SessionIdleData {
    sessionId: string;
    idleSince: number;
    pendingTasks: number;
}
export interface SessionResumeData {
    sessionId: string;
    resumeTime: number;
    idleDuration: number;
}
export interface ToolExecuteData {
    toolName: string;
    parameters: Record<string, unknown>;
    timestamp: number;
}
export interface ToolResultData {
    toolName: string;
    result: unknown;
    success: boolean;
    duration: number;
}
export interface ToolErrorData {
    toolName: string;
    error: Error;
    parameters: Record<string, unknown>;
}
export interface UserPromptData {
    prompt: string;
    timestamp: number;
    sessionId: string;
}
export interface ResponseData {
    content: string;
    toolCalls: string[];
    timestamp: number;
}
export interface InterruptData {
    reason: string;
    timestamp: number;
}
export interface CompactionData {
    currentTokens: number;
    targetTokens: number;
    preservedFiles: string[];
}
export interface OverflowData {
    currentTokens: number;
    maxTokens: number;
    percentage: number;
}
export interface RefreshData {
    reason: string;
    newContext: string[];
}
export interface FileChangeData {
    path: string;
    changeType: 'modified' | 'created' | 'deleted';
    timestamp: number;
}
export interface FileCreateData {
    path: string;
    content?: string;
}
export interface FileDeleteData {
    path: string;
}
export interface FileReadData {
    path: string;
    size: number;
}
export interface GitCommitData {
    message: string;
    files: string[];
    branch: string;
}
export interface GitPushData {
    branch: string;
    remote: string;
    commits: number;
}
export interface GitPullData {
    branch: string;
    remote: string;
    changes: number;
}
export interface TaskData {
    id: string;
    subject: string;
    description: string;
    status: string;
}
export interface TaskCompleteData extends TaskData {
    duration: number;
    result?: unknown;
}
export interface TaskFailData extends TaskData {
    error: Error;
    attempts: number;
}
export interface ErrorData {
    error: Error;
    context: string;
    recoverable: boolean;
}
export interface ErrorRecoveryData {
    originalError: Error;
    recoveryMethod: string;
}
export interface FatalErrorData {
    error: Error;
    stack: string;
    sessionWillTerminate: boolean;
}
export declare class HookSystem extends EventEmitter {
    private hooks;
    private hookIdCounter;
    private sessionId;
    private enabled;
    private executionLog;
    constructor();
    private initializeHooks;
    /**
     * Register a hook handler
     */
    register<T = unknown>(hookName: string, handler: HookHandler<T>, options?: {
        priority?: HookPriority;
        description?: string;
        once?: boolean;
    }): string;
    /**
     * Unregister a hook handler
     */
    unregister(hookId: string): boolean;
    /**
     * Enable/disable a hook handler
     */
    setEnabled(hookId: string, enabled: boolean): boolean;
    /**
     * Trigger a hook
     */
    trigger<T = unknown>(hookName: string, data: T, metadata?: Record<string, unknown>): Promise<HookContext<T>>;
    /**
     * Trigger a hook synchronously (for simple hooks)
     */
    triggerSync<T = unknown>(hookName: string, data: T, metadata?: Record<string, unknown>): HookContext<T>;
    private createContext;
    /**
     * Get all registered hooks
     */
    getRegisteredHooks(): Map<string, RegisteredHook[]>;
    /**
     * Get hook definitions
     */
    getHookDefinitions(): HookDefinition[];
    /**
     * Get hooks by category
     */
    getHooksByCategory(category: string): HookDefinition[];
    /**
     * Get execution statistics
     */
    getExecutionStats(): {
        totalExecutions: number;
        successRate: number;
        averageDuration: number;
        byHook: Record<string, {
            count: number;
            avgDuration: number;
        }>;
    };
    /**
     * Set session ID
     */
    setSessionId(sessionId: string): void;
    /**
     * Enable/disable the entire hook system
     */
    setSystemEnabled(enabled: boolean): void;
    /**
     * Clear all hooks
     */
    clearAll(): void;
}
export declare function getHookSystem(): HookSystem;
export declare function registerHook<T = unknown>(hookName: string, handler: HookHandler<T>, options?: {
    priority?: HookPriority;
    description?: string;
    once?: boolean;
}): string;
export declare function unregisterHook(hookId: string): boolean;
export declare function triggerHook<T = unknown>(hookName: string, data: T, metadata?: Record<string, unknown>): Promise<HookContext<T>>;
export declare function triggerHookSync<T = unknown>(hookName: string, data: T, metadata?: Record<string, unknown>): HookContext<T>;
//# sourceMappingURL=hook-system.d.ts.map