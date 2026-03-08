/**
 * Plan Skill - Prometheus Interview Mode
 *
 * Inspired by oh-my-opencode's Prometheus mode.
 * Provides structured planning through interview-based requirements gathering.
 */
export interface PlanConfig {
    maxQuestions: number;
    requireExplicitApproval: boolean;
    generateAcceptanceCriteria: boolean;
    estimateComplexity: boolean;
}
export interface PlanPhase {
    name: 'interview' | 'analysis' | 'planning' | 'approval' | 'execution';
    status: 'pending' | 'active' | 'completed';
    data?: unknown;
}
export interface PlanSession {
    id: string;
    taskDescription: string;
    phases: PlanPhase[];
    questions: string[];
    answers: Record<string, string>;
    plan?: GeneratedPlan;
    approved: boolean;
    startTime: number;
}
export interface GeneratedPlan {
    title: string;
    summary: string;
    scope: {
        included: string[];
        excluded: string[];
    };
    tasks: PlanTask[];
    acceptanceCriteria: string[];
    risks: string[];
    estimatedComplexity: 'low' | 'medium' | 'high' | 'very-high';
}
export interface PlanTask {
    id: string;
    title: string;
    description: string;
    dependencies: string[];
    model: 'haiku' | 'sonnet' | 'opus';
    parallel: boolean;
}
export declare class PlanSkillManager {
    private static instance;
    private config;
    private currentSession;
    private constructor();
    static getInstance(): PlanSkillManager;
    configure(config: Partial<PlanConfig>): void;
    startSession(taskDescription: string): PlanSession;
    getSession(): PlanSession | null;
    recordAnswer(questionIndex: number, answer: string): void;
    getInterviewPrompt(): string;
    getAnalysisPrompt(): string;
    generatePlan(analysisResult: string): GeneratedPlan;
    getApprovalPrompt(): string;
    approvePlan(): void;
    getExecutionInstructions(): string;
    cancelSession(): void;
    private detectTaskType;
    private updatePhase;
    private extractTitle;
    private extractScope;
    private generateTasks;
    private generateAcceptanceCriteria;
    private extractRisks;
    private estimateComplexity;
}
export declare const planSkill: PlanSkillManager;
export declare const planSkillDefinition: {
    name: string;
    aliases: string[];
    description: string;
    triggers: string[];
    execute(context: {
        message: string;
        args?: string;
    }): Promise<{
        response: string;
        metadata?: undefined;
    } | {
        response: string;
        metadata: {
            planSessionId: string;
            phase: string;
        };
    }>;
};
//# sourceMappingURL=plan.d.ts.map