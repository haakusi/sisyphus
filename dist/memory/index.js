/**
 * Memory Module
 *
 * Entry point for persistent memory storage.
 */
import { MemoryStore } from './store.js';
const stores = new Map();
export function getMemoryStore(projectRoot, config = {}) {
    const existing = stores.get(projectRoot);
    if (existing) {
        return existing;
    }
    const store = new MemoryStore(projectRoot, config);
    stores.set(projectRoot, store);
    return store;
}
export function resetMemoryStore(projectRoot) {
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
//# sourceMappingURL=index.js.map