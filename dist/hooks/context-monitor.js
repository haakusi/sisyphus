/**
 * Context Window Monitor
 *
 * Monitors context usage and triggers appropriate actions
 * when nearing limits.
 */
import { updateContextUsage, getContextUsage, isContextNearLimit } from '../orchestrator/state.js';
// ============================================
// Context Monitor
// ============================================
export class ContextMonitor {
    config;
    callbacks;
    hasWarned = false;
    hasCriticaled = false;
    constructor(config = {}, callbacks = {}) {
        this.config = {
            warningThreshold: config.warningThreshold ?? 0.7,
            criticalThreshold: config.criticalThreshold ?? 0.9,
            estimatedMaxTokens: config.estimatedMaxTokens ?? 200000,
        };
        this.callbacks = callbacks;
    }
    /**
     * Update context usage from token count
     */
    updateUsage(currentTokens) {
        const usage = currentTokens / this.config.estimatedMaxTokens;
        updateContextUsage(usage);
        this.checkThresholds(usage);
    }
    /**
     * Update context usage from percentage
     */
    updateUsagePercentage(percentage) {
        updateContextUsage(percentage);
        this.checkThresholds(percentage);
    }
    /**
     * Check if thresholds are exceeded
     */
    checkThresholds(usage) {
        // Critical threshold
        if (usage >= this.config.criticalThreshold && !this.hasCriticaled) {
            this.hasCriticaled = true;
            this.callbacks.onCritical?.(usage);
            // Trigger compaction
            this.callbacks.onCompact?.();
        }
        // Warning threshold
        else if (usage >= this.config.warningThreshold && !this.hasWarned) {
            this.hasWarned = true;
            this.callbacks.onWarning?.(usage);
        }
    }
    /**
     * Reset warning states (e.g., after compaction)
     */
    resetWarnings() {
        this.hasWarned = false;
        this.hasCriticaled = false;
    }
    /**
     * Get current usage
     */
    getCurrentUsage() {
        return getContextUsage();
    }
    /**
     * Check if context is near limit
     */
    isNearLimit() {
        return isContextNearLimit(this.config.warningThreshold);
    }
    /**
     * Estimate remaining capacity
     */
    estimateRemainingTokens() {
        const usage = getContextUsage();
        return Math.floor(this.config.estimatedMaxTokens * (1 - usage));
    }
}
// ============================================
// Factory Function
// ============================================
export function createContextMonitor(config, callbacks) {
    return new ContextMonitor(config, callbacks);
}
export function createContextMonitorHook(callbacks = {}) {
    const monitor = createContextMonitor(undefined, callbacks);
    return {
        onTokenUpdate: (tokens) => monitor.updateUsage(tokens),
        onCompacting: async () => {
            // Return essential context to preserve during compaction
            const usage = monitor.getCurrentUsage();
            monitor.resetWarnings();
            return `Context usage was at ${Math.round(usage * 100)}%. Essential context preserved.`;
        },
        getCurrentUsage: () => monitor.getCurrentUsage(),
    };
}
//# sourceMappingURL=context-monitor.js.map