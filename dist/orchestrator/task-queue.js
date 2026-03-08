/**
 * Task Queue
 *
 * Manages queuing and processing of background tasks.
 */
// ============================================
// Task Queue
// ============================================
export class TaskQueue {
    queues = new Map();
    processing = new Set();
    eventHandlers = new Map();
    /**
     * Add a task to the queue
     */
    enqueue(task, priority = 0) {
        const key = task.concurrencyKey;
        if (!this.queues.has(key)) {
            this.queues.set(key, []);
        }
        const queue = this.queues.get(key);
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
    dequeue(key) {
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
    peek(key) {
        const queue = this.queues.get(key);
        if (!queue || queue.length === 0) {
            return null;
        }
        return queue[0].task;
    }
    /**
     * Get all tasks in a queue
     */
    getQueue(key) {
        const queue = this.queues.get(key);
        return queue?.map((q) => q.task) ?? [];
    }
    /**
     * Get all queue keys
     */
    getQueueKeys() {
        return Array.from(this.queues.keys());
    }
    /**
     * Get total queue length across all keys
     */
    getTotalLength() {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }
    /**
     * Mark a queue as being processed
     */
    markProcessing(key) {
        this.processing.add(key);
    }
    /**
     * Mark a queue as no longer being processed
     */
    markIdle(key) {
        this.processing.delete(key);
    }
    /**
     * Check if a queue is being processed
     */
    isProcessing(key) {
        return this.processing.has(key);
    }
    /**
     * Remove a task from any queue
     */
    remove(taskId) {
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
    find(taskId) {
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
    clear() {
        this.queues.clear();
        this.processing.clear();
    }
    /**
     * Register an event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    /**
     * Remove an event handler
     */
    off(event, handler) {
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
    emit(type, task, metadata) {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            const event = {
                type,
                task,
                timestamp: new Date(),
                metadata,
            };
            for (const handler of handlers) {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Error in task event handler:`, error);
                }
            }
        }
    }
}
//# sourceMappingURL=task-queue.js.map