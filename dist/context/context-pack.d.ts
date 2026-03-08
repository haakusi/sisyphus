/**
 * Context Pack Compiler
 *
 * Builds layered context packs (global / sprint / execution) with memory slices.
 */
import type { MemoryRecord } from '../memory/types.js';
export interface ContextReference {
    path: string;
    reason: string;
    estimatedTokens: number;
}
export interface ContextPack {
    generatedAt: string;
    projectRoot: string;
    tokenBudget: number;
    layers: {
        global: ContextReference[];
        sprint: ContextReference[];
        execution: ContextReference[];
    };
    memory: MemoryRecord[];
}
export interface ContextPackOptions {
    projectRoot: string;
    taskDescription?: string;
    workingFiles?: string[];
    tokenBudget?: number;
    maxLayerEntries?: number;
    memoryLookback?: number;
}
export declare function buildContextPack(options: ContextPackOptions): Promise<ContextPack>;
export declare function formatContextPackMarkdown(pack: ContextPack): string;
//# sourceMappingURL=context-pack.d.ts.map