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
import { createLSPClient, detectLanguageServer, DiagnosticSeverity, SymbolKind, } from './client.js';
import * as path from 'path';
import * as fs from 'fs';
// ============================================
// LSP Manager - Manages multiple LSP clients
// ============================================
class LSPManager {
    clients = new Map();
    defaultRootPath = process.cwd();
    async getClient(filePath) {
        const language = detectLanguageServer(filePath);
        if (!language) {
            throw new Error(`No language server available for: ${filePath}`);
        }
        const rootPath = await this.findProjectRoot(filePath);
        const clientKey = `${language}:${rootPath}`;
        let client = this.clients.get(clientKey);
        if (!client) {
            client = createLSPClient(rootPath, language);
            await client.start();
            this.clients.set(clientKey, client);
        }
        return client;
    }
    async findProjectRoot(filePath) {
        let dir = path.dirname(path.resolve(filePath));
        while (dir !== path.parse(dir).root) {
            // Check for common project markers
            const markers = ['package.json', 'tsconfig.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', '.git'];
            for (const marker of markers) {
                if (fs.existsSync(path.join(dir, marker))) {
                    return dir;
                }
            }
            dir = path.dirname(dir);
        }
        return this.defaultRootPath;
    }
    async shutdown() {
        for (const client of this.clients.values()) {
            await client.stop();
        }
        this.clients.clear();
    }
    setDefaultRootPath(rootPath) {
        this.defaultRootPath = rootPath;
    }
}
const lspManager = new LSPManager();
// ============================================
// Tool Implementations
// ============================================
/**
 * Go to definition of symbol at position
 */
