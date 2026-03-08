/**
 * Persistent Memory Store
 *
 * Stores long-lived decision/execution memory using SQLite (preferred)
 * with automatic file fallback.
 */
import type { AppendMemoryInput, MemoryRecord, MemorySearchQuery, MemoryStoreConfig, MemoryStoreStatus } from './types.js';
export declare class MemoryStore {
    private readonly projectRoot;
    private readonly config;
    private readonly rootDir;
    private readonly dbPath;
    private readonly fileStorePath;
    private backend;
    private db;
    private isInitialized;
    private initPromise;
    constructor(projectRoot: string, config?: Partial<MemoryStoreConfig>);
    append(input: AppendMemoryInput): Promise<MemoryRecord | null>;
    search(query?: MemorySearchQuery): Promise<MemoryRecord[]>;
    compact(summary: string, options?: {
        scope?: string;
        tags?: string[];
        sessionId?: string;
        sourceRef?: string;
        metadata?: Record<string, unknown>;
    }): Promise<MemoryRecord | null>;
    listRecent(limit?: number): Promise<MemoryRecord[]>;
    getStatus(): Promise<MemoryStoreStatus>;
    close(): void;
    private ensureInitialized;
    private initialize;
    private initializeSqlite;
    private initializeFileStore;
    private appendToFile;
    private searchSqlite;
    private searchFile;
    private loadAllFromFile;
    private getTotalRecordCount;
    private cleanupOverflowIfNeeded;
}
//# sourceMappingURL=store.d.ts.map