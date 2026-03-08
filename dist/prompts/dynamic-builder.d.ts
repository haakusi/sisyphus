/**
 * Dynamic Prompt Builder for Sisyphus Agent
 *
 * Constructs prompts dynamically based on available resources and context.
 */
import type { AvailableAgent, Skill } from '../agents/types.js';
export interface AvailableTool {
    name: string;
    description: string;
    category: ToolCategory;
}
export type ToolCategory = 'file_operation' | 'code_analysis' | 'search' | 'execution' | 'communication' | 'task_management';
export interface PromptSection {
    name: string;
    content: string;
    priority: number;
}
export interface PromptBuilderContext {
    availableAgents: AvailableAgent[];
    availableTools: AvailableTool[];
    availableSkills: Skill[];
    projectContext?: string;
    additionalRules?: string[];
}
export declare class DynamicPromptBuilder {
    private context;
    private sections;
    constructor(context: PromptBuilderContext);
    private initializeSections;
    addSection(section: PromptSection): void;
    removeSection(name: string): void;
    getSection(name: string): PromptSection | undefined;
    updateSection(name: string, content: string): void;
    build(): string;
    buildForAgent(agentName: string): string;
}
export declare function createPromptBuilder(context: PromptBuilderContext): DynamicPromptBuilder;
//# sourceMappingURL=dynamic-builder.d.ts.map