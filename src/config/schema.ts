/**
 * Configuration Schema for Claude Sisyphus Plugin
 *
 * Defines the structure and validation for plugin configuration.
 */

import { z } from 'zod';

// ============================================
// Agent Configuration Schema
// ============================================

const AgentConfigSchema = z.object({
  model: z.string().default('claude-sonnet-4-20250514'),
  temperature: z.number().min(0).max(2).default(0.1),
  maxTokens: z.number().positive().default(64000),
  thinkingBudget: z.number().positive().optional(),
});

const AgentsConfigSchema = z.object({
  sisyphus: AgentConfigSchema.extend({
    model: z.string().default('claude-opus-4-20250514'),
    thinkingBudget: z.number().default(32000),
  }),
  oracle: AgentConfigSchema.extend({
    model: z.string().default('gpt-4o'),
  }),
  librarian: AgentConfigSchema.extend({
    model: z.string().default('claude-sonnet-4-20250514'),
  }),
  explorer: AgentConfigSchema.extend({
    model: z.string().default('claude-haiku-4-20250514'),
  }),
  prometheus: AgentConfigSchema.extend({
    model: z.string().default('claude-opus-4-20250514'),
  }),
});

// ============================================
// Concurrency Configuration Schema
// ============================================

const ConcurrencyConfigSchema = z.object({
  maxParallel: z.number().positive().default(3),
  stallTimeout: z.number().positive().default(180000), // 3 minutes
  stabilityPolls: z.number().positive().default(3),
  stabilityInterval: z.number().positive().default(10000), // 10 seconds
  ttl: z.number().positive().default(1800000), // 30 minutes
});

// ============================================
// TODO Enforcer Configuration Schema
// ============================================

const TodoEnforcerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  countdownSeconds: z.number().positive().default(2),
  minExecutionTime: z.number().positive().default(10000), // 10 seconds
  excludeAgents: z.array(z.string()).default(['prometheus', 'compaction']),
});

// ============================================
// Hooks Configuration Schema
// ============================================

const HooksConfigSchema = z.object({
  sessionStart: z.boolean().default(true),
  chatMessageBefore: z.boolean().default(true),
  toolExecuteBefore: z.boolean().default(true),
  toolExecuteAfter: z.boolean().default(true),
  sessionIdle: z.boolean().default(true),
  contextCompact: z.boolean().default(true),
});

// ============================================
// External Model Credentials Schema
// ============================================

const CredentialSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(), // Unix timestamp
  apiKey: z.string().optional(), // Fallback for API key auth
});

const ExternalModelsConfigSchema = z.object({
  // Google (Gemini, Antigravity)
  google: z.object({
    enabled: z.boolean().default(false),
    credentials: CredentialSchema.optional(),
    defaultModel: z.string().default('gemini-1.5-pro'),
  }).default({}),

  // OpenAI (Codex, GPT)
  openai: z.object({
    enabled: z.boolean().default(false),
    credentials: CredentialSchema.optional(),
    defaultModel: z.string().default('gpt-4o'),
  }).default({}),

  // Azure OpenAI
  azure: z.object({
    enabled: z.boolean().default(false),
    credentials: CredentialSchema.optional(),
    endpoint: z.string().optional(),
    defaultModel: z.string().default('gpt-4o'),
  }).default({}),

  // Auto-delegation settings
  autoDelegation: z.object({
    enabled: z.boolean().default(true),
    frontendToGemini: z.boolean().default(true),
    strategyToGpt: z.boolean().default(true),
    codeToCodex: z.boolean().default(true),
  }).default({}),
});

// ============================================
// Skills Configuration Schema
// ============================================

const SkillsConfigSchema = z.object({
  ultrawork: z.object({
    enabled: z.boolean().default(true),
    aliases: z.array(z.string()).default(['ulw', 'ultra']),
    autoParallelAgents: z.boolean().default(true),
    autoTodoEnforcer: z.boolean().default(true),
    multiModelDelegation: z.boolean().default(true),
  }),
  deepResearch: z.object({
    enabled: z.boolean().default(true),
    maxSources: z.number().positive().default(10),
  }),
  codeReview: z.object({
    enabled: z.boolean().default(true),
    autoFix: z.boolean().default(false),
  }),
});

