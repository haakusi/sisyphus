/**
 * Comment Sanitizer
 *
 * Removes unnecessary AI-generated comments while preserving meaningful documentation.
 * AI tends to over-comment code with obvious descriptions. This tool cleans that up.
 *
 * Preserves:
 * - JSDoc/TSDoc documentation
 * - TODO, FIXME, HACK, NOTE comments
 * - License headers
 * - Complex logic explanations
 * - Type annotations in JSDoc
 *
 * Removes:
 * - "This function does X" for obvious functions
 * - "Import Y" above import statements
 * - "Define variable" above variable declarations
 * - Redundant inline comments
 */
export interface SanitizerConfig {
    /** Remove single-line comments that match obvious patterns */
    removeObviousComments: boolean;
    /** Remove comments that just restate the code */
    removeRedundantComments: boolean;
    /** Preserve JSDoc/TSDoc blocks */
    preserveJSDoc: boolean;
    /** Preserve TODO/FIXME/HACK/NOTE comments */
    preserveTodoComments: boolean;
    /** Preserve license headers */
    preserveLicenseHeaders: boolean;
    /** Minimum comment length to consider for removal (shorter = more likely redundant) */
    minCommentLength: number;
    /** Languages to process */
    languages: string[];
    /** Custom patterns to always preserve (regex) */
    preservePatterns: string[];
    /** Custom patterns to always remove (regex) */
    removePatterns: string[];
}
export interface SanitizerResult {
    /** File path */
    file: string;
    /** Original comment count */
    originalComments: number;
    /** Removed comment count */
    removedComments: number;
    /** Preserved comment count */
    preservedComments: number;
    /** Lines changed */
    linesChanged: number;
    /** Whether file was modified */
    modified: boolean;
    /** Preview of changes (first few) */
    removedExamples: string[];
}
export interface BatchResult {
    /** Total files processed */
    filesProcessed: number;
    /** Files modified */
    filesModified: number;
    /** Total comments removed */
    totalCommentsRemoved: number;
    /** Per-file results */
    results: SanitizerResult[];
}
export declare class CommentSanitizer {
    private config;
    constructor(config?: Partial<SanitizerConfig>);
    /**
     * Sanitize a single file
     */
    sanitizeFile(filePath: string, dryRun?: boolean): Promise<SanitizerResult>;
    /**
     * Sanitize multiple files
     */
    sanitizeDirectory(dirPath: string, options?: {
        dryRun?: boolean;
        recursive?: boolean;
        include?: string[];
        exclude?: string[];
    }): Promise<BatchResult>;
    private getCommentPatterns;
    private isSingleLineComment;
    private shouldPreserveSingleLine;
    private shouldPreserveMultiline;
    private processInlineComment;
    private isInsideString;
    private extractCommentText;
    private findFiles;
    private matchGlob;
    /**
     * Update configuration
     */
    configure(config: Partial<SanitizerConfig>): void;
}
export declare function getCommentSanitizer(): CommentSanitizer;
export declare function createCommentSanitizer(config?: Partial<SanitizerConfig>): CommentSanitizer;
export declare function sanitizeComments(target: string, options?: {
    dryRun?: boolean;
    recursive?: boolean;
}): Promise<SanitizerResult | BatchResult>;
//# sourceMappingURL=index.d.ts.map