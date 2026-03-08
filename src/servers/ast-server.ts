#!/usr/bin/env node
/**
 * Sisyphus AST-Grep MCP Server
 *
 * Standalone MCP server that provides AST-based code search and transformation.
 * Requires: npm install -g @ast-grep/cli (or sg command available)
 *
 * Run with: node dist/servers/ast-server.js
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
  astSearch,
  astReplace,
  astRefactor,
  astFindFunctions,
  astFindClasses,
  astFindImports,
  astValidatePattern,
  astListRules,
} from '../tools/ast-grep/mcp-server.js';

// Create server instance
const server = new Server(
  {
    name: 'sisyphus-ast',
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
        name: 'ast_search',
        description: 'Search for code patterns using AST matching. More precise than regex. Use $VAR for single nodes, $$$VAR for multiple.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            pattern: { type: 'string', description: 'AST pattern (e.g., "console.log($$$)")' },
            path: { type: 'string', description: 'Directory to search' },
            language: {
              type: 'string',
              enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
              description: 'Language',
            },
            maxResults: { type: 'number', description: 'Max results (default: 50)' },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'ast_replace',
        description: 'Replace code patterns. SAFE: Uses dry-run by default. Set dryRun: false to apply.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            pattern: { type: 'string', description: 'Pattern to find' },
            replacement: { type: 'string', description: 'Replacement (can use $VAR from pattern)' },
            path: { type: 'string', description: 'Directory to search' },
            language: { type: 'string', description: 'Language' },
            dryRun: { type: 'boolean', description: 'If true (default), only preview changes' },
          },
          required: ['pattern', 'replacement'],
        },
      },
      {
        name: 'ast_refactor',
        description: 'Apply built-in refactoring rules (e.g., ts-var-to-const). Use ast_list_rules to see available.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            ruleId: { type: 'string', description: 'Rule ID (e.g., "ts-var-to-const")' },
            path: { type: 'string', description: 'Directory to apply' },
            dryRun: { type: 'boolean', description: 'If true (default), only preview' },
          },
          required: ['ruleId'],
        },
      },
      {
        name: 'ast_find_functions',
        description: 'Find all function definitions in the codebase.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            path: { type: 'string', description: 'Directory to search' },
            language: { type: 'string', description: 'Language' },
          },
        },
      },
      {
        name: 'ast_find_classes',
        description: 'Find all class definitions in the codebase.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            path: { type: 'string', description: 'Directory to search' },
            language: { type: 'string', description: 'Language' },
          },
        },
      },
      {
        name: 'ast_find_imports',
        description: 'Find import statements, optionally filter by module name.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            path: { type: 'string', description: 'Directory to search' },
            moduleName: { type: 'string', description: 'Filter by module (e.g., "react")' },
            language: { type: 'string', description: 'Language' },
          },
        },
      },
      {
        name: 'ast_validate_pattern',
        description: 'Check if a pattern is syntactically correct for ast-grep.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            pattern: { type: 'string', description: 'Pattern to validate' },
            language: { type: 'string', description: 'Language for the pattern' },
          },
          required: ['pattern', 'language'],
        },
      },
      {
        name: 'ast_list_rules',
        description: 'List all available built-in refactoring rules.',
        inputSchema: {
          type: 'object' as const,
          properties: {},
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
      case 'ast_search':
        result = await astSearch(args as {
          pattern: string;
          path?: string;
          language?: string;
          maxResults?: number;
        });
        break;

      case 'ast_replace':
        result = await astReplace(args as {
          pattern: string;
          replacement: string;
          path?: string;
          language?: string;
          dryRun?: boolean;
        });
        break;

      case 'ast_refactor':
        result = await astRefactor(args as {
          ruleId: string;
          path?: string;
          dryRun?: boolean;
        });
        break;

      case 'ast_find_functions':
        result = await astFindFunctions(args as { path?: string; language?: string });
        break;

      case 'ast_find_classes':
        result = await astFindClasses(args as { path?: string; language?: string });
        break;

      case 'ast_find_imports':
        result = await astFindImports(args as {
          path?: string;
          moduleName?: string;
          language?: string;
        });
        break;

      case 'ast_validate_pattern':
        result = await astValidatePattern(args as { pattern: string; language: string });
        break;

      case 'ast_list_rules':
        result = await astListRules();
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
  console.error('Sisyphus AST-Grep MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
