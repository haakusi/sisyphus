/**
 * Stats Skill - View metrics and statistics
 *
 * Provides access to session metrics, model usage, and cost estimates.
 */
export declare const statsSkillDefinition: {
    name: string;
    aliases: string[];
    description: string;
    triggers: string[];
    execute(context: {
        message: string;
        args?: string;
    }): Promise<{
        response: string;
    }>;
};
//# sourceMappingURL=stats.d.ts.map