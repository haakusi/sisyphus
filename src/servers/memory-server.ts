#!/usr/bin/env node
/**
 * Sisyphus Memory MCP Server
 *
 * Dedicated MCP server for persistent memory and context-pack tools.
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
  memoryAppend,
  memorySearch,
  memoryCompact,
  buildContextPackTool,
} from '../tools/omnibus/index.js';

const server = new Server(
  {
    name: 'sisyphus-memory',
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
        name: 'memory_append',
        description: 'Append persistent memory record (decision/execution/pattern/failure).',
        inputSchema: {
          type: 'object' as const,
          properties: {
            projectRoot: { type: 'string' },
            kind: { type: 'string' },
            content: { type: 'string' },
            scope: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' },
            sourceRef: { type: 'string' },
            sessionId: { type: 'string' },
          },
          required: ['kind', 'content'],
        },
      },
      {
        name: 'memory_search',
        description: 'Search persistent memory records.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            projectRoot: { type: 'string' },
            query: { type: 'string' },
            limit: { type: 'number' },
            kinds: { type: 'array', items: { type: 'string' } },
            scopes: { type: 'array', items: { type: 'string' } },
            minConfidence: { type: 'number' },
          },
        },
      },
      {
        name: 'memory_compact',
        description: 'Store context compaction snapshot and/or generated context pack.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            projectRoot: { type: 'string' },
            summary: { type: 'string' },
            taskDescription: { type: 'string' },
            scope: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            sessionId: { type: 'string' },
            sourceRef: { type: 'string' },
            includeContextPack: { type: 'boolean' },
          },
        },
      },
      {
        name: 'context_pack_build',
        description: 'Build context pack (global/sprint/execution layers + memory slice).',
        inputSchema: {
          type: 'object' as const,
          properties: {
            projectRoot: { type: 'string' },
            taskDescription: { type: 'string' },
            workingFiles: { type: 'array', items: { type: 'string' } },
            tokenBudget: { type: 'number' },
            maxLayerEntries: { type: 'number' },
            memoryLookback: { type: 'number' },
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
      case 'memory_append':
        result = await memoryAppend(args as {
          projectRoot?: string;
          kind: string;
          content: string;
          scope?: string;
          tags?: string[];
          confidence?: number;
          sourceRef?: string;
          sessionId?: string;
        });
        break;
      case 'memory_search':
        result = await memorySearch(args as {
          projectRoot?: string;
          query?: string;
          limit?: number;
          kinds?: string[];
          scopes?: string[];
          minConfidence?: number;
        });
        break;
      case 'memory_compact':
        result = await memoryCompact(args as {
          projectRoot?: string;
          summary?: string;
          taskDescription?: string;
          scope?: string;
          tags?: string[];
          sessionId?: string;
          sourceRef?: string;
          includeContextPack?: boolean;
        });
        break;
      case 'context_pack_build':
        result = await buildContextPackTool(args as {
          projectRoot?: string;
          taskDescription?: string;
          workingFiles?: string[];
          tokenBudget?: number;
          maxLayerEntries?: number;
          memoryLookback?: number;
        });
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
  console.error('Sisyphus Memory MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
