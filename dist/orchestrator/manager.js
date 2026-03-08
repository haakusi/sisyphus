/**
 * Background Agent Manager
 *
 * Manages the lifecycle and execution of background agents.
 */
import { getConfig } from '../config/index.js';
import { ConcurrencyManager } from './concurrency.js';
import { TaskQueue } from './task-queue.js';
// ============================================
// Background Manager
// ============================================
export class BackgroundManager {
    concurrency;
    queue;
    tasks = new Map();
    pendingByParent = new Map();
    stallTimeout;
    stabilityPolls;
    stabilityInterval;
    ttl;
    cleanupInterval;
    isShuttingDown = false;
    constructor(options = {}) {
        const config = getConfig().concurrency;
        this.concurrency = new ConcurrencyManager(options.maxParallel ?? config.maxParallel);
        this.queue = new TaskQueue();
        this.stallTimeout = options.stallTimeout ?? config.stallTimeout;
        this.stabilityPolls = options.stabilityPolls ?? config.stabilityPolls;
        this.stabilityInterval = options.stabilityInterval ?? config.stabilityInterval;
        this.ttl = options.ttl ?? config.ttl;
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    // ============================================
    // Task Submission
    // ============================================
    /**
     * Submit a new background task
     */
    async submit(task) {
        // Initialize task state
        const state = {
            task: { ...task, status: 'pending' },
            messageCount: 0,
            stablePolls: 0,
            lastActivity: new Date(),
            completionCallbacks: [],
        };
        this.tasks.set(task.id, state);
        // Track parent relationship
        if (task.parentId) {
            if (!this.pendingByParent.has(task.parentId)) {
                this.pendingByParent.set(task.parentId, new Set());
            }
            this.pendingByParent.get(task.parentId).add(task.id);
        }
        // Add to queue
        this.queue.enqueue(task);
        // Start processing
        this.processQueue(task.concurrencyKey);
        return task.id;
    }
    /**
     * Process tasks in a queue
     */
    async processQueue(key) {
        if (this.queue.isProcessing(key)) {
            return;
        }
        this.queue.markProcessing(key);
        while (true) {
            const task = this.queue.dequeue(key);
            if (!task)
                break;
            const state = this.tasks.get(task.id);
            if (!state)
                continue;
            try {
                // Acquire concurrency slot
                await this.concurrency.acquire(key, task.id);
                // Start the task
                await this.startTask(state);
                // Release slot when complete
                this.concurrency.release(task.id);
            }
            catch (error) {
                this.handleTaskError(state, error);
                this.concurrency.release(task.id);
            }
        }
        this.queue.markIdle(key);
    }
    /**
     * Start executing a task
     */
    async startTask(state) {
        state.task.status = 'running';
        state.task.startedAt = new Date();
        state.lastActivity = new Date();
        // Start stability polling
        this.startStabilityPolling(state);
    }
    // ============================================
    // Completion Detection
    // ============================================
    /**
     * Start polling for task stability
     */
    startStabilityPolling(state) {
        state.pollInterval = setInterval(() => {
            this.checkStability(state);
        }, this.stabilityInterval);
    }
    /**
     * Check if a task has stabilized
     */
    checkStability(state) {
        const now = new Date();
        const timeSinceStart = state.task.startedAt
            ? now.getTime() - state.task.startedAt.getTime()
            : 0;
        // Minimum execution time before stability detection
        if (timeSinceStart < getConfig().todoEnforcer.minExecutionTime) {
            return;
        }
        // Check for stall timeout
        const timeSinceActivity = now.getTime() - state.lastActivity.getTime();
        if (timeSinceActivity > this.stallTimeout) {
            this.completeTask(state, 'timeout');
            return;
        }
        // Check for stability (no message count changes)
        // In a real implementation, this would check actual output
        state.stablePolls++;
        if (state.stablePolls >= this.stabilityPolls) {
            this.completeTask(state, 'stability');
        }
    }
    /**
     * Handle session idle event
     */
    onSessionIdle(taskId) {
        const state = this.tasks.get(taskId);
        if (!state || state.task.status !== 'running')
            return;
        // Complete if we have output
        if (state.messageCount > 0) {
            this.completeTask(state, 'idle_event');
        }
    }
    /**
     * Update message count for a task
     */
    updateMessageCount(taskId, count) {
        const state = this.tasks.get(taskId);
        if (!state)
            return;
        if (count !== state.messageCount) {
            state.messageCount = count;
            state.stablePolls = 0; // Reset stability counter
            state.lastActivity = new Date();
        }
    }
    // ============================================
    // Task Completion
    // ============================================
    /**
     * Complete a task (atomic operation)
     */
    completeTask(state, reason) {
        // Atomic check - only complete if still running
        if (state.task.status !== 'running') {
            return false;
        }
        state.task.status = 'completed';
        state.task.completedAt = new Date();
        // Stop polling
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = undefined;
        }
        // Create completion result
        const result = {
            reason,
            task: state.task,
            output: '', // Would contain actual output in real implementation
        };
        // Notify callbacks
        for (const callback of state.completionCallbacks) {
            try {
                callback(result);
            }
            catch (error) {
                console.error('Error in completion callback:', error);
            }
        }
        // Check parent completion
        if (state.task.parentId) {
            this.checkParentCompletion(state.task.parentId);
        }
        return true;
    }
    /**
     * Check if all child tasks are complete
     */
    checkParentCompletion(parentId) {
        const children = this.pendingByParent.get(parentId);
        if (!children)
            return;
        for (const childId of children) {
            const childState = this.tasks.get(childId);
            if (childState && childState.task.status === 'running') {
                return; // Still have running children
            }
        }
        // All children complete - notify parent
        // In a real implementation, this would trigger a parent notification
    }
    /**
     * Handle task error
     */
    handleTaskError(state, error) {
        state.task.status = 'error';
        state.task.error = error;
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
        }
        const result = {
            reason: 'error',
            task: state.task,
            output: error.message,
        };
        for (const callback of state.completionCallbacks) {
            try {
                callback(result);
            }
            catch (e) {
                console.error('Error in completion callback:', e);
            }
        }
    }
    // ============================================
    // Task Management
    // ============================================
    /**
     * Get task status
     */
    getStatus(taskId) {
        const state = this.tasks.get(taskId);
        return state?.task.status ?? null;
    }
    /**
     * Get task by ID
     */
    getTask(taskId) {
        const state = this.tasks.get(taskId);
        return state?.task ?? null;
    }
    /**
     * Register completion callback
     */
    onComplete(taskId, callback) {
        const state = this.tasks.get(taskId);
        if (!state)
            return;
        // If already complete, call immediately
        if (state.task.status === 'completed' || state.task.status === 'error') {
            callback({
                reason: state.task.status === 'error' ? 'error' : 'stability',
                task: state.task,
                output: '',
            });
            return;
        }
        state.completionCallbacks.push(callback);
    }
    /**
     * Cancel a task
     */
    cancel(taskId) {
        const state = this.tasks.get(taskId);
        if (!state || state.task.status !== 'running') {
            return false;
        }
        state.task.status = 'cancelled';
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
        }
        this.concurrency.release(taskId);
        const result = {
            reason: 'user_cancel',
            task: state.task,
            output: '',
        };
        for (const callback of state.completionCallbacks) {
            try {
                callback(result);
            }
            catch (error) {
                console.error('Error in completion callback:', error);
            }
        }
        return true;
    }
    /**
     * Get all running tasks
     */
    getRunningTasks() {
        return Array.from(this.tasks.values())
            .filter((s) => s.task.status === 'running')
            .map((s) => s.task);
    }
    /**
     * Get tasks by parent ID
     */
    getTasksByParent(parentId) {
        const childIds = this.pendingByParent.get(parentId);
        if (!childIds)
            return [];
        return Array.from(childIds)
            .map((id) => this.tasks.get(id)?.task)
            .filter((t) => t !== undefined);
    }
    // ============================================
    // Cleanup
    // ============================================
    /**
     * Clean up old tasks
     */
    cleanup() {
        const now = new Date();
        for (const [id, state] of this.tasks.entries()) {
            // Remove tasks older than TTL
            const age = now.getTime() - (state.task.startedAt?.getTime() ?? now.getTime());
            if (age > this.ttl && state.task.status !== 'running') {
                this.tasks.delete(id);
                // Clean up parent tracking
                if (state.task.parentId) {
                    const children = this.pendingByParent.get(state.task.parentId);
                    if (children) {
                        children.delete(id);
                        if (children.size === 0) {
                            this.pendingByParent.delete(state.task.parentId);
                        }
                    }
                }
            }
        }
    }
    /**
     * Shutdown the manager
     */
    async shutdown() {
        this.isShuttingDown = true;
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Cancel all running tasks
        for (const state of this.tasks.values()) {
            if (state.task.status === 'running') {
                this.cancel(state.task.id);
            }
            if (state.pollInterval) {
                clearInterval(state.pollInterval);
            }
        }
        this.tasks.clear();
        this.pendingByParent.clear();
        this.concurrency.clearAll();
        this.queue.clear();
    }
}
// ============================================
// Singleton Instance
// ============================================
let managerInstance = null;
export function getBackgroundManager() {
    if (!managerInstance) {
        managerInstance = new BackgroundManager();
    }
    return managerInstance;
}
export function resetBackgroundManager() {
    if (managerInstance) {
        managerInstance.shutdown();
        managerInstance = null;
    }
}
//# sourceMappingURL=manager.js.map