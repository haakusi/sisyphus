/**
 * Configuration Loader for Claude Sisyphus Plugin
 *
 * Handles loading and merging configuration from multiple sources.
 */
import { SisyphusConfig } from './schema.js';
export interface LoadConfigOptions {
    projectRoot?: string;
    skipUserConfig?: boolean;
    skipProjectConfig?: boolean;
}
export declare function loadConfig(options?: LoadConfigOptions): SisyphusConfig;
export declare function initializeConfig(options?: LoadConfigOptions): SisyphusConfig;
export declare function getConfig(): SisyphusConfig;
export declare function updateConfig(update: Partial<SisyphusConfig>): SisyphusConfig;
export declare function resetConfig(): void;
export declare function isHookEnabled(hookName: string): boolean;
export declare function isToolEnabled(toolName: string): boolean;
export declare function getAgentConfig(agentName: keyof SisyphusConfig['agents']): {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
} | {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
} | {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
} | {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
} | {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
};
//# sourceMappingURL=loader.d.ts.map