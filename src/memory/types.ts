/**
 * Memory Types
 *
 * Shared type definitions for persistent memory operations.
 */

export type MemoryKind =
  | 'decision'
  | 'execution'
  | 'pattern'
  | 'failure'
  | 'context_snapshot'
  | 'note';

export type MemoryBackend = 'sqlite' | 'file';

export interface MemoryRecord {
  id: string;
  kind: MemoryKind | string;
  scope: string;
  content: string;
  tags: string[];
  confidence: number | null;
  sourceRef: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

export interface AppendMemoryInput {
  kind: MemoryKind | string;
  content: string;
  scope?: string;
  tags?: string[];
  confidence?: number;
  sourceRef?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchQuery {
  query?: string;
  limit?: number;
  kinds?: Array<MemoryKind | string>;
  scopes?: string[];
  minConfidence?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export interface MemoryStoreConfig {
  enabled: boolean;
  backend: 'auto' | MemoryBackend;
  maxRecords: number;
  maxSearchResults: number;
  tokenBudget: number;
}

export interface MemoryStoreStatus {
  ready: boolean;
  backend: MemoryBackend;
  rootDir: string;
  dbPath: string;
  totalRecords: number;
}
