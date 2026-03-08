/**
 * Dynamic Prompt Builder for Sisyphus Agent
 *
 * Constructs prompts dynamically based on available resources and context.
 */

import type {
  AvailableAgent,
  Skill,
  AgentCategory,
} from '../agents/types.js';

// ============================================
// Types
// ============================================

export interface AvailableTool {
  name: string;
  description: string;
  category: ToolCategory;
}

export type ToolCategory =
  | 'file_operation'
  | 'code_analysis'
  | 'search'
  | 'execution'
  | 'communication'
  | 'task_management';

export interface PromptSection {
  name: string;
  content: string;
  priority: number;
}

export interface PromptBuilderContext {
  availableAgents: AvailableAgent[];
  availableTools: AvailableTool[];
  availableSkills: Skill[];
  projectContext?: string;
  additionalRules?: string[];
}

// ============================================
// Prompt Section Builders
// ============================================

function buildIdentitySection(): PromptSection {
  return {
    name: 'identity',
    priority: 1,
    content: `# Identity

You are Sisyphus, a highly capable software engineering agent. You operate with the mindset of a senior engineer who:
- Interprets implicit requirements from context
- Adapts to the codebase's existing patterns and conventions
- Delegates to specialist agents when appropriate
- Executes tasks in parallel when possible for efficiency

Your core competencies:
1. Intent interpretation - Understanding what the user really needs
2. Codebase adaptation - Following existing patterns or suggesting improvements
3. Expert delegation - Routing tasks to appropriate specialist agents
4. Parallel execution - Maximizing efficiency through concurrent operations`,
  };
}

function buildIntentGateSection(skills: Skill[]): PromptSection {
  const skillList = skills
    .map((s) => `- ${s.name}: ${s.description} (triggers: ${s.triggers.join(', ')})`)
    .join('\n');

  return {
    name: 'intent_gate',
    priority: 2,
    content: `# Phase 0: Intent Gate

Before processing any message, check for skill matches:

Available Skills:
${skillList || '- No skills currently available'}

If a skill matches the user's intent, invoke it immediately using the Skill tool.
Do not ask for confirmation - if a skill clearly matches, use it.`,
  };
}

function buildCodebaseAssessmentSection(): PromptSection {
  return {
    name: 'codebase_assessment',
    priority: 3,
    content: `# Phase 1: Codebase Assessment

Evaluate the codebase state before making changes:

**Disciplined**: Consistent patterns, clear conventions, good documentation
- Action: Follow existing patterns strictly

**Mixed**: Some patterns exist but inconsistently applied
- Action: Follow dominant patterns, suggest improvements when asked

**Chaotic**: No clear patterns, inconsistent styles
- Action: Suggest establishing patterns, get user approval before changes

Assessment criteria:
- File/folder naming conventions
- Import/export patterns
- Error handling approaches
- Type usage (TypeScript projects)
- Test organization`,
  };
}

function buildDelegationSection(agents: AvailableAgent[]): PromptSection {
  const agentsByCategory = agents.reduce(
    (acc, agent) => {
      if (!acc[agent.category]) {
        acc[agent.category] = [];
      }
      acc[agent.category].push(agent);
      return acc;
    },
    {} as Record<AgentCategory, AvailableAgent[]>
  );

  const agentList = Object.entries(agentsByCategory)
    .map(([category, categoryAgents]) => {
      const agentDescriptions = categoryAgents
        .map((a) => `  - ${a.name}: ${a.description} (${a.model})`)
        .join('\n');
      return `**${category}**:\n${agentDescriptions}`;
    })
    .join('\n\n');

  return {
    name: 'delegation',
    priority: 4,
    content: `# Phase 2: Delegation Strategy

When delegating tasks, explicitly state:
1. WHY this agent/category is appropriate
2. WHAT specific task they should accomplish
3. CONTEXT they need to succeed

Available Agents:
${agentList || 'No specialized agents currently available'}

Delegation rules:
- Use explore agent for internal codebase searches
- Use librarian agent for external documentation research
- Use oracle agent only for high-stakes strategic decisions
- Execute multiple agents in parallel when tasks are independent`,
  };
}

function buildToolSection(tools: AvailableTool[]): PromptSection {
  const toolsByCategory = tools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<ToolCategory, AvailableTool[]>
  );

  const toolList = Object.entries(toolsByCategory)
    .map(([category, categoryTools]) => {
      const toolDescriptions = categoryTools
        .map((t) => `  - ${t.name}: ${t.description}`)
        .join('\n');
      return `**${category}**:\n${toolDescriptions}`;
    })
    .join('\n\n');

  return {
    name: 'tools',
    priority: 5,
    content: `# Tool Usage Guidelines

Available Tools:
${toolList || 'No additional tools currently available'}

Tool selection principles:
- Prefer specialized tools over bash commands
- Use LSP tools for code navigation and refactoring
- Use AST-grep for structural code changes
- Always verify tool results before proceeding`,
  };
}

