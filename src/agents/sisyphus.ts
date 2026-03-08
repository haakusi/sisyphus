/**
 * Sisyphus - Main Orchestrator Agent
 *
 * The primary agent responsible for orchestrating complex software engineering tasks.
 */

import type {
  Agent,
  AgentConfig,
  AgentResult,
  Task,
  Todo,
  Intent,
  IntentType,
  Skill,
  CodebaseState,
  CodebaseAssessment,
  DelegationRequest,
  ParallelExecutionPlan,
  AvailableAgent,
} from './types.js';
import { getConfig } from '../config/index.js';
import { SISYPHUS_SYSTEM_PROMPT } from '../prompts/sisyphus-system.js';
import { createPromptBuilder, type AvailableTool } from '../prompts/dynamic-builder.js';

// ============================================
// Intent Detection
// ============================================

const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  code_modification: [
    /\b(add|create|implement|write|build)\b/i,
    /\b(fix|update|modify|change|edit)\b/i,
  ],
  code_exploration: [
    /\b(find|search|look for|where is|locate)\b/i,
    /\b(show|display|list|get)\b/i,
  ],
  documentation: [
    /\b(document|explain|describe|what is|how does)\b/i,
    /\bREADME\b/i,
  ],
  debugging: [
    /\b(debug|troubleshoot|investigate|why|error|bug|issue)\b/i,
    /\b(not working|broken|failing)\b/i,
  ],
  refactoring: [
    /\b(refactor|restructure|reorganize|clean up|optimize)\b/i,
    /\b(extract|move|rename|split)\b/i,
  ],
  testing: [
    /\b(test|spec|coverage|assert)\b/i,
    /\b(unit test|integration test|e2e)\b/i,
  ],
  planning: [
    /\b(plan|design|architect|strategy)\b/i,
    /\b(how should|what approach)\b/i,
  ],
  general: [],
};

