/**
 * LSP Client - Language Server Protocol Client Implementation
 *
 * Provides programmatic access to language server features:
 * - Go to definition
 * - Find references
 * - Workspace symbols
 * - Rename symbol
 * - Get diagnostics
 *
 * Supports TypeScript/JavaScript via typescript-language-server
 * and can be extended for other languages.
 */
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
export var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 1] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 2] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 3] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 4] = "Hint";
})(DiagnosticSeverity || (DiagnosticSeverity = {}));
export var SymbolKind;
(function (SymbolKind) {
    SymbolKind[SymbolKind["File"] = 1] = "File";
    SymbolKind[SymbolKind["Module"] = 2] = "Module";
    SymbolKind[SymbolKind["Namespace"] = 3] = "Namespace";
    SymbolKind[SymbolKind["Package"] = 4] = "Package";
    SymbolKind[SymbolKind["Class"] = 5] = "Class";
    SymbolKind[SymbolKind["Method"] = 6] = "Method";
    SymbolKind[SymbolKind["Property"] = 7] = "Property";
    SymbolKind[SymbolKind["Field"] = 8] = "Field";
    SymbolKind[SymbolKind["Constructor"] = 9] = "Constructor";
    SymbolKind[SymbolKind["Enum"] = 10] = "Enum";
    SymbolKind[SymbolKind["Interface"] = 11] = "Interface";
    SymbolKind[SymbolKind["Function"] = 12] = "Function";
    SymbolKind[SymbolKind["Variable"] = 13] = "Variable";
    SymbolKind[SymbolKind["Constant"] = 14] = "Constant";
    SymbolKind[SymbolKind["String"] = 15] = "String";
    SymbolKind[SymbolKind["Number"] = 16] = "Number";
    SymbolKind[SymbolKind["Boolean"] = 17] = "Boolean";
    SymbolKind[SymbolKind["Array"] = 18] = "Array";
    SymbolKind[SymbolKind["Object"] = 19] = "Object";
    SymbolKind[SymbolKind["Key"] = 20] = "Key";
    SymbolKind[SymbolKind["Null"] = 21] = "Null";
    SymbolKind[SymbolKind["EnumMember"] = 22] = "EnumMember";
    SymbolKind[SymbolKind["Struct"] = 23] = "Struct";
    SymbolKind[SymbolKind["Event"] = 24] = "Event";
    SymbolKind[SymbolKind["Operator"] = 25] = "Operator";
    SymbolKind[SymbolKind["TypeParameter"] = 26] = "TypeParameter";
})(SymbolKind || (SymbolKind = {}));
// Supported language servers
export const LANGUAGE_SERVERS = {
    typescript: {
        name: 'TypeScript Language Server',
        command: 'typescript-language-server',
        args: ['--stdio'],
        languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs'],
    },
    python: {
        name: 'Python Language Server (Pylsp)',
        command: 'pylsp',
        args: [],
        languages: ['python'],
        extensions: ['.py', '.pyi'],
    },
    go: {
        name: 'Go Language Server (gopls)',
        command: 'gopls',
        args: ['serve'],
        languages: ['go'],
        extensions: ['.go'],
    },
    rust: {
        name: 'Rust Analyzer',
        command: 'rust-analyzer',
        args: [],
        languages: ['rust'],
        extensions: ['.rs'],
    },
};
// ============================================
// LSP Client Implementation
// ============================================
export class LSPClient extends EventEmitter {
    config;
    process = null;
    messageBuffer = Buffer.alloc(0);
    requestId = 0;
    pendingRequests = new Map();
    initialized = false;
    serverCapabilities = {};
    openDocuments = new Map();
    diagnostics = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.config.timeout = config.timeout || 30000;
    }
    // ============================================
    // Lifecycle Methods
    // ============================================
    async start() {
        if (this.process) {
            throw new Error('LSP client already started');
        }
        const { serverCommand, serverArgs = [] } = this.config;
        this.process = spawn(serverCommand, serverArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: this.config.rootPath,
            shell: true,
        });
        if (!this.process.stdout || !this.process.stdin) {
            throw new Error('Failed to create stdio pipes');
        }
        this.process.stdout.on('data', (data) => {
            this.handleData(data);
        });
        this.process.stderr?.on('data', (data) => {
            this.log('error', `LSP stderr: ${data.toString()}`);
        });
        this.process.on('error', (error) => {
            this.emit('error', error);
        });
        this.process.on('exit', (code) => {
            this.log('info', `LSP server exited with code ${code}`);
            this.cleanup();
        });
        await this.initialize();
    }
    async stop() {
        if (!this.process)
            return;
        try {
            await this.sendRequest('shutdown', null);
            this.sendNotification('exit', null);
        }
        catch {
            // Ignore errors during shutdown
        }
        this.cleanup();
    }
    cleanup() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        this.initialized = false;
        this.pendingRequests.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(new Error('LSP client stopped'));
        });
        this.pendingRequests.clear();
        this.openDocuments.clear();
        this.diagnostics.clear();
    }
    // ============================================
    // Initialization
    // ============================================
    async initialize() {
        const initParams = {
            processId: process.pid,
            rootUri: `file://${this.config.rootPath}`,
            rootPath: this.config.rootPath,
            capabilities: {
                textDocument: {
                    synchronization: {
                        didSave: true,
                        didOpen: true,
                        didClose: true,
                        didChange: true,
                    },
                    completion: {
                        completionItem: {
                            snippetSupport: true,
                            documentationFormat: ['markdown', 'plaintext'],
                        },
                    },
                    hover: {
                        contentFormat: ['markdown', 'plaintext'],
                    },
                    definition: {
                        linkSupport: true,
                    },
                    references: {},
                    documentSymbol: {
                        hierarchicalDocumentSymbolSupport: true,
                    },
                    rename: {
                        prepareSupport: true,
                    },
                    publishDiagnostics: {
                        relatedInformation: true,
                    },
                },
                workspace: {
                    symbol: {
                        symbolKind: {
                            valueSet: Object.values(SymbolKind).filter(v => typeof v === 'number'),
                        },
                    },
                    workspaceEdit: {
                        documentChanges: true,
                    },
                    workspaceFolders: true,
                },
            },
            initializationOptions: this.config.initializationOptions,
            workspaceFolders: [
                {
                    uri: `file://${this.config.rootPath}`,
                    name: path.basename(this.config.rootPath),
                },
            ],
        };
        const result = await this.sendRequest('initialize', initParams);
        this.serverCapabilities = result.capabilities;
        this.sendNotification('initialized', {});
        this.initialized = true;
        this.log('info', 'LSP client initialized');
    }
    // ============================================
    // Message Handling
    // ============================================
    handleData(data) {
        this.messageBuffer = Buffer.concat([this.messageBuffer, data]);
        while (true) {
            const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
            if (headerEnd === -1)
                break;
            const header = this.messageBuffer.slice(0, headerEnd).toString();
            const contentLengthMatch = header.match(/Content-Length: (\d+)/i);
            if (!contentLengthMatch) {
                this.log('error', 'Invalid LSP message: missing Content-Length');
                this.messageBuffer = this.messageBuffer.slice(headerEnd + 4);
                continue;
            }
            const contentLength = parseInt(contentLengthMatch[1], 10);
            const messageStart = headerEnd + 4;
            const messageEnd = messageStart + contentLength;
            if (this.messageBuffer.length < messageEnd)
                break;
            const content = this.messageBuffer.slice(messageStart, messageEnd).toString();
            this.messageBuffer = this.messageBuffer.slice(messageEnd);
            try {
                const message = JSON.parse(content);
                this.handleMessage(message);
            }
            catch (error) {
                this.log('error', `Failed to parse LSP message: ${error}`);
            }
        }
    }
    handleMessage(message) {
        if ('id' in message && message.id !== null) {
            // Response
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(message.id);
                if (message.error) {
                    pending.reject(new Error(message.error.message));
                }
                else {
                    pending.resolve(message.result);
                }
            }
        }
        else if ('method' in message) {
            // Notification or request from server
            this.handleNotification(message);
        }
    }
    handleNotification(notification) {
        switch (notification.method) {
            case 'textDocument/publishDiagnostics': {
                const params = notification.params;
                this.diagnostics.set(params.uri, params.diagnostics);
                this.emit('diagnostics', params);
                break;
            }
            case 'window/logMessage':
            case 'window/showMessage': {
                const params = notification.params;
                const level = params.type === 1 ? 'error' : params.type === 2 ? 'warn' : 'info';
                this.log(level, params.message);
                break;
            }
        }
    }
    // ============================================
    // Communication Methods
    // ============================================
    sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.process?.stdin) {
                reject(new Error('LSP client not running'));
                return;
            }
            const id = ++this.requestId;
            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params,
            };
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`LSP request timeout: ${method}`));
            }, this.config.timeout);
            this.pendingRequests.set(id, { resolve, reject, timeout });
            this.send(request);
        });
    }
    sendNotification(method, params) {
        if (!this.process?.stdin)
            return;
        const notification = {
            jsonrpc: '2.0',
            method,
            params,
        };
        this.send(notification);
    }
    send(message) {
        const content = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
        this.process?.stdin?.write(header + content);
    }
    // ============================================
    // Document Management
    // ============================================
    async openDocument(filePath) {
        const uri = this.pathToUri(filePath);
        if (this.openDocuments.has(uri))
            return;
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const languageId = this.getLanguageId(filePath);
        this.openDocuments.set(uri, { version: 1, content });
        this.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri,
                languageId,
                version: 1,
                text: content,
            },
        });
    }
    async closeDocument(filePath) {
        const uri = this.pathToUri(filePath);
        if (!this.openDocuments.has(uri))
            return;
        this.openDocuments.delete(uri);
        this.diagnostics.delete(uri);
        this.sendNotification('textDocument/didClose', {
            textDocument: { uri },
        });
    }
    async updateDocument(filePath, content) {
        const uri = this.pathToUri(filePath);
        const doc = this.openDocuments.get(uri);
        if (!doc) {
            await this.openDocument(filePath);
            return;
        }
        doc.version++;
        doc.content = content;
        this.sendNotification('textDocument/didChange', {
            textDocument: { uri, version: doc.version },
            contentChanges: [{ text: content }],
        });
    }
    // ============================================
    // LSP Features
    // ============================================
    /**
     * Go to definition of symbol at position
     */
    async gotoDefinition(filePath, line, character) {
        await this.ensureDocumentOpen(filePath);
        const result = await this.sendRequest('textDocument/definition', {
            textDocument: { uri: this.pathToUri(filePath) },
            position: { line, character },
        });
        return this.normalizeLocations(result);
    }
    /**
     * Find all references to symbol at position
     */
    async findReferences(filePath, line, character, includeDeclaration = true) {
        await this.ensureDocumentOpen(filePath);
        const result = await this.sendRequest('textDocument/references', {
            textDocument: { uri: this.pathToUri(filePath) },
            position: { line, character },
            context: { includeDeclaration },
        });
        return this.normalizeLocations(result);
    }
    /**
     * Get document symbols (outline)
     */
    async getDocumentSymbols(filePath) {
        await this.ensureDocumentOpen(filePath);
        const result = await this.sendRequest('textDocument/documentSymbol', {
            textDocument: { uri: this.pathToUri(filePath) },
        });
        return result || [];
    }
    /**
     * Search workspace symbols
     */
    async workspaceSymbols(query) {
        const result = await this.sendRequest('workspace/symbol', { query });
        return result || [];
    }
    /**
     * Rename symbol at position
     */
    async renameSymbol(filePath, line, character, newName) {
        await this.ensureDocumentOpen(filePath);
        // Check if rename is supported
        const prepareResult = await this.sendRequest('textDocument/prepareRename', {
            textDocument: { uri: this.pathToUri(filePath) },
            position: { line, character },
        }).catch(() => null);
        if (!prepareResult) {
            return null;
        }
        const result = await this.sendRequest('textDocument/rename', {
            textDocument: { uri: this.pathToUri(filePath) },
            position: { line, character },
            newName,
        });
        return result;
    }
    /**
     * Get hover information
     */
    async getHover(filePath, line, character) {
        await this.ensureDocumentOpen(filePath);
        const result = await this.sendRequest('textDocument/hover', {
            textDocument: { uri: this.pathToUri(filePath) },
            position: { line, character },
        });
        if (!result?.contents)
            return null;
        return this.extractHoverContent(result.contents);
    }
    /**
     * Get diagnostics for a file
     */
    getDiagnostics(filePath) {
        const uri = this.pathToUri(filePath);
        return this.diagnostics.get(uri) || [];
    }
    /**
     * Get all diagnostics
     */
    getAllDiagnostics() {
        return new Map(this.diagnostics);
    }
    // ============================================
    // Helper Methods
    // ============================================
    async ensureDocumentOpen(filePath) {
        const uri = this.pathToUri(filePath);
        if (!this.openDocuments.has(uri)) {
            await this.openDocument(filePath);
        }
    }
    pathToUri(filePath) {
        const normalized = path.resolve(filePath).replace(/\\/g, '/');
        return `file:///${normalized.replace(/^\//, '')}`;
    }
    uriToPath(uri) {
        return uri.replace(/^file:\/\/\/?/, '').replace(/\//g, path.sep);
    }
    getLanguageId(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.ts': return 'typescript';
            case '.tsx': return 'typescriptreact';
            case '.js': return 'javascript';
            case '.jsx': return 'javascriptreact';
            case '.mts':
            case '.cts': return 'typescript';
            case '.mjs':
            case '.cjs': return 'javascript';
            case '.py':
            case '.pyi': return 'python';
            case '.go': return 'go';
            case '.rs': return 'rust';
            case '.json': return 'json';
            case '.md': return 'markdown';
            case '.css': return 'css';
            case '.scss': return 'scss';
            case '.html': return 'html';
            default: return 'plaintext';
        }
    }
    normalizeLocations(result) {
        if (!result)
            return [];
        if (Array.isArray(result)) {
            return result.map(loc => this.normalizeLocation(loc)).filter(Boolean);
        }
        const normalized = this.normalizeLocation(result);
        return normalized ? [normalized] : [];
    }
    normalizeLocation(loc) {
        if (!loc || typeof loc !== 'object')
            return null;
        const location = loc;
        // LocationLink
        if ('targetUri' in location) {
            return {
                uri: location.targetUri,
                range: (location.targetSelectionRange || location.targetRange),
            };
        }
        // Location
        if ('uri' in location && 'range' in location) {
            return {
                uri: location.uri,
                range: location.range,
            };
        }
        return null;
    }
    extractHoverContent(contents) {
        if (typeof contents === 'string') {
            return contents;
        }
        if (Array.isArray(contents)) {
            return contents.map(c => this.extractHoverContent(c)).join('\n\n');
        }
        if (typeof contents === 'object' && contents !== null) {
            const obj = contents;
            if ('value' in obj) {
                return obj.value;
            }
            if ('contents' in obj) {
                return this.extractHoverContent(obj.contents);
            }
        }
        return String(contents);
    }
    log(level, message) {
        const configLevel = this.config.logLevel || 'info';
        const levels = ['debug', 'info', 'warn', 'error'];
        if (levels.indexOf(level) >= levels.indexOf(configLevel)) {
            const timestamp = new Date().toISOString();
            console[level === 'debug' ? 'log' : level](`[LSP ${timestamp}] ${message}`);
        }
    }
    // ============================================
    // Public Getters
    // ============================================
    get isInitialized() {
        return this.initialized;
    }
    get capabilities() {
        return this.serverCapabilities;
    }
}
// ============================================
// Factory Functions
// ============================================
export function createLSPClient(rootPath, language) {
    const serverInfo = LANGUAGE_SERVERS[language];
    if (!serverInfo) {
        throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_SERVERS).join(', ')}`);
    }
    return new LSPClient({
        serverCommand: serverInfo.command,
        serverArgs: serverInfo.args,
        rootPath,
        logLevel: 'info',
    });
}
export function detectLanguageServer(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    for (const [lang, info] of Object.entries(LANGUAGE_SERVERS)) {
        if (info.extensions.includes(ext)) {
            return lang;
        }
    }
    return null;
}
//# sourceMappingURL=client.js.map