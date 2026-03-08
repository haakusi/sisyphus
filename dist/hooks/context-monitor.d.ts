/**
 * Context Window Monitor
 *
 * Monitors context usage and triggers appropriate actions
 * when nearing limits.
 */
export interface ContextMonitorConfig {
    warningThreshold: number;
    criticalThreshold: number;
    estimatedMaxTokens: number;
}
export interface ContextMonitorCallbacks {
    onWarning?: (usage: number) => void;
    onCritical?: (usage: number) => void;
    onCompact?: () => Promise<void>;
}
export declare class ContextMonitor {
    private config;
    private callbacks;
    private hasWarned;
    private hasCriticaled;
    constructor(config?: Partial<ContextMonitorConfig>, callbacks?: ContextMonitorCallbacks);
    /**
     * Update context usage from token count
     */
    updateUsage(currentTokens: number): void;
    /**
     * Update context usage from percentage
     */
    updateUsagePercentage(percentage: number): void;
    /**
     * Check if thresholds are exceeded
     */
    private checkThresholds;
    /**
     * Reset warning states (e.g., after compaction)
     */
    resetWarnings(): void;
    /**
     * Get current usage
     */
    getCurrentUsage(): number;
    /**
     * Check if context is near limit
     */
    isNearLimit(): boolean;
    /**
     * Estimate remaining capacity
     */
    estimateRemainingTokens(): number;
}
export declare function createContextMonitor(config?: Partial<ContextMonitorConfig>, callbacks?: ContextMonitorCallbacks): ContextMonitor;
export interface ContextMonitorHookHandlers {
    onTokenUpdate: (tokens: number) => void;
    onCompacting: () => Promise<string>;
    getCurrentUsage: () => number;
}
export declare function createContextMonitorHook(callbacks?: ContextMonitorCallbacks): ContextMonitorHookHandlers;
//# sourceMappingURL=context-monitor.d.ts.map