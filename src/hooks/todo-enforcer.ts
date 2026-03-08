/**
 * TODO Continuation Enforcer
 *
 * Automatically resumes work when incomplete tasks are detected
 * and the session becomes idle.
 */

import { getConfig } from '../config/index.js';
import { isSessionIdle, recordActivity } from '../orchestrator/state.js';

// ============================================
// Types
// ============================================

export interface TodoItem {
  id: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner?: string;
  blockedBy?: string[];
}

export interface TodoEnforcerContext {
  getTodos: () => Promise<TodoItem[]>;
  resumeWork: (message: string) => Promise<void>;
  isAgentActive: () => boolean;
  getCurrentAgent: () => string | null;
}

export interface TodoEnforcerState {
  isCountingDown: boolean;
  countdownTimer: ReturnType<typeof setTimeout> | null;
  remainingSeconds: number;
  lastCheckTime: Date | null;
}

// ============================================
// Excluded Agents
// ============================================

const DEFAULT_EXCLUDED_AGENTS = ['prometheus', 'compaction', 'oracle'];

function isExcludedAgent(agentName: string | null): boolean {
  if (!agentName) return false;

  const config = getConfig();
  const excludedAgents = [
    ...DEFAULT_EXCLUDED_AGENTS,
    ...config.todoEnforcer.excludeAgents,
  ];

  return excludedAgents.some(
    (excluded) => agentName.toLowerCase().includes(excluded.toLowerCase())
  );
}

// ============================================
// Todo Enforcer
// ============================================

export class TodoEnforcer {
  private context: TodoEnforcerContext;
  private state: TodoEnforcerState;
  private onCountdownUpdate?: (seconds: number) => void;
  private onAutoResume?: () => void;

  constructor(context: TodoEnforcerContext) {
    this.context = context;
    this.state = {
      isCountingDown: false,
      countdownTimer: null,
      remainingSeconds: 0,
      lastCheckTime: null,
    };
  }

  /**
   * Set callback for countdown updates
   */
  setOnCountdownUpdate(callback: (seconds: number) => void): void {
    this.onCountdownUpdate = callback;
  }

  /**
   * Set callback for auto-resume
   */
  setOnAutoResume(callback: () => void): void {
    this.onAutoResume = callback;
  }

  /**
   * Handle session becoming idle
   */
  async onSessionIdle(): Promise<void> {
    const config = getConfig();

    if (!config.todoEnforcer.enabled) {
      return;
    }

    // Check if current agent is excluded
    const currentAgent = this.context.getCurrentAgent();
    if (isExcludedAgent(currentAgent)) {
      return;
    }

    // Check if agent is still active
    if (this.context.isAgentActive()) {
      return;
    }

    // Check for incomplete todos
    const incompleteTodos = await this.findIncompleteTasks();

    if (incompleteTodos.length > 0) {
      this.startCountdown(config.todoEnforcer.countdownSeconds);
    }
  }

  /**
   * Find incomplete tasks
   */
  async findIncompleteTasks(): Promise<TodoItem[]> {
    const todos = await this.context.getTodos();

    return todos.filter((todo) => {
      // Skip completed tasks
      if (todo.status === 'completed') {
        return false;
      }

      // Skip blocked tasks
      if (todo.blockedBy && todo.blockedBy.length > 0) {
        const allBlockersComplete = todo.blockedBy.every((blockerId) => {
          const blocker = todos.find((t) => t.id === blockerId);
          return blocker?.status === 'completed';
        });
        if (!allBlockersComplete) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Start countdown to auto-resume
   */
  startCountdown(seconds: number): void {
    if (this.state.isCountingDown) {
      return;
    }

    this.state.isCountingDown = true;
    this.state.remainingSeconds = seconds;

    this.tick();
  }

  /**
   * Countdown tick
   */
  private tick(): void {
    if (!this.state.isCountingDown) {
      return;
    }

    this.onCountdownUpdate?.(this.state.remainingSeconds);

    if (this.state.remainingSeconds <= 0) {
      this.autoResume();
      return;
    }

    this.state.remainingSeconds--;

    this.state.countdownTimer = setTimeout(() => {
      this.tick();
    }, 1000);
  }

  /**
   * Cancel countdown
   */
  cancelCountdown(): void {
    if (this.state.countdownTimer) {
      clearTimeout(this.state.countdownTimer);
      this.state.countdownTimer = null;
    }
    this.state.isCountingDown = false;
    this.state.remainingSeconds = 0;
  }

  /**
   * Auto-resume work
   */
  private async autoResume(): Promise<void> {
    this.cancelCountdown();

    const incompleteTodos = await this.findIncompleteTasks();

    if (incompleteTodos.length === 0) {
      return;
    }

    // Find the highest priority incomplete task
    const nextTask = this.findNextTask(incompleteTodos);

    if (nextTask) {
      const resumeMessage = this.buildResumeMessage(nextTask, incompleteTodos);
      this.onAutoResume?.();
      await this.context.resumeWork(resumeMessage);
    }
  }

  /**
   * Find the next task to work on
   */
  private findNextTask(incompleteTodos: TodoItem[]): TodoItem | null {
    // Prefer in_progress tasks
    const inProgress = incompleteTodos.find((t) => t.status === 'in_progress');
    if (inProgress) {
      return inProgress;
    }

    // Otherwise, get the first pending task
    return incompleteTodos.find((t) => t.status === 'pending') ?? null;
  }

  /**
   * Build resume message
   */
  private buildResumeMessage(task: TodoItem, allIncomplete: TodoItem[]): string {
    const taskCount = allIncomplete.length;
    const taskList = allIncomplete
      .slice(0, 3)
      .map((t) => `- ${t.subject} (${t.status})`)
      .join('\n');

    return `Continue working on incomplete tasks. ${taskCount} task(s) remaining:

${taskList}${taskCount > 3 ? `\n... and ${taskCount - 3} more` : ''}

Current task: ${task.subject}

Please continue with this task. If blocked, explain why and move to the next task.`;
  }

  /**
   * Handle user activity (cancels countdown)
   */
  onUserActivity(): void {
    if (this.state.isCountingDown) {
      this.cancelCountdown();
    }
    recordActivity();
  }

  /**
   * Handle assistant activity (cancels countdown)
   */
  onAssistantActivity(): void {
    if (this.state.isCountingDown) {
      this.cancelCountdown();
    }
    recordActivity();
  }

  /**
   * Get current state
   */
  getState(): Readonly<TodoEnforcerState> {
    return { ...this.state };
  }

  /**
   * Check if countdown is active
   */
  isCountdownActive(): boolean {
    return this.state.isCountingDown;
  }

  /**
   * Get remaining countdown seconds
   */
  getRemainingSeconds(): number {
    return this.state.remainingSeconds;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.cancelCountdown();
  }
}

// ============================================
// Factory Function
// ============================================

export function createTodoEnforcer(context: TodoEnforcerContext): TodoEnforcer {
  return new TodoEnforcer(context);
}

// ============================================
// Hook Creator
// ============================================

export interface TodoEnforcerHookHandlers {
  onSessionIdle: () => Promise<void>;
  onUserMessage: () => void;
  onAssistantMessage: () => void;
  destroy: () => void;
}

export function createTodoEnforcerHook(
  context: TodoEnforcerContext
): TodoEnforcerHookHandlers {
  const enforcer = createTodoEnforcer(context);

  return {
    onSessionIdle: () => enforcer.onSessionIdle(),
    onUserMessage: () => enforcer.onUserActivity(),
    onAssistantMessage: () => enforcer.onAssistantActivity(),
    destroy: () => enforcer.destroy(),
  };
}
