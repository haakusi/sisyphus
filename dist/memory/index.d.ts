/**
 * Memory Module
 *
 * Entry point for persistent memory storage.
 */
import { MemoryStore } from './store.js';
import type { MemoryStoreConfig } from './types.js';
export declare function getMemoryStore(projectRoot: string, config?: Partial<MemoryStoreConfig>): MemoryStore;
export declare function resetMemoryStore(projectRoot?: string): void;
export { MemoryStore } from './store.js';
export type { MemoryKind, MemoryBackend, MemoryRecord, AppendMemoryInput, MemorySearchQuery, MemoryStoreConfig, MemoryStoreStatus, } from './types.js';
//# sourceMappingURL=index.d.ts.map