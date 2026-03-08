/**
 * Enhanced Context Window Monitor
 *
 * Inspired by oh-my-opencode's context management.
 * Features:
 * - 70%/85% warning thresholds
 * - Preemptive compaction
 * - Critical context preservation
 */
export interface ContextMonitorConfig {
    warningThreshold: number;
    criticalThreshold: number;
    maxTokens: number;
    preservedContextPaths: string[];
    compactionStrategy: 'aggressive' | 'balanced' | 'conservative';
}
export interface ContextState {
    currentUsage: number;
    estimatedTokens: number;
    warningTriggered: boolean;
    criticalTriggered: boolean;
    lastCompactionTime: number;
    preservedContext: string[];
}
export declare class EnhancedContextMonitor {
    private static instance;
    private config;
    private state;
    private callbacks;
    private constructor();
    static getInstance(): EnhancedContextMonitor;
    configure(config: Partial<ContextMonitorConfig>): void;
    setCallbacks(callbacks: typeof this.callbacks): void;
    updateUsage(estimatedTokens: number): void;
    getState(): ContextState;
    getUsagePercent(): number;
    getWarningMessage(): string | null;
    buildPreservedContext(projectIdentity: string, activeTasks: string[], recentDecisions: string[], keyFiles: string[]): string;
    private triggerPreemptiveCompaction;
    addPreservedContext(context: string): void;
    reset(): void;
    getCompactionRecommendation(): string;
}
export declare const contextMonitor: EnhancedContextMonitor;
export declare function createEnhancedContextMonitorHook(): {
    name: string;
    onToolExecuteAfter: (toolName: string, result: unknown) => Promise<{
        appendMessage: string;
    } | {
        appendMessage?: undefined;
    }>;
    onSessionStart: () => void;
    getStatus: () => {
        usage: number;
        recommendation: string;
    };
};
//# sourceMappingURL=context-monitor-enhanced.d.ts.map