function detectIntentType(message: string): IntentType {
  for (const [type, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (type === 'general') continue;
    if (patterns.some((p) => p.test(message))) {
      return type as IntentType;
    }
  }
  return 'general';
}

function extractEntities(message: string): Intent['entities'] {
  const entities: Intent['entities'] = [];

  // Extract file paths
  const filePathRegex = /(?:^|[\s'"(])([./]?[\w-]+(?:\/[\w.-]+)+(?:\.\w+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = filePathRegex.exec(message)) !== null) {
    const value = match[1];
    if (value) {
      entities.push({
        type: 'file_path',
        value,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Extract function/class names (PascalCase or camelCase)
  const identifierRegex = /\b([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*(?:[A-Z][a-zA-Z0-9]*)+)\b/g;
  while ((match = identifierRegex.exec(message)) !== null) {
    const value = match[1];
    if (value && !entities.some((e) => e.start <= match!.index && e.end >= match!.index + match![0].length)) {
      entities.push({
        type: 'identifier',
        value,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return entities;
}

export function detectIntent(message: string): Intent {
  const type = detectIntentType(message);
  const entities = extractEntities(message);

  // Determine action from message
  const actionMatch = message.match(/^(\w+)/);
  const action = actionMatch ? actionMatch[1].toLowerCase() : 'process';

  return {
    type,
    action,
    entities,
    confidence: entities.length > 0 ? 0.8 : 0.5,
    rawMessage: message,
  };
}

// ============================================
// Skill Matching
// ============================================

export function matchSkill(
  message: string,
  availableSkills: Skill[]
): Skill | null {
  const lowerMessage = message.toLowerCase();

  for (const skill of availableSkills) {
    // Check skill name and aliases
    if (
      lowerMessage.includes(skill.name.toLowerCase()) ||
      skill.aliases.some((a) => lowerMessage.includes(a.toLowerCase()))
    ) {
      return skill;
    }

    // Check triggers
    if (skill.triggers.some((t) => lowerMessage.includes(t.toLowerCase()))) {
      return skill;
    }
  }

  return null;
}

// ============================================
// Codebase Assessment
// ============================================

export async function assessCodebase(
  projectRoot: string
): Promise<CodebaseAssessment> {
  // This would be implemented with actual file system analysis
  // For now, return a default assessment
  return {
    state: 'mixed',
    patterns: [],
    conventions: [],
    recommendation: 'follow_existing',
  };
}

// ============================================
// Todo List Creation
// ============================================

export function createTodoList(task: Task): Todo[] {
  // Generate todos based on task type and complexity
  const todos: Todo[] = [];
  let order = 0;

  // Always start with exploration
  todos.push({
    id: `${task.id}-explore`,
    taskId: task.id,
    subject: 'Explore relevant code and context',
    description: 'Gather necessary context before making changes',
    status: 'pending',
    order: order++,
    blockedBy: [],
    blocks: [],
  });

  // Add implementation todo
  todos.push({
    id: `${task.id}-implement`,
    taskId: task.id,
    subject: 'Implement the required changes',
    description: task.description,
    status: 'pending',
    order: order++,
    blockedBy: [`${task.id}-explore`],
    blocks: [],
  });

  // Add verification todo
  todos.push({
    id: `${task.id}-verify`,
    taskId: task.id,
    subject: 'Verify changes and run tests',
    description: 'Ensure implementation is correct and tests pass',
    status: 'pending',
    order: order++,
    blockedBy: [`${task.id}-implement`],
    blocks: [],
  });

  return todos;
}

// ============================================
// Delegation
// ============================================

export function determineDelegation(
  task: Task,
  intent: Intent,
  availableAgents: AvailableAgent[]
): DelegationRequest | null {
  // Determine if delegation is appropriate based on task type
  const agentMap: Record<IntentType, string> = {
    code_exploration: 'explorer',
    documentation: 'librarian',
    debugging: 'oracle',
    planning: 'prometheus',
    refactoring: 'explorer',
    code_modification: 'sisyphus', // Handle directly
    testing: 'sisyphus', // Handle directly
    general: 'sisyphus', // Handle directly
  };

  const targetAgentName = agentMap[intent.type];
  const targetAgent = availableAgents.find((a) => a.name === targetAgentName);

  if (!targetAgent || targetAgentName === 'sisyphus') {
    return null; // Handle directly
  }

  return {
    task,
    targetAgent: targetAgentName,
    category: targetAgent.category,
    reason: `Task type '${intent.type}' is best handled by ${targetAgentName} (${targetAgent.description})`,
    context: {
      additionalInstructions: `Original request: ${intent.rawMessage}`,
    },
  };
}

// ============================================
// Parallel Execution Planning
// ============================================

export function planParallelExecution(
  tasks: Task[],
  availableAgents: AvailableAgent[]
): ParallelExecutionPlan {
  // Group tasks by independence
  const independentTasks = tasks.filter((t) => !t.metadata?.dependsOn);
  const dependentTasks = tasks.filter((t) => t.metadata?.dependsOn);

  // Assign agents to independent tasks
  const agentAssignments = independentTasks.map((task) => {
    const intent = detectIntent(task.description);
    const delegation = determineDelegation(task, intent, availableAgents);
    return delegation?.targetAgent || 'sisyphus';
  });

  return {
    agents: [...new Set(agentAssignments)],
    tasks: independentTasks,
    dependencies: dependentTasks.map((t) => ({
      taskId: t.id,
      dependsOn: (t.metadata?.dependsOn as string[]) || [],
    })),
    timeout: getConfig().concurrency.stallTimeout,
  };
}

// ============================================
// Sisyphus Agent Factory
// ============================================

export interface SisyphusAgentOptions {
  availableAgents?: AvailableAgent[];
  availableTools?: AvailableTool[];
  availableSkills?: Skill[];
  projectContext?: string;
}

export function createSisyphusAgent(options: SisyphusAgentOptions = {}): {
  config: AgentConfig;
  processMessage: (message: string) => Promise<SisyphusResponse>;
  buildSystemPrompt: () => string;
} {
  const config = getConfig();
  const agentConfig = config.agents.sisyphus;

  const promptBuilder = createPromptBuilder({
    availableAgents: options.availableAgents || [],
    availableTools: options.availableTools || [],
    availableSkills: options.availableSkills || [],
    projectContext: options.projectContext,
  });

  const sisyphusConfig: AgentConfig = {
    name: 'Sisyphus',
    model: agentConfig.model,
    temperature: agentConfig.temperature,
    maxTokens: agentConfig.maxTokens,
    systemPrompt: promptBuilder.build(),
    allowedTools: ['*'], // Sisyphus has access to all tools
    deniedTools: [],
    thinkingBudget: agentConfig.thinkingBudget,
  };

  return {
    config: sisyphusConfig,

    async processMessage(message: string): Promise<SisyphusResponse> {
      // Phase 0: Intent Gate
      const matchedSkill = matchSkill(message, options.availableSkills || []);
      if (matchedSkill) {
        return {
          phase: 'intent_gate',
          action: 'invoke_skill',
          skill: matchedSkill.name,
          message: `Invoking skill: ${matchedSkill.name}`,
        };
      }

      // Detect intent
      const intent = detectIntent(message);

      // Phase 1: Codebase Assessment (would be done in actual execution)
      // const assessment = await assessCodebase(projectRoot);

      // Phase 2: Determine execution strategy
      const delegation = determineDelegation(
        {
          id: `task-${Date.now()}`,
          subject: message.slice(0, 50),
          description: message,
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        intent,
        options.availableAgents || []
      );

      if (delegation) {
        return {
          phase: 'execution',
          action: 'delegate',
          delegation,
          message: delegation.reason,
        };
      }

      // Handle directly
      return {
        phase: 'execution',
        action: 'direct',
        intent,
        message: 'Processing task directly',
      };
    },

    buildSystemPrompt(): string {
      return promptBuilder.build();
    },
  };
}

// ============================================
// Response Types
// ============================================

export interface SisyphusResponse {
  phase: 'intent_gate' | 'assessment' | 'execution' | 'completion';
  action: string;
  message: string;
  skill?: string;
  delegation?: DelegationRequest;
  intent?: Intent;
  todos?: Todo[];
}