export async function lspGotoDefinition(params) {
    try {
        const { file, line, character } = params;
        const absolutePath = path.resolve(file);
        if (!fs.existsSync(absolutePath)) {
            return { success: false, error: `File not found: ${file}` };
        }
        const client = await lspManager.getClient(absolutePath);
        const locations = await client.gotoDefinition(absolutePath, line, character);
        if (locations.length === 0) {
            return {
                success: true,
                data: [],
                formatted: 'No definition found at this position.',
            };
        }
        const formatted = formatLocations(locations, 'Definition');
        return {
            success: true,
            data: locations.map(loc => ({
                file: uriToPath(loc.uri),
                line: loc.range.start.line,
                character: loc.range.start.character,
                endLine: loc.range.end.line,
                endCharacter: loc.range.end.character,
            })),
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Find all references to symbol at position
 */
export async function lspFindReferences(params) {
    try {
        const { file, line, character, includeDeclaration = true } = params;
        const absolutePath = path.resolve(file);
        if (!fs.existsSync(absolutePath)) {
            return { success: false, error: `File not found: ${file}` };
        }
        const client = await lspManager.getClient(absolutePath);
        const locations = await client.findReferences(absolutePath, line, character, includeDeclaration);
        if (locations.length === 0) {
            return {
                success: true,
                data: [],
                formatted: 'No references found.',
            };
        }
        const formatted = formatLocations(locations, 'Reference');
        return {
            success: true,
            data: locations.map(loc => ({
                file: uriToPath(loc.uri),
                line: loc.range.start.line,
                character: loc.range.start.character,
            })),
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Search workspace symbols
 */
export async function lspWorkspaceSymbols(params) {
    try {
        const { query, rootPath } = params;
        if (rootPath) {
            lspManager.setDefaultRootPath(rootPath);
        }
        // Use a TypeScript file to get the client (most common use case)
        const tsConfigPath = path.join(rootPath || process.cwd(), 'tsconfig.json');
        const dummyTsFile = path.join(rootPath || process.cwd(), 'index.ts');
        let clientPath;
        if (fs.existsSync(tsConfigPath)) {
            clientPath = dummyTsFile;
        }
        else {
            return { success: false, error: 'No TypeScript project found. Workspace symbols require a project root.' };
        }
        const client = await lspManager.getClient(clientPath);
        const symbols = await client.workspaceSymbols(query);
        if (symbols.length === 0) {
            return {
                success: true,
                data: [],
                formatted: `No symbols found matching "${query}".`,
            };
        }
        const formatted = formatSymbols(symbols);
        return {
            success: true,
            data: symbols.map(sym => ({
                name: sym.name,
                kind: SymbolKind[sym.kind],
                file: uriToPath(sym.location.uri),
                line: sym.location.range.start.line,
                containerName: sym.containerName,
            })),
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Get document symbols (outline)
 */
export async function lspDocumentSymbols(params) {
    try {
        const { file } = params;
        const absolutePath = path.resolve(file);
        if (!fs.existsSync(absolutePath)) {
            return { success: false, error: `File not found: ${file}` };
        }
        const client = await lspManager.getClient(absolutePath);
        const symbols = await client.getDocumentSymbols(absolutePath);
        if (symbols.length === 0) {
            return {
                success: true,
                data: [],
                formatted: 'No symbols found in document.',
            };
        }
        const formatted = formatDocumentSymbols(symbols);
        return {
            success: true,
            data: symbols,
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Rename symbol at position
 */
export async function lspRename(params) {
    try {
        const { file, line, character, newName } = params;
        const absolutePath = path.resolve(file);
        if (!fs.existsSync(absolutePath)) {
            return { success: false, error: `File not found: ${file}` };
        }
        if (!newName || newName.trim() === '') {
            return { success: false, error: 'New name cannot be empty.' };
        }
        const client = await lspManager.getClient(absolutePath);
        const workspaceEdit = await client.renameSymbol(absolutePath, line, character, newName);
        if (!workspaceEdit) {
            return {
                success: false,
                error: 'Cannot rename symbol at this position.',
            };
        }
        const formatted = formatWorkspaceEdit(workspaceEdit);
        const summary = summarizeWorkspaceEdit(workspaceEdit);
        return {
            success: true,
            data: {
                edit: workspaceEdit,
                summary,
            },
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Get hover information
 */
export async function lspHover(params) {
    try {
        const { file, line, character } = params;
        const absolutePath = path.resolve(file);
        if (!fs.existsSync(absolutePath)) {
            return { success: false, error: `File not found: ${file}` };
        }
        const client = await lspManager.getClient(absolutePath);
        const hover = await client.getHover(absolutePath, line, character);
        if (!hover) {
            return {
                success: true,
                data: null,
                formatted: 'No hover information available.',
            };
        }
        return {
            success: true,
            data: hover,
            formatted: hover,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
/**
 * Get file diagnostics
 */
export async function lspDiagnostics(params) {
    try {
        const { file, severityFilter = 'all' } = params;
        const absolutePath = path.resolve(file);
        if (!fs.existsSync(absolutePath)) {
            return { success: false, error: `File not found: ${file}` };
        }
        const client = await lspManager.getClient(absolutePath);
        // Open the document to trigger diagnostics
        await client.openDocument(absolutePath);
        // Wait a bit for diagnostics to arrive
        await new Promise(resolve => setTimeout(resolve, 500));
        let diagnostics = client.getDiagnostics(absolutePath);
        // Filter by severity
        if (severityFilter !== 'all') {
            const severityMap = {
                error: DiagnosticSeverity.Error,
                warning: DiagnosticSeverity.Warning,
                info: DiagnosticSeverity.Information,
                hint: DiagnosticSeverity.Hint,
            };
            const targetSeverity = severityMap[severityFilter];
            diagnostics = diagnostics.filter(d => d.severity === targetSeverity);
        }
        if (diagnostics.length === 0) {
            return {
                success: true,
                data: [],
                formatted: severityFilter === 'all'
                    ? 'No diagnostics found.'
                    : `No ${severityFilter} diagnostics found.`,
            };
        }
        const formatted = formatDiagnostics(diagnostics, file);
        return {
            success: true,
            data: diagnostics.map(d => ({
                line: d.range.start.line,
                character: d.range.start.character,
                severity: DiagnosticSeverity[d.severity || 1],
                message: d.message,
                source: d.source,
                code: d.code,
            })),
            formatted,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
// ============================================
// Formatting Helpers
// ============================================
function uriToPath(uri) {
    return uri.replace(/^file:\/\/\/?/, '').replace(/\//g, path.sep);
}
function formatLocations(locations, type) {
    const lines = [`Found ${locations.length} ${type.toLowerCase()}(s):\n`];
    for (const loc of locations) {
        const filePath = uriToPath(loc.uri);
        const line = loc.range.start.line + 1; // 1-indexed for display
        const char = loc.range.start.character + 1;
        lines.push(`  ${filePath}:${line}:${char}`);
    }
    return lines.join('\n');
}
function formatSymbols(symbols) {
    const lines = [`Found ${symbols.length} symbol(s):\n`];
    for (const sym of symbols) {
        const filePath = uriToPath(sym.location.uri);
        const line = sym.location.range.start.line + 1;
        const kind = SymbolKind[sym.kind] || 'Unknown';
        const container = sym.containerName ? ` (in ${sym.containerName})` : '';
        lines.push(`  [${kind}] ${sym.name}${container}`);
        lines.push(`    ${filePath}:${line}`);
    }
    return lines.join('\n');
}
function formatDocumentSymbols(symbols, indent = 0) {
    const lines = [];
    const prefix = '  '.repeat(indent);
    for (const sym of symbols) {
        if ('children' in sym) {
            // DocumentSymbol
            const kind = SymbolKind[sym.kind] || 'Unknown';
            const line = sym.range.start.line + 1;
            lines.push(`${prefix}[${kind}] ${sym.name} (line ${line})`);
            if (sym.children && sym.children.length > 0) {
                lines.push(formatDocumentSymbols(sym.children, indent + 1));
            }
        }
        else {
            // SymbolInformation
            const symInfo = sym;
            const kind = SymbolKind[symInfo.kind] || 'Unknown';
            const line = symInfo.location.range.start.line + 1;
            lines.push(`${prefix}[${kind}] ${symInfo.name} (line ${line})`);
        }
    }
    return lines.join('\n');
}
function formatWorkspaceEdit(edit) {
    const lines = ['Rename will affect the following files:\n'];
    if (edit.changes) {
        for (const [uri, edits] of Object.entries(edit.changes)) {
            const filePath = uriToPath(uri);
            lines.push(`  ${filePath}: ${edits.length} change(s)`);
            for (const e of edits.slice(0, 5)) {
                lines.push(`    Line ${e.range.start.line + 1}: "${e.newText}"`);
            }
            if (edits.length > 5) {
                lines.push(`    ... and ${edits.length - 5} more`);
            }
        }
    }
    if (edit.documentChanges) {
        for (const change of edit.documentChanges) {
            if ('textDocument' in change) {
                const filePath = uriToPath(change.textDocument.uri);
                lines.push(`  ${filePath}: ${change.edits.length} change(s)`);
            }
            else if ('kind' in change) {
                if (change.kind === 'rename') {
                    lines.push(`  Rename file: ${change.oldUri} -> ${change.newUri}`);
                }
                else if (change.kind === 'create') {
                    lines.push(`  Create file: ${change.uri}`);
                }
                else if (change.kind === 'delete') {
                    lines.push(`  Delete file: ${change.uri}`);
                }
            }
        }
    }
    return lines.join('\n');
}
function summarizeWorkspaceEdit(edit) {
    let files = 0;
    let changes = 0;
    if (edit.changes) {
        files = Object.keys(edit.changes).length;
        changes = Object.values(edit.changes).reduce((sum, edits) => sum + edits.length, 0);
    }
    if (edit.documentChanges) {
        for (const change of edit.documentChanges) {
            if ('textDocument' in change) {
                files++;
                changes += change.edits.length;
            }
            else {
                files++;
                changes++;
            }
        }
    }
    return { files, changes };
}
function formatDiagnostics(diagnostics, file) {
    const lines = [`Diagnostics for ${file}:\n`];
    const severityIcon = {
        [DiagnosticSeverity.Error]: 'ERROR',
        [DiagnosticSeverity.Warning]: 'WARN',
        [DiagnosticSeverity.Information]: 'INFO',
        [DiagnosticSeverity.Hint]: 'HINT',
    };
    for (const d of diagnostics) {
        const line = d.range.start.line + 1;
        const char = d.range.start.character + 1;
        const severity = severityIcon[d.severity || 1];
        const source = d.source ? `[${d.source}]` : '';
        const code = d.code ? ` (${d.code})` : '';
        lines.push(`  ${line}:${char} ${severity}${source}${code}`);
        lines.push(`    ${d.message}`);
    }
    return lines.join('\n');
}
// ============================================
// MCP Tool Definitions (for registration)
// ============================================
export const lspTools = {
    lsp_goto_definition: {
        name: 'lsp_goto_definition',
        description: 'Jump to the definition of a symbol at the given position. Returns file path and line number of the definition.',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Path to the source file',
                },
                line: {
                    type: 'number',
                    description: 'Zero-indexed line number',
                },
                character: {
                    type: 'number',
                    description: 'Zero-indexed character position',
                },
            },
            required: ['file', 'line', 'character'],
        },
        handler: lspGotoDefinition,
    },
    lsp_find_references: {
        name: 'lsp_find_references',
        description: 'Find all references to a symbol at the given position across the workspace.',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Path to the source file',
                },
                line: {
                    type: 'number',
                    description: 'Zero-indexed line number',
                },
                character: {
                    type: 'number',
                    description: 'Zero-indexed character position',
                },
                includeDeclaration: {
                    type: 'boolean',
                    description: 'Include the declaration in results (default: true)',
                },
            },
            required: ['file', 'line', 'character'],
        },
        handler: lspFindReferences,
    },
    lsp_workspace_symbols: {
        name: 'lsp_workspace_symbols',
        description: 'Search for symbols across the entire workspace by name.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Symbol name or pattern to search for',
                },
                rootPath: {
                    type: 'string',
                    description: 'Root path of the workspace (optional)',
                },
            },
            required: ['query'],
        },
        handler: lspWorkspaceSymbols,
    },
    lsp_document_symbols: {
        name: 'lsp_document_symbols',
        description: 'Get the document outline showing all symbols (functions, classes, variables, etc.) in a file.',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Path to the source file',
                },
            },
            required: ['file'],
        },
        handler: lspDocumentSymbols,
    },
    lsp_rename: {
        name: 'lsp_rename',
        description: 'Rename a symbol across the entire workspace. Returns the list of files and changes that would be made.',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Path to the source file',
                },
                line: {
                    type: 'number',
                    description: 'Zero-indexed line number',
                },
                character: {
                    type: 'number',
                    description: 'Zero-indexed character position',
                },
                newName: {
                    type: 'string',
                    description: 'New name for the symbol',
                },
            },
            required: ['file', 'line', 'character', 'newName'],
        },
        handler: lspRename,
    },
    lsp_hover: {
        name: 'lsp_hover',
        description: 'Get hover information (type info, documentation) for a symbol at the given position.',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Path to the source file',
                },
                line: {
                    type: 'number',
                    description: 'Zero-indexed line number',
                },
                character: {
                    type: 'number',
                    description: 'Zero-indexed character position',
                },
            },
            required: ['file', 'line', 'character'],
        },
        handler: lspHover,
    },
    lsp_diagnostics: {
        name: 'lsp_diagnostics',
        description: 'Get diagnostics (errors, warnings) for a file.',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Path to the source file',
                },
                severityFilter: {
                    type: 'string',
                    enum: ['error', 'warning', 'info', 'hint', 'all'],
                    description: 'Filter diagnostics by severity (default: all)',
                },
            },
            required: ['file'],
        },
        handler: lspDiagnostics,
    },
};
// Export manager for cleanup
export { lspManager };
//# sourceMappingURL=mcp-server.js.map