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
// Types
// ============================================

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

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_DOCUMENTS: DocumentConfig[] = [
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

export const DEFAULT_RULES: InjectionRule[] = [
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

const DEFAULT_CONFIG: AutoInjectConfig = {
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
  private config: AutoInjectConfig;
  private projectRoot: string;
  private documentCache: Map<string, { content: string; tokens: number }> = new Map();

  constructor(projectRoot: string, config?: Partial<AutoInjectConfig>) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get documents to inject for a given context
   */
  async getDocumentsToInject(
    workingFiles: string[] = [],
    taskType: string = 'all'
  ): Promise<InjectionResult> {
    const result: InjectionResult = {
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
  async getInjectionContent(
    workingFiles: string[] = [],
    taskType: string = 'all'
  ): Promise<string> {
    const result = await this.getDocumentsToInject(workingFiles, taskType);
    const sections: string[] = [];

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
  async detectDocuments(): Promise<Array<{ path: string; exists: boolean; description: string }>> {
    const results: Array<{ path: string; exists: boolean; description: string }> = [];

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

  private async collectCandidates(
    workingFiles: string[],
    taskType: string
  ): Promise<DocumentConfig[]> {
    const candidates: DocumentConfig[] = [];
    const seen = new Set<string>();

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

  private matchesTaskType(doc: DocumentConfig, taskType: string): boolean {
    if (!doc.taskTypes || doc.taskTypes.length === 0) return true;
    if (doc.taskTypes.includes('all')) return true;
    return doc.taskTypes.includes(taskType as DocumentConfig['taskTypes'][0]);
  }

  private ruleMatches(rule: InjectionRule, workingFiles: string[]): boolean {
    if (workingFiles.length === 0) return false;

    for (const file of workingFiles) {
      for (const pattern of rule.patterns) {
        if (this.matchGlob(file, pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  private matchGlob(file: string, pattern: string): boolean {
    // Simple glob matching (supports * and **)
    const regexPattern = pattern
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*')
      .replace(/\//g, '[\\/]');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(file);
  }

  private async loadDocument(
    config: DocumentConfig
  ): Promise<{ content: string; tokens: number } | null> {
    // Check cache
    const cached = this.documentCache.get(config.path);
    if (cached) return cached;

    // Try to find the document
    const fullPath = this.findDocument(config.path);
    if (!fullPath) return null;

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
    } catch {
      return null;
    }
  }

  private findDocument(relativePath: string): string | null {
    // Check direct path first
    const directPath = path.join(this.projectRoot, relativePath);
    if (fs.existsSync(directPath)) return directPath;

    // Check search paths
    for (const searchPath of this.config.searchPaths) {
      const fullPath = path.join(this.projectRoot, searchPath, relativePath);
      if (fs.existsSync(fullPath)) return fullPath;
    }

    return null;
  }

  private async getDocumentContent(
    relativePath: string,
    maxTokens?: number
  ): Promise<string | null> {
    const doc = await this.loadDocument({ path: relativePath, priority: 0 });
    if (!doc) return null;

    if (maxTokens && doc.tokens > maxTokens) {
      return this.truncateToTokens(doc.content, maxTokens);
    }

    return doc.content;
  }

  private getMaxTokens(docPath: string): number | undefined {
    const config = this.config.alwaysInject.find(d => d.path === docPath);
    return config?.maxTokens;
  }

  private extractSection(content: string, sectionTitle: string): string {
    const lines = content.split('\n');
    const sectionStart = lines.findIndex(line =>
      line.match(new RegExp(`^#+\\s*${sectionTitle}`, 'i'))
    );

    if (sectionStart === -1) return content;

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

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    // This is a simple heuristic; real tokenization would be more accurate
    return Math.ceil(text.length / 4);
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const estimatedChars = maxTokens * 4;
    if (text.length <= estimatedChars) return text;

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
  configure(config: Partial<AutoInjectConfig>): void {
    this.config = { ...this.config, ...config };
    this.documentCache.clear();
  }

  /**
   * Clear document cache
   */
  clearCache(): void {
    this.documentCache.clear();
  }

  /**
   * Add a custom document to always inject
   */
  addDocument(doc: DocumentConfig): void {
    const existing = this.config.alwaysInject.findIndex(d => d.path === doc.path);
    if (existing >= 0) {
      this.config.alwaysInject[existing] = doc;
    } else {
      this.config.alwaysInject.push(doc);
    }
  }

  /**
   * Add a custom injection rule
   */
  addRule(rule: InjectionRule): void {
    const existing = this.config.rules.findIndex(r => r.id === rule.id);
    if (existing >= 0) {
      this.config.rules[existing] = rule;
    } else {
      this.config.rules.push(rule);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoInjectConfig {
    return { ...this.config };
  }
}

// ============================================
// Singleton & Factory
// ============================================

let managerInstance: AutoInjectManager | null = null;

export function getAutoInjectManager(projectRoot?: string): AutoInjectManager {
  if (!managerInstance || (projectRoot && projectRoot !== managerInstance['projectRoot'])) {
    managerInstance = new AutoInjectManager(projectRoot || process.cwd());
  }
  return managerInstance;
}

export function createAutoInjectManager(
  projectRoot: string,
  config?: Partial<AutoInjectConfig>
): AutoInjectManager {
  return new AutoInjectManager(projectRoot, config);
}
