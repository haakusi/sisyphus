/**
 * Background Agent Manager
 *
 * Manages the lifecycle and execution of background agents.
 */

import type {
  BackgroundTask,
  TaskStatus,
  CompletionReason,
  CompletionResult,
  AgentResult,
} from '../agents/types.js';
import { getConfig } from '../config/index.js';
import { ConcurrencyManager } from './concurrency.js';
import { TaskQueue } from './task-queue.js';

// ============================================
// Types
// ============================================

export interface BackgroundManagerOptions {
  maxParallel?: number;
  stallTimeout?: number;
  stabilityPolls?: number;
  stabilityInterval?: number;
  ttl?: number;
}

export type TaskCompletionCallback = (result: CompletionResult) => void;

interface TaskState {
  task: BackgroundTask;
  messageCount: number;
  stablePolls: number;
  lastActivity: Date;
  completionCallbacks: TaskCompletionCallback[];
  pollInterval?: ReturnType<typeof setInterval>;
}

// ============================================
// Background Manager
// ============================================

export class BackgroundManager {
  private concurrency: ConcurrencyManager;
  private queue: TaskQueue;
  private tasks: Map<string, TaskState> = new Map();
  private pendingByParent: Map<string, Set<string>> = new Map();

  private stallTimeout: number;
  private stabilityPolls: number;
  private stabilityInterval: number;
  private ttl: number;

  private cleanupInterval?: ReturnType<typeof setInterval>;
  private isShuttingDown = false;

  constructor(options: BackgroundManagerOptions = {}) {
    const config = getConfig().concurrency;

    this.concurrency = new ConcurrencyManager(
      options.maxParallel ?? config.maxParallel
    );
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
  async submit(task: BackgroundTask): Promise<string> {
    // Initialize task state
    const state: TaskState = {
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
      this.pendingByParent.get(task.parentId)!.add(task.id);
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
  private async processQueue(key: string): Promise<void> {
    if (this.queue.isProcessing(key)) {
      return;
    }

    this.queue.markProcessing(key);

    while (true) {
      const task = this.queue.dequeue(key);
      if (!task) break;

      const state = this.tasks.get(task.id);
      if (!state) continue;

      try {
        // Acquire concurrency slot
        await this.concurrency.acquire(key, task.id);

        // Start the task
        await this.startTask(state);

        // Release slot when complete
        this.concurrency.release(task.id);
      } catch (error) {
        this.handleTaskError(state, error as Error);
        this.concurrency.release(task.id);
      }
    }

    this.queue.markIdle(key);
  }

  /**
   * Start executing a task
   */
  private async startTask(state: TaskState): Promise<void> {
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
  private startStabilityPolling(state: TaskState): void {
    state.pollInterval = setInterval(() => {
      this.checkStability(state);
    }, this.stabilityInterval);
  }

  /**
   * Check if a task has stabilized
   */
  private checkStability(state: TaskState): void {
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
  onSessionIdle(taskId: string): void {
    const state = this.tasks.get(taskId);
    if (!state || state.task.status !== 'running') return;

    // Complete if we have output
    if (state.messageCount > 0) {
      this.completeTask(state, 'idle_event');
    }
  }

  /**
   * Update message count for a task
   */
  updateMessageCount(taskId: string, count: number): void {
    const state = this.tasks.get(taskId);
    if (!state) return;

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
  private completeTask(state: TaskState, reason: CompletionReason): boolean {
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
    const result: CompletionResult = {
      reason,
      task: state.task,
      output: '', // Would contain actual output in real implementation
    };

    // Notify callbacks
    for (const callback of state.completionCallbacks) {
      try {
        callback(result);
      } catch (error) {
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
  private checkParentCompletion(parentId: string): void {
    const children = this.pendingByParent.get(parentId);
    if (!children) return;

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
  private handleTaskError(state: TaskState, error: Error): void {
    state.task.status = 'error';
    state.task.error = error;

    if (state.pollInterval) {
      clearInterval(state.pollInterval);
    }

    const result: CompletionResult = {
      reason: 'error',
      task: state.task,
      output: error.message,
    };

    for (const callback of state.completionCallbacks) {
      try {
        callback(result);
      } catch (e) {
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
  getStatus(taskId: string): TaskStatus | null {
    const state = this.tasks.get(taskId);
    return state?.task.status ?? null;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): BackgroundTask | null {
    const state = this.tasks.get(taskId);
    return state?.task ?? null;
  }

  /**
   * Register completion callback
   */
  onComplete(taskId: string, callback: TaskCompletionCallback): void {
    const state = this.tasks.get(taskId);
    if (!state) return;

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
  cancel(taskId: string): boolean {
    const state = this.tasks.get(taskId);
    if (!state || state.task.status !== 'running') {
      return false;
    }

    state.task.status = 'cancelled';

    if (state.pollInterval) {
      clearInterval(state.pollInterval);
    }

    this.concurrency.release(taskId);

    const result: CompletionResult = {
      reason: 'user_cancel',
      task: state.task,
      output: '',
    };

    for (const callback of state.completionCallbacks) {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in completion callback:', error);
      }
    }

    return true;
  }

  /**
   * Get all running tasks
   */
  getRunningTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values())
      .filter((s) => s.task.status === 'running')
      .map((s) => s.task);
  }

  /**
   * Get tasks by parent ID
   */
  getTasksByParent(parentId: string): BackgroundTask[] {
    const childIds = this.pendingByParent.get(parentId);
    if (!childIds) return [];

    return Array.from(childIds)
      .map((id) => this.tasks.get(id)?.task)
      .filter((t): t is BackgroundTask => t !== undefined);
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Clean up old tasks
   */
  private cleanup(): void {
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
  async shutdown(): Promise<void> {
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

let managerInstance: BackgroundManager | null = null;

export function getBackgroundManager(): BackgroundManager {
  if (!managerInstance) {
    managerInstance = new BackgroundManager();
  }
  return managerInstance;
}

export function resetBackgroundManager(): void {
  if (managerInstance) {
    managerInstance.shutdown();
    managerInstance = null;
  }
}
