/**
 * Claude Sisyphus Plugin
 *
 * Main entry point for the Sisyphus-style agent orchestration plugin.
 */
export { defaultAvailableAgents } from './agents/index.js';
export type { Agent, Task, Todo, Intent, Skill, BackgroundTask, AvailableAgent, AgentCategory } from './agents/types.js';
export * from './orchestrator/index.js';
export * from './hooks/index.js';
export * from './skills/index.js';
export * from './prompts/index.js';
export { getConfig, initializeConfig, isHookEnabled, isToolEnabled } from './config/index.js';
export * from './tools/index.js';
export * from './context/index.js';
import type { Skill, TodoItem } from './agents/types.js';
import type { AvailableTool } from './prompts/dynamic-builder.js';
export interface PluginContext {
    sessionId: string;
    projectRoot: string;
    getAvailableTools: () => AvailableTool[];
    getTodos: () => Promise<TodoItem[]>;
    resumeWork: (message: string) => Promise<void>;
    isAgentActive: () => boolean;
    getCurrentAgent: () => string | null;
}
export interface PluginHooks {
    'session.start'?: (ctx: PluginContext) => void;
    'session.end'?: (ctx: PluginContext) => void;
    'session.idle'?: (ctx: PluginContext) => void;
    'chat.message.before'?: (ctx: PluginContext, message: string) => string | void;
    'chat.message.after'?: (ctx: PluginContext, message: string) => void;
    'tool.execute.before'?: (ctx: PluginContext, tool: string, args: unknown) => unknown | void;
    'tool.execute.after'?: (ctx: PluginContext, tool: string, result: unknown) => void;
    'context.compact'?: (ctx: PluginContext) => string;
}
export interface PluginTools {
    name: string;
    description: string;
    execute: (args: unknown) => Promise<unknown>;
}
export interface Plugin {
    name: string;
    version: string;
    hooks: PluginHooks;
    tools: PluginTools[];
    skills: Skill[];
}
export declare const SisyphusPlugin: Plugin;
export default SisyphusPlugin;
/**
 * Create a Sisyphus agent with default configuration
 */
export declare function createDefaultSisyphusAgent(): {
    config: import("./agents/types.js").AgentConfig;
    processMessage: (message: string) => Promise<import("./agents/sisyphus.js").SisyphusResponse>;
    buildSystemPrompt: () => string;
};
/**
 * Get the background task manager
 */
export declare function getTaskManager(): import("./index.js").BackgroundManager;
//# sourceMappingURL=index.d.ts.map