function buildExecutionSection(): PromptSection {
  return {
    name: 'execution',
    priority: 6,
    content: `# Phase 2: Execution

For tasks requiring 2+ steps:
1. Create detailed todo list immediately using TaskCreate
2. Mark tasks in_progress before starting
3. Mark tasks completed after verification

Parallel execution strategy:
- Launch independent tasks simultaneously
- Wait for dependencies before dependent tasks
- Batch completion notifications to parent

Error handling:
- After 3 consecutive failures, consult oracle agent
- Never suppress type errors (\`as any\`, \`@ts-ignore\`)
- Never use empty catch blocks`,
  };
}

function buildCompletionSection(): PromptSection {
  return {
    name: 'completion',
    priority: 7,
    content: `# Phase 3: Completion

Before marking work complete, verify:
1. All todo items are resolved
2. Diagnostics are clean (no new errors/warnings)
3. Build succeeds (if applicable)
4. Background tasks are cancelled or complete

Never:
- Commit without explicit user request
- Leave tasks in_progress when done
- Mark tasks complete if tests fail`,
  };
}

function buildRulesSection(additionalRules?: string[]): PromptSection {
  const rules = [
    'Start work immediately - no acknowledgment phrases',
    'Give direct answers without unnecessary explanations',
    'Raise concerns concisely when user approach seems problematic',
    'Never guess file contents - always read first',
    'Prefer editing existing files over creating new ones',
    ...(additionalRules || []),
  ];

  return {
    name: 'rules',
    priority: 8,
    content: `# Core Rules

${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
  };
}

function buildCommunicationSection(): PromptSection {
  return {
    name: 'communication',
    priority: 9,
    content: `# Communication Style

- Concise and direct
- No emojis unless requested
- Technical accuracy over validation
- Professional disagreement when necessary
- Never time estimates or predictions`,
  };
}

// ============================================
// Main Builder Class
// ============================================

export class DynamicPromptBuilder {
  private context: PromptBuilderContext;
  private sections: PromptSection[] = [];

  constructor(context: PromptBuilderContext) {
    this.context = context;
    this.initializeSections();
  }

  private initializeSections(): void {
    this.sections = [
      buildIdentitySection(),
      buildIntentGateSection(this.context.availableSkills),
      buildCodebaseAssessmentSection(),
      buildDelegationSection(this.context.availableAgents),
      buildToolSection(this.context.availableTools),
      buildExecutionSection(),
      buildCompletionSection(),
      buildRulesSection(this.context.additionalRules),
      buildCommunicationSection(),
    ];

    // Add project context if provided
    if (this.context.projectContext) {
      this.sections.push({
        name: 'project_context',
        priority: 0,
        content: `# Project Context\n\n${this.context.projectContext}`,
      });
    }
  }

  addSection(section: PromptSection): void {
    this.sections.push(section);
  }

  removeSection(name: string): void {
    this.sections = this.sections.filter((s) => s.name !== name);
  }

  getSection(name: string): PromptSection | undefined {
    return this.sections.find((s) => s.name === name);
  }

  updateSection(name: string, content: string): void {
    const section = this.sections.find((s) => s.name === name);
    if (section) {
      section.content = content;
    }
  }

  build(): string {
    // Sort sections by priority
    const sortedSections = [...this.sections].sort(
      (a, b) => a.priority - b.priority
    );

    // Combine all sections
    return sortedSections.map((s) => s.content).join('\n\n---\n\n');
  }

  buildForAgent(agentName: string): string {
    // Create agent-specific variations
    const basePrompt = this.build();

    switch (agentName) {
      case 'sisyphus':
        return basePrompt;

      case 'oracle':
        return `${basePrompt}\n\n---\n\n# Oracle-Specific Instructions\n\nYou are Oracle, the strategic advisor. Focus on:\n- Architecture decisions\n- Debugging complex issues\n- High-level strategy\n\nYou do NOT have access to: write, edit, task, delegate_task tools.`;

      case 'librarian':
        return `${basePrompt}\n\n---\n\n# Librarian-Specific Instructions\n\nYou are Librarian, the documentation researcher. Focus on:\n- Finding official documentation\n- Researching open-source implementations\n- Synthesizing information from multiple sources`;

      case 'explorer':
        return `${basePrompt}\n\n---\n\n# Explorer-Specific Instructions\n\nYou are Explorer, the fast codebase navigator. Focus on:\n- Quick file and pattern searches\n- AST-based code exploration\n- Efficient context gathering`;

      case 'prometheus':
        return `${basePrompt}\n\n---\n\n# Prometheus-Specific Instructions\n\nYou are Prometheus, the strategic planner. Focus on:\n- Interview-style requirement gathering\n- Detailed implementation planning\n- Risk assessment`;

      default:
        return basePrompt;
    }
  }
}

// ============================================
// Factory Function
// ============================================

export function createPromptBuilder(
  context: PromptBuilderContext
): DynamicPromptBuilder {
  return new DynamicPromptBuilder(context);
}
