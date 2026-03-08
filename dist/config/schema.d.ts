/**
 * Configuration Schema for Claude Sisyphus Plugin
 *
 * Defines the structure and validation for plugin configuration.
 */
import { z } from 'zod';
declare const AgentConfigSchema: any;
declare const AgentsConfigSchema: any;
declare const ConcurrencyConfigSchema: any;
declare const TodoEnforcerConfigSchema: any;
declare const HooksConfigSchema: any;
declare const CredentialSchema: any;
declare const ExternalModelsConfigSchema: any;
declare const SkillsConfigSchema: any;
declare const MemoryConfigSchema: any;
declare const ContextPackConfigSchema: any;
declare const ArtifactDriftConfigSchema: any;
export declare const SisyphusConfigSchema: any;
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
export declare const DEFAULT_CONFIG: SisyphusConfig;
export declare function validateConfig(config: unknown): SisyphusConfig;
export declare function mergeConfig(base: SisyphusConfig, override: Partial<SisyphusConfig>): SisyphusConfig;
export {};
//# sourceMappingURL=schema.d.ts.map