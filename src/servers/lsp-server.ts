#!/usr/bin/env node
/**
 * Sisyphus LSP MCP Server
 *
 * Standalone MCP server that provides LSP features to Claude Code.
 * Run with: node dist/servers/lsp-server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import {
  lspGotoDefinition,
  lspFindReferences,
  lspWorkspaceSymbols,
  lspDocumentSymbols,
  lspRename,
  lspHover,
  lspDiagnostics,
} from '../tools/lsp/mcp-server.js';

// Create server instance
const server = new Server(
  {
    name: 'sisyphus-lsp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'lsp_goto_definition',
        description: 'Jump to the definition of a symbol at the given position. Returns file path and line number.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            file: { type: 'string', description: 'Path to the source file' },
            line: { type: 'number', description: 'Zero-indexed line number' },
            character: { type: 'number', description: 'Zero-indexed character position' },
          },
          required: ['file', 'line', 'character'],
        },
      },
      {
        name: 'lsp_find_references',
        description: 'Find all references to a symbol at the given position across the workspace.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            file: { type: 'string', description: 'Path to the source file' },
            line: { type: 'number', description: 'Zero-indexed line number' },
            character: { type: 'number', description: 'Zero-indexed character position' },
            includeDeclaration: { type: 'boolean', description: 'Include declaration in results' },
          },
          required: ['file', 'line', 'character'],
        },
      },
      {
        name: 'lsp_workspace_symbols',
        description: 'Search for symbols across the entire workspace by name.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Symbol name or pattern to search' },
            rootPath: { type: 'string', description: 'Root path of workspace' },
          },
          required: ['query'],
        },
      },
      {
        name: 'lsp_document_symbols',
        description: 'Get document outline showing all symbols in a file.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            file: { type: 'string', description: 'Path to the source file' },
          },
          required: ['file'],
        },
      },
      {
        name: 'lsp_rename',
        description: 'Rename a symbol across the entire workspace. Returns the list of changes.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            file: { type: 'string', description: 'Path to the source file' },
            line: { type: 'number', description: 'Zero-indexed line number' },
            character: { type: 'number', description: 'Zero-indexed character position' },
            newName: { type: 'string', description: 'New name for the symbol' },
          },
          required: ['file', 'line', 'character', 'newName'],
        },
      },
      {
        name: 'lsp_hover',
        description: 'Get hover information (type info, documentation) for a symbol.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            file: { type: 'string', description: 'Path to the source file' },
            line: { type: 'number', description: 'Zero-indexed line number' },
            character: { type: 'number', description: 'Zero-indexed character position' },
          },
          required: ['file', 'line', 'character'],
        },
      },
      {
        name: 'lsp_diagnostics',
        description: 'Get diagnostics (errors, warnings) for a file.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            file: { type: 'string', description: 'Path to the source file' },
            severityFilter: {
              type: 'string',
              enum: ['error', 'warning', 'info', 'hint', 'all'],
              description: 'Filter by severity',
            },
          },
          required: ['file'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'lsp_goto_definition':
        result = await lspGotoDefinition(args as { file: string; line: number; character: number });
        break;

      case 'lsp_find_references':
        result = await lspFindReferences(args as { file: string; line: number; character: number; includeDeclaration?: boolean });
        break;

      case 'lsp_workspace_symbols':
        result = await lspWorkspaceSymbols(args as { query: string; rootPath?: string });
        break;

      case 'lsp_document_symbols':
        result = await lspDocumentSymbols(args as { file: string });
        break;

      case 'lsp_rename':
        result = await lspRename(args as { file: string; line: number; character: number; newName: string });
        break;

      case 'lsp_hover':
        result = await lspHover(args as { file: string; line: number; character: number });
        break;

      case 'lsp_diagnostics':
        result = await lspDiagnostics(args as { file: string; severityFilter?: 'error' | 'warning' | 'info' | 'hint' | 'all' });
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: result.formatted || JSON.stringify(result.data, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sisyphus LSP MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
