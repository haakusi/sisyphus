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
import { EventEmitter } from 'events';
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
    changes?: {
        [uri: string]: TextEdit[];
    };
    documentChanges?: (TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[];
}
export interface TextEdit {
    range: Range;
    newText: string;
}
export interface TextDocumentEdit {
    textDocument: {
        uri: string;
        version: number | null;
    };
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
export declare enum DiagnosticSeverity {
    Error = 1,
    Warning = 2,
    Information = 3,
    Hint = 4
}
export declare enum SymbolKind {
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
    TypeParameter = 26
}
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
export declare const LANGUAGE_SERVERS: Record<string, LanguageServerInfo>;
export declare class LSPClient extends EventEmitter {
    private config;
    private process;
    private messageBuffer;
    private requestId;
    private pendingRequests;
    private initialized;
    private serverCapabilities;
    private openDocuments;
    private diagnostics;
    constructor(config: LSPClientConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private cleanup;
    private initialize;
    private handleData;
    private handleMessage;
    private handleNotification;
    private sendRequest;
    private sendNotification;
    private send;
    openDocument(filePath: string): Promise<void>;
    closeDocument(filePath: string): Promise<void>;
    updateDocument(filePath: string, content: string): Promise<void>;
    /**
     * Go to definition of symbol at position
     */
    gotoDefinition(filePath: string, line: number, character: number): Promise<Location[]>;
    /**
     * Find all references to symbol at position
     */
    findReferences(filePath: string, line: number, character: number, includeDeclaration?: boolean): Promise<Location[]>;
    /**
     * Get document symbols (outline)
     */
    getDocumentSymbols(filePath: string): Promise<DocumentSymbol[] | SymbolInformation[]>;
    /**
     * Search workspace symbols
     */
    workspaceSymbols(query: string): Promise<SymbolInformation[]>;
    /**
     * Rename symbol at position
     */
    renameSymbol(filePath: string, line: number, character: number, newName: string): Promise<WorkspaceEdit | null>;
    /**
     * Get hover information
     */
    getHover(filePath: string, line: number, character: number): Promise<string | null>;
    /**
     * Get diagnostics for a file
     */
    getDiagnostics(filePath: string): Diagnostic[];
    /**
     * Get all diagnostics
     */
    getAllDiagnostics(): Map<string, Diagnostic[]>;
    private ensureDocumentOpen;
    private pathToUri;
    private uriToPath;
    private getLanguageId;
    private normalizeLocations;
    private normalizeLocation;
    private extractHoverContent;
    private log;
    get isInitialized(): boolean;
    get capabilities(): Record<string, unknown>;
}
export declare function createLSPClient(rootPath: string, language: string): LSPClient;
export declare function detectLanguageServer(filePath: string): string | null;
//# sourceMappingURL=client.d.ts.map