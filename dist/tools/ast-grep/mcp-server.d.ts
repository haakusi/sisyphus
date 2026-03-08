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
export interface ASTToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
    formatted?: string;
}
export interface ASTSearchParams {
    pattern: string;
    path?: string;
    language?: string;
    include?: string[];
    exclude?: string[];
    maxResults?: number;
}
export interface ASTReplaceParams {
    pattern: string;
    replacement: string;
    path?: string;
    language?: string;
    include?: string[];
    exclude?: string[];
    dryRun?: boolean;
}
export interface ASTRefactorParams {
    ruleId: string;
    path?: string;
    dryRun?: boolean;
}
export interface ASTFindParams {
    path?: string;
    language?: string;
}
export interface ASTFindImportsParams extends ASTFindParams {
    moduleName?: string;
}
export interface ASTValidateParams {
    pattern: string;
    language: string;
}
/**
 * Search for code patterns using AST matching
 */
export declare function astSearch(params: ASTSearchParams): Promise<ASTToolResult>;
/**
 * Search and replace code patterns
 */
export declare function astReplace(params: ASTReplaceParams): Promise<ASTToolResult>;
/**
 * Apply a built-in refactoring rule
 */
export declare function astRefactor(params: ASTRefactorParams): Promise<ASTToolResult>;
/**
 * Find all function definitions
 */
export declare function astFindFunctions(params: ASTFindParams): Promise<ASTToolResult>;
/**
 * Find all class definitions
 */
export declare function astFindClasses(params: ASTFindParams): Promise<ASTToolResult>;
/**
 * Find import statements
 */
export declare function astFindImports(params: ASTFindImportsParams): Promise<ASTToolResult>;
/**
 * Validate a search pattern
 */
export declare function astValidatePattern(params: ASTValidateParams): Promise<ASTToolResult>;
/**
 * List available refactoring rules
 */
export declare function astListRules(): Promise<ASTToolResult>;
export declare const astTools: {
    ast_search: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                pattern: {
                    type: string;
                    description: string;
                };
                path: {
                    type: string;
                    description: string;
                };
                language: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                include: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                exclude: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                maxResults: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof astSearch;
    };
    ast_replace: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                pattern: {
                    type: string;
                    description: string;
                };
                replacement: {
                    type: string;
                    description: string;
                };
                path: {
                    type: string;
                    description: string;
                };
                language: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                dryRun: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof astReplace;
    };
    ast_refactor: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                ruleId: {
                    type: string;
                    description: string;
                };
                path: {
                    type: string;
                    description: string;
                };
                dryRun: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof astRefactor;
    };
    ast_find_functions: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                path: {
                    type: string;
                    description: string;
                };
                language: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
        };
        handler: typeof astFindFunctions;
    };
    ast_find_classes: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                path: {
                    type: string;
                    description: string;
                };
                language: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
        };
        handler: typeof astFindClasses;
    };
    ast_find_imports: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                path: {
                    type: string;
                    description: string;
                };
                moduleName: {
                    type: string;
                    description: string;
                };
                language: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
        };
        handler: typeof astFindImports;
    };
    ast_validate_pattern: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                pattern: {
                    type: string;
                    description: string;
                };
                language: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof astValidatePattern;
    };
    ast_list_rules: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {};
        };
        handler: typeof astListRules;
    };
};
//# sourceMappingURL=mcp-server.d.ts.map