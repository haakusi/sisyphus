/**
 * Memory Module
 *
 * Entry point for persistent memory storage.
 */

import { MemoryStore } from './store.js';
import type { MemoryStoreConfig } from './types.js';

const stores = new Map<string, MemoryStore>();

export function getMemoryStore(
  projectRoot: string,
  config: Partial<MemoryStoreConfig> = {}
): MemoryStore {
  const existing = stores.get(projectRoot);
  if (existing) {
    return existing;
  }

  const store = new MemoryStore(projectRoot, config);
  stores.set(projectRoot, store);
  return store;
}

export function resetMemoryStore(projectRoot?: string): void {
  if (projectRoot) {
    const store = stores.get(projectRoot);
    if (store) {
      store.close();
      stores.delete(projectRoot);
    }
    return;
  }

  for (const store of stores.values()) {
    store.close();
  }
  stores.clear();
}

export { MemoryStore } from './store.js';
export type {
  MemoryKind,
  MemoryBackend,
  MemoryRecord,
  AppendMemoryInput,
  MemorySearchQuery,
  MemoryStoreConfig,
  MemoryStoreStatus,
} from './types.js';
