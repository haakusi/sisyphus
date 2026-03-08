/**
 * Omnibus Tools
 *
 * Cross-cutting tools for memory, policy, context packs, and artifact drift checks.
 */
interface ToolResult {
    success: boolean;
    formatted?: string;
    data?: unknown;
    error?: string;
}
export declare function memoryAppend(args: {
    projectRoot?: string;
    kind: string;
    content: string;
    scope?: string;
    tags?: string[];
    confidence?: number;
    sourceRef?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}): Promise<ToolResult>;
export declare function memorySearch(args?: {
    projectRoot?: string;
    query?: string;
    limit?: number;
    kinds?: string[];
    scopes?: string[];
    minConfidence?: number;
}): Promise<ToolResult>;
export declare function memoryCompact(args?: {
    projectRoot?: string;
    summary?: string;
    taskDescription?: string;
    scope?: string;
    tags?: string[];
    sessionId?: string;
    sourceRef?: string;
    includeContextPack?: boolean;
}): Promise<ToolResult>;
export declare function artifactDriftStatus(args?: {
    projectRoot?: string;
}): Promise<ToolResult>;
export declare function policyActiveRules(args?: {
    projectRoot?: string;
    limit?: number;
}): Promise<ToolResult>;
export declare function buildContextPackTool(args?: {
    projectRoot?: string;
    taskDescription?: string;
    workingFiles?: string[];
    tokenBudget?: number;
    maxLayerEntries?: number;
    memoryLookback?: number;
}): Promise<ToolResult>;
export {};
//# sourceMappingURL=index.d.ts.map