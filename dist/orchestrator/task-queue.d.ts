/**
 * Task Queue
 *
 * Manages queuing and processing of background tasks.
 */
import type { BackgroundTask } from '../agents/types.js';
export interface QueuedTask {
    task: BackgroundTask;
    addedAt: Date;
    priority: number;
}
export type TaskEventType = 'enqueued' | 'started' | 'completed' | 'cancelled' | 'error';
export interface TaskEvent {
    type: TaskEventType;
    task: BackgroundTask;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export type TaskEventHandler = (event: TaskEvent) => void;
export declare class TaskQueue {
    private queues;
    private processing;
    private eventHandlers;
    /**
     * Add a task to the queue
     */
    enqueue(task: BackgroundTask, priority?: number): void;
    /**
     * Get the next task from a queue
     */
    dequeue(key: string): BackgroundTask | null;
    /**
     * Peek at the next task without removing it
     */
    peek(key: string): BackgroundTask | null;
    /**
     * Get all tasks in a queue
     */
    getQueue(key: string): BackgroundTask[];
    /**
     * Get all queue keys
     */
    getQueueKeys(): string[];
    /**
     * Get total queue length across all keys
     */
    getTotalLength(): number;
    /**
     * Mark a queue as being processed
     */
    markProcessing(key: string): void;
    /**
     * Mark a queue as no longer being processed
     */
    markIdle(key: string): void;
    /**
     * Check if a queue is being processed
     */
    isProcessing(key: string): boolean;
    /**
     * Remove a task from any queue
     */
    remove(taskId: string): BackgroundTask | null;
    /**
     * Find a task by ID
     */
    find(taskId: string): BackgroundTask | null;
    /**
     * Clear all queues
     */
    clear(): void;
    /**
     * Register an event handler
     */
    on(event: TaskEventType, handler: TaskEventHandler): void;
    /**
     * Remove an event handler
     */
    off(event: TaskEventType, handler: TaskEventHandler): void;
    /**
     * Emit an event
     */
    private emit;
}
//# sourceMappingURL=task-queue.d.ts.map