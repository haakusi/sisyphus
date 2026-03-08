/**
 * LSP MCP Server
 *
 * Exposes LSP features as MCP tools for Claude Code.
 *
 * Tools provided:
 * - lsp_goto_definition: Jump to symbol definition
 * - lsp_find_references: Find all references to a symbol
 * - lsp_workspace_symbols: Search symbols across workspace
 * - lsp_document_symbols: Get document outline
 * - lsp_rename: Rename symbol across workspace
 * - lsp_hover: Get hover information
 * - lsp_diagnostics: Get file diagnostics
 */
import { LSPClient } from './client.js';
export interface LSPToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
    formatted?: string;
}
export interface GotoDefinitionParams {
    file: string;
    line: number;
    character: number;
}
export interface FindReferencesParams {
    file: string;
    line: number;
    character: number;
    includeDeclaration?: boolean;
}
export interface WorkspaceSymbolsParams {
    query: string;
    rootPath?: string;
}
export interface DocumentSymbolsParams {
    file: string;
}
export interface RenameParams {
    file: string;
    line: number;
    character: number;
    newName: string;
}
export interface HoverParams {
    file: string;
    line: number;
    character: number;
}
export interface DiagnosticsParams {
    file: string;
    severityFilter?: 'error' | 'warning' | 'info' | 'hint' | 'all';
}
declare class LSPManager {
    private clients;
    private defaultRootPath;
    getClient(filePath: string): Promise<LSPClient>;
    private findProjectRoot;
    shutdown(): Promise<void>;
    setDefaultRootPath(rootPath: string): void;
}
declare const lspManager: LSPManager;
/**
 * Go to definition of symbol at position
 */
export declare function lspGotoDefinition(params: GotoDefinitionParams): Promise<LSPToolResult>;
/**
 * Find all references to symbol at position
 */
export declare function lspFindReferences(params: FindReferencesParams): Promise<LSPToolResult>;
/**
 * Search workspace symbols
 */
export declare function lspWorkspaceSymbols(params: WorkspaceSymbolsParams): Promise<LSPToolResult>;
/**
 * Get document symbols (outline)
 */
export declare function lspDocumentSymbols(params: DocumentSymbolsParams): Promise<LSPToolResult>;
/**
 * Rename symbol at position
 */
export declare function lspRename(params: RenameParams): Promise<LSPToolResult>;
/**
 * Get hover information
 */
export declare function lspHover(params: HoverParams): Promise<LSPToolResult>;
/**
 * Get file diagnostics
 */
export declare function lspDiagnostics(params: DiagnosticsParams): Promise<LSPToolResult>;
export declare const lspTools: {
    lsp_goto_definition: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                file: {
                    type: string;
                    description: string;
                };
                line: {
                    type: string;
                    description: string;
                };
                character: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspGotoDefinition;
    };
    lsp_find_references: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                file: {
                    type: string;
                    description: string;
                };
                line: {
                    type: string;
                    description: string;
                };
                character: {
                    type: string;
                    description: string;
                };
                includeDeclaration: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspFindReferences;
    };
    lsp_workspace_symbols: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                query: {
                    type: string;
                    description: string;
                };
                rootPath: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspWorkspaceSymbols;
    };
    lsp_document_symbols: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                file: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspDocumentSymbols;
    };
    lsp_rename: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                file: {
                    type: string;
                    description: string;
                };
                line: {
                    type: string;
                    description: string;
                };
                character: {
                    type: string;
                    description: string;
                };
                newName: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspRename;
    };
    lsp_hover: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                file: {
                    type: string;
                    description: string;
                };
                line: {
                    type: string;
                    description: string;
                };
                character: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspHover;
    };
    lsp_diagnostics: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                file: {
                    type: string;
                    description: string;
                };
                severityFilter: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
        handler: typeof lspDiagnostics;
    };
};
export { lspManager };
//# sourceMappingURL=mcp-server.d.ts.map