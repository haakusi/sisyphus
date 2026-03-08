/**
 * Background Agent Manager
 *
 * Manages the lifecycle and execution of background agents.
 */
import type { BackgroundTask, TaskStatus, CompletionResult } from '../agents/types.js';
export interface BackgroundManagerOptions {
    maxParallel?: number;
    stallTimeout?: number;
    stabilityPolls?: number;
    stabilityInterval?: number;
    ttl?: number;
}
export type TaskCompletionCallback = (result: CompletionResult) => void;
export declare class BackgroundManager {
    private concurrency;
    private queue;
    private tasks;
    private pendingByParent;
    private stallTimeout;
    private stabilityPolls;
    private stabilityInterval;
    private ttl;
    private cleanupInterval?;
    private isShuttingDown;
    constructor(options?: BackgroundManagerOptions);
    /**
     * Submit a new background task
     */
    submit(task: BackgroundTask): Promise<string>;
    /**
     * Process tasks in a queue
     */
    private processQueue;
    /**
     * Start executing a task
     */
    private startTask;
    /**
     * Start polling for task stability
     */
    private startStabilityPolling;
    /**
     * Check if a task has stabilized
     */
    private checkStability;
    /**
     * Handle session idle event
     */
    onSessionIdle(taskId: string): void;
    /**
     * Update message count for a task
     */
    updateMessageCount(taskId: string, count: number): void;
    /**
     * Complete a task (atomic operation)
     */
    private completeTask;
    /**
     * Check if all child tasks are complete
     */
    private checkParentCompletion;
    /**
     * Handle task error
     */
    private handleTaskError;
    /**
     * Get task status
     */
    getStatus(taskId: string): TaskStatus | null;
    /**
     * Get task by ID
     */
    getTask(taskId: string): BackgroundTask | null;
    /**
     * Register completion callback
     */
    onComplete(taskId: string, callback: TaskCompletionCallback): void;
    /**
     * Cancel a task
     */
    cancel(taskId: string): boolean;
    /**
     * Get all running tasks
     */
    getRunningTasks(): BackgroundTask[];
    /**
     * Get tasks by parent ID
     */
    getTasksByParent(parentId: string): BackgroundTask[];
    /**
     * Clean up old tasks
     */
    private cleanup;
    /**
     * Shutdown the manager
     */
    shutdown(): Promise<void>;
}
export declare function getBackgroundManager(): BackgroundManager;
export declare function resetBackgroundManager(): void;
//# sourceMappingURL=manager.d.ts.map