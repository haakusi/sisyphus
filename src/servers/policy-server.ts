#!/usr/bin/env node
/**
 * Sisyphus Policy MCP Server
 *
 * Dedicated MCP server for active policy rule resolution.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { policyActiveRules } from '../tools/omnibus/index.js';

const server = new Server(
  {
    name: 'sisyphus-policy',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'policy_active_rules',
        description: 'Resolve active MUST/SHOULD rules from project guidance docs.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            projectRoot: { type: 'string' },
            limit: { type: 'number' },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: { success: boolean; formatted?: string; data?: unknown; error?: string };

    switch (name) {
      case 'policy_active_rules':
        result = await policyActiveRules(args as { projectRoot?: string; limit?: number });
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sisyphus Policy MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
