/**
 * Agent Types for Claude Sisyphus Plugin
 *
 * Defines the core type system for the agent orchestration framework.
 */
export interface AgentConfig {
    name: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    allowedTools: string[];
    deniedTools: string[];
    thinkingBudget?: number;
}
export interface Agent {
    config: AgentConfig;
    execute(task: Task): Promise<AgentResult>;
}
export interface AvailableAgent {
    name: string;
    description: string;
    category: AgentCategory;
    model: string;
    specialization: string[];
}
export type AgentCategory = 'orchestrator' | 'planner' | 'advisor' | 'researcher' | 'explorer' | 'specialist';
export interface Task {
    id: string;
    subject: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    category?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'running' | 'completed' | 'cancelled' | 'error';
export interface TodoItem {
    id: string;
    subject: string;
    status: 'pending' | 'in_progress' | 'completed';
    owner?: string;
    blockedBy?: string[];
}
export interface Todo {
    id: string;
    taskId: string;
    subject: string;
    description: string;
    status: TaskStatus;
    order: number;
    blockedBy: string[];
    blocks: string[];
}
export interface Intent {
    type: IntentType;
    action: string;
    entities: IntentEntity[];
    confidence: number;
    rawMessage: string;
}
export type IntentType = 'code_modification' | 'code_exploration' | 'documentation' | 'debugging' | 'refactoring' | 'testing' | 'planning' | 'general';
export interface IntentEntity {
    type: string;
    value: string;
    start: number;
    end: number;
}
export interface Skill {
    name: string;
    aliases: string[];
    description: string;
    triggers: string[];
    execute(context: SkillContext): Promise<SkillResult>;
}
export interface SkillContext {
    message: string;
    intent: Intent;
    codebaseState: CodebaseState;
    availableTools: string[];
}
export interface SkillResult {
    success: boolean;
    output: string;
    metadata?: Record<string, unknown>;
}
export type CodebaseState = 'disciplined' | 'mixed' | 'chaotic';
export interface CodebaseAssessment {
    state: CodebaseState;
    patterns: CodePattern[];
    conventions: CodeConvention[];
    recommendation: 'follow_existing' | 'suggest_improvements';
}
export interface CodePattern {
    name: string;
    frequency: number;
    locations: string[];
}
export interface CodeConvention {
    name: string;
    description: string;
    isFollowed: boolean;
}
export interface AgentResult {
    success: boolean;
    output: string;
    artifacts: Artifact[];
    tokensUsed: number;
    executionTime: number;
}
export interface Artifact {
    type: ArtifactType;
    path?: string;
    content: string;
    metadata?: Record<string, unknown>;
}
export type ArtifactType = 'code' | 'file' | 'command' | 'analysis' | 'plan';
export interface DelegationRequest {
    task: Task;
    targetAgent: string;
    category: string;
    reason: string;
    context: DelegationContext;
}
export interface DelegationContext {
    parentTaskId?: string;
    previousResults?: AgentResult[];
    additionalInstructions?: string;
}
export interface ParallelExecutionPlan {
    agents: string[];
    tasks: Task[];
    dependencies: TaskDependency[];
    timeout: number;
}
export interface TaskDependency {
    taskId: string;
    dependsOn: string[];
}
export interface BackgroundTask {
    id: string;
    parentId?: string;
    agent: string;
    task: Task;
    status: TaskStatus;
    concurrencyKey: string;
    startedAt?: Date;
    completedAt?: Date;
    result?: AgentResult;
    error?: Error;
}
export type CompletionReason = 'stability' | 'idle_event' | 'timeout' | 'user_cancel' | 'error';
export interface CompletionResult {
    reason: CompletionReason;
    task: BackgroundTask;
    output: string;
}
//# sourceMappingURL=types.d.ts.map