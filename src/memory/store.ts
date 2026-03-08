/**
 * Persistent Memory Store
 *
 * Stores long-lived decision/execution memory using SQLite (preferred)
 * with automatic file fallback.
 */

import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import type {
  AppendMemoryInput,
  MemoryBackend,
  MemoryRecord,
  MemorySearchQuery,
  MemoryStoreConfig,
  MemoryStoreStatus,
} from './types.js';

interface SqliteStatement {
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => unknown;
}

interface SqliteDatabase {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close?: () => void;
}

interface SqliteModule {
  DatabaseSync: new (path: string) => SqliteDatabase;
}

const DEFAULT_MEMORY_CONFIG: MemoryStoreConfig = {
  enabled: true,
  backend: 'auto',
  maxRecords: 10000,
  maxSearchResults: 20,
  tokenBudget: 8000,
};

function nowMs(): number {
  return Date.now();
}

function createMemoryId(prefix: string, content: string): string {
  const seed = `${prefix}-${content}-${Date.now()}-${Math.random()}`;
  return createHash('sha1').update(seed).digest('hex').slice(0, 16);
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags || tags.length === 0) return [];

  const unique = new Set<string>();
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed.length > 0) {
      unique.add(trimmed);
    }
  }

  return Array.from(unique);
}

function clampConfidence(confidence?: number): number | null {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return null;
  }

  if (confidence < 0) return 0;
  if (confidence > 1) return 1;
  return confidence;
}

function normalizeRecord(row: Record<string, unknown>): MemoryRecord {
  return {
    id: String(row.id ?? ''),
    kind: String(row.kind ?? 'note'),
    scope: String(row.scope ?? 'global'),
    content: String(row.content ?? ''),
    tags: safeJsonParse<string[]>(typeof row.tags === 'string' ? row.tags : '', []),
    confidence:
      typeof row.confidence === 'number' ? row.confidence : row.confidence == null ? null : Number(row.confidence),
    sourceRef: row.source_ref == null ? null : String(row.source_ref),
    sessionId: row.session_id == null ? null : String(row.session_id),
    metadata:
      row.metadata == null
        ? null
        : safeJsonParse<Record<string, unknown>>(typeof row.metadata === 'string' ? row.metadata : '', null),
    createdAt: Number(row.created_at ?? 0),
    updatedAt: Number(row.updated_at ?? 0),
  };
}

async function loadSqliteModule(): Promise<SqliteModule | null> {
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (
      specifier: string
    ) => Promise<unknown>;

    const mod = (await dynamicImport('node:sqlite')) as Partial<SqliteModule>;
    if (!mod || typeof mod.DatabaseSync !== 'function') {
      return null;
    }

    return mod as SqliteModule;
  } catch {
    return null;
  }
}

export class MemoryStore {
  private readonly projectRoot: string;
  private readonly config: MemoryStoreConfig;
  private readonly rootDir: string;
  private readonly dbPath: string;
  private readonly fileStorePath: string;

  private backend: MemoryBackend = 'file';
  private db: SqliteDatabase | null = null;

  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(projectRoot: string, config: Partial<MemoryStoreConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      ...DEFAULT_MEMORY_CONFIG,
      ...config,
    };

