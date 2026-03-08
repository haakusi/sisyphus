/**
 * Concurrency Manager
 *
 * Manages concurrent execution of background agents with proper resource limits.
 */
import { getConfig } from '../config/index.js';
// ============================================
// Concurrency Manager
// ============================================
export class ConcurrencyManager {
    slots = new Map();
    waitQueues = new Map();
    maxConcurrent;
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent ?? getConfig().concurrency.maxParallel;
    }
    /**
     * Generate a concurrency key for a task
     */
    getConcurrencyKey(input) {
        // If agent name is provided, use it as the key
        if (input.agentName) {
            return `agent:${input.agentName}`;
        }
        // Otherwise, use model/provider combination
        if (input.model && input.providerId) {
            return `model:${input.providerId}/${input.model}`;
        }
        // Default key
        return 'default';
    }
    /**
     * Check if a slot is available for the given key
     */
    isSlotAvailable(key) {
        const slotsForKey = Array.from(this.slots.values()).filter((slot) => slot.key === key);
        return slotsForKey.length < this.maxConcurrent;
    }
    /**
     * Get current slot count for a key
     */
    getSlotCount(key) {
        return Array.from(this.slots.values()).filter((slot) => slot.key === key).length;
    }
    /**
     * Acquire a concurrency slot
     */
    async acquire(key, taskId) {
        // If slot is available, acquire immediately
        if (this.isSlotAvailable(key)) {
            this.slots.set(taskId, {
                key,
                acquiredAt: new Date(),
                taskId,
            });
            return;
        }
        // Otherwise, wait in queue
        return new Promise((resolve) => {
            if (!this.waitQueues.has(key)) {
                this.waitQueues.set(key, []);
            }
            this.waitQueues.get(key).push(() => {
                this.slots.set(taskId, {
                    key,
                    acquiredAt: new Date(),
                    taskId,
                });
                resolve();
            });
        });
    }
    /**
     * Release a concurrency slot
     */
    release(taskId) {
        const slot = this.slots.get(taskId);
        if (!slot)
            return;
        this.slots.delete(taskId);
        // Check if anyone is waiting for this key
        const waitQueue = this.waitQueues.get(slot.key);
        if (waitQueue && waitQueue.length > 0) {
            const next = waitQueue.shift();
            if (next) {
                next();
            }
        }
    }
    /**
     * Get all active slots
     */
    getActiveSlots() {
        return Array.from(this.slots.values());
    }
    /**
     * Clear all slots (for cleanup)
     */
    clearAll() {
        this.slots.clear();
        this.waitQueues.clear();
    }
    /**
     * Get queue length for a key
     */
    getQueueLength(key) {
        return this.waitQueues.get(key)?.length ?? 0;
    }
}
//# sourceMappingURL=concurrency.js.map