/**
 * Hook System - Comprehensive Event Hook Infrastructure
 *
 * Provides 25+ extension points for customizing Claude Code behavior.
 * Hooks can be synchronous or asynchronous, and can modify data or perform side effects.
 *
 * Hook Categories:
 * - Session: start, end, idle, resume
 * - Tool: pre-execute, post-execute, error
 * - User: prompt-submit, response-ready
 * - Context: compaction, overflow, refresh
 * - File: change, create, delete
 * - Git: commit, push, pull, merge
 * - Task: create, start, complete, fail
 * - Error: occurred, recovered, fatal
 */
import { EventEmitter } from 'events';
// ============================================
// Hook Definitions (25+)
// ============================================
export const HOOK_DEFINITIONS = [
    // Session Hooks
    {
        name: 'session.start',
        description: 'Fired when a new session starts',
        category: 'session',
        dataType: 'SessionStartData',
        cancellable: false,
        modifiable: true,
    },
    {
        name: 'session.end',
        description: 'Fired when a session ends',
        category: 'session',
        dataType: 'SessionEndData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'session.idle',
        description: 'Fired when session becomes idle',
        category: 'session',
        dataType: 'SessionIdleData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'session.resume',
        description: 'Fired when session resumes from idle',
        category: 'session',
        dataType: 'SessionResumeData',
        cancellable: false,
        modifiable: true,
    },
    // Tool Hooks
    {
        name: 'tool.pre-execute',
        description: 'Fired before a tool is executed',
        category: 'tool',
        dataType: 'ToolExecuteData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'tool.post-execute',
        description: 'Fired after a tool completes',
        category: 'tool',
        dataType: 'ToolResultData',
        cancellable: false,
        modifiable: true,
    },
    {
        name: 'tool.error',
        description: 'Fired when a tool encounters an error',
        category: 'tool',
        dataType: 'ToolErrorData',
        cancellable: false,
        modifiable: true,
    },
    // User Interaction Hooks
    {
        name: 'user.prompt-submit',
        description: 'Fired when user submits a prompt',
        category: 'user',
        dataType: 'UserPromptData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'user.response-ready',
        description: 'Fired when response is ready to display',
        category: 'user',
        dataType: 'ResponseData',
        cancellable: false,
        modifiable: true,
    },
    {
        name: 'user.interrupt',
        description: 'Fired when user interrupts processing',
        category: 'user',
        dataType: 'InterruptData',
        cancellable: false,
        modifiable: false,
    },
    // Context Hooks
    {
        name: 'context.compaction',
        description: 'Fired when context is about to be compacted',
        category: 'context',
        dataType: 'CompactionData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'context.overflow',
        description: 'Fired when context exceeds threshold',
        category: 'context',
        dataType: 'OverflowData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'context.refresh',
        description: 'Fired when context is refreshed',
        category: 'context',
        dataType: 'RefreshData',
        cancellable: false,
        modifiable: true,
    },
    // File Hooks
    {
        name: 'file.change',
        description: 'Fired when a file is modified',
        category: 'file',
        dataType: 'FileChangeData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'file.create',
        description: 'Fired when a file is created',
        category: 'file',
        dataType: 'FileCreateData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'file.delete',
        description: 'Fired when a file is deleted',
        category: 'file',
        dataType: 'FileDeleteData',
        cancellable: true,
        modifiable: false,
    },
    {
        name: 'file.read',
        description: 'Fired when a file is read',
        category: 'file',
        dataType: 'FileReadData',
        cancellable: false,
        modifiable: false,
    },
    // Git Hooks
    {
        name: 'git.pre-commit',
        description: 'Fired before a git commit',
        category: 'git',
        dataType: 'GitCommitData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'git.post-commit',
        description: 'Fired after a git commit',
        category: 'git',
        dataType: 'GitCommitData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'git.pre-push',
        description: 'Fired before a git push',
        category: 'git',
        dataType: 'GitPushData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'git.pull',
        description: 'Fired when git pull is executed',
        category: 'git',
        dataType: 'GitPullData',
        cancellable: false,
        modifiable: false,
    },
    // Task Hooks
    {
        name: 'task.create',
        description: 'Fired when a task is created',
        category: 'task',
        dataType: 'TaskData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'task.start',
        description: 'Fired when a task starts execution',
        category: 'task',
        dataType: 'TaskData',
        cancellable: true,
        modifiable: true,
    },
    {
        name: 'task.complete',
        description: 'Fired when a task completes successfully',
        category: 'task',
        dataType: 'TaskCompleteData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'task.fail',
        description: 'Fired when a task fails',
        category: 'task',
        dataType: 'TaskFailData',
        cancellable: false,
        modifiable: false,
    },
    // Error Hooks
    {
        name: 'error.occurred',
        description: 'Fired when any error occurs',
        category: 'error',
        dataType: 'ErrorData',
        cancellable: false,
        modifiable: true,
    },
    {
        name: 'error.recovered',
        description: 'Fired when an error is recovered from',
        category: 'error',
        dataType: 'ErrorRecoveryData',
        cancellable: false,
        modifiable: false,
    },
    {
        name: 'error.fatal',
        description: 'Fired when a fatal error occurs',
        category: 'error',
        dataType: 'FatalErrorData',
        cancellable: false,
        modifiable: false,
    },
];
// ============================================
// Hook System Implementation
// ============================================
export class HookSystem extends EventEmitter {
    hooks = new Map();
    hookIdCounter = 0;
    sessionId = '';
    enabled = true;
    executionLog = [];
    constructor() {
        super();
        this.initializeHooks();
    }
    initializeHooks() {
        for (const def of HOOK_DEFINITIONS) {
            this.hooks.set(def.name, []);
        }
    }
    /**
     * Register a hook handler
     */
    register(hookName, handler, options = {}) {
        if (!this.hooks.has(hookName)) {
            throw new Error(`Unknown hook: ${hookName}`);
        }
        const id = `hook_${++this.hookIdCounter}`;
        const hook = {
            id,
            name: hookName,
            handler: handler,
            priority: options.priority || 'normal',
            enabled: true,
            description: options.description,
            once: options.once,
        };
        const hooks = this.hooks.get(hookName);
        hooks.push(hook);
        // Sort by priority
        hooks.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        return id;
    }
    /**
     * Unregister a hook handler
     */
    unregister(hookId) {
        for (const [, hooks] of this.hooks) {
            const index = hooks.findIndex(h => h.id === hookId);
            if (index >= 0) {
                hooks.splice(index, 1);
                return true;
            }
        }
        return false;
    }
    /**
     * Enable/disable a hook handler
     */
    setEnabled(hookId, enabled) {
        for (const [, hooks] of this.hooks) {
            const hook = hooks.find(h => h.id === hookId);
            if (hook) {
                hook.enabled = enabled;
                return true;
            }
        }
        return false;
    }
    /**
     * Trigger a hook
     */
    async trigger(hookName, data, metadata = {}) {
        if (!this.enabled) {
            return this.createContext(hookName, data, metadata);
        }
        const hooks = this.hooks.get(hookName);
        if (!hooks) {
            throw new Error(`Unknown hook: ${hookName}`);
        }
        const context = this.createContext(hookName, data, metadata);
        const startTime = Date.now();
        const toRemove = [];
        for (const hook of hooks) {
            if (!hook.enabled)
                continue;
            try {
                await hook.handler(context);
                if (hook.once) {
                    toRemove.push(hook.id);
                }
                // If cancelled, stop processing remaining hooks
                if (context.cancelled) {
                    break;
                }
            }
            catch (error) {
                console.error(`Hook error in ${hook.id} for ${hookName}:`, error);
                this.emit('hook-error', { hookId: hook.id, hookName, error });
            }
        }
        // Remove one-time hooks
        for (const id of toRemove) {
            this.unregister(id);
        }
        // Log execution
        this.executionLog.push({
            hookName,
            timestamp: startTime,
            duration: Date.now() - startTime,
            success: !context.cancelled,
        });
        // Keep log size manageable
        if (this.executionLog.length > 1000) {
            this.executionLog = this.executionLog.slice(-500);
        }
        return context;
    }
    /**
     * Trigger a hook synchronously (for simple hooks)
     */
    triggerSync(hookName, data, metadata = {}) {
        if (!this.enabled) {
            return this.createContext(hookName, data, metadata);
        }
        const hooks = this.hooks.get(hookName);
        if (!hooks) {
            throw new Error(`Unknown hook: ${hookName}`);
        }
        const context = this.createContext(hookName, data, metadata);
        const toRemove = [];
        for (const hook of hooks) {
            if (!hook.enabled)
                continue;
            try {
                const result = hook.handler(context);
                // If handler returns a promise, warn but don't await
                if (result instanceof Promise) {
                    console.warn(`Async handler used with triggerSync for ${hookName}`);
                }
                if (hook.once) {
                    toRemove.push(hook.id);
                }
                if (context.cancelled) {
                    break;
                }
            }
            catch (error) {
                console.error(`Hook error in ${hook.id}:`, error);
            }
        }
        for (const id of toRemove) {
            this.unregister(id);
        }
        return context;
    }
    createContext(hookName, data, metadata) {
        return {
            hookName,
            data,
            modifiedData: JSON.parse(JSON.stringify(data)), // Deep clone
            timestamp: Date.now(),
            sessionId: this.sessionId,
            cancelled: false,
            metadata,
        };
    }
    /**
     * Get all registered hooks
     */
    getRegisteredHooks() {
        return new Map(this.hooks);
    }
    /**
     * Get hook definitions
     */
    getHookDefinitions() {
        return [...HOOK_DEFINITIONS];
    }
    /**
     * Get hooks by category
     */
    getHooksByCategory(category) {
        return HOOK_DEFINITIONS.filter(h => h.category === category);
    }
    /**
     * Get execution statistics
     */
    getExecutionStats() {
        const total = this.executionLog.length;
        const successful = this.executionLog.filter(e => e.success).length;
        const totalDuration = this.executionLog.reduce((sum, e) => sum + e.duration, 0);
        const byHook = {};
        for (const entry of this.executionLog) {
            if (!byHook[entry.hookName]) {
                byHook[entry.hookName] = { count: 0, totalDuration: 0 };
            }
            byHook[entry.hookName].count++;
            byHook[entry.hookName].totalDuration += entry.duration;
        }
        const byHookStats = {};
        for (const [name, stats] of Object.entries(byHook)) {
            byHookStats[name] = {
                count: stats.count,
                avgDuration: stats.totalDuration / stats.count,
            };
        }
        return {
            totalExecutions: total,
            successRate: total > 0 ? successful / total : 1,
            averageDuration: total > 0 ? totalDuration / total : 0,
            byHook: byHookStats,
        };
    }
    /**
     * Set session ID
     */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    /**
     * Enable/disable the entire hook system
     */
    setSystemEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Clear all hooks
     */
    clearAll() {
        for (const [name] of this.hooks) {
            this.hooks.set(name, []);
        }
        this.executionLog = [];
    }
}
// ============================================
// Singleton Instance
// ============================================
let hookSystemInstance = null;
export function getHookSystem() {
    if (!hookSystemInstance) {
        hookSystemInstance = new HookSystem();
    }
    return hookSystemInstance;
}
// ============================================
// Convenience Functions
// ============================================
export function registerHook(hookName, handler, options) {
    return getHookSystem().register(hookName, handler, options);
}
export function unregisterHook(hookId) {
    return getHookSystem().unregister(hookId);
}
export function triggerHook(hookName, data, metadata) {
    return getHookSystem().trigger(hookName, data, metadata);
}
export function triggerHookSync(hookName, data, metadata) {
    return getHookSystem().triggerSync(hookName, data, metadata);
}
//# sourceMappingURL=hook-system.js.map