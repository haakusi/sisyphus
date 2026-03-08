/**
 * Agents Module Exports
 */

export * from './types.js';
export * from './sisyphus.js';

// Default available agents configuration
import type { AvailableAgent } from './types.js';

export const defaultAvailableAgents: AvailableAgent[] = [
  {
    name: 'sisyphus',
    description: 'Main orchestrator for complex tasks',
    category: 'orchestrator',
    model: 'claude-opus-4-20250514',
    specialization: ['orchestration', 'task-management', 'delegation'],
  },
  {
    name: 'oracle',
    description: 'Strategic advisor for architecture and debugging',
    category: 'advisor',
    model: 'gpt-4o',
    specialization: ['architecture', 'debugging', 'strategy'],
  },
  {
    name: 'librarian',
    description: 'Documentation and external research specialist',
    category: 'researcher',
    model: 'claude-sonnet-4-20250514',
    specialization: ['documentation', 'research', 'external-sources'],
  },
  {
    name: 'explorer',
    description: 'Fast codebase navigation and search',
    category: 'explorer',
    model: 'claude-haiku-4-20250514',
    specialization: ['code-search', 'navigation', 'context-gathering'],
  },
  {
    name: 'prometheus',
    description: 'Strategic planner for requirement gathering',
    category: 'planner',
    model: 'claude-opus-4-20250514',
    specialization: ['planning', 'requirements', 'risk-assessment'],
  },
];
