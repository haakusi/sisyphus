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
import * as fs from 'fs';
import * as path from 'path';
// ============================================
// Default Configuration
// ============================================
const DEFAULT_CONFIG = {
    removeObviousComments: true,
    removeRedundantComments: true,
    preserveJSDoc: true,
    preserveTodoComments: true,
    preserveLicenseHeaders: true,
    minCommentLength: 10,
    languages: ['typescript', 'javascript', 'python', 'go', 'rust'],
    preservePatterns: [],
    removePatterns: [],
};
// ============================================
// Obvious Comment Patterns (to remove)
// ============================================
const OBVIOUS_PATTERNS = [
    // Import statements
    /^\s*\/\/\s*import(s|ing)?\s/i,
    /^\s*\/\/\s*require\s/i,
    // Variable declarations
    /^\s*\/\/\s*(define|declare|create|set|initialize)\s+(a\s+)?(variable|const|let|var)\s/i,
    /^\s*\/\/\s*(the\s+)?\w+\s+(variable|constant)\s*$/i,
    // Function declarations
    /^\s*\/\/\s*(define|declare|create)\s+(a\s+)?function\s/i,
    /^\s*\/\/\s*function\s+to\s+\w+/i,
    /^\s*\/\/\s*this\s+function\s+(does|will|is)\s/i,
    // Class declarations
    /^\s*\/\/\s*(define|declare|create)\s+(a\s+)?class\s/i,
    /^\s*\/\/\s*(the\s+)?\w+\s+class\s*$/i,
    // Obvious operations
    /^\s*\/\/\s*(return|returns)\s+(the\s+)?(result|value)\s*$/i,
    /^\s*\/\/\s*(check|checking)\s+if\s/i,
    /^\s*\/\/\s*(loop|iterate|looping|iterating)\s+(through|over)\s/i,
    /^\s*\/\/\s*(get|set|update)\s+(the\s+)?\w+\s*$/i,
    // Self-evident
    /^\s*\/\/\s*(start|end|begin|finish)\s+(of\s+)?(the\s+)?(function|class|method|block|loop|if)\s*$/i,
    /^\s*\/\/\s*constructor\s*$/i,
    /^\s*\/\/\s*destructor\s*$/i,
    /^\s*\/\/\s*getter\s*$/i,
    /^\s*\/\/\s*setter\s*$/i,
    // Empty or near-empty
    /^\s*\/\/\s*\.{3,}\s*$/,
    /^\s*\/\/\s*-{3,}\s*$/,
    /^\s*\/\/\s*={3,}\s*$/,
    /^\s*\/\/\s*$/,
    // AI-style comments
    /^\s*\/\/\s*here\s+we\s/i,
    /^\s*\/\/\s*now\s+we\s/i,
    /^\s*\/\/\s*first,?\s+we\s/i,
    /^\s*\/\/\s*next,?\s+we\s/i,
    /^\s*\/\/\s*finally,?\s+we\s/i,
];
// ============================================
// Patterns to Preserve
// ============================================
const PRESERVE_PATTERNS = [
    // JSDoc/TSDoc
    /^\s*\/\*\*/,
    /^\s*\*\s*@/,
    // TODO/FIXME/etc
    /^\s*\/\/\s*(TODO|FIXME|HACK|NOTE|XXX|BUG|OPTIMIZE|REVIEW)[:.\s]/i,
    /^\s*#\s*(TODO|FIXME|HACK|NOTE|XXX|BUG|OPTIMIZE|REVIEW)[:.\s]/i,
    // License headers
    /^\s*\/\/\s*(copyright|license|licensed|MIT|Apache|GPL|BSD)/i,
    /^\s*\/\*[\s\S]*?(copyright|license)/i,
    // Type annotations
    /^\s*\/\/\s*@ts-/,
    /^\s*\/\/\s*@type/,
    /^\s*\/\/\s*@param/,
    /^\s*\/\/\s*@returns?/,
    // ESLint/TSLint directives
    /^\s*\/\/\s*eslint-/,
    /^\s*\/\/\s*tslint:/,
    /^\s*\/\/\s*prettier-/,
    /^\s*\/\*\s*eslint-/,
    // Compiler directives
    /^\s*\/\/\s*#region/,
    /^\s*\/\/\s*#endregion/,
    /^\s*#\s*pragma/,
    /^\s*#\s*ifdef/,
    /^\s*#\s*endif/,
    // Important warnings
    /^\s*\/\/\s*(WARNING|IMPORTANT|DANGER|CAUTION|SECURITY)[:.\s]/i,
    // Complex explanations (longer comments)
    /^\s*\/\/.*because\s/i,
    /^\s*\/\/.*since\s/i,
    /^\s*\/\/.*due to\s/i,
    /^\s*\/\/.*workaround\s/i,
    /^\s*\/\/.*edge case/i,
    /^\s*\/\/.*race condition/i,
    /^\s*\/\/.*thread.safe/i,
];
// ============================================
// Comment Sanitizer Class
// ============================================
export class CommentSanitizer {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Sanitize a single file
     */
    async sanitizeFile(filePath, dryRun = true) {
        const absolutePath = path.resolve(filePath);
        const content = await fs.promises.readFile(absolutePath, 'utf-8');
        const ext = path.extname(filePath).toLowerCase();
        const result = {
            file: filePath,
            originalComments: 0,
            removedComments: 0,
            preservedComments: 0,
            linesChanged: 0,
            modified: false,
            removedExamples: [],
        };
        // Get language-specific comment patterns
        const commentInfo = this.getCommentPatterns(ext);
        if (!commentInfo) {
            return result;
        }
        const lines = content.split('\n');
        const newLines = [];
        let inMultilineComment = false;
        let multilineBuffer = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            // Handle multiline comments
            if (commentInfo.multiStart && trimmed.startsWith(commentInfo.multiStart)) {
                inMultilineComment = true;
                multilineBuffer = [line];
                if (trimmed.includes(commentInfo.multiEnd) && !trimmed.endsWith(commentInfo.multiStart)) {
                    inMultilineComment = false;
                    const fullComment = multilineBuffer.join('\n');
                    result.originalComments++;
                    if (this.shouldPreserveMultiline(fullComment)) {
                        newLines.push(line);
                        result.preservedComments++;
                    }
                    else {
                        result.removedComments++;
                        result.linesChanged++;
                        if (result.removedExamples.length < 5) {
                            result.removedExamples.push(trimmed.slice(0, 60));
                        }
                    }
                    multilineBuffer = [];
                }
                continue;
            }
            if (inMultilineComment) {
                multilineBuffer.push(line);
                if (trimmed.includes(commentInfo.multiEnd)) {
                    inMultilineComment = false;
                    const fullComment = multilineBuffer.join('\n');
                    result.originalComments++;
                    if (this.shouldPreserveMultiline(fullComment)) {
                        newLines.push(...multilineBuffer);
                        result.preservedComments++;
                    }
                    else {
                        result.removedComments++;
                        result.linesChanged += multilineBuffer.length;
                        if (result.removedExamples.length < 5) {
                            result.removedExamples.push(fullComment.slice(0, 60).replace(/\n/g, ' '));
                        }
                    }
                    multilineBuffer = [];
                }
                continue;
            }
            // Handle single-line comments
            if (commentInfo.single && this.isSingleLineComment(trimmed, commentInfo.single)) {
                result.originalComments++;
                if (this.shouldPreserveSingleLine(line)) {
                    newLines.push(line);
                    result.preservedComments++;
                }
                else {
                    result.removedComments++;
                    result.linesChanged++;
                    if (result.removedExamples.length < 5) {
                        result.removedExamples.push(trimmed.slice(0, 60));
                    }
                }
                continue;
            }
            // Handle inline comments
            if (commentInfo.single) {
                const inlineResult = this.processInlineComment(line, commentInfo.single);
                if (inlineResult.hadComment) {
                    result.originalComments++;
                    if (inlineResult.removed) {
                        result.removedComments++;
                        result.linesChanged++;
                        newLines.push(inlineResult.newLine);
                    }
                    else {
                        result.preservedComments++;
                        newLines.push(line);
                    }
                    continue;
                }
            }
            // Regular line
            newLines.push(line);
        }
        result.modified = result.removedComments > 0;
        // Write if not dry run and there were changes
        if (!dryRun && result.modified) {
            await fs.promises.writeFile(absolutePath, newLines.join('\n'), 'utf-8');
        }
        return result;
    }
    /**
     * Sanitize multiple files
     */
    async sanitizeDirectory(dirPath, options = {}) {
        const { dryRun = true, recursive = true, include, exclude } = options;
        const result = {
            filesProcessed: 0,
            filesModified: 0,
            totalCommentsRemoved: 0,
            results: [],
        };
        const files = await this.findFiles(dirPath, recursive, include, exclude);
        for (const file of files) {
            const fileResult = await this.sanitizeFile(file, dryRun);
            result.filesProcessed++;
            result.results.push(fileResult);
            if (fileResult.modified) {
                result.filesModified++;
                result.totalCommentsRemoved += fileResult.removedComments;
            }
        }
        return result;
    }
    // ============================================
    // Private Methods
    // ============================================
    getCommentPatterns(ext) {
        switch (ext) {
            case '.ts':
            case '.tsx':
            case '.js':
            case '.jsx':
            case '.mts':
            case '.mjs':
            case '.cts':
            case '.cjs':
            case '.java':
            case '.c':
            case '.cpp':
            case '.h':
            case '.hpp':
            case '.cs':
            case '.go':
            case '.swift':
            case '.kt':
            case '.rs':
                return { single: '//', multiStart: '/*', multiEnd: '*/' };
            case '.py':
                return { single: '#', multiStart: '"""', multiEnd: '"""' };
            case '.rb':
                return { single: '#', multiStart: '=begin', multiEnd: '=end' };
            case '.sh':
            case '.bash':
            case '.zsh':
                return { single: '#' };
            case '.sql':
                return { single: '--', multiStart: '/*', multiEnd: '*/' };
            case '.html':
            case '.xml':
                return { multiStart: '<!--', multiEnd: '-->' };
            case '.css':
            case '.scss':
            case '.less':
                return { multiStart: '/*', multiEnd: '*/' };
            default:
                return null;
        }
    }
    isSingleLineComment(line, prefix) {
        return line.startsWith(prefix);
    }
    shouldPreserveSingleLine(line) {
        // Check custom preserve patterns first
        for (const pattern of this.config.preservePatterns) {
            if (new RegExp(pattern).test(line)) {
                return true;
            }
        }
        // Check custom remove patterns
        for (const pattern of this.config.removePatterns) {
            if (new RegExp(pattern).test(line)) {
                return false;
            }
        }
        // Check built-in preserve patterns
        for (const pattern of PRESERVE_PATTERNS) {
            if (pattern.test(line)) {
                return true;
            }
        }
        // Check built-in obvious patterns
        if (this.config.removeObviousComments) {
            for (const pattern of OBVIOUS_PATTERNS) {
                if (pattern.test(line)) {
                    return false;
                }
            }
        }
        // Check length (very short comments are likely redundant)
        const commentText = this.extractCommentText(line);
        if (commentText.length < this.config.minCommentLength) {
            return false;
        }
        // Default: preserve
        return true;
    }
    shouldPreserveMultiline(comment) {
        // Always preserve JSDoc
        if (this.config.preserveJSDoc && /^\s*\/\*\*/.test(comment)) {
            return true;
        }
        // Check for license headers
        if (this.config.preserveLicenseHeaders && /copyright|license|licensed/i.test(comment)) {
            return true;
        }
        // Check preserve patterns
        for (const pattern of PRESERVE_PATTERNS) {
            if (pattern.test(comment)) {
                return true;
            }
        }
        // Short multiline comments might be redundant
        const lines = comment.split('\n').filter(l => l.trim());
        if (lines.length <= 2) {
            const text = comment.replace(/\/\*|\*\/|\*/g, '').trim();
            if (text.length < this.config.minCommentLength * 2) {
                return false;
            }
        }
        return true;
    }
    processInlineComment(line, prefix) {
        // Find inline comment (not at start of line)
        const commentIndex = line.indexOf(prefix);
        if (commentIndex <= 0) {
            return { hadComment: false, removed: false, newLine: line };
        }
        // Check if it's inside a string
        const beforeComment = line.slice(0, commentIndex);
        if (this.isInsideString(beforeComment)) {
            return { hadComment: false, removed: false, newLine: line };
        }
        const commentPart = line.slice(commentIndex);
        // Check if should preserve
        if (this.shouldPreserveSingleLine(commentPart)) {
            return { hadComment: true, removed: false, newLine: line };
        }
        // Remove the inline comment
        return {
            hadComment: true,
            removed: true,
            newLine: beforeComment.trimEnd(),
        };
    }
    isInsideString(text) {
        let inSingle = false;
        let inDouble = false;
        let inTemplate = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const prev = i > 0 ? text[i - 1] : '';
            if (prev !== '\\') {
                if (char === "'" && !inDouble && !inTemplate)
                    inSingle = !inSingle;
                if (char === '"' && !inSingle && !inTemplate)
                    inDouble = !inDouble;
                if (char === '`' && !inSingle && !inDouble)
                    inTemplate = !inTemplate;
            }
        }
        return inSingle || inDouble || inTemplate;
    }
    extractCommentText(line) {
        return line.replace(/^\s*\/\/\s*/, '').replace(/^\s*#\s*/, '').trim();
    }
    async findFiles(dirPath, recursive, include, exclude) {
        const results = [];
        const absDir = path.resolve(dirPath);
        const defaultExclude = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv'];
        const excludePatterns = [...defaultExclude, ...(exclude || [])];
        const processDir = async (dir) => {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(absDir, fullPath);
                // Check exclusions
                if (excludePatterns.some(p => relativePath.includes(p) || entry.name === p)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    if (recursive) {
                        await processDir(fullPath);
                    }
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    // Check if language is supported
                    const patterns = this.getCommentPatterns(ext);
                    if (!patterns)
                        continue;
                    // Check include patterns
                    if (include && include.length > 0) {
                        const matches = include.some(p => this.matchGlob(relativePath, p));
                        if (!matches)
                            continue;
                    }
                    results.push(fullPath);
                }
            }
        };
        await processDir(absDir);
        return results;
    }
    matchGlob(file, pattern) {
        const regexPattern = pattern
            .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
            .replace(/\*/g, '[^/\\\\]*')
            .replace(/<<<DOUBLESTAR>>>/g, '.*')
            .replace(/\//g, '[\\/\\\\]');
        return new RegExp(`^${regexPattern}$`, 'i').test(file);
    }
    /**
     * Update configuration
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }
}
// ============================================
// Singleton & Exports
// ============================================
let sanitizerInstance = null;
export function getCommentSanitizer() {
    if (!sanitizerInstance) {
        sanitizerInstance = new CommentSanitizer();
    }
    return sanitizerInstance;
}
export function createCommentSanitizer(config) {
    return new CommentSanitizer(config);
}
// Convenience function
export async function sanitizeComments(target, options = {}) {
    const sanitizer = getCommentSanitizer();
    const stats = await fs.promises.stat(target);
    if (stats.isFile()) {
        return sanitizer.sanitizeFile(target, options.dryRun);
    }
    else {
        return sanitizer.sanitizeDirectory(target, options);
    }
}
//# sourceMappingURL=index.js.map