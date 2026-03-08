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
import * as fs from 'fs';
import * as path from 'path';
// ============================================
// Default Configuration
// ============================================
export const DEFAULT_DOCUMENTS = [
    {
        path: 'CLAUDE.md',
        priority: 100,
        maxTokens: 5000,
        taskTypes: ['all'],
        required: false,
        description: 'Claude-specific project instructions',
    },
    {
        path: '.claude/CLAUDE.md',
        priority: 100,
        maxTokens: 5000,
        taskTypes: ['all'],
        required: false,
        description: 'Claude-specific project instructions (in .claude folder)',
    },
    {
        path: 'AGENTS.md',
        priority: 90,
        maxTokens: 3000,
        taskTypes: ['all'],
        required: false,
        description: 'Agent behavior guidelines',
    },
    {
        path: 'README.md',
        priority: 80,
        maxTokens: 2000,
        taskTypes: ['explore', 'implement'],
        extractSection: 'Getting Started',
        required: false,
        description: 'Project overview and setup',
    },
    {
        path: 'CONTRIBUTING.md',
        priority: 70,
        maxTokens: 2000,
        taskTypes: ['implement', 'review'],
        required: false,
        description: 'Contribution guidelines',
    },
    {
        path: 'docs/ARCHITECTURE.md',
        priority: 75,
        maxTokens: 3000,
        taskTypes: ['implement', 'refactor'],
        required: false,
        description: 'System architecture documentation',
    },
    {
        path: '.claude/rules.md',
        priority: 95,
        maxTokens: 2000,
        taskTypes: ['all'],
        required: false,
        description: 'Project-specific rules',
    },
];
export const DEFAULT_RULES = [
    {
        id: 'typescript-guidelines',
        description: 'TypeScript coding guidelines',
        patterns: ['**/*.ts', '**/*.tsx'],
        documents: ['docs/TYPESCRIPT.md', '.claude/typescript-rules.md'],
    },
    {
        id: 'react-guidelines',
        description: 'React component guidelines',
        patterns: ['**/*.tsx', '**/*.jsx', '**/components/**'],
        documents: ['docs/REACT.md', '.claude/react-rules.md'],
    },
    {
        id: 'api-guidelines',
        description: 'API design guidelines',
        patterns: ['**/api/**', '**/routes/**', '**/controllers/**'],
        documents: ['docs/API.md', '.claude/api-rules.md'],
    },
    {
        id: 'database-guidelines',
        description: 'Database schema and query guidelines',
        patterns: ['**/models/**', '**/schema/**', '**/*.sql', '**/migrations/**'],
        documents: ['docs/DATABASE.md', '.claude/database-rules.md'],
    },
    {
        id: 'test-guidelines',
        description: 'Testing guidelines',
        patterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**'],
        documents: ['docs/TESTING.md', '.claude/test-rules.md'],
    },
];
const DEFAULT_CONFIG = {
    enabled: true,
    maxTotalTokens: 15000,
    alwaysInject: DEFAULT_DOCUMENTS,
    rules: DEFAULT_RULES,
    searchPaths: ['.', '.claude', 'docs'],
    ignorePatterns: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
};
// ============================================
// Auto-Inject Manager
// ============================================
export class AutoInjectManager {
    config;
    projectRoot;
    documentCache = new Map();
    constructor(projectRoot, config) {
        this.projectRoot = projectRoot;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Get documents to inject for a given context
     */
    async getDocumentsToInject(workingFiles = [], taskType = 'all') {
        const result = {
            injected: [],
            skipped: [],
            totalTokens: 0,
            budgetRemaining: this.config.maxTotalTokens,
        };
        if (!this.config.enabled) {
            return result;
        }
        // Collect all documents to potentially inject
        const candidates = await this.collectCandidates(workingFiles, taskType);
        // Sort by priority (highest first)
        candidates.sort((a, b) => b.priority - a.priority);
        // Inject documents within budget
        for (const candidate of candidates) {
            const doc = await this.loadDocument(candidate);
            if (!doc) {
                if (candidate.required) {
                    result.skipped.push({
                        path: candidate.path,
                        reason: 'Required document not found',
                    });
                }
                continue;
            }
            const tokensNeeded = Math.min(doc.tokens, candidate.maxTokens || doc.tokens);
            if (tokensNeeded > result.budgetRemaining) {
                result.skipped.push({
                    path: candidate.path,
                    reason: `Exceeds budget (needs ${tokensNeeded}, have ${result.budgetRemaining})`,
                });
                continue;
            }
            result.injected.push({
                path: candidate.path,
                tokens: tokensNeeded,
                truncated: doc.tokens > tokensNeeded,
            });
            result.totalTokens += tokensNeeded;
            result.budgetRemaining -= tokensNeeded;
        }
        return result;
    }
    /**
     * Get the actual content to inject
     */
    async getInjectionContent(workingFiles = [], taskType = 'all') {
        const result = await this.getDocumentsToInject(workingFiles, taskType);
        const sections = [];
        for (const doc of result.injected) {
            const content = await this.getDocumentContent(doc.path, this.getMaxTokens(doc.path));
            if (content) {
                sections.push(`<!-- Injected: ${doc.path} -->`);
                sections.push(content);
                sections.push('');
            }
        }
        return sections.join('\n');
    }
    /**
     * Detect and return project documentation files
     */
    async detectDocuments() {
        const results = [];
        for (const doc of this.config.alwaysInject) {
            const fullPath = path.join(this.projectRoot, doc.path);
            results.push({
                path: doc.path,
                exists: fs.existsSync(fullPath),
                description: doc.description || '',
            });
        }
        return results;
    }
    // ============================================
    // Private Methods
    // ============================================
    async collectCandidates(workingFiles, taskType) {
        const candidates = [];
        const seen = new Set();
        // Always-inject documents
        for (const doc of this.config.alwaysInject) {
            if (this.matchesTaskType(doc, taskType)) {
                if (!seen.has(doc.path)) {
                    candidates.push(doc);
                    seen.add(doc.path);
                }
            }
        }
        // Rule-based documents
        for (const rule of this.config.rules) {
            if (this.ruleMatches(rule, workingFiles)) {
                for (const docPath of rule.documents) {
                    if (!seen.has(docPath)) {
                        candidates.push({
                            path: docPath,
                            priority: 60, // Default priority for rule-based docs
                            taskTypes: ['all'],
                            required: false,
                            description: rule.description,
                        });
                        seen.add(docPath);
                    }
                }
            }
        }
        return candidates;
    }
    matchesTaskType(doc, taskType) {
        if (!doc.taskTypes || doc.taskTypes.length === 0)
            return true;
        if (doc.taskTypes.includes('all'))
            return true;
        return doc.taskTypes.includes(taskType);
    }
    ruleMatches(rule, workingFiles) {
        if (workingFiles.length === 0)
            return false;
        for (const file of workingFiles) {
            for (const pattern of rule.patterns) {
                if (this.matchGlob(file, pattern)) {
                    return true;
                }
            }
        }
        return false;
    }
    matchGlob(file, pattern) {
        // Simple glob matching (supports * and **)
        const regexPattern = pattern
            .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
            .replace(/\*/g, '[^/]*')
            .replace(/<<<DOUBLESTAR>>>/g, '.*')
            .replace(/\//g, '[\\/]');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(file);
    }
    async loadDocument(config) {
        // Check cache
        const cached = this.documentCache.get(config.path);
        if (cached)
            return cached;
        // Try to find the document
        const fullPath = this.findDocument(config.path);
        if (!fullPath)
            return null;
        try {
            let content = await fs.promises.readFile(fullPath, 'utf-8');
            // Extract section if specified
            if (config.extractSection) {
                content = this.extractSection(content, config.extractSection);
            }
            const tokens = this.estimateTokens(content);
            const doc = { content, tokens };
            // Cache the result
            this.documentCache.set(config.path, doc);
            return doc;
        }
        catch {
            return null;
        }
    }
    findDocument(relativePath) {
        // Check direct path first
        const directPath = path.join(this.projectRoot, relativePath);
        if (fs.existsSync(directPath))
            return directPath;
        // Check search paths
        for (const searchPath of this.config.searchPaths) {
            const fullPath = path.join(this.projectRoot, searchPath, relativePath);
            if (fs.existsSync(fullPath))
                return fullPath;
        }
        return null;
    }
    async getDocumentContent(relativePath, maxTokens) {
        const doc = await this.loadDocument({ path: relativePath, priority: 0 });
        if (!doc)
            return null;
        if (maxTokens && doc.tokens > maxTokens) {
            return this.truncateToTokens(doc.content, maxTokens);
        }
        return doc.content;
    }
    getMaxTokens(docPath) {
        const config = this.config.alwaysInject.find(d => d.path === docPath);
        return config?.maxTokens;
    }
    extractSection(content, sectionTitle) {
        const lines = content.split('\n');
        const sectionStart = lines.findIndex(line => line.match(new RegExp(`^#+\\s*${sectionTitle}`, 'i')));
        if (sectionStart === -1)
            return content;
        // Find the header level
        const headerMatch = lines[sectionStart].match(/^(#+)/);
        const headerLevel = headerMatch ? headerMatch[1].length : 1;
        // Find the next header of same or higher level
        let sectionEnd = lines.length;
        for (let i = sectionStart + 1; i < lines.length; i++) {
            const match = lines[i].match(/^(#+)/);
            if (match && match[1].length <= headerLevel) {
                sectionEnd = i;
                break;
            }
        }
        return lines.slice(sectionStart, sectionEnd).join('\n');
    }
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token for English text
        // This is a simple heuristic; real tokenization would be more accurate
        return Math.ceil(text.length / 4);
    }
    truncateToTokens(text, maxTokens) {
        const estimatedChars = maxTokens * 4;
        if (text.length <= estimatedChars)
            return text;
        // Try to truncate at a paragraph boundary
        const truncated = text.slice(0, estimatedChars);
        const lastParagraph = truncated.lastIndexOf('\n\n');
        if (lastParagraph > estimatedChars * 0.8) {
            return truncated.slice(0, lastParagraph) + '\n\n[...truncated]';
        }
        return truncated + '\n\n[...truncated]';
    }
    /**
     * Update configuration
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        this.documentCache.clear();
    }
    /**
     * Clear document cache
     */
    clearCache() {
        this.documentCache.clear();
    }
    /**
     * Add a custom document to always inject
     */
    addDocument(doc) {
        const existing = this.config.alwaysInject.findIndex(d => d.path === doc.path);
        if (existing >= 0) {
            this.config.alwaysInject[existing] = doc;
        }
        else {
            this.config.alwaysInject.push(doc);
        }
    }
    /**
     * Add a custom injection rule
     */
    addRule(rule) {
        const existing = this.config.rules.findIndex(r => r.id === rule.id);
        if (existing >= 0) {
            this.config.rules[existing] = rule;
        }
        else {
            this.config.rules.push(rule);
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// ============================================
// Singleton & Factory
// ============================================
let managerInstance = null;
export function getAutoInjectManager(projectRoot) {
    if (!managerInstance || (projectRoot && projectRoot !== managerInstance['projectRoot'])) {
        managerInstance = new AutoInjectManager(projectRoot || process.cwd());
    }
    return managerInstance;
}
export function createAutoInjectManager(projectRoot, config) {
    return new AutoInjectManager(projectRoot, config);
}
//# sourceMappingURL=auto-inject.js.map