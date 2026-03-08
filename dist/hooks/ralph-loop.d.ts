/**
 * Ralph Loop - Continuous Execution Mode
 *
 * Inspired by oh-my-opencode's Ralph Loop pattern.
 * Automatically continues work until task completion.
 */
export interface RalphLoopConfig {
    enabled: boolean;
    maxIterations: number;
    iterationDelayMs: number;
    autoStopOnComplete: boolean;
    preserveContext: boolean;
}
export interface RalphLoopState {
    active: boolean;
    currentIteration: number;
    startTime: number;
    taskDescription: string;
    completionCriteria: string[];
    lastCheckpoint: string;
}
declare class RalphLoopManager {
    private static instance;
    private config;
    private state;
    private stopRequested;
    private constructor();
    static getInstance(): RalphLoopManager;
    configure(config: Partial<RalphLoopConfig>): void;
    start(taskDescription: string, completionCriteria?: string[]): boolean;
    stop(): void;
    shouldContinue(): boolean;
    recordIteration(checkpoint?: string): void;
    markComplete(): void;
    getState(): RalphLoopState | null;
    getStatusMessage(): string;
    getContinuationPrompt(): string;
    isCompletionResponse(response: string): boolean;
}
export declare const ralphLoop: RalphLoopManager;
export declare function createRalphLoopHook(): {
    name: string;
    onMessage: (message: string) => Promise<{
        modified: boolean;
        message: string;
    } | {
        modified: boolean;
        message?: undefined;
    }>;
    onResponse: (response: string) => Promise<{
        continue: boolean;
        nextPrompt?: undefined;
    } | {
        continue: boolean;
        nextPrompt: string;
    }>;
    onSessionEnd: () => void;
};
export {};
//# sourceMappingURL=ralph-loop.d.ts.map