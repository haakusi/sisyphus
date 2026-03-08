/**
 * AST-Grep MCP Server
 *
 * Exposes AST-based code search and transformation as MCP tools.
 *
 * Tools provided:
 * - ast_search: Search for code patterns structurally
 * - ast_replace: Replace code patterns (with dry-run support)
 * - ast_refactor: Apply built-in refactoring rules
 * - ast_find_functions: Find all function definitions
 * - ast_find_classes: Find all class definitions
 * - ast_find_imports: Find import statements
 * - ast_validate_pattern: Validate a search pattern
 */
import { getASTGrepEngine, } from './engine.js';
// ============================================
// Tool Implementations
// ============================================
/**
 * Search for code patterns using AST matching
 */
export async function astSearch(params) {
    try {
        const engine = getASTGrepEngine();
        // Check if ast-grep is installed
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const result = await engine.search({
            pattern: params.pattern,
            path: params.path || '.',
            language: params.language,
            include: params.include,
            exclude: params.exclude,
            maxResults: params.maxResults || 50,
        });
        const formatted = formatSearchResult(result);
        return {
            success: true,
            data: {
                matches: result.matches.map(m => ({
                    file: m.file,
                    line: m.line + 1, // 1-indexed for display
                    column: m.column + 1,
                    text: m.text,
                    metaVariables: m.metaVariables,
                })),
                totalMatches: result.totalMatches,
                searchedFiles: result.searchedFiles,
                language: result.language,
            },
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Search and replace code patterns
 */
export async function astReplace(params) {
    try {
        const engine = getASTGrepEngine();
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const result = await engine.replace({
            pattern: params.pattern,
            replacement: params.replacement,
            path: params.path || '.',
            language: params.language,
            include: params.include,
            exclude: params.exclude,
            dryRun: params.dryRun !== false, // Default to dry-run for safety
        });
        const formatted = formatReplaceResult(result, params.dryRun !== false);
        return {
            success: result.success,
            data: result,
            formatted,
            error: result.errors?.join('\n'),
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Apply a built-in refactoring rule
 */
export async function astRefactor(params) {
    try {
        const engine = getASTGrepEngine();
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const rules = engine.getRefactorRules();
        const rule = rules.find(r => r.id === params.ruleId);
        if (!rule) {
            const availableRules = rules.map(r => `  - ${r.id}: ${r.description}`).join('\n');
            return {
                success: false,
                error: `Rule not found: ${params.ruleId}\n\nAvailable rules:\n${availableRules}`,
            };
        }
        const result = await engine.applyRule(rule, params.path || '.', params.dryRun !== false);
        const formatted = formatRefactorResult(rule, result, params.dryRun !== false);
        return {
            success: result.success,
            data: {
                rule: {
                    id: rule.id,
                    name: rule.name,
                    description: rule.description,
                },
                result,
            },
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Find all function definitions
 */
export async function astFindFunctions(params) {
    try {
        const engine = getASTGrepEngine();
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const result = await engine.findFunctions(params.path || '.', params.language);
        const formatted = formatSearchResult(result, 'function');
        return {
            success: true,
            data: {
                functions: result.matches.map(m => ({
                    file: m.file,
                    line: m.line + 1,
                    text: m.text,
                })),
                total: result.totalMatches,
            },
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Find all class definitions
 */
export async function astFindClasses(params) {
    try {
        const engine = getASTGrepEngine();
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const result = await engine.findClasses(params.path || '.', params.language);
        const formatted = formatSearchResult(result, 'class');
        return {
            success: true,
            data: {
                classes: result.matches.map(m => ({
                    file: m.file,
                    line: m.line + 1,
                    text: m.text,
                })),
                total: result.totalMatches,
            },
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Find import statements
 */
export async function astFindImports(params) {
    try {
        const engine = getASTGrepEngine();
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const result = await engine.findImports(params.path || '.', params.moduleName, params.language);
        const formatted = formatSearchResult(result, 'import');
        return {
            success: true,
            data: {
                imports: result.matches.map(m => ({
                    file: m.file,
                    line: m.line + 1,
                    text: m.text,
                })),
                total: result.totalMatches,
            },
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Validate a search pattern
 */
export async function astValidatePattern(params) {
    try {
        const engine = getASTGrepEngine();
        const installed = await engine.isInstalled();
        if (!installed) {
            return {
                success: false,
                error: 'ast-grep (sg) is not installed. Install with: npm install -g @ast-grep/cli',
            };
        }
        const result = await engine.validatePattern(params.pattern, params.language);
        return {
            success: result.valid,
            data: result,
            formatted: result.valid
                ? `Pattern is valid for language: ${params.language}`
                : `Invalid pattern: ${result.error}`,
            error: result.error,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * List available refactoring rules
 */
export async function astListRules() {
    const engine = getASTGrepEngine();
    const rules = engine.getRefactorRules();
    const formatted = formatRulesList(rules);
    return {
        success: true,
        data: rules.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            language: r.language,
            severity: r.severity,
        })),
        formatted,
    };
}
// ============================================
// Formatting Helpers
// ============================================
function formatSearchResult(result, type = 'match') {
    const lines = [];
    if (result.matches.length === 0) {
        lines.push(`No ${type}es found.`);
        return lines.join('\n');
    }
    lines.push(`Found ${result.totalMatches} ${type}(s) in ${result.searchedFiles} file(s):`);
    lines.push('');
    // Group by file
    const grouped = groupByFile(result.matches);
    for (const { file, matches } of grouped) {
        lines.push(`${file}:`);
        for (const match of matches.slice(0, 10)) {
            lines.push(`  ${match.line + 1}: ${truncate(match.text, 80)}`);
        }
        if (matches.length > 10) {
            lines.push(`  ... and ${matches.length - 10} more`);
        }
        lines.push('');
    }
    if (result.totalMatches > result.matches.length) {
        lines.push(`(Showing ${result.matches.length} of ${result.totalMatches} total matches)`);
    }
    return lines.join('\n');
}
function formatReplaceResult(result, isDryRun) {
    const lines = [];
    if (!result.success) {
        lines.push('Replace operation failed.');
        if (result.errors) {
            lines.push('Errors:');
            for (const err of result.errors) {
                lines.push(`  - ${err}`);
            }
        }
        return lines.join('\n');
    }
    if (result.totalReplacements === 0) {
        lines.push('No matches found for replacement.');
        return lines.join('\n');
    }
    const mode = isDryRun ? 'Would replace' : 'Replaced';
    lines.push(`${mode} ${result.totalReplacements} occurrence(s) in ${result.filesChanged} file(s):`);
    lines.push('');
    for (const change of result.changes) {
        lines.push(`  ${change.file}: ${change.replacements} change(s)`);
    }
    if (isDryRun) {
        lines.push('');
        lines.push('(Dry run - no files were modified. Set dryRun: false to apply changes.)');
    }
    return lines.join('\n');
}
function formatRefactorResult(rule, result, isDryRun) {
    const lines = [];
    lines.push(`Refactoring Rule: ${rule.name}`);
    lines.push(`Description: ${rule.description}`);
    lines.push(`Language: ${rule.language}`);
    lines.push('');
    if (!result.success) {
        lines.push('Refactoring failed.');
        if (result.errors) {
            for (const err of result.errors) {
                lines.push(`  - ${err}`);
            }
        }
        return lines.join('\n');
    }
    if (result.totalReplacements === 0) {
        lines.push('No code matching this pattern was found.');
        return lines.join('\n');
    }
    const mode = isDryRun ? 'Would refactor' : 'Refactored';
    lines.push(`${mode} ${result.totalReplacements} occurrence(s) in ${result.filesChanged} file(s).`);
    if (isDryRun) {
        lines.push('');
        lines.push('(Dry run - no files were modified. Set dryRun: false to apply changes.)');
    }
    return lines.join('\n');
}
function formatRulesList(rules) {
    const lines = ['Available Refactoring Rules:', ''];
    // Group by language
    const byLang = new Map();
    for (const rule of rules) {
        const existing = byLang.get(rule.language) || [];
        existing.push(rule);
        byLang.set(rule.language, existing);
    }
    for (const [lang, langRules] of byLang) {
        lines.push(`${lang.toUpperCase()}:`);
        for (const rule of langRules) {
            const severity = rule.severity ? ` [${rule.severity}]` : '';
            lines.push(`  ${rule.id}${severity}`);
            lines.push(`    ${rule.description}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
function groupByFile(matches) {
    const groups = new Map();
    for (const match of matches) {
        const existing = groups.get(match.file) || [];
        existing.push(match);
        groups.set(match.file, existing);
    }
    return Array.from(groups.entries()).map(([file, matches]) => ({ file, matches }));
}
function truncate(text, maxLength) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength)
        return cleaned;
    return cleaned.slice(0, maxLength - 3) + '...';
}
// ============================================
// MCP Tool Definitions
// ============================================
export const astTools = {
    ast_search: {
        name: 'ast_search',
        description: 'Search for code patterns using AST matching. Supports meta-variables like $NAME for any identifier, $$$ARGS for multiple arguments. More precise than regex - matches code structure not text.',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: {
                    type: 'string',
                    description: 'AST pattern to search for. Use $VAR for single nodes, $$$VAR for multiple nodes. Example: "console.log($$$)" matches all console.log calls.',
                },
                path: {
                    type: 'string',
                    description: 'Directory or file to search in (default: current directory)',
                },
                language: {
                    type: 'string',
                    enum: ['typescript', 'javascript', 'python', 'go', 'rust', 'c', 'cpp', 'java'],
                    description: 'Language to search (auto-detected if not specified)',
                },
                include: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Glob patterns to include (e.g., ["**/*.ts"])',
                },
                exclude: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Glob patterns to exclude (e.g., ["**/node_modules/**"])',
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 50)',
                },
            },
            required: ['pattern'],
        },
        handler: astSearch,
    },
    ast_replace: {
        name: 'ast_replace',
        description: 'Replace code patterns using AST matching. SAFE: Uses dry-run by default. Use meta-variables from the pattern in the replacement.',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: {
                    type: 'string',
                    description: 'AST pattern to search for',
                },
                replacement: {
                    type: 'string',
                    description: 'Replacement code. Can use meta-variables from pattern. Example: pattern "var $NAME = $VALUE" replacement "const $NAME = $VALUE"',
                },
                path: {
                    type: 'string',
                    description: 'Directory or file to search in',
                },
                language: {
                    type: 'string',
                    enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
                    description: 'Language to search',
                },
                dryRun: {
                    type: 'boolean',
                    description: 'If true (default), only show what would be changed without modifying files',
                },
            },
            required: ['pattern', 'replacement'],
        },
        handler: astReplace,
    },
    ast_refactor: {
        name: 'ast_refactor',
        description: 'Apply a built-in refactoring rule. Use ast_list_rules to see available rules.',
        inputSchema: {
            type: 'object',
            properties: {
                ruleId: {
                    type: 'string',
                    description: 'ID of the refactoring rule to apply (e.g., "ts-var-to-const")',
                },
                path: {
                    type: 'string',
                    description: 'Directory to apply refactoring to',
                },
                dryRun: {
                    type: 'boolean',
                    description: 'If true (default), only show what would be changed',
                },
            },
            required: ['ruleId'],
        },
        handler: astRefactor,
    },
    ast_find_functions: {
        name: 'ast_find_functions',
        description: 'Find all function definitions in the codebase',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Directory to search in',
                },
                language: {
                    type: 'string',
                    enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
                    description: 'Language to search',
                },
            },
        },
        handler: astFindFunctions,
    },
    ast_find_classes: {
        name: 'ast_find_classes',
        description: 'Find all class definitions in the codebase',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Directory to search in',
                },
                language: {
                    type: 'string',
                    enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
                    description: 'Language to search',
                },
            },
        },
        handler: astFindClasses,
    },
    ast_find_imports: {
        name: 'ast_find_imports',
        description: 'Find import statements, optionally filtering by module name',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Directory to search in',
                },
                moduleName: {
                    type: 'string',
                    description: 'Filter imports by module name (e.g., "react", "lodash")',
                },
                language: {
                    type: 'string',
                    enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
                    description: 'Language to search',
                },
            },
        },
        handler: astFindImports,
    },
    ast_validate_pattern: {
        name: 'ast_validate_pattern',
        description: 'Validate that a pattern is syntactically correct for ast-grep',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: {
                    type: 'string',
                    description: 'Pattern to validate',
                },
                language: {
                    type: 'string',
                    enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
                    description: 'Language for the pattern',
                },
            },
            required: ['pattern', 'language'],
        },
        handler: astValidatePattern,
    },
    ast_list_rules: {
        name: 'ast_list_rules',
        description: 'List all available built-in refactoring rules',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        handler: astListRules,
    },
};
//# sourceMappingURL=mcp-server.js.map