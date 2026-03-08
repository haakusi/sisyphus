/**
 * State Management for Orchestrator
 *
 * Manages global state across the orchestration system.
 */
import type { CodebaseState, CodebaseAssessment } from '../agents/types.js';
export interface OrchestratorState {
    sessionId: string | null;
    projectRoot: string | null;
    codebaseAssessment: CodebaseAssessment | null;
    activeAgents: Set<string>;
    contextUsage: number;
    lastActivity: Date;
    isIdle: boolean;
}
export declare function getState(): Readonly<OrchestratorState>;
export declare function setState(updates: Partial<OrchestratorState>): void;
export declare function resetState(): void;
export declare function initializeSession(sessionId: string, projectRoot: string): void;
export declare function endSession(): void;
export declare function registerAgent(agentName: string): void;
export declare function unregisterAgent(agentName: string): void;
export declare function getActiveAgents(): string[];
export declare function setCodebaseAssessment(assessment: CodebaseAssessment): void;
export declare function getCodebaseState(): CodebaseState | null;
export declare function recordActivity(): void;
export declare function markIdle(): void;
export declare function isSessionIdle(): boolean;
export declare function getLastActivityTime(): Date;
export declare function updateContextUsage(usage: number): void;
export declare function getContextUsage(): number;
export declare function isContextNearLimit(threshold?: number): boolean;
//# sourceMappingURL=state.d.ts.map