/**
 * Configuration Loader for Claude Sisyphus Plugin
 *
 * Handles loading and merging configuration from multiple sources.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  SisyphusConfig,
  SisyphusConfigSchema,
  DEFAULT_CONFIG,
  mergeConfig,
} from './schema.js';

// ============================================
// Configuration Paths
// ============================================

const CONFIG_FILENAME = 'sisyphus-config.json';

function getUserConfigPath(): string {
  return join(homedir(), '.config', 'claude-code', CONFIG_FILENAME);
}

function getProjectConfigPath(projectRoot: string): string {
  return join(projectRoot, '.claude', CONFIG_FILENAME);
}

// ============================================
// JSON Parsing with Comments Support
// ============================================

function parseJsonc(content: string): unknown {
  // Remove single-line comments
  let cleaned = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove trailing commas
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(cleaned);
}

function loadJsonFile(path: string): unknown | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return parseJsonc(content);
  } catch (error) {
    console.warn(`Failed to load config from ${path}:`, error);
    return null;
  }
}

// ============================================
// Configuration Loading
// ============================================

export interface LoadConfigOptions {
  projectRoot?: string;
  skipUserConfig?: boolean;
  skipProjectConfig?: boolean;
}

export function loadConfig(options: LoadConfigOptions = {}): SisyphusConfig {
  let config = DEFAULT_CONFIG;

  // Load user-level configuration
  if (!options.skipUserConfig) {
    const userConfigPath = getUserConfigPath();
    const userConfig = loadJsonFile(userConfigPath);
    if (userConfig) {
      try {
        const validated = SisyphusConfigSchema.partial().parse(userConfig);
        config = mergeConfig(config, validated);
      } catch (error) {
        console.warn('Invalid user config:', error);
      }
    }
  }

  // Load project-level configuration
  if (!options.skipProjectConfig && options.projectRoot) {
    const projectConfigPath = getProjectConfigPath(options.projectRoot);
    const projectConfig = loadJsonFile(projectConfigPath);
    if (projectConfig) {
      try {
        const validated = SisyphusConfigSchema.partial().parse(projectConfig);
        config = mergeConfig(config, validated);
      } catch (error) {
        console.warn('Invalid project config:', error);
      }
    }
  }

  return config;
}

// ============================================
// Configuration State Management
// ============================================

let currentConfig: SisyphusConfig | null = null;

export function initializeConfig(options: LoadConfigOptions = {}): SisyphusConfig {
  currentConfig = loadConfig(options);
  return currentConfig;
}

export function getConfig(): SisyphusConfig {
  if (!currentConfig) {
    currentConfig = loadConfig();
  }
  return currentConfig;
}

export function updateConfig(update: Partial<SisyphusConfig>): SisyphusConfig {
  const current = getConfig();
  currentConfig = mergeConfig(current, update);
  return currentConfig;
}

export function resetConfig(): void {
  currentConfig = null;
}

// ============================================
// Helper Functions
// ============================================

export function isHookEnabled(hookName: string): boolean {
  const config = getConfig();
  return !config.disabledHooks.includes(hookName);
}

export function isToolEnabled(toolName: string): boolean {
  const config = getConfig();
  return !config.disabledTools.includes(toolName);
}

export function getAgentConfig(agentName: keyof NonNullable<SisyphusConfig['agents']>) {
  const config = getConfig();
  const agents = config.agents || DEFAULT_CONFIG.agents;
  return agents[agentName];
}
