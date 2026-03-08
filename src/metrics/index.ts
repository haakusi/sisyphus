/**
 * Metrics & Statistics System
 *
 * Tracks model usage, estimated costs, and session statistics.
 * Inspired by oh-my-opencode's tracking capabilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Cost estimates per 1K tokens (approximate, 2026 pricing)
const MODEL_COSTS = {
  // Claude models (per 1K tokens)
  'opus': { input: 0.015, output: 0.075 },
  'sonnet': { input: 0.003, output: 0.015 },
  'haiku': { input: 0.00025, output: 0.00125 },
  // External models (if used)
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gemini-pro': { input: 0.00125, output: 0.005 },
} as const;

type ModelName = keyof typeof MODEL_COSTS;

interface ModelUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  avgLatencyMs: number;
  errors: number;
}

interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  models: Record<string, ModelUsage>;
  tasksCreated: number;
  tasksCompleted: number;
  tasksFailed: number;
  parallelExecutions: number;
  contextCompactions: number;
}

interface AggregateMetrics {
  totalSessions: number;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  modelBreakdown: Record<string, ModelUsage>;
  avgSessionDurationMs: number;
  taskCompletionRate: number;
}

// Singleton metrics manager
class MetricsManager {
  private static instance: MetricsManager;
  private currentSession: SessionMetrics | null = null;
  private metricsDir: string;

  private constructor() {
    this.metricsDir = path.join(os.homedir(), '.config', 'claude-sisyphus', 'metrics');
    this.ensureDir();
  }

  static getInstance(): MetricsManager {
    if (!MetricsManager.instance) {
      MetricsManager.instance = new MetricsManager();
    }
    return MetricsManager.instance;
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  // Session lifecycle
  startSession(sessionId: string): void {
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      models: {},
      tasksCreated: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      parallelExecutions: 0,
      contextCompactions: 0,
    };
  }

  endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.saveSession(this.currentSession);
      this.currentSession = null;
    }
  }

  // Track model usage
  trackModelCall(
    model: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    success: boolean
  ): void {
    if (!this.currentSession) return;

    const normalizedModel = this.normalizeModelName(model);

    if (!this.currentSession.models[normalizedModel]) {
      this.currentSession.models[normalizedModel] = {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        avgLatencyMs: 0,
        errors: 0,
      };
    }

    const usage = this.currentSession.models[normalizedModel];
    usage.calls++;
    usage.inputTokens += inputTokens;
    usage.outputTokens += outputTokens;

    // Calculate cost
    const costs = MODEL_COSTS[normalizedModel as ModelName] || MODEL_COSTS.sonnet;
    usage.estimatedCost += (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;

    // Update average latency
    usage.avgLatencyMs = ((usage.avgLatencyMs * (usage.calls - 1)) + latencyMs) / usage.calls;

    if (!success) {
      usage.errors++;
    }
  }

  // Track task events
  trackTaskCreated(): void {
    if (this.currentSession) {
      this.currentSession.tasksCreated++;
    }
  }

  trackTaskCompleted(): void {
    if (this.currentSession) {
      this.currentSession.tasksCompleted++;
    }
  }

  trackTaskFailed(): void {
    if (this.currentSession) {
      this.currentSession.tasksFailed++;
    }
  }

  trackParallelExecution(): void {
    if (this.currentSession) {
      this.currentSession.parallelExecutions++;
    }
  }

  trackContextCompaction(): void {
    if (this.currentSession) {
      this.currentSession.contextCompactions++;
    }
  }

  // Get current session stats
  getCurrentStats(): SessionMetrics | null {
    return this.currentSession;
  }

  // Get formatted summary
  getSessionSummary(): string {
    if (!this.currentSession) return 'No active session';

    const session = this.currentSession;
    const duration = Date.now() - session.startTime;
    const durationMin = Math.round(duration / 60000);

    let totalCost = 0;
    let totalCalls = 0;
    const modelLines: string[] = [];

    for (const [model, usage] of Object.entries(session.models)) {
      totalCost += usage.estimatedCost;
      totalCalls += usage.calls;
      modelLines.push(
        `  ${model}: ${usage.calls} calls, ~$${usage.estimatedCost.toFixed(4)}, ${Math.round(usage.avgLatencyMs)}ms avg`
      );
    }

    const completionRate = session.tasksCreated > 0
      ? Math.round((session.tasksCompleted / session.tasksCreated) * 100)
      : 0;

    return `
Session Metrics (${durationMin}min)
─────────────────────────────────
Models:
${modelLines.join('\n') || '  No model calls yet'}

Tasks:
  Created: ${session.tasksCreated}
  Completed: ${session.tasksCompleted} (${completionRate}%)
  Failed: ${session.tasksFailed}

Efficiency:
  Parallel Executions: ${session.parallelExecutions}
  Context Compactions: ${session.contextCompactions}

Estimated Cost: ~$${totalCost.toFixed(4)}
`.trim();
  }

  // Aggregate metrics across sessions
  getAggregateMetrics(days: number = 7): AggregateMetrics {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const sessions = this.loadSessions(cutoff);

    const aggregate: AggregateMetrics = {
      totalSessions: sessions.length,
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalEstimatedCost: 0,
      modelBreakdown: {},
      avgSessionDurationMs: 0,
      taskCompletionRate: 0,
    };

    let totalTasks = 0;
    let completedTasks = 0;
    let totalDuration = 0;

    for (const session of sessions) {
      totalTasks += session.tasksCreated;
      completedTasks += session.tasksCompleted;

      if (session.endTime) {
        totalDuration += session.endTime - session.startTime;
      }

      for (const [model, usage] of Object.entries(session.models)) {
        if (!aggregate.modelBreakdown[model]) {
          aggregate.modelBreakdown[model] = {
            calls: 0,
            inputTokens: 0,
            outputTokens: 0,
            estimatedCost: 0,
            avgLatencyMs: 0,
            errors: 0,
          };
        }

        const agg = aggregate.modelBreakdown[model];
        agg.calls += usage.calls;
        agg.inputTokens += usage.inputTokens;
        agg.outputTokens += usage.outputTokens;
        agg.estimatedCost += usage.estimatedCost;
        agg.errors += usage.errors;

        aggregate.totalCalls += usage.calls;
        aggregate.totalInputTokens += usage.inputTokens;
        aggregate.totalOutputTokens += usage.outputTokens;
        aggregate.totalEstimatedCost += usage.estimatedCost;
      }
    }

    aggregate.avgSessionDurationMs = sessions.length > 0 ? totalDuration / sessions.length : 0;
    aggregate.taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    return aggregate;
  }

  // Helper methods
  private normalizeModelName(model: string): string {
    const lower = model.toLowerCase();
    if (lower.includes('opus')) return 'opus';
    if (lower.includes('sonnet')) return 'sonnet';
    if (lower.includes('haiku')) return 'haiku';
    if (lower.includes('gpt-4')) return 'gpt-4o';
    if (lower.includes('gemini')) return 'gemini-pro';
    return 'sonnet'; // default
  }

  private saveSession(session: SessionMetrics): void {
    const filename = `session-${session.sessionId}-${session.startTime}.json`;
    const filepath = path.join(this.metricsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(session, null, 2));
  }

  private loadSessions(afterTimestamp: number): SessionMetrics[] {
    const sessions: SessionMetrics[] = [];

    if (!fs.existsSync(this.metricsDir)) return sessions;

    const files = fs.readdirSync(this.metricsDir)
      .filter(f => f.startsWith('session-') && f.endsWith('.json'));

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.metricsDir, file), 'utf-8');
        const session = JSON.parse(content) as SessionMetrics;
        if (session.startTime >= afterTimestamp) {
          sessions.push(session);
        }
      } catch {
        // Skip invalid files
      }
    }

    return sessions;
  }
}

// Export singleton
export const metrics = MetricsManager.getInstance();

// Convenience functions
export function trackModelCall(
  model: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  success: boolean = true
): void {
  metrics.trackModelCall(model, inputTokens, outputTokens, latencyMs, success);
}

export function getSessionSummary(): string {
  return metrics.getSessionSummary();
}

export function getAggregateMetrics(days: number = 7): AggregateMetrics {
  return metrics.getAggregateMetrics(days);
}

// Types are already exported at their declaration points
