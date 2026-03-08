/**
 * Stats Skill - View metrics and statistics
 *
 * Provides access to session metrics, model usage, and cost estimates.
 */

import { metrics, getSessionSummary, getAggregateMetrics } from '../metrics/index.js';

// Skill definition
export const statsSkillDefinition = {
  name: 'stats',
  aliases: ['metrics', 'usage'],
  description: 'View session metrics, model usage, and cost estimates',
  triggers: ['stats', '/stats', 'show stats', 'show metrics', '/usage'],

  async execute(context: { message: string; args?: string }) {
    const args = context.args?.toLowerCase() || '';

    // Determine what stats to show
    if (args.includes('week') || args.includes('7')) {
      return {
        response: formatAggregateMetrics(7),
      };
    }

    if (args.includes('month') || args.includes('30')) {
      return {
        response: formatAggregateMetrics(30),
      };
    }

    if (args.includes('all') || args.includes('total')) {
      return {
        response: formatAggregateMetrics(365),
      };
    }

    // Default: current session
    return {
      response: getSessionSummary(),
    };
  },
};

function formatAggregateMetrics(days: number): string {
  const agg = getAggregateMetrics(days);

  if (agg.totalSessions === 0) {
    return `No metrics found for the last ${days} days.`;
  }

  const modelLines: string[] = [];
  for (const [model, usage] of Object.entries(agg.modelBreakdown)) {
    modelLines.push(
      `  ${model}: ${usage.calls} calls, ~$${usage.estimatedCost.toFixed(4)}`
    );
  }

  const avgDuration = Math.round(agg.avgSessionDurationMs / 60000);
  const completionRate = Math.round(agg.taskCompletionRate * 100);

  return `
Aggregate Metrics (Last ${days} days)
═══════════════════════════════════════

Sessions: ${agg.totalSessions}
Total API Calls: ${agg.totalCalls}

Token Usage:
  Input: ${formatNumber(agg.totalInputTokens)} tokens
  Output: ${formatNumber(agg.totalOutputTokens)} tokens

Model Breakdown:
${modelLines.join('\n') || '  No model usage recorded'}

Performance:
  Avg Session Duration: ${avgDuration} min
  Task Completion Rate: ${completionRate}%

Estimated Total Cost: ~$${agg.totalEstimatedCost.toFixed(4)}
`.trim();
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// statsSkillDefinition is already exported at declaration
