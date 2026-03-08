/**
 * Enhanced Context Window Monitor
 *
 * Inspired by oh-my-opencode's context management.
 * Features:
 * - 70%/85% warning thresholds
 * - Preemptive compaction
 * - Critical context preservation
 */

import { metrics } from '../metrics/index.js';

export interface ContextMonitorConfig {
  warningThreshold: number;      // 0.7 = 70%
  criticalThreshold: number;     // 0.85 = 85%
  maxTokens: number;             // Estimated max context window
  preservedContextPaths: string[]; // Files to always preserve
  compactionStrategy: 'aggressive' | 'balanced' | 'conservative';
}

export interface ContextState {
  currentUsage: number;          // 0-1
  estimatedTokens: number;
  warningTriggered: boolean;
  criticalTriggered: boolean;
  lastCompactionTime: number;
  preservedContext: string[];
}

const DEFAULT_CONFIG: ContextMonitorConfig = {
  warningThreshold: 0.70,
  criticalThreshold: 0.85,
  maxTokens: 200000,
  preservedContextPaths: [
    'CLAUDE.md',
    'AGENTS.md',
    'README.md',
    '.claude/config.json',
  ],
  compactionStrategy: 'balanced',
};

// Critical context that should always be preserved
const CRITICAL_CONTEXT_TEMPLATE = `
## Preserved Context (Pre-Compaction)

### Project Identity
$PROJECT_IDENTITY

### Active Tasks
$ACTIVE_TASKS

### Recent Decisions
$RECENT_DECISIONS

### Key Files Modified
$KEY_FILES
`;

export class EnhancedContextMonitor {
  private static instance: EnhancedContextMonitor;
  private config: ContextMonitorConfig = DEFAULT_CONFIG;
  private state: ContextState;
  private callbacks: {
    onWarning?: (state: ContextState) => void;
    onCritical?: (state: ContextState) => void;
    onCompact?: (preservedContext: string) => Promise<void>;
  } = {};

  private constructor() {
    this.state = {
      currentUsage: 0,
      estimatedTokens: 0,
      warningTriggered: false,
      criticalTriggered: false,
      lastCompactionTime: 0,
      preservedContext: [],
    };
  }

  static getInstance(): EnhancedContextMonitor {
    if (!EnhancedContextMonitor.instance) {
      EnhancedContextMonitor.instance = new EnhancedContextMonitor();
    }
    return EnhancedContextMonitor.instance;
  }

  configure(config: Partial<ContextMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = callbacks;
  }

  // Update context usage
  updateUsage(estimatedTokens: number): void {
    this.state.estimatedTokens = estimatedTokens;
    this.state.currentUsage = estimatedTokens / this.config.maxTokens;

    // Check warning threshold
    if (this.state.currentUsage >= this.config.warningThreshold && !this.state.warningTriggered) {
      this.state.warningTriggered = true;
      this.callbacks.onWarning?.(this.state);
    }

    // Check critical threshold
    if (this.state.currentUsage >= this.config.criticalThreshold && !this.state.criticalTriggered) {
      this.state.criticalTriggered = true;
      this.callbacks.onCritical?.(this.state);
      this.triggerPreemptiveCompaction();
    }
  }

  // Get current state
  getState(): ContextState {
    return { ...this.state };
  }

  // Get usage percentage
  getUsagePercent(): number {
    return Math.round(this.state.currentUsage * 100);
  }

  // Get warning message
  getWarningMessage(): string | null {
    if (this.state.currentUsage >= this.config.criticalThreshold) {
      return `⚠️ CRITICAL: Context window at ${this.getUsagePercent()}%. Compaction imminent.`;
    }
    if (this.state.currentUsage >= this.config.warningThreshold) {
      return `⚡ WARNING: Context window at ${this.getUsagePercent()}%. Consider wrapping up.`;
    }
    return null;
  }

  // Build preserved context for compaction
  buildPreservedContext(
    projectIdentity: string,
    activeTasks: string[],
    recentDecisions: string[],
    keyFiles: string[]
  ): string {
    let context = CRITICAL_CONTEXT_TEMPLATE;

    context = context.replace('$PROJECT_IDENTITY', projectIdentity || 'Not specified');

    context = context.replace(
      '$ACTIVE_TASKS',
      activeTasks.length > 0
        ? activeTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')
        : 'No active tasks'
    );

    context = context.replace(
      '$RECENT_DECISIONS',
      recentDecisions.length > 0
        ? recentDecisions.map((d, i) => `${i + 1}. ${d}`).join('\n')
        : 'No recent decisions recorded'
    );

    context = context.replace(
      '$KEY_FILES',
      keyFiles.length > 0
        ? keyFiles.map(f => `- ${f}`).join('\n')
        : 'No key files modified'
    );

    return context;
  }

  // Trigger preemptive compaction
  private async triggerPreemptiveCompaction(): Promise<void> {
    metrics.trackContextCompaction();
    this.state.lastCompactionTime = Date.now();

    // Build preserved context
    const preservedContext = this.buildPreservedContext(
      'Ultrawork session in progress',
      this.state.preservedContext,
      [],
      []
    );

    await this.callbacks.onCompact?.(preservedContext);
  }

  // Add context to preserve
  addPreservedContext(context: string): void {
    if (!this.state.preservedContext.includes(context)) {
      this.state.preservedContext.push(context);
      // Keep only last 10 items
      if (this.state.preservedContext.length > 10) {
        this.state.preservedContext.shift();
      }
    }
  }

  // Reset for new session
  reset(): void {
    this.state = {
      currentUsage: 0,
      estimatedTokens: 0,
      warningTriggered: false,
      criticalTriggered: false,
      lastCompactionTime: 0,
      preservedContext: [],
    };
  }

  // Get compaction recommendation
  getCompactionRecommendation(): string {
    const usage = this.getUsagePercent();

    if (usage < 50) {
      return 'Context usage healthy. Continue normally.';
    }
    if (usage < 70) {
      return 'Context usage moderate. Consider completing current task soon.';
    }
    if (usage < 85) {
      return 'Context usage high. Wrap up current work and prepare for compaction.';
    }
    return 'Context critical. Complete current step immediately.';
  }
}

// Export singleton
export const contextMonitor = EnhancedContextMonitor.getInstance();

// Hook integration
export function createEnhancedContextMonitorHook() {
  return {
    name: 'enhanced-context-monitor',

    onToolExecuteAfter: async (toolName: string, result: unknown) => {
      // Estimate tokens from result
      const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
      const estimatedNewTokens = Math.ceil(resultStr.length / 4); // rough estimate

      // Update usage (this is simplified - real impl would track cumulative)
      const currentState = contextMonitor.getState();
      contextMonitor.updateUsage(currentState.estimatedTokens + estimatedNewTokens);

      // Return warning if needed
      const warning = contextMonitor.getWarningMessage();
      if (warning) {
        return {
          appendMessage: `\n\n${warning}`,
        };
      }

      return {};
    },

    onSessionStart: () => {
      contextMonitor.reset();
    },

    getStatus: () => {
      return {
        usage: contextMonitor.getUsagePercent(),
        recommendation: contextMonitor.getCompactionRecommendation(),
      };
    },
  };
}

// Types are already exported at their declaration points
