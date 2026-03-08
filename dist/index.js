/**
 * Claude Sisyphus Plugin
 *
 * Main entry point for the Sisyphus-style agent orchestration plugin.
 */
// ============================================
// Module Exports
// ============================================
export { defaultAvailableAgents } from './agents/index.js';
export * from './orchestrator/index.js';
export * from './hooks/index.js';
export * from './skills/index.js';
export * from './prompts/index.js';
export { getConfig, initializeConfig, isHookEnabled, isToolEnabled } from './config/index.js';
export * from './tools/index.js';
export * from './context/index.js';
export * from './memory/index.js';
export * from './artifacts/index.js';
export * from './policy/index.js';
// ============================================
// Imports
// ============================================
import { initializeConfig, getConfig, isHookEnabled } from './config/index.js';
import { createSisyphusAgent, matchSkill, detectIntent } from './agents/sisyphus.js';
import { defaultAvailableAgents } from './agents/index.js';
import { getBackgroundManager, resetBackgroundManager } from './orchestrator/manager.js';
import { initializeSession, markIdle, recordActivity } from './orchestrator/state.js';
import { createTodoEnforcerHook } from './hooks/todo-enforcer.js';
import { createContextMonitorHook } from './hooks/context-monitor.js';
import { createSessionManagerHook } from './hooks/session-manager.js';
import { builtinSkills, isUltraworkRequest, activateUltrawork } from './skills/index.js';
import { buildContextPack, formatContextPackMarkdown } from './context/context-pack.js';
import { getMemoryStore, resetMemoryStore } from './memory/index.js';
import { artifactDriftStatus, buildContextPackTool, memoryAppend, memoryCompact, memorySearch, policyActiveRules, } from './tools/omnibus/index.js';
// ============================================
// Plugin State
// ============================================
let pluginContext = null;
let todoEnforcerHook = null;
let contextMonitorHook = null;
let sessionManagerHook = null;
let memoryStore = null;
let lastCompactionSnapshot = 'Context snapshot pending.';
// ============================================
// Helpers
// ============================================
function asObject(args) {
    if (args && typeof args === 'object') {
        return args;
    }
    return {};
}
function toStringArray(value) {
    if (!Array.isArray(value)) {
        return undefined;
    }
    return value
        .map((item) => String(item))
        .filter((item) => item.trim().length > 0);
}
function toNumber(value) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
        return parsed;
    }
    return undefined;
}
async function refreshCompactionSnapshot(ctx, reason) {
    try {
        const config = getConfig();
        const contextPackConfig = config.contextPack || {
            tokenBudget: 15000,
            maxLayerEntries: 12,
            memoryLookback: 10,
        };
        const pack = await buildContextPack({
            projectRoot: ctx.projectRoot,
            tokenBudget: contextPackConfig.tokenBudget,
            maxLayerEntries: contextPackConfig.maxLayerEntries,
            memoryLookback: contextPackConfig.memoryLookback,
            taskDescription: reason,
        });
        lastCompactionSnapshot = formatContextPackMarkdown(pack);
        if (memoryStore) {
            await memoryStore.compact(lastCompactionSnapshot, {
                scope: 'session',
                sessionId: ctx.sessionId,
                sourceRef: 'context.compact',
                tags: ['compaction', 'context-pack'],
                metadata: {
                    reason,
                    globalRefs: pack.layers.global.length,
                    sprintRefs: pack.layers.sprint.length,
                    executionRefs: pack.layers.execution.length,
                },
            });
        }
    }
    catch (error) {
        lastCompactionSnapshot =
            `Compaction snapshot failed: ${error instanceof Error ? error.message : String(error)}`;
    }
}
// ============================================
// Plugin Initialization
// ============================================
function initializeSisyphus(ctx) {
    pluginContext = ctx;
    // Initialize configuration
    const config = initializeConfig({ projectRoot: ctx.projectRoot });
    // Initialize session
    initializeSession(ctx.sessionId, ctx.projectRoot);
    // Initialize persistent memory
    memoryStore = getMemoryStore(ctx.projectRoot, config.memory || {});
    void memoryStore.append({
        kind: 'execution',
        scope: 'session',
        content: `Session started (${ctx.sessionId})`,
        tags: ['session', 'start'],
        sessionId: ctx.sessionId,
        sourceRef: 'session.start',
    });
    if (config.artifactDrift?.enabled !== false) {
        void artifactDriftStatus({ projectRoot: ctx.projectRoot }).then((driftResult) => {
            if (!driftResult.success) {
                return;
            }
            const report = driftResult.data;
            const issueCount = report?.issues?.length ?? 0;
            const highCount = report?.issues?.filter((issue) => issue.severity === 'high').length ?? 0;
            void memoryStore?.append({
                kind: highCount > 0 ? 'failure' : 'execution',
                scope: 'session',
                content: `Artifact drift check: ${issueCount} issue(s), ${highCount} high-severity.`,
                tags: ['drift', 'startup'],
                sessionId: ctx.sessionId,
                sourceRef: 'artifact_drift_status',
            });
        });
    }
    void policyActiveRules({ projectRoot: ctx.projectRoot, limit: 10 }).then((policyResult) => {
        if (!policyResult.success) {
            return;
        }
        const manifest = policyResult.data;
        const ruleCount = manifest?.rules?.length ?? 0;
        void memoryStore?.append({
            kind: 'decision',
            scope: 'global',
            content: `Policy manifest loaded with ${ruleCount} rule(s).`,
            tags: ['policy', 'bootstrap'],
            confidence: 0.9,
            sessionId: ctx.sessionId,
            sourceRef: 'policy_active_rules',
        });
    });
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
            void refreshCompactionSnapshot(ctx, `critical usage ${Math.round(usage * 100)}%`);
        },
    });
    sessionManagerHook = createSessionManagerHook({
        onSessionIdle: () => {
            todoEnforcerHook?.onSessionIdle();
        },
    });
    // Start session
    sessionManagerHook.onSessionStart(ctx.sessionId, ctx.projectRoot);
    // Prime compaction snapshot so context.compact has a deterministic payload.
    void refreshCompactionSnapshot(ctx, 'session bootstrap');
}
function cleanupSisyphus() {
    if (pluginContext && memoryStore) {
        void memoryStore.append({
            kind: 'execution',
            scope: 'session',
            content: `Session ended (${pluginContext.sessionId})`,
            tags: ['session', 'end'],
            sessionId: pluginContext.sessionId,
            sourceRef: 'session.end',
        });
        resetMemoryStore(pluginContext.projectRoot);
    }
    todoEnforcerHook?.destroy();
    sessionManagerHook?.destroy();
    resetBackgroundManager();
    todoEnforcerHook = null;
    contextMonitorHook = null;
    sessionManagerHook = null;
    memoryStore = null;
    pluginContext = null;
}
// ============================================
// Message Processing
// ============================================
async function processMessage(ctx, message) {
    const config = getConfig();
    const ultraworkEnabled = config.skills?.ultrawork?.enabled !== false;
    void memoryStore?.append({
        kind: 'execution',
        scope: 'chat',
        content: `User message: ${message.slice(0, 300)}`,
        tags: ['chat', 'user'],
        sessionId: ctx.sessionId,
        sourceRef: 'chat.message.before',
    });
    // Check for ultrawork activation
    if (ultraworkEnabled && isUltraworkRequest(message)) {
        const result = await activateUltrawork(message, {
            availableTools: ctx.getAvailableTools().map((t) => t.name),
        });
        if (result.success) {
            void memoryStore?.append({
                kind: 'pattern',
                scope: 'execution',
                content: `Ultrawork activation matched for message: ${message.slice(0, 200)}`,
                tags: ['skill', 'ultrawork'],
                confidence: 0.9,
                sessionId: ctx.sessionId,
            });
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
            void memoryStore?.append({
                kind: 'pattern',
                scope: 'execution',
                content: `Skill matched: ${matchedSkill.name}`,
                tags: ['skill', matchedSkill.name],
                confidence: 0.8,
                sessionId: ctx.sessionId,
            });
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
export const SisyphusPlugin = {
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
                return processMessage(ctx, message);
            }
        },
        'chat.message.after': (ctx, message) => {
            if (isHookEnabled('chat.message.after')) {
                sessionManagerHook?.onMessage();
                todoEnforcerHook?.onAssistantMessage();
                void memoryStore?.append({
                    kind: 'execution',
                    scope: 'chat',
                    content: `Assistant responded for message: ${message.slice(0, 200)}`,
                    tags: ['chat', 'assistant'],
                    sessionId: ctx.sessionId,
                    sourceRef: 'chat.message.after',
                });
            }
        },
        'tool.execute.before': (ctx, tool, args) => {
            if (isHookEnabled('tool.execute.before')) {
                sessionManagerHook?.onToolUse();
                recordActivity();
                void memoryStore?.append({
                    kind: 'execution',
                    scope: 'tool',
                    content: `Tool started: ${tool}`,
                    tags: ['tool', 'before', tool],
                    sessionId: ctx.sessionId,
                    sourceRef: 'tool.execute.before',
                    metadata: {
                        args,
                    },
                });
            }
        },
        'tool.execute.after': (ctx, tool, result) => {
            if (isHookEnabled('tool.execute.after')) {
                void memoryStore?.append({
                    kind: 'execution',
                    scope: 'tool',
                    content: `Tool finished: ${tool}`,
                    tags: ['tool', 'after', tool],
                    sessionId: ctx.sessionId,
                    sourceRef: 'tool.execute.after',
                    metadata: {
                        result,
                    },
                });
            }
        },
        'context.compact': (ctx) => {
            if (isHookEnabled('context.compact')) {
                void refreshCompactionSnapshot(ctx, 'context.compact hook');
                return lastCompactionSnapshot;
            }
            return '';
        },
    },
    tools: [
        {
            name: 'memory_append',
            description: 'Append a persistent memory record (decision/execution/pattern/failure).',
            execute: async (args) => {
                const data = asObject(args);
                return memoryAppend({
                    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : pluginContext?.projectRoot,
                    kind: String(data.kind || 'note'),
                    content: String(data.content || ''),
                    scope: typeof data.scope === 'string' ? data.scope : undefined,
                    tags: toStringArray(data.tags),
                    confidence: toNumber(data.confidence),
                    sourceRef: typeof data.sourceRef === 'string' ? data.sourceRef : undefined,
                    sessionId: typeof data.sessionId === 'string' ? data.sessionId : pluginContext?.sessionId,
                    metadata: data.metadata && typeof data.metadata === 'object'
                        ? data.metadata
                        : undefined,
                });
            },
        },
        {
            name: 'memory_search',
            description: 'Search persistent memory by query/tags/scope.',
            execute: async (args) => {
                const data = asObject(args);
                return memorySearch({
                    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : pluginContext?.projectRoot,
                    query: typeof data.query === 'string' ? data.query : undefined,
                    limit: toNumber(data.limit),
                    kinds: toStringArray(data.kinds),
                    scopes: toStringArray(data.scopes),
                    minConfidence: toNumber(data.minConfidence),
                });
            },
        },
        {
            name: 'memory_compact',
            description: 'Store a compaction snapshot with context pack payload.',
            execute: async (args) => {
                const data = asObject(args);
                return memoryCompact({
                    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : pluginContext?.projectRoot,
                    summary: typeof data.summary === 'string' ? data.summary : undefined,
                    taskDescription: typeof data.taskDescription === 'string' ? data.taskDescription : undefined,
                    scope: typeof data.scope === 'string' ? data.scope : undefined,
                    tags: toStringArray(data.tags),
                    sessionId: typeof data.sessionId === 'string' ? data.sessionId : pluginContext?.sessionId,
                    sourceRef: typeof data.sourceRef === 'string' ? data.sourceRef : 'memory_compact_tool',
                    includeContextPack: data.includeContextPack !== false,
                });
            },
        },
        {
            name: 'artifact_drift_status',
            description: 'Check version pin drift between canonical and derived artifacts.',
            execute: async (args) => {
                const data = asObject(args);
                return artifactDriftStatus({
                    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : pluginContext?.projectRoot,
                });
            },
        },
        {
            name: 'policy_active_rules',
            description: 'Collect active MUST/SHOULD rules from CLAUDE/AGENTS/process docs.',
            execute: async (args) => {
                const data = asObject(args);
                return policyActiveRules({
                    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : pluginContext?.projectRoot,
                    limit: toNumber(data.limit),
                });
            },
        },
        {
            name: 'context_pack_build',
            description: 'Compile global/sprint/execution context pack with memory slice.',
            execute: async (args) => {
                const data = asObject(args);
                return buildContextPackTool({
                    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : pluginContext?.projectRoot,
                    taskDescription: typeof data.taskDescription === 'string' ? data.taskDescription : undefined,
                    workingFiles: toStringArray(data.workingFiles),
                    tokenBudget: toNumber(data.tokenBudget),
                    maxLayerEntries: toNumber(data.maxLayerEntries),
                    memoryLookback: toNumber(data.memoryLookback),
                });
            },
        },
    ],
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
//# sourceMappingURL=index.js.map