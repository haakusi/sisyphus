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
export declare const BUNDLED_MCP_SERVERS: MCPServerConfig[];
export declare function generateMCPConfig(enabledServers?: string[], pluginDir?: string): Record<string, unknown>;
export declare function getMCPServer(name: string): MCPServerConfig | undefined;
export declare function getMCPServersByCategory(category: MCPServerConfig['category']): MCPServerConfig[];
export declare function getEnabledMCPServers(): MCPServerConfig[];
//# sourceMappingURL=bundled-servers.d.ts.map