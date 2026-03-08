/**
 * MCP Manager - Manage MCP servers in claude_desktop_config.json
 *
 * Tools:
 * - mcp_add_server: Add MCP server (from preset or custom)
 * - mcp_remove_server: Remove MCP server
 * - mcp_list_servers: List registered MCP servers
 * - mcp_list_presets: List available presets
 */
interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}
interface ClaudeConfig {
    mcpServers?: Record<string, MCPServerConfig>;
}
interface PresetServer {
    name: string;
    description: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    requiredEnvVars?: string[];
    setupUrl?: string;
}
interface Preset {
    name: string;
    description: string;
    servers: string[];
}
declare const AVAILABLE_SERVERS: Record<string, PresetServer>;
declare const PRESETS: Record<string, Preset>;
export declare function mcpAddServer(args: {
    server?: string;
    preset?: string;
    tokens?: Record<string, string>;
    custom?: {
        name: string;
        command: string;
        args: string[];
        env?: Record<string, string>;
    };
}): Promise<{
    success: boolean;
    formatted?: string;
    error?: string;
    data?: unknown;
}>;
export declare function mcpRemoveServer(args: {
    server: string;
}): Promise<{
    success: boolean;
    formatted?: string;
    error?: string;
}>;
export declare function mcpListServers(): Promise<{
    success: boolean;
    formatted?: string;
    data?: unknown;
}>;
export declare function mcpListPresets(): Promise<{
    success: boolean;
    formatted?: string;
    data?: unknown;
}>;
export { AVAILABLE_SERVERS, PRESETS };
export type { PresetServer, Preset, MCPServerConfig, ClaudeConfig };
//# sourceMappingURL=index.d.ts.map