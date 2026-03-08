/**
 * Ultrawork Skill
 *
 * The magic keyword that activates all Sisyphus features automatically.
 * When users include "ultrawork" or "ulw" in their prompts, this skill
 * enables parallel agent execution, TODO enforcement, and all available tools.
 */
import type { Skill, SkillContext, SkillResult } from '../agents/types.js';
export interface UltraworkFeatures {
    parallelAgents: boolean;
    todoEnforcer: boolean;
    lspTools: boolean;
    astGrep: boolean;
    contextMonitor: boolean;
    deepExploration: boolean;
    multiModelDelegation: boolean;
}
export interface UltraworkContext extends SkillContext {
    enabledFeatures: UltraworkFeatures;
}
export declare const ultraworkSkill: Skill;
export declare function isUltraworkRequest(message: string): boolean;
export declare function activateUltrawork(message: string, context?: Partial<SkillContext>): Promise<SkillResult>;
//# sourceMappingURL=ultrawork.d.ts.map