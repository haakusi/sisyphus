/**
 * Metrics & Statistics System
 *
 * Tracks model usage, estimated costs, and session statistics.
 * Inspired by oh-my-opencode's tracking capabilities.
 */
interface ModelUsage {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    avgLatencyMs: number;
    errors: number;
}
interface SessionMetrics {
    sessionId: string;
    startTime: number;
    endTime?: number;
    models: Record<string, ModelUsage>;
    tasksCreated: number;
    tasksCompleted: number;
    tasksFailed: number;
    parallelExecutions: number;
    contextCompactions: number;
}
interface AggregateMetrics {
    totalSessions: number;
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalEstimatedCost: number;
    modelBreakdown: Record<string, ModelUsage>;
    avgSessionDurationMs: number;
    taskCompletionRate: number;
}
declare class MetricsManager {
    private static instance;
    private currentSession;
    private metricsDir;
    private constructor();
    static getInstance(): MetricsManager;
    private ensureDir;
    startSession(sessionId: string): void;
    endSession(): void;
    trackModelCall(model: string, inputTokens: number, outputTokens: number, latencyMs: number, success: boolean): void;
    trackTaskCreated(): void;
    trackTaskCompleted(): void;
    trackTaskFailed(): void;
    trackParallelExecution(): void;
    trackContextCompaction(): void;
    getCurrentStats(): SessionMetrics | null;
    getSessionSummary(): string;
    getAggregateMetrics(days?: number): AggregateMetrics;
    private normalizeModelName;
    private saveSession;
    private loadSessions;
}
export declare const metrics: MetricsManager;
export declare function trackModelCall(model: string, inputTokens: number, outputTokens: number, latencyMs: number, success?: boolean): void;
export declare function getSessionSummary(): string;
export declare function getAggregateMetrics(days?: number): AggregateMetrics;
export {};
//# sourceMappingURL=index.d.ts.map