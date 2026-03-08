/**
 * Document Auto-Injection System
 *
 * Automatically detects and injects project documentation into Claude's context.
 * Supports conditional rules based on file patterns and task types.
 *
 * Features:
 * - Auto-detect README.md, CLAUDE.md, AGENTS.md
 * - Conditional rules (inject TypeScript guidelines only for .ts files)
 * - Priority-based injection (critical docs first)
 * - Context budget management (don't exceed limits)
 */
export interface DocumentConfig {
    /** Relative path from project root */
    path: string;
    /** Priority (higher = injected first, 0-100) */
    priority: number;
    /** Maximum tokens to include (0 = unlimited) */
    maxTokens?: number;
    /** Only inject when these file patterns are being worked on */
    conditionalPatterns?: string[];
    /** Only inject for certain task types */
    taskTypes?: ('explore' | 'implement' | 'refactor' | 'debug' | 'review' | 'all')[];
    /** Section to extract (by header) instead of full doc */
    extractSection?: string;
    /** Whether this doc is required (error if missing) */
    required?: boolean;
    /** Description for logging */
    description?: string;
}
export interface InjectionRule {
    /** Rule identifier */
    id: string;
    /** Description */
    description: string;
    /** File patterns that trigger this rule */
    patterns: string[];
    /** Documents to inject when rule matches */
    documents: string[];
    /** Additional context to inject */
    additionalContext?: string;
}
export interface InjectionResult {
    /** Documents that were injected */
    injected: Array<{
        path: string;
        tokens: number;
        truncated: boolean;
    }>;
    /** Documents that were skipped */
    skipped: Array<{
        path: string;
        reason: string;
    }>;
    /** Total tokens used */
    totalTokens: number;
    /** Budget remaining */
    budgetRemaining: number;
}
export interface AutoInjectConfig {
    /** Enable auto-injection */
    enabled: boolean;
    /** Maximum total tokens for injected docs */
    maxTotalTokens: number;
    /** Documents to always inject */
    alwaysInject: DocumentConfig[];
    /** Conditional injection rules */
    rules: InjectionRule[];
    /** Directories to search for docs */
    searchPaths: string[];
    /** File patterns to ignore */
    ignorePatterns: string[];
}
export declare const DEFAULT_DOCUMENTS: DocumentConfig[];
export declare const DEFAULT_RULES: InjectionRule[];
export declare class AutoInjectManager {
    private config;
    private projectRoot;
    private documentCache;
    constructor(projectRoot: string, config?: Partial<AutoInjectConfig>);
    /**
     * Get documents to inject for a given context
     */
    getDocumentsToInject(workingFiles?: string[], taskType?: string): Promise<InjectionResult>;
    /**
     * Get the actual content to inject
     */
    getInjectionContent(workingFiles?: string[], taskType?: string): Promise<string>;
    /**
     * Detect and return project documentation files
     */
    detectDocuments(): Promise<Array<{
        path: string;
        exists: boolean;
        description: string;
    }>>;
    private collectCandidates;
    private matchesTaskType;
    private ruleMatches;
    private matchGlob;
    private loadDocument;
    private findDocument;
    private getDocumentContent;
    private getMaxTokens;
    private extractSection;
    private estimateTokens;
    private truncateToTokens;
    /**
     * Update configuration
     */
    configure(config: Partial<AutoInjectConfig>): void;
    /**
     * Clear document cache
     */
    clearCache(): void;
    /**
     * Add a custom document to always inject
     */
    addDocument(doc: DocumentConfig): void;
    /**
     * Add a custom injection rule
     */
    addRule(rule: InjectionRule): void;
    /**
     * Get current configuration
     */
    getConfig(): AutoInjectConfig;
}
export declare function getAutoInjectManager(projectRoot?: string): AutoInjectManager;
export declare function createAutoInjectManager(projectRoot: string, config?: Partial<AutoInjectConfig>): AutoInjectManager;
//# sourceMappingURL=auto-inject.d.ts.map