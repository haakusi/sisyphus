/**
 * AST-Grep Engine
 *
 * Provides structural code search and transformation using AST patterns.
 * Uses ast-grep CLI for pattern matching and can perform safe refactoring.
 *
 * Supported languages:
 * - TypeScript/JavaScript
 * - Python
 * - Go
 * - Rust
 * - And more via ast-grep language support
 */
export interface ASTMatch {
    file: string;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    text: string;
    replacement?: string;
    metaVariables?: Record<string, string>;
}
export interface ASTSearchResult {
    matches: ASTMatch[];
    totalMatches: number;
    searchedFiles: number;
    language: string;
}
export interface ASTReplaceResult {
    success: boolean;
    filesChanged: number;
    totalReplacements: number;
    changes: Array<{
        file: string;
        replacements: number;
        diff?: string;
    }>;
    errors?: string[];
}
export interface SearchOptions {
    pattern: string;
    language?: string;
    path?: string;
    include?: string[];
    exclude?: string[];
    maxResults?: number;
    json?: boolean;
}
export interface ReplaceOptions extends SearchOptions {
    replacement: string;
    dryRun?: boolean;
    interactive?: boolean;
}
export interface RefactorRule {
    id: string;
    name: string;
    description: string;
    language: string;
    pattern: string;
    replacement: string;
    fix?: string;
    severity?: 'error' | 'warning' | 'info' | 'hint';
}
export declare class ASTGrepEngine {
    private astGrepPath;
    private tempDir;
    constructor(astGrepPath?: string);
    /**
     * Resolve the actual ast-grep executable path
     * On Windows, we need to find sg.exe to avoid shell script wrapper issues
     */
    private resolveAstGrepPath;
    private ensureTempDir;
    /**
     * Search for code patterns using AST matching
     */
    search(options: SearchOptions): Promise<ASTSearchResult>;
    /**
     * Search and replace using AST patterns
     */
    replace(options: ReplaceOptions): Promise<ASTReplaceResult>;
    /**
     * Apply a refactoring rule
     */
    applyRule(rule: RefactorRule, searchPath?: string, dryRun?: boolean): Promise<ASTReplaceResult>;
    /**
     * Validate a pattern
     */
    validatePattern(pattern: string, language: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Find function/method definitions
     */
    findFunctions(searchPath: string, language?: string): Promise<ASTSearchResult>;
    /**
     * Find class definitions
     */
    findClasses(searchPath: string, language?: string): Promise<ASTSearchResult>;
    /**
     * Find imports
     */
    findImports(searchPath: string, moduleName?: string, language?: string): Promise<ASTSearchResult>;
    /**
     * Find console.log / print statements (for cleanup)
     */
    findDebugStatements(searchPath: string, language?: string): Promise<ASTSearchResult>;
    /**
     * Find TODO/FIXME comments
     */
    findTodoComments(searchPath: string): Promise<ASTSearchResult>;
    /**
     * Common refactoring rules
     */
    getRefactorRules(): RefactorRule[];
    /**
     * Normalize path for ast-grep CLI on Windows
     * Converts backslashes to forward slashes (ast-grep accepts both on Windows)
     */
    private normalizePath;
    /**
     * Normalize all path arguments in the args array
     */
    private normalizeArgs;
    private runAstGrep;
    private parseSearchResults;
    private parseMatchItem;
    private parseTextMatch;
    private countUniqueFiles;
    private groupByFile;
    private detectLanguage;
    private getLanguageFromExtension;
    private getExtension;
    /**
     * Check if ast-grep is installed
     */
    isInstalled(): Promise<boolean>;
    /**
     * Get ast-grep version
     */
    getVersion(): Promise<string | null>;
}
export declare function getASTGrepEngine(): ASTGrepEngine;
//# sourceMappingURL=engine.d.ts.map