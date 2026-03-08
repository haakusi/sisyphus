/**
 * Quick Skill - Fast Execution Mode
 *
 * Optimized for simple tasks that don't need complex orchestration.
 * Uses Haiku by default for speed and cost efficiency.
 */
export interface QuickConfig {
    defaultModel: 'haiku' | 'sonnet';
    skipAssessment: boolean;
    skipTodoTracking: boolean;
    maxTokens: number;
}
export declare class QuickSkillManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): QuickSkillManager;
    configure(config: Partial<QuickConfig>): void;
    isQuickTask(message: string): boolean;
    getRecommendedModel(message: string): 'haiku' | 'sonnet';
    getTaskType(message: string): string;
    getQuickInstructions(message: string): string;
    private getTaskTypeGuidelines;
}
export declare const quickSkill: QuickSkillManager;
export declare const quickSkillDefinition: {
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
            mode: string;
            model: "sonnet" | "haiku";
            taskType: string;
        };
    }>;
};
//# sourceMappingURL=quick.d.ts.map