/**
 * Context Window Monitor
 *
 * Monitors context usage and triggers appropriate actions
 * when nearing limits.
 */

import { getConfig } from '../config/index.js';
import { updateContextUsage, getContextUsage, isContextNearLimit } from '../orchestrator/state.js';

// ============================================
// Types
// ============================================

export interface ContextMonitorConfig {
  warningThreshold: number;  // e.g., 0.7 for 70%
  criticalThreshold: number; // e.g., 0.9 for 90%
  estimatedMaxTokens: number;
}

export interface ContextMonitorCallbacks {
  onWarning?: (usage: number) => void;
  onCritical?: (usage: number) => void;
  onCompact?: () => Promise<void>;
}

// ============================================
// Context Monitor
// ============================================

export class ContextMonitor {
  private config: ContextMonitorConfig;
  private callbacks: ContextMonitorCallbacks;
  private hasWarned = false;
  private hasCriticaled = false;

  constructor(
    config: Partial<ContextMonitorConfig> = {},
    callbacks: ContextMonitorCallbacks = {}
  ) {
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
  updateUsage(currentTokens: number): void {
    const usage = currentTokens / this.config.estimatedMaxTokens;
    updateContextUsage(usage);

    this.checkThresholds(usage);
  }

  /**
   * Update context usage from percentage
   */
  updateUsagePercentage(percentage: number): void {
    updateContextUsage(percentage);
    this.checkThresholds(percentage);
  }

  /**
   * Check if thresholds are exceeded
   */
  private checkThresholds(usage: number): void {
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
  resetWarnings(): void {
    this.hasWarned = false;
    this.hasCriticaled = false;
  }

  /**
   * Get current usage
   */
  getCurrentUsage(): number {
    return getContextUsage();
  }

  /**
   * Check if context is near limit
   */
  isNearLimit(): boolean {
    return isContextNearLimit(this.config.warningThreshold);
  }

  /**
   * Estimate remaining capacity
   */
  estimateRemainingTokens(): number {
    const usage = getContextUsage();
    return Math.floor(this.config.estimatedMaxTokens * (1 - usage));
  }
}

// ============================================
// Factory Function
// ============================================

export function createContextMonitor(
  config?: Partial<ContextMonitorConfig>,
  callbacks?: ContextMonitorCallbacks
): ContextMonitor {
  return new ContextMonitor(config, callbacks);
}

// ============================================
// Hook Handler
// ============================================

export interface ContextMonitorHookHandlers {
  onTokenUpdate: (tokens: number) => void;
  onCompacting: () => Promise<string>;
  getCurrentUsage: () => number;
}

export function createContextMonitorHook(
  callbacks: ContextMonitorCallbacks = {}
): ContextMonitorHookHandlers {
  const monitor = createContextMonitor(undefined, callbacks);

  return {
    onTokenUpdate: (tokens: number) => monitor.updateUsage(tokens),
    onCompacting: async () => {
      // Return essential context to preserve during compaction
      const usage = monitor.getCurrentUsage();
      monitor.resetWarnings();

      return `Context usage was at ${Math.round(usage * 100)}%. Essential context preserved.`;
    },
    getCurrentUsage: () => monitor.getCurrentUsage(),
  };
}
