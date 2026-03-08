/**
 * MCP Manager - Manage MCP servers in claude_desktop_config.json
 *
 * Tools:
 * - mcp_add_server: Add MCP server (from preset or custom)
 * - mcp_remove_server: Remove MCP server
 * - mcp_list_servers: List registered MCP servers
 * - mcp_list_presets: List available presets
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// Preset definitions
const AVAILABLE_SERVERS = {
    figma: {
        name: 'Figma MCP Server',
        description: 'Figma 디자인 파일 접근 및 React 컴포넌트 변환',
        command: 'npx',
        args: ['-y', '@anthropic/mcp-server-figma'],
        env: { FIGMA_ACCESS_TOKEN: '${FIGMA_ACCESS_TOKEN}' },
        requiredEnvVars: ['FIGMA_ACCESS_TOKEN'],
        setupUrl: 'https://www.figma.com/developers/api#access-tokens',
    },
    'figma-context': {
        name: 'Figma Context MCP',
        description: 'Figma 레이아웃 컨텍스트 추출',
        command: 'npx',
        args: ['-y', 'figma-context-mcp'],
        env: { FIGMA_PERSONAL_ACCESS_TOKEN: '${FIGMA_ACCESS_TOKEN}' },
        requiredEnvVars: ['FIGMA_ACCESS_TOKEN'],
    },
    github: {
        name: 'GitHub MCP Server',
        description: 'GitHub 리포/이슈/PR 관리',
        command: 'npx',
        args: ['-y', '@github/mcp-server'],
        env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        requiredEnvVars: ['GITHUB_TOKEN'],
        setupUrl: 'https://github.com/settings/tokens',
    },
    'github-project-manager': {
        name: 'GitHub Project Manager',
        description: 'GitHub Projects 자동화',
        command: 'npx',
        args: ['-y', 'mcp-github-project-manager'],
        env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        requiredEnvVars: ['GITHUB_TOKEN'],
    },
    context7: {
        name: 'Context7 (Upstash)',
        description: '최신 라이브러리 문서 자동 가져오기',
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp'],
        env: {},
    },
    openapi: {
        name: 'OpenAPI MCP Server',
        description: 'OpenAPI/Swagger 스펙 기반 도구 생성',
        command: 'npx',
        args: ['-y', '@aws/mcp-server-openapi'],
        env: {},
    },
    swagger: {
        name: 'Swagger MCP',
        description: 'Swagger 문서 래핑',
        command: 'npx',
        args: ['-y', 'swagger-mcp'],
        env: {},
    },
    'microsoft-docs': {
        name: 'Microsoft Docs MCP',
        description: 'Microsoft 공식 문서 (Azure, .NET, TypeScript)',
        command: 'npx',
        args: ['-y', '@microsoft/mcp-docs-server'],
        env: {},
    },
    filesystem: {
        name: 'Filesystem MCP Server',
        description: '파일 시스템 접근',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
        env: {},
    },
    'software-planning': {
        name: 'Software Planning MCP',
        description: '소프트웨어 계획 및 태스크 분해',
        command: 'npx',
        args: ['-y', 'software-planning-mcp'],
        env: {},
    },
};
const PRESETS = {
    frontend: {
        name: 'Frontend',
        description: '프론트엔드 개발팀용 (Figma, Context7, GitHub)',
        servers: ['figma', 'figma-context', 'context7', 'github', 'filesystem'],
    },
    backend: {
        name: 'Backend',
        description: '백엔드 개발팀용 (OpenAPI, Swagger, Context7)',
        servers: ['openapi', 'swagger', 'context7', 'github', 'filesystem', 'microsoft-docs'],
    },
    devops: {
        name: 'DevOps',
        description: 'DevOps팀용 (GitHub, Filesystem)',
        servers: ['github', 'github-project-manager', 'filesystem', 'microsoft-docs'],
    },
    planning: {
        name: 'Planning',
        description: '기획/설계팀용 (GitHub Projects, Software Planning)',
        servers: ['github', 'github-project-manager', 'software-planning', 'context7'],
    },
    full: {
        name: 'Full',
        description: '모든 MCP 서버 활성화',
        servers: Object.keys(AVAILABLE_SERVERS),
    },
};
// Config file path
function getConfigPath() {
    return path.join(os.homedir(), '.claude', 'claude_desktop_config.json');
}
// Load config
function loadConfig() {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    return { mcpServers: {} };
}
// Save config
function saveConfig(config) {
    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    // Backup existing config
    if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, configPath + '.backup');
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
// Replace env var placeholders with actual values or provided tokens
function resolveEnvVars(env, tokens) {
    const resolved = {};
    for (const [key, value] of Object.entries(env)) {
        // Check if it's a placeholder like ${VAR_NAME}
        const match = value.match(/\$\{(\w+)\}/);
        if (match) {
            const varName = match[1];
            // First check provided tokens, then environment
            const actualValue = tokens?.[varName] || process.env[varName];
            if (actualValue) {
                resolved[key] = actualValue;
            }
            else {
                // Keep placeholder if no value found
                resolved[key] = value;
            }
        }
        else {
            resolved[key] = value;
        }
    }
    return resolved;
}
// Tool: Add MCP Server
export async function mcpAddServer(args) {
    try {
        const config = loadConfig();
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        const addedServers = [];
        const skippedServers = [];
        const warnings = [];
        // Add from preset
        if (args.preset) {
            const preset = PRESETS[args.preset];
            if (!preset) {
                return {
                    success: false,
                    error: `Unknown preset: ${args.preset}. Available: ${Object.keys(PRESETS).join(', ')}`,
                };
            }
            for (const serverName of preset.servers) {
                const serverDef = AVAILABLE_SERVERS[serverName];
                if (!serverDef)
                    continue;
                // Check if already exists
                if (config.mcpServers[serverName]) {
                    skippedServers.push(serverName);
                    continue;
                }
                // Resolve env vars
                const resolvedEnv = serverDef.env
                    ? resolveEnvVars(serverDef.env, args.tokens)
                    : {};
                // Check for missing required env vars
                if (serverDef.requiredEnvVars) {
                    for (const varName of serverDef.requiredEnvVars) {
                        const hasValue = args.tokens?.[varName] || process.env[varName];
                        if (!hasValue) {
                            warnings.push(`${serverName}: ${varName} not set (${serverDef.setupUrl || 'set env var'})`);
                        }
                    }
                }
                config.mcpServers[serverName] = {
                    command: serverDef.command,
                    args: serverDef.args,
                    ...(Object.keys(resolvedEnv).length > 0 && { env: resolvedEnv }),
                };
                addedServers.push(serverName);
            }
        }
        // Add single server
        if (args.server) {
            const serverDef = AVAILABLE_SERVERS[args.server];
            if (!serverDef) {
                return {
                    success: false,
                    error: `Unknown server: ${args.server}. Available: ${Object.keys(AVAILABLE_SERVERS).join(', ')}`,
                };
            }
            if (config.mcpServers[args.server]) {
                skippedServers.push(args.server);
            }
            else {
                const resolvedEnv = serverDef.env
                    ? resolveEnvVars(serverDef.env, args.tokens)
                    : {};
                // Check for missing required env vars
                if (serverDef.requiredEnvVars) {
                    for (const varName of serverDef.requiredEnvVars) {
                        const hasValue = args.tokens?.[varName] || process.env[varName];
                        if (!hasValue) {
                            warnings.push(`${args.server}: ${varName} not set (${serverDef.setupUrl || 'set env var'})`);
                        }
                    }
                }
                config.mcpServers[args.server] = {
                    command: serverDef.command,
                    args: serverDef.args,
                    ...(Object.keys(resolvedEnv).length > 0 && { env: resolvedEnv }),
                };
                addedServers.push(args.server);
            }
        }
        // Add custom server
        if (args.custom) {
            const { name, command, args: serverArgs, env } = args.custom;
            if (config.mcpServers[name]) {
                skippedServers.push(name);
            }
            else {
                config.mcpServers[name] = {
                    command,
                    args: serverArgs,
                    ...(env && Object.keys(env).length > 0 && { env }),
                };
                addedServers.push(name);
            }
        }
        // Save config
        if (addedServers.length > 0) {
            saveConfig(config);
        }
        // Format output
        let output = '';
        if (addedServers.length > 0) {
            output += `✅ Added: ${addedServers.join(', ')}\n`;
        }
        if (skippedServers.length > 0) {
            output += `⏭️ Skipped (already exists): ${skippedServers.join(', ')}\n`;
        }
        if (warnings.length > 0) {
            output += `\n⚠️ Warnings:\n${warnings.map(w => `  - ${w}`).join('\n')}\n`;
        }
        if (addedServers.length > 0) {
            output += `\n🔄 Restart Claude Code to apply changes`;
        }
        return {
            success: true,
            formatted: output.trim() || 'No changes made',
            data: { addedServers, skippedServers, warnings, configPath: getConfigPath() },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// Tool: Remove MCP Server
export async function mcpRemoveServer(args) {
    try {
        const config = loadConfig();
        if (!config.mcpServers || !config.mcpServers[args.server]) {
            return {
                success: false,
                error: `Server not found: ${args.server}`,
            };
        }
        delete config.mcpServers[args.server];
        saveConfig(config);
        return {
            success: true,
            formatted: `✅ Removed: ${args.server}\n🔄 Restart Claude Code to apply changes`,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// Tool: List MCP Servers
export async function mcpListServers() {
    try {
        const config = loadConfig();
        const servers = config.mcpServers || {};
        const serverNames = Object.keys(servers);
        if (serverNames.length === 0) {
            return {
                success: true,
                formatted: 'No MCP servers registered.',
                data: { servers: [], configPath: getConfigPath() },
            };
        }
        let output = `📦 Registered MCP Servers (${serverNames.length}):\n\n`;
        for (const name of serverNames) {
            const server = servers[name];
            const desc = AVAILABLE_SERVERS[name]?.description || 'Custom server';
            output += `• ${name}\n`;
            output += `  ${desc}\n`;
            output += `  Command: ${server.command} ${server.args.join(' ')}\n`;
            if (server.env && Object.keys(server.env).length > 0) {
                const envKeys = Object.keys(server.env);
                output += `  Env: ${envKeys.join(', ')}\n`;
            }
            output += '\n';
        }
        output += `Config: ${getConfigPath()}`;
        return {
            success: true,
            formatted: output,
            data: { servers, configPath: getConfigPath() },
        };
    }
    catch (error) {
        return {
            success: false,
            formatted: `Error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
// Tool: List Presets
export async function mcpListPresets() {
    let output = '📋 Available Presets:\n\n';
    for (const [key, preset] of Object.entries(PRESETS)) {
        output += `• ${key} - ${preset.description}\n`;
        output += `  Servers: ${preset.servers.join(', ')}\n\n`;
    }
    output += '📦 Available Servers:\n\n';
    for (const [key, server] of Object.entries(AVAILABLE_SERVERS)) {
        output += `• ${key} - ${server.description}\n`;
        if (server.requiredEnvVars && server.requiredEnvVars.length > 0) {
            output += `  Required: ${server.requiredEnvVars.join(', ')}\n`;
        }
    }
    return {
        success: true,
        formatted: output,
        data: { presets: PRESETS, servers: AVAILABLE_SERVERS },
    };
}
// Export available servers and presets for external use
export { AVAILABLE_SERVERS, PRESETS };
//# sourceMappingURL=index.js.map