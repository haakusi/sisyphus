/**
 * Bundled MCP Servers
 *
 * Pre-configured MCP servers that come with the plugin.
 * Inspired by oh-my-opencode's bundled MCPs.
 */

export interface MCPServerConfig {
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  category: 'search' | 'analysis' | 'integration' | 'utility';
}

// Bundled MCP server configurations
export const BUNDLED_MCP_SERVERS: MCPServerConfig[] = [
  // Code Search & Analysis
  {
    name: 'sisyphus-grep',
    description: 'Enhanced grep with semantic search capabilities',
    command: 'node',
    args: ['${pluginDir}/dist/mcp/grep-server.js'],
    enabled: true,
    category: 'search',
  },
  {
    name: 'sisyphus-ast',
    description: 'AST-based code analysis and transformation',
    command: 'node',
    args: ['${pluginDir}/dist/mcp/ast-server.js'],
    enabled: true,
    category: 'analysis',
  },

  // Documentation & Context
  {
    name: 'sisyphus-docs',
    description: 'Documentation search and context retrieval',
    command: 'node',
    args: ['${pluginDir}/dist/mcp/docs-server.js'],
    enabled: true,
    category: 'search',
  },

  // Git Integration
  {
    name: 'sisyphus-git',
    description: 'Enhanced git operations and history analysis',
    command: 'node',
    args: ['${pluginDir}/dist/mcp/git-server.js'],
    enabled: true,
    category: 'integration',
  },

  // Metrics & Monitoring
  {
    name: 'sisyphus-metrics',
    description: 'Session metrics and cost tracking',
    command: 'node',
    args: ['${pluginDir}/dist/mcp/metrics-server.js'],
    enabled: true,
    category: 'utility',
  },
];

// Generate .mcp.json content
export function generateMCPConfig(
  enabledServers?: string[],
  pluginDir?: string
): Record<string, unknown> {
  const servers: Record<string, unknown> = {};
  const dir = pluginDir || '${pluginDir}';

  for (const server of BUNDLED_MCP_SERVERS) {
    const isEnabled = enabledServers
      ? enabledServers.includes(server.name)
      : server.enabled;

    servers[server.name] = {
      command: server.command,
      args: server.args.map(a => a.replace('${pluginDir}', dir)),
      env: server.env,
      disabled: !isEnabled,
    };
  }

  return {
    mcpServers: servers,
  };
}

// Get server by name
export function getMCPServer(name: string): MCPServerConfig | undefined {
  return BUNDLED_MCP_SERVERS.find(s => s.name === name);
}

// Get servers by category
export function getMCPServersByCategory(category: MCPServerConfig['category']): MCPServerConfig[] {
  return BUNDLED_MCP_SERVERS.filter(s => s.category === category);
}

// Get all enabled servers
export function getEnabledMCPServers(): MCPServerConfig[] {
  return BUNDLED_MCP_SERVERS.filter(s => s.enabled);
}

// MCPServerConfig is already exported at declaration
