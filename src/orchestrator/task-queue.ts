/**
 * Task Queue
 *
 * Manages queuing and processing of background tasks.
 */

import type { BackgroundTask, TaskStatus, CompletionReason } from '../agents/types.js';

// ============================================
// Types
// ============================================

export interface QueuedTask {
  task: BackgroundTask;
  addedAt: Date;
  priority: number;
}

export type TaskEventType =
  | 'enqueued'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface TaskEvent {
  type: TaskEventType;
  task: BackgroundTask;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type TaskEventHandler = (event: TaskEvent) => void;

// ============================================
// Task Queue
// ============================================

export class TaskQueue {
  private queues: Map<string, QueuedTask[]> = new Map();
  private processing: Set<string> = new Set();
  private eventHandlers: Map<TaskEventType, TaskEventHandler[]> = new Map();

  /**
   * Add a task to the queue
   */
  enqueue(task: BackgroundTask, priority: number = 0): void {
    const key = task.concurrencyKey;

    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }

    const queue = this.queues.get(key)!;
    queue.push({
      task,
      addedAt: new Date(),
      priority,
    });

    // Sort by priority (higher first)
    queue.sort((a, b) => b.priority - a.priority);

    this.emit('enqueued', task);
  }

  /**
   * Get the next task from a queue
   */
  dequeue(key: string): BackgroundTask | null {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) {
      return null;
    }

    const queued = queue.shift();
    return queued?.task ?? null;
  }

  /**
   * Peek at the next task without removing it
   */
  peek(key: string): BackgroundTask | null {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) {
      return null;
    }
    return queue[0].task;
  }

  /**
   * Get all tasks in a queue
   */
  getQueue(key: string): BackgroundTask[] {
    const queue = this.queues.get(key);
    return queue?.map((q) => q.task) ?? [];
  }

  /**
   * Get all queue keys
   */
  getQueueKeys(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Get total queue length across all keys
   */
  getTotalLength(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Mark a queue as being processed
   */
  markProcessing(key: string): void {
    this.processing.add(key);
  }

  /**
   * Mark a queue as no longer being processed
   */
  markIdle(key: string): void {
    this.processing.delete(key);
  }

  /**
   * Check if a queue is being processed
   */
  isProcessing(key: string): boolean {
    return this.processing.has(key);
  }

  /**
   * Remove a task from any queue
   */
  remove(taskId: string): BackgroundTask | null {
    for (const [key, queue] of this.queues.entries()) {
      const index = queue.findIndex((q) => q.task.id === taskId);
      if (index !== -1) {
        const removed = queue.splice(index, 1)[0];
        return removed.task;
      }
    }
    return null;
  }

  /**
   * Find a task by ID
   */
  find(taskId: string): BackgroundTask | null {
    for (const queue of this.queues.values()) {
      const found = queue.find((q) => q.task.id === taskId);
      if (found) {
        return found.task;
      }
    }
    return null;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.queues.clear();
    this.processing.clear();
  }

  /**
   * Register an event handler
   */
  on(event: TaskEventType, handler: TaskEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(event: TaskEventType, handler: TaskEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  private emit(type: TaskEventType, task: BackgroundTask, metadata?: Record<string, unknown>): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const event: TaskEvent = {
        type,
        task,
        timestamp: new Date(),
        metadata,
      };
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in task event handler:`, error);
        }
      }
    }
  }
}
