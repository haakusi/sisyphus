/**
 * Sisyphus - Main Orchestrator Agent
 *
 * The primary agent responsible for orchestrating complex software engineering tasks.
 */
import type { AgentConfig, Task, Todo, Intent, Skill, CodebaseAssessment, DelegationRequest, ParallelExecutionPlan, AvailableAgent } from './types.js';
import { type AvailableTool } from '../prompts/dynamic-builder.js';
export declare function detectIntent(message: string): Intent;
export declare function matchSkill(message: string, availableSkills: Skill[]): Skill | null;
export declare function assessCodebase(projectRoot: string): Promise<CodebaseAssessment>;
export declare function createTodoList(task: Task): Todo[];
export declare function determineDelegation(task: Task, intent: Intent, availableAgents: AvailableAgent[]): DelegationRequest | null;
export declare function planParallelExecution(tasks: Task[], availableAgents: AvailableAgent[]): ParallelExecutionPlan;
export interface SisyphusAgentOptions {
    availableAgents?: AvailableAgent[];
    availableTools?: AvailableTool[];
    availableSkills?: Skill[];
    projectContext?: string;
}
export declare function createSisyphusAgent(options?: SisyphusAgentOptions): {
    config: AgentConfig;
    processMessage: (message: string) => Promise<SisyphusResponse>;
    buildSystemPrompt: () => string;
};
export interface SisyphusResponse {
    phase: 'intent_gate' | 'assessment' | 'execution' | 'completion';
    action: string;
    message: string;
    skill?: string;
    delegation?: DelegationRequest;
    intent?: Intent;
    todos?: Todo[];
}
//# sourceMappingURL=sisyphus.d.ts.map