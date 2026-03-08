#!/usr/bin/env node
/**
 * Sisyphus Tools MCP Server
 *
 * Combined MCP server providing all Sisyphus tools in one server.
 * This is the recommended way to use Sisyphus tools - one server for everything.
 *
 * Tools included:
 * - LSP tools (goto definition, find references, etc.)
 * - AST-grep tools (pattern search, refactoring)
 * - Comment sanitizer
 * - Metrics
 *
 * Run with: node dist/servers/tools-server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import all tool handlers
import {
  lspGotoDefinition,
  lspFindReferences,
  lspWorkspaceSymbols,
  lspDocumentSymbols,
  lspRename,
  lspHover,
  lspDiagnostics,
} from '../tools/lsp/mcp-server.js';

import {
  astSearch,
  astReplace,
  astRefactor,
  astFindFunctions,
  astFindClasses,
  astFindImports,
  astValidatePattern,
  astListRules,
} from '../tools/ast-grep/mcp-server.js';

import {
  sanitizeComments,
  getCommentSanitizer,
} from '../tools/comment-sanitizer/index.js';

import { getSessionSummary, getAggregateMetrics } from '../metrics/index.js';

import {
  mcpAddServer,
  mcpRemoveServer,
  mcpListServers,
  mcpListPresets,
} from '../tools/mcp-manager/index.js';

// Create server instance
const server = new Server(
  {
    name: 'sisyphus-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools
const ALL_TOOLS = [
  // LSP Tools
  {
    name: 'lsp_goto_definition',
    description: 'Jump to symbol definition. Returns file path and line number.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: { type: 'string', description: 'Source file path' },
        line: { type: 'number', description: 'Line number (0-indexed)' },
        character: { type: 'number', description: 'Character position (0-indexed)' },
      },
      required: ['file', 'line', 'character'],
    },
  },
  {
    name: 'lsp_find_references',
    description: 'Find all references to a symbol.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: { type: 'string' },
        line: { type: 'number' },
        character: { type: 'number' },
        includeDeclaration: { type: 'boolean' },
      },
      required: ['file', 'line', 'character'],
    },
  },
  {
    name: 'lsp_workspace_symbols',
    description: 'Search symbols across workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Symbol name to search' },
        rootPath: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'lsp_document_symbols',
    description: 'Get document outline (all symbols in file).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: { type: 'string' },
      },
      required: ['file'],
    },
  },
  {
    name: 'lsp_rename',
    description: 'Rename symbol across workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: { type: 'string' },
        line: { type: 'number' },
        character: { type: 'number' },
        newName: { type: 'string' },
      },
      required: ['file', 'line', 'character', 'newName'],
    },
  },
  {
    name: 'lsp_hover',
    description: 'Get type info and documentation for symbol.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: { type: 'string' },
        line: { type: 'number' },
        character: { type: 'number' },
      },
      required: ['file', 'line', 'character'],
    },
  },
  {
    name: 'lsp_diagnostics',
    description: 'Get errors and warnings for a file.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: { type: 'string' },
        severityFilter: { type: 'string', enum: ['error', 'warning', 'info', 'hint', 'all'] },
      },
      required: ['file'],
    },
  },

  // AST Tools
  {
    name: 'ast_search',
    description: 'Search code by AST pattern. Use $VAR for nodes, $$$VAR for multiple.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string', description: 'AST pattern like "console.log($$$)"' },
        path: { type: 'string' },
        language: { type: 'string', enum: ['typescript', 'javascript', 'python', 'go', 'rust'] },
        maxResults: { type: 'number' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'ast_replace',
    description: 'Replace code patterns structurally. Dry-run by default.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string' },
        replacement: { type: 'string' },
        path: { type: 'string' },
        language: { type: 'string' },
        dryRun: { type: 'boolean', description: 'Preview only (default: true)' },
      },
      required: ['pattern', 'replacement'],
    },
  },
  {
    name: 'ast_refactor',
    description: 'Apply built-in refactoring rules.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ruleId: { type: 'string', description: 'Rule like "ts-var-to-const"' },
        path: { type: 'string' },
        dryRun: { type: 'boolean' },
      },
      required: ['ruleId'],
    },
  },
  {
    name: 'ast_find_functions',
    description: 'Find all function definitions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
        language: { type: 'string' },
      },
    },
  },
  {
    name: 'ast_find_classes',
    description: 'Find all class definitions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
        language: { type: 'string' },
      },
    },
  },
  {
    name: 'ast_find_imports',
    description: 'Find import statements.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
        moduleName: { type: 'string', description: 'Filter by module name' },
        language: { type: 'string' },
      },
    },
  },
  {
    name: 'ast_list_rules',
    description: 'List available refactoring rules.',
    inputSchema: { type: 'object' as const, properties: {} },
  },

  // Comment Sanitizer
  {
    name: 'sanitize_comments',
    description: 'Remove unnecessary AI-generated comments from code.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File or directory to sanitize' },
        dryRun: { type: 'boolean', description: 'Preview only (default: true)' },
        recursive: { type: 'boolean', description: 'Process subdirectories' },
      },
      required: ['path'],
    },
  },

  // Metrics
  {
    name: 'sisyphus_stats',
    description: 'Get session statistics and cost estimates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', enum: ['session', 'week', 'month', 'all'] },
      },
    },
  },

  // MCP Manager Tools
  {
    name: 'mcp_add_server',
    description: 'Add MCP server to claude_desktop_config.json. Use preset for quick setup or custom for manual config.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        server: {
          type: 'string',
          description: 'Server name (figma, github, context7, openapi, swagger, microsoft-docs, filesystem, software-planning)',
        },
        preset: {
          type: 'string',
          description: 'Preset name (frontend, backend, devops, planning, full)',
        },
        tokens: {
          type: 'object',
          description: 'API tokens (e.g., {"FIGMA_ACCESS_TOKEN": "xxx", "GITHUB_TOKEN": "xxx"})',
          additionalProperties: { type: 'string' },
        },
        custom: {
          type: 'object',
          description: 'Custom server config',
          properties: {
            name: { type: 'string' },
            command: { type: 'string' },
            args: { type: 'array', items: { type: 'string' } },
            env: { type: 'object', additionalProperties: { type: 'string' } },
          },
          required: ['name', 'command', 'args'],
        },
      },
    },
  },
  {
    name: 'mcp_remove_server',
    description: 'Remove MCP server from claude_desktop_config.json.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        server: { type: 'string', description: 'Server name to remove' },
      },
      required: ['server'],
    },
  },
  {
    name: 'mcp_list_servers',
    description: 'List all registered MCP servers in claude_desktop_config.json.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mcp_list_presets',
    description: 'List available MCP server presets and individual servers.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: ALL_TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: { success: boolean; formatted?: string; data?: unknown; error?: string };

    switch (name) {
      // LSP Tools
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

      // AST Tools
      case 'ast_search':
        result = await astSearch(args as { pattern: string; path?: string; language?: string; maxResults?: number });
        break;
      case 'ast_replace':
        result = await astReplace(args as { pattern: string; replacement: string; path?: string; language?: string; dryRun?: boolean });
        break;
      case 'ast_refactor':
        result = await astRefactor(args as { ruleId: string; path?: string; dryRun?: boolean });
        break;
      case 'ast_find_functions':
        result = await astFindFunctions(args as { path?: string; language?: string });
        break;
      case 'ast_find_classes':
        result = await astFindClasses(args as { path?: string; language?: string });
        break;
      case 'ast_find_imports':
        result = await astFindImports(args as { path?: string; moduleName?: string; language?: string });
        break;
      case 'ast_list_rules':
        result = await astListRules();
        break;

      // Comment Sanitizer
      case 'sanitize_comments': {
        const sanitizeArgs = args as { path: string; dryRun?: boolean; recursive?: boolean };
        const sanitizeResult = await sanitizeComments(sanitizeArgs.path, {
          dryRun: sanitizeArgs.dryRun !== false,
          recursive: sanitizeArgs.recursive !== false,
        });

        // Format result
        if ('file' in sanitizeResult) {
          // Single file result
          result = {
            success: true,
            formatted: `File: ${sanitizeResult.file}\nRemoved: ${sanitizeResult.removedComments} comments\nPreserved: ${sanitizeResult.preservedComments} comments`,
            data: sanitizeResult,
          };
        } else {
          // Batch result
          result = {
            success: true,
            formatted: `Processed: ${sanitizeResult.filesProcessed} files\nModified: ${sanitizeResult.filesModified} files\nComments removed: ${sanitizeResult.totalCommentsRemoved}`,
            data: sanitizeResult,
          };
        }
        break;
      }

      // Metrics
      case 'sisyphus_stats': {
        const statsArgs = args as { period?: string } || {};
        const period = statsArgs.period || 'session';

        if (period === 'session') {
          result = {
            success: true,
            formatted: getSessionSummary(),
          };
        } else {
          const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
          const metrics = getAggregateMetrics(days);
          result = {
            success: true,
            formatted: `Aggregate Metrics (${days} days)\n` +
              `Sessions: ${metrics.totalSessions}\n` +
              `Total Calls: ${metrics.totalCalls}\n` +
              `Tokens: ${metrics.totalInputTokens} in / ${metrics.totalOutputTokens} out\n` +
              `Est. Cost: $${metrics.totalEstimatedCost.toFixed(4)}`,
            data: metrics,
          };
        }
        break;
      }

      // MCP Manager Tools
      case 'mcp_add_server':
        result = await mcpAddServer(args as {
          server?: string;
          preset?: string;
          tokens?: Record<string, string>;
          custom?: { name: string; command: string; args: string[]; env?: Record<string, string> };
        });
        break;
      case 'mcp_remove_server':
        result = await mcpRemoveServer(args as { server: string });
        break;
      case 'mcp_list_servers':
        result = await mcpListServers();
        break;
      case 'mcp_list_presets':
        result = await mcpListPresets();
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
  console.error('Sisyphus Tools MCP Server running on stdio');
  console.error('Available: LSP tools, AST-grep tools, Comment sanitizer, Metrics');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
