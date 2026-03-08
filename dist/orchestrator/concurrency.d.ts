/**
 * Concurrency Manager
 *
 * Manages concurrent execution of background agents with proper resource limits.
 */
export interface ConcurrencySlot {
    key: string;
    acquiredAt: Date;
    taskId: string;
}
export declare class ConcurrencyManager {
    private slots;
    private waitQueues;
    private maxConcurrent;
    constructor(maxConcurrent?: number);
    /**
     * Generate a concurrency key for a task
     */
    getConcurrencyKey(input: {
        model?: string;
        providerId?: string;
        agentName?: string;
    }): string;
    /**
     * Check if a slot is available for the given key
     */
    isSlotAvailable(key: string): boolean;
    /**
     * Get current slot count for a key
     */
    getSlotCount(key: string): number;
    /**
     * Acquire a concurrency slot
     */
    acquire(key: string, taskId: string): Promise<void>;
    /**
     * Release a concurrency slot
     */
    release(taskId: string): void;
    /**
     * Get all active slots
     */
    getActiveSlots(): ConcurrencySlot[];
    /**
     * Clear all slots (for cleanup)
     */
    clearAll(): void;
    /**
     * Get queue length for a key
     */
    getQueueLength(key: string): number;
}
//# sourceMappingURL=concurrency.d.ts.map