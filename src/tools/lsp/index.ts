/**
 * LSP Tools Module
 *
 * Exports LSP client and MCP tools for language server features.
 */

export {
  LSPClient,
  createLSPClient,
  detectLanguageServer,
  LANGUAGE_SERVERS,
  type LSPClientConfig,
  type LanguageServerInfo,
  type Position,
  type Range,
  type Location,
  type DocumentSymbol,
  type SymbolInformation,
  type WorkspaceEdit,
  type Diagnostic,
  DiagnosticSeverity,
  SymbolKind,
} from './client.js';

export {
  lspTools,
  lspManager,
  lspGotoDefinition,
  lspFindReferences,
  lspWorkspaceSymbols,
  lspDocumentSymbols,
  lspRename,
  lspHover,
  lspDiagnostics,
  type LSPToolResult,
  type GotoDefinitionParams,
  type FindReferencesParams,
  type WorkspaceSymbolsParams,
  type DocumentSymbolsParams,
  type RenameParams,
  type HoverParams,
  type DiagnosticsParams,
} from './mcp-server.js';