    this.rootDir = join(projectRoot, '.omnibus', 'memory');
    this.dbPath = join(this.rootDir, 'memory.sqlite');
    this.fileStorePath = join(this.rootDir, 'memories.jsonl');
  }

  async append(input: AppendMemoryInput): Promise<MemoryRecord | null> {
    if (!this.config.enabled) {
      return null;
    }

    await this.ensureInitialized();

    const timestamp = nowMs();

    const record: MemoryRecord = {
      id: createMemoryId(input.kind || 'note', input.content),
      kind: input.kind || 'note',
      scope: input.scope || 'global',
      content: input.content,
      tags: normalizeTags(input.tags),
      confidence: clampConfidence(input.confidence),
      sourceRef: input.sourceRef || null,
      sessionId: input.sessionId || null,
      metadata: input.metadata || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (this.backend === 'sqlite' && this.db) {
      const statement = this.db.prepare(
        `INSERT INTO memories (
          id, kind, scope, content, tags, confidence, source_ref,
          session_id, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      statement.run(
        record.id,
        record.kind,
        record.scope,
        record.content,
        JSON.stringify(record.tags),
        record.confidence,
        record.sourceRef,
        record.sessionId,
        record.metadata ? JSON.stringify(record.metadata) : null,
        record.createdAt,
        record.updatedAt
      );

      await this.cleanupOverflowIfNeeded();
      return record;
    }

    await this.appendToFile(record);
    await this.cleanupOverflowIfNeeded();
    return record;
  }

  async search(query: MemorySearchQuery = {}): Promise<MemoryRecord[]> {
    await this.ensureInitialized();

    const limit = Math.min(
      Math.max(1, query.limit ?? this.config.maxSearchResults),
      this.config.maxSearchResults
    );

    if (this.backend === 'sqlite' && this.db) {
      return this.searchSqlite(query, limit);
    }

    return this.searchFile(query, limit);
  }

  async compact(summary: string, options: {
    scope?: string;
    tags?: string[];
    sessionId?: string;
    sourceRef?: string;
    metadata?: Record<string, unknown>;
  } = {}): Promise<MemoryRecord | null> {
    return this.append({
      kind: 'context_snapshot',
      content: summary,
      scope: options.scope || 'session',
      tags: options.tags || ['compaction', 'snapshot'],
      sourceRef: options.sourceRef,
      sessionId: options.sessionId,
      confidence: 1,
      metadata: options.metadata,
    });
  }

  async listRecent(limit = 10): Promise<MemoryRecord[]> {
    return this.search({
      limit,
    });
  }

  async getStatus(): Promise<MemoryStoreStatus> {
    await this.ensureInitialized();

    const totalRecords = await this.getTotalRecordCount();

    return {
      ready: this.isInitialized,
      backend: this.backend,
      rootDir: this.rootDir,
      dbPath: this.dbPath,
      totalRecords,
    };
  }

  close(): void {
    if (this.db?.close) {
      this.db.close();
    }
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
  }

  private async initialize(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });

    const desiredBackend = this.config.backend;

    if (desiredBackend === 'sqlite' || desiredBackend === 'auto') {
      const sqliteReady = await this.initializeSqlite();
      if (sqliteReady) {
        this.backend = 'sqlite';
        this.isInitialized = true;
        return;
      }

      if (desiredBackend === 'sqlite') {
        throw new Error('SQLite backend requested but unavailable in this runtime.');
      }
    }

    await this.initializeFileStore();
    this.backend = 'file';
    this.isInitialized = true;
  }

  private async initializeSqlite(): Promise<boolean> {
    const sqlite = await loadSqliteModule();
    if (!sqlite) {
      return false;
    }

    try {
      this.db = new sqlite.DatabaseSync(this.dbPath);
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          scope TEXT NOT NULL,
          content TEXT NOT NULL,
          tags TEXT NOT NULL,
          confidence REAL,
          source_ref TEXT,
          session_id TEXT,
          metadata TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_memories_created_at
          ON memories(created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_memories_kind_scope
          ON memories(kind, scope);
      `);
      return true;
    } catch {
      this.db = null;
      return false;
    }
  }

  private async initializeFileStore(): Promise<void> {
    if (!existsSync(this.fileStorePath)) {
      await fs.writeFile(this.fileStorePath, '', 'utf-8');
    }
  }

  private async appendToFile(record: MemoryRecord): Promise<void> {
    const line = `${JSON.stringify(record)}\n`;
    await fs.appendFile(this.fileStorePath, line, 'utf-8');
  }

  private async searchSqlite(query: MemorySearchQuery, limit: number): Promise<MemoryRecord[]> {
    if (!this.db) {
      return [];
    }

    const clauses: string[] = [];
    const params: unknown[] = [];

    const rawQuery = query.query?.trim();
    if (rawQuery) {
      const like = `%${rawQuery}%`;
      clauses.push('(content LIKE ? OR tags LIKE ? OR source_ref LIKE ?)');
      params.push(like, like, like);
    }

    if (query.kinds && query.kinds.length > 0) {
      clauses.push(`kind IN (${query.kinds.map(() => '?').join(', ')})`);
      params.push(...query.kinds);
    }

    if (query.scopes && query.scopes.length > 0) {
      clauses.push(`scope IN (${query.scopes.map(() => '?').join(', ')})`);
      params.push(...query.scopes);
    }

    if (typeof query.minConfidence === 'number') {
      clauses.push('confidence >= ?');
      params.push(query.minConfidence);
    }

    if (typeof query.fromTimestamp === 'number') {
      clauses.push('created_at >= ?');
      params.push(query.fromTimestamp);
    }

    if (typeof query.toTimestamp === 'number') {
      clauses.push('created_at <= ?');
      params.push(query.toTimestamp);
    }

    let sql = `
      SELECT id, kind, scope, content, tags, confidence, source_ref, session_id,
             metadata, created_at, updated_at
      FROM memories
    `;

    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => normalizeRecord(row));
  }

  private async searchFile(query: MemorySearchQuery, limit: number): Promise<MemoryRecord[]> {
    const records = await this.loadAllFromFile();

    const filtered = records.filter((record) => {
      if (query.query) {
        const normalized = query.query.toLowerCase();
        const inContent = record.content.toLowerCase().includes(normalized);
        const inTags = record.tags.some((tag) => tag.toLowerCase().includes(normalized));
        const inSource = (record.sourceRef || '').toLowerCase().includes(normalized);

        if (!inContent && !inTags && !inSource) {
          return false;
        }
      }

      if (query.kinds && query.kinds.length > 0 && !query.kinds.includes(record.kind)) {
        return false;
      }

      if (query.scopes && query.scopes.length > 0 && !query.scopes.includes(record.scope)) {
        return false;
      }

      if (typeof query.minConfidence === 'number') {
        if (record.confidence == null || record.confidence < query.minConfidence) {
          return false;
        }
      }

      if (typeof query.fromTimestamp === 'number' && record.createdAt < query.fromTimestamp) {
        return false;
      }

      if (typeof query.toTimestamp === 'number' && record.createdAt > query.toTimestamp) {
        return false;
      }

      return true;
    });

    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  private async loadAllFromFile(): Promise<MemoryRecord[]> {
    if (!existsSync(this.fileStorePath)) {
      return [];
    }

    const content = await fs.readFile(this.fileStorePath, 'utf-8');
    if (!content.trim()) {
      return [];
    }

    const records: MemoryRecord[] = [];
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as MemoryRecord;
        records.push(parsed);
      } catch {
        // Ignore malformed lines and keep store readable.
      }
    }

    return records;
  }

  private async getTotalRecordCount(): Promise<number> {
    if (this.backend === 'sqlite' && this.db) {
      const row = this.db.prepare('SELECT COUNT(*) AS count FROM memories').get() as {
        count: number;
      };
      return Number(row.count || 0);
    }

    const records = await this.loadAllFromFile();
    return records.length;
  }

  private async cleanupOverflowIfNeeded(): Promise<void> {
    if (!this.config.maxRecords || this.config.maxRecords <= 0) {
      return;
    }

    if (this.backend === 'sqlite' && this.db) {
      const count = await this.getTotalRecordCount();
      if (count <= this.config.maxRecords) {
        return;
      }

      this.db
        .prepare(
          `DELETE FROM memories
           WHERE id IN (
             SELECT id FROM memories
             ORDER BY created_at DESC
             LIMIT -1 OFFSET ?
           )`
        )
        .run(this.config.maxRecords);
      return;
    }

    const records = await this.loadAllFromFile();
    if (records.length <= this.config.maxRecords) {
      return;
    }

    const trimmed = records
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, this.config.maxRecords);

    const serialized = trimmed
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((record) => JSON.stringify(record))
      .join('\n');

    await fs.writeFile(
      this.fileStorePath,
      serialized.length > 0 ? `${serialized}\n` : '',
      'utf-8'
    );
  }
}
