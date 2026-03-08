/**
 * Claude Sisyphus Plugin
 *
 * Main entry point for the Sisyphus-style agent orchestration plugin.
 */

// ============================================
// Module Exports
// ============================================

export { defaultAvailableAgents } from './agents/index.js';
export type { Agent, Task, Todo, Intent, Skill, BackgroundTask, AvailableAgent, AgentCategory } from './agents/types.js';
export * from './orchestrator/index.js';
export * from './hooks/index.js';
export * from './skills/index.js';
export * from './prompts/index.js';
export { getConfig, initializeConfig, isHookEnabled, isToolEnabled } from './config/index.js';
export * from './tools/index.js';
export * from './context/index.js';

// ============================================
// Plugin Types
// ============================================

import type {
  Skill,
  SkillContext,
  SkillResult,
  BackgroundTask,
  TodoItem,
} from './agents/types.js';
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

// ============================================
// Imports
// ============================================

import { initializeConfig, getConfig, isHookEnabled } from './config/index.js';
import { createSisyphusAgent, matchSkill, detectIntent } from './agents/sisyphus.js';
import { defaultAvailableAgents } from './agents/index.js';
import {
  getBackgroundManager,
  resetBackgroundManager,
} from './orchestrator/manager.js';
import {
  initializeSession,
  endSession,
  markIdle,
  recordActivity,
} from './orchestrator/state.js';
import {
  createTodoEnforcer,
  createTodoEnforcerHook,
} from './hooks/todo-enforcer.js';
import {
  createContextMonitor,
  createContextMonitorHook,
} from './hooks/context-monitor.js';
import {
  createSessionManager,
  createSessionManagerHook,
} from './hooks/session-manager.js';
import { builtinSkills, isUltraworkRequest, activateUltrawork } from './skills/index.js';

// ============================================
// Plugin State
// ============================================

let pluginContext: PluginContext | null = null;
let todoEnforcerHook: ReturnType<typeof createTodoEnforcerHook> | null = null;
let contextMonitorHook: ReturnType<typeof createContextMonitorHook> | null = null;
let sessionManagerHook: ReturnType<typeof createSessionManagerHook> | null = null;

// ============================================
// Plugin Initialization
// ============================================

function initializeSisyphus(ctx: PluginContext): void {
  pluginContext = ctx;

  // Initialize configuration
  initializeConfig({ projectRoot: ctx.projectRoot });

  // Initialize session
  initializeSession(ctx.sessionId, ctx.projectRoot);

  // Create hooks
  todoEnforcerHook = createTodoEnforcerHook({
    getTodos: ctx.getTodos,
    resumeWork: ctx.resumeWork,
    isAgentActive: ctx.isAgentActive,
    getCurrentAgent: ctx.getCurrentAgent,
  });

  contextMonitorHook = createContextMonitorHook({
    onWarning: (usage) => {
      console.log(`Context usage warning: ${Math.round(usage * 100)}%`);
    },
    onCritical: (usage) => {
      console.log(`Context usage critical: ${Math.round(usage * 100)}%`);
    },
  });

  sessionManagerHook = createSessionManagerHook({
    onSessionIdle: () => {
      todoEnforcerHook?.onSessionIdle();
    },
  });

  // Start session
  sessionManagerHook.onSessionStart(ctx.sessionId, ctx.projectRoot);
}

function cleanupSisyphus(): void {
  todoEnforcerHook?.destroy();
  sessionManagerHook?.destroy();
  resetBackgroundManager();

  todoEnforcerHook = null;
  contextMonitorHook = null;
  sessionManagerHook = null;
  pluginContext = null;
}

// ============================================
// Message Processing
// ============================================

async function processMessage(
  ctx: PluginContext,
  message: string
): Promise<string | void> {
  const config = getConfig();

  // Check for ultrawork activation
  if (config.skills.ultrawork.enabled && isUltraworkRequest(message)) {
    const result = await activateUltrawork(message, {
      availableTools: ctx.getAvailableTools().map((t) => t.name),
    });

    if (result.success) {
      return result.output;
    }
  }

  // Check for other skill matches
  const matchedSkill = matchSkill(message, builtinSkills);
  if (matchedSkill) {
    const intent = detectIntent(message);
    const skillResult = await matchedSkill.execute({
      message,
      intent,
      codebaseState: 'mixed',
      availableTools: ctx.getAvailableTools().map((t) => t.name),
    });

    if (skillResult.success) {
      return skillResult.output;
    }
  }

  // Record activity
  sessionManagerHook?.onMessage();
  todoEnforcerHook?.onUserMessage();

  return undefined;
}

// ============================================
// Plugin Definition
// ============================================

export const SisyphusPlugin: Plugin = {
  name: 'claude-sisyphus-plugin',
  version: '1.0.0',

  hooks: {
    'session.start': (ctx) => {
      if (isHookEnabled('session.start')) {
        initializeSisyphus(ctx);
      }
    },

    'session.end': (ctx) => {
      if (isHookEnabled('session.end')) {
        cleanupSisyphus();
      }
    },

    'session.idle': (ctx) => {
      if (isHookEnabled('session.idle')) {
        markIdle();
        todoEnforcerHook?.onSessionIdle();
      }
    },

    'chat.message.before': (ctx, message) => {
      if (isHookEnabled('chat.message.before')) {
        return processMessage(ctx, message) as unknown as string | void;
      }
    },

    'chat.message.after': (ctx, message) => {
      if (isHookEnabled('chat.message.after')) {
        sessionManagerHook?.onMessage();
        todoEnforcerHook?.onAssistantMessage();
      }
    },

    'tool.execute.before': (ctx, tool, args) => {
      if (isHookEnabled('tool.execute.before')) {
        sessionManagerHook?.onToolUse();
        recordActivity();
      }
    },

    'tool.execute.after': (ctx, tool, result) => {
      if (isHookEnabled('tool.execute.after')) {
        // Could add result validation here
      }
    },

    'context.compact': (ctx) => {
      if (isHookEnabled('context.compact')) {
        return contextMonitorHook?.onCompacting() as unknown as string;
      }
      return '';
    },
  },

  tools: [],

  skills: builtinSkills,
};

// ============================================
// Default Export
// ============================================

export default SisyphusPlugin;

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a Sisyphus agent with default configuration
 */
export function createDefaultSisyphusAgent() {
  return createSisyphusAgent({
    availableAgents: defaultAvailableAgents,
    availableSkills: builtinSkills,
  });
}

/**
 * Get the background task manager
 */
export function getTaskManager() {
  return getBackgroundManager();
}
