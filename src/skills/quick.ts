/**
 * Quick Skill - Fast Execution Mode
 *
 * Optimized for simple tasks that don't need complex orchestration.
 * Uses Haiku by default for speed and cost efficiency.
 */

export interface QuickConfig {
  defaultModel: 'haiku' | 'sonnet';
  skipAssessment: boolean;
  skipTodoTracking: boolean;
  maxTokens: number;
}

const DEFAULT_CONFIG: QuickConfig = {
  defaultModel: 'haiku',
  skipAssessment: true,
  skipTodoTracking: true,
  maxTokens: 4096,
};

// Quick task patterns
const QUICK_PATTERNS = [
  // Search patterns
  { pattern: /find\s+(?:all\s+)?files?/i, type: 'search', model: 'haiku' as const },
  { pattern: /search\s+for/i, type: 'search', model: 'haiku' as const },
  { pattern: /list\s+(?:all\s+)?/i, type: 'search', model: 'haiku' as const },
  { pattern: /where\s+is/i, type: 'search', model: 'haiku' as const },
  { pattern: /show\s+me/i, type: 'search', model: 'haiku' as const },

  // Simple edits
  { pattern: /add\s+import/i, type: 'edit', model: 'haiku' as const },
  { pattern: /rename\s+/i, type: 'edit', model: 'haiku' as const },
  { pattern: /delete\s+(?:the\s+)?line/i, type: 'edit', model: 'haiku' as const },
  { pattern: /remove\s+/i, type: 'edit', model: 'haiku' as const },

  // Questions
  { pattern: /what\s+(?:is|are|does)/i, type: 'question', model: 'haiku' as const },
  { pattern: /how\s+(?:do|does|to)/i, type: 'question', model: 'sonnet' as const },
  { pattern: /explain\s+/i, type: 'question', model: 'sonnet' as const },
  { pattern: /why\s+/i, type: 'question', model: 'sonnet' as const },
];

export class QuickSkillManager {
  private static instance: QuickSkillManager;
  private config: QuickConfig = DEFAULT_CONFIG;

  private constructor() {}

  static getInstance(): QuickSkillManager {
    if (!QuickSkillManager.instance) {
      QuickSkillManager.instance = new QuickSkillManager();
    }
    return QuickSkillManager.instance;
  }

  configure(config: Partial<QuickConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Detect if task is suitable for quick mode
  isQuickTask(message: string): boolean {
    return QUICK_PATTERNS.some(p => p.pattern.test(message));
  }

  // Get recommended model for task
  getRecommendedModel(message: string): 'haiku' | 'sonnet' {
    for (const pattern of QUICK_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return pattern.model;
      }
    }
    return this.config.defaultModel;
  }

  // Get task type
  getTaskType(message: string): string {
    for (const pattern of QUICK_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return pattern.type;
      }
    }
    return 'general';
  }

  // Generate quick mode instructions
  getQuickInstructions(message: string): string {
    const model = this.getRecommendedModel(message);
    const taskType = this.getTaskType(message);

    return `
## Quick Mode Active

**Model:** ${model} (optimized for speed)
**Task Type:** ${taskType}
**Assessment:** Skipped
**TODO Tracking:** Disabled

### Instructions
- Execute task directly without planning phase
- Use single tool call when possible
- Skip unnecessary context gathering
- Report result immediately

### Task
${message}

### Execution Guidelines
${this.getTaskTypeGuidelines(taskType)}
`.trim();
  }

  // Get task-specific guidelines
  private getTaskTypeGuidelines(taskType: string): string {
    switch (taskType) {
      case 'search':
        return `
- Use Glob for file patterns
- Use Grep for content search
- Return results in concise list format
- Limit to most relevant matches`;

      case 'edit':
        return `
- Read the file first
- Make minimal changes
- Use Edit tool with precise old_string/new_string
- No additional refactoring`;

      case 'question':
        return `
- Provide direct, concise answer
- Include relevant code snippets if helpful
- No unnecessary elaboration`;

      default:
        return `
- Execute task efficiently
- Minimize tool calls
- Provide concise output`;
    }
  }
}

// Export singleton
export const quickSkill = QuickSkillManager.getInstance();

// Skill definition
export const quickSkillDefinition = {
  name: 'quick',
  aliases: ['q', 'fast'],
  description: 'Fast execution mode for simple tasks (uses Haiku)',
  triggers: ['quick', '/quick', '/q', 'quickly'],

  async execute(context: { message: string; args?: string }) {
    const task = context.args || context.message.replace(/^\/(?:quick|q)\s*/, '').trim();

    if (!task) {
      return {
        response: 'Please provide a task: /quick <task>',
      };
    }

    return {
      response: quickSkill.getQuickInstructions(task),
      metadata: {
        mode: 'quick',
        model: quickSkill.getRecommendedModel(task),
        taskType: quickSkill.getTaskType(task),
      },
    };
  },
};

// Types are already exported at their declaration points