// ============================================
// Memory & Context Configuration Schema
// ============================================

const MemoryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  backend: z.enum(['auto', 'sqlite', 'file']).default('auto'),
  maxRecords: z.number().positive().default(10000),
  maxSearchResults: z.number().positive().default(20),
  tokenBudget: z.number().positive().default(8000),
});

const ContextPackConfigSchema = z.object({
  enabled: z.boolean().default(true),
  tokenBudget: z.number().positive().default(15000),
  maxLayerEntries: z.number().positive().default(12),
  memoryLookback: z.number().positive().default(10),
});

const ArtifactDriftConfigSchema = z.object({
  enabled: z.boolean().default(true),
  failOnMismatch: z.boolean().default(false),
  maxIssues: z.number().positive().default(200),
});

// ============================================
// Main Configuration Schema
// ============================================

export const SisyphusConfigSchema = z.object({
  // Version for config migrations
  version: z.string().default('1.0.0'),

  // Agent configurations
  agents: AgentsConfigSchema.optional(),

  // Concurrency settings
  concurrency: ConcurrencyConfigSchema.optional(),

  // TODO enforcer settings
  todoEnforcer: TodoEnforcerConfigSchema.optional(),

  // Hooks settings
  hooks: HooksConfigSchema.optional(),

  // Skills settings
  skills: SkillsConfigSchema.optional(),

  // External model integrations (Gemini, Codex, etc.)
  externalModels: ExternalModelsConfigSchema.optional(),

  // Persistent memory settings
  memory: MemoryConfigSchema.optional(),

  // Context-pack compiler settings
  contextPack: ContextPackConfigSchema.optional(),

  // Artifact drift-check settings
  artifactDrift: ArtifactDriftConfigSchema.optional(),

  // Disabled hooks (by name)
  disabledHooks: z.array(z.string()).default([]),

  // Disabled tools (by name)
  disabledTools: z.array(z.string()).default([]),

  // Debug mode
  debug: z.boolean().default(false),

  // Logging level
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// ============================================
// Type Exports
// ============================================

export type SisyphusConfig = z.infer<typeof SisyphusConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentsConfig = z.infer<typeof AgentsConfigSchema>;
export type ConcurrencyConfig = z.infer<typeof ConcurrencyConfigSchema>;
export type TodoEnforcerConfig = z.infer<typeof TodoEnforcerConfigSchema>;
export type HooksConfig = z.infer<typeof HooksConfigSchema>;
export type SkillsConfig = z.infer<typeof SkillsConfigSchema>;
export type ExternalModelsConfig = z.infer<typeof ExternalModelsConfigSchema>;
export type CredentialConfig = z.infer<typeof CredentialSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
export type ContextPackConfig = z.infer<typeof ContextPackConfigSchema>;
export type ArtifactDriftConfig = z.infer<typeof ArtifactDriftConfigSchema>;

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_CONFIG: SisyphusConfig = SisyphusConfigSchema.parse({
  agents: {},
  concurrency: {},
  todoEnforcer: {},
  hooks: {},
  skills: {},
  externalModels: {},
  memory: {},
  contextPack: {},
  artifactDrift: {},
});

// ============================================
// Validation Helper
// ============================================

export function validateConfig(config: unknown): SisyphusConfig {
  return SisyphusConfigSchema.parse(config);
}

export function mergeConfig(
  base: SisyphusConfig,
  override: Partial<SisyphusConfig>
): SisyphusConfig {
  return SisyphusConfigSchema.parse({
    ...base,
    ...override,
    agents: { ...base.agents, ...override.agents },
    concurrency: { ...base.concurrency, ...override.concurrency },
    todoEnforcer: { ...base.todoEnforcer, ...override.todoEnforcer },
    hooks: { ...base.hooks, ...override.hooks },
    skills: { ...base.skills, ...override.skills },
    externalModels: { ...base.externalModels, ...override.externalModels },
    memory: { ...base.memory, ...override.memory },
    contextPack: { ...base.contextPack, ...override.contextPack },
    artifactDrift: { ...base.artifactDrift, ...override.artifactDrift },
  });
}
