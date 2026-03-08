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

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

// ============================================
// LSP Protocol Types
// ============================================

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export interface TextDocumentIdentifier {
  uri: string;
}

export interface TextDocumentPositionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export interface DocumentSymbol {
  name: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export interface SymbolInformation {
  name: string;
  kind: SymbolKind;
  location: Location;
  containerName?: string;
}

export interface WorkspaceEdit {
  changes?: { [uri: string]: TextEdit[] };
  documentChanges?: (TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[];
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface TextDocumentEdit {
  textDocument: { uri: string; version: number | null };
  edits: TextEdit[];
}

export interface CreateFile {
  kind: 'create';
  uri: string;
}

export interface RenameFile {
  kind: 'rename';
  oldUri: string;
  newUri: string;
}

export interface DeleteFile {
  kind: 'delete';
  uri: string;
}

export interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}

export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

// ============================================
// LSP Message Types
// ============================================

interface JsonRpcMessage {
  jsonrpc: '2.0';
}

interface JsonRpcRequest extends JsonRpcMessage {
  id: number | string;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse extends JsonRpcMessage {
  id: number | string | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface JsonRpcNotification extends JsonRpcMessage {
  method: string;
  params?: unknown;
}

// ============================================
// LSP Client Configuration
// ============================================

export interface LSPClientConfig {
  serverCommand: string;
  serverArgs?: string[];
  rootPath: string;
  initializationOptions?: Record<string, unknown>;
  timeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface LanguageServerInfo {
  name: string;
  command: string;
  args: string[];
  languages: string[];
  extensions: string[];
}

// Supported language servers
export const LANGUAGE_SERVERS: Record<string, LanguageServerInfo> = {
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
  private process: ChildProcess | null = null;
  private messageBuffer: Buffer = Buffer.alloc(0);
  private requestId: number = 0;
  private pendingRequests: Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private initialized: boolean = false;
  private serverCapabilities: Record<string, unknown> = {};
  private openDocuments: Map<string, { version: number; content: string }> = new Map();
  private diagnostics: Map<string, Diagnostic[]> = new Map();

  constructor(private config: LSPClientConfig) {
    super();
    this.config.timeout = config.timeout || 30000;
  }

  // ============================================
  // Lifecycle Methods
  // ============================================

  async start(): Promise<void> {
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

    this.process.stdout.on('data', (data: Buffer) => {
      this.handleData(data);
    });

    this.process.stderr?.on('data', (data: Buffer) => {
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

  async stop(): Promise<void> {
    if (!this.process) return;

    try {
      await this.sendRequest('shutdown', null);
      this.sendNotification('exit', null);
    } catch {
      // Ignore errors during shutdown
    }

    this.cleanup();
  }

  private cleanup(): void {
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

  private async initialize(): Promise<void> {
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

    const result = await this.sendRequest('initialize', initParams) as {
      capabilities: Record<string, unknown>;
    };

    this.serverCapabilities = result.capabilities;
    this.sendNotification('initialized', {});
    this.initialized = true;

    this.log('info', 'LSP client initialized');
  }

  // ============================================
  // Message Handling
  // ============================================

  private handleData(data: Buffer): void {
    this.messageBuffer = Buffer.concat([this.messageBuffer, data]);

    while (true) {
      const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

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

      if (this.messageBuffer.length < messageEnd) break;

      const content = this.messageBuffer.slice(messageStart, messageEnd).toString();
      this.messageBuffer = this.messageBuffer.slice(messageEnd);

      try {
        const message = JSON.parse(content);
        this.handleMessage(message);
      } catch (error) {
        this.log('error', `Failed to parse LSP message: ${error}`);
      }
    }
  }

  private handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    if ('id' in message && message.id !== null) {
      // Response
      const pending = this.pendingRequests.get(message.id as number);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id as number);

        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if ('method' in message) {
      // Notification or request from server
      this.handleNotification(message as JsonRpcNotification);
    }
  }

  private handleNotification(notification: JsonRpcNotification): void {
    switch (notification.method) {
      case 'textDocument/publishDiagnostics': {
        const params = notification.params as {
          uri: string;
          diagnostics: Diagnostic[];
        };
        this.diagnostics.set(params.uri, params.diagnostics);
        this.emit('diagnostics', params);
        break;
      }
      case 'window/logMessage':
      case 'window/showMessage': {
        const params = notification.params as { type: number; message: string };
        const level = params.type === 1 ? 'error' : params.type === 2 ? 'warn' : 'info';
        this.log(level as 'info' | 'warn' | 'error', params.message);
        break;
      }
    }
  }

  // ============================================
  // Communication Methods
  // ============================================

  private sendRequest(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error('LSP client not running'));
        return;
      }

      const id = ++this.requestId;
      const request: JsonRpcRequest = {
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

  private sendNotification(method: string, params: unknown): void {
    if (!this.process?.stdin) return;

    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.send(notification);
  }

  private send(message: JsonRpcRequest | JsonRpcNotification): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    this.process?.stdin?.write(header + content);
  }

  // ============================================
  // Document Management
  // ============================================

  async openDocument(filePath: string): Promise<void> {
    const uri = this.pathToUri(filePath);

    if (this.openDocuments.has(uri)) return;

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

  async closeDocument(filePath: string): Promise<void> {
    const uri = this.pathToUri(filePath);

    if (!this.openDocuments.has(uri)) return;

    this.openDocuments.delete(uri);
    this.diagnostics.delete(uri);

    this.sendNotification('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  async updateDocument(filePath: string, content: string): Promise<void> {
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
  async gotoDefinition(filePath: string, line: number, character: number): Promise<Location[]> {
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
  async findReferences(
    filePath: string,
    line: number,
    character: number,
    includeDeclaration: boolean = true
  ): Promise<Location[]> {
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
  async getDocumentSymbols(filePath: string): Promise<DocumentSymbol[] | SymbolInformation[]> {
    await this.ensureDocumentOpen(filePath);

    const result = await this.sendRequest('textDocument/documentSymbol', {
      textDocument: { uri: this.pathToUri(filePath) },
    });

    return (result as DocumentSymbol[] | SymbolInformation[]) || [];
  }

  /**
   * Search workspace symbols
   */
  async workspaceSymbols(query: string): Promise<SymbolInformation[]> {
    const result = await this.sendRequest('workspace/symbol', { query });
    return (result as SymbolInformation[]) || [];
  }

  /**
   * Rename symbol at position
   */
  async renameSymbol(
    filePath: string,
    line: number,
    character: number,
    newName: string
  ): Promise<WorkspaceEdit | null> {
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

    return result as WorkspaceEdit;
  }

  /**
   * Get hover information
   */
  async getHover(filePath: string, line: number, character: number): Promise<string | null> {
    await this.ensureDocumentOpen(filePath);

    const result = await this.sendRequest('textDocument/hover', {
      textDocument: { uri: this.pathToUri(filePath) },
      position: { line, character },
    }) as { contents: unknown } | null;

    if (!result?.contents) return null;

    return this.extractHoverContent(result.contents);
  }

  /**
   * Get diagnostics for a file
   */
  getDiagnostics(filePath: string): Diagnostic[] {
    const uri = this.pathToUri(filePath);
    return this.diagnostics.get(uri) || [];
  }

  /**
   * Get all diagnostics
   */
  getAllDiagnostics(): Map<string, Diagnostic[]> {
    return new Map(this.diagnostics);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async ensureDocumentOpen(filePath: string): Promise<void> {
    const uri = this.pathToUri(filePath);
    if (!this.openDocuments.has(uri)) {
      await this.openDocument(filePath);
    }
  }

  private pathToUri(filePath: string): string {
    const normalized = path.resolve(filePath).replace(/\\/g, '/');
    return `file:///${normalized.replace(/^\//, '')}`;
  }

  private uriToPath(uri: string): string {
    return uri.replace(/^file:\/\/\/?/, '').replace(/\//g, path.sep);
  }

  private getLanguageId(filePath: string): string {
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

  private normalizeLocations(result: unknown): Location[] {
    if (!result) return [];
    if (Array.isArray(result)) {
      return result.map(loc => this.normalizeLocation(loc)).filter(Boolean) as Location[];
    }
    const normalized = this.normalizeLocation(result);
    return normalized ? [normalized] : [];
  }

  private normalizeLocation(loc: unknown): Location | null {
    if (!loc || typeof loc !== 'object') return null;

    const location = loc as Record<string, unknown>;

    // LocationLink
    if ('targetUri' in location) {
      return {
        uri: location.targetUri as string,
        range: (location.targetSelectionRange || location.targetRange) as Range,
      };
    }

    // Location
    if ('uri' in location && 'range' in location) {
      return {
        uri: location.uri as string,
        range: location.range as Range,
      };
    }

    return null;
  }

  private extractHoverContent(contents: unknown): string {
    if (typeof contents === 'string') {
      return contents;
    }

    if (Array.isArray(contents)) {
      return contents.map(c => this.extractHoverContent(c)).join('\n\n');
    }

    if (typeof contents === 'object' && contents !== null) {
      const obj = contents as Record<string, unknown>;
      if ('value' in obj) {
        return obj.value as string;
      }
      if ('contents' in obj) {
        return this.extractHoverContent(obj.contents);
      }
    }

    return String(contents);
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
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

  get isInitialized(): boolean {
    return this.initialized;
  }

  get capabilities(): Record<string, unknown> {
    return this.serverCapabilities;
  }
}

// ============================================
// Factory Functions
// ============================================

export function createLSPClient(rootPath: string, language: string): LSPClient {
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

export function detectLanguageServer(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();

  for (const [lang, info] of Object.entries(LANGUAGE_SERVERS)) {
    if (info.extensions.includes(ext)) {
      return lang;
    }
  }

  return null;
}
